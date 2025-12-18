import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth, currentUser } from "@clerk/nextjs/server";
import { calculateProperties, runVirtualDocking, assessPatientSafety, calculateEfficacy, predictADMET } from "@/lib/bioinformatics";

const SCAFFOLD_LIBRARY: any = {
  "Oncology": [
    "COc1cc2ncnc(Nc3ccc(F)c(Cl)c3)c2cc1OCCCN4CCOCC4", 
    "CC1=C(C(=O)NC2=C1C=NC=C2)C3=C(C=C(C=C3)Cl)F",
    "CN(C)CC1=CC=C(C=C1)NC(=O)C2=CC=C(C=C2)Cl"
  ],
  "Infectious": [
    "CC(C)C1=NC(=CS1)CN(C)C(=O)NC(C(C)C)C(=O)N",
    "FC1=CC=C(C=C1)C(=O)NC2=CC=C(C=C2)CN3CCN(CC3)C"
  ],
  "Neurology": [
    "C1=CC=C(C=C1)C2=C(C(=O)OC3=CC=CC=C32)O",
    "CCN(CC)CCCC(C)NC1=C2C=CC(=CC2=NC=C1)Cl"
  ],
  "Cardiology": [
    "CCOC(=O)C1=C(C)NC(C)=C(C1c2ccccc2[N+](=O)[O-])C(=O)OC",
    "CC(C)NCC(O)COc1ccc(CC(N)=O)cc1"
  ]
};

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    const user = await currentUser();
    if (!userId || !user) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json();
    const { pdbId, projectName, patientData } = body;

    let proteinName = "Unknown Target";
    try {
      const res = await fetch(`https://data.rcsb.org/rest/v1/core/entry/${pdbId}`);
      if (res.ok) { const data = await res.json(); proteinName = data.struct.title; }
    } catch(e) {}

    const dbUser = await db.user.upsert({
      where: { externalId: userId },
      update: {},
      create: { externalId: userId, email: user.emailAddresses[0].emailAddress },
    });

    // Create Patient Profile
    const patient = await db.patientProfile.create({
      data: {
        age: parseInt(patientData.age),
        gender: patientData.gender,
        weight: patientData.weight,
        chronicCondition: patientData.chronicCondition,
        liverFunction: patientData.liver,
        kidneyFunction: patientData.kidney,
        geneticMutation: patientData.mutation
      }
    });

    // Create Project
    const project = await db.project.create({
      data: {
        name: projectName,
        pdbId: pdbId,
        targetName: proteinName,
        userId: dbUser.id,
        patientId: patient.id
      }
    });

    const category = patientData.category || "Oncology";
    const selectedScaffolds = SCAFFOLD_LIBRARY[category] || SCAFFOLD_LIBRARY["Oncology"];

    const candidates = [];
    for(let i=0; i<8; i++) { 
      const baseScaffold = selectedScaffolds[i % selectedScaffolds.length];
      const smiles = baseScaffold;

      const props = calculateProperties(smiles);
      const admet = predictADMET(props);
      const docking = runVirtualDocking(smiles, pdbId);
      const toxicity = assessPatientSafety(props, admet, patientData);
      const efficacy = calculateEfficacy(docking.affinity, admet, toxicity);

      const qed = (toxicity === "Clinically Safe") ? 0.95 : 0.45;

      // Fix: Map 'mw' to 'molecularWeight' strictly for Prisma
      candidates.push({
        smiles,
        molecularWeight: props.mw, // This fixes the TS error
        logP: props.logP,
        hbd: props.hbd,
        hba: props.hba,
        tpsa: props.tpsa,
        absorption: admet.absorption,
        clearance: admet.clearance,
        qed,
        bindingAffinity: docking.affinity,
        toxicityRisk: toxicity,
        projectId: project.id
      });
    }

    // Save to DB
    await db.molecule.createMany({ 
      data: candidates
    });

    // Add UI-only properties (like ID and Efficacy) for the response
    const responseMolecules = candidates.map((c, index) => ({
        ...c,
        id: `RX-${Date.now()}-${index}`,
        efficacy: calculateEfficacy(c.bindingAffinity, { absorption: c.absorption } as any, c.toxicityRisk),
        rmsd: 1.2 // Mock RMSD for display
    })).sort((a, b) => b.efficacy - a.efficacy);

    return NextResponse.json({ success: true, protein: proteinName, molecules: responseMolecules });

  } catch (error) {
    console.error(error);
    return new NextResponse("Server Error", { status: 500 });
  }
}
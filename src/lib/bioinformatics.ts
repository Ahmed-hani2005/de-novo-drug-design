// src/lib/bioinformatics.ts - Expert Edition

export interface BioProperties {
  mw: number;
  logP: number;
  hbd: number;
  hba: number;
  tpsa: number;
  rotatable: number;
}

export interface ADMETProfile {
  absorption: number;
  bbb: string;
  cyp450: string;
  clearance: number;
  cardioToxicity: string; // New: hERG inhibition risk
}

// 1. حساب الخصائص
export function calculateProperties(smiles: string): BioProperties {
  const heavyAtoms = (smiles.match(/[C,N,O,S,F,Cl,Br,I]/g) || []).length;
  return {
    mw: parseFloat(((heavyAtoms * 13.5) + (Math.random() * 15)).toFixed(2)),
    logP: parseFloat((-1.0 + (heavyAtoms * 0.15) + (Math.random())).toFixed(2)),
    hbd: (smiles.match(/N|O/g) || []).length > 3 ? Math.floor(Math.random() * 3) : 1,
    hba: (smiles.match(/N|O|S|F/g) || []).length,
    tpsa: parseFloat((heavyAtoms * 5.2).toFixed(1)),
    rotatable: Math.floor(heavyAtoms / 3)
  };
}

// 2. تحليل ADMET المتقدم (يشمل القلب والسكري)
export function predictADMET(props: BioProperties): ADMETProfile {
  return {
    absorption: parseFloat((85 - (props.tpsa * 0.15)).toFixed(1)),
    bbb: (props.logP > 2 && props.mw < 450) ? "Permeable" : "Low Permeability",
    cyp450: Math.random() > 0.7 ? "Inhibitor" : "Non-Inhibitor",
    clearance: parseFloat((3 + Math.random() * 8).toFixed(1)),
    // High LogP often correlates with hERG inhibition (Heart Risk)
    cardioToxicity: props.logP > 4.0 ? "High Risk" : "Low Risk" 
  };
}

// 3. محاكاة الـ Docking
export function runVirtualDocking(smiles: string, pdbId: string): { affinity: number; rmsd: number } {
  let score = -6.5; 
  if (smiles.includes("Cl") || smiles.includes("F")) score -= 1.0; 
  const affinity = parseFloat((score - (Math.random() * 3)).toFixed(2));
  const rmsd = parseFloat((0.5 + Math.random()).toFixed(2)); 
  return { affinity, rmsd };
}

// 4. تقييم الأمان المعقد (Complex Safety Logic)
export function assessPatientSafety(
  props: BioProperties, 
  admet: ADMETProfile, 
  patientData: any
): string {
  const age = parseInt(patientData.age);
  const condition = patientData.chronicCondition;

  // 1. قاعدة كبار السن (Geriatric Rule)
  if (age > 65) {
    if (admet.clearance < 4.0) return "Unsafe (Low Clearance in Elderly)";
    if (admet.bbb === "Permeable" && patientData.category !== "Neurology") return "Risk of Confusion (CNS Active)";
  }

  // 2. أمراض القلب (Cardiac Rule)
  if (condition === "Heart Disease" || condition === "Hypertension") {
    if (admet.cardioToxicity === "High Risk") return "Contraindicated (Cardiotoxic)";
    if (props.logP > 4.5) return "Fluid Retention Risk";
  }

  // 3. السكري (Diabetes Rule)
  if (condition === "Diabetes") {
    if (props.mw > 500) return "Metabolic Burden Risk";
  }

  // 4. الكبد والكلى
  if (patientData.liver === "Impaired" && admet.cyp450 === "Inhibitor") return "Hepatotoxicity Risk";
  if (patientData.kidney === "Impaired" && props.mw > 450) return "Renal Load Risk";

  return "Clinically Safe";
}

// 5. Efficacy Score
export function calculateEfficacy(affinity: number, profile: ADMETProfile, safety: string): number {
  const normAffinity = Math.min(Math.abs(affinity) / 12, 1);
  const safetyFactor = safety === "Clinically Safe" ? 1.0 : 0.5;
  return parseFloat(((normAffinity * 0.6 + (profile.absorption/100) * 0.4) * safetyFactor * 100).toFixed(1));
}
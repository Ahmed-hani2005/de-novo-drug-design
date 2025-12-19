// src/lib/science_core.ts
// Scientific Core: Advanced Cheminformatics & Clinical Logic

export interface BioMetrics {
  mw: number; logP: number; hbd: number; hba: number; tpsa: number; rotatable: number;
}

export interface ClinicalContext {
  age: number; liver: string; kidney: string; condition: string; tumorType: string;
}

// 1. حساب الخصائص الكيميائية (Simulation of RDKit logic)
export function analyzeStructure(smiles: string): BioMetrics {
  // تقدير الخصائص بناءً على الذرات والمجموعات الوظيفية
  const heavyAtoms = (smiles.match(/[C,N,O,S,F,Cl,Br,I]/g) || []).length;
  const nitrogens = (smiles.match(/N/g) || []).length;
  const oxygens = (smiles.match(/O/g) || []).length;
  const halogens = (smiles.match(/[F,Cl,Br]/g) || []).length;
  const rings = (smiles.match(/[0-9]/g) || []).length / 2;

  // معادلات تقريبية للخصائص الفيزيائية
  const mw = (heavyAtoms * 13.5) + (nitrogens * 1.5) + (oxygens * 2) + (halogens * 18);
  const logP = 0.5 + (heavyAtoms * 0.1) + (halogens * 0.6) - (nitrogens * 0.3) - (oxygens * 0.2);
  const tpsa = (nitrogens * 12.0) + (oxygens * 17.5);

  return {
    mw: parseFloat(mw.toFixed(2)),
    logP: parseFloat(logP.toFixed(2)),
    hbd: nitrogens > 2 ? Math.floor(nitrogens / 2) : 1,
    hba: nitrogens + oxygens,
    tpsa: parseFloat(tpsa.toFixed(2)),
    rotatable: Math.floor(heavyAtoms / 4)
  };
}

// 2. مصفوفة الأمان والسمية (Toxicity Matrix)
export function predictSafetyProfile(props: BioMetrics, ctx: ClinicalContext) {
  let warnings = [];
  let score = 100;

  // A. hERG Toxicity (Cardio Safety)
  // المركبات الدهنية (High LogP) والمشحونة غالباً بتسبب مشاكل قلبية
  let hERGRisk = "Low";
  if (props.logP > 4.0 && props.mw > 450) {
    hERGRisk = "Moderate";
    score -= 15;
    if (ctx.condition.includes("Heart")) {
      hERGRisk = "High";
      warnings.push("Potential hERG Channel Blockage (Cardio Risk)");
      score -= 30;
    }
  }

  // B. Hepatotoxicity (Liver Safety)
  let liverRisk = "Low";
  let cypStatus = "Clean";
  if (props.logP > 3.5) {
    cypStatus = "Inhibitor"; // CYP3A4 Inhibition likely
    if (ctx.liver === "Impaired") {
      liverRisk = "High";
      warnings.push("High Metabolic Load on Impaired Liver");
      score -= 25;
    } else {
      liverRisk = "Moderate";
    }
  }

  // C. Renal Clearance (Kidney)
  let clearance = 10.0;
  if (ctx.kidney === "Impaired" || ctx.age > 70) {
    clearance = 4.5;
    if (props.tpsa < 60) {
        warnings.push("Poor Solubility Risks Accumulation in Kidney");
        score -= 20;
    }
  }

  return {
    hERGRisk, cypStatus, liverRisk, clearance,
    safetyScore: Math.max(0, score),
    warnings
  };
}

// 3. خوارزمية الاختيار الأمثل (Pareto Optimization)
export function calculateParetoEfficacy(affinity: number, safetyScore: number, qed: number): number {
  // المعادلة الذهبية: 40% قوة ارتباط + 40% أمان + 20% خصائص دوائية
  const normAffinity = Math.min(Math.abs(affinity) / 11, 1) * 100;
  const efficacy = (normAffinity * 0.4) + (safetyScore * 0.4) + (qed * 100 * 0.2);
  return parseFloat(efficacy.toFixed(1));
}

// 4. توليد الشرح العلمي (Explainable AI - XAI)
export function generateXAIReasoning(drug: any, ctx: ClinicalContext, safety: any): string {
  if (safety.warnings.length > 0) {
    return `Warning: Candidate shows ${safety.warnings[0]}. Dose adjustment recommended.`;
  }
  
  const reasons = [];
  reasons.push(`Selected for high binding affinity (${drug.bindingAffinity} kcal/mol).`);
  
  if (drug.source.includes("De Novo")) {
    reasons.push("Novel scaffold generated to overcome target resistance.");
  }
  
  if (ctx.liver === "Impaired" && drug.logP < 3) {
    reasons.push("Hydrophilic profile minimizes hepatic stress.");
  } else if (ctx.tumorType === "Glioblastoma" && drug.molecularWeight < 450) {
    reasons.push("Optimized MW facilitates Blood-Brain Barrier (BBB) crossing.");
  }

  return reasons.join(" ");
}
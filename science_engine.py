from fastapi import FastAPI
from pydantic import BaseModel
from rdkit import Chem
from rdkit.Chem import Descriptors, Crippen, QED
from fastapi.middleware.cors import CORSMiddleware
import random

app = FastAPI()

# السماح لـ Next.js بالاتصال بهذا السيرفر
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class DesignRequest(BaseModel):
    pdb_id: str
    liver_status: str

# دالة علمية دقيقة لحساب الخصائص باستخدام RDKit
def analyze_chem(smiles):
    mol = Chem.MolFromSmiles(smiles)
    if not mol: return None
    return {
        "mw": round(Descriptors.MolWt(mol), 2),
        "logp": round(Crippen.MolLogP(mol), 2),
        "hbd": Descriptors.NumHDonors(mol),
        "hba": Descriptors.NumHAcceptors(mol),
        "tpsa": round(Descriptors.TPSA(mol), 2),
        "qed": round(QED.qed(mol), 3)
    }

# قاعدة بيانات مصغرة لمحاكاة التوليد (يمكن استبدالها بـ AI Model لاحقاً)
GENERATED_MOLECULES = [
    "CC1=C(C=C(C=C1)NC(=O)C2=CC=C(C=C2)CN3CCN(CC3)C)C4=CN=CC=C4", # Imatinib
    "COc1cc2ncnc(Nc3ccc(F)c(Cl)c3)c2cc1OCCCN4CCOCC4", # Gefitinib
    "CC(C)C1=NC(=CS1)CN(C)C(=O)NC(C(C)C)C(=O)N", # Ritonavir
    "CN(C)CC1=CC=C(C=C1)NC(=O)C2=CC=C(C=C2)Cl",
    "FC1=CC=C(C=C1)C(=O)NC2=CC=C(C=C2)CN3CCN(CC3)C"
]

@app.post("/analyze")
async def run_analysis(request: DesignRequest):
    results = []
    
    # محاكاة التوليد + التحليل العلمي الدقيق
    for smiles in GENERATED_MOLECULES:
        props = analyze_chem(smiles)
        
        # منطق السمية بناءً على الكيمياء الحقيقية
        toxicity = "Safe"
        if request.liver_status == "Impaired" and props["logp"] > 3.5:
            toxicity = "Hepatotoxicity Risk"
        if props["mw"] > 550:
            toxicity = "High Molecular Weight Risk"

        # محاكاة الـ Docking (سنربطها بـ AutoDock لاحقاً)
        affinity = -8.0 - (random.random() * 2)

        results.append({
            "smiles": smiles,
            "source": "RDKit-Validated",
            "molecularWeight": props["mw"],
            "logP": props["logp"],
            "hbd": props["hbd"],
            "hba": props["hba"],
            "tpsa": props["tpsa"],
            "qed": props["qed"],
            "bindingAffinity": round(affinity, 2),
            "toxicityRisk": toxicity,
            "efficacy": round((props["qed"] * 100) - (0 if toxicity == "Safe" else 40), 1)
        })
    
    # ترتيب النتائج حسب الفاعلية
    results.sort(key=lambda x: x["efficacy"], reverse=True)
    return {"molecules": results}
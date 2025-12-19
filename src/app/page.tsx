"use client";

import { useState } from "react";
import { UserButton, useUser, RedirectToSignIn } from "@clerk/nextjs";
import { 
  Dna, Zap, Activity, Microscope, User, FileText, CheckCircle2, 
  AlertTriangle, Database, Printer, ChevronLeft, Heart, Brain, 
  Stethoscope, Flame, Pill, Box, Search, ShieldCheck 
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend 
} from 'recharts';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utility Components ---
function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

const GlassCard = ({ children, className = "" }: any) => (
  <div className={cn("bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-xl transition-all duration-300", className)}>
    {children}
  </div>
);

const Badge = ({ children, variant = "neutral" }: any) => {
  const colors: any = {
    neutral: "bg-slate-100 text-slate-600",
    success: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    warning: "bg-amber-100 text-amber-700 border border-amber-200",
    danger: "bg-rose-100 text-rose-700 border border-rose-200",
    purple: "bg-purple-100 text-purple-700 border border-purple-200"
  };
  return <span className={cn("px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide", colors[variant])}>{children}</span>;
};

// --- Scientific Visualization Components ---

// 1. Toxicity Heatmap (مصفوفة السمية)
const ToxicityMatrix = ({ drug }: any) => {
  const risks = [
    { label: "Heart (hERG)", level: drug.hERGRisk },
    { label: "Liver (Tox)", level: drug.liverToxRisk },
    { label: "CYP3A4", level: drug.cypInhibition.includes("Inhibitor") ? "Inhibitor" : "Clean" },
  ];
  return (
    <div className="grid grid-cols-3 gap-3 mt-4">
      {risks.map((r, i) => (
        <div key={i} className={cn(
            "p-3 rounded-lg border text-center transition-all",
            r.level.includes("High") || r.level.includes("Inhibitor") ? "bg-rose-50 border-rose-200" : 
            r.level.includes("Moderate") ? "bg-amber-50 border-amber-200" : "bg-emerald-50 border-emerald-200"
        )}>
          <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">{r.label}</div>
          <div className={cn("font-black text-xs", 
             r.level.includes("High") ? "text-rose-600" : r.level.includes("Moderate") ? "text-amber-600" : "text-emerald-600"
          )}>{r.level}</div>
        </div>
      ))}
    </div>
  );
};

export default function NeoTargetUltimate() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [activeTab, setActiveTab] = useState("setup");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [selectedDrug, setSelectedDrug] = useState<any>(null);

  // Clinical Inputs
  const [pdbId, setPdbId] = useState("1M17");
  const [patientData, setPatientData] = useState({
    name: "", age: "55", gender: "Male", weight: "75",
    tumorType: "Lung Cancer", stage: "Stage II", 
    chronicCondition: "None", previousTreatment: "None",
    liver: "Normal", kidney: "Normal", mutation: "EGFR T790M"
  });

  const runAnalysis = async () => {
    if (!patientData.name) return alert("Please enter patient name.");
    setLoading(true);
    try {
      const res = await fetch("/api/pipeline", {
        method: "POST",
        body: JSON.stringify({ pdbId, projectName: `Neo-${patientData.mutation}`, patientData })
      });
      
      if (!res.ok) throw new Error("API Failed");

      const data = await res.json();
      if (data.success) {
        setResults(data);
        setSelectedDrug(data.molecules[0]);
        setActiveTab("results");
      }
    } catch(e) { 
      console.error(e);
      alert("Analysis failed. Check console."); 
    }
    finally { setLoading(false); }
  };

  const handlePrint = () => window.print();

  if (!isLoaded) return <div className="h-screen flex items-center justify-center bg-slate-50"><Dna className="animate-spin text-emerald-600 w-12 h-12" /></div>;
  if (!isSignedIn) return <RedirectToSignIn />;

  // Radar Chart Data Preparation
  const radarData = selectedDrug ? [
    { subject: 'Efficacy', A: selectedDrug.efficacy, fullMark: 100 },
    { subject: 'Affinity', A: Math.min(Math.abs(selectedDrug.bindingAffinity) * 8, 100), fullMark: 100 },
    { subject: 'Safety', A: selectedDrug.hERGRisk === "Low" ? 95 : 40, fullMark: 100 },
    { subject: 'Drug-Like', A: selectedDrug.qed * 100, fullMark: 100 },
    { subject: 'Bioavail.', A: selectedDrug.absorption, fullMark: 100 },
  ] : [];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col">
      
      {/* --- RESEARCH REPORT TEMPLATE (Hidden unless printing) --- */}
      <div className="hidden print:block p-10 bg-white text-black h-screen">
        <div className="flex justify-between items-end border-b-4 border-slate-900 pb-4 mb-8">
          <div>
             <h1 className="text-4xl font-black mb-1">NeoTarget AI Report</h1>
             <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Precision Oncology & De Novo Design</p>
          </div>
          <div className="text-right">
             <p className="font-bold text-lg">Dr. {user.fullName}</p>
             <p className="text-sm text-slate-500">{new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8">
           <div className="border p-4 rounded-lg bg-slate-50">
              <h3 className="font-bold border-b pb-2 mb-2 flex items-center gap-2"><User size={16}/> Clinical Profile</h3>
              <p className="text-sm"><strong>Patient:</strong> {patientData.name} ({patientData.age}y, {patientData.gender})</p>
              <p className="text-sm"><strong>Diagnosis:</strong> {patientData.tumorType} ({patientData.stage})</p>
              <p className="text-sm"><strong>Comorbidities:</strong> {patientData.chronicCondition}</p>
              <p className="text-sm"><strong>Organ Function:</strong> Liver: {patientData.liver}, Kidney: {patientData.kidney}</p>
           </div>
           <div className="border p-4 rounded-lg bg-slate-50">
              <h3 className="font-bold border-b pb-2 mb-2 flex items-center gap-2"><Dna size={16}/> Molecular Target</h3>
              <p className="text-sm"><strong>Target Protein:</strong> {results?.molecules[0]?.targetName || pdbId}</p>
              <p className="text-sm"><strong>PDB ID:</strong> {pdbId}</p>
              <p className="text-sm"><strong>Mutation:</strong> {patientData.mutation}</p>
              <p className="text-sm"><strong>Design Strategy:</strong> Multi-Objective Pareto Optimization</p>
           </div>
        </div>

        {selectedDrug && (
           <div className="border-2 border-slate-900 rounded-xl p-6 mb-8">
              <div className="flex justify-between items-start mb-4">
                 <h2 className="text-2xl font-bold">Top Candidate: {selectedDrug.id}</h2>
                 <Badge variant="purple">Pareto Score: {selectedDrug.efficacy}</Badge>
              </div>
              
              <div className="bg-slate-100 p-3 rounded font-mono text-xs break-all mb-6 border">
                 {selectedDrug.smiles}
              </div>

              <div className="grid grid-cols-3 gap-6">
                 <div>
                    <h4 className="font-bold border-b mb-2 text-sm">Pharmacodynamics</h4>
                    <p className="text-sm">Affinity: <strong>{selectedDrug.bindingAffinity} kcal/mol</strong></p>
                    <p className="text-sm">QED Score: <strong>{selectedDrug.qed}</strong></p>
                 </div>
                 <div>
                    <h4 className="font-bold border-b mb-2 text-sm">ADMET & Safety</h4>
                    <p className="text-sm">hERG Risk: <strong>{selectedDrug.hERGRisk}</strong></p>
                    <p className="text-sm">Liver Tox: <strong>{selectedDrug.liverToxRisk}</strong></p>
                 </div>
                 <div>
                    <h4 className="font-bold border-b mb-2 text-sm">Physicochemical</h4>
                    <p className="text-sm">MW: {selectedDrug.molecularWeight} Da</p>
                    <p className="text-sm">LogP: {selectedDrug.logP}</p>
                 </div>
              </div>

              <div className="mt-6 p-4 bg-slate-50 border rounded-lg">
                 <h4 className="font-bold text-sm mb-2">AI Reasoning (XAI)</h4>
                 <p className="italic text-sm text-slate-700">"{selectedDrug.aiReasoning}"</p>
              </div>
           </div>
        )}
        <div className="text-center text-xs text-slate-400 mt-10">Generated by NeoTarget AI System - Confidential Research Document</div>
      </div>

      {/* --- APP UI --- */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b px-6 py-3 flex justify-between items-center shadow-sm print:hidden">
        <div className="flex items-center gap-3">
           <div className="bg-slate-900 text-white p-2 rounded-lg shadow-lg"><Brain size={24}/></div>
           <h1 className="text-xl font-black text-slate-900 tracking-tight">NeoTarget <span className="text-emerald-600">AI</span></h1>
        </div>
        <UserButton afterSignOutUrl="/" />
      </nav>

      <main className="flex-grow max-w-7xl mx-auto w-full p-6 space-y-8 print:hidden">
        {/* Stepper */}
        <div className="flex justify-center mb-8">
          <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 inline-flex gap-2">
            {[
              { id: "setup", label: "1. Clinical Input" },
              { id: "results", label: "2. Analysis Dashboard" },
              { id: "visualization", label: "3. 3D Structure" }
            ].map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} disabled={tab.id !== "setup" && !results} className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === tab.id ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"}`}>{tab.label}</button>
            ))}
          </div>
        </div>

        {/* --- TAB 1: SETUP --- */}
        {activeTab === "setup" && (
          <div className="grid md:grid-cols-12 gap-6 animate-in slide-in-from-bottom-4">
            <div className="md:col-span-8 space-y-6">
               <GlassCard className="p-8">
                  <div className="flex justify-between items-center mb-6">
                     <h2 className="text-2xl font-bold text-slate-800">New Research Case</h2>
                     <Stethoscope className="text-emerald-600"/>
                  </div>
                  
                  {/* Demographics */}
                  <div className="mb-6 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                     <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 flex gap-2 items-center"><User size={14}/> Patient Demographics</h3>
                     <div className="grid grid-cols-2 gap-4 mb-3">
                        <input type="text" placeholder="Full Name / ID" value={patientData.name} onChange={e=>setPatientData({...patientData, name: e.target.value})} className="p-3 border border-slate-200 rounded-xl w-full focus:ring-2 focus:ring-slate-900 outline-none transition-all"/>
                        <select className="p-3 border border-slate-200 rounded-xl w-full bg-white" onChange={e=>setPatientData({...patientData, gender: e.target.value})}><option>Male</option><option>Female</option></select>
                     </div>
                     <div className="grid grid-cols-3 gap-4">
                        <input type="number" placeholder="Age" value={patientData.age} onChange={e=>setPatientData({...patientData, age: e.target.value})} className="p-3 border border-slate-200 rounded-xl w-full"/>
                        <input type="number" placeholder="Weight (kg)" value={patientData.weight} onChange={e=>setPatientData({...patientData, weight: e.target.value})} className="p-3 border border-slate-200 rounded-xl w-full"/>
                        <select className="p-3 border border-slate-200 rounded-xl w-full bg-white" onChange={e=>setPatientData({...patientData, chronicCondition: e.target.value})}>
                            <option value="None">No Comorbidities</option>
                            <option value="Heart Failure">Heart Failure (NYHA III)</option>
                            <option value="Hypertension">Hypertension</option>
                            <option value="Diabetes T2">Diabetes Type 2</option>
                            <option value="Liver Cirrhosis">Liver Cirrhosis</option>
                        </select>
                     </div>
                  </div>

                  {/* Oncology */}
                  <div className="mb-6 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                     <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 flex gap-2 items-center"><Dna size={14}/> Oncology Profile</h3>
                     <div className="grid grid-cols-2 gap-4 mb-3">
                        <select className="p-3 border border-slate-200 rounded-xl w-full bg-white" onChange={e=>setPatientData({...patientData, tumorType: e.target.value})}>
                            <option value="Lung Cancer">Lung Cancer (NSCLC)</option>
                            <option value="Breast Cancer">Breast Cancer</option>
                            <option value="Glioblastoma">Glioblastoma (Brain)</option>
                            <option value="Pancreatic Cancer">Pancreatic Cancer</option>
                        </select>
                        <select className="p-3 border border-slate-200 rounded-xl w-full bg-white" onChange={e=>setPatientData({...patientData, stage: e.target.value})}>
                            <option value="Stage I">Stage I</option>
                            <option value="Stage II">Stage II</option>
                            <option value="Stage III">Stage III</option>
                            <option value="Stage IV">Stage IV (Metastatic)</option>
                        </select>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <input type="text" placeholder="Mutation (e.g. EGFR T790M)" value={patientData.mutation} onChange={e=>setPatientData({...patientData, mutation: e.target.value})} className="p-3 border border-slate-200 rounded-xl w-full"/>
                        <select className="p-3 border border-slate-200 rounded-xl w-full bg-white" onChange={e=>setPatientData({...patientData, previousTreatment: e.target.value})}>
                             <option value="None">Treatment Naive</option>
                             <option value="Chemotherapy">Chemotherapy</option>
                             <option value="Immunotherapy">Immunotherapy</option>
                             <option value="TKI">TKI (Resistance)</option>
                        </select>
                     </div>
                  </div>

                  {/* Organ Function */}
                  <div className="grid grid-cols-2 gap-4 mb-8">
                     <div>
                        <label className="text-xs font-bold text-slate-400 uppercase ml-1">Liver Function</label>
                        <select className="p-3 border border-slate-200 rounded-xl w-full mt-1 bg-white" onChange={e=>setPatientData({...patientData, liver: e.target.value})}><option value="Normal">Normal</option><option value="Impaired">Impaired (Child-Pugh B/C)</option></select>
                     </div>
                     <div>
                        <label className="text-xs font-bold text-slate-400 uppercase ml-1">Kidney Function</label>
                        <select className="p-3 border border-slate-200 rounded-xl w-full mt-1 bg-white" onChange={e=>setPatientData({...patientData, kidney: e.target.value})}>
                          <option value="Normal">Normal (GFR &gt; 90)</option>
                          <option value="Impaired">Impaired (GFR &lt; 60)</option>
                        </select>
                     </div>
                  </div>

                  <button onClick={runAnalysis} disabled={loading} className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex justify-center items-center gap-3 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                      {loading ? <Zap className="animate-spin text-emerald-400"/> : <Brain className="text-emerald-400"/>}
                      {loading ? "Running Multi-Objective Optimization..." : "Initialize Generative Pipeline"}
                  </button>
               </GlassCard>
            </div>
            
            <div className="md:col-span-4 space-y-6">
                <GlassCard className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none">
                   <h3 className="text-xl font-bold mb-4">Scientific Validation</h3>
                   <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
                      <p>NeoTarget implements a <strong>Multi-Objective Pareto Optimization</strong> algorithm to balance conflicting drug properties.</p>
                      <div className="space-y-3 mt-4">
                         <div className="flex gap-3 items-start"><CheckCircle2 className="text-emerald-400 shrink-0" size={18}/> <div><strong>Lipinski & Veber Rules:</strong> Strict physicochemical filtering.</div></div>
                         <div className="flex gap-3 items-start"><CheckCircle2 className="text-emerald-400 shrink-0" size={18}/> <div><strong>hERG Prediction:</strong> Cardiotoxicity alerts for heart patients.</div></div>
                         <div className="flex gap-3 items-start"><CheckCircle2 className="text-emerald-400 shrink-0" size={18}/> <div><strong>De Novo Design:</strong> Generative scaffolds for resistant mutations.</div></div>
                      </div>
                   </div>
                </GlassCard>
            </div>
          </div>
        )}

        {/* --- TAB 2: RESULTS DASHBOARD --- */}
        {activeTab === "results" && results && (
          <div className="grid md:grid-cols-12 gap-6 animate-in slide-in-from-bottom-4">
             {/* Left: Candidates List */}
             <div className="md:col-span-5 space-y-4">
                <div className="flex justify-between items-center mb-2">
                   <h2 className="text-xl font-bold text-slate-800">Top Candidates</h2>
                   <div className="text-xs text-slate-500 font-bold">{results.molecules.length} generated</div>
                </div>
                <div className="space-y-3 h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {results.molecules.map((m: any, i: number) => (
                     <div key={i} onClick={()=>setSelectedDrug(m)} className={cn(
                        "p-4 rounded-xl border cursor-pointer transition-all flex flex-col gap-3 group hover:shadow-md",
                        selectedDrug?.id===m.id ? "bg-white border-emerald-500 ring-1 ring-emerald-500 shadow-md" : "bg-white border-slate-100 hover:border-emerald-300"
                     )}>
                        <div className="flex justify-between items-start">
                           <div className="flex items-center gap-3">
                              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs", m.source.includes("De Novo") ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700")}>
                                {m.source.includes("De Novo") ? "AI" : "DB"}
                              </div>
                              <div>
                                 <div className="font-mono text-[10px] text-slate-400">{m.id}</div>
                                 <div className="font-bold text-sm text-slate-800">Score: {m.efficacy}</div>
                              </div>
                           </div>
                           <Badge variant={m.efficacy > 80 ? "success" : "warning"}>{m.efficacy > 80 ? "Elite" : "Good"}</Badge>
                        </div>
                        
                        <div className="flex justify-between items-center border-t pt-2">
                           <div className="text-xs text-slate-500">Affinity: <span className="font-bold text-slate-800">{m.bindingAffinity}</span></div>
                           <div className="text-xs text-slate-500">LogP: <span className="font-bold text-slate-800">{m.logP}</span></div>
                           <div className="text-xs text-slate-500">MW: <span className="font-bold text-slate-800">{m.molecularWeight}</span></div>
                        </div>
                     </div>
                  ))}
                </div>
             </div>

             {/* Right: Scientific Analysis Board */}
             <div className="md:col-span-7">
                {selectedDrug && (
                   <GlassCard className="p-0 sticky top-24 overflow-hidden">
                      {/* Header */}
                      <div className="p-6 border-b bg-slate-50 flex justify-between items-center">
                         <div>
                            <h3 className="font-bold text-lg flex items-center gap-2 text-slate-900"><Microscope className="text-purple-600"/> Molecule Analysis</h3>
                            <p className="text-xs font-mono text-slate-500 mt-1 max-w-md truncate">{selectedDrug.smiles}</p>
                         </div>
                         <button onClick={handlePrint} className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-800 transition-all shadow-lg">
                            <Printer size={16}/> Export Report
                         </button>
                      </div>

                      <div className="p-6 grid md:grid-cols-2 gap-8">
                         {/* Column 1: Charts */}
                         <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase mb-4 text-center">Multi-Objective Profile</h4>
                            <div className="h-56 w-full relative">
                               <ResponsiveContainer width="100%" height="100%">
                                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                     <PolarGrid stroke="#e2e8f0"/>
                                     <PolarAngleAxis dataKey="subject" tick={{fill:'#64748b', fontSize:10, fontWeight:'bold'}}/>
                                     <PolarRadiusAxis angle={30} domain={[0,100]} tick={false} axisLine={false}/>
                                     <Radar name="Candidate" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.5}/>
                                     <Tooltip contentStyle={{borderRadius:'8px', border:'none', boxShadow:'0 4px 12px rgba(0,0,0,0.1)'}}/>
                                  </RadarChart>
                               </ResponsiveContainer>
                            </div>
                            
                            <h4 className="text-xs font-bold text-slate-400 uppercase mt-6 mb-2">Safety Matrix</h4>
                            <ToxicityMatrix drug={selectedDrug} />
                         </div>

                         {/* Column 2: XAI & Actions */}
                         <div className="flex flex-col justify-between">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                               <h4 className="text-xs font-bold text-slate-500 uppercase flex gap-2 items-center mb-3"><Brain size={14}/> Explainable AI (XAI)</h4>
                               <p className="text-sm text-slate-700 italic leading-relaxed">
                                  "{selectedDrug.aiReasoning}"
                               </p>
                               <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-2 gap-2 text-xs">
                                  <div>Target: <span className="font-bold">{results.protein || pdbId}</span></div>
                                  <div>Source: <span className="font-bold text-purple-600">{selectedDrug.source}</span></div>
                               </div>
                            </div>

                            <button onClick={()=>setActiveTab("visualization")} className="w-full mt-6 py-4 bg-emerald-600 text-white font-bold rounded-xl flex justify-center items-center gap-2 hover:bg-emerald-700 shadow-lg hover:shadow-emerald-200 transition-all">
                               <Box size={18}/> View 3D Structure
                            </button>
                         </div>
                      </div>
                   </GlassCard>
                )}
             </div>
          </div>
        )}

        {/* --- TAB 3: VISUALIZATION --- */}
        {activeTab === "visualization" && (
           <div className="animate-in zoom-in-95 duration-500 h-[calc(100vh-200px)]">
              <GlassCard className="h-full flex flex-col border-0 overflow-hidden shadow-2xl">
                 <div className="p-4 border-b bg-slate-50 flex justify-between items-center z-10">
                    <button onClick={()=>setActiveTab("results")} className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">
                        <ChevronLeft size={18}/> Back to Analysis
                    </button>
                    <div className="flex gap-3">
                       <Badge variant="success">WebGL Active</Badge>
                       <Badge variant="neutral">Protein: {pdbId}</Badge>
                    </div>
                 </div>
                 <div className="flex-grow bg-slate-900 relative">
                     {/* 3D Mol Viewer Iframe */}
                    <iframe 
                      src={`https://3dmol.csb.pitt.edu/viewer.html?pdb=${pdbId}&style=cartoon:color=spectrum&surface=opacity:0.7;color:white&select=hetatm&style=stick:color=orange`} 
                      className="w-full h-full border-none"
                      title="3D Structure Viewer"
                    ></iframe>
                    
                    {/* Overlay Legend */}
                    <div className="absolute bottom-6 left-6 bg-black/70 backdrop-blur text-white p-4 rounded-xl text-xs space-y-2 pointer-events-none">
                        <div className="font-bold border-b border-white/20 pb-1 mb-2">Visualization Key</div>
                        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-orange-500 block"></span> Ligand / Drug</div>
                        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500 block"></span> Protein Surface</div>
                    </div>
                 </div>
              </GlassCard>
           </div>
        )}
      </main>
    </div>
  );
}
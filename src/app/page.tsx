"use client";

import { useState } from "react";
import { UserButton, useUser, RedirectToSignIn } from "@clerk/nextjs";
import { 
  Dna, Zap, Activity, Microscope, User, FileText, 
  CheckCircle2, AlertTriangle, Database, ArrowRight, Search, 
  ShieldCheck, Box, Printer, ChevronLeft, Heart, Stethoscope
} from "lucide-react";
// Fix: Removed duplicate 'Radar' import
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis 
} from 'recharts';

// --- UI Components ---
const GlassCard = ({ children, className = "" }: any) => (
  <div className={`bg-white/90 backdrop-blur-xl border border-white/40 rounded-2xl shadow-xl transition-all duration-300 ${className}`}>
    {children}
  </div>
);

const Badge = ({ children, variant = "neutral" }: any) => {
  const colors: any = {
    neutral: "bg-slate-100 text-slate-600",
    success: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    warning: "bg-amber-100 text-amber-700 border border-amber-200",
    danger: "bg-rose-100 text-rose-700 border border-rose-200",
  };
  return <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide ${colors[variant]}`}>{children}</span>;
};

export default function ExpertDashboard() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [activeTab, setActiveTab] = useState("setup");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [selectedDrug, setSelectedDrug] = useState<any>(null);

  // New Expanded Patient Inputs
  const [pdbId, setPdbId] = useState("1M17");
  const [patientData, setPatientData] = useState({
    name: "", // اسم المريض
    age: "55", 
    gender: "Male", 
    weight: "75", 
    chronicCondition: "None", 
    liver: "Normal", 
    kidney: "Normal", 
    mutation: "EGFR T790M", 
    category: "Oncology"
  });

  const runAnalysis = async () => {
    if (!patientData.name) return alert("Please enter patient name.");
    setLoading(true);
    try {
      const res = await fetch("/api/pipeline", {
        method: "POST",
        body: JSON.stringify({ pdbId, projectName: `Tx-${patientData.mutation}`, patientData })
      });
      const data = await res.json();
      if (data.success) {
        setResults(data);
        setSelectedDrug(data.molecules[0]);
        setActiveTab("results");
      }
    } catch(e) { alert("Analysis failed."); }
    finally { setLoading(false); }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isLoaded) return <div className="h-screen flex items-center justify-center bg-slate-50"><Dna className="animate-spin text-emerald-600 w-12 h-12" /></div>;
  if (!isSignedIn) return <RedirectToSignIn />;

  // Data for Charts
  const radarData = selectedDrug ? [
    { subject: 'Affinity', A: Math.abs(selectedDrug.bindingAffinity) * 8, fullMark: 100 },
    { subject: 'Efficacy', A: selectedDrug.efficacy, fullMark: 100 },
    { subject: 'Safety', A: selectedDrug.toxicityRisk.includes("Safe") ? 95 : 30, fullMark: 100 },
    { subject: 'Bioavail.', A: selectedDrug.absorption, fullMark: 100 },
    { subject: 'Clearance', A: selectedDrug.clearance * 5, fullMark: 100 },
  ] : [];

  const admetData = selectedDrug ? [
    { name: 'Absorption', value: selectedDrug.absorption, fill: '#10b981' },
    { name: 'TPSA', value: selectedDrug.tpsa, fill: '#3b82f6' },
    { name: 'Clearance', value: selectedDrug.clearance * 5, fill: '#f59e0b' },
  ] : [];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col">
      
      {/* --- PRINTABLE CLINICAL REPORT --- */}
      <div className="hidden print:block p-10 bg-white text-black">
        <div className="flex justify-between items-end border-b-4 border-emerald-700 pb-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-1">BioPharma Nexus</h1>
            <p className="text-sm font-semibold text-slate-600 uppercase tracking-widest">Precision Medicine Report</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-lg">Dr. {user.fullName}</p>
            <p className="text-sm text-slate-500">{new Date().toDateString()}</p>
          </div>
        </div>

        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-8 grid grid-cols-2 gap-8">
          <div>
            <h3 className="text-emerald-700 font-bold border-b border-emerald-200 pb-2 mb-3 uppercase text-xs tracking-wider">Patient Demographics</h3>
            <p className="mb-1"><span className="font-bold text-slate-500 w-24 inline-block">Name:</span> {patientData.name}</p>
            <p className="mb-1"><span className="font-bold text-slate-500 w-24 inline-block">Age / Sex:</span> {patientData.age} / {patientData.gender}</p>
            <p className="mb-1"><span className="font-bold text-slate-500 w-24 inline-block">Weight:</span> {patientData.weight} kg</p>
            <p className="mb-1"><span className="font-bold text-slate-500 w-24 inline-block">Condition:</span> {patientData.chronicCondition}</p>
          </div>
          <div>
            <h3 className="text-emerald-700 font-bold border-b border-emerald-200 pb-2 mb-3 uppercase text-xs tracking-wider">Clinical Context</h3>
            <p className="mb-1"><span className="font-bold text-slate-500 w-24 inline-block">Diagnosis:</span> {patientData.category}</p>
            <p className="mb-1"><span className="font-bold text-slate-500 w-24 inline-block">Mutation:</span> {patientData.mutation}</p>
            <p className="mb-1"><span className="font-bold text-slate-500 w-24 inline-block">Target:</span> {results?.protein || pdbId}</p>
            <p className="mb-1"><span className="font-bold text-slate-500 w-24 inline-block">Organ Risk:</span> Liver ({patientData.liver}), Kidney ({patientData.kidney})</p>
          </div>
        </div>

        {selectedDrug && (
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><CheckCircle2 className="text-emerald-600"/> AI Recommended Therapeutic</h2>
            <div className="border-2 border-emerald-600 rounded-xl p-6 bg-white">
              <div className="grid grid-cols-2 gap-10">
                <div>
                  <p className="text-xs text-slate-400 uppercase font-bold mb-1">Candidate ID</p>
                  <p className="text-2xl font-mono font-bold text-slate-900 mb-4">{selectedDrug.id}</p>
                  
                  <p className="text-xs text-slate-400 uppercase font-bold mb-1">Chemical Structure (SMILES)</p>
                  <div className="font-mono text-xs break-all bg-slate-100 p-3 rounded border border-slate-200 text-slate-600 leading-relaxed">
                    {selectedDrug.smiles}
                  </div>
                </div>
                <div className="space-y-3 pt-2">
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-600">Predicted Efficacy</span> 
                    <span className="font-bold text-emerald-700 text-lg">{selectedDrug.efficacy}%</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-600">Binding Affinity</span> 
                    <span className="font-bold text-slate-900">{selectedDrug.bindingAffinity} kcal/mol</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-600">Safety Assessment</span> 
                    <span className={`font-bold ${selectedDrug.toxicityRisk.includes("Safe") ? "text-emerald-600" : "text-rose-600"}`}>{selectedDrug.toxicityRisk}</span>
                  </div>
                  {patientData.chronicCondition !== "None" && (
                    <div className="flex justify-between border-b border-slate-100 pb-2 bg-yellow-50 px-2 rounded">
                      <span className="text-yellow-800 font-bold">Comorbidity Check</span> 
                      <span className="font-bold text-slate-900">{patientData.chronicCondition} Optimized</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-16 pt-6 border-t-2 border-slate-200 flex justify-between items-center text-xs text-slate-400">
          <p>Generated by BioPharma Nexus AI • Developed by Dr. Ahmed Hani Mohamed</p>
          <p>CONFIDENTIAL • CLINICAL RESEARCH USE ONLY</p>
        </div>
      </div>
      {/* --- END PRINTABLE REPORT --- */}


      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b px-6 py-3 flex justify-between items-center shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-emerald-600 to-cyan-600 p-2 rounded-lg text-white shadow-lg">
            <Dna className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900">BioPharma Nexus <span className="text-emerald-600">Expert</span></h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden md:block text-xs font-bold text-slate-400 uppercase tracking-widest">Dr. {user.firstName}</span>
          <UserButton afterSignOutUrl="/" />
        </div>
      </nav>

      <main className="flex-grow max-w-7xl mx-auto w-full p-6 space-y-8 print:hidden">
        
        {/* Stepper */}
        <div className="flex justify-center mb-8">
          <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 inline-flex gap-2">
            {[
              { id: "setup", label: "1. Patient Data" },
              { id: "results", label: "2. Expert Analysis" },
              { id: "visualization", label: "3. 3D Model" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                disabled={tab.id !== "setup" && !results}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === tab.id ? "bg-emerald-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* --- SETUP TAB --- */}
        {activeTab === "setup" && (
          <div className="grid md:grid-cols-12 gap-6 animate-in slide-in-from-bottom-4">
            <div className="md:col-span-8 space-y-6">
              <GlassCard className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Clinical Admission</h2>
                    <p className="text-slate-500">Enter patient vitals and comorbidities for safety screening.</p>
                  </div>
                  <ShieldCheck className="text-emerald-500 w-10 h-10 opacity-80" />
                </div>

                {/* Patient Vitals */}
                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 mb-6">
                  <h3 className="text-xs font-bold text-emerald-600 uppercase mb-4 flex items-center gap-2"><User size={14}/> Patient Identity</h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">Patient Name</label>
                      <input type="text" value={patientData.name} onChange={e => setPatientData({...patientData, name: e.target.value})} className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Full Name" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">Chronic Conditions</label>
                      <select className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none" onChange={e => setPatientData({...patientData, chronicCondition: e.target.value})}>
                        <option value="None">None (Healthy)</option>
                        <option value="Heart Disease">Heart Disease (Cardiac)</option>
                        <option value="Hypertension">Hypertension (High BP)</option>
                        <option value="Diabetes">Diabetes Type 2</option>
                        <option value="Asthma">Asthma / COPD</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">Age</label>
                      <input type="number" value={patientData.age} onChange={e => setPatientData({...patientData, age: e.target.value})} className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">Weight (kg)</label>
                      <input type="number" value={patientData.weight} onChange={e => setPatientData({...patientData, weight: e.target.value})} className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">Gender</label>
                      <select className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none" onChange={e => setPatientData({...patientData, gender: e.target.value})}><option>Male</option><option>Female</option></select>
                    </div>
                  </div>
                </div>

                {/* Disease & Target */}
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-slate-400 uppercase">Target PDB ID</label>
                    <div className="flex gap-2">
                      <input type="text" value={pdbId} onChange={e => setPdbId(e.target.value.toUpperCase())} className="flex-1 p-3 bg-white border border-slate-200 rounded-xl font-mono text-lg font-bold tracking-widest focus:ring-2 focus:ring-emerald-500 outline-none" />
                      <button className="bg-slate-100 px-4 rounded-xl hover:bg-slate-200"><Search size={20} className="text-slate-500"/></button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-slate-400 uppercase">Disease Category</label>
                    <select className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none" onChange={e => setPatientData({...patientData, category: e.target.value})}>
                      <option value="Oncology">Oncology</option>
                      <option value="Cardiology">Cardiology</option>
                      <option value="Neurology">Neurology</option>
                      <option value="Infectious">Infectious Diseases</option>
                    </select>
                  </div>
                </div>

                <div className="border-t border-slate-100 my-6 pt-6">
                  <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2"><Activity size={16}/> Organ Function (Safety Constraints)</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-2">Liver (Metabolism)</label>
                      <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" onChange={e => setPatientData({...patientData, liver: e.target.value})}>
                        <option value="Normal">Normal Function</option>
                        <option value="Impaired">Impaired (Avoid Hepatotoxic)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-2">Kidney (Clearance)</label>
                      <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" onChange={e => setPatientData({...patientData, kidney: e.target.value})}>
                        <option value="Normal">Normal Function</option>
                        <option value="Impaired">Impaired (Avoid High MW)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={runAnalysis} disabled={loading}
                  className="w-full py-4 mt-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xl transition-all flex items-center justify-center gap-3 text-lg"
                >
                  {loading ? <Zap className="animate-spin text-yellow-400" /> : <Zap className="text-yellow-400" fill="currentColor" />}
                  {loading ? "Running Expert System..." : "Run Clinical Screening"}
                </button>
              </GlassCard>
            </div>

            <div className="md:col-span-4 space-y-6">
              <GlassCard className="p-6 bg-gradient-to-br from-emerald-700 to-teal-900 text-white border-none">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Stethoscope/> Expert Logic</h3>
                <p className="text-emerald-100 text-sm leading-relaxed mb-4">
                  This system integrates geriatric and comorbidity rulesets. 
                </p>
                <div className="bg-white/10 p-3 rounded-lg text-xs space-y-2">
                  <div className="flex items-center gap-2"><Heart size={14} className="text-rose-400"/> <span>Cardio-Safety Checks</span></div>
                  <div className="flex items-center gap-2"><Activity size={14} className="text-blue-400"/> <span>Renal Clearance Adjustment</span></div>
                  <div className="flex items-center gap-2"><ShieldCheck size={14} className="text-yellow-400"/> <span>Age Stratification</span></div>
                </div>
              </GlassCard>
            </div>
          </div>
        )}

        {/* --- RESULTS TAB --- */}
        {activeTab === "results" && results && (
          <div className="grid md:grid-cols-12 gap-6 animate-in slide-in-from-bottom-4">
            
            {/* Left List */}
            <div className="md:col-span-7 space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800">Ranked Candidates</h2>
                <button onClick={handlePrint} className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-700 transition-colors shadow-lg">
                  <Printer size={14}/> Print Clinical Report
                </button>
              </div>
              
              <div className="space-y-3">
                {results.molecules.map((m: any, i: number) => (
                  <div 
                    key={i} 
                    onClick={() => setSelectedDrug(m)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex justify-between items-center ${
                      selectedDrug?.id === m.id 
                      ? "bg-white border-emerald-500 shadow-md ring-1 ring-emerald-500" 
                      : "bg-white border-slate-100 hover:border-emerald-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${i===0 ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        #{i+1}
                      </div>
                      <div>
                        <div className="font-mono text-xs text-slate-500">{m.id}</div>
                        <div className="font-bold text-slate-800 flex gap-2 items-center text-sm">
                          Efficacy: {m.efficacy}%
                        </div>
                      </div>
                    </div>
                    <Badge variant={m.toxicityRisk.includes("Safe") ? "success" : "danger"}>{m.toxicityRisk}</Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Analysis */}
            <div className="md:col-span-5">
              {selectedDrug && (
                <GlassCard className="p-6 sticky top-24 bg-white/90">
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-slate-800">Drug Passport</h3>
                    <p className="text-xs text-slate-500 font-mono break-all">{selectedDrug.smiles}</p>
                  </div>

                  <div className="h-48 w-full -ml-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey="subject" tick={{fill: '#64748b', fontSize: 10, fontWeight: 'bold'}} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar name="Stats" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                        <Tooltip contentStyle={{borderRadius: '8px', fontSize: '12px'}}/>
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">ADMET Profile</h4>
                    <div className="h-32 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={admetData} layout="vertical">
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" width={70} tick={{fontSize: 10}} />
                          <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px'}} />
                          <Bar dataKey="value" barSize={15} radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <button onClick={() => setActiveTab("visualization")} className="w-full mt-4 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors flex justify-center items-center gap-2 shadow-lg shadow-emerald-500/20">
                    <Box size={18} /> Visualize in 3D
                  </button>
                </GlassCard>
              )}
            </div>
          </div>
        )}

        {/* --- TAB 3: VISUALIZATION (With Back Button) --- */}
        {activeTab === "visualization" && (
          <div className="animate-in zoom-in-95 duration-500 h-[calc(100vh-200px)] flex flex-col gap-4">
            <button onClick={() => setActiveTab("results")} className="self-start flex items-center gap-2 text-slate-500 hover:text-emerald-600 font-bold transition-colors">
              <ChevronLeft size={20} /> Back to Results
            </button>

            <GlassCard className="h-full overflow-hidden flex flex-col border border-white/60">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white/50">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-100 p-2 rounded text-emerald-700 font-bold font-mono">{pdbId}</div>
                  <h3 className="font-bold text-slate-800">Molecular Docking Simulation</h3>
                </div>
                <Badge variant="success">Interactive</Badge>
              </div>
              <div className="flex-grow bg-slate-900 relative">
                <iframe 
                  src={`https://3dmol.csb.pitt.edu/viewer.html?pdb=${pdbId}&style=cartoon:color=spectrum&surface=opacity:0.7;color:white&select=hetatm&style=stick:color=orange&labelres=backgroundOpacity:0.8;fontSize:12`}
                  className="w-full h-full border-none"
                  title="3D Molecular Viewer"
                ></iframe>
              </div>
            </GlassCard>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-8 print:hidden">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-slate-500">© 2025 BioPharma Nexus. Precision Medicine Platform.</div>
          <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
            <ShieldCheck size={16} className="text-emerald-600" />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Developed by <span className="text-slate-900">Dr. Ahmed Hani Mohamed</span></span>
          </div>
        </div>
      </footer>

    </div>
  );
}
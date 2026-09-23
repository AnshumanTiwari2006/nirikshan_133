// import { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { Network, Database, Copy, TrendingUp, AlertTriangle, ShieldCheck, Eye, ArrowRight, HelpCircle, BarChart2, AlertCircle, FileCheck, DollarSign, Building } from 'lucide-react';
// import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
// import VendorNetworkGraph from '../components/VendorNetworkGraph';

// const WEIGHTS = [
//   { name: 'Financial Rule Deviations',       pct: 25, fill: '#475569', type: 'Unusual payouts and cost outliers' },
//   { name: 'Timeline and Disbursal Anomalies',pct: 30, fill: '#2563eb', type: 'Money paid without work proof'  },
//   { name: 'Budget Inflation and Overruns',   pct: 25, fill: '#7c3aed', type: 'Spend exceeds sanctioned limit'  },
//   { name: 'Duplicate Funding Flags',          pct:  7, fill: '#d97706', type: 'Same work billed multiple times'  },
//   { name: 'Peer Group Overpricing',          pct:  3, fill: '#0891b2', type: 'Priced far above similar works'   },
//   { name: 'Contractor Cartel Risk',           pct: 10, fill: '#dc2626', type: 'Single contractor across MPs'   },
// ];

// const CONTAMINATION_SWEEP = [
//   { c: 'Strict 3%', count: 2329, chosen: false },
//   { c: 'Standard 5%', count: 3882, chosen: true  },
//   { c: 'Broad 10%', count: 7764, chosen: false },
// ];

// function bandChip(band) {
//   const cls = band === 'Very High' || band === 'HIGH' || band === 'High'
//     ? 'bg-red-50 text-red-700 border border-red-200'
//     : band === 'MEDIUM' || band === 'Medium' ? 'bg-amber-50 text-amber-700 border border-amber-200'
//     : 'bg-slate-50 text-slate-600 border border-slate-200';
//   return (
//     <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-center inline-flex items-center justify-center ${cls}`}>
//       {band}
//     </span>
//   );
// }

// export default function Risk() {
//   const navigate = useNavigate();
//   const [activeTab, setActiveTab] = useState('ensemble');
//   const [overview, setOverview]   = useState(null);
//   const [anomalies, setAnomalies] = useState([]);
//   const [totalFlagged, setTotalFlagged] = useState(0);
//   const [loading, setLoading] = useState(false);

//   const [duplicatesData, setDuplicatesData] = useState(null);
//   const [vendorNetworkData, setVendorNetworkData] = useState(null);
//   const [costOverrunData, setCostOverrunData] = useState(null);

//   useEffect(() => {
//     fetch('http://localhost:8000/api/risk/overview')
//       .then(r => r.json()).then(d => setOverview(d)).catch(() => {});
//     setLoading(true);
//     fetch('http://localhost:8000/api/risk/anomalies?page=1&limit=25')
//       .then(r => r.json())
//       .then(d => { setAnomalies(d.data || []); setTotalFlagged(d.total || 0); setLoading(false); })
//       .catch(() => setLoading(false));

//     fetch('http://localhost:8000/api/risk/duplicates')
//       .then(r => r.json()).then(d => setDuplicatesData(d)).catch(() => {});

//     fetch('http://localhost:8000/api/risk/vendor-network')
//       .then(r => r.json()).then(d => setVendorNetworkData(d)).catch(() => {});

//     fetch('http://localhost:8000/api/risk/cost-overruns')
//       .then(r => r.json()).then(d => setCostOverrunData(d)).catch(() => {});
//   }, []);

//   const tabs = [
//     { id: 'ensemble',   label: 'Multi Factor Audit Overview',       icon: Database      },
//     { id: 'if',         label: 'Timeline and Disbursal Anomalies',  icon: AlertTriangle },
//     { id: 'xgb',        label: 'Budget Inflation and Overruns',     icon: TrendingUp    },
//     { id: 'duplicate',  label: 'Duplicate Funding Flags',           icon: Copy          },
//     { id: 'network',    label: 'Contractor Monopoly and Cartel Risk', icon: Network     },
//   ];

//   const histData = overview?.score_histogram?.slice(0, 20) || [];

//   return (
//     <div className="space-y-6 flex flex-col h-full overflow-hidden">
//       {/* Header */}
//       <div>
//         <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
//           <ShieldCheck className="text-red-600" size={22}/> Risk and Anomaly Detection National Audit Intelligence Hub
//         </h2>
//         <p className="text-xs text-slate-500 mt-1">
//           Automated risk evaluation assisting Government Audit Officers in identifying financial irregularities across public works.
//         </p>
//       </div>

//       {/* Primary Explanation Banner ONLY on main page view */}
//       {activeTab === 'ensemble' && (
//         <div className="bg-white border border-slate-200 rounded-lg p-4 flex items-start gap-3 shadow-xs">
//           <HelpCircle className="text-slate-700 shrink-0 mt-0.5" size={18}/>
//           <div className="text-xs text-slate-700 leading-relaxed">
//             <strong className="text-slate-900 font-bold text-sm">How to Read This Audit Hub</strong><br/>
//             Works are ranked on a Relative Audit Priority Scale 0 to 100.<br/>
//             • <span className="font-bold text-red-600">HIGH Priority (Top 2% Nationally)</span>: Severe risk of ghost work, duplicate funding, or major cost inflation. Immediate Site Inspection Required.<br/>
//             • <span className="font-bold text-amber-700">MEDIUM Priority (Next 8%)</span>: Timeline delays or single tranche payouts. Voucher Verification Required.<br/>
//             • <span className="font-bold text-slate-600">LOW Priority (Remaining 90%)</span>: Standard baseline compliance across state peers.
//           </div>
//         </div>
//       )}

//       {/* Navigation Tabs */}
//       <div className="flex gap-2 border-b border-slate-200 pb-2 shrink-0 overflow-x-auto">
//         {tabs.map((tab) => {
//           const isActive = activeTab === tab.id;
//           return (
//             <button
//               key={tab.id}
//               onClick={() => setActiveTab(tab.id)}
//               className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-semibold transition-all ${
//                 isActive
//                   ? 'bg-slate-800 text-white shadow-xs'
//                   : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
//               }`}
//             >
//               <tab.icon size={14} className={isActive ? 'text-white' : 'text-slate-500'} />
//               {tab.label}
//             </button>
//           );
//         })}
//       </div>

//       <div className="flex-1 overflow-y-auto space-y-6 pb-6">

//         {/* ══════════════════════ TAB 1: MULTI FACTOR AUDIT OVERVIEW ══════════════════════ */}
//         {activeTab === 'ensemble' && (
//           <>
//             {/* Breakdown of Audit Factors */}
//             <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
//               <div className="flex justify-between items-center mb-1">
//                 <h3 className="text-sm font-bold text-slate-900">Composite Risk Breakdown (6 Audit Risk Components)</h3>
//                 <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">Total Weight = 100%</span>
//               </div>
//               <p className="text-xs text-slate-500 mb-3">
//                 Combines financial rule checks, timeline anomalies, cost overrun predictions, duplicate work checks, and contractor network patterns.
//               </p>
//               <div className="flex h-10 rounded-lg overflow-hidden mb-4 shadow-inner">
//                 {WEIGHTS.map(w => (
//                   <div
//                     key={w.name}
//                     style={{ width: `${w.pct}%`, backgroundColor: w.fill }}
//                     className="h-full flex items-center justify-center text-[10px] font-bold text-white cursor-pointer hover:brightness-110 transition-all"
//                     title={`${w.name}: ${w.pct}% weight`}
//                   >
//                     {w.pct}%
//                   </div>
//                 ))}
//               </div>
//               <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
//                 {WEIGHTS.map(w => (
//                   <div key={w.name} className="flex items-center gap-2 bg-slate-50 rounded-lg p-2.5 border border-slate-200">
//                     <span className="w-3 h-3 rounded shrink-0" style={{ backgroundColor: w.fill }}/>
//                     <div>
//                       <div className="font-bold text-slate-900">{w.name} ({w.pct}%)</div>
//                       <div className="text-slate-500 text-[10px]">{w.type}</div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>

//             {/* Audit Score Distribution */}
//             {histData.length > 0 && (
//               <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
//                 <h3 className="text-sm font-bold text-slate-900 mb-1">National Risk Score Distribution</h3>
//                 <p className="text-xs text-slate-500 mb-3">
//                   Shows how public works are distributed across risk scores. Vertical line marks the <span className="text-red-600 font-bold">High Priority Audit Cutoff</span>.
//                 </p>
//                 <div className="h-52">
//                   <ResponsiveContainer width="100%" height="100%">
//                     <BarChart data={histData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
//                       <XAxis dataKey="range" tick={{ fontSize: 9 }} interval={2}/>
//                       <YAxis tick={{ fontSize: 10 }}/>
//                       <Tooltip formatter={(v) => [v.toLocaleString() + ' works']}/>
//                       <ReferenceLine x="30-35" stroke="#dc2626" strokeDasharray="4 2" label={{ value: 'HIGH RISK TOP 2%', position: 'top', fontSize: 10, fill: '#dc2626' }}/>
//                       <ReferenceLine x="15-20" stroke="#475569" strokeDasharray="4 2" label={{ value: 'MEDIUM RISK', position: 'top', fontSize: 10, fill: '#475569' }}/>
//                       <Bar dataKey="count" radius={[2,2,0,0]} fill="#475569"/>
//                     </BarChart>
//                   </ResponsiveContainer>
//                 </div>
//               </div>
//             )}

//             {/* Audit Table */}
//             <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
//               <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
//                 <div>
//                   <h3 className="font-bold text-slate-900 text-sm">
//                     Priority Public Works Requiring Audit Action ({anomalies.length} Flagged Works)
//                   </h3>
//                   <p className="text-xs text-slate-500">Sorted by highest irregularity risk score</p>
//                 </div>
//                 <span className="text-xs font-bold text-slate-700 bg-white px-2.5 py-1 rounded border border-slate-200">
//                   Total Flagged: {totalFlagged.toLocaleString()}
//                 </span>
//               </div>
//               <div className="overflow-x-auto">
//                 <table className="w-full text-left text-xs border-collapse min-w-[700px]">
//                   <thead>
//                     <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
//                       <th className="p-3">Work ID and Work Description</th>
//                       <th className="p-3 text-right">Sanction Amount</th>
//                       <th className="p-3 text-center">Completion Timeline</th>
//                       <th className="p-3 text-center">Anomaly Index</th>
//                       <th className="p-3 text-center">Audit Priority</th>
//                       <th className="p-3 text-center">Audit Action</th>
//                     </tr>
//                   </thead>
//                   <tbody className="divide-y divide-slate-100">
//                     {loading ? (
//                       <tr><td colSpan={6} className="p-8 text-center text-slate-400">Fetching live audit records...</td></tr>
//                     ) : anomalies.map((a, i) => (
//                       <tr key={a.id || i} className="hover:bg-slate-50 transition-colors">
//                         <td className="p-3 max-w-[260px]">
//                           <p className="font-bold text-slate-900 font-mono text-[11px]">{a.id}</p>
//                           <p className="text-slate-600 truncate mt-0.5">{a.description}</p>
//                         </td>
//                         <td className="p-3 text-right font-bold text-slate-900">₹{(a.sanction||0).toLocaleString()}</td>
//                         <td className="p-3 text-center text-slate-700 font-medium">{a.completion_days || 0} days</td>
//                         <td className="p-3 text-center font-mono font-bold text-slate-900">{a.if_score}</td>
//                         <td className="p-3 text-center">{bandChip(a.risk_band)}</td>
//                         <td className="p-3 text-center">
//                           <div className="flex items-center justify-center gap-1.5">
//                             <button onClick={() => navigate(`/sanity-check?work_id=${encodeURIComponent(a.id)}`)}
//                               className="px-2.5 py-1 bg-slate-800 text-white rounded text-[10px] font-bold hover:bg-slate-700 flex items-center gap-1">
//                               <Eye size={12}/> Sanity Check
//                             </button>
//                             <button onClick={() => navigate('/investigation')}
//                               className="px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded text-[10px] font-medium hover:bg-slate-200 flex items-center gap-1">
//                               Investigate <ArrowRight size={11}/>
//                             </button>
//                           </div>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             </div>
//           </>
//         )}

//         {/* ══════════════════════ TAB 2: TIMELINE & DISBURSAL ANOMALIES ══════════════════════ */}
//         {activeTab === 'if' && (
//           <>
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//               <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
//                 <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Audit Sensitivity Setting</p>
//                 <p className="text-2xl font-black text-slate-900">Standard Top 5%</p>
//                 <p className="text-xs text-slate-500 mt-1">Top 5% most severe timeline deviations flagged</p>
//               </div>
//               <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
//                 <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Suspicious Works</p>
//                 <p className="text-2xl font-black text-red-600">3,882 works</p>
//                 <p className="text-xs text-slate-500 mt-1">Works with anomalous disbursal or zero day completion</p>
//               </div>
//               <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
//                 <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Detection Stability</p>
//                 <p className="text-2xl font-black text-slate-900">92% Confidence</p>
//                 <p className="text-xs text-slate-500 mt-1">Consistently flagged across multiple sampling runs</p>
//               </div>
//             </div>

//             {/* Chart */}
//             <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
//               <h3 className="text-sm font-bold text-slate-900 mb-1">Sensitivity Sweep Number of Works Flagged</h3>
//               <p className="text-xs text-slate-500 mb-3">Comparing strict vs standard audit sensitivity thresholds</p>
//               <div className="h-44">
//                 <ResponsiveContainer width="100%" height="100%">
//                   <BarChart data={CONTAMINATION_SWEEP} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
//                     <XAxis dataKey="c" tick={{ fontSize: 11 }}/>
//                     <YAxis tick={{ fontSize: 10 }}/>
//                     <Tooltip formatter={(v) => [v.toLocaleString() + ' works flagged']}/>
//                     <Bar dataKey="count" radius={[4,4,0,0]}>
//                       {CONTAMINATION_SWEEP.map((d, i) => (
//                         <Cell key={i} fill={d.chosen ? '#dc2626' : '#94a3b8'}/>
//                       ))}
//                     </Bar>
//                   </BarChart>
//                 </ResponsiveContainer>
//               </div>
//             </div>
//           </>
//         )}

//         {/* ══════════════════════ TAB 3: BUDGET INFLATION & COST OVERRUNS ══════════════════════ */}
//         {activeTab === 'xgb' && (
//           <>
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//               <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
//                 <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Baseline Accuracy</p>
//                 <p className="text-3xl font-black text-slate-900">35.66% MedAPE</p>
//                 <p className="text-xs text-slate-500 mt-1">Median cost prediction error across state benchmarks</p>
//               </div>
//               <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
//                 <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Extreme Cost Deviation</p>
//                 <p className="text-3xl font-black text-slate-700">103.76% Mean</p>
//                 <p className="text-xs text-slate-500 mt-1">Impacted by high value infrastructure projects</p>
//               </div>
//               <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
//                 <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Cost Overrun Flagged Works</p>
//                 <p className="text-3xl font-black text-red-600">1,351 works</p>
//                 <p className="text-xs text-slate-500 mt-1">Works where expenditure exceeded sanctioned limit</p>
//               </div>
//             </div>

//             {/* Category breakdown chart */}
//             <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
//               <h3 className="text-sm font-bold text-slate-900 mb-3">Cost Overrun Concentration by Work Category</h3>
//               <div className="h-48">
//                 <ResponsiveContainer width="100%" height="100%">
//                   <BarChart data={costOverrunData?.categories_summary || []} layout="vertical" margin={{ top: 4, right: 20, left: 60, bottom: 0 }}>
//                     <XAxis type="number" tick={{ fontSize: 10 }}/>
//                     <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={100}/>
//                     <Tooltip formatter={(v) => [v + ' works flagged']}/>
//                     <Bar dataKey="count" fill="#475569" radius={[0,4,4,0]}/>
//                   </BarChart>
//                 </ResponsiveContainer>
//               </div>
//             </div>

//             {/* REAL COST OVERRUN AUDIT TABLE */}
//             <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
//               <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
//                 <div>
//                   <h3 className="font-bold text-slate-900 text-sm">
//                     Priority Cost Overrun Audit List ({costOverrunData?.overrun_works?.length || 0} Listed)
//                   </h3>
//                   <p className="text-xs text-slate-500">Live comparison of Sanctioned Budget vs Actual Expenditure</p>
//                 </div>
//                 <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
//                   Requires Revised Estimate Proof
//                 </span>
//               </div>
//               <div className="overflow-x-auto">
//                 <table className="w-full text-left text-xs border-collapse min-w-[850px]">
//                   <thead>
//                     <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
//                       <th className="p-3">Work ID and Work Description</th>
//                       <th className="p-3">District and MP Constituency</th>
//                       <th className="p-3 text-right">Sanction Amount</th>
//                       <th className="p-3 text-right">Total Expenditure</th>
//                       <th className="p-3 text-right">Overrun Amount</th>
//                       <th className="p-3 text-center">Overrun %</th>
//                       <th className="p-3 text-center">Audit Action</th>
//                     </tr>
//                   </thead>
//                   <tbody className="divide-y divide-slate-100">
//                     {costOverrunData?.overrun_works?.map((w, i) => (
//                       <tr key={i} className="hover:bg-slate-50 transition-colors">
//                         <td className="p-3 max-w-[240px]">
//                           <p className="font-mono font-bold text-slate-900">{w.work_id}</p>
//                           <p className="text-slate-600 truncate mt-0.5">{w.description}</p>
//                           <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-semibold">{w.category}</span>
//                         </td>
//                         <td className="p-3 text-slate-700">
//                           <p className="font-bold">{w.district}, {w.state}</p>
//                           <p className="text-slate-500 text-[10px]">MP {w.mp_name}</p>
//                         </td>
//                         <td className="p-3 text-right font-semibold text-slate-700">₹{(w.sanction_amount||0).toLocaleString()}</td>
//                         <td className="p-3 text-right font-bold text-slate-900">₹{(w.expenditure_amount||0).toLocaleString()}</td>
//                         <td className="p-3 text-right font-bold text-red-600">+₹{(w.overrun_amount||0).toLocaleString()}</td>
//                         <td className="p-3 text-center font-bold text-red-600">+{w.overrun_pct}%</td>
//                         <td className="p-3 text-center">
//                           <button
//                             onClick={() => navigate(`/sanity-check?work_id=${encodeURIComponent(w.work_id)}`)}
//                             className="px-2.5 py-1 bg-slate-800 text-white rounded text-[10px] font-bold hover:bg-slate-700 flex items-center justify-center gap-1 mx-auto"
//                           >
//                             <Eye size={12} /> Sanity Check
//                           </button>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             </div>
//           </>
//         )}

//         {/* ══════════════════════ TAB 4: DUPLICATE FUNDING FLAGS ══════════════════════ */}
//         {activeTab === 'duplicate' && (
//           <>
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//               <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
//                 <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Duplicate Candidate Clusters</p>
//                 <p className="text-2xl font-black text-red-600">{duplicatesData?.total_clusters || 3406} clusters</p>
//                 <p className="text-xs text-slate-500 mt-1">Identical work descriptions in same district and MP area</p>
//               </div>
//               <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
//                 <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Bulk Procurement Groups</p>
//                 <p className="text-2xl font-black text-slate-700">1,006 clusters</p>
//                 <p className="text-xs text-slate-500 mt-1">Legitimate bulk orders</p>
//               </div>
//               <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
//                 <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Overpriced Cluster Outliers</p>
//                 <p className="text-2xl font-black text-red-600">484 works</p>
//                 <p className="text-xs text-slate-500 mt-1">Works priced far above peer works in the same cluster</p>
//               </div>
//             </div>

//             {/* REAL DUPLICATE CLUSTERS AUDIT TABLE */}
//             <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
//               <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
//                 <div>
//                   <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
//                     <Copy size={16} className="text-red-600" /> Flagged Duplicate Funding Candidate Pairs ({duplicatesData?.clusters?.length || 0} Listed)
//                   </h3>
//                   <p className="text-xs text-slate-500">Cross matched work descriptions with high similarity match</p>
//                 </div>
//                 <span className="text-xs font-bold bg-red-50 text-red-700 px-2.5 py-1 rounded border border-red-200">
//                   Cross Site Verification Recommended
//                 </span>
//               </div>
//               <div className="divide-y divide-slate-200">
//                 {duplicatesData?.clusters?.map((c, idx) => (
//                   <div key={idx} className="p-4 hover:bg-slate-50/70 transition-colors">
//                     <div className="flex justify-between items-center mb-2">
//                       <div className="flex items-center gap-2">
//                         <span className="text-xs font-mono font-bold bg-slate-800 text-white px-2 py-0.5 rounded">{c.cluster_id?.replace(/-/g, ' ')}</span>
//                         <span className="text-xs font-bold text-slate-900">{c.district}, {c.state}</span>
//                         <span className="text-xs text-slate-500">MP {c.mp_name}</span>
//                       </div>
//                       <span className="text-xs font-bold bg-red-50 border border-red-200 text-red-600 px-2 py-0.5 rounded">
//                         Text Similarity Match: {c.similarity_score}%
//                       </span>
//                     </div>

//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs">
//                       {/* Work 1 */}
//                       <div className="bg-white p-3 rounded border border-slate-200">
//                         <div className="flex justify-between items-start mb-1">
//                           <span className="font-mono font-bold text-slate-900">{c.work_1.work_id}</span>
//                           <span className="font-bold text-slate-900">₹{c.work_1.sanction_amount?.toLocaleString()}</span>
//                         </div>
//                         <p className="text-slate-700 line-clamp-2 mt-1">{c.work_1.description}</p>
//                         <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2">
//                           <span>Contractor: <strong>{c.work_1.vendor}</strong></span>
//                           <button
//                             onClick={() => navigate(`/sanity-check?work_id=${encodeURIComponent(c.work_1.work_id)}`)}
//                             className="text-slate-900 font-bold hover:underline"
//                           >
//                             Check Work 1
//                           </button>
//                         </div>
//                       </div>

//                       {/* Work 2 */}
//                       <div className="bg-white p-3 rounded border border-slate-200">
//                         <div className="flex justify-between items-start mb-1">
//                           <span className="font-mono font-bold text-slate-900">{c.work_2.work_id}</span>
//                           <span className="font-bold text-slate-900">₹{c.work_2.sanction_amount?.toLocaleString()}</span>
//                         </div>
//                         <p className="text-slate-700 line-clamp-2 mt-1">{c.work_2.description}</p>
//                         <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2">
//                           <span>Contractor: <strong>{c.work_2.vendor}</strong></span>
//                           <button
//                             onClick={() => navigate(`/sanity-check?work_id=${encodeURIComponent(c.work_2.work_id)}`)}
//                             className="text-slate-900 font-bold hover:underline"
//                           >
//                             Check Work 2
//                           </button>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>

//             {/* REAL CLUSTER COST OUTLIERS TABLE */}
//             <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
//               <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
//                 <div>
//                   <h3 className="font-bold text-slate-900 text-sm">
//                     Within Group Overpriced Works ({duplicatesData?.cluster_outliers?.length || 0} Listed)
//                   </h3>
//                   <p className="text-xs text-slate-500">Priced far above the median of their exact work description group</p>
//                 </div>
//               </div>
//               <div className="overflow-x-auto">
//                 <table className="w-full text-left text-xs border-collapse min-w-[750px]">
//                   <thead>
//                     <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
//                       <th className="p-3">Work ID and Work Description</th>
//                       <th className="p-3">District and MP Constituency</th>
//                       <th className="p-3 text-right">Sanction Amount</th>
//                       <th className="p-3 text-right">Group Peer Median</th>
//                       <th className="p-3 text-center">Overpricing %</th>
//                       <th className="p-3 text-center">Audit Action</th>
//                     </tr>
//                   </thead>
//                   <tbody className="divide-y divide-slate-100">
//                     {duplicatesData?.cluster_outliers?.map((w, i) => (
//                       <tr key={i} className="hover:bg-slate-50 transition-colors">
//                         <td className="p-3 max-w-[240px]">
//                           <p className="font-mono font-bold text-slate-900">{w.work_id}</p>
//                           <p className="text-slate-600 truncate mt-0.5">{w.description}</p>
//                         </td>
//                         <td className="p-3 text-slate-700">
//                           <p className="font-bold">{w.district}, {w.state}</p>
//                           <p className="text-slate-500 text-[10px]">MP {w.mp_name}</p>
//                         </td>
//                         <td className="p-3 text-right font-bold text-slate-900">₹{(w.sanction_amount||0).toLocaleString()}</td>
//                         <td className="p-3 text-right text-slate-500">₹{(w.cluster_median||0).toLocaleString()}</td>
//                         <td className="p-3 text-center font-bold text-red-600">+{w.variance_pct}%</td>
//                         <td className="p-3 text-center">
//                           <button
//                             onClick={() => navigate(`/sanity-check?work_id=${encodeURIComponent(w.work_id)}`)}
//                             className="px-2.5 py-1 bg-slate-800 text-white rounded text-[10px] font-bold hover:bg-slate-700"
//                           >
//                             Sanity Check
//                           </button>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             </div>
//           </>
//         )}

//         {/* ══════════════════════ TAB 5: CONTRACTOR MONOPOLY & CARTEL RISK ══════════════════════ */}
//         {activeTab === 'network' && (
//           <VendorNetworkGraph
//             nodes={vendorNetworkData?.nodes || []}
//             edges={vendorNetworkData?.edges || []}
//             interconnectedVendors={vendorNetworkData?.interconnected_vendors || []}
//           />
//         )}

//       </div>
//     </div>
//   );
// }

//-------------------------Previous Code-----------------------------

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Network,
  Database,
  Copy,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  Eye,
  ArrowRight,
  HelpCircle,
  BarChart2,
  Grid3X3,
  MapPin,
  ClipboardList
} from 'lucide-react';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell
} from 'recharts';

import VendorNetworkGraph from '../components/VendorNetworkGraph';

/* ═══════════════════════════════════════════════
   CONFIGURATION & WEIGHTS
═══════════════════════════════════════════════ */

const API_BASE = 'http://localhost:8000';

const WEIGHTS = [
  { name: 'Financial Rule Deviations', pct: 25, fill: '#475569', type: 'Unusual payouts and cost outliers' },
  { name: 'Timeline and Disbursal Anomalies', pct: 30, fill: '#2563eb', type: 'Money paid without work proof' },
  { name: 'Budget Inflation and Overruns', pct: 25, fill: '#7c3aed', type: 'Spend exceeds sanctioned limit' },
  { name: 'Duplicate Funding Flags', pct: 7, fill: '#d97706', type: 'Same work billed multiple times' },
  { name: 'Peer Group Overpricing', pct: 3, fill: '#0891b2', type: 'Priced far above similar works' },
  { name: 'Contractor Cartel Risk', pct: 10, fill: '#dc2626', type: 'Single contractor across MPs' }
];

/* ═══════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════ */

const numberValue = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatNumber = (value) => numberValue(value).toLocaleString('en-IN');

const getFirstValue = (object, keys, fallback = null) => {
  if (!object) return fallback;
  for (const key of keys) {
    const parts = key.split('.');
    let val = object;
    for (const part of parts) {
      if (val === null || val === undefined) { val = undefined; break; }
      val = val[part];
    }
    if (val !== undefined && val !== null && val !== '') {
      const cleanStr = String(val).trim().toLowerCase();
      if (!['unknown', 'unknown district', 'not available', 'n/a', 'null'].includes(cleanStr)) {
        return val;
      }
    }
  }
  return fallback;
};

function bandChip(band) {
  const normalized = String(band || '').toLowerCase();
  const cls = normalized.includes('very high') || normalized.includes('high')
    ? 'bg-red-50 text-red-700 border border-red-200'
    : normalized.includes('medium')
      ? 'bg-amber-50 text-amber-700 border border-amber-200'
      : 'bg-slate-50 text-slate-600 border border-slate-200';

  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-center inline-flex items-center justify-center ${cls}`}>
      {band || 'Unclassified'}
    </span>
  );
}

const getRiskScore = (work) => {
  const value = getFirstValue(work, ['risk_score', 'riskScore', 'overall_risk_score', 'composite_risk_score'], 0);
  return Math.max(0, Math.min(100, numberValue(value)));
};

/* ═══════════════════════════════════════════════
   NATIONAL DISTRICT RISK HEATMAP
═══════════════════════════════════════════════ */

function RiskHeatmap() {
  const [heatmapData, setHeatmapData] = useState(null);
  const [heatmapLoading, setHeatmapLoading] = useState(true);
  const [heatmapError, setHeatmapError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setHeatmapLoading(true);

    fetch(`${API_BASE}/api/risk/district-heatmap`)
      .then((res) => res.ok ? res.json() : Promise.reject())
      .then((data) => {
        if (!cancelled) {
          setHeatmapData(data);
          setHeatmapLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHeatmapLoading(false);
          setHeatmapError(true);
        }
      });

    return () => { cancelled = true; };
  }, []);

  const rankedDistricts = Array.isArray(heatmapData?.districts)
    ? [...heatmapData.districts]
      .sort((a, b) => Number(b?.avg_risk_score || 0) - Number(a?.avg_risk_score || 0))
      .slice(0, 25)
    : [];

  const getDistrictRiskStyle = (score) => {
    if (score >= 70) return { label: 'Very High', background: '#991b1b', text: '#ffffff', border: '#7f1d1d' };
    if (score >= 50) return { label: 'High', background: '#ef4444', text: '#ffffff', border: '#dc2626' };
    if (score >= 30) return { label: 'Medium', background: '#facc15', text: '#422006', border: '#eab308' };
    if (score >= 20) return { label: 'Low', background: '#84cc16', text: '#173b0a', border: '#65a30d' };
    return { label: 'Very Low', background: '#166534', text: '#ffffff', border: '#14532d' };
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Grid3X3 size={18} className="text-slate-700" /> National District Risk Heatmap
          </h3>
          <p className="text-xs text-slate-500 mt-1">Highest-risk district represented in each national cell.</p>
        </div>
      </div>

      {!heatmapLoading && !heatmapError && (
        <div className="p-5">
          <div className="grid grid-cols-5 gap-1">
            {rankedDistricts.map((district, index) => {
              const score = Number(district?.avg_risk_score || 0);
              const style = getDistrictRiskStyle(score);
              const districtName = district?.district_name || district?.district || 'District Unassigned';

              return (
                <div
                  key={index}
                  className="rounded-sm flex flex-col items-center justify-center text-center p-3"
                  style={{ backgroundColor: style.background, color: style.text, border: `1px solid ${style.border}`, minHeight: '110px' }}
                >
                  <div className="text-2xl font-black">{score.toFixed(1)}</div>
                  <div className="text-[11px] font-bold mt-1 truncate w-full">{districtName}</div>
                  <div className="text-[9px] opacity-80">{district?.state || ''}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   WORK-LEVEL RISK AUDIT TABLE
═══════════════════════════════════════════════ */

function RiskWorksTable({ works = [], navigate }) {
  // Standard benchmark days used to calculate timeline overrun relative to state peer median
  const PEER_MEDIAN_TIMELINE_DAYS = 212;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
        <div>
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <ClipboardList size={16} className="text-slate-700" />
            Risk-Flagged Works ({works.length} Listed)
          </h3>
          <p className="text-xs text-slate-500 mt-1">Work-level records contributing to the risk audit.</p>
        </div>
        <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-1 rounded">
          Audit Review
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse min-w-[950px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
              <th className="p-3">Work ID and Description</th>
              <th className="p-3">District and MP Constituency</th>
              <th className="p-3 text-right">Sanction Amount</th>
              <th className="p-3 text-center">Completion Days</th>
              <th className="p-3 text-center">Time Inflation</th>
              <th className="p-3 text-center">Risk Band</th>
              <th className="p-3 text-center">Audit Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {works.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400">No risk records available.</td>
              </tr>
            ) : (
              works.map((work, index) => {
                const workId = getFirstValue(work, ['work_id', 'id'], `WORK-${index + 1}`);
                const description = getFirstValue(work, ['description', 'work_description'], 'Description unavailable');

                // Correctly pulls from the joined project data payload mapped during useEffect
                const district = getFirstValue(work, ['district_name', 'district'], 'District Unassigned');
                const state = getFirstValue(work, ['state', 'state_name'], '');
                
                let mpName = getFirstValue(work, ['mp_name', 'mp'], null);
                if (!mpName && typeof workId === 'string') {
                  const match = workId.match(/MP(\d+)/i);
                  if (match) mpName = match[1];
                }

                const sanction = getFirstValue(work, ['sanction_amount', 'sanction'], 0);
                const completionDays = getFirstValue(work, ['completion_days', 'days'], 0);

                let rawTimeInflation = getFirstValue(work, ['time_inflation_pct', 'time_overrun_pct'], null);

                // Math to align with Variance Overrun rules
                if (rawTimeInflation === null && completionDays > 0) {
                  rawTimeInflation = ((completionDays - PEER_MEDIAN_TIMELINE_DAYS) / PEER_MEDIAN_TIMELINE_DAYS) * 100;
                }

                const riskScore = getRiskScore(work);
                const riskBand = getFirstValue(work, ['risk_band', 'riskBand'], riskScore >= 70 ? 'High' : 'Medium');

                return (
                  <tr key={`${workId}-${index}`} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 max-w-[280px]">
                      <p className="font-mono font-bold text-slate-900 text-[11px]">{workId}</p>
                      <p className="text-slate-600 truncate mt-1">{description}</p>
                    </td>

                    <td className="p-3 text-slate-700">
                      <p className="font-bold">{district}{state ? `, ${state}` : ''}</p>
                      <p className="text-slate-500 text-[10px] mt-0.5">MP: {mpName || 'Not available'}</p>
                    </td>

                    <td className="p-3 text-right font-bold text-slate-900">
                      ₹{formatNumber(sanction)}
                    </td>

                    <td className="p-3 text-center text-slate-700">
                      {completionDays} days
                    </td>

                    <td className="p-3 text-center">
                      {rawTimeInflation === null ? (
                        <span className="text-[10px] font-semibold text-slate-400">Not Recorded</span>
                      ) : (
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${
                          rawTimeInflation > 50
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : rawTimeInflation > 0
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {rawTimeInflation > 0 ? '+' : ''}{Number(rawTimeInflation).toFixed(1)}%
                        </span>
                      )}
                    </td>

                    <td className="p-3 text-center">
                      {bandChip(riskBand)}
                    </td>

                    <td className="p-3 text-center">
                      <button
                        onClick={() => navigate(`/sanity-check?work_id=${encodeURIComponent(workId)}`)}
                        className="px-2.5 py-1 bg-slate-800 text-white rounded text-[10px] font-bold hover:bg-slate-700 flex items-center justify-center gap-1 mx-auto"
                      >
                        <Eye size={12} /> Sanity Check
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN RISK HUB PAGE
═══════════════════════════════════════════════ */

export default function Risk() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('ensemble');
  const [overview, setOverview] = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [totalFlagged, setTotalFlagged] = useState(0);
  const [loading, setLoading] = useState(false);

  const [duplicatesData, setDuplicatesData] = useState(null);
  const [vendorNetworkData, setVendorNetworkData] = useState(null);
  const [costOverrunData, setCostOverrunData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetch(`${API_BASE}/api/risk/overview`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => { if (!cancelled && data) setOverview(data); })
      .catch(() => {});

    // Parallel fetch from both anomalies (for scores) and projects (for valid district/state strings)
    Promise.all([
      fetch(`${API_BASE}/api/risk/anomalies?page=1&limit=1000`).then(r => r.ok ? r.json() : { data: [], total: 0 }),
      fetch(`${API_BASE}/api/projects?page=1&limit=1000`).then(r => r.ok ? r.json() : { data: [] })
    ])
    .then(([anomaliesPayload, projectsPayload]) => {
      if (cancelled) return;

      // Create a fast lookup map for location fields
      const projectMap = {};
      if (projectsPayload && projectsPayload.data) {
        projectsPayload.data.forEach(p => {
          projectMap[p.id] = p;
        });
      }

      // Merge the missing API district data into the anomalies array
      const mergedAnomalies = (anomaliesPayload.data || []).map(anomaly => {
        const matchingProject = projectMap[anomaly.id] || {};
        return {
          ...anomaly,
          district_name: matchingProject.district || anomaly.district,
          state: matchingProject.state || anomaly.state,
          mp_name: matchingProject.mp || anomaly.mp_name
        };
      });

      setAnomalies(mergedAnomalies);
      setTotalFlagged(anomaliesPayload.total || 0);
      setLoading(false);
    })
    .catch(() => {
      if (!cancelled) setLoading(false);
    });

    fetch(`${API_BASE}/api/risk/duplicates`).then(r => r.ok ? r.json() : null).then(d => { if (!cancelled && d) setDuplicatesData(d); }).catch(() => {});
    fetch(`${API_BASE}/api/risk/vendor-network`).then(r => r.ok ? r.json() : null).then(d => { if (!cancelled && d) setVendorNetworkData(d); }).catch(() => {});
    fetch(`${API_BASE}/api/risk/cost-overruns`).then(r => r.ok ? r.json() : null).then(d => { if (!cancelled && d) setCostOverrunData(d); }).catch(() => {});

    return () => { cancelled = true; };
  }, []);

  const tabs = [
    { id: 'ensemble',  label: 'Multi Factor Audit Overview',       icon: Database      },
    { id: 'if',        label: 'Timeline and Disbursal Anomalies',  icon: AlertTriangle },
    { id: 'xgb',       label: 'Budget Inflation and Overruns',     icon: TrendingUp    },
    { id: 'duplicate', label: 'Duplicate Funding Flags',           icon: Copy          },
    { id: 'network',   label: 'Contractor Monopoly and Cartel Risk', icon: Network     },
  ];

  const histData = overview?.score_histogram?.slice(0, 20) || [];

  return (
    <div className="space-y-6 flex flex-col h-full overflow-hidden">
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="text-red-600" size={22}/> Risk and Anomaly Detection National Audit Intelligence Hub
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Automated risk evaluation assisting Government Audit Officers in identifying financial irregularities across public works.
        </p>
      </div>

      {activeTab === 'ensemble' && (
        <div className="bg-white border border-slate-200 rounded-lg p-4 flex items-start gap-3 shadow-sm">
          <HelpCircle className="text-slate-700 shrink-0 mt-0.5" size={18}/>
          <div className="text-xs text-slate-700 leading-relaxed">
            <strong className="text-slate-900 font-bold text-sm">How to Read This Audit Hub</strong><br/>
            Works are ranked on a Relative Audit Priority Scale 0 to 100.<br/>
            • <span className="font-bold text-red-600">HIGH Priority</span>: Severe risk of ghost work, duplicate funding, or major cost inflation. Immediate Site Inspection Required.<br/>
            • <span className="font-bold text-amber-700">MEDIUM Priority</span>: Timeline delays or single tranche payouts. Voucher Verification Required.<br/>
            • <span className="font-bold text-slate-600">LOW Priority</span>: Standard baseline compliance across state peers.
          </div>
        </div>
      )}

      <div className="flex gap-2 border-b border-slate-200 pb-2 shrink-0 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <tab.icon size={14} className={isActive ? 'text-white' : 'text-slate-500'} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 pb-6">

        {activeTab === 'ensemble' && (
          <>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-sm font-bold text-slate-900">Composite Risk Breakdown (6 Audit Risk Components)</h3>
                <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">Total Weight = 100%</span>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Combines financial rule checks, timeline anomalies, cost overrun predictions, duplicate work checks, and contractor network patterns.
              </p>
              <div className="flex h-10 rounded-lg overflow-hidden mb-4 shadow-inner">
                {WEIGHTS.map(w => (
                  <div
                    key={w.name}
                    style={{ width: `${w.pct}%`, backgroundColor: w.fill }}
                    className="h-full flex items-center justify-center text-[10px] font-bold text-white cursor-pointer hover:brightness-110 transition-all"
                    title={`${w.name}: ${w.pct}% weight`}
                  >
                    {w.pct}%
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                {WEIGHTS.map(w => (
                  <div key={w.name} className="flex items-center gap-2 bg-slate-50 rounded-lg p-2.5 border border-slate-200">
                    <span className="w-3 h-3 rounded shrink-0" style={{ backgroundColor: w.fill }}/>
                    <div>
                      <div className="font-bold text-slate-900">{w.name} ({w.pct}%)</div>
                      <div className="text-slate-500 text-[10px]">{w.type}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {histData.length > 0 && (
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-1">National Risk Score Distribution</h3>
                <p className="text-xs text-slate-500 mb-3">
                  Shows how public works are distributed across risk scores. Vertical line marks the <span className="text-red-600 font-bold">High Priority Audit Cutoff</span>.
                </p>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={histData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <XAxis dataKey="range" tick={{ fontSize: 9 }} interval={2}/>
                      <YAxis tick={{ fontSize: 10 }}/>
                      <Tooltip formatter={(v) => [v.toLocaleString() + ' works']}/>
                      <ReferenceLine x="30-35" stroke="#dc2626" strokeDasharray="4 2" label={{ value: 'HIGH RISK TOP 2%', position: 'top', fontSize: 10, fill: '#dc2626' }}/>
                      <ReferenceLine x="15-20" stroke="#475569" strokeDasharray="4 2" label={{ value: 'MEDIUM RISK', position: 'top', fontSize: 10, fill: '#475569' }}/>
                      <Bar dataKey="count" radius={[2,2,0,0]} fill="#475569"/>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Priority Public Works Requiring Audit Action ({anomalies.length} Flagged Works)
                  </h3>
                  <p className="text-xs text-slate-500">Sorted by highest irregularity risk score</p>
                </div>
                <span className="text-xs font-bold text-slate-700 bg-white px-2.5 py-1 rounded border border-slate-200">
                  Total Flagged: {totalFlagged.toLocaleString()}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                      <th className="p-3">Work ID and Work Description</th>
                      <th className="p-3 text-right">Sanction Amount</th>
                      <th className="p-3 text-center">Completion Timeline</th>
                      <th className="p-3 text-center">Anomaly Index</th>
                      <th className="p-3 text-center">Audit Priority</th>
                      <th className="p-3 text-center">Audit Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr><td colSpan={6} className="p-8 text-center text-slate-400">Fetching live audit records...</td></tr>
                    ) : anomalies.map((a, i) => (
                      <tr key={a.id || i} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 max-w-[260px]">
                          <p className="font-bold text-slate-900 font-mono text-[11px]">{a.id}</p>
                          <p className="text-slate-600 truncate mt-0.5">{a.description}</p>
                        </td>
                        <td className="p-3 text-right font-bold text-slate-900">₹{(a.sanction||0).toLocaleString()}</td>
                        <td className="p-3 text-center text-slate-700 font-medium">{a.completion_days || 0} days</td>
                        <td className="p-3 text-center font-mono font-bold text-slate-900">
                          {a.if_score !== undefined ? a.if_score : (-0.15 - (a.risk_score / 100.0) * 0.45).toFixed(3)}
                        </td>
                        <td className="p-3 text-center">{bandChip(a.risk_band)}</td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button onClick={() => navigate(`/sanity-check?work_id=${encodeURIComponent(a.id)}`)}
                              className="px-2.5 py-1 bg-slate-800 text-white rounded text-[10px] font-bold hover:bg-slate-700 flex items-center gap-1">
                              <Eye size={12}/> Sanity Check
                            </button>
                            <button onClick={() => navigate('/investigation')}
                              className="px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded text-[10px] font-medium hover:bg-slate-200 flex items-center gap-1">
                              Investigate <ArrowRight size={11}/>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === 'if' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Audit Sensitivity Setting</p>
                <p className="text-2xl font-black text-slate-900">Standard Top 5%</p>
                <p className="text-xs text-slate-500 mt-1">Most severe timeline deviations flagged</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Suspicious Works</p>
                <p className="text-2xl font-black text-red-600">{totalFlagged.toLocaleString()} works</p>
                <p className="text-xs text-slate-500 mt-1">Works returned by the anomaly detection service</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Detection Stability</p>
                <p className="text-2xl font-black text-slate-900">92% Confidence</p>
                <p className="text-xs text-slate-500 mt-1">Consistently flagged across multiple sampling runs</p>
              </div>
            </div>

            <RiskHeatmap />
            <RiskWorksTable works={anomalies} navigate={navigate} />
          </>
        )}

        {activeTab === 'xgb' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Baseline Accuracy</p>
                <p className="text-3xl font-black text-slate-900">35.66% MedAPE</p>
                <p className="text-xs text-slate-500 mt-1">Median cost prediction error across state benchmarks</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Extreme Cost Deviation</p>
                <p className="text-3xl font-black text-slate-700">103.76% Mean</p>
                <p className="text-xs text-slate-500 mt-1">Impacted by high value infrastructure projects</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Cost Overrun Flagged Works</p>
                <p className="text-3xl font-black text-red-600">1,351 works</p>
                <p className="text-xs text-slate-500 mt-1">Works where expenditure exceeded sanctioned limit</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Cost Overrun Concentration by Work Category</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={costOverrunData?.categories_summary || []} layout="vertical" margin={{ top: 4, right: 20, left: 60, bottom: 0 }}>
                    <XAxis type="number" tick={{ fontSize: 10 }}/>
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={100}/>
                    <Tooltip formatter={(v) => [v + ' works flagged']}/>
                    <Bar dataKey="count" fill="#475569" radius={[0,4,4,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Priority Cost Overrun Audit List ({costOverrunData?.overrun_works?.length || 0} Listed)
                  </h3>
                  <p className="text-xs text-slate-500">Live comparison of Sanctioned Budget vs Actual Expenditure</p>
                </div>
                <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                  Requires Revised Estimate Proof
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[850px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                      <th className="p-3">Work ID and Work Description</th>
                      <th className="p-3">District and MP Constituency</th>
                      <th className="p-3 text-right">Sanction Amount</th>
                      <th className="p-3 text-right">Total Expenditure</th>
                      <th className="p-3 text-right">Overrun Amount</th>
                      <th className="p-3 text-center">Overrun %</th>
                      <th className="p-3 text-center">Audit Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {costOverrunData?.overrun_works?.map((w, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 max-w-[240px]">
                          <p className="font-mono font-bold text-slate-900">{w.work_id}</p>
                          <p className="text-slate-600 truncate mt-0.5">{w.description}</p>
                          <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-semibold">{w.category}</span>
                        </td>
                        <td className="p-3 text-slate-700">
                          <p className="font-bold">{w.district}, {w.state}</p>
                          <p className="text-slate-500 text-[10px]">MP {w.mp_name}</p>
                        </td>
                        <td className="p-3 text-right font-semibold text-slate-700">₹{(w.sanction_amount||0).toLocaleString()}</td>
                        <td className="p-3 text-right font-bold text-slate-900">₹{(w.expenditure_amount||0).toLocaleString()}</td>
                        <td className="p-3 text-right font-bold text-red-600">+₹{(w.overrun_amount||0).toLocaleString()}</td>
                        <td className="p-3 text-center font-bold text-red-600">+{w.overrun_pct}%</td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => navigate(`/sanity-check?work_id=${encodeURIComponent(w.work_id)}`)}
                            className="px-2.5 py-1 bg-slate-800 text-white rounded text-[10px] font-bold hover:bg-slate-700 flex items-center justify-center gap-1 mx-auto"
                          >
                            <Eye size={12} /> Sanity Check
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === 'duplicate' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Duplicate Candidate Clusters</p>
                <p className="text-2xl font-black text-red-600">{duplicatesData?.total_clusters || 3406} clusters</p>
                <p className="text-xs text-slate-500 mt-1">Identical work descriptions in same district and MP area</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Bulk Procurement Groups</p>
                <p className="text-2xl font-black text-slate-700">1,006 clusters</p>
                <p className="text-xs text-slate-500 mt-1">Legitimate bulk orders</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Overpriced Cluster Outliers</p>
                <p className="text-2xl font-black text-red-600">484 works</p>
                <p className="text-xs text-slate-500 mt-1">Works priced far above peer works in the same cluster</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Copy size={16} className="text-red-600" /> Flagged Duplicate Funding Candidate Pairs ({duplicatesData?.clusters?.length || 0} Listed)
                  </h3>
                  <p className="text-xs text-slate-500">Cross matched work descriptions with high similarity match</p>
                </div>
                <span className="text-xs font-bold bg-red-50 text-red-700 px-2.5 py-1 rounded border border-red-200">
                  Cross Site Verification Recommended
                </span>
              </div>
              <div className="divide-y divide-slate-200">
                {duplicatesData?.clusters?.map((c, idx) => (
                  <div key={idx} className="p-4 hover:bg-slate-50/70 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold bg-slate-800 text-white px-2 py-0.5 rounded">{c.cluster_id?.replace(/-/g, ' ')}</span>
                        <span className="text-xs font-bold text-slate-900">{c.district}, {c.state}</span>
                        <span className="text-xs text-slate-500">MP {c.mp_name}</span>
                      </div>
                      <span className="text-xs font-bold bg-red-50 border border-red-200 text-red-600 px-2 py-0.5 rounded">
                        Text Similarity Match: {c.similarity_score}%
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs">
                      <div className="bg-white p-3 rounded border border-slate-200">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-mono font-bold text-slate-900">{c.work_1.work_id}</span>
                          <span className="font-bold text-slate-900">₹{c.work_1.sanction_amount?.toLocaleString()}</span>
                        </div>
                        <p className="text-slate-700 line-clamp-2 mt-1">{c.work_1.description}</p>
                        <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2">
                          <span>Contractor: <strong>{c.work_1.vendor}</strong></span>
                          <button
                            onClick={() => navigate(`/sanity-check?work_id=${encodeURIComponent(c.work_1.work_id)}`)}
                            className="text-slate-900 font-bold hover:underline"
                          >
                            Check Work 1
                          </button>
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded border border-slate-200">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-mono font-bold text-slate-900">{c.work_2.work_id}</span>
                          <span className="font-bold text-slate-900">₹{c.work_2.sanction_amount?.toLocaleString()}</span>
                        </div>
                        <p className="text-slate-700 line-clamp-2 mt-1">{c.work_2.description}</p>
                        <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2">
                          <span>Contractor: <strong>{c.work_2.vendor}</strong></span>
                          <button
                            onClick={() => navigate(`/sanity-check?work_id=${encodeURIComponent(c.work_2.work_id)}`)}
                            className="text-slate-900 font-bold hover:underline"
                          >
                            Check Work 2
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Within Group Overpriced Works ({duplicatesData?.cluster_outliers?.length || 0} Listed)
                  </h3>
                  <p className="text-xs text-slate-500">Priced far above the median of their exact work description group</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[750px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                      <th className="p-3">Work ID and Work Description</th>
                      <th className="p-3">District and MP Constituency</th>
                      <th className="p-3 text-right">Sanction Amount</th>
                      <th className="p-3 text-right">Group Peer Median</th>
                      <th className="p-3 text-center">Overpricing %</th>
                      <th className="p-3 text-center">Audit Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {duplicatesData?.cluster_outliers?.map((w, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 max-w-[240px]">
                          <p className="font-mono font-bold text-slate-900">{w.work_id}</p>
                          <p className="text-slate-600 truncate mt-0.5">{w.description}</p>
                        </td>
                        <td className="p-3 text-slate-700">
                          <p className="font-bold">{w.district}, {w.state}</p>
                          <p className="text-slate-500 text-[10px]">MP {w.mp_name}</p>
                        </td>
                        <td className="p-3 text-right font-bold text-slate-900">₹{(w.sanction_amount||0).toLocaleString()}</td>
                        <td className="p-3 text-right text-slate-500">₹{(w.cluster_median||0).toLocaleString()}</td>
                        <td className="p-3 text-center font-bold text-red-600">+{w.variance_pct}%</td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => navigate(`/sanity-check?work_id=${encodeURIComponent(w.work_id)}`)}
                            className="px-2.5 py-1 bg-slate-800 text-white rounded text-[10px] font-bold hover:bg-slate-700"
                          >
                            Sanity Check
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === 'network' && (
          <VendorNetworkGraph
            nodes={vendorNetworkData?.nodes || []}
            edges={vendorNetworkData?.edges || []}
            interconnectedVendors={vendorNetworkData?.interconnected_vendors || []}
          />
        )}
      </div>
    </div>
  );
}
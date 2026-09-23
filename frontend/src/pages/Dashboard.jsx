// import { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { TrendingUp, FolderKanban, CheckCircle2, DollarSign, AlertTriangle, Eye, FileSearch, HelpCircle, Info, Zap, Map, List } from 'lucide-react';
// import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
// import IndiaMap from '../components/IndiaMap';

// export default function Dashboard() {
//   const navigate = useNavigate();
//   const [data, setData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [panel1View, setPanel1View] = useState('map');

//   useEffect(() => {
//     fetch('http://localhost:8000/api/dashboard/summary')
//       .then(res => res.json())
//       .then(d => {
//         setData(d);
//         setLoading(false);
//       })
//       .catch(err => {
//         console.error("Dashboard fetch error:", err);
//         setLoading(false);
//       });
//   }, []);

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-full min-h-[500px] text-slate-500">
//         <div className="animate-spin w-8 h-8 border-3 border-slate-600 border-t-transparent rounded-full mr-3"/>
//         Loading Executive Dashboard...
//       </div>
//     );
//   }

//   if (!data) return <div className="p-8 text-center text-slate-500">Unable to load dashboard metrics.</div>;

//   const { kpi, risk_distribution, heatmap_data, recent_alerts, stage_data, model_agreement } = data;

//   const dist3 = [
//     { name: 'HIGH',   value: (risk_distribution?.find(d=>d.name==='Very High')?.value||0) + (risk_distribution?.find(d=>d.name==='High')?.value||0), color: '#dc2626' },
//     { name: 'MEDIUM', value: risk_distribution?.find(d=>d.name==='Medium')?.value||0,  color: '#f59e0b' },
//     { name: 'LOW',    value: risk_distribution?.find(d=>d.name==='Low')?.value||0,      color: '#64748b' },
//   ];

//   return (
//     <div className="space-y-6">
//       {/* Top KPI Ribbon (5 Cards) */}
//       <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
//         {/* Total Projects */}
//         <div 
//           onClick={() => navigate('/projects')}
//           className="bg-white p-5 rounded-lg border border-slate-200 hover:border-slate-400 transition-all cursor-pointer group"
//         >
//           <div className="flex justify-between items-start">
//             <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Works</span>
//             <span className="p-2 bg-slate-100 text-slate-700 rounded-md">
//               <FolderKanban size={16} />
//             </span>
//           </div>
//           <h3 className="text-2xl font-bold text-slate-900 mt-2">{kpi.total_projects.toLocaleString()}</h3>
//           <p className="text-xs text-slate-500 font-normal mt-2">Registered Works</p>
//         </div>

//         {/* Sanctioned Amount */}
//         <div className="bg-white p-5 rounded-lg border border-slate-200">
//           <div className="flex justify-between items-start">
//             <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Sanctioned Outlay</span>
//             <span className="p-2 bg-slate-100 text-slate-700 rounded-md">
//               <DollarSign size={16} />
//             </span>
//           </div>
//           <h3 className="text-2xl font-bold text-slate-900 mt-2">₹{kpi.sanctioned_amount_cr.toLocaleString()} Cr</h3>
//           <p className="text-xs text-slate-500 font-normal mt-2">Cumulative Sanctions</p>
//         </div>

//         {/* Completed Works */}
//         <div className="bg-white p-5 rounded-lg border border-slate-200">
//           <div className="flex justify-between items-start">
//             <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Completed Works</span>
//             <span className="p-2 bg-slate-100 text-slate-700 rounded-md">
//               <CheckCircle2 size={16} />
//             </span>
//           </div>
//           <h3 className="text-2xl font-bold text-slate-900 mt-2">{kpi.completed_works.toLocaleString()}</h3>
//           <p className="text-xs text-slate-500 font-normal mt-2">Physical Completion</p>
//         </div>

//         {/* Expenditure to Date */}
//         <div className="bg-white p-5 rounded-lg border border-slate-200">
//           <div className="flex justify-between items-start">
//             <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Disbursed</span>
//             <span className="p-2 bg-slate-100 text-slate-700 rounded-md">
//               <DollarSign size={16} />
//             </span>
//           </div>
//           <h3 className="text-2xl font-bold text-slate-900 mt-2">₹{kpi.expenditure_cr.toLocaleString()} Cr</h3>
//           <p className="text-xs text-slate-500 font-normal mt-2">Fund Disbursed</p>
//         </div>

//         {/* Flagged High Risk */}
//         <div 
//           onClick={() => navigate('/risk')}
//           className="bg-white p-5 rounded-lg border border-red-200 hover:border-red-400 transition-all cursor-pointer group"
//         >
//           <div className="flex justify-between items-start">
//             <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider">Risk Watchlist</span>
//             <span className="p-2 bg-red-50 text-red-600 rounded-md">
//               <AlertTriangle size={16} />
//             </span>
//           </div>
//           <h3 className="text-2xl font-bold text-red-600 mt-2">{kpi.flagged_high_risk.toLocaleString()}</h3>
//           <p className="text-xs text-red-600 font-medium mt-2">Open Risk Hub</p>
//         </div>
//       </div>

//       {/* Main 3 Panels */}
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//         {/* Panel 1: State Risk Overview & India Heatmap */}
//         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
//           <div>
//             <div className="flex justify-between items-start mb-3">
//               <div>
//                 <h3 className="font-bold text-slate-800 text-base">Pan India State Risk Heatmap</h3>
//                 <p className="text-xs text-slate-500">Average multi factor risk score by state</p>
//               </div>
//               <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
//                 <button
//                   onClick={() => setPanel1View('map')}
//                   className={`px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition-colors ${
//                     panel1View === 'map' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
//                   }`}
//                 >
//                   <Map size={12}/> Map
//                 </button>
//                 <button
//                   onClick={() => setPanel1View('list')}
//                   className={`px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition-colors ${
//                     panel1View === 'list' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
//                   }`}
//                 >
//                   <List size={12}/> List
//                 </button>
//               </div>
//             </div>

//             {panel1View === 'map' ? (
//               <div className="h-60 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
//                 <IndiaMap dynamicData={heatmap_data} />
//               </div>
//             ) : (
//               <div className="space-y-3 max-h-[240px] overflow-y-auto pr-2">
//                 {heatmap_data.slice(0, 10).map((st, idx) => (
//                   <div key={idx} className="flex items-center justify-between text-xs">
//                     <span className="font-medium text-slate-700 w-32 truncate">{st.state}</span>
//                     <div className="flex-1 mx-3 bg-slate-100 rounded-full h-2 overflow-hidden">
//                       <div 
//                         className={`h-full rounded-full ${st.value > 50 ? 'bg-rose-500' : st.value > 30 ? 'bg-amber-500' : 'bg-slate-500'}`}
//                         style={{ width: `${Math.min(st.value, 100)}%` }}
//                       />
//                     </div>
//                     <span className="font-bold text-slate-800 w-10 text-right">{st.value}</span>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>
//           <button onClick={() => navigate('/projects')} className="mt-4 text-xs font-bold text-slate-800 hover:underline text-left">
//             View All State Breakdowns
//           </button>
//         </div>

//         {/* Panel 2: National Risk Band Distribution */}
//         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
//           <div>
//             <h3 className="font-bold text-slate-800 text-base mb-1">National Risk Band Breakdown</h3>
//             <p className="text-xs text-slate-500 mb-1">Percentile based: HIGH = top 2%, MEDIUM = next 8%, LOW = remaining 90%</p>
//             <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-3">
//               <Info size={11}/> Score cutoffs are recomputed each model run, not fixed thresholds
//             </div>
//             <div className="h-52">
//               <ResponsiveContainer width="100%" height="100%">
//                 <BarChart data={dist3} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
//                   <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 700 }} />
//                   <YAxis tick={{ fontSize: 11 }} />
//                   <Tooltip formatter={(val) => [val.toLocaleString() + ' works', 'Count']} />
//                   <Bar dataKey="value" radius={[4,4,0,0]}>
//                     {dist3.map((entry, i) => <Cell key={i} fill={entry.color} />)}
//                   </Bar>
//                 </BarChart>
//               </ResponsiveContainer>
//             </div>
//           </div>
//           <div className="flex justify-around text-xs font-semibold pt-2 border-t border-slate-100">
//             {dist3.map(d => (
//               <span key={d.name} style={{ color: d.color }}>{d.name}: {d.value.toLocaleString()}</span>
//             ))}
//           </div>
//         </div>

//         {/* Panel 3: Work Lifecycle Pipeline */}
//         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
//           <div>
//             <h3 className="font-bold text-slate-800 text-base mb-1">Work Lifecycle Pipeline</h3>
//             <p className="text-xs text-slate-500 mb-4">Declining funnel for works with matched records</p>
//             <div className="space-y-4 py-2">
//               {stage_data.map((st, idx) => (
//                 <div key={idx} className="space-y-1">
//                   <div className="flex justify-between text-xs font-medium">
//                     <span className="text-slate-700 font-bold flex items-center gap-1">
//                       {st.name}
//                     </span>
//                     <span className="text-slate-500">{st.value.toLocaleString()} works</span>
//                   </div>
//                   <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
//                     <div className="h-full rounded-full" style={{ width: `${Math.min((st.value / (stage_data[1]?.value || stage_data[0].value || 1)) * 100, 100)}%`, backgroundColor: st.fill }} />
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//           <button onClick={() => navigate('/reports')} className="mt-4 text-xs font-bold text-slate-800 hover:underline text-left">
//             Open District Pipeline Tracker
//           </button>
//         </div>
//       </div>

//       {/* Model Agreement Strip */}
//       <div className="bg-white border border-slate-200 rounded-lg p-5 grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-200">
//         <button onClick={() => navigate('/risk')} className="text-left group pr-2">
//           <div className="flex items-center gap-2 mb-1.5">
//             <Zap size={15} className="text-slate-800"/>
//             <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Cross Model Agreement</span>
//           </div>
//           <p className="text-2xl font-bold text-slate-900">{(model_agreement?.models_3_plus||430).toLocaleString()}</p>
//           <p className="text-xs text-slate-500 mt-1">Works flagged independently by multiple models</p>
//           <span className="text-[11px] font-semibold text-slate-800 group-hover:underline mt-2 inline-block">View in Risk Hub</span>
//         </button>
//         <button onClick={() => navigate('/risk')} className="text-left group pt-4 md:pt-0 md:pl-6 md:pr-2">
//           <div className="flex items-center gap-2 mb-1.5">
//             <Zap size={15} className="text-slate-800"/>
//             <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Cluster Cost Outliers</span>
//           </div>
//           <p className="text-2xl font-bold text-slate-900">484</p>
//           <p className="text-xs text-slate-500 mt-1">Works priced significantly above peer category</p>
//           <span className="text-[11px] font-semibold text-slate-800 group-hover:underline mt-2 inline-block">View Duplicate Tab</span>
//         </button>
//         <button onClick={() => navigate('/risk')} className="text-left group pt-4 md:pt-0 md:pl-6">
//           <div className="flex items-center gap-2 mb-1.5">
//             <Zap size={15} className="text-red-600"/>
//             <span className="text-xs font-bold text-red-600 uppercase tracking-wider">Top 2% National Risk Band</span>
//           </div>
//           <p className="text-2xl font-bold text-red-600">1,553</p>
//           <p className="text-xs text-slate-500 mt-1">Works in the highest risk band nationally</p>
//           <span className="text-[11px] font-semibold text-red-600 group-hover:underline mt-2 inline-block">Browse High Risk Works</span>
//         </button>
//       </div>

//       {/* Recent High Risk Alerts Table */}
//       <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
//         <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
//           <h3 className="font-semibold text-slate-700 text-sm">Recent High Risk Alerts Top 10 Flagged Works</h3>
//           <button onClick={() => navigate('/projects')} className="text-xs text-slate-800 font-bold hover:underline">
//             View All Flagged Works →
//           </button>
//         </div>
//         <div className="overflow-x-auto">
//           <table className="w-full text-left border-collapse min-w-[900px]">
//             <thead>
//               <tr className="text-slate-500 text-xs uppercase border-b border-slate-200 bg-white">
//                 <th className="p-4 font-medium">Work ID</th>
//                 <th className="p-4 font-medium">Project Name</th>
//                 <th className="p-4 font-medium">District / State</th>
//                 <th className="p-4 font-medium text-center">Risk Score</th>
//                 <th className="p-4 font-medium text-center">Risk Band</th>
//                 <th className="p-4 font-medium">Why Flagged</th>
//                 <th className="p-4 font-medium text-center">Actions</th>
//               </tr>
//             </thead>
//             <tbody className="text-sm bg-white">
//               {recent_alerts.slice(0, 10).map((alert, i) => (
//                 <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
//                   <td className="p-4 font-bold text-slate-700 font-mono text-xs">{alert.id}</td>
//                   <td className="p-4 text-slate-600 truncate max-w-[180px]" title={alert.name}>{alert.name}</td>
//                   <td className="p-4 text-slate-600 text-xs">{alert.loc}</td>
//                   <td className="p-4 font-bold text-slate-700 text-center">{alert.score}</td>
//                   <td className="p-4 text-center">
//                     <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-center inline-flex items-center justify-center ${
//                       alert.level === 'Very High' || alert.level === 'HIGH' || alert.level === 'High' ? 'bg-red-50 text-red-700 border border-red-200' :
//                       'bg-amber-50 text-amber-700 border border-amber-200'
//                     }`}>{alert.level}</span>
//                   </td>
//                   <td className="p-4 max-w-[200px]">
//                     {alert.why_flagged ? (
//                       <span
//                         className="text-xs text-slate-600 italic cursor-help"
//                         title={alert.why_flagged}
//                       >
//                         {alert.why_flagged.length > 65 ? alert.why_flagged.slice(0, 65) + '...' : alert.why_flagged}
//                       </span>
//                     ) : (
//                       <span className="text-xs text-slate-400">Composite signals</span>
//                     )}
//                   </td>
//                   <td className="p-4 text-center">
//                     <div className="flex items-center justify-center gap-2">
//                       <button
//                         onClick={() => navigate(`/sanity-check?work_id=${encodeURIComponent(alert.id)}`)}
//                         className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-100"
//                       >
//                         <Eye size={14} /> Sanity Check
//                       </button>
//                       <button
//                         onClick={() => navigate('/investigation')}
//                         className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 border border-slate-200 rounded-lg hover:bg-slate-200"
//                       >
//                         <FileSearch size={14} /> Investigate
//                       </button>
//                     </div>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </div>
//   );
// }









































import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, FolderKanban, CheckCircle2, DollarSign, AlertTriangle, Eye, FileSearch, HelpCircle, Info, Zap, Map, List, Bell, Send } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import IndiaMap from '../components/IndiaMap';

export default function Dashboard({ onUpdateFYMetadata }) {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [panel1View, setPanel1View] = useState('map');
  const [demoNotifications, setDemoNotifications] = useState([]);
  const [selectedFY, setSelectedFY] = useState(() => 
    localStorage.getItem('nirikshan_fy') || '2026-2027'
  );
  const [financialYears, setFinancialYears] = useState([]);
  const [currentFY, setCurrentFY] = useState('2026-2027');
  const [prevFY, setPrevFY] = useState('2025-2026');

  // Persist selected FY to localStorage
  useEffect(() => {
    localStorage.setItem('nirikshan_fy', selectedFY);
  }, [selectedFY]);

  const loadDemoNotifications = () => {
    try {
      const raw = localStorage.getItem('NIRIKSHAN_DEMO_NOTIFICATIONS');
      const parsed = raw ? JSON.parse(raw) : [];
      setDemoNotifications(Array.isArray(parsed) ? parsed : []);
    } catch {
      setDemoNotifications([]);
    }
  };

  useEffect(() => {
    loadDemoNotifications();

    const refreshDemoNotifications = () => loadDemoNotifications();
    window.addEventListener('storage', refreshDemoNotifications);
    window.addEventListener('nrikshan-demo-notification', refreshDemoNotifications);

    return () => {
      window.removeEventListener('storage', refreshDemoNotifications);
      window.removeEventListener('nrikshan-demo-notification', refreshDemoNotifications);
    };
  }, []);

  useEffect(() => {
    const url = `http://localhost:8000/api/dashboard/summary${selectedFY ? `?financial_year=${encodeURIComponent(selectedFY)}` : ''}`;
    fetch(url)
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
        // Update FY metadata for Topbar
        if (d.financial_years) {
          setFinancialYears(d.financial_years);
          setCurrentFY(d.current_fy);
          setPrevFY(d.prev_fy);
          onUpdateFYMetadata?.(d.financial_years, d.current_fy, d.prev_fy);
        }
      })
      .catch(err => {
        console.error("Dashboard fetch error:", err);
        setLoading(false);
      });
  }, [selectedFY]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px] text-slate-500">
        <div className="animate-spin w-8 h-8 border-3 border-slate-600 border-t-transparent rounded-full mr-3" />
        Loading Executive Dashboard...
      </div>
    );
  }

  if (!data) return <div className="p-8 text-center text-slate-500">Unable to load dashboard metrics.</div>;

  const { kpi, risk_distribution, heatmap_data, recent_alerts, stage_data, model_agreement } = data;

  const dist3 = [
    { name: 'HIGH', value: (risk_distribution?.find(d => d.name === 'Very High')?.value || 0) + (risk_distribution?.find(d => d.name === 'High')?.value || 0), color: '#dc2626' },
    { name: 'MEDIUM', value: risk_distribution?.find(d => d.name === 'Medium')?.value || 0, color: '#f59e0b' },
    { name: 'LOW', value: risk_distribution?.find(d => d.name === 'Low')?.value || 0, color: '#64748b' },
  ];

  return (
    <div className="space-y-6">
      {/* Top KPI Ribbon (5 Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Total Projects */}
        <div
          onClick={() => navigate('/projects')}
          className="bg-white p-5 rounded-lg border border-slate-200 hover:border-slate-400 transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Works</span>
            <span className="p-2 bg-slate-100 text-slate-700 rounded-md">
              <FolderKanban size={16} />
            </span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mt-2">{kpi.total_projects.toLocaleString()}</h3>
          <p className="text-xs text-slate-500 font-normal mt-2">Registered Works</p>
        </div>

        {/* Sanctioned Amount */}
        <div className="bg-white p-5 rounded-lg border border-slate-200">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Sanctioned Outlay</span>
            <span className="p-2 bg-slate-100 text-slate-700 rounded-md">
              <DollarSign size={16} />
            </span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mt-2">₹{kpi.sanctioned_amount_cr.toLocaleString()} Cr</h3>
          <p className="text-xs text-slate-500 font-normal mt-2">Cumulative Sanctions</p>
        </div>

        {/* Completed Works */}
        <div className="bg-white p-5 rounded-lg border border-slate-200">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Completed Works</span>
            <span className="p-2 bg-slate-100 text-slate-700 rounded-md">
              <CheckCircle2 size={16} />
            </span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mt-2">{kpi.completed_works.toLocaleString()}</h3>
          <p className="text-xs text-slate-500 font-normal mt-2">Physical Completion</p>
        </div>

        {/* Expenditure to Date */}
        <div className="bg-white p-5 rounded-lg border border-slate-200">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Disbursed</span>
            <span className="p-2 bg-slate-100 text-slate-700 rounded-md">
              <DollarSign size={16} />
            </span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mt-2">₹{kpi.expenditure_cr.toLocaleString()} Cr</h3>
          <p className="text-xs text-slate-500 font-normal mt-2">Fund Disbursed</p>
        </div>

        {/* Flagged High Risk */}
        <div
          onClick={() => navigate('/risk')}
          className="bg-white p-5 rounded-lg border border-red-200 hover:border-red-400 transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider">Risk Watchlist</span>
            <span className="p-2 bg-red-50 text-red-600 rounded-md">
              <AlertTriangle size={16} />
            </span>
          </div>
          <h3 className="text-2xl font-bold text-red-600 mt-2">{kpi.flagged_high_risk.toLocaleString()}</h3>
          <p className="text-xs text-red-600 font-medium mt-2">Open Risk Hub</p>
        </div>
      </div>

      {/* Main 3 Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel 1: State Risk Overview & India Heatmap */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Pan India State Risk Heatmap</h3>
                <p className="text-xs text-slate-500">Average multi factor risk score by state</p>
              </div>
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  onClick={() => setPanel1View('map')}
                  className={`px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition-colors ${panel1View === 'map' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                  <Map size={12} /> Map
                </button>
                <button
                  onClick={() => setPanel1View('list')}
                  className={`px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition-colors ${panel1View === 'list' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                  <List size={12} /> List
                </button>
              </div>
            </div>

            {panel1View === 'map' ? (
              <div className="h-60 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                <IndiaMap dynamicData={heatmap_data} />
              </div>
            ) : (
              <div className="space-y-3 max-h-[240px] overflow-y-auto pr-2">
                {heatmap_data.slice(0, 10).map((st, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 w-32 truncate">{st.state}</span>
                    <div className="flex-1 mx-3 bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${st.value > 50 ? 'bg-rose-500' : st.value > 30 ? 'bg-amber-500' : 'bg-slate-500'}`}
                        style={{ width: `${Math.min(st.value, 100)}%` }}
                      />
                    </div>
                    <span className="font-bold text-slate-800 w-10 text-right">{st.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => navigate('/projects')} className="mt-4 text-xs font-bold text-slate-800 hover:underline text-left">
            View All State Breakdowns
          </button>
        </div>

        {/* Panel 2: National Risk Band Distribution */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-base mb-1">National Risk Band Breakdown</h3>
            <p className="text-xs text-slate-500 mb-1">Percentile based: HIGH = top 2%, MEDIUM = next 8%, LOW = remaining 90%</p>
            <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-3">
              <Info size={11} /> Score cutoffs are recomputed each model run, not fixed thresholds
            </div>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dist3} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 700 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(val) => [val.toLocaleString() + ' works', 'Count']} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {dist3.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="flex justify-around text-xs font-semibold pt-2 border-t border-slate-100">
            {dist3.map(d => (
              <span key={d.name} style={{ color: d.color }}>{d.name}: {d.value.toLocaleString()}</span>
            ))}
          </div>
        </div>

        {/* Panel 3: Work Lifecycle Pipeline */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-base mb-1">Work Lifecycle Pipeline</h3>
            <p className="text-xs text-slate-500 mb-4">Declining funnel for works with matched records</p>
            <div className="space-y-4 py-2">
              {stage_data.map((st, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-700 font-bold flex items-center gap-1">
                      {st.name}
                    </span>
                    <span className="text-slate-500">{st.value.toLocaleString()} works</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.min((st.value / (stage_data[1]?.value || stage_data[0].value || 1)) * 100, 100)}%`, backgroundColor: st.fill }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button onClick={() => navigate('/reports')} className="mt-4 text-xs font-bold text-slate-800 hover:underline text-left">
            Open District Pipeline Tracker
          </button>
        </div>
      </div>

      {/* Model Agreement Strip */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-200">
        <button onClick={() => navigate('/risk')} className="text-left group pr-2">
          <div className="flex items-center gap-2 mb-1.5">
            <Zap size={15} className="text-slate-800" />
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Cross Model Agreement</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{(model_agreement?.models_3_plus || 430).toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1">Works flagged independently by multiple models</p>
          <span className="text-[11px] font-semibold text-slate-800 group-hover:underline mt-2 inline-block">View in Risk Hub</span>
        </button>
        <button onClick={() => navigate('/risk')} className="text-left group pt-4 md:pt-0 md:pl-6 md:pr-2">
          <div className="flex items-center gap-2 mb-1.5">
            <Zap size={15} className="text-slate-800" />
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Cluster Cost Outliers</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">484</p>
          <p className="text-xs text-slate-500 mt-1">Works priced significantly above peer category</p>
          <span className="text-[11px] font-semibold text-slate-800 group-hover:underline mt-2 inline-block">View Duplicate Tab</span>
        </button>
        <button onClick={() => navigate('/risk')} className="text-left group pt-4 md:pt-0 md:pl-6">
          <div className="flex items-center gap-2 mb-1.5">
            <Zap size={15} className="text-red-600" />
            <span className="text-xs font-bold text-red-600 uppercase tracking-wider">Top 2% National Risk Band</span>
          </div>
          <p className="text-2xl font-bold text-red-600">1,553</p>
          <p className="text-xs text-slate-500 mt-1">Works in the highest risk band nationally</p>
          <span className="text-[11px] font-semibold text-red-600 group-hover:underline mt-2 inline-block">Browse High Risk Works</span>
        </button>
      </div>

      {/* Recent High Risk Alerts Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 className="font-semibold text-slate-700 text-sm">Recent High Risk Alerts Top 10 Flagged Works</h3>
          <button onClick={() => navigate('/projects')} className="text-xs text-slate-800 font-bold hover:underline">
            View All Flagged Works →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="text-slate-500 text-xs uppercase border-b border-slate-200 bg-white">
                <th className="p-4 font-medium">Work ID</th>
                <th className="p-4 font-medium">Project Name</th>
                <th className="p-4 font-medium">District / State</th>
                <th className="p-4 font-medium text-center">Risk Score</th>
                <th className="p-4 font-medium text-center">Risk Band</th>
                <th className="p-4 font-medium">Why Flagged</th>
                <th className="p-4 font-medium text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm bg-white">
              {recent_alerts.slice(0, 10).map((alert, i) => (
                <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-bold text-slate-700 font-mono text-xs">{alert.id}</td>
                  <td className="p-4 text-slate-600 truncate max-w-[180px]" title={alert.name}>{alert.name}</td>
                  <td className="p-4 text-slate-600 text-xs">{alert.loc}</td>
                  <td className="p-4 font-bold text-slate-700 text-center">{alert.score}</td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-center inline-flex items-center justify-center ${alert.level === 'Very High' || alert.level === 'HIGH' || alert.level === 'High' ? 'bg-red-50 text-red-700 border border-red-200' :
                        'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>{alert.level}</span>
                  </td>
                  <td className="p-4 max-w-[200px]">
                    {alert.why_flagged ? (
                      <span
                        className="text-xs text-slate-600 italic cursor-help"
                        title={alert.why_flagged}
                      >
                        {alert.why_flagged.length > 65 ? alert.why_flagged.slice(0, 65) + '...' : alert.why_flagged}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Composite signals</span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => navigate(`/sanity-check?work_id=${encodeURIComponent(alert.id)}`)}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-100"
                      >
                        <Eye size={14} /> Sanity Check
                      </button>
                      <button
                        onClick={() => navigate('/investigation')}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 border border-slate-200 rounded-lg hover:bg-slate-200"
                      >
                        <FileSearch size={14} /> Investigate
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Saved Demo Notification Activity */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-slate-700" />
              <h3 className="font-semibold text-slate-700 text-sm">Recent Notification Activity</h3>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">DEMO</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Messages sent from the Notification Centre are saved locally and survive page reloads.</p>
          </div>
          <button
            onClick={() => navigate('/notifications')}
            className="text-xs text-slate-800 font-bold hover:underline"
          >
            Open Notification Centre →
          </button>
        </div>

        {demoNotifications.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            No demo messages have been sent yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {demoNotifications.slice(0, 5).map((item) => (
              <div key={item.id} className="p-4 flex items-start gap-3 hover:bg-slate-50">
                <div className="p-2 rounded-lg bg-teal-50 text-teal-700 shrink-0">
                  <Send size={14} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-800">{item.recipient_name}</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{item.recipient_type}</span>
                      {item.work_id && <span className="font-mono text-[9px] text-slate-400">{item.work_id}</span>}
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">{item.sent_date}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.message}</p>
                  <p className="text-[9px] text-slate-400 mt-1">Simulated message · saved locally</p>
                </div>
              </div>
            ))}
          </div>
        )}
</div>
  </div>
  );
}

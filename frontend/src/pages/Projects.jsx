// import { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { Search, Filter, Download, FilePlus2, Eye, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

// export default function Projects() {
//   const navigate = useNavigate();
//   const [data, setData] = useState({ data: [], total: 0, page: 1, limit: 25, total_pages: 1, states: [], risk_bands: [], statuses: [] });
//   const [loading, setLoading] = useState(true);
//   const [page, setPage] = useState(1);
//   const [selectedWorks, setSelectedWorks] = useState([]);

//   // Filter States
//   const [search, setSearch] = useState('');
//   const [stateFilter, setStateFilter] = useState('');
//   const [riskBandFilter, setRiskBandFilter] = useState('');
//   const [statusFilter, setStatusFilter] = useState('');

//   const [availableStates, setAvailableStates] = useState([]);
//   const [availableRiskBands, setAvailableRiskBands] = useState(['Very High', 'High', 'Medium', 'Low']);
//   const [availableStatuses, setAvailableStatuses] = useState([]);

//   useEffect(() => {
//     setLoading(true);
//     const url = `http://localhost:8000/api/projects?page=${page}&limit=25&state=${encodeURIComponent(stateFilter)}&risk_band=${encodeURIComponent(riskBandFilter)}&status=${encodeURIComponent(statusFilter)}&search=${encodeURIComponent(search)}`;
//     fetch(url)
//       .then(res => res.json())
//       .then(fetchedData => {
//         if (!fetchedData.error) {
//           setData(fetchedData);
//           if (fetchedData.states && fetchedData.states.length > 0) setAvailableStates(fetchedData.states);
//           if (fetchedData.risk_bands && fetchedData.risk_bands.length > 0) setAvailableRiskBands(fetchedData.risk_bands);
//           if (fetchedData.statuses && fetchedData.statuses.length > 0) setAvailableStatuses(fetchedData.statuses);
//         }
//         setLoading(false);
//       })
//       .catch(err => {
//         console.error("Failed to fetch projects data:", err);
//         setLoading(false);
//       });
//   }, [page, stateFilter, riskBandFilter, statusFilter, search]);

//   const toggleSelect = (id) => {
//     setSelectedWorks(prev => 
//       prev.includes(id) ? prev.filter(wId => wId !== id) : [...prev, id]
//     );
//   };

//   const toggleSelectAll = (e) => {
//     if (e.target.checked) {
//       setSelectedWorks((data.data || []).map(w => w.id));
//     } else {
//       setSelectedWorks([]);
//     }
//   };

//   const exportCSV = () => {
//     const headers = ["Work ID", "Description", "MP Name", "Constituency", "State", "Sanction Amount", "Expenditure", "Utilization Rate", "Status", "Risk Score", "Risk Band"];
//     const rows = [headers.join(",")];
//     (data.data || []).forEach(r => {
//       rows.push(`"${r.id}","${(r.description || '').replace(/"/g, '""')}","${r.mp}","${r.constituency}","${r.state}",${r.sanction},${r.expenditure},${r.utilization},"${r.status}",${r.risk_score},"${r.risk_band}"`);
//     });
//     const blob = new Blob([rows.join("\n")], { type: 'text/csv' });
//     const url = window.URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = `Projects_Ledger_Export_${new Date().toISOString().slice(0, 10)}.csv`;
//     a.click();
//   };

//   const resetFilters = () => {
//     setSearch('');
//     setStateFilter('');
//     setRiskBandFilter('');
//     setStatusFilter('');
//     setPage(1);
//   };

//   const riskBadgeClass = (band) =>
//     band === 'Very High' || band === 'HIGH' || band === 'High' ? 'bg-red-50 text-red-700 border border-red-200 font-bold' :
//     band === 'MEDIUM' || band === 'Medium' ? 'bg-amber-50 text-amber-700 border border-amber-200 font-bold' :
//     'bg-slate-50 text-slate-600 border border-slate-200 font-medium';

//   return (
//     <div className="space-y-6 flex flex-col h-full">
//       <div className="flex justify-between items-center">
//         <div>
//           <h2 className="text-xl font-bold text-slate-900">Projects and Works Master Ledger</h2>
//           <p className="text-xs text-slate-500 mt-0.5">Master repository of registered works, expenditure records, and risk classifications.</p>
//         </div>
//         <div className="flex gap-3">
//           <button onClick={exportCSV} className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 shadow-2xs transition-colors">
//             <Download size={14} /> Export CSV
//           </button>
//           <button className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-md disabled:opacity-40 transition-colors shadow-2xs" disabled={selectedWorks.length === 0}>
//             <FilePlus2 size={14} /> Add to Case File ({selectedWorks.length})
//           </button>
//         </div>
//       </div>

//       {/* Filter Control Panel */}
//       <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
//         <div className="flex items-center gap-3 flex-wrap">
//           <div className="flex-1 min-w-[240px] relative">
//             <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
//             <input 
//               type="text" 
//               value={search}
//               onChange={e => { setSearch(e.target.value); setPage(1); }}
//               placeholder="Search Work ID, Description, MP Name, District..." 
//               className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs bg-slate-50 focus:outline-none focus:ring-1 focus:ring-slate-600 focus:bg-white"
//             />
//           </div>

//           {/* State Filter */}
//           <select 
//             value={stateFilter}
//             onChange={e => { setStateFilter(e.target.value); setPage(1); }}
//             className="border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium bg-white text-slate-700 focus:outline-none focus:border-slate-600 min-w-[150px]"
//           >
//             <option value="">State: All ({availableStates.length})</option>
//             {availableStates.map(s => (
//               <option key={s} value={s}>{s}</option>
//             ))}
//           </select>

//           {/* Risk Band Filter */}
//           <select 
//             value={riskBandFilter}
//             onChange={e => { setRiskBandFilter(e.target.value); setPage(1); }}
//             className="border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium bg-white text-slate-700 focus:outline-none focus:border-slate-600 min-w-[140px]"
//           >
//             <option value="">Risk Band: All</option>
//             {availableRiskBands.map(b => (
//               <option key={b} value={b}>{b}</option>
//             ))}
//           </select>

//           {/* Status Filter */}
//           <select 
//             value={statusFilter}
//             onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
//             className="border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium bg-white text-slate-700 focus:outline-none focus:border-slate-600 min-w-[160px]"
//           >
//             <option value="">Status: All ({availableStatuses.length})</option>
//             {availableStatuses.map(st => (
//               <option key={st} value={st}>{st}</option>
//             ))}
//           </select>

//           {(search || stateFilter || riskBandFilter || statusFilter) && (
//             <button 
//               onClick={resetFilters}
//               className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
//             >
//               Reset Filters
//             </button>
//           )}
//         </div>
//       </div>

//       <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden relative">
//         {loading && (
//           <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
//             <div className="px-4 py-2 bg-slate-800 text-white rounded-full text-sm font-medium shadow-lg animate-pulse">Loading data...</div>
//           </div>
//         )}
//         <div className="overflow-x-auto flex-1">
//           <table className="w-full text-left border-collapse min-w-[1000px]">
//             <thead className="sticky top-0 bg-slate-50 z-20 shadow-sm">
//               <tr className="text-slate-500 text-xs uppercase border-b border-slate-200">
//                 <th className="p-4 w-12 text-center">
//                   <input type="checkbox" onChange={toggleSelectAll} checked={selectedWorks.length === data.data.length && data.data.length > 0} className="rounded border-slate-300" />
//                 </th>
//                 <th className="p-4 font-semibold text-slate-600">Work ID and Title</th>
//                 <th className="p-4 font-semibold text-slate-600">District and Location</th>
//                 <th className="p-4 font-semibold text-slate-600 text-right">Sanction Amount</th>
//                 <th className="p-4 font-semibold text-slate-600 text-center">Timeline</th>
//                 <th className="p-4 font-semibold text-slate-600 text-center">Risk Score</th>
//                 <th className="p-4 font-semibold text-slate-600 text-center">Risk Band</th>
//                 <th className="p-4 font-semibold text-slate-600 text-center">Actions</th>
//               </tr>
//             </thead>
//             <tbody className="text-xs bg-white divide-y divide-slate-100">
//               {(data.data || []).map((row) => (
//                 <tr key={row.id} className="hover:bg-slate-50 transition-colors">
//                   <td className="p-4 text-center">
//                     <input type="checkbox" checked={selectedWorks.includes(row.id)} onChange={() => toggleSelect(row.id)} className="rounded border-slate-300" />
//                   </td>
//                   <td className="p-4 max-w-[280px]">
//                     <span className="font-bold text-slate-900 font-mono text-[11px] block">{row.id}</span>
//                     <span className="text-slate-600 truncate block mt-0.5" title={row.description}>{row.description}</span>
//                   </td>
//                   <td className="p-4">
//                     <span className="font-bold text-slate-800 block">{row.district}, {row.state}</span>
//                     <span className="text-slate-500 text-[10px] block">MP {row.mp}</span>
//                   </td>
//                   <td className="p-4 text-right font-bold text-slate-900">
//                     ₹{(row.sanction||0).toLocaleString()}
//                   </td>
//                   <td className="p-4 text-center text-slate-700 font-medium">
//                     {row.completion_days ? `${row.completion_days} days` : '0 days'}
//                   </td>
//                   <td className="p-4 text-center font-bold text-slate-800">
//                     {row.risk_score}
//                   </td>
//                   <td className="p-4 text-center">
//                     <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-center inline-flex items-center justify-center ${riskBadgeClass(row.risk_band)}`}>
//                       {row.risk_band}
//                     </span>
//                   </td>
//                   <td className="p-4 text-center">
//                     <div className="flex items-center justify-center gap-1.5">
//                       <button
//                         onClick={() => navigate(`/sanity-check?work_id=${encodeURIComponent(row.id)}`)}
//                         className="px-2.5 py-1 text-[10px] font-bold text-slate-800 bg-white border border-slate-200 rounded hover:bg-slate-100 flex items-center gap-1 shadow-2xs"
//                       >
//                         <Eye size={12} /> Sanity Check
//                       </button>
//                       <button
//                         onClick={() => navigate('/investigation')}
//                         className="px-2.5 py-1 text-[10px] font-medium text-slate-700 bg-slate-100 border border-slate-200 rounded hover:bg-slate-200 flex items-center gap-1 shadow-2xs"
//                       >
//                         Investigate <ArrowRight size={11} />
//                       </button>
//                     </div>
//                   </td>
//                 </tr>
//               ))}
//               {(data.data || []).length === 0 && !loading && (
//                 <tr>
//                   <td colSpan={8} className="p-12 text-center text-slate-400 text-xs font-medium">
//                     No projects matching your filter criteria. Try resetting filters.
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>
//         <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
//           <span>Showing page {data.page} of {data.total_pages} ({data.total.toLocaleString()} total works)</span>
//           <div className="flex items-center gap-2">
//             <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="p-1.5 border border-slate-300 rounded bg-white disabled:opacity-40">
//               <ChevronLeft size={16} />
//             </button>
//             <button onClick={() => setPage(p => Math.min(data.total_pages, p+1))} disabled={page === data.total_pages} className="p-1.5 border border-slate-300 rounded bg-white disabled:opacity-40">
//               <ChevronRight size={16} />
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

















import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Download,
  FilePlus2,
  Eye,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Upload,
  Plus,
  X,
  AlertTriangle
} from 'lucide-react';

const DEMO_STORAGE_KEY = 'NIRIKSHAN_DEMO_PROJECTS';

/*
|--------------------------------------------------------------------------
| 5 FAKE DEMO WORKS
|--------------------------------------------------------------------------
| These are only demonstration records.
| They do NOT modify your real backend/database.
|--------------------------------------------------------------------------
*/
const DEMO_PROJECTS = [
  {
    id: 'DEMO/24-25/RAJ/NIK-001',
    description: 'Construction of Community Health Centre Building',
    mp: 'Rajesh Sharma',
    constituency: 'Jaipur Rural',
    state: 'Rajasthan',
    district: 'Jaipur',
    sanction: 4800000,
    expenditure: 4520000,
    utilization: 94.2,
    status: 'Ongoing',
    risk_score: 91.5,
    risk_band: 'High',
    completion_days: 142,
    demo: true
  },
  {
    id: 'DEMO/24-25/UP/NIK-002',
    description: 'Rural Road Improvement and Drainage Work',
    mp: 'Anita Verma',
    constituency: 'Lucknow',
    state: 'Uttar Pradesh',
    district: 'Lucknow',
    sanction: 3500000,
    expenditure: 3710000,
    utilization: 105.9,
    status: 'Ongoing',
    risk_score: 84.2,
    risk_band: 'High',
    completion_days: 198,
    demo: true
  },
  {
    id: 'DEMO/24-25/MP/NIK-003',
    description: 'Installation of Solar Street Lighting System',
    mp: 'Vikram Singh',
    constituency: 'Bhopal',
    state: 'Madhya Pradesh',
    district: 'Bhopal',
    sanction: 2200000,
    expenditure: 1680000,
    utilization: 76.4,
    status: 'Pending',
    risk_score: 67.8,
    risk_band: 'High',
    completion_days: 121,
    demo: true
  },
  {
    id: 'DEMO/24-25/BIH/NIK-004',
    description: 'Government School Classroom Expansion',
    mp: 'Sanjay Kumar',
    constituency: 'Patna Sahib',
    state: 'Bihar',
    district: 'Patna',
    sanction: 2900000,
    expenditure: 1720000,
    utilization: 59.3,
    status: 'Ongoing',
    risk_score: 44.6,
    risk_band: 'Medium',
    completion_days: 93,
    demo: true
  },
  {
    id: 'DEMO/24-25/HAR/NIK-005',
    description: 'Drinking Water Pipeline Extension Project',
    mp: 'Neha Yadav',
    constituency: 'Gurugram',
    state: 'Haryana',
    district: 'Gurugram',
    sanction: 1800000,
    expenditure: 720000,
    utilization: 40.0,
    status: 'Sanctioned',
    risk_score: 21.4,
    risk_band: 'Low',
    completion_days: 38,
    demo: true
  }
];

/*
|--------------------------------------------------------------------------
| CSV parser
|--------------------------------------------------------------------------
*/
const parseCSV = (text) => {
  const lines = text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const headers = lines[0]
    .split(',')
    .map(h => h.trim().replace(/^"|"$/g, ''));

  return lines.slice(1).map((line, index) => {
    const values = line
      .split(',')
      .map(v => v.trim().replace(/^"|"$/g, ''));

    const obj = {};

    headers.forEach((header, i) => {
      obj[header] = values[i] ?? '';
    });

    /*
     * Accept both your backend-style fields and common CSV names.
     */
    const riskScore = Number(
      obj.risk_score ||
      obj.RiskScore ||
      obj['Risk Score'] ||
      0
    );

    let riskBand =
      obj.risk_band ||
      obj.RiskBand ||
      obj['Risk Band'] ||
      '';

    if (!riskBand) {
      if (riskScore >= 70) riskBand = 'High';
      else if (riskScore >= 30) riskBand = 'Medium';
      else riskBand = 'Low';
    }

    return {
      id:
        obj.id ||
        obj.work_id ||
        obj['Work ID'] ||
        `UPLOADED/${Date.now()}/${index + 1}`,

      description:
        obj.description ||
        obj.work_description ||
        obj['Description'] ||
        'Uploaded demonstration work',

      mp:
        obj.mp ||
        obj.mp_name ||
        obj['MP Name'] ||
        'Unknown MP',

      constituency:
        obj.constituency ||
        obj.constituency_clean ||
        obj['Constituency'] ||
        'Unknown',

      state:
        obj.state ||
        obj['State'] ||
        'Unknown',

      district:
        obj.district ||
        obj.district_name ||
        obj['District'] ||
        'Unknown',

      sanction: Number(
        obj.sanction ||
        obj.sanction_amount ||
        obj['Sanction Amount'] ||
        0
      ),

      expenditure: Number(
        obj.expenditure ||
        obj.total_expenditure ||
        obj['Expenditure'] ||
        0
      ),

      utilization: Number(
        obj.utilization ||
        obj.utilization_rate ||
        obj['Utilization Rate'] ||
        0
      ),

      status:
        obj.status ||
        obj.work_status ||
        obj['Status'] ||
        'Ongoing',

      risk_score: riskScore,

      risk_band: riskBand,

      completion_days: Number(
        obj.completion_days ||
        obj['Completion Days'] ||
        0
      ),

      demo: true
    };
  });
};

export default function Projects({ onUpdateFYMetadata }) {
  const navigate = useNavigate();

  const [data, setData] = useState({
    data: [],
    total: 0,
    page: 1,
    limit: 25,
    total_pages: 1,
    states: [],
    risk_bands: [],
    statuses: []
  });

  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedWorks, setSelectedWorks] = useState([]);

  // Filters
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [riskBandFilter, setRiskBandFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [availableStates, setAvailableStates] = useState([]);
  const [availableRiskBands, setAvailableRiskBands] = useState([
    'Very High',
    'High',
    'Medium',
    'Low'
  ]);
  const [availableStatuses, setAvailableStatuses] = useState([]);

  const [demoProjects, setDemoProjects] = useState([]);
  const [showDemoPanel, setShowDemoPanel] = useState(false);

  // Financial Year state
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

  /*
  |--------------------------------------------------------------------------
  | Load saved fake data
  |--------------------------------------------------------------------------
  */
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DEMO_STORAGE_KEY);

      if (saved) {
        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed)) {
          setDemoProjects(parsed);
        }
      }
    } catch (error) {
      console.error('Unable to load demo projects:', error);
    }
  }, []);

/*
  |--------------------------------------------------------------------------
  | Existing backend request — LEFT INTACT
  |--------------------------------------------------------------------------
  */
  useEffect(() => {
    setLoading(true);

    const url =
      `http://localhost:8000/api/projects?page=${page}` +
      `&limit=25` +
      `&state=${encodeURIComponent(stateFilter)}` +
      `&risk_band=${encodeURIComponent(riskBandFilter)}` +
      `&status=${encodeURIComponent(statusFilter)}` +
      `&search=${encodeURIComponent(search)}` +
      (selectedFY ? `&financial_year=${encodeURIComponent(selectedFY)}` : '');

    fetch(url)
      .then(res => res.json())
      .then(fetchedData => {
        if (!fetchedData.error) {
          setData(fetchedData);

          if (
            fetchedData.states &&
            fetchedData.states.length > 0
          ) {
            setAvailableStates(fetchedData.states);
          }

          if (
            fetchedData.risk_bands &&
            fetchedData.risk_bands.length > 0
          ) {
            setAvailableRiskBands(fetchedData.risk_bands);
          }

          if (
            fetchedData.statuses &&
            fetchedData.statuses.length > 0
          ) {
            setAvailableStatuses(fetchedData.statuses);
          }

          // Update FY metadata for Topbar
          if (fetchedData.financial_years) {
            setFinancialYears(fetchedData.financial_years);
            setCurrentFY(fetchedData.current_fy);
            setPrevFY(fetchedData.prev_fy);
            onUpdateFYMetadata?.(fetchedData.financial_years, fetchedData.current_fy, fetchedData.prev_fy);
          }
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch projects data:', err);
        setLoading(false);
      });
  }, [
    page,
    stateFilter,
    riskBandFilter,
    statusFilter,
    search,
    selectedFY
  ]);

  /*
  |--------------------------------------------------------------------------
  | Add the 5 predefined fake works
  |--------------------------------------------------------------------------
  */
  const addDemoProjects = () => {
    try {
      const existingIds = new Set(
        demoProjects.map(project => project.id)
      );

      const newProjects = DEMO_PROJECTS.filter(
        project => !existingIds.has(project.id)
      );

      const combined = [...demoProjects, ...newProjects];

      setDemoProjects(combined);

      localStorage.setItem(
        DEMO_STORAGE_KEY,
        JSON.stringify(combined)
      );

      setShowDemoPanel(true);
      setPage(1);

      alert(
        `${newProjects.length} demo works added to the Projects Ledger.`
      );
    } catch (error) {
      console.error('Unable to add demo projects:', error);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Upload CSV
  |--------------------------------------------------------------------------
  */
  const handleCSVUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      alert('Please select a CSV file.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const parsed = parseCSV(e.target.result);

        if (!parsed.length) {
          alert('No valid rows found in the CSV.');
          return;
        }

        const combined = [
          ...demoProjects,
          ...parsed
        ];

        setDemoProjects(combined);

        localStorage.setItem(
          DEMO_STORAGE_KEY,
          JSON.stringify(combined)
        );

        setShowDemoPanel(true);
        setPage(1);

        alert(
          `${parsed.length} work(s) imported successfully.`
        );
      } catch (error) {
        console.error('CSV import error:', error);
        alert('Could not read this CSV file.');
      }
    };

    reader.readAsText(file);

    // Allows selecting the same file again later.
    event.target.value = '';
  };

  /*
  |--------------------------------------------------------------------------
  | Clear fake/uploaded data
  |--------------------------------------------------------------------------
  */
  const clearDemoProjects = () => {
    if (
      !window.confirm(
        'Remove all manually added/demo projects from this browser?'
      )
    ) {
      return;
    }

    setDemoProjects([]);

    localStorage.removeItem(DEMO_STORAGE_KEY);

    setSelectedWorks([]);
  };

  /*
  |--------------------------------------------------------------------------
  | Merge real backend data + demo data
  |--------------------------------------------------------------------------
  */
  const displayedProjects = useMemo(() => {
    let rows = [
      ...demoProjects,
      ...(data.data || [])
    ];

    /*
     * Remove duplicate IDs.
     */
    const seen = new Set();

    rows = rows.filter(row => {
      if (seen.has(row.id)) return false;

      seen.add(row.id);

      return true;
    });

    /*
     * Search locally through demo data too.
     */
    if (search.trim()) {
      const q = search.toLowerCase();

      rows = rows.filter(row =>
        String(row.id || '').toLowerCase().includes(q) ||
        String(row.description || '').toLowerCase().includes(q) ||
        String(row.mp || '').toLowerCase().includes(q) ||
        String(row.district || '').toLowerCase().includes(q)
      );
    }

    /*
     * Apply filters to manually added records.
     */
    if (stateFilter) {
      rows = rows.filter(
        row => row.state === stateFilter
      );
    }

    if (riskBandFilter) {
      rows = rows.filter(
        row =>
          String(row.risk_band).toLowerCase() ===
          riskBandFilter.toLowerCase()
      );
    }

    if (statusFilter) {
      rows = rows.filter(
        row => row.status === statusFilter
      );
    }

    /*
     * IMPORTANT:
     * Highest-risk manually added works appear first.
     */
    rows.sort(
      (a, b) =>
        Number(b.risk_score || 0) -
        Number(a.risk_score || 0)
    );

    return rows;
  }, [
    demoProjects,
    data.data,
    search,
    stateFilter,
    riskBandFilter,
    statusFilter
  ]);

  /*
  |--------------------------------------------------------------------------
  | Select
  |--------------------------------------------------------------------------
  */
  const toggleSelect = (id) => {
    setSelectedWorks(prev =>
      prev.includes(id)
        ? prev.filter(wId => wId !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedWorks(
        displayedProjects.map(w => w.id)
      );
    } else {
      setSelectedWorks([]);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Export CSV
  |--------------------------------------------------------------------------
  */
  const exportCSV = () => {
    const headers = [
      'Work ID',
      'Description',
      'MP Name',
      'Constituency',
      'State',
      'Sanction Amount',
      'Expenditure',
      'Utilization Rate',
      'Status',
      'Risk Score',
      'Risk Band'
    ];

    const rows = [headers.join(',')];

    displayedProjects.forEach(r => {
      rows.push(
        `"${r.id}","${String(r.description || '')
          .replace(/"/g, '""')}","${r.mp || ''}","${r.constituency || ''}","${r.state || ''}",${r.sanction || 0},${r.expenditure || 0},${r.utilization || 0},"${r.status || ''}",${r.risk_score || 0},"${r.risk_band || ''}"`
      );
    });

    const blob = new Blob(
      [rows.join('\n')],
      { type: 'text/csv' }
    );

    const url =
      window.URL.createObjectURL(blob);

    const a =
      document.createElement('a');

    a.href = url;

    a.download =
      `Projects_Ledger_Export_${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;

    a.click();

    window.URL.revokeObjectURL(url);
  };

  const resetFilters = () => {
    setSearch('');
    setStateFilter('');
    setRiskBandFilter('');
    setStatusFilter('');
    setPage(1);
  };

  /*
  |--------------------------------------------------------------------------
  | Risk styling
  |--------------------------------------------------------------------------
  */
  const riskBadgeClass = (band) =>
    band === 'Very High' ||
      band === 'HIGH' ||
      band === 'High'
      ? 'bg-red-50 text-red-700 border border-red-200 font-bold'
      : band === 'MEDIUM' ||
        band === 'Medium'
        ? 'bg-amber-50 text-amber-700 border border-amber-200 font-bold'
        : 'bg-slate-50 text-slate-600 border border-slate-200 font-medium';

  const riskRowClass = (band) => {
    if (
      band === 'Very High' ||
      band === 'HIGH' ||
      band === 'High'
    ) {
      return 'border-l-4 border-l-red-500 bg-red-50/20';
    }

    if (
      band === 'Medium' ||
      band === 'MEDIUM'
    ) {
      return 'border-l-4 border-l-amber-400';
    }

    return 'border-l-4 border-l-slate-300';
  };

  /*
  |--------------------------------------------------------------------------
  | Counts
  |--------------------------------------------------------------------------
  */
  const highCount = demoProjects.filter(
    p =>
      p.risk_band === 'High' ||
      p.risk_band === 'Very High'
  ).length;

  const mediumCount = demoProjects.filter(
    p => p.risk_band === 'Medium'
  ).length;

  const lowCount = demoProjects.filter(
    p => p.risk_band === 'Low'
  ).length;

  return (
    <div className="space-y-6 flex flex-col h-full">

      {/* ================================================================
          HEADER
      ================================================================= */}
      <div className="flex justify-between items-center">

        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Projects and Works Master Ledger
          </h2>

          <p className="text-xs text-slate-500 mt-0.5">
            Master repository of registered works, expenditure records,
            and risk classifications.
          </p>
        </div>

        <div className="flex gap-3">

          {/* CSV UPLOAD */}
          <label className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer">
            <Upload size={14} />

            Upload CSV

            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleCSVUpload}
              className="hidden"
            />
          </label>

          {/* ADD 5 DEMO RECORDS */}
          <button
            onClick={addDemoProjects}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-md shadow-2xs transition-colors"
          >
            <Plus size={14} />

            Add Random Works
          </button>

          {/* EXISTING EXPORT */}
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 shadow-2xs transition-colors"
          >
            <Download size={14} />

            Export CSV
          </button>

          {/* EXISTING CASE FILE BUTTON */}
          <button
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-md disabled:opacity-40 transition-colors shadow-2xs"
            disabled={selectedWorks.length === 0}
          >
            <FilePlus2 size={14} />

            Add to Case File ({selectedWorks.length})
          </button>

        </div>
      </div>

      {/* ================================================================
          DEMO DATA STATUS
      ================================================================= */}
      {demoProjects.length > 0 && (
        <div className="bg-white border border-red-200 rounded-xl shadow-sm">

          <div className="p-4 flex items-center justify-between">

            <div className="flex items-center gap-3">

              <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
                <AlertTriangle
                  size={18}
                  className="text-red-600"
                />
              </div>

              <div>
                <div className="text-xs font-bold text-slate-900">
                  Manual / Demonstration Data Loaded
                </div>

                <div className="text-[11px] text-slate-500 mt-0.5">
                  {demoProjects.length} manually added work(s)
                  are shown above the normal ledger.
                </div>
              </div>

            </div>

            <div className="flex items-center gap-5">

              <div className="text-center">
                <div className="text-sm font-bold text-red-600">
                  {highCount}
                </div>
                <div className="text-[9px] uppercase text-slate-400 font-bold">
                  High
                </div>
              </div>

              <div className="text-center">
                <div className="text-sm font-bold text-amber-600">
                  {mediumCount}
                </div>
                <div className="text-[9px] uppercase text-slate-400 font-bold">
                  Medium
                </div>
              </div>

              <div className="text-center">
                <div className="text-sm font-bold text-slate-600">
                  {lowCount}
                </div>
                <div className="text-[9px] uppercase text-slate-400 font-bold">
                  Low
                </div>
              </div>

              <button
                onClick={clearDemoProjects}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                title="Remove manually added data"
              >
                <X size={16} />
              </button>

            </div>
          </div>

        </div>
      )}

      {/* ================================================================
          FILTER CONTROL PANEL
      ================================================================= */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">

        <div className="flex items-center gap-3 flex-wrap">

          <div className="flex-1 min-w-[240px] relative">

            <Search
              className="absolute left-3 top-2.5 text-slate-400"
              size={16}
            />

            <input
              type="text"
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search Work ID, Description, MP Name, District..."
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs bg-slate-50 focus:outline-none focus:ring-1 focus:ring-slate-600 focus:bg-white"
            />

          </div>

          {/* STATE */}
          <select
            value={stateFilter}
            onChange={e => {
              setStateFilter(e.target.value);
              setPage(1);
            }}
            className="border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium bg-white text-slate-700 focus:outline-none focus:border-slate-600 min-w-[150px]"
          >
            <option value="">
              State: All ({availableStates.length})
            </option>

            {availableStates.map(s => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}

            {/* States from demo data */}
            {demoProjects
              .map(p => p.state)
              .filter(Boolean)
              .filter(
                (s, i, arr) =>
                  arr.indexOf(s) === i &&
                  !availableStates.includes(s)
              )
              .map(s => (
                <option key={`demo-${s}`} value={s}>
                  {s}
                </option>
              ))}
          </select>

          {/* RISK */}
          <select
            value={riskBandFilter}
            onChange={e => {
              setRiskBandFilter(e.target.value);
              setPage(1);
            }}
            className="border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium bg-white text-slate-700 focus:outline-none focus:border-slate-600 min-w-[140px]"
          >
            <option value="">
              Risk Band: All
            </option>

            {availableRiskBands.map(b => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          {/* STATUS */}
          <select
            value={statusFilter}
            onChange={e => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium bg-white text-slate-700 focus:outline-none focus:border-slate-600 min-w-[160px]"
          >
            <option value="">
              Status: All ({availableStatuses.length})
            </option>

            {availableStatuses.map(st => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          {(search ||
            stateFilter ||
            riskBandFilter ||
            statusFilter) && (

              <button
                onClick={resetFilters}
                className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
              >
                Reset Filters
              </button>

            )}

        </div>

      </div>

      {/* ================================================================
          TABLE
      ================================================================= */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden relative">

        {loading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
            <div className="px-4 py-2 bg-slate-800 text-white rounded-full text-sm font-medium shadow-lg animate-pulse">
              Loading data...
            </div>
          </div>
        )}

        <div className="overflow-x-auto flex-1">

          <table className="w-full text-left border-collapse min-w-[1000px]">

            <thead className="sticky top-0 bg-slate-50 z-20 shadow-sm">

              <tr className="text-slate-500 text-xs uppercase border-b border-slate-200">

                <th className="p-4 w-12 text-center">
                  <input
                    type="checkbox"
                    onChange={toggleSelectAll}
                    checked={
                      selectedWorks.length ===
                      displayedProjects.length &&
                      displayedProjects.length > 0
                    }
                    className="rounded border-slate-300"
                  />
                </th>

                <th className="p-4 font-semibold text-slate-600">
                  Work ID and Title
                </th>

                <th className="p-4 font-semibold text-slate-600">
                  District and Location
                </th>

                <th className="p-4 font-semibold text-slate-600 text-right">
                  Sanction Amount
                </th>

                <th className="p-4 font-semibold text-slate-600 text-center">
                  Timeline
                </th>

                <th className="p-4 font-semibold text-slate-600 text-center">
                  Risk Score
                </th>

                <th className="p-4 font-semibold text-slate-600 text-center">
                  Risk Band
                </th>

                <th className="p-4 font-semibold text-slate-600 text-center">
                  Actions
                </th>

              </tr>

            </thead>

            <tbody className="text-xs bg-white divide-y divide-slate-100">

              {displayedProjects.map((row, index) => (

                <tr
                  key={`${row.id}-${index}`}
                  className={`hover:bg-slate-50 transition-colors ${row.demo ? riskRowClass(row.risk_band) : ''
                    }`}
                >

                  {/* CHECKBOX */}
                  <td className="p-4 text-center">

                    <input
                      type="checkbox"
                      checked={selectedWorks.includes(row.id)}
                      onChange={() =>
                        toggleSelect(row.id)
                      }
                      className="rounded border-slate-300"
                    />

                  </td>

                  {/* WORK */}
                  <td className="p-4 max-w-[280px]">

                    <div className="flex items-center gap-2">

                      <span className="font-bold text-slate-900 font-mono text-[11px] block">
                        {row.id}
                      </span>

                      {row.demo && (
                        <span className="px-1.5 py-0.5 rounded bg-slate-900 text-white text-[8px] font-bold uppercase">
                          Demo
                        </span>
                      )}

                    </div>

                    <span
                      className="text-slate-600 truncate block mt-0.5"
                      title={row.description}
                    >
                      {row.description}
                    </span>

                  </td>

                  {/* DISTRICT */}
                  <td className="p-4">

                    <span className="font-bold text-slate-800 block">
                      {row.district || '—'}, {row.state || '—'}
                    </span>

                    <span className="text-slate-500 text-[10px] block">
                      MP {row.mp || '—'}
                    </span>

                  </td>

                  {/* SANCTION */}
                  <td className="p-4 text-right font-bold text-slate-900">

                    ₹{Number(
                      row.sanction || 0
                    ).toLocaleString('en-IN')}

                  </td>

                  {/* TIMELINE */}
                  <td className="p-4 text-center text-slate-700 font-medium">

                    {row.completion_days
                      ? `${row.completion_days} days`
                      : '0 days'}

                  </td>

                  {/* SCORE */}
                  <td className="p-4 text-center font-bold text-slate-800">

                    {row.risk_score ?? 0}

                  </td>

                  {/* RISK */}
                  <td className="p-4 text-center">

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold text-center inline-flex items-center justify-center ${riskBadgeClass(
                        row.risk_band
                      )}`}
                    >
                      {row.risk_band || 'Low'}
                    </span>

                  </td>

                  {/* ACTIONS */}
                  <td className="p-4 text-center">

                    <div className="flex items-center justify-center gap-1.5">

                      <button
                        onClick={() =>
                          navigate(
                            `/sanity-check?work_id=${encodeURIComponent(
                              row.id
                            )}`
                          )
                        }
                        className="px-2.5 py-1 text-[10px] font-bold text-slate-800 bg-white border border-slate-200 rounded hover:bg-slate-100 flex items-center gap-1 shadow-2xs"
                      >
                        <Eye size={12} />

                        Sanity Check
                      </button>

                      <button
                        onClick={() =>
                          navigate('/investigation')
                        }
                        className="px-2.5 py-1 text-[10px] font-medium text-slate-700 bg-slate-100 border border-slate-200 rounded hover:bg-slate-200 flex items-center gap-1 shadow-2xs"
                      >
                        Investigate

                        <ArrowRight size={11} />
                      </button>

                    </div>

                  </td>

                </tr>

              ))}

              {displayedProjects.length === 0 &&
                !loading && (

                  <tr>

                    <td
                      colSpan={8}
                      className="p-12 text-center text-slate-400 text-xs font-medium"
                    >
                      No projects matching your filter
                      criteria. Try resetting filters.
                    </td>

                  </tr>

                )}

            </tbody>

          </table>

        </div>

        {/* ================================================================
            PAGINATION
        ================================================================= */}

        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">

          <span>
            {demoProjects.length > 0
              ? `Showing ${displayedProjects.length} works (${demoProjects.length} manually added)`
              : `Showing page ${data.page} of ${data.total_pages} (${data.total?.toLocaleString?.() || 0} total works)`
            }
          </span>

          <div className="flex items-center gap-2">

            <button
              onClick={() =>
                setPage(p => Math.max(1, p - 1))
              }
              disabled={page === 1}
              className="p-1.5 border border-slate-300 rounded bg-white disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>

            <button
              onClick={() =>
                setPage(p =>
                  Math.min(
                    data.total_pages || 1,
                    p + 1
                  )
                )
              }
              disabled={
                page ===
                (data.total_pages || 1)
              }
              className="p-1.5 border border-slate-300 rounded bg-white disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}
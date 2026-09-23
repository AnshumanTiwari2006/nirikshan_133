import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Filter, FileText, Download, Clock, UserCheck, ShieldAlert, CheckCircle2, AlertTriangle, ChevronRight, ChevronLeft, Eye, RefreshCw, BarChart2, Table2 } from 'lucide-react';
import SankeyDiagram from '../components/SankeyDiagram';

// ─── Drag-and-Drop Kanban ──────────────────────────────────────────────────
const COLUMNS = [
  { id: 'Pending',              title: 'Pending Review',        color: 'border-slate-200', bg: 'bg-white', icon: Clock },
  { id: 'Under Review',         title: 'Under Investigation',   color: 'border-slate-200', bg: 'bg-white', icon: ShieldAlert },
  { id: 'Escalated to Ministry',title: 'Escalated to Ministry', color: 'border-red-300',   bg: 'bg-white', icon: AlertTriangle },
  { id: 'Resolved',             title: 'Resolved / Closed',     color: 'border-slate-200', bg: 'bg-white', icon: CheckCircle2 },
];

const riskBadgeClass = (score) => score >= 70 ? 'bg-rose-100 text-rose-700' : score >= 50 ? 'bg-orange-100 text-orange-700' : 'bg-amber-100 text-amber-700';

const normalizeStatus = (status) => {
  if (!status) return 'Pending';
  const s = status.toLowerCase();
  if (s.includes('escalat')) return 'Escalated to Ministry';
  if (s.includes('resolv') || s.includes('close')) return 'Resolved';
  if (s.includes('investig') || s.includes('review') || s.includes('under')) return 'Under Review';
  return 'Pending';
};

function KanbanBoard() {
  const navigate = useNavigate();
  const [cards, setCards] = useState([]);
  const [dragOverCol, setDragOverCol] = useState(null);
  const dragCardRef = useRef(null);

  const fetchCards = () => {
    fetch('http://localhost:8000/api/reports/escalations')
      .then(r => r.json())
      .then(d => setCards(d.data || []))
      .catch(console.error);
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const handleDragStart = (e, card) => {
    dragCardRef.current = card;
    e.dataTransfer.setData('text/plain', card.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, colId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCol !== colId) {
      setDragOverCol(colId);
    }
  };

  const handleDragLeave = (e, colId) => {
    e.preventDefault();
    if (dragOverCol === colId) {
      setDragOverCol(null);
    }
  };

  const handleDrop = (e, targetColId) => {
    e.preventDefault();
    setDragOverCol(null);
    const cardId = e.dataTransfer.getData('text/plain') || (dragCardRef.current ? dragCardRef.current.id : null);
    if (!cardId) return;

    setCards(prev => prev.map(c => c.id === cardId ? { ...c, status: targetColId } : c));
    
    // Send status change update to backend
    fetch('http://localhost:8000/api/reports/update-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: cardId, status: targetColId })
    }).catch(console.error);

    dragCardRef.current = null;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/> Live Case Escalation Board ({cards.length} Cases Tracked)
        </div>
        <button onClick={fetchCards} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors">
          <RefreshCw size={13}/> Refresh Board
        </button>
      </div>

      <div className="flex gap-4 min-h-[550px] overflow-x-auto pb-4">
        {COLUMNS.map(col => {
          const colCards = cards.filter(c => normalizeStatus(c.status) === col.id);
          const isOver = dragOverCol === col.id;
          return (
            <div
              key={col.id}
              className={`flex-1 min-w-[260px] rounded-xl border p-4 flex flex-col transition-all ${
                isOver ? 'border-teal-500 bg-teal-50/40 ring-2 ring-teal-200' : `${col.color} ${col.bg}`
              }`}
              onDragOver={e => handleDragOver(e, col.id)}
              onDragLeave={e => handleDragLeave(e, col.id)}
              onDrop={e => handleDrop(e, col.id)}
            >
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
                <h3 className="font-bold text-slate-800 text-xs flex items-center gap-2">
                  <col.icon size={15} className="text-slate-600"/> {col.title}
                </h3>
                <span className="bg-slate-100 px-2 py-0.5 rounded text-xs font-bold text-slate-700 shadow-xs">{colCards.length}</span>
              </div>
              <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                {colCards.map(card => (
                  <div
                    key={card.id}
                    draggable
                    onDragStart={e => handleDragStart(e, card)}
                    onClick={() => navigate(`/sanity-check?work_id=${encodeURIComponent(card.work_id || card.id)}`)}
                    className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs cursor-grab active:cursor-grabbing hover:shadow-md hover:border-slate-300 transition-all select-none group"
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <span className="text-xs font-bold text-slate-800 font-mono group-hover:text-teal-700 transition-colors">{card.id}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${riskBadgeClass(card.risk_score)}`}>{card.risk_score}</span>
                    </div>
                    <p className="text-xs font-medium text-slate-700 line-clamp-2 leading-relaxed">{card.work_desc}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-1">{card.work_id}</p>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500">
                      <span>{card.district}, {card.state}</span>
                      <span className="text-rose-600 font-semibold flex items-center gap-1">
                        <Clock size={10}/> {card.days_open}d open
                      </span>
                    </div>
                  </div>
                ))}
                {colCards.length === 0 && (
                  <div className="h-28 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-[11px] text-slate-400 font-medium">
                    Drag & Drop cases here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── District Project Tracker ─────────────────────────────────────────────────
const STAGE_LABELS = ['Recommended', 'Sanctioned', 'Vendor ID', 'Physical Insp.', 'Completed'];

function StageCell({ done, active }) {
  if (done || active) return (
    <div className={`flex items-center justify-center w-full py-1 rounded text-[10px] font-bold ${active ? 'bg-teal-600 text-white' : 'bg-teal-50 text-teal-700'}`}>
      {done && !active ? '✓' : '●'}
    </div>
  );
  return <div className="flex items-center justify-center w-full py-1 rounded text-[10px] text-slate-300 border border-dashed border-slate-200">—</div>;
}

function DistrictTracker() {
  const navigate = useNavigate();
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [selState, setSelState] = useState('');
  const [selDistrict, setSelDistrict] = useState('');
  const [data, setData] = useState({ projects: [], total: 0, page: 1, total_pages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('sankey');
  const [sankeyData, setSankeyData] = useState(null);
  const [sankeyLoading, setSankeyLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:8000/api/reports/district-tracker')
      .then(r => r.json()).then(d => setStates(d.states || []));
  }, []);

  useEffect(() => {
    if (!selState) { setDistricts([]); setSelDistrict(''); return; }
    fetch(`http://localhost:8000/api/reports/district-tracker?state=${encodeURIComponent(selState)}`)
      .then(r => r.json()).then(d => { setDistricts(d.districts || []); setSelDistrict(''); });
  }, [selState]);

  useEffect(() => {
    if (!selState) { setData({ projects: [], total: 0, page: 1, total_pages: 1 }); return; }
    setLoading(true);
    const url = `http://localhost:8000/api/reports/district-tracker?state=${encodeURIComponent(selState)}&district=${encodeURIComponent(selDistrict)}&page=${page}&limit=50`;
    fetch(url).then(r => r.json()).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, [selState, selDistrict, page]);

  useEffect(() => {
    setSankeyLoading(true);
    const url = `http://localhost:8000/api/reports/district-tracker/sankey?state=${encodeURIComponent(selState)}&district=${encodeURIComponent(selDistrict)}`;
    fetch(url)
      .then(r => r.json())
      .then(d => { setSankeyData(d); setSankeyLoading(false); })
      .catch(() => setSankeyLoading(false));
  }, [selState, selDistrict]);

  const renderSankeyView = () => (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {sankeyLoading ? (
        <div className="p-12 text-center">
          <div className="animate-spin w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full mx-auto mb-3"/>
          <p className="text-slate-500">Loading Sankey diagram...</p>
        </div>
      ) : (
        <SankeyDiagram data={sankeyData} width={1100} height={520} />
      )}
    </div>
  );

  const renderTableView = () => (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Stage header with Eye Action Column */}
      <div className="grid bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-500" style={{gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 70px 50px'}}>
        <div className="p-3">Project</div>
        {STAGE_LABELS.map(l => <div key={l} className="p-3 text-center">{l}</div>)}
        <div className="p-3 text-center">Risk</div>
        <div className="p-3 text-center">Sanity</div>
      </div>

      <div className="divide-y divide-slate-100 relative">
        {loading && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
            <div className="animate-spin w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full"/>
          </div>
        )}
        {data.projects.map(p => (
          <div key={p.id} className="grid hover:bg-slate-50 transition-colors items-center" style={{gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 70px 50px'}}>
            <div className="p-3">
              <p className="text-xs font-medium text-slate-700 truncate">{p.description}</p>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">{p.id}</p>
              <p className="text-[10px] text-slate-400">{p.mp}</p>
            </div>
            {[1,2,3,4,5].map(s => (
              <div key={s} className="p-3 flex items-center">
                <StageCell done={p.current_stage > s} active={p.current_stage === s} />
              </div>
            ))}
            <div className="p-3 flex items-center justify-center">
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                p.risk_band === 'Very High' ? 'bg-rose-100 text-rose-700' :
                p.risk_band === 'High' ? 'bg-orange-100 text-orange-700' :
                p.risk_band === 'Medium' ? 'bg-amber-100 text-amber-700' :
                'bg-slate-100 text-slate-500'
              }`}>{p.risk_score}</span>
            </div>
            {/* Eye Icon for Sanity Check */}
            <div className="p-3 flex items-center justify-center">
              <button
                onClick={() => navigate(`/sanity-check?work_id=${encodeURIComponent(p.id)}`)}
                title="View Sanity Check & Why Flagged"
                className="p-1.5 text-teal-600 hover:bg-teal-50 border border-teal-200 rounded-lg transition-colors"
              >
                <Eye size={15}/>
              </button>
            </div>
          </div>
        ))}
        {data.projects.length === 0 && !loading && (
          <div className="p-8 text-center text-slate-400">No projects found for this selection.</div>
        )}
      </div>
      
      {/* Pagination */}
      <div className="flex items-center justify-between p-4 border-t border-slate-200 bg-white text-sm text-slate-600">
        <span>Page {data.page} of {data.total_pages}</span>
        <div className="flex gap-2">
          <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="p-1.5 border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-40"><ChevronLeft size={16}/></button>
          <button onClick={() => setPage(p => Math.min(data.total_pages, p+1))} disabled={page === data.total_pages} className="p-1.5 border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-40"><ChevronRight size={16}/></button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex gap-4 flex-wrap items-center">
        <select value={selState} onChange={e => { setSelState(e.target.value); setPage(1); }}
          className="border border-slate-300 rounded-lg px-4 py-2 text-sm bg-white min-w-[180px]">
          <option value="">Select State...</option>
          {states.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={selDistrict} onChange={e => { setSelDistrict(e.target.value); setPage(1); }}
          className="border border-slate-300 rounded-lg px-4 py-2 text-sm bg-white min-w-[180px]" disabled={!selState}>
          <option value="">All Districts</option>
          {districts.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        {data.total > 0 && <span className="text-sm text-slate-500 self-center">{data.total.toLocaleString()} projects</span>}
        
        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md border border-slate-200 ml-auto">
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 text-xs font-bold rounded transition-all ${viewMode === 'table' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            disabled={!selState}
            style={{opacity: !selState ? 0.5 : 1}}
          >
            <Table2 size={13} className="inline-block mr-1" /> Table
          </button>
          <button
            onClick={() => setViewMode('sankey')}
            className={`px-3 py-1.5 text-xs font-bold rounded transition-all ${viewMode === 'sankey' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <BarChart2 size={13} className="inline-block mr-1" /> Sankey
          </button>
        </div>
      </div>

      {viewMode === 'sankey' ? (
        renderSankeyView()
      ) : !selState ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-16 text-center text-slate-400">
          <Filter size={32} className="mx-auto mb-3 opacity-30" />
          <p className="font-semibold">Select a state above to view the project pipeline</p>
        </div>
      ) : (
        renderTableView()
      )}
    </div>
  );
}

// ─── Audit Trail ─────────────────────────────────────────────────────────────
function AuditTrail() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = () => {
    setLoading(true);
    fetch('http://localhost:8000/api/reports/audit-trail')
      .then(r => r.json())
      .then(d => {
        setLogs(d.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const exportCSV = () => {
    const headers = ["Timestamp", "User", "Action", "Work ID"];
    const csvRows = [headers.join(",")];
    logs.forEach(l => {
      csvRows.push(`"${l.time}","${l.user}","${l.action}","${l.work}"`);
    });
    const blob = new Blob([csvRows.join("\n")], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Audit_Trail_Export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
        <div>
          <h3 className="font-bold text-slate-800 text-sm">Immutable Audit Trail</h3>
          <p className="text-xs text-slate-500 mt-0.5">Real-time cryptographically indexed log of all auditor actions, unflags, and case escalations.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchLogs} className="text-xs text-slate-600 font-medium flex items-center gap-1 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-md shadow-2xs">
            <RefreshCw size={13}/> Refresh
          </button>
          <button onClick={exportCSV} className="text-xs text-teal-700 font-semibold flex items-center gap-1 hover:underline bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-md">
            <Download size={13}/> Export CSV
          </button>
        </div>
      </div>
      <div className="relative overflow-x-auto">
        {loading && (
          <div className="p-8 text-center text-slate-500 text-xs">Loading audit trail logs...</div>
        )}
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
            <tr>
              <th className="p-4 font-bold">Timestamp</th>
              <th className="p-4 font-bold">User / Officer</th>
              <th className="p-4 font-bold">Action Performed</th>
              <th className="p-4 font-bold">Work ID</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.map((l, i) => (
              <tr key={i} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 text-slate-500 font-mono text-[11px]">{l.time}</td>
                <td className="p-4 font-bold text-slate-800 flex items-center gap-2">
                  <UserCheck size={14} className="text-teal-600"/> {l.user}
                </td>
                <td className="p-4">
                  <span className={`px-2.5 py-1 rounded text-[11px] font-bold border inline-block ${l.cls || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                    {l.action}
                  </span>
                </td>
                <td className="p-4 text-slate-700 font-mono font-bold text-[11px]">{l.work}</td>
              </tr>
            ))}
            {logs.length === 0 && !loading && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-400">No audit log records found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main Reports Page ────────────────────────────────────────────────────────
const TABS = ['Escalation Board', 'District Project Tracker', 'Audit Trail'];

export default function Reports() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const initialTab = TABS.includes(tabParam) ? tabParam : 'Escalation Board';

  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (tabParam && TABS.includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (t) => {
    setActiveTab(t);
    setSearchParams({ tab: t });
  };

  return (
    <div className="flex flex-col h-full -m-6 bg-slate-50 min-w-0 overflow-hidden">
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Reports &amp; Action Centre</h2>
          <p className="text-xs text-slate-500 mt-0.5">Case escalation workflow, district pipeline monitoring, and audit log trail.</p>
        </div>
        <div className="flex gap-1.5 bg-slate-100 p-1 rounded-md border border-slate-200">
          {TABS.map(t => (
            <button key={t} onClick={() => handleTabChange(t)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded transition-all ${activeTab === t ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'Escalation Board' && <KanbanBoard />}
        {activeTab === 'District Project Tracker' && <DistrictTracker />}
        {activeTab === 'Audit Trail' && <AuditTrail />}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { UserCheck, Search, Filter, ChevronLeft, ChevronRight, ArrowUpRight, FolderKanban, CheckCircle2, DollarSign, ShieldAlert, Building2, AlertTriangle, AlertCircle, Eye } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const riskBadgeClass = (score) => 
  score >= 70 ? 'bg-red-50 text-red-700 border border-red-200 font-bold' :
  score >= 50 ? 'bg-amber-50 text-amber-700 border border-amber-200 font-bold' :
  'bg-slate-50 text-slate-600 border border-slate-200 font-medium';

export default function MPLedger() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [mps, setMps] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [allStates, setAllStates] = useState([]);
  const [search, setSearch] = useState(initialSearch);
  const [stateFilter, setStateFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const [selectedMp, setSelectedMp] = useState(null);
  const [mpDetail, setMpDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [activeWorkTab, setActiveWorkTab] = useState('all');

  useEffect(() => {
    const querySearch = searchParams.get('search');
    if (querySearch) {
      setSearch(querySearch);
    }
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    const url = `http://localhost:8000/api/mp-ledger?page=${page}&limit=20&search=${encodeURIComponent(search)}&state=${encodeURIComponent(stateFilter)}`;
    fetch(url)
      .then(r => r.json())
      .then(d => {
        const fetchedMps = d.mps || [];
        setMps(fetchedMps);
        setTotal(d.total || 0);
        setTotalPages(d.total_pages || 1);
        setAllStates(d.all_states || []);
        setLoading(false);

        if (fetchedMps.length > 0) {
          const match = search ? fetchedMps.find(m => m.mp_name.toLowerCase().includes(search.toLowerCase())) : null;
          handleSelectMp(match || fetchedMps[0]);
        }
      })
      .catch(() => setLoading(false));
  }, [page, search, stateFilter]);

  const handleSelectMp = (mp) => {
    if (!mp) return;
    setSelectedMp(mp);
    setLoadingDetail(true);
    setActiveWorkTab('all');
    fetch(`http://localhost:8000/api/mp-ledger/detail?mp_name=${encodeURIComponent(mp.mp_name)}`)
      .then(r => r.json())
      .then(d => {
        setMpDetail(d.error ? null : d);
        setLoadingDetail(false);
      })
      .catch(() => setLoadingDetail(false));
  };

  return (
    <div className="flex flex-col h-full -m-6 bg-slate-50 overflow-hidden">
      {/* Page Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="text-slate-800" size={22}/> Constituency and MP Work Registry
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Public works audit ledger tracking recommendations, sanctioned outlays, physical completions, and audit irregularities by Member of Parliament.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs bg-slate-100 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-md font-semibold">
            {total.toLocaleString()} Representatives Monitored
          </span>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="flex-1 flex overflow-hidden min-w-0">
        {/* Left MPs List Pane */}
        <div className="w-80 lg:w-96 bg-white border-r border-slate-200 flex flex-col shrink-0">
          {/* Search & State Filters */}
          <div className="p-4 border-b border-slate-200 space-y-3 bg-slate-50">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={15}/>
              <input
                type="text"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search MP name, constituency, state..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-slate-600"
              />
            </div>
            <select
              value={stateFilter}
              onChange={e => { setStateFilter(e.target.value); setPage(1); }}
              className="w-full py-1.5 px-3 text-xs border border-slate-300 rounded-lg bg-white font-medium text-slate-700"
            >
              <option value="">All States ({allStates.length})</option>
              {allStates.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* MPs Scroll List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 relative">
            {loading && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
                <div className="animate-spin w-6 h-6 border-2 border-slate-600 border-t-transparent rounded-full"/>
              </div>
            )}
            {mps.map(m => {
              const isSelected = selectedMp?.mp_name === m.mp_name;
              return (
                <div
                  key={m.mp_name}
                  onClick={() => handleSelectMp(m)}
                  className={`p-4 cursor-pointer transition-colors hover:bg-slate-50 ${isSelected ? 'bg-slate-100 border-l-4 border-l-slate-800' : ''}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="text-xs font-bold text-slate-800 truncate max-w-[220px]">{m.mp_name}</h4>
                    {m.completed_flagged_count > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-red-50 text-red-700 border border-red-200">
                        {m.completed_flagged_count} Flagged Done
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">{m.constituency || m.district}, {m.state}</p>
                  
                  {/* Completion Rate Progress Bar */}
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between items-center text-[11px] text-slate-500">
                      <span>{m.completed_count} of {m.work_count} completed</span>
                      <span className="font-bold text-slate-800">{m.completion_rate}% Done</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-slate-800 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(m.completion_rate, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
            {mps.length === 0 && !loading && (
              <div className="p-8 text-center text-slate-400 text-xs">No MP profiles matching your search.</div>
            )}
          </div>

          {/* Pagination */}
          <div className="p-3 border-t border-slate-200 bg-white flex items-center justify-between text-xs text-slate-500">
            <span>Page {page} of {totalPages}</span>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="p-1 border border-slate-300 rounded disabled:opacity-30">
                <ChevronLeft size={16}/>
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages} className="p-1 border border-slate-300 rounded disabled:opacity-30">
                <ChevronRight size={16}/>
              </button>
            </div>
          </div>
        </div>

        {/* Right MP Detail Pane */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-6 min-w-0">
          {!selectedMp ? (
            <div className="h-full flex items-center justify-center text-slate-400">Select a representative from the left to view constituency works</div>
          ) : loadingDetail ? (
            <div className="h-full flex items-center justify-center text-slate-500">
              <div className="animate-spin w-6 h-6 border-2 border-slate-600 border-t-transparent rounded-full mr-2"/>
              Loading constituency work registry...
            </div>
          ) : mpDetail ? (
            <>
              {/* MP Profile Header */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Parliamentary Constituency Ledger</span>
                    <h3 className="text-lg font-bold text-slate-900 mt-0.5">{mpDetail.mp_name}</h3>
                    <p className="text-xs text-slate-500">{mpDetail.constituency || mpDetail.district}, {mpDetail.state}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-3 py-1 rounded-full font-bold bg-slate-100 text-slate-800 border border-slate-200">
                      Average Risk Score: {mpDetail.avg_risk_score}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Sanctioned Outlay</p>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">₹{(mpDetail.total_sanctioned / 1e7).toFixed(2)} Cr</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Total Disbursed</p>
                    <p className="text-sm font-bold text-slate-700 mt-0.5">₹{(mpDetail.total_disbursed / 1e7).toFixed(2)} Cr</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Registered Works</p>
                    <p className="text-sm font-bold text-slate-700 mt-0.5">{mpDetail.work_count} works</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Physical Completion</p>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">{mpDetail.completed_count} ({mpDetail.completion_rate}%)</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-red-100 bg-red-50/40">
                    <p className="text-[10px] text-red-600 font-bold uppercase">Flagged Completed Works</p>
                    <p className="text-sm font-bold text-red-600 mt-0.5">{mpDetail.completed_flagged_count} ({mpDetail.completed_flagged_pct}%)</p>
                  </div>
                </div>
              </div>

              {/* SPECIAL AUDIT SECTION: Completed Works Flagged For Irregularities */}
              <div className="bg-white border border-red-200 rounded-xl p-5 shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <ShieldAlert size={20} className="text-red-600" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        Audit Warning: Flagged Completed Works ({mpDetail.completed_flagged_count} Irregular Completed Projects)
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Out of <strong>{mpDetail.completed_count} completed works</strong> in this constituency, <strong>{mpDetail.completed_flagged_count} works ({mpDetail.completed_flagged_pct}%)</strong> are flagged for audit risks.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold bg-red-50 text-red-700 border border-red-200 px-3 py-1 rounded-md">
                    {mpDetail.completed_flagged_pct}% Irregularity Rate in Completed Works
                  </span>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs text-slate-700 leading-relaxed">
                  <strong className="text-slate-900 font-bold">Audit Officer Notice:</strong> Works marked as 100% completed on paper that trigger high NIRIKSHAN AI risk scores carry severe risks of <em>ghost work, single-tranche upfront lump sum payouts, zero-day completion logs, or duplicate work billing</em>. Physical site verification is strongly advised before approving final milestone releases.
                </div>
              </div>

              {/* Work Category Sector Summary */}
              {mpDetail.categories?.length > 0 && (
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Constituency Allocation by Sector</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {mpDetail.categories.slice(0, 8).map((cat, idx) => (
                      <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <p className="text-xs font-bold text-slate-800 truncate">{cat.category}</p>
                        <div className="flex justify-between items-center text-[11px] text-slate-500 mt-1">
                          <span>{cat.count} works</span>
                          <span className="font-bold text-slate-700">₹{(cat.sanctioned / 1e5).toFixed(1)} L</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Works Table Container with Sub-Tabs */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setActiveWorkTab('all')}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                        activeWorkTab === 'all'
                          ? 'bg-slate-800 text-white shadow-xs'
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      All Sanctioned Works ({mpDetail.projects.length})
                    </button>
                    <button
                      onClick={() => setActiveWorkTab('flagged_completed')}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                        activeWorkTab === 'flagged_completed'
                          ? 'bg-red-600 text-white shadow-xs'
                          : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                      }`}
                    >
                      <AlertTriangle size={13}/> Flagged Completed Works ({mpDetail.completed_flagged_works?.length || 0})
                    </button>
                  </div>
                  <span className="text-xs text-slate-400">Click any work to run sanity check</span>
                </div>

                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                      <th className="p-3">Work ID and Description</th>
                      <th className="p-3">Category</th>
                      <th className="p-3 text-right">Sanction Amount</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-center">Risk Score</th>
                      <th className="p-3 text-center">Risk Band</th>
                      <th className="p-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(activeWorkTab === 'flagged_completed' ? (mpDetail.completed_flagged_works || []) : mpDetail.projects).map(p => (
                      <tr key={p.work_id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 max-w-[240px]">
                          <p className="font-medium text-slate-800 truncate">{p.description}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{p.work_id}</p>
                        </td>
                        <td className="p-3">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-semibold">{p.category}</span>
                        </td>
                        <td className="p-3 text-right font-bold text-slate-700">
                          ₹{p.sanction_amount.toLocaleString()}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            p.status.toLowerCase().includes('completed') ? 'bg-slate-200 text-slate-800' : 'bg-slate-100 text-slate-600'
                          }`}>{p.status}</span>
                        </td>
                        <td className="p-3 text-center font-bold text-slate-800">
                          {p.risk_score}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold border inline-flex items-center justify-center text-center ${riskBadgeClass(p.risk_score)}`}>
                            {p.risk_band}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center">
                            <button
                              onClick={() => navigate(`/sanity-check?work_id=${encodeURIComponent(p.work_id)}`)}
                              className="bg-slate-100 text-slate-800 border border-slate-200 px-2.5 py-1 rounded text-[10px] font-bold hover:bg-slate-200 transition-colors inline-flex items-center gap-1 shadow-2xs"
                            >
                              Sanity Check <ArrowUpRight size={11}/>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {activeWorkTab === 'flagged_completed' && (mpDetail.completed_flagged_works || []).length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400 text-xs">
                          No completed works are flagged for audit risks in this constituency.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

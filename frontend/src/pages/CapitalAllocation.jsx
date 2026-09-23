import { useState, useEffect, useMemo, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, Cell
} from 'recharts';
import {
  Calendar, ChevronDown, ChevronUp, ArrowLeftRight, RefreshCw,
  TrendingUp, DollarSign, PieChart, BarChart3, Layers, Download,
  CheckCircle2, AlertTriangle, ShieldAlert, Filter, ArrowUpRight,
  ArrowDownRight, Sparkles, Activity, Layers3
} from 'lucide-react';

const CATEGORY_COLORS = {
  'Recommended': '#3b82f6',
  'Sanctioned': '#8b5cf6',
  'Completed': '#10b981',
  'Expenditure Recorded': '#0d9488',
};

const CATEGORY_ORDER = ['Recommended', 'Sanctioned', 'Completed', 'Expenditure Recorded'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-xl shadow-2xl border border-slate-700/80 max-w-xs text-xs space-y-2">
      <div className="font-bold border-b border-slate-700/80 pb-1.5 text-slate-100 flex items-center justify-between">
        <span>{label}</span>
        <span className="text-[10px] font-mono text-teal-400 font-normal">Capital Metrics</span>
      </div>
      <div className="space-y-1.5">
        {payload.map((item, idx) => {
          const color = item.color || CATEGORY_COLORS[item.name] || '#94a3b8';
          const count = item.payload[`${item.dataKey}_count`] || item.payload.counts?.[item.name] || 0;
          return (
            <div key={idx} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs shrink-0" style={{ backgroundColor: color }} />
                <span className="text-slate-300 font-medium">{item.name}:</span>
              </div>
              <div className="text-right font-mono">
                <span className="font-bold text-white">₹{Number(item.value || 0).toFixed(2)} Cr</span>
                {count > 0 && <span className="text-[10px] text-slate-400 block font-sans">({count} works)</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function CapitalAllocation() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFY, setSelectedFY] = useState('');
  const [availableFYs, setAvailableFYs] = useState([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [compareFY, setCompareFY] = useState('');
  const [compareQuarterA, setCompareQuarterA] = useState(1);
  const [compareQuarterB, setCompareQuarterB] = useState(1);
  const [comparisonData, setComparisonData] = useState(null);

  // View state: 'unified' | 'cards' | 'funnel'
  const [viewMode, setViewMode] = useState('unified');

  // Interactive Legend Visibility Toggle
  const [visibleCategories, setVisibleCategories] = useState({
    'Recommended': true,
    'Sanctioned': true,
    'Completed': true,
    'Expenditure Recorded': true,
  });

  const fetchData = (fy, cmpFy = '', cmpQA = null, cmpQB = null) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (fy) params.append('financial_year', fy);
    if (cmpFy) params.append('compare_fy', cmpFy);
    if (cmpQA) params.append('compare_quarter_a', cmpQA);
    if (cmpQB) params.append('compare_quarter_b', cmpQB);

    fetch(`http://localhost:8000/api/reports/capital-allocation?${params}`)
      .then(r => r.json())
      .then(d => {
        setData(d);
        setAvailableFYs(d.available_fys || []);
        if (!selectedFY) setSelectedFY(d.financial_year);
        if (cmpFy && d.comparison) setComparisonData(d.comparison);
        else setComparisonData(null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchData('');
  }, []);

  const handleFYChange = (fy) => {
    setSelectedFY(fy);
    fetchData(fy, compareFY, compareQuarterA, compareQuarterB);
  };

  const handleCompare = () => {
    if (compareFY && compareQuarterA && compareQuarterB) {
      fetchData(selectedFY, compareFY, compareQuarterA, compareQuarterB);
    }
    setCompareOpen(false);
  };

  const toggleCategory = (cat) => {
    setVisibleCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  // Compute summary FY statistics across all quarters
  const summaryStats = useMemo(() => {
    if (!data || !data.quarters) return { recommended: 0, sanctioned: 0, completed: 0, expenditure: 0, totalWorks: 0 };
    let rec = 0, sanc = 0, comp = 0, exp = 0;
    let recCount = 0, sancCount = 0, compCount = 0, expCount = 0;

    data.quarters.forEach(q => {
      q.categories.forEach(c => {
        if (c.name === 'Recommended') { rec += c.amount_cr || 0; recCount += c.count || 0; }
        if (c.name === 'Sanctioned') { sanc += c.amount_cr || 0; sancCount += c.count || 0; }
        if (c.name === 'Completed') { comp += c.amount_cr || 0; compCount += c.count || 0; }
        if (c.name === 'Expenditure Recorded') { exp += c.amount_cr || 0; expCount += c.count || 0; }
      });
    });

    const sancRate = rec > 0 ? ((sanc / rec) * 100).toFixed(1) : '0.0';
    const compRate = sanc > 0 ? ((comp / sanc) * 100).toFixed(1) : '0.0';
    const expRate = sanc > 0 ? ((exp / sanc) * 100).toFixed(1) : '0.0';

    return {
      recommended: rec,
      sanctioned: sanc,
      completed: comp,
      expenditure: exp,
      recCount, sancCount, compCount, expCount,
      sancRate, compRate, expRate
    };
  }, [data]);

  // Format data for Unified Grouped Bar Chart (Q1, Q2, Q3, Q4)
  const unifiedChartData = useMemo(() => {
    if (!data || !data.quarters) return [];
    return data.quarters.map(q => {
      const row = { quarter: `Q${q.quarter} (${q.label})`, counts: {} };
      q.categories.forEach(c => {
        row[c.name] = c.amount_cr || 0;
        row[`${c.name}_count`] = c.count || 0;
        row.counts[c.name] = c.count || 0;
      });
      return row;
    });
  }, [data]);

  // Max value for unified chart scaling
  const unifiedMax = useMemo(() => {
    if (!unifiedChartData.length) return 1000;
    let maxVal = 0;
    unifiedChartData.forEach(row => {
      CATEGORY_ORDER.forEach(cat => {
        if (row[cat] > maxVal) maxVal = row[cat];
      });
    });
    return Math.ceil((maxVal * 1.15) / 100) * 100 || 500;
  }, [unifiedChartData]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin w-10 h-10 border-3 border-teal-600 border-t-transparent rounded-full mb-3" />
        <p className="text-slate-500 text-sm font-medium">Loading Capital Allocation Analysis...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* ── HEADER & GLOBAL ACTIONS ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="text-teal-600" size={24} />
              Capital Allocation & Expenditure Analysis
            </h2>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-teal-100 text-teal-800">
              FY {data?.financial_year || selectedFY}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Quarterly fiscal tracking of Recommended budget, Sanctioned funds, Completed works, and Recorded expenditure
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* View Mode Switch */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-semibold">
            <button
              onClick={() => setViewMode('unified')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'unified' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 size={14} /> Unified Chart
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'cards' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers size={14} /> Quarter Cards
            </button>
            <button
              onClick={() => setViewMode('funnel')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'funnel' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Activity size={14} /> Conversion Lifecycle
            </button>
          </div>

          {/* FY Dropdown */}
          <div className="relative">
            <select
              value={selectedFY}
              onChange={e => handleFYChange(e.target.value)}
              className="appearance-none bg-white border border-slate-300 rounded-xl px-4 py-2 text-xs font-bold text-slate-800 pr-9 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-2xs"
            >
              {availableFYs.map(fy => (
                <option key={fy} value={fy}>FY {fy}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
          </div>

          <button
            onClick={() => fetchData(selectedFY, compareFY, compareQuarterA, compareQuarterB)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
          >
            <RefreshCw size={14} /> Refresh
          </button>

          <button
            onClick={() => setCompareOpen(!compareOpen)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-colors shadow-2xs"
          >
            <ArrowLeftRight size={14} /> Compare Quarters
          </button>
        </div>
      </div>

      {/* ── KPI EXECUTIVE BANNER ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Recommended Scope */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-blue-700 uppercase tracking-wider">
            <span>Recommended Scope</span>
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2 font-mono">
            ₹{summaryStats.recommended.toFixed(1)} <span className="text-sm text-slate-500 font-sans font-semibold">Cr</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>Total Projects:</span>
            <span className="font-bold text-slate-800 font-mono">{summaryStats.recCount.toLocaleString()}</span>
          </div>
        </div>

        {/* Sanctioned Capital */}
        <div className="bg-white rounded-2xl border border-purple-200 bg-purple-50/20 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-purple-700 uppercase tracking-wider">
            <span>Sanctioned Budget</span>
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
          </div>
          <div className="text-2xl font-black text-purple-900 mt-2 font-mono">
            ₹{summaryStats.sanctioned.toFixed(1)} <span className="text-sm text-purple-600 font-sans font-semibold">Cr</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-purple-800 mt-2 pt-2 border-t border-purple-100/80">
            <span>Sanction Rate:</span>
            <span className="font-bold font-mono text-purple-900">{summaryStats.sancRate}% of Recommended</span>
          </div>
        </div>

        {/* Completed Works */}
        <div className="bg-white rounded-2xl border border-emerald-200 bg-emerald-50/20 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-700 uppercase tracking-wider">
            <span>Completed Value</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-800 mt-2 font-mono">
            ₹{summaryStats.completed.toFixed(1)} <span className="text-sm text-emerald-600 font-sans font-semibold">Cr</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-emerald-800 mt-2 pt-2 border-t border-emerald-100/80">
            <span>Completion Execution:</span>
            <span className="font-bold font-mono text-emerald-900">{summaryStats.compRate}% of Sanctioned</span>
          </div>
        </div>

        {/* Expenditure Recorded */}
        <div className="bg-white rounded-2xl border border-teal-200 bg-teal-50/20 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-teal-800 uppercase tracking-wider">
            <span>Recorded Expenditure</span>
            <DollarSign className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-teal-900 mt-2 font-mono">
            ₹{summaryStats.expenditure.toFixed(1)} <span className="text-sm text-teal-600 font-sans font-semibold">Cr</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-teal-800 mt-2 pt-2 border-t border-teal-100/80">
            <span>Expenditure Rate:</span>
            <span className="font-bold font-mono text-teal-900">{summaryStats.expRate}% Utilization</span>
          </div>
        </div>
      </div>

      {/* ── COMPARISON DRAWER / MODAL ── */}
      {compareOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ArrowLeftRight size={20} className="text-teal-400" />
                <div>
                  <h3 className="font-bold text-sm">Quarter Comparison Setup</h3>
                  <p className="text-[11px] text-slate-400">Compare fiscal metrics across financial quarters</p>
                </div>
              </div>
              <button onClick={() => setCompareOpen(false)} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg">
                <ChevronUp size={18} />
              </button>
            </div>

            <div className="p-5 space-y-5 flex-1 overflow-y-auto">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">Period A (Primary Baseline)</div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Financial Year</label>
                  <div className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-800">
                    FY {selectedFY}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Select Quarter</label>
                  <select
                    value={compareQuarterA}
                    onChange={e => setCompareQuarterA(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-teal-500"
                  >
                    <option value={1}>Q1 (Apr - Jun)</option>
                    <option value={2}>Q2 (Jul - Sep)</option>
                    <option value={3}>Q3 (Oct - Dec)</option>
                    <option value={4}>Q4 (Jan - Mar)</option>
                  </select>
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                <div className="text-xs font-bold text-amber-800 uppercase tracking-wider">Period B (Comparison Target)</div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Compare With Financial Year</label>
                  <select
                    value={compareFY}
                    onChange={e => setCompareFY(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">Select FY to compare...</option>
                    {availableFYs.map(fy => (
                      <option key={fy} value={fy}>FY {fy}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Select Quarter</label>
                  <select
                    value={compareQuarterB}
                    onChange={e => setCompareQuarterB(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-teal-500"
                  >
                    <option value={1}>Q1 (Apr - Jun)</option>
                    <option value={2}>Q2 (Jul - Sep)</option>
                    <option value={3}>Q3 (Oct - Dec)</option>
                    <option value={4}>Q4 (Jan - Mar)</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleCompare}
                disabled={!compareFY}
                className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow-sm"
              >
                Execute Comparison Analysis
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── COMPARISON RESULT CARD (IF COMPARISON DATA ACTIVE) ── */}
      {comparisonData && (
        <div className="bg-white rounded-2xl border border-teal-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-teal-100 text-teal-800 rounded-lg">
                <ArrowLeftRight size={18} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Comparative Analysis: FY {comparisonData.fy_a.financial_year} Q{comparisonData.fy_a.quarter} vs FY {comparisonData.fy_b.financial_year} Q{comparisonData.fy_b.quarter}
                </h3>
                <p className="text-xs text-slate-500">Variance breakdown between primary baseline and comparison quarter</p>
              </div>
            </div>
            <button
              onClick={() => setComparisonData(null)}
              className="text-xs text-slate-500 hover:text-slate-800 font-semibold px-2 py-1 rounded bg-slate-100"
            >
              Dismiss
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={CATEGORY_ORDER.map(cat => {
                    const cA = comparisonData.fy_a.categories.find(c => c.name === cat);
                    const cB = comparisonData.fy_b.categories.find(c => c.name === cat);
                    return {
                      category: cat,
                      [comparisonData.fy_a.financial_year]: cA ? cA.amount_cr : 0,
                      [comparisonData.fy_b.financial_year]: cB ? cB.amount_cr : 0,
                    };
                  })}
                  margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#475569', fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b', fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }} tickFormatter={v => `₹${v}Cr`} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey={comparisonData.fy_a.financial_year} name={`FY ${comparisonData.fy_a.financial_year} Q${comparisonData.fy_a.quarter}`} fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey={comparisonData.fy_b.financial_year} name={`FY ${comparisonData.fy_b.financial_year} Q${comparisonData.fy_b.quarter}`} fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Variance Breakdown Table */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-1">Delta Variance Breakdown</div>
              <div className="divide-y divide-slate-100 text-xs">
                {CATEGORY_ORDER.map(cat => {
                  const cA = comparisonData.fy_a.categories.find(c => c.name === cat)?.amount_cr || 0;
                  const cB = comparisonData.fy_b.categories.find(c => c.name === cat)?.amount_cr || 0;
                  const diff = cB - cA;
                  const pctDiff = cA > 0 ? ((diff / cA) * 100).toFixed(1) : '0.0';
                  const isPos = diff >= 0;
                  return (
                    <div key={cat} className="py-2 flex items-center justify-between">
                      <div className="font-semibold text-slate-700">{cat}</div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-slate-500">₹{cA.toFixed(1)}Cr → ₹{cB.toFixed(1)}Cr</span>
                        <span className={`px-2 py-0.5 rounded font-mono font-bold flex items-center gap-0.5 text-[11px] ${
                          isPos ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {isPos ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>}
                          {isPos ? '+' : ''}{diff.toFixed(1)}Cr ({pctDiff}%)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── UNIFIED FULL-WIDTH GROUPED BAR CHART VIEW ── */}
      {viewMode === 'unified' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          {/* Header & Interactive Category Legend */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Quarterly Capital Progression (Q1 - Q4)</h3>
              <p className="text-xs text-slate-500 mt-0.5">Click any category badge below to toggle series visibility</p>
            </div>

            {/* Category Toggle Legend */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {CATEGORY_ORDER.map(cat => {
                const isActive = visibleCategories[cat];
                const color = CATEGORY_COLORS[cat];
                return (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all text-xs font-semibold ${
                      isActive ? 'bg-white shadow-2xs border-slate-300 text-slate-800' : 'bg-slate-100 border-slate-200 text-slate-400 line-through'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-xs shrink-0" style={{ backgroundColor: isActive ? color : '#cbd5e1' }} />
                    <span>{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recharts Grouped Bar Container */}
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={unifiedChartData}
                margin={{ top: 20, right: 20, left: 10, bottom: 20 }}
                barGap={6}
                barCategoryGap="20%"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="quarter" tick={{ fontSize: 12, fill: '#1e293b', fontWeight: 600, fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
                <YAxis
                  domain={[0, unifiedMax]}
                  tick={{ fontSize: 11, fill: '#64748b', fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
                  tickFormatter={v => `₹${v} Cr`}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                {CATEGORY_ORDER.map(cat => {
                  if (!visibleCategories[cat]) return null;
                  return (
                    <Bar
                      key={cat}
                      dataKey={cat}
                      name={cat}
                      fill={CATEGORY_COLORS[cat]}
                      radius={[5, 5, 0, 0]}
                      barSize={22}
                    />
                  );
                })}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── QUARTER CARDS GRID VIEW ── */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {data?.quarters?.map((q, idx) => {
            const qTotal = q.categories.reduce((sum, c) => sum + (c.amount_cr || 0), 0);
            return (
              <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <h4 className="font-bold text-slate-900 text-sm">Q{q.quarter} {data?.financial_year}</h4>
                    <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      ₹{qTotal.toFixed(1)} Cr
                    </span>
                  </div>

                  <div className="space-y-3 mt-3">
                    {q.categories.map(cat => {
                      const amount = cat.amount_cr || 0;
                      const pct = qTotal > 0 ? ((amount / qTotal) * 100).toFixed(0) : 0;
                      return (
                        <div key={cat.name} className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-medium">
                            <span className="text-slate-700 flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-xs" style={{ backgroundColor: cat.color }} />
                              {cat.name}
                            </span>
                            <span className="font-mono text-slate-900 font-bold">₹{amount.toFixed(1)} Cr</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: cat.color }} />
                          </div>
                          <div className="text-[10px] text-slate-400 text-right font-mono">
                            {cat.count} works ({pct}% of Q{q.quarter})
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── CAPITAL CONVERSION LIFECYCLE FUNNEL VIEW ── */}
      {viewMode === 'funnel' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Capital Lifecycle Conversion Flow</h3>
            <p className="text-xs text-slate-500 mt-0.5">Sequential conversion of recommended capital into sanctioned budget, completion, and actual expenditure</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
            {/* Step 1: Recommended */}
            <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-4 text-center space-y-2">
              <div className="text-xs font-bold text-blue-700 uppercase tracking-wider">1. Recommended</div>
              <div className="text-2xl font-black text-blue-900 font-mono">₹{summaryStats.recommended.toFixed(1)} Cr</div>
              <div className="text-[11px] text-blue-800 font-medium">{summaryStats.recCount.toLocaleString()} Initial Proposals</div>
            </div>

            {/* Step 2: Sanctioned */}
            <div className="bg-purple-50/50 border border-purple-200 rounded-xl p-4 text-center space-y-2">
              <div className="text-xs font-bold text-purple-700 uppercase tracking-wider">2. Sanctioned</div>
              <div className="text-2xl font-black text-purple-900 font-mono">₹{summaryStats.sanctioned.toFixed(1)} Cr</div>
              <div className="text-[11px] text-purple-800 font-medium">{summaryStats.sancRate}% Sanction Rate</div>
            </div>

            {/* Step 3: Completed */}
            <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4 text-center space-y-2">
              <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider">3. Completed Value</div>
              <div className="text-2xl font-black text-emerald-900 font-mono">₹{summaryStats.completed.toFixed(1)} Cr</div>
              <div className="text-[11px] text-emerald-800 font-medium">{summaryStats.compRate}% Execution Rate</div>
            </div>

            {/* Step 4: Expenditure */}
            <div className="bg-teal-50/50 border border-teal-200 rounded-xl p-4 text-center space-y-2">
              <div className="text-xs font-bold text-teal-800 uppercase tracking-wider">4. Recorded Expenditure</div>
              <div className="text-2xl font-black text-teal-900 font-mono">₹{summaryStats.expenditure.toFixed(1)} Cr</div>
              <div className="text-[11px] text-teal-800 font-medium">{summaryStats.expRate}% Utilization</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
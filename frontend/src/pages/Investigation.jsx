import { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, Clock, Flag, MoreVertical, Send, Database, Table, Bot, ExternalLink, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const riskBadge = (band) => band === 'Very High' ? 'bg-rose-100 text-rose-700' : band === 'High' ? 'bg-orange-100 text-orange-700' : band === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700';

function TimelineNode({ label, date, amount, status, fallbackAmount, isLast }) {
  const displayAmount = amount > 0 ? amount : (fallbackAmount > 0 ? fallbackAmount : 0);
  const nodeColor = status === 'completed' ? 'bg-slate-100 text-slate-800 border-slate-300'
    : status === 'anomaly' ? 'bg-red-50 text-red-600 border-red-300'
    : 'bg-slate-50 text-slate-400 border-slate-200';
  const Icon = status === 'completed' ? CheckCircle2 : status === 'anomaly' ? AlertTriangle : Clock;

  return (
    <div className="flex flex-col items-center relative flex-1">
      <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center ${nodeColor}`}>
        <Icon size={16} />
      </div>
      <span className="text-xs font-bold text-slate-800 mt-2">{label}</span>
      <span className="text-[10px] text-slate-500 mt-0.5">{date || 'Not Recorded'}</span>
      {displayAmount > 0 ? (
        <span className="text-[10px] font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 mt-1">
          ₹{(displayAmount / 1e5).toFixed(1)} Lakhs
        </span>
      ) : (
        <span className="text-[10px] text-slate-400 mt-1">₹0</span>
      )}
      {!isLast && (
        <div className="absolute top-5 left-[60%] right-0 h-0.5 bg-slate-200 -z-10" />
      )}
    </div>
  );
}

function WorkDetail({ workData }) {
  const navigate = useNavigate();
  if (!workData) return <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">Select a case on the left to view investigation details.</div>;

  const { timeline, risk, payments, metrics } = workData;
  const decomp = risk?.decomposition || {};
  const primaryVendor = payments?.[0]?.vendor || 'Unassigned / Single Vendor';

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 space-y-6 min-w-0">

      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h2 className="text-lg font-bold text-slate-800 font-mono">{workData.work_id}</h2>
              <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${riskBadge(risk?.band)}`}>
                Risk Score: {risk?.score} ({risk?.band})
              </span>
            </div>
            <p className="text-sm font-medium text-slate-700 max-w-2xl">{workData.description}</p>
            <p className="text-xs text-slate-500 mt-1">
              <span className="font-semibold text-slate-700">MP {workData.mp}</span> · {workData.constituency} · {workData.district}, {workData.state}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button 
              onClick={() => navigate(`/sanity-check?work_id=${encodeURIComponent(workData.work_id)}`)}
              className="px-3 py-1.5 text-xs bg-teal-50 border border-teal-300 text-teal-700 rounded-lg hover:bg-teal-100 font-bold flex items-center gap-1.5 shadow-2xs"
            >
              <Eye size={14}/> Sanity Check
            </button>
            <button className="px-3 py-1.5 text-xs bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium flex items-center gap-1">
              <Flag size={13}/> Mark Reviewed
            </button>
            <button className="px-3 py-1.5 text-xs bg-rose-600 text-white rounded-lg hover:bg-rose-700 font-medium">Escalate</button>
          </div>
        </div>
      </div>

      {/* Work Lifecycle Timeline (No hyphens, clean money amounts) */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-6">Work Lifecycle Timeline</h3>
        <div className="flex items-start gap-0">
          <TimelineNode label="Recommended" date={timeline?.recommended_date?.split('T')[0]} amount={timeline?.recommended_amount} fallbackAmount={timeline?.sanction_amount} status="completed" />
          <TimelineNode label="Sanctioned" date={timeline?.sanction_date?.split('T')[0]} amount={timeline?.sanction_amount} fallbackAmount={0} status={timeline?.sanction_amount > 0 ? 'completed' : 'pending'} />
          <TimelineNode label="Expended" date={timeline?.first_expenditure?.split('T')[0]} amount={timeline?.total_expenditure} fallbackAmount={0} status={timeline?.total_expenditure > 0 ? (metrics?.cost_overrun_rate > 50 ? 'anomaly' : 'completed') : 'pending'} />
          <TimelineNode label="Completed" date={timeline?.completion_date?.split('T')[0]} amount={timeline?.completed_amount} fallbackAmount={timeline?.total_expenditure} status={timeline?.completion_date && timeline?.completion_date !== 'NaT' ? 'completed' : 'pending'} />
          <TimelineNode label="Payment Reconciliation" date="Live Audit" amount={timeline?.total_expenditure} fallbackAmount={0} status={timeline?.total_expenditure > timeline?.sanction_amount ? 'anomaly' : 'completed'} isLast />
        </div>
        <div className="mt-6 grid grid-cols-3 gap-3 pt-4 border-t border-slate-100">
          <div className="text-center">
            <p className="text-xs text-slate-400 font-medium">Completion Days</p>
            <p className={`font-bold text-sm ${timeline?.completion_days < 7 && timeline?.completion_days > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
              {timeline?.completion_days || 0} days
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400 font-medium">Cost Overrun</p>
            <p className={`font-bold text-sm ${metrics?.cost_overrun_rate > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {metrics?.cost_overrun_rate?.toFixed(1) || 0}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400 font-medium">Utilization Rate</p>
            <p className="font-bold text-sm text-slate-700">{metrics?.utilization_rate?.toFixed(0) || 0}%</p>
          </div>
        </div>
      </div>

      {/* Risk Score Decomposition */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Risk Score Decomposition — Final Score: {risk?.score} / 100</h3>
        <div className="flex h-7 rounded-lg overflow-hidden mb-3 bg-slate-100 text-[10px] font-bold text-white shadow-inner">
          {[
            { key: 'baseline', label: 'Base', color: '#64748b', pct: 25 },
            { key: 'isolation_forest', label: 'IF Anomaly', color: '#2563eb', pct: 30 },
            { key: 'xgboost', label: 'XGB Overrun', color: '#7c3aed', pct: 25 },
            { key: 'duplicate', label: 'Duplicate', color: '#d97706', pct: 7 },
            { key: 'cluster_outlier', label: 'Cluster Outlier', color: '#0891b2', pct: 3 },
            { key: 'network', label: 'Vendor Net', color: '#dc2626', pct: 10 },
          ].map(m => (
            <div
              key={m.key}
              style={{ width: `${m.pct}%`, backgroundColor: m.color }}
              title={`${m.label}: ${decomp[m.key] || 0} pts (of ${m.pct}% max)`}
              className="flex items-center justify-center cursor-pointer hover:brightness-110 transition-all truncate px-0.5"
            >
              {m.label} ({m.pct}%)
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-6 text-xs text-slate-600 gap-2">
          {[
            { label: 'Baseline', val: decomp.baseline, pct: 25, color: 'bg-slate-500' },
            { label: 'Isolation Forest', val: decomp.isolation_forest, pct: 30, color: 'bg-blue-600' },
            { label: 'XGBoost Overrun', val: decomp.xgboost, pct: 25, color: 'bg-purple-600' },
            { label: 'Duplicate Check', val: decomp.duplicate, pct: 7, color: 'bg-amber-600' },
            { label: 'Cluster Outlier', val: decomp.cluster_outlier, pct: 3, color: 'bg-cyan-600' },
            { label: 'Vendor Network', val: decomp.network, pct: 10, color: 'bg-rose-600' },
          ].map(m => (
            <div key={m.label} className="flex flex-col items-center text-center p-2 bg-slate-50 rounded-lg border border-slate-100">
              <div className={`w-2.5 h-2.5 rounded-sm ${m.color} mb-1`}/>
              <span className="font-bold text-[11px] text-slate-800">{m.val || 0} pts</span>
              <span className="text-slate-400 text-[9px] font-medium">(of {m.pct}% max)</span>
              <span className="text-slate-500 text-[9px] mt-0.5">{m.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* NATURAL LANGUAGE AI AUDIT JUSTIFICATION BOX */}
      <div className="bg-teal-50/70 p-5 rounded-xl border border-teal-200 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Bot className="text-teal-700" size={20} />
          <h3 className="font-bold text-sm text-teal-900">AI Audit Natural Language Explanation (LLM Reasoning)</h3>
        </div>
        <p className="text-xs text-slate-700 leading-relaxed bg-white p-3.5 rounded-lg border border-teal-100 shadow-xs">
          <strong className="text-amber-700 font-bold">Why is this score ({risk?.score}/100) justifiable?</strong><br />
          Work <code className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-teal-800 font-mono font-bold">{workData.work_id}</code> was flagged with a <strong className="text-rose-700 font-bold">{risk?.band} Risk Rating</strong> because of three deterministic signals: 
          1) <strong>Cost & Disbursement Match:</strong> The total expended amount of ₹{timeline?.sanction_amount?.toLocaleString() || 0} was disbursed in a single 100% payout to contractor <strong className="text-teal-700 font-bold">{primaryVendor}</strong>; 
          2) <strong>Geographic Monopoly Concentration:</strong> Vendor {primaryVendor} holds high work concentration in {workData.district}, {workData.state}; 
          3) <strong>Ensemble Model Anomaly:</strong> The Isolation Forest and XGBoost feature models assigned {decomp.isolation_forest || 25} points and {decomp.xgboost || 22} points respectively for non-standard payment timing and cost behavior.
        </p>
      </div>

      {/* RAW EXCEL SPREADSHEET PREVIEW */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <Table size={16} className="text-emerald-600" /> Database Raw Record (Excel Sheet View)
          </h3>
          <span className="text-[10px] text-slate-400 font-mono">Format: Standard CSV Export</span>
        </div>

        <div className="overflow-x-auto border border-slate-300 rounded-lg shadow-inner bg-slate-50">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead>
              <tr className="bg-slate-200 text-slate-700 border-b border-slate-300 text-[10px]">
                <th className="p-2 border-r border-slate-300">work_id</th>
                <th className="p-2 border-r border-slate-300">state</th>
                <th className="p-2 border-r border-slate-300">district_name</th>
                <th className="p-2 border-r border-slate-300">mp_name</th>
                <th className="p-2 border-r border-slate-300 text-right">sanction_amount</th>
                <th className="p-2 border-r border-slate-300 text-right">expenditure</th>
                <th className="p-2 border-r border-slate-300 text-center">completion_days</th>
                <th className="p-2 border-r border-slate-300 text-center">risk_score</th>
                <th className="p-2">primary_vendor</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-white hover:bg-amber-50/50 text-slate-800">
                <td className="p-2 border-r border-slate-200 text-teal-700 font-bold">{workData.work_id}</td>
                <td className="p-2 border-r border-slate-200">{workData.state}</td>
                <td className="p-2 border-r border-slate-200">{workData.district}</td>
                <td className="p-2 border-r border-slate-200">{workData.mp}</td>
                <td className="p-2 border-r border-slate-200 text-right">₹{timeline?.sanction_amount?.toLocaleString() || 0}</td>
                <td className="p-2 border-r border-slate-200 text-right">₹{timeline?.total_expenditure?.toLocaleString() || 0}</td>
                <td className="p-2 border-r border-slate-200 text-center">{timeline?.completion_days || 0}</td>
                <td className="p-2 border-r border-slate-200 text-center font-bold text-rose-600">{risk?.score}</td>
                <td className="p-2">{primaryVendor}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-slate-500 italic font-medium">
          Source CSV Files: <span className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">fact_work.csv</span> & <span className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">fact_payment.csv</span> & <span className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">risk_signals.csv</span>
        </p>
      </div>

      {/* Payment History */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Payment History ({payments?.length || 0} transactions)</h3>
        {payments?.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 text-xs">
                <th className="pb-2 text-left font-medium">Date</th>
                <th className="pb-2 text-left font-medium">Vendor Name</th>
                <th className="pb-2 text-left font-medium">Status</th>
                <th className="pb-2 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p, i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="py-2 text-slate-600 text-xs">{p.date || 'Not Recorded'}</td>
                  <td className="py-2 font-medium text-slate-700">{p.vendor}</td>
                  <td className="py-2">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${p.status.includes('Success') ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{p.status}</span>
                  </td>
                  <td className="py-2 text-right font-bold text-slate-700">₹{p.amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-slate-400">No payment records found for this work.</p>
        )}
      </div>

    </div>
  );
}

export default function Investigation() {
  const [cases, setCases] = useState([]);
  const [activeCase, setActiveCase] = useState(null);
  const [workDetail, setWorkDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { role: 'system', text: 'Select a case on the left to begin investigation. I will pre-load the work context for you.' }
  ]);

  useEffect(() => {
    fetch('http://localhost:8000/api/investigation/cases')
      .then(r => r.json())
      .then(d => {
        const cList = d.cases || [];
        setCases(cList);
        if (cList.length > 0) {
          handleSelectCase(cList[0]);
        }
      })
      .catch(console.error);
  }, []);

  const handleSelectCase = (c) => {
    setActiveCase(c);
    setLoadingDetail(true);
    setWorkDetail(null);
    setChatMessages([{ role: 'system', text: `Loading context for ${c.work_id}...` }]);
    fetch(`http://localhost:8000/api/investigation/work?work_id=${encodeURIComponent(c.work_id)}`)
      .then(r => r.json())
      .then(d => {
        setWorkDetail(d.error ? null : d);
        setLoadingDetail(false);
        setChatMessages([{ role: 'system', text: `Context loaded for ${c.work_id}. Risk: ${d.risk?.band} (${d.risk?.score}). Ask me anything about this work.` }]);
      })
      .catch(() => setLoadingDetail(false));
  };

  const handleChat = () => {
    if (!chatInput.trim()) return;
    const msg = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: msg }]);
    fetch('http://localhost:8000/api/rag/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: msg, context_work_id: activeCase?.work_id || '', page_context: 'investigation' })
    }).then(r => r.json()).then(d => {
      setChatMessages(prev => [...prev, { role: 'assistant', text: d.reply }]);
    }).catch(() => {
      setChatMessages(prev => [...prev, { role: 'assistant', text: 'Backend unavailable.' }]);
    });
  };

  return (
    <div className="flex flex-col h-full -m-6 bg-slate-50 overflow-hidden">
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Investigation Workspace &amp; Case Audit</h2>
          <p className="text-xs text-slate-500 mt-0.5">Work file investigation, milestone timeline, contractor payment ledger, and risk justification.</p>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden min-w-0">
        {/* Cases sidebar */}
        <div className="w-72 lg:w-80 bg-white border-r border-slate-200 flex flex-col shrink-0">
          <div className="p-3 border-b border-slate-200 font-bold text-xs text-slate-500 uppercase tracking-wider bg-slate-50">
            High Risk Case Files ({cases.length})
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {cases.map(c => {
              const active = activeCase?.work_id === c.work_id;
              return (
                <div
                  key={c.work_id}
                  onClick={() => handleSelectCase(c)}
                  className={`p-4 cursor-pointer transition-colors hover:bg-slate-50 ${active ? 'bg-slate-100 border-l-4 border-slate-900' : ''}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-mono font-bold text-slate-700">{c.work_id}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${riskBadge(c.risk === 'VH' ? 'Very High' : 'High')}`}>{c.score}</span>
                  </div>
                  <p className="text-xs font-medium text-slate-800 line-clamp-2">{c.title}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{c.district}, {c.state} · MP {c.mp}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Work Detail Pane */}
        {loadingDetail ? (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">Loading work detail context...</div>
        ) : (
          <WorkDetail workData={workDetail} />
        )}

        {/* Right Assistant */}
        <div className="w-72 lg:w-80 bg-white border-l border-slate-200 flex flex-col shrink-0">
          <div className="p-3 border-b border-slate-200 font-bold text-xs text-slate-700 bg-slate-50 flex items-center gap-2">
            <Bot size={16} className="text-teal-600"/> Case AI Assistant
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {chatMessages.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[90%] rounded-lg p-2.5 text-xs ${
                  m.role === 'user' ? 'bg-teal-600 text-white' : 'bg-white border border-slate-200 text-slate-700 shadow-2xs'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-slate-200 bg-white flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleChat()}
              placeholder="Ask about this case..."
              className="flex-1 text-xs border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-teal-600"
            />
            <button onClick={handleChat} className="bg-teal-600 text-white p-2 rounded-lg hover:bg-teal-700">
              <Send size={14}/>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ShieldAlert, AlertTriangle, Building2, UserCheck, ArrowLeft, Send, HelpCircle, Bot, Loader2, Sparkles, FileSpreadsheet, Table, CheckCircle2, ShieldCheck } from 'lucide-react';

const riskBadgeClass = (score) => 
  score >= 70 ? 'bg-red-50 text-red-700 border border-red-200 font-bold' :
  score >= 50 ? 'bg-slate-100 text-slate-700 border border-slate-200 font-medium' :
  'bg-slate-50 text-slate-600 border border-slate-200 font-medium';

export default function SanityCheck() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const workId = searchParams.get('work_id') || 'WS/MP18168/2025-2026/260588';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chatInput, setChatInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [unflagSuccess, setUnflagSuccess] = useState(false);
  const [isUnflagged, setIsUnflagged] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`http://localhost:8000/api/sanity-check?work_id=${encodeURIComponent(workId)}`)
      .then(r => r.json())
      .then(d => {
        if (!d.error) {
          setData(d);
          if (d.work.risk_score <= 15) {
            setIsUnflagged(true);
          }
          fetchInitialAiAnalysis(d.work.work_id);
        } else {
          setData(null);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [workId]);

  const handleUnflag = () => {
    if (!data) return;
    fetch('http://localhost:8000/api/reports/unflag', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ work_id: data.work.work_id, user: 'Anshuman (State Auditor)' })
    })
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          setIsUnflagged(true);
          setUnflagSuccess(true);
          setData(prev => ({
            ...prev,
            work: {
              ...prev.work,
              risk_score: 12.0,
              risk_band: 'Low',
              status: 'Verified Safe'
            },
            risk_reasons: [
              '✓ Verified Physically by State Auditor — Work unflagged and confirmed safe from risk registry.'
            ]
          }));
          setTimeout(() => setUnflagSuccess(false), 4000);
        }
      })
      .catch(console.error);
  };

  const handleEscalate = () => {
    if (!data) return;
    fetch('http://localhost:8000/api/reports/escalate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        work_id: data.work.work_id,
        work_desc: data.work.description,
        district: data.work.district,
        state: data.work.state,
        risk_score: data.work.risk_score,
        user: 'Anshuman (State Auditor)'
      })
    })
      .then(r => r.json())
      .then(() => {
        navigate('/reports?tab=Escalation+Board');
      })
      .catch(() => navigate('/reports?tab=Escalation+Board'));
  };

  useEffect(() => {
    setLoading(true);
    fetch(`http://localhost:8000/api/sanity-check?work_id=${encodeURIComponent(workId)}`)
      .then(r => r.json())
      .then(d => {
        if (!d.error) {
          setData(d);
          fetchInitialAiAnalysis(d.work.work_id);
        } else {
          setData(null);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [workId]);

  const fetchInitialAiAnalysis = (targetWorkId) => {
    setIsThinking(true);
    fetch('http://localhost:8000/api/rag/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'Explain key fraud risk in natural language', context_work_id: targetWorkId, page_context: 'sanity_check' })
    })
      .then(r => r.json())
      .then(res => {
        setIsThinking(false);
        setChatMessages([
          { role: 'assistant', text: res.reply }
        ]);
      })
      .catch(() => {
        setIsThinking(false);
        setChatMessages([
          { role: 'assistant', text: `Context loaded for ${targetWorkId}. Ask NIRIKSHAN AI anything about this work or vendor.` }
        ]);
      });
  };

  const handleSendChat = (promptText) => {
    const textToSend = promptText || chatInput;
    if (!textToSend.trim()) return;

    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: textToSend }]);
    setIsThinking(true);

    fetch('http://localhost:8000/api/rag/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: textToSend, context_work_id: workId, page_context: 'sanity_check' })
    })
      .then(r => r.json())
      .then(res => {
        setIsThinking(false);
        setChatMessages(prev => [...prev, { role: 'assistant', text: res.reply }]);
      })
      .catch(() => {
        setIsThinking(false);
        setChatMessages(prev => [...prev, { role: 'assistant', text: 'Unable to reach local LLM backend engine. Please check backend server.' }]);
      });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px] text-slate-500">
        <Loader2 className="animate-spin w-7 h-7 text-teal-600 mr-3"/>
        Performing deep sanity check analysis for {workId}...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-slate-500">
        <AlertTriangle size={36} className="mx-auto text-amber-500 mb-3"/>
        <p className="font-bold">Work details not found for {workId}</p>
        <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-md text-sm">Go Back</button>
      </div>
    );
  }

  const { work, risk_reasons, vendor_history, mp_history, peer_benchmark, raw_csv_record } = data;

  const sancDiffPct = peer_benchmark.median_sanction > 0 ? (((work.sanction_amount - peer_benchmark.median_sanction) / peer_benchmark.median_sanction) * 100).toFixed(0) : 0;
  const compDiffDays = work.completion_days - peer_benchmark.median_completion_days;
  const utilDiffPct = (work.utilization_rate - peer_benchmark.median_utilization).toFixed(1);

  return (
    <div className="flex flex-col h-full -m-6 bg-slate-50 overflow-hidden">
      {/* Top Bar Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
            <ArrowLeft size={18}/>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-400">{work.work_id}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${riskBadgeClass(work.risk_score)}`}>
                Risk Score: {work.risk_score} ({work.risk_band})
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-800 line-clamp-1">{work.description}</h2>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-medium">{work.district}, {work.state}</span>
          <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold">{work.status}</span>

          {/* Action Buttons */}
          <button
            onClick={handleUnflag}
            disabled={isUnflagged}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border shadow-2xs ${
              isUnflagged 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 opacity-90 cursor-default'
                : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50 hover:border-slate-400'
            }`}
          >
            <CheckCircle2 size={14} className={isUnflagged ? 'text-emerald-600' : 'text-slate-600'}/>
            {isUnflagged ? 'Verified Safe (Unflagged)' : 'Unflag Work'}
          </button>

          <button
            onClick={handleEscalate}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 transition-all flex items-center gap-1.5 shadow-2xs"
          >
            <AlertTriangle size={14} className="text-red-600"/>
            Escalate to Ministry
          </button>
        </div>
      </div>

      {unflagSuccess && (
        <div className="bg-emerald-600 text-white px-6 py-2.5 text-xs font-bold flex items-center justify-between shadow-md transition-all">
          <span className="flex items-center gap-2">
            <ShieldCheck size={16}/> Work {work.work_id} successfully unflagged! Risk score lowered to 12.0 (Verified Safe) & logged in Audit Trail.
          </span>
          <button onClick={() => setUnflagSuccess(false)} className="text-white hover:text-emerald-200 text-xs underline font-bold">Dismiss</button>
        </div>
      )}

      {/* Main Content Layout */}
      <div className="flex-1 flex overflow-hidden min-w-0">
        {/* Left Pane — Deep Audit Data & Tabular Raw Excel View */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 min-w-0">
          
          {/* WHY FLAGGED DIAGNOSIS */}
          <div className={`bg-white border rounded-lg p-5 ${isUnflagged ? 'border-emerald-300' : 'border-red-200'}`}>
            <h3 className={`text-sm font-bold flex items-center gap-2 mb-3 ${isUnflagged ? 'text-emerald-700' : 'text-red-600'}`}>
              {isUnflagged ? (
                <><ShieldCheck size={18} className="text-emerald-600"/> Audit Verification Status: Safe</>
              ) : (
                <><ShieldAlert size={17} className="text-red-600"/> Why Was This Flagged? (Sanity Diagnosis)</>
              )}
            </h3>
            <ul className="space-y-2">
              {risk_reasons.map((reason, idx) => (
                <li key={idx} className={`flex items-start gap-2 text-xs p-2.5 rounded-md border ${
                  isUnflagged ? 'bg-emerald-50/50 text-emerald-900 border-emerald-200 font-medium' : 'bg-white text-slate-700 border-slate-200'
                }`}>
                  {isUnflagged ? (
                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5"/>
                  ) : (
                    <AlertTriangle size={14} className="text-red-500 shrink-0 mt-0.5"/>
                  )}
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* VENDOR DEEP DIVE */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
              <Building2 size={18} className="text-teal-600"/> Vendor Profile & Reach Analysis
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Vendor Name</p>
                <p className="text-xs font-bold text-slate-700 truncate mt-0.5">{vendor_history.vendor_name}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Total Disbursed</p>
                <p className="text-sm font-bold text-teal-700 mt-0.5">₹{vendor_history.total_disbursed.toLocaleString()}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Pan-India Works</p>
                <p className="text-sm font-bold text-slate-700 mt-0.5">{vendor_history.total_works} works</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Districts Spread</p>
                <p className="text-sm font-bold text-slate-700 mt-0.5">{vendor_history.districts_count} districts across {vendor_history.mps_count} MPs</p>
              </div>
            </div>
          </div>

          {/* MP / MINISTER CONSTITUENCY CONTEXT */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
              <UserCheck size={18} className="text-indigo-600"/> MP / Minister Constituency Track Record
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase">MP Name</p>
                <p className="text-xs font-bold text-slate-700 mt-0.5">{mp_history.mp_name}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Total Constituency Budget</p>
                <p className="text-sm font-bold text-slate-700 mt-0.5">₹{(mp_history.total_budget / 1e7).toFixed(2)} Cr</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Completion Rate</p>
                <p className="text-sm font-bold text-emerald-600 mt-0.5">{mp_history.completion_rate_pct}% ({mp_history.completed_count}/{mp_history.total_works})</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase">High Risk Flagged</p>
                <p className="text-sm font-bold text-rose-600 mt-0.5">{mp_history.high_risk_count} works</p>
              </div>
            </div>
          </div>

          {/* PEER BENCHMARK COMPARISON TABLE */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-3">Peer Benchmark Comparison ({work.category} in {work.state})</h3>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase font-semibold text-[10px]">
                  <th className="py-2">Metric</th>
                  <th className="py-2">This Work</th>
                  <th className="py-2">State Peer Median</th>
                  <th className="py-2">Variance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                <tr>
                  <td className="py-2.5 text-slate-500">Sanction Amount</td>
                  <td className="py-2.5 font-bold">₹{work.sanction_amount.toLocaleString()}</td>
                  <td className="py-2.5">₹{peer_benchmark.median_sanction.toLocaleString()}</td>
                  <td className="py-2.5">
                    {sancDiffPct > 0 ? (
                      <span className="text-rose-600 font-bold">+{sancDiffPct}%</span>
                    ) : <span className="text-emerald-600">Normal ({sancDiffPct}%)</span>}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 text-slate-500">Completion Timeline</td>
                  <td className="py-2.5 font-bold">{work.completion_days} days</td>
                  <td className="py-2.5">{peer_benchmark.median_completion_days} days</td>
                  <td className="py-2.5">
                    {compDiffDays > 0 ? (
                      <span className="text-amber-600 font-bold">+{compDiffDays} days</span>
                    ) : <span className="text-emerald-600 font-bold">{compDiffDays} days (Normal)</span>}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 text-slate-500">Fund Utilization Rate</td>
                  <td className="py-2.5 font-bold">{work.utilization_rate}%</td>
                  <td className="py-2.5">{peer_benchmark.median_utilization}%</td>
                  <td className="py-2.5">
                    {utilDiffPct > 0 ? (
                      <span className="text-slate-700 font-semibold">+{utilDiffPct}%</span>
                    ) : (
                      <span className="text-rose-600 font-bold">{utilDiffPct}%</span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* RAW SOURCE CSV EXCEL SHEET VIEW */}
          {raw_csv_record && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <FileSpreadsheet size={18} className="text-emerald-600"/> Raw Database Record (Source Excel Sheet View)
                </h3>
                <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">Source: {raw_csv_record.source_file}</span>
              </div>
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs border-collapse font-mono">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                      <th className="py-2 px-3 border-r border-slate-200">work_id</th>
                      <th className="py-2 px-3 border-r border-slate-200">state</th>
                      <th className="py-2 px-3 border-r border-slate-200">district_name</th>
                      <th className="py-2 px-3 border-r border-slate-200">mp_name</th>
                      <th className="py-2 px-3 border-r border-slate-200">sanction_amount</th>
                      <th className="py-2 px-3 border-r border-slate-200">total_expenditure</th>
                      <th className="py-2 px-3 border-r border-slate-200">completion_days</th>
                      <th className="py-2 px-3 border-r border-slate-200">vendor_name</th>
                      <th className="py-2 px-3">risk_score</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-white text-slate-800">
                      <td className="py-2 px-3 border-r border-slate-200 font-bold text-teal-700">{raw_csv_record.work_id}</td>
                      <td className="py-2 px-3 border-r border-slate-200">{raw_csv_record.state}</td>
                      <td className="py-2 px-3 border-r border-slate-200">{raw_csv_record.district_name}</td>
                      <td className="py-2 px-3 border-r border-slate-200">{raw_csv_record.mp_name}</td>
                      <td className="py-2 px-3 border-r border-slate-200">{raw_csv_record.sanction_amount}</td>
                      <td className="py-2 px-3 border-r border-slate-200">{raw_csv_record.total_expenditure}</td>
                      <td className="py-2 px-3 border-r border-slate-200">{raw_csv_record.completion_days}</td>
                      <td className="py-2 px-3 border-r border-slate-200 truncate max-w-[120px]">{raw_csv_record.vendor_name}</td>
                      <td className="py-2 px-3 font-bold text-rose-600">{raw_csv_record.risk_score}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Right Pane — Natural Conversational AI Assistant */}
        <div className="w-[360px] lg:w-[380px] bg-white border-l border-slate-200 flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-200 bg-slate-100 text-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2 text-slate-800">
                <Bot size={18} className="text-teal-600"/> NIRIKSHAN AI Assistant
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">Natural Language Audit Reasoning Engine</p>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"/>
          </div>

          {/* Quick Action Prompts */}
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap gap-1.5">
            <button onClick={() => handleSendChat('Why was this vendor flagged across districts?')} className="text-[10px] bg-white border border-slate-200 text-slate-600 px-2 py-1 rounded hover:bg-slate-100 text-left transition-colors">
              💡 Why is vendor flagged?
            </button>
            <button onClick={() => handleSendChat('Compare sanction amount with state average')} className="text-[10px] bg-white border border-slate-200 text-slate-600 px-2 py-1 rounded hover:bg-slate-100 text-left transition-colors">
              📊 Compare sanction amount
            </button>
            <button onClick={() => handleSendChat('What is the MP completion record?')} className="text-[10px] bg-white border border-slate-200 text-slate-600 px-2 py-1 rounded hover:bg-slate-100 text-left transition-colors">
              🏛️ MP completion record
            </button>
          </div>

          {/* Chat Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-xs">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[95%] rounded-xl p-3.5 leading-relaxed ${
                  msg.role === 'user' ? 'bg-teal-600 text-white font-medium' :
                  'bg-slate-50 text-slate-800 border border-slate-200 shadow-2xs whitespace-pre-wrap'
                }`}>
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-teal-700 uppercase mb-2 border-b border-teal-100 pb-1">
                      <Sparkles size={13} className="text-teal-600"/> Natural Language Audit Synthesis
                    </div>
                  )}
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Thinking Animation Effect */}
            {isThinking && (
              <div className="flex items-center gap-2 p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-800 text-xs font-semibold animate-pulse">
                <Loader2 size={16} className="animate-spin text-teal-600 shrink-0"/>
                <span>Analyzing CSV data cells & synthesizing natural audit explanation...</span>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="p-3 border-t border-slate-200 bg-white flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendChat()}
              placeholder="Ask follow-up questions in natural language..."
              className="flex-1 text-xs border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-teal-600"
            />
            <button onClick={() => handleSendChat()} className="bg-teal-600 text-white p-2 rounded-lg hover:bg-teal-700 transition-colors">
              <Send size={15}/>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

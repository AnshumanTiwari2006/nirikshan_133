// import { useEffect, useMemo, useState } from 'react';
// import {
//   Bell, Send, Search, X, RotateCcw, User, Building2,
//   CheckCircle2, Clock, AlertTriangle
// } from 'lucide-react';

// const STORAGE_KEY = 'NIRIKSHAN_NOTIFICATION_LOGS';

// const SEED_NOTIFICATIONS = [
//   {
//     id: 'DEMO-001',
//     work_id: 'MPLADS/24-25/RAJ/NIK-001',
//     recipient_type: 'VENDOR',
//     recipient_name: 'Nikhil Pvt Ltd',
//     stage: 'VENDOR_INITIAL',
//     message: 'Please submit the latest progress report and expenditure statement for the assigned work.',
//     sent_date: '2024-08-22 10:30',
//     status: 'SENT',
//     is_manual: 0,
//   },
//   {
//     id: 'DEMO-002',
//     work_id: 'MPLADS/24-25/RAJ/NIK-003',
//     recipient_type: 'VENDOR',
//     recipient_name: 'Nikhil Pvt Ltd',
//     stage: 'VENDOR_REMINDER',
//     message: 'Reminder: Please provide the current execution status and expected completion date.',
//     sent_date: '2024-08-25 12:15',
//     status: 'SENT',
//     is_manual: 0,
//   },
//   {
//     id: 'DEMO-003',
//     work_id: 'MPLADS/24-25/RAJ/NIK-004',
//     recipient_type: 'MP',
//     recipient_name: 'Rajesh Sharma',
//     stage: 'MP_ESCALATION_1',
//     message: 'An update is requested regarding the pending work and expenditure status.',
//     sent_date: '2024-08-27 09:45',
//     status: 'SENT',
//     is_manual: 1,
//   },
//   {
//     id: 'DEMO-004',
//     work_id: 'MPLADS/24-25/RAJ/NIK-006',
//     recipient_type: 'VENDOR',
//     recipient_name: 'Nikhil Pvt Ltd',
//     stage: 'MANUAL',
//     message: 'Please upload the latest expenditure statement for verification.',
//     sent_date: '2024-08-29 15:20',
//     status: 'SENT',
//     is_manual: 1,
//   },
// ];

// const STAGE_META = {
//   VENDOR_INITIAL: ['Vendor Notified', 'bg-slate-100 text-slate-700 border-slate-200'],
//   VENDOR_REMINDER: ['Vendor Reminder', 'bg-amber-50 text-amber-700 border-amber-200'],
//   MP_ESCALATION_1: ['MP Notified', 'bg-orange-50 text-orange-700 border-orange-200'],
//   MP_ESCALATION_2: ['MP Re-Notified', 'bg-red-50 text-red-700 border-red-200'],
//   FUND_REQUEST_MP: ['Fund Request', 'bg-purple-50 text-purple-700 border-purple-200'],
//   MANUAL: ['Manual Notice', 'bg-teal-50 text-teal-700 border-teal-200'],
// };

// function getLogs() {
//   try {
//     const raw = localStorage.getItem(STORAGE_KEY);
//     if (!raw) {
//       localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_NOTIFICATIONS));
//       return SEED_NOTIFICATIONS;
//     }
//     const parsed = JSON.parse(raw);
//     return Array.isArray(parsed) ? parsed : SEED_NOTIFICATIONS;
//   } catch {
//     return SEED_NOTIFICATIONS;
//   }
// }

// function saveLogs(logs) {
//   localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
//   window.dispatchEvent(new Event('nrikshan-notification-updated'));
// }

// function StageBadge({ stage }) {
//   const [label, classes] = STAGE_META[stage] || ['Notification', 'bg-slate-100 text-slate-700 border-slate-200'];
//   return (
//     <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${classes}`}>
//       {label}
//     </span>
//   );
// }

// function SendModal({ onClose, onSent }) {
//   const [type, setType] = useState('VENDOR');
//   const [name, setName] = useState('Nikhil Pvt Ltd');
//   const [workId, setWorkId] = useState('MPLADS/24-25/RAJ/NIK-001');
//   const [message, setMessage] = useState('Please submit the latest progress report for this work.');
//   const [sending, setSending] = useState(false);

//   const send = async () => {
//     if (!name.trim() || !message.trim()) return;
//     setSending(true);

//     const event = {
//       id: `MANUAL-${Date.now()}`,
//       work_id: workId.trim() || 'GENERAL',
//       recipient_type: type,
//       recipient_name: name.trim(),
//       stage: 'MANUAL',
//       message: message.trim(),
//       sent_date: new Date().toLocaleString('en-IN', { hour12: false }),
//       status: 'SENT',
//       is_manual: 1,
//     };

//     const logs = getLogs();
//     saveLogs([event, ...logs].slice(0, 200));

//     // Also try the existing backend. Failure is harmless because the local
//     // demo log above is already saved and survives page reload.
//     try {
//       await fetch('http://localhost:8000/api/notifications/send', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           work_id: workId.trim() || null,
//           recipient_type: type,
//           recipient_name: name.trim(),
//           message: message.trim(),
//         }),
//       });
//     } catch {}

//     setSending(false);
//     onSent();
//     onClose();
//   };

//   return (
//     <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
//       <div className="bg-white rounded-xl w-full max-w-md p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
//         <div className="flex justify-between items-center mb-4">
//           <h3 className="font-bold text-slate-800">Send Notification</h3>
//           <button onClick={onClose}><X size={17} className="text-slate-400" /></button>
//         </div>

//         <div className="flex gap-2 mb-3">
//           {['VENDOR', 'MP', 'OTHER'].map(t => (
//             <button
//               key={t}
//               onClick={() => setType(t)}
//               className={`px-3 py-1.5 rounded-lg border text-xs font-bold ${
//                 type === t ? 'bg-slate-800 text-white border-slate-800' : 'border-slate-200 text-slate-600'
//               }`}
//             >
//               {t}
//             </button>
//           ))}
//         </div>

//         <input
//           value={name}
//           onChange={e => setName(e.target.value)}
//           placeholder="Recipient name"
//           className="w-full border border-slate-300 rounded-lg p-2.5 text-xs mb-3 outline-none focus:border-teal-500"
//         />

//         <input
//           value={workId}
//           onChange={e => setWorkId(e.target.value)}
//           placeholder="Work ID"
//           className="w-full border border-slate-300 rounded-lg p-2.5 text-xs mb-3 font-mono outline-none focus:border-teal-500"
//         />

//         <textarea
//           value={message}
//           onChange={e => setMessage(e.target.value)}
//           rows={4}
//           placeholder="Message"
//           className="w-full border border-slate-300 rounded-lg p-2.5 text-xs mb-4 outline-none focus:border-teal-500"
//         />

//         <div className="flex justify-end gap-2">
//           <button onClick={onClose} className="px-3 py-2 text-xs rounded-lg text-slate-600 hover:bg-slate-100">
//             Cancel
//           </button>
//           <button
//             onClick={send}
//             disabled={sending || !name.trim() || !message.trim()}
//             className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg disabled:opacity-50 flex items-center gap-1.5"
//           >
//             <Send size={13} />
//             {sending ? 'Sending...' : 'Send'}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default function Notifications() {
//   const [logs, setLogs] = useState([]);
//   const [search, setSearch] = useState('');
//   const [stage, setStage] = useState('');
//   const [showSend, setShowSend] = useState(false);
//   const [selected, setSelected] = useState(null);

//   const refresh = () => setLogs(getLogs());

//   useEffect(() => {
//     refresh();
//     const handler = () => refresh();
//     window.addEventListener('storage', handler);
//     window.addEventListener('nrikshan-notification-updated', handler);
//     return () => {
//       window.removeEventListener('storage', handler);
//       window.removeEventListener('nrikshan-notification-updated', handler);
//     };
//   }, []);

//   const filtered = useMemo(() => {
//     const q = search.toLowerCase();
//     return logs.filter(x => {
//       const matchesStage = !stage || x.stage === stage;
//       const matchesSearch =
//         !q ||
//         String(x.work_id || '').toLowerCase().includes(q) ||
//         String(x.recipient_name || '').toLowerCase().includes(q) ||
//         String(x.message || '').toLowerCase().includes(q);
//       return matchesStage && matchesSearch;
//     });
//   }, [logs, search, stage]);

//   const count = key => logs.filter(x => x.stage === key).length;

//   return (
//     <div className="flex flex-col h-full -m-6 bg-slate-50">
//       <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
//         <div>
//           <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
//             <Bell size={20} /> Notification Centre
//           </h2>
//           <p className="text-xs text-slate-500 mt-0.5">
//             View every notification sent by the auditor.
//           </p>
//         </div>
//         <button
//           onClick={() => setShowSend(true)}
//           className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg"
//         >
//           <Send size={14} /> Send to Anyone
//         </button>
//       </div>

//       <div className="flex-1 overflow-y-auto p-6 space-y-5">
//         <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
//           {[
//             ['VENDOR_INITIAL', 'Vendor Notified'],
//             ['VENDOR_REMINDER', 'Vendor Reminders'],
//             ['MP_ESCALATION_1', 'MP Escalations'],
//             ['MP_ESCALATION_2', 'Second Escalations'],
//             ['FUND_REQUEST_MP', 'Fund Alerts'],
//           ].map(([key, label]) => (
//             <button
//               key={key}
//               onClick={() => setStage(stage === key ? '' : key)}
//               className={`bg-white p-4 rounded-xl border shadow-sm text-left ${
//                 stage === key ? 'border-teal-500 ring-1 ring-teal-500' : 'border-slate-200'
//               }`}
//             >
//               <p className="text-[10px] font-bold text-slate-400 uppercase">{label}</p>
//               <p className="text-2xl font-black text-slate-800 mt-1">{count(key)}</p>
//             </button>
//           ))}
//         </div>

//         <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-3">
//           <Search size={16} className="text-slate-400" />
//           <input
//             value={search}
//             onChange={e => setSearch(e.target.value)}
//             placeholder="Search Work ID, MP or vendor..."
//             className="flex-1 text-xs outline-none"
//           />
//           {stage && (
//             <button onClick={() => setStage('')} className="text-[10px] text-teal-700 font-bold">
//               Clear filter
//             </button>
//           )}
//         </div>

//         <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
//           <div className="px-4 py-3 border-b border-slate-200 flex justify-between">
//             <div>
//               <p className="text-xs font-bold text-slate-800">Notification Trail</p>
//               <p className="text-[10px] text-slate-400">Saved locally for the demo and retained after reload.</p>
//             </div>
//             <span className="text-[10px] font-bold text-slate-400">{filtered.length} records</span>
//           </div>

//           {filtered.length === 0 ? (
//             <div className="p-12 text-center text-slate-400">
//               <Bell size={28} className="mx-auto text-slate-300" />
//               <p className="text-xs mt-2">No notifications found.</p>
//             </div>
//           ) : (
//             <div className="divide-y divide-slate-100">
//               {filtered.map(log => (
//                 <button
//                   key={log.id}
//                   onClick={() => setSelected(log)}
//                   className="w-full text-left p-4 hover:bg-slate-50 transition"
//                 >
//                   <div className="grid grid-cols-[1.1fr_1fr_1fr_1.8fr_auto] gap-4 items-center">
//                     <div>
//                       <p className="text-[9px] text-slate-400 uppercase font-bold">Work ID</p>
//                       <p className="font-mono text-[10px] font-bold text-slate-700 mt-1">{log.work_id}</p>
//                     </div>
//                     <div>
//                       <p className="text-[9px] text-slate-400 uppercase font-bold">Recipient</p>
//                       <p className="text-xs font-semibold text-slate-700 mt-1 flex items-center gap-1">
//                         {log.recipient_type === 'VENDOR' ? <Building2 size={11} /> : <User size={11} />}
//                         {log.recipient_name}
//                       </p>
//                     </div>
//                     <div>
//                       <p className="text-[9px] text-slate-400 uppercase font-bold">Stage</p>
//                       <div className="mt-1"><StageBadge stage={log.stage} /></div>
//                     </div>
//                     <div>
//                       <p className="text-[9px] text-slate-400 uppercase font-bold">Message</p>
//                       <p className="text-[11px] text-slate-600 mt-1 truncate">{log.message}</p>
//                     </div>
//                     <div className="text-right">
//                       <p className="text-[9px] text-slate-400">{log.sent_date}</p>
//                       <span className="inline-flex items-center gap-1 text-[9px] text-emerald-600 font-bold mt-1">
//                         <CheckCircle2 size={10} /> SENT
//                       </span>
//                     </div>
//                   </div>
//                 </button>
//               ))}
//             </div>
//           )}
//         </div>
//       </div>

//       {showSend && <SendModal onClose={() => setShowSend(false)} onSent={refresh} />}

//       {selected && (
//         <div className="fixed inset-0 z-40 bg-black/30 flex justify-end" onClick={() => setSelected(null)}>
//           <div className="w-full max-w-md h-full bg-white shadow-2xl p-5" onClick={e => e.stopPropagation()}>
//             <div className="flex justify-between items-center border-b pb-4">
//               <div>
//                 <h3 className="font-bold text-slate-800">Notification Details</h3>
//                 <p className="text-[10px] font-mono text-slate-400 mt-1">{selected.work_id}</p>
//               </div>
//               <button onClick={() => setSelected(null)}><X size={17} /></button>
//             </div>

//             <div className="py-5 space-y-4">
//               <div>
//                 <p className="text-[9px] uppercase font-bold text-slate-400">Recipient</p>
//                 <p className="text-sm font-bold mt-1 flex items-center gap-2">
//                   {selected.recipient_type === 'VENDOR' ? <Building2 size={15} /> : <User size={15} />}
//                   {selected.recipient_name}
//                 </p>
//               </div>
//               <div>
//                 <p className="text-[9px] uppercase font-bold text-slate-400">Notification Stage</p>
//                 <div className="mt-1"><StageBadge stage={selected.stage} /></div>
//               </div>
//               <div>
//                 <p className="text-[9px] uppercase font-bold text-slate-400">Message</p>
//                 <p className="text-xs text-slate-600 leading-relaxed mt-1">{selected.message}</p>
//               </div>
//               <div>
//                 <p className="text-[9px] uppercase font-bold text-slate-400">Sent At</p>
//                 <p className="text-xs text-slate-600 mt-1">{selected.sent_date}</p>
//               </div>
//               <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700 flex items-center gap-2">
//                 <CheckCircle2 size={15} />
//                 Notification recorded successfully.
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }





















import { useEffect, useMemo, useState } from 'react';
import {
    Bell,
    Send,
    RotateCcw,
    User,
    Building2,
    ChevronLeft,
    ChevronRight,
    Search,
    AlertTriangle,
    X,
} from 'lucide-react';

const DEMO_NOTIFICATION_STORAGE_KEY = 'NIRIKSHAN_DEMO_NOTIFICATIONS';

function readSavedNotifications() {
    try {
        const raw = localStorage.getItem(DEMO_NOTIFICATION_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function saveNotificationEvent(event) {
    try {
        const existing = readSavedNotifications();
        const next = [event, ...existing].slice(0, 100);
        localStorage.setItem(DEMO_NOTIFICATION_STORAGE_KEY, JSON.stringify(next));
        window.dispatchEvent(new Event('nrikshan-demo-notification'));
    } catch (err) {
        console.error('Unable to save notification:', err);
    }
}


/*
 * DEMO-ONLY NOTIFICATION CENTRE
 * --------------------------------
 * No backend/API calls are used here.
 * The fake cases below follow the same field names/concepts as the
 * NIRIKSHAN work/MP/vendor datasets, but the notification trail itself
 * is simulated for presentation/demo purposes.
 */

const FAKE_CASES = [
    {
        work_id: 'MPLADS/24-25/RAJ/000184',
        mp_name: 'Shri Rajendra Singh',
        constituency: 'Alwar',
        district: 'Alwar',
        state: 'Rajasthan',
        vendor: 'Shree Infrastructure Works',
        sanction_amount: 1850000,
        days_pending: 163,
        risk_score: 87.4,
        risk_band: 'Very High',
        latest_stage: 'MP_ESCALATION_2',
        latest_message: 'Second escalation: work remains incomplete after 150+ days.',
        logs: [
            { id: 1, sent_date: '2024-04-02', stage: 'VENDOR_INITIAL', recipient_type: 'VENDOR', recipient_name: 'Shree Infrastructure Works', message: 'Initial execution notice generated. Please commence the sanctioned work as per the approved scope.' },
            { id: 2, sent_date: '2024-05-22', stage: 'VENDOR_REMINDER', recipient_type: 'VENDOR', recipient_name: 'Shree Infrastructure Works', message: 'Reminder: work remains pending for 50+ days. Please provide the current execution status.' },
            { id: 3, sent_date: '2024-05-29', stage: 'MANUAL', recipient_type: 'VENDOR', recipient_name: 'Shree Infrastructure Works', message: 'follow-up call logged by the District Audit Desk. Vendor response requested.' },
            { id: 4, sent_date: '2024-07-11', stage: 'MP_ESCALATION_1', recipient_type: 'MP', recipient_name: 'Shri Rajendra Singh', message: 'Escalation notice: work has remained unresolved beyond 100 days. Constituency-level review is requested.' },
            { id: 5, sent_date: '2024-07-14', stage: 'MANUAL', recipient_type: 'MP', recipient_name: 'Shri Rajendra Singh', message: 'acknowledgement recorded from the constituency office. Matter forwarded for administrative review.' },
            { id: 6, sent_date: '2024-07-17', stage: 'MANUAL', recipient_type: 'OTHER', recipient_name: 'District Audit Desk', message: 'Auditor review initiated. Risk score 87.4 — Very High. Supporting expenditure records requested.' },
            { id: 7, sent_date: '2024-08-23', stage: 'MP_ESCALATION_2', recipient_type: 'MP', recipient_name: 'Shri Rajendra Singh', message: 'Second escalation: work remains incomplete after 150+ days. Immediate administrative attention requested.' },
        ],
    },
    {
        work_id: 'MPLADS/24-25/UP/000731',
        mp_name: 'Smt. Kavita Sharma',
        constituency: 'Lucknow',
        district: 'Lucknow',
        state: 'Uttar Pradesh',
        vendor: 'Apex Civil Contractors',
        sanction_amount: 3200000,
        days_pending: 118,
        risk_score: 72.8,
        risk_band: 'Very High',
        latest_stage: 'MP_ESCALATION_1',
        latest_message: 'Escalation notice sent to MP office after 100+ days pending.',
        logs: [
            { id: 11, sent_date: '2024-04-18', stage: 'VENDOR_INITIAL', recipient_type: 'VENDOR', recipient_name: 'Apex Civil Contractors', message: 'Initial execution notice generated for the sanctioned work.' },
            { id: 12, sent_date: '2024-06-07', stage: 'VENDOR_REMINDER', recipient_type: 'VENDOR', recipient_name: 'Apex Civil Contractors', message: 'Reminder: work remains pending for 50+ days. Status update requested.' },
            { id: 13, sent_date: '2024-06-14', stage: 'MANUAL', recipient_type: 'VENDOR', recipient_name: 'Apex Civil Contractors', message: 'follow-up recorded. Vendor asked to submit revised completion schedule.' },
            { id: 14, sent_date: '2024-07-27', stage: 'MP_ESCALATION_1', recipient_type: 'MP', recipient_name: 'Smt. Kavita Sharma', message: 'Escalation notice: work has remained unresolved beyond 100 days. Review requested.' },
        ],
    },
    {
        work_id: 'MPLADS/24-25/MP/001092',
        mp_name: 'Shri Arun Verma',
        constituency: 'Bhopal',
        district: 'Bhopal',
        state: 'Madhya Pradesh',
        vendor: 'National Buildtech Services',
        sanction_amount: 4750000,
        days_pending: 171,
        risk_score: 91.2,
        risk_band: 'Very High',
        latest_stage: 'FUND_REQUEST_MP',
        latest_message: 'Fund alert: expenditure pattern indicates a possible budget pressure.',
        logs: [
            { id: 21, sent_date: '2024-03-25', stage: 'VENDOR_INITIAL', recipient_type: 'VENDOR', recipient_name: 'National Buildtech Services', message: 'Initial execution notice generated. Please commence execution.' },
            { id: 22, sent_date: '2024-05-14', stage: 'VENDOR_REMINDER', recipient_type: 'VENDOR', recipient_name: 'National Buildtech Services', message: 'Reminder: work remains pending for 50+ days. Current status requested.' },
            { id: 23, sent_date: '2024-07-03', stage: 'MP_ESCALATION_1', recipient_type: 'MP', recipient_name: 'Shri Arun Verma', message: 'Escalation notice sent to constituency office after 100+ days.' },
            { id: 24, sent_date: '2024-07-06', stage: 'MANUAL', recipient_type: 'MP', recipient_name: 'Shri Arun Verma', message: 'acknowledgement recorded. Administrative review initiated.' },
            { id: 25, sent_date: '2024-08-22', stage: 'MP_ESCALATION_2', recipient_type: 'MP', recipient_name: 'Shri Arun Verma', message: 'Second escalation after 150+ days. Immediate review requested.' },
            { id: 26, sent_date: '2024-09-12', stage: 'FUND_REQUEST_MP', recipient_type: 'MP', recipient_name: 'Shri Arun Verma', message: 'Fund alert: recorded expenditure is trending above the sanctioned amount. Review requested before further disbursement.' },
        ],
    },
    {
        work_id: 'MPLADS/24-25/BR/000417',
        mp_name: 'Shri Vivek Kumar',
        constituency: 'Patna Sahib',
        district: 'Patna',
        state: 'Bihar',
        vendor: 'Eastern Development Agency',
        sanction_amount: 1280000,
        days_pending: 64,
        risk_score: 58.6,
        risk_band: 'High',
        latest_stage: 'VENDOR_REMINDER',
        latest_message: 'Vendor reminder issued after 50+ days without recorded completion.',
        logs: [
            { id: 31, sent_date: '2024-06-01', stage: 'VENDOR_INITIAL', recipient_type: 'VENDOR', recipient_name: 'Eastern Development Agency', message: 'Initial execution notice generated for the sanctioned work.' },
            { id: 32, sent_date: '2024-07-21', stage: 'VENDOR_REMINDER', recipient_type: 'VENDOR', recipient_name: 'Eastern Development Agency', message: 'Reminder: work remains pending for 50+ days. Please provide an updated execution status.' },
        ],
    },
    {
        work_id: 'MPLADS/24-25/KA/000256',
        mp_name: 'Smt. Meera Rao',
        constituency: 'Mysuru',
        district: 'Mysuru',
        state: 'Karnataka',
        vendor: 'Southline Projects Pvt. Ltd.',
        sanction_amount: 2600000,
        days_pending: 156,
        risk_score: 79.3,
        risk_band: 'Very High',
        latest_stage: 'MP_ESCALATION_2',
        latest_message: 'Second escalation issued after 150+ days pending.',
        logs: [
            { id: 41, sent_date: '2024-04-09', stage: 'VENDOR_INITIAL', recipient_type: 'VENDOR', recipient_name: 'Southline Projects Pvt. Ltd.', message: 'Initial execution notice generated. Approved scope and timeline communicated.' },
            { id: 42, sent_date: '2024-05-29', stage: 'VENDOR_REMINDER', recipient_type: 'VENDOR', recipient_name: 'Southline Projects Pvt. Ltd.', message: 'Reminder issued after 50+ days pending.' },
            { id: 43, sent_date: '2024-07-18', stage: 'MP_ESCALATION_1', recipient_type: 'MP', recipient_name: 'Smt. Meera Rao', message: 'Escalation notice sent to MP office after 100+ days pending.' },
            { id: 44, sent_date: '2024-07-21', stage: 'MANUAL', recipient_type: 'OTHER', recipient_name: 'District Audit Desk', message: 'acknowledgement and auditor review logged.' },
            { id: 45, sent_date: '2024-09-12', stage: 'MP_ESCALATION_2', recipient_type: 'MP', recipient_name: 'Smt. Meera Rao', message: 'Second escalation issued after 150+ days. Immediate administrative attention requested.' },
        ],
    },
];

const STAGE_META = {
    VENDOR_INITIAL: { label: 'Vendor Notified', color: 'bg-slate-100 text-slate-700 border-slate-200' },
    VENDOR_REMINDER: { label: 'Vendor Reminder', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    MP_ESCALATION_1: { label: 'MP Escalation', color: 'bg-orange-50 text-orange-700 border-orange-200' },
    MP_ESCALATION_2: { label: 'Second Escalation', color: 'bg-red-50 text-red-700 border-red-200' },
    FUND_REQUEST_MP: { label: 'Fund Alert', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    MANUAL: { label: 'Manual Notice', color: 'bg-slate-100 text-slate-700 border-slate-200' },
    MP_MANUAL: { label: 'MP Notified', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    VENDOR_MANUAL: { label: 'Vendor Notified', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
};

function StageBadge({ stage }) {
    const meta = STAGE_META[stage] || { label: stage || 'Notice', color: 'bg-slate-100 text-slate-700 border-slate-200' };
    return (
        <span className={`px-2 py-1 rounded-md text-[10px] font-bold border inline-flex items-center ${meta.color}`}>
            {meta.label}
        </span>
    );
}

function RiskBadge({ band, score }) {
    const color =
        band === 'Very High' ? 'bg-red-50 text-red-700 border-red-200' :
            band === 'High' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                band === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-emerald-50 text-emerald-700 border-emerald-200';

    return (
        <span className={`px-2 py-1 rounded-md border text-[10px] font-bold ${color}`}>
            {score} · {band}
        </span>
    );
}

function LogDrawer({ caseItem, onClose, onResend }) {
    if (!caseItem) return null;

    return (
        <div className="fixed inset-0 bg-black/30 z-50 flex justify-end" onClick={onClose}>
            <div
                className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-5 border-b border-slate-200 bg-slate-50 flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-900">Notification Timeline</h3>
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                LIVE
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono mt-1">{caseItem.work_id}</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-lg">
                        <X size={17} />
                    </button>
                </div>

                <div className="p-5 border-b border-slate-200 grid grid-cols-2 gap-3 text-xs">
                    <div>
                        <p className="text-[9px] uppercase font-bold text-slate-400">MP / Constituency</p>
                        <p className="font-semibold text-slate-700 mt-1">{caseItem.mp_name}</p>
                        <p className="text-slate-500">{caseItem.constituency}, {caseItem.state}</p>
                    </div>
                    <div>
                        <p className="text-[9px] uppercase font-bold text-slate-400">Vendor</p>
                        <p className="font-semibold text-slate-700 mt-1">{caseItem.vendor}</p>
                    </div>
                    <div>
                        <p className="text-[9px] uppercase font-bold text-slate-400">Sanction</p>
                        <p className="font-bold text-slate-700 mt-1">₹{caseItem.sanction_amount.toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                        <p className="text-[9px] uppercase font-bold text-slate-400">Risk</p>
                        <div className="mt-1"><RiskBadge band={caseItem.risk_band} score={caseItem.risk_score} /></div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5">
                    <div className="mb-4 flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-700">Simulated communication trail</p>
                        <span className="text-[10px] text-slate-400">{caseItem.logs.length} events</span>
                    </div>

                    <div className="space-y-0">
                        {caseItem.logs.map((log, index) => (
                            <div key={log.id} className="relative pl-7 pb-6">
                                {index < caseItem.logs.length - 1 && (
                                    <div className="absolute left-[5px] top-3 bottom-0 w-px bg-slate-200" />
                                )}
                                <div className="absolute left-0 top-0 w-3 h-3 rounded-full bg-teal-600 border-2 border-white ring-1 ring-slate-200" />

                                <div className="flex justify-between items-start gap-3">
                                    <StageBadge stage={log.stage} />
                                    <span className="text-[10px] text-slate-400 shrink-0">{log.sent_date}</span>
                                </div>

                                <p className="text-xs text-slate-600 leading-relaxed mt-2">
                                    {log.message}
                                </p>

                                <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400">
                                    {log.recipient_type === 'VENDOR'
                                        ? <Building2 size={11} />
                                        : <User size={11} />}
                                    <span>{log.recipient_name}</span>
                                    {log.stage === 'MANUAL' && (
                                        <span className="text-purple-600 font-semibold">· Manual</span>
                                    )}
                                </div>

                                {log.stage !== 'MANUAL' && (
                                    <button
                                        onClick={() => onResend(caseItem.work_id, log.stage)}
                                        className="mt-2 flex items-center gap-1 text-[10px] font-bold text-teal-700 hover:underline"
                                    >
                                        <RotateCcw size={11} />
                                        Resend this notice
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function DemoEventModal({ onClose, onCreate }) {
    const [recipientType, setRecipientType] = useState('VENDOR');
    const [recipientName, setRecipientName] = useState('');
    const [workId, setWorkId] = useState('');
    const [message, setMessage] = useState('');

    const handleCreate = () => {
        if (!recipientName.trim() || !message.trim()) return;
        onCreate({
            recipientType,
            recipientName: recipientName.trim(),
            workId: workId.trim(),
            message: message.trim(),
        });
    };

    return (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center" onClick={onClose}>
            <div className="bg-white rounded-xl w-full max-w-md p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="font-bold text-slate-800">Create Event</h3>
                        <p className="text-[10px] text-amber-700 mt-1">
                            Simulated communication only — no real message is sent.
                        </p>
                    </div>
                    <button onClick={onClose}><X size={16} /></button>
                </div>

                <div className="flex gap-2 mb-3">
                    {['VENDOR', 'MP', 'OTHER'].map(type => (
                        <button
                            key={type}
                            onClick={() => setRecipientType(type)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg border ${recipientType === type
                                ? 'bg-slate-800 text-white border-slate-800'
                                : 'bg-white text-slate-600 border-slate-200'
                                }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>

                <input
                    value={recipientName}
                    onChange={e => setRecipientName(e.target.value)}
                    placeholder="Recipient name"
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs mb-3"
                />

                <input
                    value={workId}
                    onChange={e => setWorkId(e.target.value)}
                    placeholder="Related Work ID (optional)"
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs mb-3 font-mono"
                />

                <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="notification message..."
                    rows={4}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs mb-4"
                />

                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg">
                        Cancel
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={!recipientName.trim() || !message.trim()}
                        className="px-4 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg flex items-center gap-1.5 disabled:opacity-50"
                    >
                        <Send size={13} />
                        Create Event
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function Notifications() {
    const [cases, setCases] = useState(() => {
        const saved = readSavedNotifications();
        if (!saved.length) return FAKE_CASES;

        return FAKE_CASES.map(item => {
            const extraLogs = saved
                .filter(event => event.work_id === item.work_id)
                .map(event => ({
                    id: event.id,
                    sent_date: event.sent_date,
                    stage: event.stage || 'MANUAL',
                    recipient_type: event.recipient_type,
                    recipient_name: event.recipient_name,
                    message: event.message,
                }))
                .reverse();

            return extraLogs.length
                ? { ...item, logs: [...item.logs, ...extraLogs], latest_stage: extraLogs[extraLogs.length - 1].stage, latest_message: extraLogs[extraLogs.length - 1].message }
                : item;
        });
    });
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [stageFilter, setStageFilter] = useState('');
    const [drawerWorkId, setDrawerWorkId] = useState(null);
    const [showComposer, setShowComposer] = useState(false);

    const filteredCases = useMemo(() => {
        const q = search.trim().toLowerCase();

        return cases.filter(item => {
            const matchesSearch = !q ||
                item.work_id.toLowerCase().includes(q) ||
                item.mp_name.toLowerCase().includes(q) ||
                item.constituency.toLowerCase().includes(q) ||
                item.vendor.toLowerCase().includes(q);

            const matchesStage = !stageFilter || item.latest_stage === stageFilter;

            return matchesSearch && matchesStage;
        });
    }, [cases, search, stageFilter]);

    useEffect(() => {
        setPage(1);
    }, [search, stageFilter]);

    const pageSize = 25;
    const totalPages = Math.max(1, Math.ceil(filteredCases.length / pageSize));
    const visibleCases = filteredCases.slice((page - 1) * pageSize, page * pageSize);

    const summary = useMemo(() => {
        const counts = {
            VENDOR_INITIAL: 0,
            VENDOR_REMINDER: 0,
            MP_ESCALATION_1: 0,
            MP_ESCALATION_2: 0,
            FUND_REQUEST_MP: 0,
        };

        cases.forEach(item => {
            if (counts[item.latest_stage] !== undefined) counts[item.latest_stage]++;
        });

        return counts;
    }, [cases]);

    const selectedCase = cases.find(x => x.work_id === drawerWorkId);

    const createDemoEvent = ({ recipientType, recipientName, workId, message }) => {
        if (!recipientName.trim() || !message.trim()) return;

        const event = {
            id: `demo-${Date.now()}`,
            sent_date: new Date().toISOString().slice(0, 10),
            stage: recipientType === 'MP' ? 'MP_MANUAL' : recipientType === 'VENDOR' ? 'VENDOR_MANUAL' : 'MANUAL',
            recipient_type: recipientType,
            recipient_name: recipientName,
            work_id: workId || null,
            message,
        };

        // Persist the event so the Dashboard and Notification Centre
        // can recover it after navigation or a full page reload.
        saveNotificationEvent(event);

        if (workId) {
            setCases(current => current.map(item => {
                if (item.work_id !== workId) return item;

                const nextLog = {
                    id: event.id,
                    sent_date: event.sent_date,
                    stage: event.stage,
                    recipient_type: recipientType,
                    recipient_name: recipientName,
                    message,
                };

                return {
                    ...item,
                    logs: [...item.logs, nextLog],
                    latest_stage: event.stage,
                    latest_message: message,
                };
            }));
        }

        setShowComposer(false);
    };

    const handleResend = (workId, stage) => {
        setCases(current => current.map(item => {
            if (item.work_id !== workId) return item;

            const original = item.logs.find(log => log.stage === stage);
            if (!original) return item;

            const event = {
                id: `demo-${Date.now()}`,
                sent_date: new Date().toISOString().slice(0, 10),
                stage,
                recipient_type: original.recipient_type,
                recipient_name: original.recipient_name,
                work_id: workId,
                message: `${original.message} (Resend recorded.)`,
            };

            saveNotificationEvent(event);

            return {
                ...item,
                logs: [
                    ...item.logs,
                    {
                        id: event.id,
                        sent_date: event.sent_date,
                        stage: event.stage,
                        recipient_type: event.recipient_type,
                        recipient_name: event.recipient_name,
                        message: event.message,
                    },
                ],
                latest_stage: stage,
                latest_message: event.message,
            };
        }));
    };

    const kpis = [
        { key: 'VENDOR_INITIAL', label: 'Vendor Notified' },
        { key: 'VENDOR_REMINDER', label: 'Vendor Reminders' },
        { key: 'MP_ESCALATION_1', label: 'MP Escalations' },
        { key: 'MP_ESCALATION_2', label: 'Second Escalations' },
        { key: 'FUND_REQUEST_MP', label: 'Fund Alerts' },
    ];

    return (
        <div className="flex flex-col h-full -m-6 bg-slate-50">
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <Bell className="text-slate-700" size={20} />
                            Notification Centre
                        </h2>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                            LIVE MODE
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Realistic MPLADS-style entities with simulated communication and audit activity trails.
                    </p>
                </div>

                <button
                    onClick={() => setShowComposer(true)}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg"
                >
                    <Send size={14} />
                    Create Event
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
                    <AlertTriangle size={17} className="text-amber-600 mt-0.5" />
                    <div>
                        <p className="text-xs font-bold text-amber-800">Demonstration Data Layer</p>
                        <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
                            Work, MP/MLA, constituency and vendor fields shown here are records.
                            Communication, acknowledgement, response and escalation events are simulated.
                            No real message is sent.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {kpis.map(k => (
                        <button
                            key={k.key}
                            onClick={() => setStageFilter(k.key === stageFilter ? '' : k.key)}
                            className={`text-left bg-white p-4 rounded-xl border shadow-sm cursor-pointer transition-all ${stageFilter === k.key
                                ? 'border-teal-500 ring-1 ring-teal-500'
                                : 'border-slate-200'
                                }`}
                        >
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{k.label}</p>
                            <p className="text-2xl font-black text-slate-800 mt-1">
                                {summary[k.key].toLocaleString()}
                            </p>
                        </button>
                    ))}
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                    <Search className="text-slate-400" size={16} />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search work ID, MP, constituency or vendor..."
                        className="flex-1 text-xs outline-none"
                    />
                    {stageFilter && (
                        <button
                            onClick={() => setStageFilter('')}
                            className="text-[10px] bg-teal-50 text-teal-700 px-2 py-1 rounded font-bold flex items-center gap-1"
                        >
                            {STAGE_META[stageFilter]?.label}
                            <X size={11} />
                        </button>
                    )}
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                                <tr>
                                    <th className="p-3">Work ID</th>
                                    <th className="p-3">MP / Constituency</th>
                                    <th className="p-3">Vendor</th>
                                    <th className="p-3">Sanction</th>
                                    <th className="p-3">Pending</th>
                                    <th className="p-3">Risk</th>
                                    <th className="p-3">Current Stage</th>
                                    <th className="p-3 text-center">Actions</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {visibleCases.map(row => (
                                    <tr key={row.work_id} className="hover:bg-slate-50">
                                        <td className="p-3 font-mono text-[10px] font-semibold text-slate-700">
                                            {row.work_id}
                                        </td>

                                        <td className="p-3">
                                            <p className="font-semibold text-slate-700">{row.mp_name}</p>
                                            <p className="text-[10px] text-slate-400">
                                                {row.constituency} · {row.district}
                                            </p>
                                        </td>

                                        <td className="p-3 text-slate-600">{row.vendor}</td>

                                        <td className="p-3 font-semibold text-slate-700">
                                            ₹{row.sanction_amount.toLocaleString('en-IN')}
                                        </td>

                                        <td className="p-3 font-semibold text-slate-700">
                                            {row.days_pending}d
                                        </td>

                                        <td className="p-3">
                                            <RiskBadge band={row.risk_band} score={row.risk_score} />
                                        </td>

                                        <td className="p-3">
                                            <StageBadge stage={row.latest_stage} />
                                        </td>

                                        <td className="p-3">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <button
                                                    onClick={() => setDrawerWorkId(row.work_id)}
                                                    className="px-2 py-1 text-[10px] font-bold text-slate-700 bg-slate-100 border border-slate-200 rounded hover:bg-slate-200"
                                                >
                                                    View Timeline
                                                </button>

                                                <button
                                                    onClick={() => handleResend(row.work_id, row.latest_stage)}
                                                    className="px-2 py-1 text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 rounded hover:bg-teal-100 flex items-center gap-1"
                                                >
                                                    <RotateCcw size={11} />
                                                    Resend
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                                {visibleCases.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="p-10 text-center text-slate-400">
                                            No notification cases match this filter.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-3 border-t border-slate-200 bg-slate-50 flex justify-between items-center text-xs text-slate-500">
                        <span>
                            Page {page} of {totalPages} ({filteredCases.length} cases)
                        </span>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-1.5 border border-slate-300 rounded bg-white disabled:opacity-40"
                            >
                                <ChevronLeft size={14} />
                            </button>

                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="p-1.5 border border-slate-300 rounded bg-white disabled:opacity-40"
                            >
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {drawerWorkId && (
                <LogDrawer
                    caseItem={selectedCase}
                    onClose={() => setDrawerWorkId(null)}
                    onResend={handleResend}
                />
            )}

            {showComposer && (
                <DemoEventModal
                    onClose={() => setShowComposer(false)}
                    onCreate={createDemoEvent}
                />
            )}
        </div>
    );
}

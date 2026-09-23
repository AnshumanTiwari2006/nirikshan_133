import { useEffect, useState } from 'react';
import { Bell, X, Building2, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const STORAGE_KEY = 'NIRIKSHAN_NOTIFICATION_LOGS';

export default function NotificationToast() {
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);

  useEffect(() => {
    let lastId = null;

    const check = () => {
      try {
        const logs = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        const latest = Array.isArray(logs) ? logs[0] : null;

        if (latest && latest.id !== lastId) {
          lastId = latest.id;
          setToast(latest);
          window.setTimeout(() => setToast(null), 6000);
        }
      } catch {}
    };

    check();
    window.addEventListener('nrikshan-notification-updated', check);
    window.addEventListener('storage', check);

    const timer = window.setInterval(check, 1500);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener('nrikshan-notification-updated', check);
      window.removeEventListener('storage', check);
    };
  }, []);

  if (!toast) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] w-80 bg-white border border-slate-200 rounded-xl shadow-2xl p-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center shrink-0">
          <Bell size={16} className="text-teal-600" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <p className="text-xs font-bold text-slate-800">New Notification Sent</p>
            <button onClick={() => setToast(null)}>
              <X size={14} className="text-slate-400" />
            </button>
          </div>

          <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
            {toast.recipient_type === 'VENDOR' ? <Building2 size={11} /> : <User size={11} />}
            To: {toast.recipient_name}
          </p>

          <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">
            {toast.message}
          </p>

          <button
            onClick={() => {
              setToast(null);
              navigate('/notifications');
            }}
            className="text-[10px] font-bold text-teal-600 hover:underline mt-2"
          >
            View Notification Centre →
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, ShieldAlert, FileSearch, BarChart3, Database, Building2, UserCheck, Settings as SettingsIcon, MessageSquareText, Search, Send, X, Bot, Bell } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Investigation from './pages/Investigation';
import Risk from './pages/Risk';
import Reports from './pages/Reports';
import DataManagement from './pages/DataManagement';
import Vendors from './pages/Vendors';
import SanityCheck from './pages/SanityCheck';
import Settings from './pages/Settings';
import MPLedger from './pages/MPLedger';
import Notifications from './pages/Notifications';
import CapitalAllocation from './pages/CapitalAllocation';
import NotificationToast from './components/NotificationToast';
import Topbar from './components/Topbar';

function Sidebar({ onOpenAi }) {
  const location = useLocation();

  const navItems = [
    { name: 'Overview Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Projects & Works Ledger', path: '/projects', icon: FolderKanban },
    { name: 'MP & MLA Work Registry', path: '/mp-work', icon: UserCheck },
    { name: 'Risk & Anomaly Detection', path: '/risk', icon: ShieldAlert },
    { name: 'Capital Allocation', path: '/capital-allocation', icon: BarChart3 },
    { name: 'Investigation Workspace', path: '/investigation', icon: FileSearch },
    { name: 'Reports & Action Centre', path: '/reports', icon: BarChart3 },
    { name: 'Data Management Lineage', path: '/data', icon: Database },
    { name: 'Vendor Directory', path: '/vendors', icon: Building2 },
    { name: 'Notification Centre', path: '/notifications', icon: Bell },
    { name: 'System Settings', path: '/settings', icon: SettingsIcon },
  ];

  return (
    <div className="w-64 bg-slate-950 text-slate-300 min-h-screen flex flex-col shrink-0 border-r border-slate-800 font-sans">
      <div className="p-5 flex items-center gap-3 text-white border-b border-slate-800 bg-black">
        <img src="/src/assets/main_logo.png" alt="Logo" className="w-8 h-8 object-contain" />
        <div>
          <h1 className="font-extrabold text-base tracking-tight text-white leading-tight">NIRIKSHAN</h1>
          <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">Audit System</p>
        </div>
      </div>
      <div className="flex-1 py-3 space-y-0.5">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path === '/vendors' && location.pathname === '/users');
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 px-5 py-2.5 text-xs font-medium transition-all ${isActive
                ? 'bg-slate-800 text-white font-bold border-l-2 border-white'
                : 'text-slate-400 hover:bg-slate-900 hover:text-white border-l-2 border-transparent'
                }`}
            >
              <item.icon size={16} className={isActive ? 'text-white' : 'text-slate-500'} />
              {item.name}
            </Link>
          );
        })}
      </div>

      {/* Ask NIRIKSHAN AI */}
      <div className="p-4 border-t border-slate-800 bg-black">
        <button
          onClick={onOpenAi}
          className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-2.5 px-4 rounded-lg text-xs font-semibold shadow-xs transition-all border border-slate-700"
        >
          <Bot size={16} />
          Ask NIRIKSHAN AI
        </button>
      </div>
    </div>
  );
}

function SidebarAiDrawer({ isOpen, onClose }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hello Auditor! I am NIRIKSHAN AI. Ask me any question about works, vendor risks, state budgets, or irregularities across India.' }
  ]);

  if (!isOpen) return null;

  const handleSend = () => {
    if (!input.trim()) return;
    const msg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: msg }]);

    fetch('http://localhost:8000/api/rag/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: msg, page_context: 'global_sidebar' })
    })
      .then(r => r.json())
      .then(d => {
        setMessages(prev => [...prev, { role: 'assistant', text: d.reply }]);
      })
      .catch(() => {
        setMessages(prev => [...prev, { role: 'assistant', text: 'Unable to reach backend NIRIKSHAN server.' }]);
      });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end">
      <div className="w-96 bg-white h-full shadow-2xl flex flex-col">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot size={20} className="text-slate-200" />
            <div>
              <h3 className="font-bold text-sm">NIRIKSHAN AI Assistant</h3>
              <p className="text-[10px] text-slate-400">Grounding on database facts</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-lg p-3 text-xs whitespace-pre-wrap leading-relaxed ${m.role === 'user' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-800 border border-slate-200'
                }`}>
                {m.text}
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-slate-200 bg-white flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Ask AI about works, vendors, MPs..."
            className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-slate-600"
          />
          <button onClick={handleSend} className="bg-slate-800 text-white px-3 py-2 rounded-lg hover:bg-slate-700">
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  
  // Global Financial Year state - persisted in localStorage
  const [selectedFY, setSelectedFY] = useState(() => 
    localStorage.getItem('nirikshan_fy') || '2026-2027'
  );
  
  // Financial year metadata (populated by Dashboard/Projects on mount)
  const [financialYears, setFinancialYears] = useState([]);
  const [currentFY, setCurrentFY] = useState('2026-2027');
  const [prevFY, setPrevFY] = useState('2025-2026');

  // Persist selected FY to localStorage
  useEffect(() => {
    localStorage.setItem('nirikshan_fy', selectedFY);
  }, [selectedFY]);

  // Callback for pages to update FY metadata
  const updateFYMetadata = (fys, curr, prev) => {
    setFinancialYears(fys);
    setCurrentFY(curr);
    setPrevFY(prev);
  };

  return (
    <Router>
      <div className="flex bg-slate-50 min-h-screen h-screen overflow-hidden">
        <Sidebar onOpenAi={() => setAiDrawerOpen(true)} />
        <div className="flex-1 flex flex-col h-full relative min-w-0 overflow-hidden">
          <Topbar 
            selectedFY={selectedFY}
            onFYChange={setSelectedFY}
            financialYears={financialYears}
            currentFY={currentFY}
            prevFY={prevFY}
          />
          <div className="flex-1 overflow-auto p-6 min-w-0">
            <Routes>
              <Route path="/" element={<Dashboard onUpdateFYMetadata={updateFYMetadata} />} />
              <Route path="/projects" element={<Projects onUpdateFYMetadata={updateFYMetadata} />} />
              <Route path="/mp-work" element={<MPLedger />} />
              <Route path="/investigation" element={<Investigation />} />
              <Route path="/risk" element={<Risk />} />
              <Route path="/capital-allocation" element={<CapitalAllocation />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/data" element={<DataManagement />} />
              <Route path="/vendors" element={<Vendors />} />
              <Route path="/users" element={<Vendors />} />
              <Route path="/sanity-check" element={<SanityCheck />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="*" element={<div className="p-8 text-center text-slate-500">Page under construction based on revised wireframe.</div>} />
            </Routes>
          </div>
        </div>
        <SidebarAiDrawer isOpen={aiDrawerOpen} onClose={() => setAiDrawerOpen(false)} />
        <NotificationToast />
      </div>
    </Router>
  );
}

export default App;

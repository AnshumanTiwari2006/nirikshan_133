import { Search } from 'lucide-react';

export default function Topbar({ 
  selectedFY, 
  onFYChange, 
  financialYears, 
  currentFY, 
  prevFY 
}) {
  const formatFY = (fy) => {
    if (!fy) return 'Financial Year';
    const parts = fy.split('-');
    if (parts.length === 2) {
      return `Financial Year ${parts[0]}–${parts[1].slice(-2)}`;
    }
    return fy;
  };

  return (
    <div className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 font-sans">
      <div className="flex items-center gap-3 flex-1">
        <h2 className="text-sm font-bold text-slate-900 tracking-tight">
          NIRIKSHAN National Risk and Irregularity Knowledge System
        </h2>
      </div>
      <div className="flex items-center gap-4">
        <select
          value={selectedFY}
          onChange={(e) => onFYChange(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:border-teal-500 min-w-[180px]"
          aria-label="Select Financial Year"
        >
          {financialYears?.map((fy) => (
            <option key={fy} value={fy}>
              {formatFY(fy)}
            </option>
          ))}
        </select>
        <div className="relative">
          <input
            type="text"
            placeholder="Search Work ID, District..."
            className="pl-3 pr-9 py-1.5 text-xs border border-slate-200 rounded-md w-56 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400"
          />
          <Search className="absolute right-2.5 top-2 text-slate-400" size={14} />
        </div>
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
            AD
          </div>
          <div className="hidden lg:flex flex-col">
            <span className="text-xs font-bold text-slate-900 leading-none">Auditor Admin</span>
          </div>
        </div>
      </div>
    </div>
  );
}
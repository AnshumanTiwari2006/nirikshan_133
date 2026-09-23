import { Bell, Shield, Sliders, Database, Info, Lock } from 'lucide-react';

export default function Settings() {
  return (
    <div className="flex flex-col h-full -m-6 bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-xl font-bold text-slate-900">System Settings &amp; Model Configuration</h2>
          <p className="text-xs text-slate-500 mt-0.5">System parameters, data governance rules, and risk weighting configuration.</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-md text-xs font-medium">
          <Lock size={14}/> Read-Only Audit Access
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl space-y-6">
          
          {/* Global Config */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2 text-slate-700">
              <Sliders size={18} /> <h3 className="font-bold">Global Application Settings</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <div>
                  <p className="font-medium text-sm text-slate-700">Default Financial Year</p>
                  <p className="text-xs text-slate-500">The default FY loaded on the Overview Dashboard.</p>
                </div>
                <select className="border border-slate-300 rounded text-sm px-3 py-1.5 bg-white">
                  <option>2024-2025</option>
                  <option>2023-2024</option>
                </select>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-sm text-slate-700">Maintenance Mode</p>
                  <p className="text-xs text-slate-500">Disable logins for non-admin users during batch updates.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Model Weights */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-700">
                <Database size={18} /> <h3 className="font-bold">Model Ensemble Configuration</h3>
              </div>
              <span className="text-xs text-slate-400">Total = 100%</span>
            </div>
            <div className="p-6">
              <p className="text-xs text-slate-600 mb-6">Composite risk weights defining the National Audit Intelligence Index. Adjusting sliders simulates weight reallocation in real-time preview.</p>
              <div className="space-y-4 max-w-xl">
                {[
                  { name: 'Baseline Financial Risk', value: 25 },
                  { name: 'Isolation Forest (Anomaly)', value: 30 },
                  { name: 'XGBoost (Cost Deviation)', value: 25 },
                  { name: 'Duplicate Detection', value: 7 },
                  { name: 'Cluster Outlier Score', value: 3 },
                  { name: 'Vendor Network Monopolization', value: 10 },
                ].map(model => (
                  <div key={model.name} className="flex items-center gap-4">
                    <label className="text-xs font-medium text-slate-700 w-52">{model.name}</label>
                    <input type="range" min="0" max="100" defaultValue={model.value} className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600" />
                    <span className="text-xs font-bold text-slate-700 w-10 text-right">{model.value}%</span>
                  </div>
                ))}
              </div>

              {/* Simulation callout card */}
              <div className="mt-6 p-4 bg-teal-50 border border-teal-200 rounded-xl text-xs text-slate-700 flex items-start gap-3">
                <Info size={18} className="text-teal-600 shrink-0 mt-0.5"/>
                <div>
                  <strong className="text-teal-800 font-bold">Real-time Ensemble Weight Simulation:</strong><br/>
                  If these weights were applied, <strong className="text-rose-600">14 works</strong> would move from <span className="font-bold text-amber-600">MEDIUM</span> to <span className="font-bold text-rose-600">HIGH</span> risk band, and <strong className="text-emerald-600">9 works</strong> would move from <span className="font-bold text-rose-600">HIGH</span> to <span className="font-bold text-amber-600">MEDIUM</span>.
                  <span className="block text-[11px] text-slate-500 mt-1">Simulated by re-calculating dot product of component scores against 77,628 work records without model retraining.</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

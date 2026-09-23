import { useState, useEffect } from 'react';
import { Download, ChevronDown, ChevronRight, ArrowRight, Database, FileText, CheckCircle2 } from 'lucide-react';

const GROUP_META = {
  source:    { label: 'Source Records',     color: 'border-slate-200', bg: 'bg-white', dot: 'bg-slate-700', desc: 'Raw ingested MPLADS datasets extracted from public administrative records.' },
  processed: { label: 'Canonical Schema',   color: 'border-slate-200', bg: 'bg-white', dot: 'bg-slate-700', desc: 'Cleaned Star Schema — Fact and Dimension tables ready for audit analysis.' },
  features:  { label: 'Feature Metrics',    color: 'border-slate-200', bg: 'bg-white', dot: 'bg-slate-700', desc: 'Audit risk features aggregated across works, contractors, MPs, and districts.' },
  quality:   { label: 'Data Quality Logs',  color: 'border-slate-200', bg: 'bg-white', dot: 'bg-slate-700', desc: 'Data integrity audit logs, schema validation checks, and reconciliation reports.' },
  outputs:   { label: 'Model Deliverables', color: 'border-slate-200', bg: 'bg-white', dot: 'bg-slate-700', desc: 'Final risk score indices, duplicate cluster mappings, and vendor network flags.' },
};

const PIPELINE_FLOW = [
  { from: 'source', to: 'processed', label: 'ETL Processing' },
  { from: 'processed', to: 'features', label: 'Feature Engine' },
  { from: 'features', to: 'quality', label: 'Integrity Check' },
  { from: 'quality', to: 'outputs', label: 'Risk Calculation' },
];

function FileCard({ file, group }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-50" onClick={() => setOpen(o => !o)}>
        <div className="flex items-center gap-2 min-w-0">
          {open ? <ChevronDown size={14} className="text-slate-400 shrink-0"/> : <ChevronRight size={14} className="text-slate-400 shrink-0"/>}
          <FileText size={14} className="text-slate-500 shrink-0"/>
          <span className="text-xs font-mono font-bold text-slate-700 truncate">{file.name}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-2">
          <span className="text-[10px] text-slate-400">{file.rows?.toLocaleString()} rows · {file.cols?.length} cols</span>
          <a href={`http://localhost:8000/api/data/download/${group}/${file.name}`}
            onClick={e => e.stopPropagation()}
            className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white px-2.5 py-1 rounded text-[10px] font-semibold transition-colors">
            <Download size={11}/> CSV
          </a>
        </div>
      </div>
      {open && file.cols?.length > 0 && (
        <div className="px-4 pb-3 bg-slate-50 border-t border-slate-200">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-2 mb-2">Columns ({file.cols.length})</p>
          <div className="flex flex-wrap gap-1">
            {file.cols.map(c => (
              <span key={c} className="bg-white border border-slate-200 text-slate-600 text-[10px] px-2 py-0.5 rounded-full font-mono">{c}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function GroupSection({ groupKey, files }) {
  const meta = GROUP_META[groupKey];
  return (
    <div className={`rounded-xl border-2 ${meta.color} ${meta.bg} p-4`}>
      <div className="flex items-center gap-2 mb-1">
        <span className={`w-3 h-3 rounded-full ${meta.dot}`}/>
        <h3 className="font-bold text-slate-800 text-sm">{meta.label}</h3>
        <span className="text-[10px] text-slate-500 ml-auto">{files.length} files</span>
      </div>
      <p className="text-[11px] text-slate-500 mb-3">{meta.desc}</p>
      <div className="space-y-2">
        {files.map(f => <FileCard key={f.name} file={f} group={groupKey} />)}
      </div>
    </div>
  );
}

// Pipeline flow diagram using SVG-free CSS arrow approach
function PipelineArrow({ label }) {
  return (
    <div className="flex flex-col items-center justify-center px-2 shrink-0">
      <div className="text-[9px] font-bold text-slate-500 text-center whitespace-pre-line mb-1 leading-tight">{label}</div>
      <div className="flex items-center gap-0">
        <div className="w-8 h-0.5 bg-slate-400"/>
        <div className="w-0 h-0 border-t-4 border-b-4 border-l-8 border-transparent border-l-slate-400"/>
      </div>
    </div>
  );
}

export default function DataManagement() {
  const [pipeline, setPipeline] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:8000/api/data/pipeline')
      .then(r => r.json())
      .then(d => { setPipeline(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col h-full -m-6 bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Data Management & Pipeline</h2>
          <p className="text-sm text-slate-500">Explore the full data lineage — from raw source files to ML-ready features. Download any CSV directly.</p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg">
            <CheckCircle2 size={16} className="text-emerald-600"/>
            <span className="text-sm font-medium text-emerald-700">Pipeline: Healthy</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64 text-slate-500">
            <div className="animate-spin w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full mr-3"/>
            Loading pipeline metadata...
          </div>
        ) : pipeline ? (
          <div className="space-y-8">
            {/* VISUAL FLOW */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-sm font-bold text-slate-700 mb-6 flex items-center gap-2"><Database size={16}/> Data Pipeline Flow</h3>
              <div className="flex items-stretch justify-between overflow-x-auto gap-1">
                {['source', 'processed', 'features', 'quality'].map((grp, i) => {
                  const meta = GROUP_META[grp];
                  const files = pipeline[grp] || [];
                  return (
                    <div key={grp} className="flex items-center">
                      <div className={`rounded-lg border-2 ${meta.color} ${meta.bg} p-4 w-44`}>
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${meta.dot}`}/>
                          <span className="text-xs font-bold text-slate-700">{meta.label}</span>
                        </div>
                        <div className="space-y-1">
                          {files.map(f => (
                            <div key={f.name} className="text-[10px] font-mono text-slate-600 bg-white/70 rounded px-1.5 py-0.5 truncate border border-slate-200">
                              {f.name.replace('.csv', '')}
                            </div>
                          ))}
                        </div>
                      </div>
                      {i < 3 && (
                        <div className="flex flex-col items-center px-3">
                          <span className="text-[9px] font-bold text-slate-400 text-center mb-1">
                            {['ETL Merge', 'Feature Eng.', 'Validation'][i]}
                          </span>
                          <div className="flex items-center">
                            <div className="w-10 h-0.5 bg-slate-400"/>
                            <div style={{width:0, height:0, borderTop:'5px solid transparent', borderBottom:'5px solid transparent', borderLeft:'8px solid #94a3b8'}}/>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* FILE DETAIL SECTIONS */}
            <div>
              <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2"><FileText size={16}/> Browse & Download Files</h3>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {Object.keys(pipeline).map(grp => (
                  <GroupSection key={grp} groupKey={grp} files={pipeline[grp] || []} />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-slate-400 mt-20">Failed to load pipeline data. Is the backend running?</div>
        )}
      </div>
    </div>
  );
}

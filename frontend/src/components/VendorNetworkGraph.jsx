import React, { useState } from 'react';
import { Network, Building2, User, ExternalLink, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function VendorNetworkGraph({ nodes = [], edges = [], interconnectedVendors = [] }) {
  const [selectedNode, setSelectedNode] = useState(null);
  const navigate = useNavigate();

  const vendorNodes = nodes.filter(n => n.type === 'vendor');
  const mpNodes = nodes.filter(n => n.type === 'mp');

  const width = 800;
  const height = 360;

  const vendorX = 160;
  const mpX = 640;

  const getNodePos = (node, index) => {
    if (node.type === 'vendor') {
      const step = height / (vendorNodes.length + 1);
      return { x: vendorX, y: Math.max(30, (index + 1) * step) };
    } else {
      const step = height / (mpNodes.length + 1);
      return { x: mpX, y: Math.max(30, (index + 1) * step) };
    }
  };

  const nodePosMap = {};
  nodes.forEach((n, i) => {
    nodePosMap[n.id] = getNodePos(n, n.type === 'vendor' ? vendorNodes.indexOf(n) : mpNodes.indexOf(n));
  });

  return (
    <div className="space-y-6">
      {/* Interactive Node Graph Container */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Network size={18} className="text-slate-800" /> Vendor MP Constituency Network Node Graph
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Visualising multi constituency contractor allocations, cross MP connections, and potential cartel linkages.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-medium">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-rose-600 inline-block"/> High Reach Vendor</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500 inline-block"/> Concentration Vendor</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-slate-400 inline-block"/> MP Constituency Node</span>
          </div>
        </div>

        {/* SVG Network Visualizer */}
        <div className="relative border border-slate-200 bg-slate-50 rounded-lg overflow-hidden h-[380px] flex items-center justify-center">
          <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`}>
            {/* Render Connection Edges */}
            {edges.map((e, idx) => {
              const src = nodePosMap[e.source];
              const tgt = nodePosMap[e.target];
              if (!src || !tgt) return null;
              const isHighlighted = selectedNode && (selectedNode.id === e.source || selectedNode.id === e.target);
              return (
                <line
                  key={idx}
                  x1={src.x}
                  y1={src.y}
                  x2={tgt.x}
                  y2={tgt.y}
                  stroke={isHighlighted ? '#dc2626' : '#cbd5e1'}
                  strokeWidth={isHighlighted ? 2.5 : Math.max(1, Math.min(4, e.disbursed / 5000000))}
                  strokeDasharray={isHighlighted ? 'none' : '3 3'}
                  className="transition-all duration-300"
                />
              );
            })}

            {/* Render Nodes */}
            {nodes.map((n) => {
              const pos = nodePosMap[n.id];
              if (!pos) return null;
              const isSelected = selectedNode?.id === n.id;
              const isVendor = n.type === 'vendor';
              const r = isVendor ? (n.mp_count >= 3 ? 14 : 10) : 8;

              return (
                <g
                  key={n.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  onClick={() => setSelectedNode(n)}
                  className="cursor-pointer group"
                >
                  {isVendor ? (
                    <circle
                      r={r}
                      fill={n.flags?.includes('High Reach') ? '#dc2626' : '#f59e0b'}
                      stroke={isSelected ? '#000000' : '#ffffff'}
                      strokeWidth={isSelected ? 3 : 1.5}
                      className="transition-all duration-200 group-hover:scale-125"
                    />
                  ) : (
                    <rect
                      x="-8"
                      y="-8"
                      width="16"
                      height="16"
                      rx="3"
                      fill="#64748b"
                      stroke={isSelected ? '#dc2626' : '#ffffff'}
                      strokeWidth={isSelected ? 2 : 1}
                      className="transition-all duration-200 group-hover:scale-125"
                    />
                  )}

                  {/* Node Label Text */}
                  <text
                    x={isVendor ? -18 : 14}
                    y="4"
                    textAnchor={isVendor ? 'end' : 'start'}
                    fontSize="10"
                    fontWeight={isSelected ? 'bold' : '500'}
                    fill={isSelected ? '#0f172a' : '#475569'}
                    className="select-none pointer-events-none"
                  >
                    {n.label.length > 25 ? n.label.substring(0, 23) + '…' : n.label}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Node Selected Details Tooltip Panel */}
          {selectedNode && (
            <div className="absolute top-3 right-3 w-72 bg-white backdrop-blur-md border border-slate-200 rounded-lg p-4 shadow-lg text-xs space-y-2">
              <div className="flex justify-between items-start border-b border-slate-200 pb-2">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    {selectedNode.type === 'vendor' ? 'Vendor Node' : 'MP Node'}
                  </span>
                  <h4 className="font-bold text-slate-900">{selectedNode.label}</h4>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              </div>
              {selectedNode.type === 'vendor' ? (
                <>
                  <p className="text-slate-600">
                    Disbursed: <strong className="text-slate-900">₹{(selectedNode.disbursed || 0).toLocaleString()}</strong>
                  </p>
                  <p className="text-slate-600">
                    MPs Connected: <strong className="text-slate-900">{selectedNode.mp_count} constituencies</strong>
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedNode.flags?.map((f, i) => (
                      <span key={i} className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 border border-red-200 text-red-600">
                        {f}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => navigate(`/vendors?search=${encodeURIComponent(selectedNode.label)}`)}
                    className="w-full mt-2 bg-slate-800 hover:bg-slate-700 text-white py-1.5 rounded text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    Open Vendor Profile <ExternalLink size={12} />
                  </button>
                </>
              ) : (
                <p className="text-slate-600">
                  Member of Parliament node connected to contractors receiving public funds in this constituency.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Audit Table of Interconnected High Reach & Cartel Vendors */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 text-sm">
            High Reach &amp; Cartelisation Vendor Interconnections ({interconnectedVendors.length} Flagged Firms)
          </h3>
          <span className="text-xs text-slate-500">Extracted from live bipartite payment graph</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[750px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                <th className="p-3">Vendor Firm Name</th>
                <th className="p-3">Connected MP Constituencies</th>
                <th className="p-3 text-center">MP Count</th>
                <th className="p-3 text-right">Total Disbursed</th>
                <th className="p-3 text-center">Risk Flag</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {interconnectedVendors.map((v, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-bold text-slate-800">{v.vendor_name}</td>
                  <td className="p-3 text-slate-600 max-w-[220px] truncate">
                    {v.mps_connected?.join(', ')}
                  </td>
                  <td className="p-3 text-center font-bold text-slate-700">{v.mp_count} MPs</td>
                  <td className="p-3 text-right font-bold text-slate-900">₹{(v.total_disbursed || 0).toLocaleString()}</td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 border border-red-200 text-red-600">
                      {v.cartel_flag}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => navigate(`/vendors?search=${encodeURIComponent(v.vendor_name)}`)}
                      className="px-2.5 py-1 bg-slate-800 text-white rounded text-[10px] font-bold hover:bg-slate-700 inline-flex items-center gap-1"
                    >
                      Vendor Ledger <ExternalLink size={11} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

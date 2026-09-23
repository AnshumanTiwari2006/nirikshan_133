import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { sankey, sankeyLeft, sankeyLinkHorizontal } from 'd3-sankey';
import { ShieldAlert, AlertTriangle, CheckCircle2, Eye, Info, Layers, RefreshCw, Download, Percent, Filter, Activity } from 'lucide-react';

const STAGE_HEADERS = [
  { title: 'Total Scope', subtitle: 'Stage 1: Input Works', color: 'from-slate-600 to-slate-800' },
  { title: 'Completion Status', subtitle: 'Stage 2: Execution Status', color: 'from-emerald-600 to-amber-600' },
  { title: 'Physical Inspection', subtitle: 'Stage 3: Verification Audit', color: 'from-teal-600 to-slate-600' },
  { title: 'Risk Level', subtitle: 'Stage 4: Risk Exposure', color: 'from-rose-600 to-emerald-600' },
];

export default function SankeyDiagram({ data, width = 1100, height = 520 }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [viewMode, setViewMode] = useState('aggregated'); // 'aggregated' | 'detailed'
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'high_risk' | 'uninspected' | 'completed'
  const [showLinkLabels, setShowLinkLabels] = useState(true);
  const [hoveredItem, setHoveredItem] = useState(null); // { type: 'node'|'link', item: d }
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, content: null });

  // Select node/link set based on viewMode
  const currentNodes = useMemo(() => {
    if (!data) return [];
    return (viewMode === 'detailed' && data.detailed_nodes) ? data.detailed_nodes : (data.nodes || []);
  }, [data, viewMode]);

  const currentLinks = useMemo(() => {
    if (!data) return [];
    return (viewMode === 'detailed' && data.detailed_links) ? data.detailed_links : (data.links || []);
  }, [data, viewMode]);

  useEffect(() => {
    if (!currentNodes.length || !currentLinks.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 45, right: 180, bottom: 25, left: 140 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const nodeMap = new Map(currentNodes.map((n, i) => [n.name, i]));
    const sankeyLinks = currentLinks
      .filter(l => nodeMap.has(l.source) && nodeMap.has(l.target))
      .map(l => ({
        source: nodeMap.get(l.source),
        target: nodeMap.get(l.target),
        value: l.value,
        origSource: l.source,
        origTarget: l.target
      }));

    const sankeyData = {
      nodes: currentNodes.map((n, i) => ({ ...n, index: i })),
      links: sankeyLinks,
    };

    const sankeyGenerator = sankey()
      .nodeId(d => d.index)
      .nodeAlign(sankeyLeft)
      .nodeWidth(28)
      .nodePadding(viewMode === 'detailed' ? 10 : 22)
      .extent([[0, 0], [innerWidth, innerHeight]]);

    const { nodes, links } = sankeyGenerator(sankeyData);

    // Force exact 4-column X positioning
    const columnCount = 4;
    const columnWidth = innerWidth / (columnCount - 1);
    nodes.forEach(d => {
      const col = d.column ?? 0;
      d.x0 = col * columnWidth;
      d.x1 = d.x0 + 28;
    });

    // Re-run layout curve generation after forcing columns
    sankeyGenerator.update({ nodes, links });

    // Compute connectivity map for interactive path highlighting
    const connectedNodeIds = new Set();
    const connectedLinkIndices = new Set();

    if (hoveredItem) {
      if (hoveredItem.type === 'node') {
        const targetId = hoveredItem.item.index;
        connectedNodeIds.add(targetId);

        // Downstream links & nodes
        const traverseDown = (nodeIndex) => {
          links.forEach((l, idx) => {
            if (l.source.index === nodeIndex) {
              connectedLinkIndices.add(idx);
              connectedNodeIds.add(l.target.index);
              traverseDown(l.target.index);
            }
          });
        };
        // Upstream links & nodes
        const traverseUp = (nodeIndex) => {
          links.forEach((l, idx) => {
            if (l.target.index === nodeIndex) {
              connectedLinkIndices.add(idx);
              connectedNodeIds.add(l.source.index);
              traverseUp(l.source.index);
            }
          });
        };
        traverseDown(targetId);
        traverseUp(targetId);
      } else if (hoveredItem.type === 'link') {
        const link = hoveredItem.item;
        connectedLinkIndices.add(link.index);
        connectedNodeIds.add(link.source.index);
        connectedNodeIds.add(link.target.index);
      }
    }

    // Preset filter logic
    const isLinkMatchingFilter = (l) => {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'high_risk') {
        return l.target.name.includes('Very High') || l.target.name.includes('High') ||
               l.source.name.includes('Very High') || l.source.name.includes('High') ||
               l.target.name.startsWith('CI-Very High') || l.target.name.startsWith('CI-High') ||
               l.target.name.startsWith('CN-Very High') || l.target.name.startsWith('CN-High') ||
               l.target.name.startsWith('II-Very High') || l.target.name.startsWith('II-High') ||
               l.target.name.startsWith('IN-Very High') || l.target.name.startsWith('IN-High');
      }
      if (activeFilter === 'uninspected') {
        return l.source.name.includes('Not Inspected') || l.target.name.includes('Not Inspected');
      }
      if (activeFilter === 'completed') {
        return l.source.name.includes('Complete Work') || l.target.name.includes('Complete');
      }
      return true;
    };

    // SVG Gradient Definitions
    const defs = g.append('defs');

    // Drop shadow filter for active nodes & links
    const filter = defs.append('filter')
      .attr('id', 'glow-shadow')
      .attr('x', '-20%')
      .attr('y', '-20%')
      .attr('width', '140%')
      .attr('height', '140%');
    filter.append('feDropShadow')
      .attr('dx', '0')
      .attr('dy', '2')
      .attr('stdDeviation', '4')
      .attr('flood-color', '#0f172a')
      .attr('flood-opacity', '0.25');

    links.forEach((link, i) => {
      const sourceColor = link.source.color || '#64748b';
      const targetColor = link.target.color || '#64748b';
      
      const gradient = defs.append('linearGradient')
        .attr('id', `link-grad-${i}`)
        .attr('gradientUnits', 'userSpaceOnUse')
        .attr('x1', link.source.x1)
        .attr('y1', (link.y0 + link.y1) / 2)
        .attr('x2', link.target.x0)
        .attr('y2', (link.y0 + link.y1) / 2);

      gradient.append('stop').attr('offset', '0%').attr('stop-color', sourceColor).attr('stop-opacity', 0.65);
      gradient.append('stop').attr('offset', '100%').attr('stop-color', targetColor).attr('stop-opacity', 0.65);
    });

    // Render Links
    const linkGroup = g.append('g')
      .attr('fill', 'none')
      .selectAll('path')
      .data(links)
      .join('path')
      .attr('d', sankeyLinkHorizontal())
      .attr('stroke', (d, i) => `url(#link-grad-${i})`)
      .attr('stroke-width', d => Math.max(3, d.width))
      .style('cursor', 'pointer')
      .style('transition', 'all 0.2s ease-in-out')
      .attr('stroke-opacity', (d, i) => {
        if (!isLinkMatchingFilter(d)) return 0.08;
        if (!hoveredItem) return 0.55;
        return connectedLinkIndices.has(i) ? 0.9 : 0.1;
      })
      .attr('filter', (d, i) => (hoveredItem && connectedLinkIndices.has(i)) ? 'url(#glow-shadow)' : null)
      .on('mouseenter', (event, d) => {
        setHoveredItem({ type: 'link', item: d });
        const pctSource = d.source.value > 0 ? ((d.value / d.source.value) * 100).toFixed(1) : 0;
        const totalVal = data.summary?.total_works || 1;
        const pctTotal = ((d.value / totalVal) * 100).toFixed(1);

        const srcName = d.source.display_name || d.source.name;
        const tgtName = d.target.display_name || d.target.name;

        setTooltip({
          visible: true,
          x: event.clientX,
          y: event.clientY,
          content: (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-100">
                <span>{srcName}</span>
                <span className="text-teal-400">→</span>
                <span>{tgtName}</span>
              </div>
              <div className="text-[11px] text-slate-300 font-mono">
                Volume: <strong className="text-white font-sans">{d.value.toLocaleString()} works</strong>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-slate-400 border-t border-slate-700/80 pt-1 mt-1">
                <span>Share of Stage: <strong className="text-emerald-400">{pctSource}%</strong></span>
                <span>Share of Total: <strong className="text-teal-400">{pctTotal}%</strong></span>
              </div>
            </div>
          )
        });
      })
      .on('mousemove', (event) => {
        setTooltip(prev => ({ ...prev, x: event.clientX, y: event.clientY }));
      })
      .on('mouseleave', () => {
        setHoveredItem(null);
        setTooltip({ visible: false, x: 0, y: 0, content: null });
      });

    // Render Link Percentage Pills
    if (showLinkLabels) {
      const linkLabelGroup = g.append('g')
        .attr('pointer-events', 'none')
        .selectAll('g')
        .data(links.filter(l => isLinkMatchingFilter(l) && l.width >= 12))
        .join('g')
        .attr('transform', d => {
          const x = (d.source.x1 + d.target.x0) / 2;
          const y = (d.y0 + d.y1) / 2;
          return `translate(${x},${y})`;
        })
        .attr('opacity', d => {
          if (!hoveredItem) return 0.85;
          return connectedLinkIndices.has(d.index) ? 1 : 0.15;
        });

      // Background pill
      linkLabelGroup.append('rect')
        .attr('x', -16)
        .attr('y', -8)
        .attr('width', 32)
        .attr('height', 16)
        .attr('rx', 8)
        .attr('fill', '#ffffff')
        .attr('stroke', '#e2e8f0')
        .attr('stroke-width', 1)
        .attr('filter', 'drop-shadow(0 1px 2px rgba(0,0,0,0.05))');

      linkLabelGroup.append('text')
        .attr('dy', '3.5px')
        .attr('text-anchor', 'middle')
        .attr('font-size', '9px')
        .attr('font-weight', '700')
        .attr('font-family', "'Inter', system-ui, -apple-system, sans-serif")
        .attr('fill', '#334155')
        .text(d => {
          const pct = d.source.value > 0 ? ((d.value / d.source.value) * 100).toFixed(0) : 0;
          return `${pct}%`;
        });
    }

    // Render Nodes
    const nodeGroup = g.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('transform', d => `translate(${d.x0},${d.y0})`)
      .style('cursor', 'pointer')
      .attr('opacity', d => {
        if (!hoveredItem) return 1;
        return connectedNodeIds.has(d.index) ? 1 : 0.25;
      });

    // Node Rectangle
    nodeGroup.append('rect')
      .attr('height', d => Math.max(8, d.y1 - d.y0))
      .attr('width', d => d.x1 - d.x0)
      .attr('fill', d => d.color)
      .attr('rx', 4)
      .attr('ry', 4)
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 1.5)
      .attr('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.08))')
      .style('transition', 'all 0.2s ease-in-out')
      .on('mouseenter', (event, d) => {
        setHoveredItem({ type: 'node', item: d });
        const totalVal = data.summary?.total_works || 1;
        const pctTotal = ((d.value / totalVal) * 100).toFixed(1);
        const name = d.display_name || d.name;

        setTooltip({
          visible: true,
          x: event.clientX,
          y: event.clientY,
          content: (
            <div className="space-y-1">
              <div className="font-bold text-xs text-white border-b border-slate-700/80 pb-1 flex items-center justify-between gap-3">
                <span>{name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 font-mono text-teal-400">Stage {d.column + 1}</span>
              </div>
              <div className="text-xs text-slate-200">
                Tasks Count: <strong className="text-white font-semibold">{d.value.toLocaleString()}</strong>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Share of Scope: <strong className="text-emerald-400">{pctTotal}%</strong>
              </div>
            </div>
          )
        });
      })
      .on('mousemove', (event) => {
        setTooltip(prev => ({ ...prev, x: event.clientX, y: event.clientY }));
      })
      .on('mouseleave', () => {
        setHoveredItem(null);
        setTooltip({ visible: false, x: 0, y: 0, content: null });
      });

    // Render Node Labels cleanly
    nodeGroup.each(function(d) {
      const nodeElem = d3.select(this);
      const isFirstCol = d.column === 0;
      const isLastCol = d.column === 3;
      const totalVal = data.summary?.total_works || 1;
      const pct = ((d.value / totalVal) * 100).toFixed(1);
      const name = d.display_name || d.name;

      if (isFirstCol) {
        // Label to left of node
        const labelGroup = nodeElem.append('g')
          .attr('transform', `translate(-12, ${(d.y1 - d.y0) / 2})`);

        labelGroup.append('text')
          .attr('text-anchor', 'end')
          .attr('dy', '-0.2em')
          .attr('font-size', '12px')
          .attr('font-weight', '700')
          .attr('font-family', "'Inter', system-ui, -apple-system, sans-serif")
          .attr('fill', '#0f172a')
          .text(name);

        labelGroup.append('text')
          .attr('text-anchor', 'end')
          .attr('dy', '1.1em')
          .attr('font-size', '10px')
          .attr('font-weight', '600')
          .attr('font-family', "'Inter', system-ui, -apple-system, sans-serif")
          .attr('fill', '#64748b')
          .text(`${d.value.toLocaleString()} works (100%)`);

      } else if (isLastCol) {
        // Label to right of node
        const labelGroup = nodeElem.append('g')
          .attr('transform', `translate(${d.x1 - d.x0 + 12}, ${(d.y1 - d.y0) / 2})`);

        labelGroup.append('text')
          .attr('text-anchor', 'start')
          .attr('dy', '-0.2em')
          .attr('font-size', viewMode === 'detailed' ? '10px' : '11px')
          .attr('font-weight', '700')
          .attr('font-family', "'Inter', system-ui, -apple-system, sans-serif")
          .attr('fill', d.color)
          .text(name);

        labelGroup.append('text')
          .attr('text-anchor', 'start')
          .attr('dy', '1.1em')
          .attr('font-size', '10px')
          .attr('font-weight', '600')
          .attr('font-family', "'Inter', system-ui, -apple-system, sans-serif")
          .attr('fill', '#475569')
          .text(`${d.value.toLocaleString()} (${pct}%)`);

      } else {
        // Middle columns: Label positioned beside node
        const labelGroup = nodeElem.append('g')
          .attr('transform', `translate(${d.x1 - d.x0 + 8}, ${(d.y1 - d.y0) / 2})`);

        labelGroup.append('text')
          .attr('text-anchor', 'start')
          .attr('dy', '-0.15em')
          .attr('font-size', '11px')
          .attr('font-weight', '600')
          .attr('font-family', "'Inter', system-ui, -apple-system, sans-serif")
          .attr('fill', '#1e293b')
          .text(name);

        labelGroup.append('text')
          .attr('text-anchor', 'start')
          .attr('dy', '1.1em')
          .attr('font-size', '10px')
          .attr('font-weight', '500')
          .attr('font-family', "'Inter', system-ui, -apple-system, sans-serif")
          .attr('fill', '#64748b')
          .text(`${d.value.toLocaleString()} (${pct}%)`);
      }
    });

  }, [currentNodes, currentLinks, width, height, viewMode, activeFilter, showLinkLabels, hoveredItem, data]);

  if (!data || (!data.nodes && !data.detailed_nodes)) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
        <Info className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <p className="text-slate-500 font-medium">No data available for Sankey diagram</p>
      </div>
    );
  }

  const s = data.summary || {};

  const handleExportPNG = () => {
    if (!svgRef.current) return;
    const svgElement = svgRef.current;
    const svgString = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    canvas.width = width * 2;
    canvas.height = height * 2;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      ctx.scale(2, 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `NIRIKSHAN_Sankey_Risk_Flow_${Date.now()}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    };
    img.src = url;
  };

  return (
    <div ref={containerRef} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden relative">
      {/* ── HEADER & TOOLBAR BAR ── */}
      <div className="px-6 py-4 border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-50/50">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-600" />
              Work Completion & Risk Analysis Flow
            </h3>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-teal-100 text-teal-800">
              Interactive DAG
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Multi-stage audit trace mapping work completion status, physical inspection coverage, and target risk outcomes
          </p>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle */}
          <div className="bg-slate-200/80 p-0.5 rounded-lg flex items-center text-xs font-semibold">
            <button
              onClick={() => setViewMode('aggregated')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                viewMode === 'aggregated' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Aggregated Risk (4 Bands)
            </button>
            <button
              onClick={() => setViewMode('detailed')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                viewMode === 'detailed' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Detailed Subgroups (16 Flows)
            </button>
          </div>

          {/* Toggle Link % */}
          <button
            onClick={() => setShowLinkLabels(!showLinkLabels)}
            title="Toggle Flow Percentage Badges"
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              showLinkLabels ? 'bg-teal-50 border-teal-300 text-teal-800 font-semibold' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Percent className="w-3.5 h-3.5" />
            <span>% Labels</span>
          </button>

          {/* Export PNG */}
          <button
            onClick={handleExportPNG}
            title="Export Diagram as PNG Image"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-xs font-medium transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Image</span>
          </button>
        </div>
      </div>

      {/* ── KPI METRICS CARDS BAR ── */}
      <div className="px-6 py-3.5 bg-slate-50/80 border-b border-slate-100">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {/* Total Scope */}
          <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Works Scope</div>
            <div className="text-xl font-extrabold text-slate-900 mt-1 font-mono">{s.total_works?.toLocaleString() || 0}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">100% Audited Baseline</div>
          </div>

          {/* Completion Rate */}
          <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs">
            <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider flex items-center justify-between">
              <span>Completion Rate</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="text-xl font-extrabold text-emerald-600 mt-1 font-mono">{s.completion_rate || 0}%</div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${s.completion_rate || 0}%` }} />
            </div>
          </div>

          {/* Inspection Coverage */}
          <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs">
            <div className="text-[11px] font-semibold text-teal-700 uppercase tracking-wider flex items-center justify-between">
              <span>Inspection Coverage</span>
              <Eye className="w-3.5 h-3.5 text-teal-500" />
            </div>
            <div className="text-xl font-extrabold text-teal-600 mt-1 font-mono">{s.inspection_coverage || 0}%</div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div className="bg-teal-500 h-full rounded-full" style={{ width: `${s.inspection_coverage || 0}%` }} />
            </div>
          </div>

          {/* High Risk Share */}
          <div className="bg-white rounded-xl border border-rose-200 bg-rose-50/20 p-3 shadow-2xs">
            <div className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider flex items-center justify-between">
              <span>High Risk (VH+H)</span>
              <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
            </div>
            <div className="text-xl font-extrabold text-rose-600 mt-1 font-mono">{s.high_risk_rate || 0}%</div>
            <div className="text-[10px] text-rose-700 font-semibold mt-0.5">
              {s.high_risk_count?.toLocaleString() || 0} Total High Risk Works
            </div>
          </div>

          {/* Uninspected High Risk */}
          <div className="bg-white rounded-xl border border-amber-200 bg-amber-50/30 p-3 shadow-2xs">
            <div className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider flex items-center justify-between">
              <span>Uninspected High Risk</span>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="text-xl font-extrabold text-amber-700 mt-1 font-mono">
              {s.uninspected_high_risk_count?.toLocaleString() || 0}
            </div>
            <div className="text-[10px] text-amber-700 font-medium mt-0.5">
              Critical Audit Priority
            </div>
          </div>
        </div>
      </div>

      {/* ── PRESET PATH FOCUS BUTTONS ── */}
      <div className="px-6 py-2.5 bg-slate-100/60 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-600 font-semibold">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <span>Flow Highlights:</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-2.5 py-1 rounded-md transition-all font-medium ${
              activeFilter === 'all' ? 'bg-slate-800 text-white font-semibold shadow-2xs' : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            Show All Flows
          </button>
          <button
            onClick={() => setActiveFilter('high_risk')}
            className={`px-2.5 py-1 rounded-md transition-all font-medium flex items-center gap-1 ${
              activeFilter === 'high_risk' ? 'bg-rose-600 text-white font-semibold shadow-2xs' : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50'
            }`}
          >
            <ShieldAlert className="w-3 h-3" />
            High Risk Flow
          </button>
          <button
            onClick={() => setActiveFilter('uninspected')}
            className={`px-2.5 py-1 rounded-md transition-all font-medium flex items-center gap-1 ${
              activeFilter === 'uninspected' ? 'bg-amber-600 text-white font-semibold shadow-2xs' : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            Uninspected Flow
          </button>
          <button
            onClick={() => setActiveFilter('completed')}
            className={`px-2.5 py-1 rounded-md transition-all font-medium flex items-center gap-1 ${
              activeFilter === 'completed' ? 'bg-emerald-600 text-white font-semibold shadow-2xs' : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            Completed Flow
          </button>
        </div>
      </div>

      {/* ── TOP STAGE HEADERS OVER CANVAS ── */}
      <div className="px-6 pt-4 pb-1">
        <div className="grid grid-cols-4 gap-4 text-center">
          {STAGE_HEADERS.map((stage, i) => (
            <div key={stage.title} className="bg-slate-50 border border-slate-200/80 rounded-lg py-1.5 px-2">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-800">{stage.title}</div>
              <div className="text-[10px] text-slate-500 font-medium">{stage.subtitle}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SANKEY CANVAS ── */}
      <div className="p-4 overflow-x-auto flex justify-center">
        <svg ref={svgRef} className="w-full" style={{ maxWidth: `${width}px`, maxHeight: `${height}px` }} />
      </div>

      {/* ── FLOATING GLASS TOOLTIP ── */}
      {tooltip.visible && tooltip.content && (
        <div
          className="fixed pointer-events-none z-50 bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-xl shadow-2xl border border-slate-700/80 max-w-xs transition-all duration-75"
          style={{
            left: `${tooltip.x + 16}px`,
            top: `${tooltip.y - 12}px`,
            transform: 'translate(0, -50%)'
          }}
        >
          {tooltip.content}
        </div>
      )}

      {/* ── INSIGHT SUMMARY FOOTER CARD ── */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-teal-100 text-teal-800 rounded-lg shrink-0">
            <Activity className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
              NIRIKSHAN Risk Flow Analysis Insights
              {data.filters?.state && (
                <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                  Filtered: {data.filters.state} {data.filters.district ? `→ ${data.filters.district}` : ''}
                </span>
              )}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-600 pt-1">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-800">⚠️ Inspection Gap:</span>{' '}
                {(s.uninspected_count || 0).toLocaleString()} works ({roundPct(s.uninspected_count, s.total_works)}%) have not received physical inspection.
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="font-bold text-rose-700">🚨 High Risk Exposure:</span>{' '}
                {(s.uninspected_high_risk_count || 0).toLocaleString()} uninspected works fall under Very High or High risk classification.
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="font-bold text-teal-700">📌 Recommended Action:</span> Priority physical verification should be scheduled for the uninspected High Risk nodes.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function roundPct(val, total) {
  if (!total || total === 0) return '0.0';
  return ((val / total) * 100).toFixed(1);
}
// import { useState, useEffect } from 'react';
// import { Building2, Search, Filter, ShieldAlert, CheckCircle2, ChevronLeft, ChevronRight, FileText, ArrowUpRight, DollarSign } from 'lucide-react';
// import { useNavigate, useSearchParams } from 'react-router-dom';

// const riskBadgeClass = (score) => 
//   score >= 70 ? 'bg-red-50 text-red-700 border border-red-200 font-bold' :
//   score >= 50 ? 'bg-amber-50 text-amber-700 border border-amber-200 font-medium' :
//   'bg-slate-50 text-slate-600 border border-slate-200 font-medium';

// export default function Vendors() {
//   const navigate = useNavigate();
//   const [searchParams] = useSearchParams();
//   const initialSearch = searchParams.get('search') || '';

//   const [vendors, setVendors] = useState([]);
//   const [total, setTotal] = useState(0);
//   const [page, setPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);
//   const [search, setSearch] = useState(initialSearch);
//   const [riskFilter, setRiskFilter] = useState('');
//   const [loading, setLoading] = useState(true);

//   const [selectedVendor, setSelectedVendor] = useState(null);
//   const [vendorDetail, setVendorDetail] = useState(null);
//   const [loadingDetail, setLoadingDetail] = useState(false);

//   useEffect(() => {
//     const querySearch = searchParams.get('search');
//     if (querySearch) {
//       setSearch(querySearch);
//     }
//   }, [searchParams]);

//   useEffect(() => {
//     setLoading(true);
//     const url = `http://localhost:8000/api/vendors?page=${page}&limit=20&search=${encodeURIComponent(search)}&risk_band=${encodeURIComponent(riskFilter)}`;
//     fetch(url)
//       .then(r => r.json())
//       .then(d => {
//         const fetchedVendors = d.vendors || [];
//         setVendors(fetchedVendors);
//         setTotal(d.total || 0);
//         setTotalPages(d.total_pages || 1);
//         setLoading(false);

//         // Auto select searched vendor or first vendor in list
//         if (fetchedVendors.length > 0) {
//           const match = search ? fetchedVendors.find(v => v.vendor_name.toLowerCase().includes(search.toLowerCase())) : null;
//           handleSelectVendor(match || fetchedVendors[0]);
//         }
//       })
//       .catch(() => setLoading(false));
//   }, [page, search, riskFilter]);

//   const handleSelectVendor = (v) => {
//     if (!v) return;
//     setSelectedVendor(v);
//     setLoadingDetail(true);
//     fetch(`http://localhost:8000/api/vendors/detail?vendor_name=${encodeURIComponent(v.vendor_name)}`)
//       .then(r => r.json())
//       .then(d => {
//         setVendorDetail(d.error ? null : d);
//         setLoadingDetail(false);
//       })
//       .catch(() => setLoadingDetail(false));
//   };

//   return (
//     <div className="flex flex-col h-full -m-6 bg-slate-50 overflow-hidden">
//       {/* Page Header */}
//       <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
//         <div>
//           <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
//             <Building2 className="text-slate-700" size={20}/> Vendor Directory &amp; Network Audit Registry
//           </h2>
//           <p className="text-xs text-slate-500 mt-0.5">
//             National directory of contractors monitored for geographic concentration and disbursement history.
//           </p>
//         </div>
//         <div className="flex items-center gap-3">
//           <span className="text-xs bg-slate-100 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-md font-semibold">{total.toLocaleString()} Vendors Registered</span>
//         </div>
//       </div>

//       {/* Content split: Vendor List | Vendor Projects & Info */}
//       <div className="flex-1 flex overflow-hidden min-w-0">
//         {/* Left List Pane */}
//         <div className="w-80 lg:w-96 bg-white border-r border-slate-200 flex flex-col shrink-0">
//           {/* Search & Filter bar */}
//           <div className="p-4 border-b border-slate-200 space-y-3 bg-slate-50">
//             <div className="relative">
//               <Search className="absolute left-3 top-2.5 text-slate-400" size={15}/>
//               <input
//                 type="text"
//                 value={search}
//                 onChange={e => { setSearch(e.target.value); setPage(1); }}
//                 placeholder="Search vendor name..."
//                 className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-slate-600"
//               />
//             </div>
//             {/* Risk Band Pills */}
//             <div className="flex gap-1.5">
//               {['', 'Very High', 'High', 'Medium', 'Low'].map(band => (
//                 <button
//                   key={band}
//                   onClick={() => { setRiskFilter(band); setPage(1); }}
//                   className={`text-[11px] px-2.5 py-1 rounded-md font-bold transition-colors ${
//                     riskFilter === band ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
//                   }`}
//                 >
//                   {band || 'All'}
//                 </button>
//               ))}
//             </div>
//           </div>

//           {/* Vendors Scroll List */}
//           <div className="flex-1 overflow-y-auto divide-y divide-slate-100 relative">
//             {loading && (
//               <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
//                 <div className="animate-spin w-6 h-6 border-2 border-slate-600 border-t-transparent rounded-full"/>
//               </div>
//             )}
//             {vendors.map(v => {
//               const isSelected = selectedVendor?.vendor_name === v.vendor_name;
//               return (
//                 <div
//                   key={v.vendor_name}
//                   onClick={() => handleSelectVendor(v)}
//                   className={`p-4 cursor-pointer transition-colors hover:bg-slate-50 ${isSelected ? 'bg-slate-100 border-l-4 border-l-slate-800' : ''}`}
//                 >
//                   <div className="flex justify-between items-start mb-1">
//                     <h4 className="text-xs font-bold text-slate-800 truncate max-w-[240px]">{v.vendor_name}</h4>
//                     <span className={`text-[10px] px-2 py-0.5 rounded font-bold border inline-flex items-center justify-center text-center ${riskBadgeClass(v.risk_score)}`}>
//                       {v.risk_score}
//                     </span>
//                   </div>
//                   <div className="flex justify-between items-center text-[11px] text-slate-500 mt-2">
//                     <span>₹{(v.total_disbursed / 1e5).toFixed(1)} L Disbursed</span>
//                     <span>{v.work_count} works · {v.districts_count} dist</span>
//                   </div>
//                 </div>
//               );
//             })}
//             {vendors.length === 0 && !loading && (
//               <div className="p-8 text-center text-slate-400 text-xs">No vendors matching your filters.</div>
//             )}
//           </div>

//           {/* Pagination */}
//           <div className="p-3 border-t border-slate-200 bg-white flex items-center justify-between text-xs text-slate-500">
//             <span>Page {page} of {totalPages}</span>
//             <div className="flex gap-1">
//               <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="p-1 border border-slate-300 rounded disabled:opacity-30">
//                 <ChevronLeft size={16}/>
//               </button>
//               <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages} className="p-1 border border-slate-300 rounded disabled:opacity-30">
//                 <ChevronRight size={16}/>
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* Right Detail Pane */}
//         <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-6 min-w-0">
//           {!selectedVendor ? (
//             <div className="h-full flex items-center justify-center text-slate-400">Select a vendor from the list to view projects</div>
//           ) : loadingDetail ? (
//             <div className="h-full flex items-center justify-center text-slate-500">
//               <div className="animate-spin w-6 h-6 border-2 border-slate-600 border-t-transparent rounded-full mr-2"/>
//               Loading vendor profile and projects...
//             </div>
//           ) : vendorDetail ? (
//             <>
//               {/* Vendor Header Metrics */}
//               <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
//                 <div className="flex justify-between items-start mb-4">
//                   <div>
//                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vendor Profile</span>
//                     <h3 className="text-lg font-bold text-slate-800 mt-0.5">{vendorDetail.vendor_name}</h3>
//                   </div>
//                   <span className={`text-xs px-3 py-1 rounded-full font-bold border inline-flex items-center justify-center text-center ${riskBadgeClass(vendorDetail.risk_score)}`}>
//                     Vendor Risk Score: {vendorDetail.risk_score} ({vendorDetail.risk_band})
//                   </span>
//                 </div>

//                 <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
//                   <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
//                     <p className="text-[10px] text-slate-400 font-bold uppercase">Total Disbursed</p>
//                     <p className="text-sm font-bold text-slate-900 mt-0.5">₹{vendorDetail.total_disbursed.toLocaleString()}</p>
//                   </div>
//                   <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
//                     <p className="text-[10px] text-slate-400 font-bold uppercase">Total Projects</p>
//                     <p className="text-sm font-bold text-slate-700 mt-0.5">{vendorDetail.work_count} works</p>
//                   </div>
//                   <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
//                     <p className="text-[10px] text-slate-400 font-bold uppercase">Districts Spread</p>
//                     <p className="text-sm font-bold text-slate-700 mt-0.5">{vendorDetail.districts.length} districts</p>
//                   </div>
//                   <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
//                     <p className="text-[10px] text-slate-400 font-bold uppercase">MPs Associated</p>
//                     <p className="text-sm font-bold text-slate-700 mt-0.5">{vendorDetail.mps.length} MPs</p>
//                   </div>
//                   <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
//                     <p className="text-[10px] text-slate-400 font-bold uppercase">Network Flags</p>
//                     <div className="flex flex-wrap gap-1 mt-1">
//                       {vendorDetail.mps.length > 2 && (
//                         <span className="bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded text-[9px] font-bold" title="Vendor active across 3+ MPs">High Reach</span>
//                       )}
//                       {vendorDetail.districts.length > 1 && (
//                         <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[9px] font-bold" title="Multi district concentration">Concentration</span>
//                       )}
//                       {vendorDetail.districts.length > 2 && (
//                         <span className="bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded text-[9px] font-bold" title="Inter district bridge vendor">Bridge</span>
//                       )}
//                       {vendorDetail.mps.length <= 2 && vendorDetail.districts.length <= 1 && (
//                         <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[9px] font-bold">Standard</span>
//                       )}
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* Projects Table */}
//               <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
//                 <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
//                   <h4 className="font-bold text-slate-700 text-sm">Past and Present Projects ({vendorDetail.projects.length})</h4>
//                   <span className="text-xs text-slate-400">Click any project to inspect sanity check</span>
//                 </div>

//                 <table className="w-full text-left text-xs border-collapse">
//                   <thead>
//                     <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
//                       <th className="p-3">Work ID and Description</th>
//                       <th className="p-3">MP and Location</th>
//                       <th className="p-3 text-right">Sanction Amount</th>
//                       <th className="p-3 text-center">Status</th>
//                       <th className="p-3 text-center">Risk Score</th>
//                       <th className="p-3 text-center">Action</th>
//                     </tr>
//                   </thead>
//                   <tbody className="divide-y divide-slate-100">
//                     {vendorDetail.projects.map(p => (
//                       <tr key={p.work_id} className="hover:bg-slate-50 transition-colors">
//                         <td className="p-3 max-w-[240px]">
//                           <p className="font-medium text-slate-800 truncate">{p.description}</p>
//                           <p className="text-[10px] text-slate-400 font-mono mt-0.5">{p.work_id}</p>
//                         </td>
//                         <td className="p-3">
//                           <p className="font-medium text-slate-700">{p.mp}</p>
//                           <p className="text-[10px] text-slate-400">{p.district}, {p.state}</p>
//                         </td>
//                         <td className="p-3 text-right font-bold text-slate-700">
//                           ₹{p.sanction.toLocaleString()}
//                         </td>
//                         <td className="p-3 text-center">
//                           <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-semibold">{p.status}</span>
//                         </td>
//                         <td className="p-3 text-center">
//                           <span className={`text-[10px] px-2 py-0.5 rounded font-bold border inline-flex items-center justify-center text-center ${riskBadgeClass(p.risk_score)}`}>
//                             {p.risk_score}
//                           </span>
//                         </td>
//                         <td className="p-3 text-center">
//                           <button
//                             onClick={() => navigate(`/sanity-check?work_id=${encodeURIComponent(p.work_id)}`)}
//                             className="bg-slate-100 text-slate-800 border border-slate-200 px-2 py-1 rounded text-[10px] font-bold hover:bg-slate-200 transition-colors inline-flex items-center gap-1"
//                           >
//                             Sanity Check <ArrowUpRight size={11}/>
//                           </button>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             </>
//           ) : null}
//         </div>
//       </div>
//     </div>
//   );
// }

//--------------------Previous Code ----------------------




import { useState, useEffect } from 'react';
import {
  Building2,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

/* ═══════════════════════════════════════════════
   RISK BADGE STYLING
═══════════════════════════════════════════════ */

const riskBadgeClass = (score) => {
  const numericScore = Number(score) || 0;

  if (numericScore >= 70) {
    return 'bg-red-50 text-red-700 border border-red-200 font-bold';
  }

  if (numericScore >= 50) {
    return 'bg-amber-50 text-amber-700 border border-amber-200 font-medium';
  }

  return 'bg-slate-50 text-slate-600 border border-slate-200 font-medium';
};

/* ═══════════════════════════════════════════════
   DISTRICT VISUAL SIGNAL
═══════════════════════════════════════════════ */

/*
 * The district indicator uses the highest risk
 * score among all projects in that district.
 *
 * It does NOT calculate an average.
 */

const getDistrictSignal = (riskScore) => {
  const score = Number(riskScore) || 0;

  if (score >= 70) {
    return {
      strip: '#DC2626',
      surface: '#FCE7E7',
      border: '#FECACA'
    };
  }

  if (score >= 50) {
    return {
      strip: '#94A3B8',
      surface: '#F1F5F9',
      border: '#CBD5E1'
    };
  }

  return {
    strip: '#16A34A',
    surface: '#ECFDF3',
    border: '#BBE3C9'
  };
};

/* ═══════════════════════════════════════════════
   TREEMAP LAYOUT ENGINE
═══════════════════════════════════════════════ */

/*
 * Slice-and-dice treemap.
 *
 * The largest district is placed first.
 * Remaining districts occupy the remaining space.
 *
 * All coordinates are percentages, so the map
 * always fits the width of its parent container.
 */

function createTreemapLayout(
  items,
  x = 0,
  y = 0,
  width = 100,
  height = 100
) {
  if (
    !items.length ||
    width <= 0 ||
    height <= 0
  ) {
    return [];
  }

  if (items.length === 1) {
    return [
      {
        ...items[0],
        x,
        y,
        width,
        height
      }
    ];
  }

  const totalValue = items.reduce(
    (sum, item) => sum + item.works,
    0
  );

  if (totalValue <= 0) {
    return [];
  }

  const [first, ...remaining] = items;

  const firstRatio = first.works / totalValue;

  /*
   * Partition along the longer side.
   * This creates a large dominant rectangle
   * similar to the reference treemap.
   */

  if (width >= height) {
    const firstWidth = width * firstRatio;

    return [
      {
        ...first,
        x,
        y,
        width: firstWidth,
        height
      },
      ...createTreemapLayout(
        remaining,
        x + firstWidth,
        y,
        width - firstWidth,
        height
      )
    ];
  }

  const firstHeight = height * firstRatio;

  return [
    {
      ...first,
      x,
      y,
      width,
      height: firstHeight
    },
    ...createTreemapLayout(
      remaining,
      x,
      y + firstHeight,
      width,
      height - firstHeight
    )
  ];
}

/* ═══════════════════════════════════════════════
   DISTRICT WORK CONCENTRATION TREEMAP
═══════════════════════════════════════════════ */

function DistrictConcentrationMap({ projects = [] }) {
  /*
   * STEP 1:
   * Group projects by district.
   *
   * Each district stores:
   * - Total works
   * - Highest risk score among its projects
   */

  const districtMap = projects.reduce((acc, project) => {
    const districtName = String(
      project?.district || 'Unknown District'
    ).trim();

    /*
     * Read the same risk_score field used by
     * the project table.
     */

    const parsedRisk = Number(project?.risk_score);

    const riskScore = Number.isFinite(parsedRisk)
      ? parsedRisk
      : null;

    if (!acc[districtName]) {
      acc[districtName] = {
        district: districtName,
        works: 0,
        highestRisk: null
      };
    }

    /*
     * Count every project as one work.
     */

    acc[districtName].works += 1;

    /*
     * Keep the highest valid risk score.
     *
     * Example:
     * District A → 92, 35, 41
     * District risk signal → 92
     *
     * No averaging takes place.
     */

    if (riskScore !== null) {
      if (
        acc[districtName].highestRisk === null ||
        riskScore > acc[districtName].highestRisk
      ) {
        acc[districtName].highestRisk = riskScore;
      }
    }

    return acc;
  }, {});

  /*
   * STEP 2:
   * Sort districts from the most works to
   * the fewest works.
   */

  const districts = Object.values(districtMap)
    .map((district) => ({
      ...district,

      /*
       * Missing risk data is treated as 0 for
       * visual purposes only.
       */

      districtRisk:
        district.highestRisk === null
          ? 0
          : district.highestRisk
    }))
    .sort((a, b) => b.works - a.works);

  /*
   * STEP 3:
   * Generate proportional rectangles.
   */

  const treemapItems = createTreemapLayout(districts);

  if (districts.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 text-center text-xs text-slate-400">
        No district distribution data available.
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">

      {/* ═════════════════════════════════════
          SECTION HEADER
      ═════════════════════════════════════ */}

      <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-3">

        <div className="min-w-0">

          <h4 className="font-bold text-slate-800 text-sm">
            District Work Concentration
          </h4>

          <p className="text-[11px] text-slate-500 mt-1">
            Geographic distribution of the vendor's assigned works.
          </p>

        </div>

        <span className="text-[10px] font-semibold text-slate-500 whitespace-nowrap">
          {districts.length} Districts
        </span>

      </div>

      {/* ═════════════════════════════════════
          FIXED-SIZE TREEMAP
      ═════════════════════════════════════ */}

      <div className="p-3 sm:p-4">

        <div
          className="relative w-full overflow-hidden rounded-lg bg-slate-100"
          style={{
            height: '320px',
            minHeight: '260px'
          }}
        >

          {treemapItems.map((district) => {
            /*
             * Use the highest risk score in the
             * district to determine its signal.
             */

            const signal = getDistrictSignal(
              district.districtRisk
            );

            /*
             * Determine whether the rectangle is
             * large enough to display text.
             */

            const isSmall =
              district.width < 12 ||
              district.height < 18;

            const isVerySmall =
              district.width < 7 ||
              district.height < 10;

            return (
              <div
                key={district.district}
                className="absolute overflow-hidden transition-all duration-200 hover:z-20 hover:brightness-95 group"
                style={{
                  left: `${district.x}%`,
                  top: `${district.y}%`,
                  width: `${district.width}%`,
                  height: `${district.height}%`,
                  backgroundColor: signal.surface,
                  border: `1px solid ${signal.border}`,
                  boxSizing: 'border-box',
                  padding: isVerySmall
                    ? '3px'
                    : isSmall
                      ? '6px'
                      : '9px'
                }}
                title={`${district.district} — ${district.works} ${district.works === 1 ? 'work' : 'works'
                  }`}
              >

                {/* ═════════════════════════════
                    DISTRICT NAME
                ═════════════════════════════ */}

                <div className="relative z-10 min-w-0 overflow-hidden">

                  <p
                    className={`font-semibold leading-tight truncate ${isVerySmall
                        ? 'text-[8px]'
                        : isSmall
                          ? 'text-[10px]'
                          : 'text-[11px]'
                      }`}
                    style={{
                      color: '#334155'
                    }}
                  >
                    {district.district}
                  </p>

                  {!isVerySmall && (
                    <p
                      className={`mt-1 font-medium ${isSmall
                          ? 'text-[9px]'
                          : 'text-[10px]'
                        }`}
                      style={{
                        color: '#64748B'
                      }}
                    >
                      {district.works}{' '}
                      {district.works === 1 ? 'work' : 'works'}
                    </p>
                  )}

                </div>

                {/* ═════════════════════════════
                    RELATIVE WORK COUNT BAR
                ═════════════════════════════ */}

                {!isSmall && (
                  <div className="absolute left-2 right-2 bottom-3 h-1 rounded-full bg-black/5 overflow-hidden">

                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          (district.works /
                            Math.max(
                              1,
                              districts[0].works
                            )) *
                          100
                        )}%`,
                        backgroundColor: '#64748B'
                      }}
                    />

                  </div>
                )}

                {/* ═════════════════════════════
                    DISCREET RISK SIGNAL
                ═════════════════════════════ */}

                <div
                  className="absolute bottom-0 left-0 right-0"
                  style={{
                    height: isVerySmall ? '2px' : '4px',
                    backgroundColor: signal.strip
                  }}
                />

                {/* Hover outline */}

                <div className="absolute inset-0 border-2 border-transparent group-hover:border-slate-500 pointer-events-none transition-colors" />

              </div>
            );
          })}

        </div>

      </div>

      {/* ═════════════════════════════════════
          FOOTER
      ═════════════════════════════════════ */}

      <div className="px-5 py-2.5 border-t border-slate-100 flex items-center justify-between gap-2">

        <span className="text-[10px] text-slate-400">
          {projects.length} total works across all districts
        </span>

        <span className="text-[10px] text-slate-400">
          Hover over a district for details
        </span>

      </div>

    </div>
  );
}

/* ═══════════════════════════════════════════════
   VENDOR DIRECTORY PAGE
═══════════════════════════════════════════════ */

export default function Vendors() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialSearch = searchParams.get('search') || '';

  const [vendors, setVendors] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState(initialSearch);
  const [riskFilter, setRiskFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const [selectedVendor, setSelectedVendor] = useState(null);
  const [vendorDetail, setVendorDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  /* ═══════════════════════════════════════════
     SYNCHRONIZE URL SEARCH PARAMETER
  ═══════════════════════════════════════════ */

  useEffect(() => {
    const querySearch = searchParams.get('search');

    if (querySearch !== null) {
      setSearch(querySearch);
      setPage(1);
    }
  }, [searchParams]);

  /* ═══════════════════════════════════════════
     FETCH VENDOR LIST
  ═══════════════════════════════════════════ */

  useEffect(() => {
    let cancelled = false;

    setLoading(true);

    const url =
      `http://localhost:8000/api/vendors` +
      `?page=${page}` +
      `&limit=20` +
      `&search=${encodeURIComponent(search)}` +
      `&risk_band=${encodeURIComponent(riskFilter)}`;

    fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to fetch vendors');
        }

        return response.json();
      })
      .then((data) => {
        if (cancelled) return;

        const fetchedVendors = data.vendors || [];

        setVendors(fetchedVendors);
        setTotal(data.total || 0);
        setTotalPages(data.total_pages || 1);
        setLoading(false);

        /*
         * Automatically select the matching vendor
         * or the first vendor in the list.
         */

        if (fetchedVendors.length > 0) {
          const match = search
            ? fetchedVendors.find((vendor) =>
              String(vendor.vendor_name || '')
                .toLowerCase()
                .includes(search.toLowerCase())
            )
            : null;

          handleSelectVendor(match || fetchedVendors[0]);
        } else {
          setSelectedVendor(null);
          setVendorDetail(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [page, search, riskFilter]);

  /* ═══════════════════════════════════════════
     FETCH VENDOR DETAILS
  ═══════════════════════════════════════════ */

  const handleSelectVendor = (vendor) => {
    if (!vendor) return;

    setSelectedVendor(vendor);
    setLoadingDetail(true);

    fetch(
      `http://localhost:8000/api/vendors/detail?vendor_name=${encodeURIComponent(
        vendor.vendor_name
      )}`
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to fetch vendor details');
        }

        return response.json();
      })
      .then((data) => {
        setVendorDetail(data.error ? null : data);
        setLoadingDetail(false);
      })
      .catch(() => {
        setLoadingDetail(false);
        setVendorDetail(null);
      });
  };

  /* ═══════════════════════════════════════════
     RENDER PAGE
  ═══════════════════════════════════════════ */

  return (
    <div className="flex flex-col h-full -m-6 bg-slate-50 overflow-hidden">

      {/* ═════════════════════════════════════
          PAGE HEADER
      ═════════════════════════════════════ */}

      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">

        <div>

          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="text-slate-700" size={20} />
            Vendor Directory &amp; Network Audit Registry
          </h2>

          <p className="text-xs text-slate-500 mt-0.5">
            National directory of contractors monitored for geographic concentration and disbursement history.
          </p>

        </div>

        <div className="flex items-center gap-3">

          <span className="text-xs bg-slate-100 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-md font-semibold">
            {total.toLocaleString()} Vendors Registered
          </span>

        </div>

      </div>

      {/* ═════════════════════════════════════
          MAIN CONTENT
      ═════════════════════════════════════ */}

      <div className="flex-1 flex overflow-hidden min-w-0">

        {/* ═══════════════════════════════════
            LEFT: VENDOR LIST
        ═══════════════════════════════════ */}

        <div className="w-80 lg:w-96 bg-white border-r border-slate-200 flex flex-col shrink-0">

          {/* Search and filters */}

          <div className="p-4 border-b border-slate-200 space-y-3 bg-slate-50">

            <div className="relative">

              <Search
                className="absolute left-3 top-2.5 text-slate-400"
                size={15}
              />

              <input
                type="text"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search vendor name..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-slate-600"
              />

            </div>

            <div className="flex gap-1.5">

              {['', 'Very High', 'High', 'Medium', 'Low'].map(
                (band) => (
                  <button
                    key={band}
                    onClick={() => {
                      setRiskFilter(band);
                      setPage(1);
                    }}
                    className={`text-[11px] px-2.5 py-1 rounded-md font-bold transition-colors ${riskFilter === band
                        ? 'bg-slate-800 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                  >
                    {band || 'All'}
                  </button>
                )
              )}

            </div>

          </div>

          {/* Vendor scroll list */}

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 relative">

            {loading && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
                <div className="animate-spin w-6 h-6 border-2 border-slate-600 border-t-transparent rounded-full" />
              </div>
            )}

            {vendors.map((vendor) => {
              const isSelected =
                selectedVendor?.vendor_name === vendor.vendor_name;

              return (
                <div
                  key={vendor.vendor_name}
                  onClick={() => handleSelectVendor(vendor)}
                  className={`p-4 cursor-pointer transition-colors hover:bg-slate-50 ${isSelected
                      ? 'bg-slate-100 border-l-4 border-l-slate-800'
                      : ''
                    }`}
                >

                  <div className="flex justify-between items-start mb-1">

                    <h4 className="text-xs font-bold text-slate-800 truncate max-w-[240px]">
                      {vendor.vendor_name}
                    </h4>

                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold border inline-flex items-center justify-center text-center ${riskBadgeClass(
                        vendor.risk_score
                      )}`}
                    >
                      {vendor.risk_score}
                    </span>

                  </div>

                  <div className="flex justify-between items-center text-[11px] text-slate-500 mt-2">

                    <span>
                      ₹{(Number(vendor.total_disbursed) / 1e5).toFixed(1)} L Disbursed
                    </span>

                    <span>
                      {vendor.work_count} works · {vendor.districts_count} dist
                    </span>

                  </div>

                </div>
              );
            })}

            {vendors.length === 0 && !loading && (
              <div className="p-8 text-center text-slate-400 text-xs">
                No vendors matching your filters.
              </div>
            )}

          </div>

          {/* Pagination */}

          <div className="p-3 border-t border-slate-200 bg-white flex items-center justify-between text-xs text-slate-500">

            <span>
              Page {page} of {totalPages}
            </span>

            <div className="flex gap-1">

              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1 border border-slate-300 rounded disabled:opacity-30"
              >
                <ChevronLeft size={16} />
              </button>

              <button
                onClick={() =>
                  setPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={page === totalPages}
                className="p-1 border border-slate-300 rounded disabled:opacity-30"
              >
                <ChevronRight size={16} />
              </button>

            </div>

          </div>

        </div>

        {/* ═══════════════════════════════════
            RIGHT: VENDOR DETAILS
        ═══════════════════════════════════ */}

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-6 min-w-0">

          {!selectedVendor ? (
            <div className="h-full flex items-center justify-center text-slate-400">
              Select a vendor from the list to view projects
            </div>
          ) : loadingDetail ? (
            <div className="h-full flex items-center justify-center text-slate-500">
              <div className="animate-spin w-6 h-6 border-2 border-slate-600 border-t-transparent rounded-full mr-2" />
              Loading vendor profile and projects...
            </div>
          ) : vendorDetail ? (
            <>

              {/* ═════════════════════════════════
                  VENDOR PROFILE
              ═════════════════════════════════ */}

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">

                <div className="flex justify-between items-start mb-4 gap-4">

                  <div className="min-w-0">

                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Vendor Profile
                    </span>

                    <h3 className="text-lg font-bold text-slate-800 mt-0.5 break-words">
                      {vendorDetail.vendor_name}
                    </h3>

                  </div>

                  <span
                    className={`text-xs px-3 py-1 rounded-full font-bold border inline-flex items-center justify-center text-center shrink-0 ${riskBadgeClass(
                      vendorDetail.risk_score
                    )}`}
                  >
                    Vendor Risk Score: {vendorDetail.risk_score} (
                    {vendorDetail.risk_band})
                  </span>

                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">

                    <p className="text-[10px] text-slate-400 font-bold uppercase">
                      Total Disbursed
                    </p>

                    <p className="text-sm font-bold text-slate-900 mt-0.5">
                      ₹{Number(vendorDetail.total_disbursed || 0).toLocaleString()}
                    </p>

                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">

                    <p className="text-[10px] text-slate-400 font-bold uppercase">
                      Total Projects
                    </p>

                    <p className="text-sm font-bold text-slate-700 mt-0.5">
                      {vendorDetail.work_count} works
                    </p>

                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">

                    <p className="text-[10px] text-slate-400 font-bold uppercase">
                      Districts Spread
                    </p>

                    <p className="text-sm font-bold text-slate-700 mt-0.5">
                      {(vendorDetail.districts || []).length} districts
                    </p>

                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">

                    <p className="text-[10px] text-slate-400 font-bold uppercase">
                      MPs Associated
                    </p>

                    <p className="text-sm font-bold text-slate-700 mt-0.5">
                      {(vendorDetail.mps || []).length} MPs
                    </p>

                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">

                    <p className="text-[10px] text-slate-400 font-bold uppercase">
                      Network Flags
                    </p>

                    <div className="flex flex-wrap gap-1 mt-1">

                      {(vendorDetail.mps || []).length > 2 && (
                        <span
                          className="bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded text-[9px] font-bold"
                          title="Vendor active across 3+ MPs"
                        >
                          High Reach
                        </span>
                      )}

                      {(vendorDetail.districts || []).length > 1 && (
                        <span
                          className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[9px] font-bold"
                          title="Multi district concentration"
                        >
                          Concentration
                        </span>
                      )}

                      {(vendorDetail.districts || []).length > 2 && (
                        <span
                          className="bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded text-[9px] font-bold"
                          title="Inter district bridge vendor"
                        >
                          Bridge
                        </span>
                      )}

                      {(vendorDetail.mps || []).length <= 2 &&
                        (vendorDetail.districts || []).length <= 1 && (
                          <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[9px] font-bold">
                            Standard
                          </span>
                        )}

                    </div>

                  </div>

                </div>

              </div>

              {/* ═════════════════════════════════
                  DISTRICT WORK CONCENTRATION
              ═════════════════════════════════ */}

              <DistrictConcentrationMap
                projects={vendorDetail.projects || []}
              />

              {/* ═════════════════════════════════
                  PAST AND PRESENT PROJECTS
              ═════════════════════════════════ */}

              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">

                <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center gap-3">

                  <h4 className="font-bold text-slate-700 text-sm">
                    Past and Present Projects (
                    {(vendorDetail.projects || []).length})
                  </h4>

                  <span className="text-xs text-slate-400">
                    Click any project to inspect sanity check
                  </span>

                </div>

                <div className="overflow-x-auto">

                  <table className="w-full text-left text-xs border-collapse">

                    <thead>

                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">

                        <th className="p-3">
                          Work ID and Description
                        </th>

                        <th className="p-3">
                          MP and Location
                        </th>

                        <th className="p-3 text-right">
                          Sanction Amount
                        </th>

                        <th className="p-3 text-center">
                          Status
                        </th>

                        <th className="p-3 text-center">
                          Risk Score
                        </th>

                        <th className="p-3 text-center">
                          Action
                        </th>

                      </tr>

                    </thead>

                    <tbody className="divide-y divide-slate-100">

                      {(vendorDetail.projects || []).map((project) => (

                        <tr
                          key={project.work_id}
                          className="hover:bg-slate-50 transition-colors"
                        >

                          <td className="p-3 max-w-[240px]">

                            <p className="font-medium text-slate-800 truncate">
                              {project.description}
                            </p>

                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {project.work_id}
                            </p>

                          </td>

                          <td className="p-3">

                            <p className="font-medium text-slate-700">
                              {project.mp}
                            </p>

                            <p className="text-[10px] text-slate-400">
                              {project.district}, {project.state}
                            </p>

                          </td>

                          <td className="p-3 text-right font-bold text-slate-700">
                            ₹{Number(project.sanction || 0).toLocaleString()}
                          </td>

                          <td className="p-3 text-center">

                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-semibold">
                              {project.status}
                            </span>

                          </td>

                          <td className="p-3 text-center">

                            <span
                              className={`text-[10px] px-2 py-0.5 rounded font-bold border inline-flex items-center justify-center text-center ${riskBadgeClass(
                                project.risk_score
                              )}`}
                            >
                              {project.risk_score}
                            </span>

                          </td>

                          <td className="p-3 text-center">

                            <button
                              onClick={() =>
                                navigate(
                                  `/sanity-check?work_id=${encodeURIComponent(
                                    project.work_id
                                  )}`
                                )
                              }
                              className="bg-slate-100 text-slate-800 border border-slate-200 px-2 py-1 rounded text-[10px] font-bold hover:bg-slate-200 transition-colors inline-flex items-center gap-1"
                            >
                              Sanity Check
                              <ArrowUpRight size={11} />
                            </button>

                          </td>

                        </tr>

                      ))}

                    </tbody>

                  </table>

                </div>

              </div>

            </>

          ) : (

            <div className="h-full flex items-center justify-center text-slate-400">
              Unable to load vendor details.
            </div>

          )}

        </div>

      </div>

    </div>
  );
}
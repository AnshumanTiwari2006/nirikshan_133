import React, { useState, useEffect } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { scaleQuantile } from 'd3-scale';

const INDIA_TOPO_JSON = '/india-states.json';

const getHeatMapData = () => {
  return [
    { id: 'UP', state: 'Uttar Pradesh', value: 92 },
    { id: 'BR', state: 'Bihar', value: 85 },
    { id: 'MH', state: 'Maharashtra', value: 45 },
    { id: 'GJ', state: 'Gujarat', value: 30 },
    { id: 'KA', state: 'Karnataka', value: 75 },
    { id: 'WB', state: 'West Bengal', value: 88 },
    { id: 'TN', state: 'Tamil Nadu', value: 20 },
    { id: 'RJ', state: 'Rajasthan', value: 65 },
  ];
};

export default function IndiaMap({ dynamicData }) {
  const [data, setData] = useState(dynamicData || []);
  const [tooltipContent, setTooltipContent] = useState('');
  const [position, setPosition] = useState({ coordinates: [80, 22], zoom: 1 });

  useEffect(() => {
    if (dynamicData && dynamicData.length > 0) {
      setData(dynamicData);
    }
  }, [dynamicData]);

  const colorScale = scaleQuantile()
    .domain(data.length > 0 ? data.map(d => d.value) : [0, 100])
    .range(['#fed7aa', '#fb923c', '#ea580c', '#9a3412']);

  const handleStateClick = (geo) => {
    // Basic zoom-in logic based on state centroid - simplified for this demo
    // You would normally calculate the centroid of the clicked geometry
    const { NAME_1 } = geo.properties;
    
    // Zoom in slightly to simulate the requested interaction
    setPosition({ coordinates: [80, 22], zoom: 2 });
    alert(`Zoomed into ${NAME_1}. In a production environment with District TopoJSON, this would load the district heatmap for ${NAME_1}.`);
  };

  const handleZoomOut = () => {
    setPosition({ coordinates: [80, 22], zoom: 1 });
  };

  return (
    <div className="relative w-full h-full bg-slate-50 rounded-xl overflow-hidden group">
      {tooltipContent && (
        <div className="absolute top-2 left-2 bg-white text-slate-800 border border-slate-300 shadow-md font-semibold text-xs px-3 py-1.5 rounded-lg z-10 pointer-events-none">
          {tooltipContent}
        </div>
      )}
      
      {position.zoom > 1 && (
        <button 
          onClick={handleZoomOut}
          className="absolute top-2 right-2 bg-white text-slate-700 px-3 py-1 text-xs font-semibold rounded shadow-sm border border-slate-200 z-10 hover:bg-slate-100"
        >
          Reset Zoom
        </button>
      )}

      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 850,
        }}
        width={800}
        height={600}
        className="w-full h-full"
      >
        <ZoomableGroup 
          zoom={position.zoom} 
          center={position.coordinates} 
          onMoveEnd={(position) => setPosition(position)}
        >
          <Geographies geography={INDIA_TOPO_JSON}>
            {({ geographies }) =>
              geographies.map(geo => {
                const stateName = geo.properties.NAME_1;
                const stateData = data.find(s => s.state === stateName);
                const isHighRisk = stateData ? stateData.value > 80 : false;
                
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onMouseEnter={() => {
                      setTooltipContent(`${stateName} - Risk Score: ${stateData ? stateData.value : 'N/A'}`);
                    }}
                    onMouseLeave={() => {
                      setTooltipContent('');
                    }}
                    onClick={() => handleStateClick(geo)}
                    style={{
                      default: {
                        fill: stateData ? colorScale(stateData.value) : '#e2e8f0',
                        stroke: '#ffffff',
                        strokeWidth: 0.5,
                        outline: 'none',
                        transition: 'all 250ms'
                      },
                      hover: {
                        fill: isHighRisk ? '#7f1d1d' : '#f59e0b',
                        stroke: '#ffffff',
                        strokeWidth: 1,
                        outline: 'none',
                        cursor: 'pointer'
                      },
                      pressed: {
                        fill: '#0f172a',
                        outline: 'none'
                      }
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
    </div>
  );
}

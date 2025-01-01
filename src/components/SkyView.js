import React, { useState } from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

const PLANETS = [
  { name: 'Venus', color: '#FFE5CC' },
  { name: 'Mars', color: '#FF6B4A' },
  { name: 'Jupiter', color: '#FFDEB0' },
  { name: 'Saturn', color: '#FFE5B0' }
];

// Generate static background stars
const BACKGROUND_STARS = [...Array(100)].map(() => ({
  x: Math.random() * 800,
  y: Math.random() * 400,
  size: Math.random() * 1,
  opacity: Math.random() * 0.5 + 0.2
}));

const SkyView = ({ observer, time, celestialObjects }) => {
  const [direction, setDirection] = useState('N'); // N, S, E, W
  
  // Convert altitude/azimuth to x,y coordinates on our hemisphere projection
  const projectToSky = (altitude, azimuth) => {
    // Adjust azimuth based on viewing direction
    const directionOffsets = { N: 0, E: 90, S: 180, W: 270 };
    const adjustedAz = (azimuth - directionOffsets[direction] + 360) % 360;
    
    // Only show objects in the current 180° field of view
    if (adjustedAz > 180) return null;
    
    // Project altitude and azimuth to x,y
    const x = 400 + (Math.sin(adjustedAz * Math.PI / 180) * (90 - altitude) * 4);
    const y = 400 - (Math.cos(adjustedAz * Math.PI / 180) * (90 - altitude) * 4);
    
    return { x, y };
  };

  // Calculate object size based on magnitude
  const getVisualSize = (magnitude, baseSize) => {
    // Brighter objects appear larger
    const scaleFactor = Math.max(1, 2 ** (-magnitude / 2));
    return baseSize * scaleFactor;
  };

  return (
    <div className="relative w-full">
      {/* Direction controls */}
      <div className="absolute top-4 right-4 flex space-x-2 z-10">
        <button 
          onClick={() => setDirection('N')}
          className={`p-2 rounded-lg ${direction === 'N' ? 'bg-blue-500' : 'bg-gray-700'}`}
        >
          <ArrowUp className="w-4 h-4" />
        </button>
        <button 
          onClick={() => setDirection('E')}
          className={`p-2 rounded-lg ${direction === 'E' ? 'bg-blue-500' : 'bg-gray-700'}`}
        >
          <ArrowRight className="w-4 h-4" />
        </button>
        <button 
          onClick={() => setDirection('S')}
          className={`p-2 rounded-lg ${direction === 'S' ? 'bg-blue-500' : 'bg-gray-700'}`}
        >
          <ArrowDown className="w-4 h-4" />
        </button>
        <button 
          onClick={() => setDirection('W')}
          className={`p-2 rounded-lg ${direction === 'W' ? 'bg-blue-500' : 'bg-gray-700'}`}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Sky hemisphere */}
      <svg viewBox="0 0 800 500" className="w-full">
        {/* Background gradient and effects */}
        <defs>
          <linearGradient id="skyGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#000B1F" />
            <stop offset="100%" stopColor="#082444" />
          </linearGradient>
          <radialGradient id="moonGlow">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>
          <filter id="starBlur">
            <feGaussianBlur stdDeviation="0.3" />
          </filter>
          <filter id="jupiterBands">
            <feTurbulence type="fractalNoise" baseFrequency="0.01" numOctaves="2" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0
                      0 0 0 0 0
                      0 0 0 0 0
                      0 0 0 0.3 0"
            />
          </filter>
          <filter id="saturnRings">
            <feGaussianBlur stdDeviation="0.5" />
          </filter>
        </defs>
        
        {/* Sky background */}
        <rect width="800" height="500" fill="url(#skyGradient)" />
        
        {/* Horizon line */}
        <line x1="0" y1="400" x2="800" y2="400" 
          stroke="#2C446E" strokeWidth="2" />
        
        {/* Altitude lines every 15° */}
        {[15, 30, 45, 60, 75].map(altitude => (
          <g key={altitude}>
            <circle
              cx="400"
              cy="400"
              r={altitude * 4}
              fill="none"
              stroke="#1A2A42"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
            <text
              x="400"
              y={400 - altitude * 4}
              textAnchor="middle"
              fill="#2C446E"
              fontSize="10"
            >
              {altitude}°
            </text>
          </g>
        ))}
        
        {/* Azimuth lines every 30° */}
        {[30, 60, 90, 120, 150].map(azimuth => {
          const adjustedAz = (azimuth - 90) * Math.PI / 180;
          return (
            <line
              key={azimuth}
              x1={400}
              y1={400}
              x2={400 + Math.cos(adjustedAz) * 300}
              y2={400 + Math.sin(adjustedAz) * 300}
              stroke="#1A2A42"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          );
        })}

        {/* Direction labels */}
        <text x="400" y="420" textAnchor="middle" fill="#4A5568" fontSize="14" fontWeight="bold">
          {direction}
        </text>
        <text x="400" y="440" textAnchor="middle" fill="#2C446E" fontSize="12">
          Horizon
        </text>
        
        {/* Static background stars */}
        {BACKGROUND_STARS.map((star, i) => (
          <circle
            key={i}
            cx={star.x}
            cy={star.y}
            r={star.size}
            fill="#FFFFFF"
            opacity={star.opacity}
            filter="url(#starBlur)"
          />
        ))}

        {/* Celestial Objects */}
        <g className="celestial-objects">
          {celestialObjects.map((obj, index) => {
            const pos = projectToSky(obj.altitude, obj.azimuth);
            if (!pos) return null;
            
            const visualSize = getVisualSize(obj.magnitude, obj.size);
            
            return (
              <g key={index}>
                {obj.type === 'moon' && (
                  <>
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={visualSize * 3}
                      fill="url(#moonGlow)"
                    />
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={visualSize}
                      fill="#FFFFED"
                    />
                  </>
                )}
                
                {obj.type === 'planet' && (
                  <>
                    {obj.name === 'Saturn' ? (
                      <>
                        <ellipse 
                          cx={pos.x} 
                          cy={pos.y} 
                          rx={visualSize * 2.2} 
                          ry={visualSize * 0.6} 
                          fill="none"
                          stroke="#FFE5B0"
                          strokeWidth="1"
                          filter="url(#saturnRings)"
                        />
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r={visualSize * 1.2}
                          fill="#FFE5B0"
                        />
                      </>
                    ) : obj.name === 'Jupiter' ? (
                      <g>
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r={visualSize * 1.5}
                          fill="#FFDEB0"
                        />
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r={visualSize * 1.5}
                          fill="url(#jupiterBands)"
                          opacity="0.3"
                        />
                      </g>
                    ) : obj.name === 'Mars' ? (
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={visualSize}
                        fill="#FF6B4A"
                      />
                    ) : (
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={visualSize}
                        fill={PLANETS.find(p => p.name === obj.name)?.color || '#FFA500'}
                      />
                    )}
                  </>
                )}
                
                {/* Label */}
                <text
                  x={pos.x}
                  y={pos.y + visualSize + 12}
                  textAnchor="middle"
                  fill="#9CA3AF"
                  fontSize="12"
                >
                  {obj.name}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 text-sm text-gray-300 space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-yellow-200"></div>
          <span>Moon</span>
        </div>
        {PLANETS.map((planet, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: planet.color }}></div>
            <span>{planet.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SkyView;

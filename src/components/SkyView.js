import React, { useState } from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import * as Astronomy from 'astronomy-engine';

const PLANETS = [
  { name: 'Venus', color: '#FFE5CC' },
  { name: 'Mars', color: '#FF6B4A' },
  { name: 'Jupiter', color: '#FFDEB0' },
  { name: 'Saturn', color: '#FFE5B0' }
];

// Bright stars with real positions (right ascension and declination)
const BRIGHT_STARS = [
  { name: 'Sirius', ra: 101.2876, dec: -16.7161, mag: -1.46, color: '#A3E3FF' },
  { name: 'Vega', ra: 279.2347, dec: 38.7837, mag: 0.03, color: '#FFFFFF' },
  { name: 'Arcturus', ra: 213.9154, dec: 19.1824, mag: -0.05, color: '#FFA500' },
  { name: 'Capella', ra: 79.1723, dec: 45.9981, mag: 0.08, color: '#FFE5B0' },
  { name: 'Rigel', ra: 78.6345, dec: -8.2016, mag: 0.13, color: '#B3E1FF' },
  { name: 'Procyon', ra: 114.8257, dec: 5.2250, mag: 0.34, color: '#FFF5E6' },
  { name: 'Betelgeuse', ra: 88.7929, dec: 7.4070, mag: 0.42, color: '#FF7B4A' },
  { name: 'Aldebaran', ra: 68.9801, dec: 16.5093, mag: 0.85, color: '#FF8F00' },
  { name: 'Antares', ra: 247.3519, dec: -26.4317, mag: 1.09, color: '#FF4500' },
  { name: 'Pollux', ra: 116.3289, dec: 28.0262, mag: 1.14, color: '#FFE5CC' }
];

// Generate dimmer background stars
const BACKGROUND_STARS = [...Array(100)].map(() => ({ // Reduced number of background stars
  x: Math.random() * 800,
  y: Math.random() * 400,
  size: Math.random() * 0.8,
  opacity: Math.random() * 0.3 + 0.1,
  color: ['#FFFFFF', '#FFE5CC', '#B3E1FF'][Math.floor(Math.random() * 3)]
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
    
    // Project altitude and azimuth to x,y using improved projection
    const r = (90 - altitude) * 4; // Distance from center
    const x = 400 + (Math.sin(adjustedAz * Math.PI / 180) * r);
    const y = 400 - (Math.cos(adjustedAz * Math.PI / 180) * r * 0.8); // Slight vertical compression
    
    return { x, y };
  };

  // Calculate object size based on magnitude with improved scaling
  const getVisualSize = (magnitude, baseSize) => {
    // Brighter objects appear larger, with more dramatic scaling
    const scaleFactor = Math.max(1, 2.5 ** (-magnitude / 2));
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
        {/* Enhanced background gradients and effects */}
        <defs>
          <linearGradient id="skyGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#000B1F" />
            <stop offset="50%" stopColor="#041529" />
            <stop offset="100%" stopColor="#082444" />
          </linearGradient>
          <radialGradient id="moonGlow">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>
          <filter id="starBlur">
            <feGaussianBlur stdDeviation="0.3" />
          </filter>
          <filter id="starGlow">
            {/* Reduced blur effect complexity */}
            <feGaussianBlur stdDeviation="0.5" />
          </filter>
          {/* Simplified Jupiter bands effect */}
          <filter id="jupiterBands">
            <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="1" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0
                      0 0 0 0 0
                      0 0 0 0 0
                      0 0 0 0.2 0"
            />
          </filter>
          <filter id="saturnRings">
            <feGaussianBlur stdDeviation="0.5" />
          </filter>
        </defs>
        
        {/* Sky background with enhanced gradient */}
        <rect width="800" height="500" fill="url(#skyGradient)" />
        
        {/* Horizon line with gradient */}
        <line x1="0" y1="400" x2="800" y2="400" 
          stroke="url(#skyGradient)" strokeWidth="4" />
        
        {/* Altitude lines every 15° with improved styling */}
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
              opacity={0.5}
            />
            <text
              x="410"
              y={400 - altitude * 4}
              textAnchor="start"
              fill="#2C446E"
              fontSize="10"
              opacity="0.7"
            >
              {altitude}°
            </text>
          </g>
        ))}
        
        {/* Azimuth lines every 30° with improved styling */}
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
              opacity="0.5"
            />
          );
        })}

        {/* Direction labels with improved styling */}
        <text x="400" y="420" textAnchor="middle" fill="#4A5568" fontSize="14" fontWeight="bold">
          {direction}
        </text>
        <text x="400" y="440" textAnchor="middle" fill="#2C446E" fontSize="12">
          Horizon
        </text>
        
        {/* Background stars with color variation */}
        {BACKGROUND_STARS.map((star, i) => (
          <circle
            key={i}
            cx={star.x}
            cy={star.y}
            r={star.size}
            fill={star.color}
            opacity={star.opacity}
            filter="url(#starBlur)"
          />
        ))}

        {/* Bright stars with real positions */}
        {BRIGHT_STARS.map((star, i) => {
          const pos = projectToSky(
            Astronomy.Horizon(
              time,
              observer,
              star.ra,
              star.dec,
              'normal'
            ).altitude,
            Astronomy.Horizon(
              time,
              observer,
              star.ra,
              star.dec,
              'normal'
            ).azimuth
          );
          if (!pos) return null;
          
          const visualSize = getVisualSize(star.mag, 0.15);
          return (
            <g key={`bright-star-${i}`}>
              <circle
                cx={pos.x}
                cy={pos.y}
                r={visualSize * 3}
                fill={star.color}
                opacity="0.2"
                filter="url(#starGlow)"
              />
              <circle
                cx={pos.x}
                cy={pos.y}
                r={visualSize}
                fill={star.color}
                filter="url(#starBlur)"
              />
              <text
                x={pos.x}
                y={pos.y + 12}
                textAnchor="middle"
                fill="#9CA3AF"
                fontSize="10"
                opacity="0.6"
              >
                {star.name}
              </text>
            </g>
          );
        })}

        {/* Celestial Objects with enhanced rendering */}
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
              r={visualSize * 3} // Reduced glow radius
              fill="url(#moonGlow)"
              opacity="0.2" // Reduced opacity
                    />
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={visualSize * 3}
                      fill="url(#moonGlow)"
                      opacity="0.5"
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
                          rx={visualSize * 2.5} 
                          ry={visualSize * 0.7} 
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
                          r={visualSize * 2}
                          fill="#FFDEB0"
                        />
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r={visualSize * 2}
                          fill="url(#jupiterBands)"
                          opacity="0.4"
                        />
                      </g>
                    ) : obj.name === 'Mars' ? (
                      <>
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r={visualSize * 1.5}
                          fill="#FF6B4A"
                          opacity="0.2"
                          filter="url(#starGlow)"
                        />
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r={visualSize}
                          fill="#FF6B4A"
                        />
                      </>
                    ) : (
                      <>
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r={visualSize * 2}
                          fill={PLANETS.find(p => p.name === obj.name)?.color || '#FFA500'}
                          opacity="0.2"
                          filter="url(#starGlow)"
                        />
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r={visualSize}
                          fill={PLANETS.find(p => p.name === obj.name)?.color || '#FFA500'}
                        />
                      </>
                    )}
                  </>
                )}
                
                {/* Enhanced object labels */}
                <text
                  x={pos.x}
                  y={pos.y + visualSize + 12}
                  textAnchor="middle"
                  fill="#9CA3AF"
                  fontSize="12"
                  className="select-none"
                >
                  {obj.name}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Enhanced legend with improved styling */}
      <div className="absolute bottom-4 left-4 bg-gray-900/50 p-2 rounded-lg text-sm text-gray-300 space-y-1">
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

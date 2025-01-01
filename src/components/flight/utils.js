// Altitude bands in feet and their corresponding colors
export const ALTITUDE_BANDS = [
  { 
    max: 1000, 
    color: '#00ff00', 
    label: '0-1,000 ft',
    description: 'Ground level - Takeoff and landing'
  },
  { 
    max: 10000, 
    color: '#80ff00', 
    label: '1,000-10,000 ft',
    description: 'Low altitude - Initial climb and approach'
  },
  { 
    max: 20000, 
    color: '#ffff00', 
    label: '10,000-20,000 ft',
    description: 'Medium altitude - Regional flights'
  },
  { 
    max: 30000, 
    color: '#ff8000', 
    label: '20,000-30,000 ft',
    description: 'High altitude - Short/medium-haul flights'
  },
  { 
    max: Infinity, 
    color: '#ff0000', 
    label: '30,000+ ft',
    description: 'Very high altitude - Long-haul flights'
  }
];

// Convert meters to feet
export const metersToFeet = (meters) => meters * 3.28084;

// Get color based on altitude
export const getAltitudeColor = (altitudeMeters) => {
  const altitudeFeet = metersToFeet(altitudeMeters);
  const band = ALTITUDE_BANDS.find(band => altitudeFeet <= band.max);
  return band ? band.color : ALTITUDE_BANDS[0].color;
};

// Create SVG icon for aircraft
export const createAircraftIcon = (color, size = 24) => {
  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path fill="${color}" d="M12 2l-1 5h-3l-1-2h-2l1 3h-3v2l5 2 1 5h2l1-5 5-2v-2h-3l1-3h-2l-1 2h-3z"/>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

// Format altitude for display
export const formatAltitude = (meters) => {
  const feet = metersToFeet(meters);
  return `${Math.round(feet).toLocaleString()} ft`;
};

// Format velocity for display
export const formatVelocity = (ms) => {
  const knots = ms * 1.94384;
  return `${Math.round(knots)} kts`;
};

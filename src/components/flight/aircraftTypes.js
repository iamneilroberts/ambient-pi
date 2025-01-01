// Aircraft categories and their corresponding icons
export const AIRCRAFT_CATEGORIES = {
  AIRLINER: {
    name: 'Commercial Airliner',
    icon: `
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2l-1 5h-3l-1-2h-2l1 3h-3v2l5 2 1 5h2l1-5 5-2v-2h-3l1-3h-2l-1 2h-3z"/>
      </svg>
    `
  },
  MILITARY: {
    name: 'Military Aircraft',
    icon: `
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M15,6.5l-3,0l-1-2l-2,0l1,2l-3,0l-1-2l-2,0l1,2l-2,0l0,2l10,4l0,4l2,0l0-4l3-1l0-2l-2,0z"/>
      </svg>
    `
  },
  HELICOPTER: {
    name: 'Helicopter',
    icon: `
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12,3c-1.1,0-2,0.9-2,2v4H6v2h4v2H6v2h4v4c0,1.1,0.9,2,2,2s2-0.9,2-2v-4h4v-2h-4v-2h4V9h-4V5C14,3.9,13.1,3,12,3z"/>
        <rect x="10" y="2" width="4" height="1"/>
      </svg>
    `
  },
  SMALL: {
    name: 'Small Aircraft',
    icon: `
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12,4L9,7L6,7L4,5L2,5L3,8L0,8L0,10L5,12L6,17L8,17L9,12L12,12L15,12L16,17L18,17L19,12L24,10L24,8L21,8L22,5L20,5L18,7L15,7z"/>
      </svg>
    `
  }
};

// Common ICAO type codes for different aircraft categories
const TYPE_PATTERNS = {
  AIRLINER: [
    /^A(?:30|31|32|33|34|35|38)\d/,  // Airbus
    /^B7[3-8]\d/,                     // Boeing
    /^B7[4-8][7-9]/,                  // Boeing
    /^E1[79]\d/,                      // Embraer
    /^CRJ/,                           // Bombardier CRJ
    /^DH8/,                           // Dash 8
  ],
  MILITARY: [
    /^F-\d/,                          // Fighter aircraft
    /^C-\d/,                          // Military cargo
    /^E-\d/,                          // Military electronics
    /^KC-/,                           // Tanker
    /^P-[38]/,                        // Patrol aircraft
  ],
  HELICOPTER: [
    /^EC\d/,                          // Eurocopter
    /^R\d{2}/,                        // Robinson
    /^S[36]\d/,                       // Sikorsky
    /^B\d{3}/,                        // Bell
  ],
  SMALL: [
    /^C1\d{2}/,                       // Cessna
    /^P[A-Z]\d{2}/,                   // Piper
    /^BE\d{2}/,                       // Beechcraft
  ]
};

// Registration prefixes for military aircraft
const MILITARY_PREFIXES = [
  'AF', // Air Force
  'AFDW', // Air Force District of Washington
  'AFRC', // Air Force Reserve Command
  'ANG', // Air National Guard
  'ARMY',
  'NAVY',
  'USAF',
  'USN',
  'USCG',
  'MAR', // Marines
];

export const getAircraftCategory = (aircraft) => {
  // Check registration for military aircraft
  if (MILITARY_PREFIXES.some(prefix => 
    aircraft.registration?.startsWith(prefix) || 
    aircraft.operator?.toUpperCase().includes(prefix)
  )) {
    return AIRCRAFT_CATEGORIES.MILITARY;
  }

  // Check ICAO type code patterns
  const typeCode = aircraft.model?.split(' ')[0];
  if (typeCode) {
    for (const [category, patterns] of Object.entries(TYPE_PATTERNS)) {
      if (patterns.some(pattern => pattern.test(typeCode))) {
        return AIRCRAFT_CATEGORIES[category];
      }
    }
  }

  // Default to airliner if we can't determine the type
  return AIRCRAFT_CATEGORIES.AIRLINER;
};

export const createAircraftIcon = (category, color, size = 24) => {
  const svg = category.icon
    .replace('viewBox="0 0 24 24"', `width="${size}" height="${size}" viewBox="0 0 24 24"`)
    .replace('<path', `<path fill="${color}"`);
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

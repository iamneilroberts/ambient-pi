import axios from 'axios';
import { config as baseConfig } from '../../config/config.js';
import { config as displayConfig } from '../../config/display-config.js';

export const fetchFlightHealth = async () => {
  try {
    const response = await axios.get('/api/flight/health');
    return response.data;
  } catch (error) {
    return {
      status: 'error',
      details: {
        error: error.message,
        lastUpdate: new Date().toISOString()
      }
    };
  }
};

const flightConfig = displayConfig.rotation.displays.find(d => d.id === 'flight');
const { lat, lon } = baseConfig.location;

export const fetchNearbyAircraft = async (latitude = lat, longitude = lon, radius = flightConfig?.radius || 250) => {
  try {
    // Convert radius from km to degrees (rough approximation)
    const degreeRadius = radius / 111; // 111km per degree
    
    const response = await axios.get('/api/flight/aircraft', {
      params: {
        lamin: lat - degreeRadius,
        lamax: lat + degreeRadius,
        lomin: lon - degreeRadius,
        lomax: lon + degreeRadius,
      }
    });

    return response.data;
  } catch (error) {
    return [];
  }
};

// Placeholder for future local ADS-B integration
export const fetchLocalADSB = async () => {
  return {
    enabled: false,
    message: 'Local ADS-B integration not yet implemented'
  };
};

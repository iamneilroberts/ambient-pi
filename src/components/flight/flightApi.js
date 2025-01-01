import axios from 'axios';
import { config as baseConfig } from '../../config/config.js';
import { config as displayConfig } from '../../config/display-config.js';

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
    console.error('Error fetching aircraft data:', error);
    return [];
  }
};

// Placeholder for future local ADS-B integration
export const fetchLocalADSB = async () => {
  // TODO: Implement local ADS-B data fetching
  return {
    enabled: false,
    message: 'Local ADS-B integration not yet implemented'
  };
};
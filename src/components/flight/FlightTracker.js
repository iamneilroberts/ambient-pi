import React, { useEffect, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import LeafletMap from './LeafletMap';
import { fetchNearbyAircraft, fetchLocalADSB } from './flightApi';
import { config } from '../../config/display-config';

const FlightTracker = () => {
  const [aircraft, setAircraft] = useState([]);
  const [localADSB, setLocalADSB] = useState({ enabled: false, message: '' });
  const [center] = useState(() => {
    const flightConfig = config.rotation.displays.find(d => d.id === 'flight');
    return [flightConfig?.center?.lat || config.location.lat, flightConfig?.center?.lon || config.location.lon];
  });
  const [loading, setLoading] = useState(true);

  const fetchDataRef = React.useCallback(async () => {
    setLoading(true);
    try {
      const [aircraftData, adsbStatus] = await Promise.all([
        fetchNearbyAircraft(center[0], center[1], config.rotation.displays.find(d => d.id === 'flight')?.radius || 250),
        fetchLocalADSB()
      ]);
      
      setAircraft(aircraftData);
      setLocalADSB(adsbStatus);
    } catch (error) {
      console.error('Error fetching flight data:', error);
    }
    setLoading(false);
  }, [center]);

  useEffect(() => {
    fetchDataRef();
    const interval = setInterval(fetchDataRef, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchDataRef]);

  return (
    <div className="w-full h-full bg-gray-900 p-4 rounded-lg shadow-lg">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-100">Flight Tracker</h2>
        <div className="flex items-center">
          <span className="text-sm text-gray-300 mr-2">
            {loading ? 'Updating...' : `${aircraft.length} aircraft`}
          </span>
          {!localADSB.enabled && (
            <span className="text-xs text-gray-400">{localADSB.message}</span>
          )}
        </div>
      </div>
      
      <div className="h-[500px] rounded-lg overflow-hidden">
        {typeof window !== 'undefined' && (
          <LeafletMap
            center={center}
            aircraft={aircraft}
          />
        )}
      </div>
    </div>
  );
};

export default FlightTracker;

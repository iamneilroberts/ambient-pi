import React, { useEffect, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import LeafletMap from './LeafletMap';
import { fetchNearbyAircraft, fetchLocalADSB, fetchFlightHealth } from './flightApi';
import { config } from '../../config/display-config';

const FlightTracker = () => {
  const [aircraft, setAircraft] = useState([]);
  const [localADSB, setLocalADSB] = useState({ enabled: false, message: '' });
  const [health, setHealth] = useState(null);
  const [center] = useState(() => {
    const flightConfig = config.rotation.displays.find(d => d.id === 'flight');
    return [flightConfig?.center?.lat || config.location.lat, flightConfig?.center?.lon || config.location.lon];
  });
  const [loading, setLoading] = useState(true);

  const fetchDataRef = React.useCallback(async () => {
    setLoading(true);
    try {
      // First check health status
      const healthStatus = await fetchFlightHealth();
      setHealth(healthStatus);

      // If rate limited, don't try to fetch aircraft
      if (healthStatus.status === 'rate-limited') {
        setLoading(false);
        return;
      }

      const [aircraftData, adsbStatus] = await Promise.all([
        fetchNearbyAircraft(center[0], center[1], config.rotation.displays.find(d => d.id === 'flight')?.radius || 250),
        fetchLocalADSB()
      ]);
      
      setAircraft(aircraftData);
      setLocalADSB(adsbStatus);
    } catch (error) {
      // Error state is handled by UI
    }
    setLoading(false);
  }, [center]);

  useEffect(() => {
    fetchDataRef();
    
    // Adjust refresh interval based on rate limit status
    const getRefreshInterval = () => {
      if (health?.status === 'rate-limited') {
        // If rate limited, wait until reset time
        const resetTime = new Date(health.details.rateLimit.reset).getTime();
        const now = Date.now();
        return Math.max(5000, resetTime - now); // At least 5 seconds
      }
      return 30000; // Default 30 seconds
    };

    const interval = setInterval(fetchDataRef, getRefreshInterval());
    return () => clearInterval(interval);
  }, [fetchDataRef, health]);

  const getStatusMessage = () => {
    if (loading) return 'Updating...';
    if (health?.status === 'rate-limited') {
      const resetTime = new Date(health.details.rateLimit.reset);
      return `Rate limited - Next update ${resetTime.toLocaleTimeString()}`;
    }
    if (health?.details?.dataSource === 'cache') {
      return `${aircraft.length} aircraft (cached)`;
    }
    return `${aircraft.length} aircraft`;
  };

  return (
    <div className="w-full h-full bg-gray-900 p-3 md:p-4 rounded-lg shadow-lg">
      <div className="mb-3 md:mb-4 flex flex-col md:flex-row justify-between md:items-center gap-2 md:gap-0">
        <h2 className="text-lg md:text-xl font-bold text-gray-100">Flight Tracker</h2>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`text-xs md:text-sm ${health?.status === 'rate-limited' ? 'text-yellow-300' : 'text-gray-300'}`}>
            {getStatusMessage()}
          </span>
          {!localADSB.enabled && (
            <span className="text-xs text-gray-400 break-words">{localADSB.message}</span>
          )}
        </div>
      </div>
      
      <div className="h-[300px] md:h-[500px] rounded-lg overflow-hidden">
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

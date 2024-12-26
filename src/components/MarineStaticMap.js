import React, { useState, useEffect, useCallback } from 'react';
import { Ship, Radio, Calendar, AlertCircle } from 'lucide-react';

const MarineStaticMap = () => {
  const [lastUpdate, setLastUpdate] = useState(null);
  const [aisStatus, setAisStatus] = useState('disconnected');
  const [vessels, setVessels] = useState([]);
  const [portSchedule, setPortSchedule] = useState({
    mobile: [],
    gulfport: []
  });
  const [error, setError] = useState(null);

  // Connect to local RTL-SDR AIS receiver
  const connectToAIS = useCallback(() => {
    try {
      const ws = new WebSocket('ws://localhost:8101'); // Default rtl_ais port

      ws.onopen = () => {
        console.log('Connected to RTL-SDR AIS receiver');
        setAisStatus('connected');
      };

      ws.onmessage = (event) => {
        try {
          const aisData = JSON.parse(event.data);
          updateVesselData(aisData);
        } catch (err) {
          console.error('Error parsing AIS data:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('AIS WebSocket error:', error);
        setAisStatus('error');
      };

      ws.onclose = () => {
        console.log('AIS connection closed');
        setAisStatus('disconnected');
        // Try to reconnect after 5 seconds
        setTimeout(connectToAIS, 5000);
      };

      return () => ws.close();
    } catch (err) {
      console.error('Failed to connect to AIS receiver:', err);
      setAisStatus('error');
    }
  }, []);

  // Update vessel data from AIS message
  const updateVesselData = (aisData) => {
    setVessels(current => {
      const vesselIndex = current.findIndex(v => v.mmsi === aisData.mmsi);
      const updatedVessel = {
        mmsi: aisData.mmsi,
        name: aisData.shipname || 'Unknown Vessel',
        type: aisData.shiptype || 'Unknown Type',
        position: {
          lat: aisData.lat,
          lon: aisData.lon
        },
        course: aisData.course,
        speed: aisData.speed,
        destination: aisData.destination,
        lastUpdate: new Date()
      };

      if (vesselIndex >= 0) {
        const newVessels = [...current];
        newVessels[vesselIndex] = updatedVessel;
        return newVessels;
      }
      return [...current, updatedVessel];
    });
    setLastUpdate(new Date());
  };

  // Fetch port schedules
  const fetchPortSchedules = async () => {
    try {
      // Normally you'd fetch this from port authority APIs
      // This is example data for demonstration
      setPortSchedule({
        mobile: [
          {
            vessel: 'MOBILE TRADER',
            arrival: '2024-12-24 08:00',
            departure: '2024-12-24 20:00',
            berth: 'North Terminal',
            type: 'Container'
          },
          {
            vessel: 'GULF STAR',
            arrival: '2024-12-24 14:30',
            departure: '2024-12-25 06:00',
            berth: 'South Terminal',
            type: 'Bulk Carrier'
          }
        ],
        gulfport: [
          {
            vessel: 'GULFPORT EXPRESS',
            arrival: '2024-12-24 10:00',
            departure: '2024-12-24 22:00',
            berth: 'West Terminal',
            type: 'Container'
          }
        ]
      });
    } catch (err) {
      console.error('Error fetching port schedules:', err);
      setError('Failed to fetch port schedules');
    }
  };

  // Format date for schedule display
  const formatScheduleTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  useEffect(() => {
    // Load Leaflet
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.js';
    
    script.onload = () => {
      // Initialize map
      const map = window.L.map('marine-map').setView([30.6, -88.0], 10);

      // Add base layers
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      window.L.tileLayer('https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png', {
        attribution: '© OpenSeaMap contributors'
      }).addTo(map);

      // Add port markers
      const ports = [
        { 
          name: 'Port of Mobile',
          pos: [30.7, -88.04],
          info: 'Major deep-water port in Mobile, Alabama'
        },
        { 
          name: 'Port of Gulfport',
          pos: [30.36, -89.09],
          info: 'Major seaport in Gulfport, Mississippi'
        }
      ];

      ports.forEach(port => {
        window.L.marker(port.pos)
          .bindPopup(`<strong>${port.name}</strong><br>${port.info}`)
          .addTo(map);
      });

      // Add vessel markers layer
      const vesselsLayer = window.L.layerGroup().addTo(map);

      // Update vessel markers
      const updateMarkers = () => {
        vesselsLayer.clearLayers();
        vessels.forEach(vessel => {
          if (vessel.position) {
            const marker = window.L.marker([vessel.position.lat, vessel.position.lon], {
              icon: window.L.divIcon({
                className: 'vessel-marker',
                html: `<div class="w-3 h-3 bg-blue-500 rounded-full transform rotate-${vessel.course || 0}"></div>`,
                iconSize: [12, 12]
              })
            }).bindPopup(`
              <strong>${vessel.name}</strong><br>
              Type: ${vessel.type}<br>
              Speed: ${vessel.speed} knots<br>
              Destination: ${vessel.destination || 'Unknown'}<br>
              Last Update: ${vessel.lastUpdate.toLocaleTimeString()}
            `);
            marker.addTo(vesselsLayer);
          }
        });
      };

      // Update markers every second
      const markerInterval = setInterval(updateMarkers, 1000);

      // Clean up
      return () => {
        clearInterval(markerInterval);
        map.remove();
        document.head.removeChild(link);
      };
    };

    document.head.appendChild(script);

    // Connect to AIS receiver
    connectToAIS();

    // Fetch initial port schedules
    fetchPortSchedules();
    
    // Update port schedules every hour
    const scheduleInterval = setInterval(fetchPortSchedules, 3600000);

    return () => {
      clearInterval(scheduleInterval);
    };
  }, [connectToAIS]);

  return (
    <div className="bg-gray-800 p-6 rounded-lg flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Ship className="w-6 h-6" />
          <h2 className="text-xl font-bold">Gulf Coast Ports</h2>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Radio className="w-4 h-4" />
            <span className="text-sm">
              AIS: <span className={`${
                aisStatus === 'connected' ? 'text-green-400' : 'text-red-400'
              }`}>
                {aisStatus}
              </span>
            </span>
          </div>
          {lastUpdate && (
            <div className="text-sm text-gray-400">
              Last update: {lastUpdate.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-900/50 p-4 rounded-lg mb-4 flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-red-200">{error}</span>
        </div>
      )}

      {/* Main content grid */}
      <div className="flex-grow grid grid-cols-4 gap-4">
        {/* Map */}
        <div className="col-span-3 relative rounded-lg overflow-hidden">
          <div id="marine-map" className="absolute inset-0" />
        </div>

        {/* Port Schedules */}
        <div className="space-y-4 overflow-auto">
          {/* Mobile Schedule */}
          <div className="bg-gray-700/50 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-3">
              <Calendar className="w-4 h-4" />
              <h3 className="font-bold">Mobile Port Schedule</h3>
            </div>
            <div className="space-y-2">
              {portSchedule.mobile.map((vessel, index) => (
                <div key={index} className="bg-gray-600/50 p-2 rounded text-sm">
                  <div className="font-bold">{vessel.vessel}</div>
                  <div>Arrival: {formatScheduleTime(vessel.arrival)}</div>
                  <div>Departure: {formatScheduleTime(vessel.departure)}</div>
                  <div className="text-gray-300">{vessel.berth}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Gulfport Schedule */}
          <div className="bg-gray-700/50 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-3">
              <Calendar className="w-4 h-4" />
              <h3 className="font-bold">Gulfport Schedule</h3>
            </div>
            <div className="space-y-2">
              {portSchedule.gulfport.map((vessel, index) => (
                <div key={index} className="bg-gray-600/50 p-2 rounded text-sm">
                  <div className="font-bold">{vessel.vessel}</div>
                  <div>Arrival: {formatScheduleTime(vessel.arrival)}</div>
                  <div>Departure: {formatScheduleTime(vessel.departure)}</div>
                  <div className="text-gray-300">{vessel.berth}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Vessels */}
          <div className="bg-gray-700/50 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-3">
              <Ship className="w-4 h-4" />
              <h3 className="font-bold">Active Vessels</h3>
            </div>
            <div className="text-2xl font-bold">{vessels.length}</div>
            <div className="text-sm text-gray-300">vessels in range</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarineStaticMap;

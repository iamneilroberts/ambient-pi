import React, { useState, useEffect } from 'react';
import { Plane, Anchor, Train, Layers, RadioTower } from 'lucide-react';
import { config } from '../../config.mjs';

const TransportTracker = () => {
  const [transportData, setTransportData] = useState({
    aircraft: {
      nearby: [
        { 
          icao: "A12345",
          callsign: "DAL123",
          altitude: "32000",
          speed: "460",
          heading: "125",
          type: "B738",
          origin: "ATL",
          destination: "MSY"
        }
      ],
      count: 15,
      dataSource: "Public ADSB"
      // TODO: Add local SDR integration
      // sdrSource: null
    },
    ships: {
      nearby: [
        {
          mmsi: "366990123",
          name: "CARGO VESSEL",
          type: "Cargo",
          length: "200",
          heading: "180",
          speed: "12",
          destination: "MOBILE"
        }
      ],
      inPort: 5,
      expected: 3,
      dataSource: "AIS API"
      // TODO: Add local AIS receiver integration
      // aisReceiver: null
    },
    trains: {
      nearby: [
        {
          id: "CSX123",
          type: "Freight",
          speed: "45",
          direction: "South",
          destination: "Mobile",
          length: "85 cars"
        }
      ],
      dataSource: "Railroad.earth API"
      // TODO: Add ATCS monitor integration
      // atcsSource: null
    }
  });

  // TODO: Future enhancement - Combined map view
  const [mapView, setMapView] = useState('separate'); // or 'combined'
  const [activeLayers, setActiveLayers] = useState({
    aircraft: true,
    ships: true,
    trains: true,
    space: false  // Future: ISS/Starlink tracking integration
  });

  useEffect(() => {
    const fetchTransportData = async () => {
      try {
        // Aircraft data from public API
        // const adsbResponse = await fetch(`https://public-api.adsbexchange.com/api/aircraft/json/lat/${config.location.lat}/lon/${config.location.lon}/dist/25/`);
        
        // Ship data from Marine Traffic
        // const shipResponse = await fetch(`https://api.marinetraffic.com/navigator/v1/vessels?api_key=${config.apis.marine.marineTraffic}`);
        
        // Train data
        // const trainResponse = await fetch(`https://api.railroad.earth/v1/trains?lat=${config.location.lat}&lon=${config.location.lon}`);
        
      } catch (error) {
        console.error('Error fetching transport data:', error);
      }
    };

    fetchTransportData();
    const interval = setInterval(fetchTransportData, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Transport Tracker</h1>
        <div className="flex items-center space-x-4">
          <div className="text-xl">{config.location.city}, {config.location.state}</div>
          {/* Future combined view toggle */}
          <button 
            className="bg-gray-800 px-3 py-1 rounded-lg flex items-center space-x-2"
            onClick={() => setMapView(prev => prev === 'separate' ? 'combined' : 'separate')}
          >
            <Layers className="w-4 h-4" />
            <span>{mapView === 'separate' ? 'Separate' : 'Combined'} View</span>
          </button>
        </div>
      </div>

      {/* SDR Status Bar */}
      <div className="bg-gray-800 p-4 rounded-lg flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <RadioTower className="w-6 h-6" />
          <span className="font-bold">SDR Receivers</span>
        </div>
        <div className="flex space-x-6">
          <div>ADSB: <span className="text-red-400">Not Connected</span></div>
          <div>AIS: <span className="text-red-400">Not Connected</span></div>
          <div>ATCS: <span className="text-red-400">Not Connected</span></div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-3 gap-6 flex-grow">
        {/* Aircraft Section */}
        <div className="bg-gray-800 p-6 rounded-lg flex flex-col">
          <div className="flex items-center space-x-3 mb-4">
            <Plane className="w-6 h-6" />
            <h2 className="text-xl font-bold">Aircraft</h2>
            <span className="ml-auto text-sm text-gray-400">{transportData.aircraft.count} tracked</span>
          </div>
          <div className="relative flex-grow bg-black rounded-lg overflow-hidden">
            <img 
              src="/api/placeholder/400/300" 
              alt="Aircraft Map"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute bottom-4 right-4 bg-black/50 px-3 py-1 rounded text-sm">
              Source: {transportData.aircraft.dataSource}
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {transportData.aircraft.nearby.map((aircraft, index) => (
              <div key={index} className="bg-gray-700/50 p-3 rounded-lg">
                <div className="font-bold">{aircraft.callsign}</div>
                <div className="text-sm text-gray-400">
                  {aircraft.type} • {aircraft.altitude}ft • {aircraft.speed}kts
                  <br />
                  {aircraft.origin} → {aircraft.destination}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ships Section */}
        <div className="bg-gray-800 p-6 rounded-lg flex flex-col">
          <div className="flex items-center space-x-3 mb-4">
            <Anchor className="w-6 h-6" />
            <h2 className="text-xl font-bold">Marine Traffic</h2>
            <span className="ml-auto text-sm text-gray-400">{transportData.ships.inPort} in port</span>
          </div>
          <div className="relative flex-grow bg-black rounded-lg overflow-hidden">
            <img 
              src="/api/placeholder/400/300" 
              alt="Marine Traffic Map"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute bottom-4 right-4 bg-black/50 px-3 py-1 rounded text-sm">
              Source: {transportData.ships.dataSource}
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {transportData.ships.nearby.map((ship, index) => (
              <div key={index} className="bg-gray-700/50 p-3 rounded-lg">
                <div className="font-bold">{ship.name}</div>
                <div className="text-sm text-gray-400">
                  {ship.type} • {ship.length}m • {ship.speed}kts
                  <br />
                  Destination: {ship.destination}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trains Section */}
        <div className="bg-gray-800 p-6 rounded-lg flex flex-col">
          <div className="flex items-center space-x-3 mb-4">
            <Train className="w-6 h-6" />
            <h2 className="text-xl font-bold">Railroad Traffic</h2>
          </div>
          <div className="relative flex-grow bg-black rounded-lg overflow-hidden">
            <img 
              src="/api/placeholder/400/300" 
              alt="Railroad Map"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute bottom-4 right-4 bg-black/50 px-3 py-1 rounded text-sm">
              Source: {transportData.trains.dataSource}
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {transportData.trains.nearby.map((train, index) => (
              <div key={index} className="bg-gray-700/50 p-3 rounded-lg">
                <div className="font-bold">{train.id}</div>
                <div className="text-sm text-gray-400">
                  {train.type} • {train.speed}mph • {train.length}
                  <br />
                  {train.direction} bound to {train.destination}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TODO: Future Combined View */}
      {/* 
      Planned features:
      - Single OpenStreetMap base layer
      - Toggleable transport layers
      - Common controls (zoom, pan, etc.)
      - Unified data display
      - Layer-specific filters
      - Integration with space tracking (ISS/Starlink paths)
      */}
    </div>
  );
};

export default TransportTracker;

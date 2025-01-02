import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import './flight.css';
import { ALTITUDE_BANDS, getAltitudeColor } from './utils';
import { AIRCRAFT_CATEGORIES, getAircraftCategory, createAircraftIcon } from './aircraftTypes';
import AircraftCard from './AircraftCard';

const LeafletMap = ({ center, aircraft }) => {
  const [showPaths, setShowPaths] = useState(true);
  const [showInfo, setShowInfo] = useState(true);
  const [selectedAircraft, setSelectedAircraft] = useState(null);
  const [flightPaths, setFlightPaths] = useState({});
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const legendRef = useRef(null);

  // Initialize map and controls
  useEffect(() => {
    if (!mapInstanceRef.current && mapRef.current) {
      // Initialize map instance
      mapInstanceRef.current = L.map(mapRef.current).setView(center, 9);

      // Add dark tile layer
      L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
      }).addTo(mapInstanceRef.current);

      // Add legend
      const legend = L.control({ position: 'bottomright' });
      legend.onAdd = () => {
        const div = L.DomUtil.create('div', 'info legend bg-gray-800 text-gray-100 p-2 rounded shadow');
        div.innerHTML = `
          <div class="mb-4">
            <h4 class="font-bold mb-2">Altitude Bands</h4>
            ${ALTITUDE_BANDS.map(band => 
              `<div class="mb-2">
                <div class="flex items-center gap-2 mb-1">
                  <div class="w-4 h-4" style="background: ${band.color}"></div>
                  <span class="font-semibold">${band.label}</span>
                </div>
                <div class="text-xs text-gray-600 ml-6">${band.description}</div>
              </div>`
            ).join('')}
          </div>
          <div class="mb-4">
            <h4 class="font-bold mb-2">Aircraft Types</h4>
            <div class="legend-categories">
              ${Object.values(AIRCRAFT_CATEGORIES).map(category => 
                `<div class="mb-2">
                  <div class="flex items-center gap-2">
                    <img src="${createAircraftIcon(category, '#666')}" class="w-4 h-4" />
                    <span class="font-semibold">${category.name}</span>
                  </div>
                </div>`
              ).join('')}
            </div>
          </div>
        `;
        legendRef.current = div;
        return div;
      };
      legend.addTo(mapInstanceRef.current);

      // Add info toggle control
      const infoToggle = L.control({ position: 'topright' });
      infoToggle.onAdd = () => {
        const div = L.DomUtil.create('div', 'leaflet-bar');
        const button = L.DomUtil.create('a', '', div);
        button.innerHTML = '📋';
        button.title = 'Toggle Info Cards';
        button.href = '#';
        button.onclick = (e) => {
          e.preventDefault();
          setShowInfo(prev => !prev);
        };
        return div;
      };
      infoToggle.addTo(mapInstanceRef.current);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [center]);

  // Add path toggle control
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const pathToggle = L.control({ position: 'topright' });
    pathToggle.onAdd = () => {
      const div = L.DomUtil.create('div', 'leaflet-bar');
      const button = L.DomUtil.create('a', '', div);
      button.innerHTML = showPaths ? '🛫' : '✈️';
      button.title = showPaths ? 'Hide Flight Paths' : 'Show Flight Paths';
      button.href = '#';
      button.onclick = (e) => {
        e.preventDefault();
        setShowPaths(prev => !prev);
      };
      return div;
    };
    pathToggle.addTo(mapInstanceRef.current);

    return () => {
      if (mapInstanceRef.current) {
        pathToggle.remove();
      }
    };
  }, [showPaths]);

  // Update aircraft markers and paths
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    mapInstanceRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        mapInstanceRef.current.removeLayer(layer);
      }
    });

    // Update flight paths
    const newFlightPaths = { ...flightPaths };
    aircraft.forEach((plane) => {
      if (!newFlightPaths[plane.icao24]) {
        newFlightPaths[plane.icao24] = [];
      }
      newFlightPaths[plane.icao24].push([plane.latitude, plane.longitude]);
      // Keep only last 10 positions
      if (newFlightPaths[plane.icao24].length > 10) {
        newFlightPaths[plane.icao24].shift();
      }
    });
    setFlightPaths(newFlightPaths);

    // Add new markers and paths
    aircraft.forEach((plane) => {
      const color = getAltitudeColor(plane.altitude);
      const category = getAircraftCategory(plane);
      
      // Create custom icon
      const icon = L.icon({
        iconUrl: createAircraftIcon(category, color),
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12],
        className: `rotate-${Math.round(plane.heading || 0)}`
      });

      // Add marker
      const marker = L.marker([plane.latitude, plane.longitude], {
        icon,
        rotationAngle: plane.heading
      }).addTo(mapInstanceRef.current);

      // Add click handler to select aircraft
      marker.on('click', () => {
        setSelectedAircraft(plane);
      });

      // Add path if enabled
      if (showPaths && newFlightPaths[plane.icao24]?.length > 1) {
        L.polyline(newFlightPaths[plane.icao24], {
          color,
          weight: 2,
          opacity: 0.6
        }).addTo(mapInstanceRef.current);
      }
    });
  }, [aircraft, showPaths, flightPaths]);

  return (
    <div className="fixed inset-0 w-screen h-screen flex flex-col md:flex-row">
      <div ref={mapRef} className="flex-grow h-full relative" />
      {showInfo && (
        <div className="w-full md:w-96 bg-gray-800/95 md:bg-gray-800 p-3 md:p-4 overflow-y-auto max-h-[50vh] md:max-h-full md:h-full">
          <div className="mb-3 md:mb-4">
            <h3 className="text-base md:text-lg font-bold mb-1 md:mb-2 text-gray-100">Aircraft Details</h3>
            <p className="text-xs md:text-sm text-gray-300">
              {aircraft.length} aircraft in range
            </p>
          </div>
          {selectedAircraft ? (
            <AircraftCard aircraft={selectedAircraft} />
          ) : (
            <p className="text-gray-400">Select an aircraft to view details</p>
          )}
          <div className="mt-3 md:mt-4">
            <h4 className="text-sm md:text-base font-bold mb-2 text-gray-100">All Aircraft</h4>
            <div className="space-y-1 md:space-y-2">
              {aircraft.map(plane => {
                const category = getAircraftCategory(plane);
                return (
                  <div
                    key={plane.icao24}
                    className={`p-1.5 md:p-2 rounded cursor-pointer hover:bg-gray-700 ${
                      selectedAircraft?.icao24 === plane.icao24 ? 'bg-gray-700' : ''
                    }`}
                    onClick={() => setSelectedAircraft(plane)}
                  >
                    <div className="flex items-center gap-2">
                      <img 
                        src={createAircraftIcon(category, getAltitudeColor(plane.altitude))} 
                        className={`w-4 h-4 rotate-${Math.round(plane.heading || 0)}`}
                        alt=""
                      />
                      <div>
                        <p className="font-semibold">{plane.callsign}</p>
                        <p className="text-sm text-gray-400">{plane.model || category.name}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeafletMap;

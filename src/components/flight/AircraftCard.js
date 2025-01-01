import React from 'react';
import { formatAltitude, formatVelocity } from './utils';

const AircraftCard = ({ aircraft }) => {
  const openExternalLink = (url, title) => {
    window.open(url, `aircraft_${aircraft.icao24}_${title}`, 'width=1200,height=800');
  };

  return (
    <div className="bg-gray-700 rounded-lg shadow-lg p-4 mb-2">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-bold text-gray-100">{aircraft.callsign}</h3>
        <div className="flex gap-2">
          <button
            onClick={() => openExternalLink(aircraft.flightAwareLink, 'flightaware')}
            className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
            title="View on FlightAware"
          >
            FlightAware
          </button>
          <button
            onClick={() => openExternalLink(aircraft.radarBoxLink, 'radarbox')}
            className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
            title="View on RadarBox"
          >
            RadarBox
          </button>
          <button
            onClick={() => openExternalLink(aircraft.flightRadarLink, 'fr24')}
            className="text-xs bg-orange-500 text-white px-2 py-1 rounded hover:bg-orange-600"
            title="View on FlightRadar24"
          >
            FR24
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-sm text-gray-200">
        <div>
          <p><span className="font-semibold">Registration:</span> {aircraft.registration}</p>
          <p><span className="font-semibold">Model:</span> {aircraft.model}</p>
          <p><span className="font-semibold">Operator:</span> {aircraft.operator}</p>
          <p><span className="font-semibold">Built:</span> {aircraft.built}</p>
        </div>
        <div>
          <p><span className="font-semibold">Altitude:</span> {formatAltitude(aircraft.altitude)}</p>
          <p><span className="font-semibold">Speed:</span> {formatVelocity(aircraft.velocity)}</p>
          <p><span className="font-semibold">Heading:</span> {Math.round(aircraft.heading)}°</p>
          <p><span className="font-semibold">Country:</span> {aircraft.country}</p>
        </div>
      </div>
    </div>
  );
};

export default AircraftCard;

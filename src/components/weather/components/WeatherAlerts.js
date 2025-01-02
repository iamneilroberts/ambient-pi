import React from 'react';
import { alertColors } from '../weatherUtils';

const WeatherAlerts = ({ alerts }) => {
  if (!alerts?.length) return null;

  const getAlertColor = (severity) => {
    if (severity === 'Extreme') return alertColors.Extreme;
    if (severity === 'Severe') return alertColors.Severe;
    return alertColors.default;
  };

  return (
    <div className="mb-4 space-y-3">
      {alerts.map((alert, index) => (
        <div 
          key={`${alert.event}-${index}`}
          className={`rounded-lg p-4 shadow-lg ${getAlertColor(alert.severity)}`}
        >
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-bold text-lg text-white">{alert.event}</h3>
              <p className="text-sm text-white/90">{alert.headline}</p>
            </div>
            <div className="text-xs text-white/75 bg-black/20 rounded px-2 py-1">
              Expires: {new Date(alert.expires).toLocaleString()}
            </div>
          </div>
          
          <div className="space-y-3 text-sm">
            <div className="text-white/90 bg-black/10 rounded-lg p-2">
              <strong>Areas Affected:</strong> {alert.areaDesc}
            </div>
            
            <div className="text-white/90 bg-black/10 rounded-lg p-2">
              <strong>Description:</strong>
              <p className="mt-1 whitespace-pre-wrap">{alert.description}</p>
            </div>
            
            {alert.instruction && (
              <div className="text-white/90 bg-black/10 rounded-lg p-2">
                <strong>Instructions:</strong>
                <p className="mt-1 whitespace-pre-wrap">{alert.instruction}</p>
              </div>
            )}
            
            <div className="flex gap-2 text-xs mt-3">
              <span className="px-3 py-1 rounded-full bg-black/20 text-white/90 font-medium">
                Severity: {alert.severity}
              </span>
              <span className="px-3 py-1 rounded-full bg-black/20 text-white/90 font-medium">
                Urgency: {alert.urgency}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default WeatherAlerts;

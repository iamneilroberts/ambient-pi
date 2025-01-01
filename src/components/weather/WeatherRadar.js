import React, { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const WeatherRadar = ({ radarStation, getRadarUrls }) => {
  const [showVelocity, setShowVelocity] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [radarUrls, setRadarUrls] = useState({ base: null, velocity: null });

  useEffect(() => {
    if (!radarStation || !getRadarUrls) {
      setError('Radar station data not available');
      return;
    }

    const urls = getRadarUrls(radarStation);
    if (!urls) {
      setError('Could not generate radar URLs');
      return;
    }

    setRadarUrls(urls);
    setError(null);
  }, [radarStation, getRadarUrls]);

  const handleImageLoad = () => {
    setIsLoading(false);
    setError(null);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setError('Failed to load radar imagery');
  };

  if (error) {
    return (
      <div className="bg-slate-800/50 rounded-lg p-4 h-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-white text-xl font-bold">Weather Radar</h2>
        </div>
        <div className="flex items-center justify-center h-64 text-red-400">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 rounded-lg p-4 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-white text-xl font-bold">Weather Radar</h2>
        <button 
          onClick={() => setShowVelocity(!showVelocity)}
          className="flex items-center gap-2 bg-slate-700/50 px-3 py-1 rounded-lg hover:bg-slate-600/50 transition-colors"
        >
          {showVelocity ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          <span className="text-sm">{showVelocity ? 'Velocity' : 'Base'}</span>
        </button>
      </div>

      <div className="relative flex-1 bg-black/30 rounded-lg overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
            Loading radar data...
          </div>
        )}
        
        <img
          src={showVelocity ? radarUrls.velocity : radarUrls.base}
          alt={`${radarStation} ${showVelocity ? 'velocity' : 'base reflectivity'} radar`}
          className="w-full h-full object-contain"
          onLoad={handleImageLoad}
          onError={handleImageError}
        />

        <div className="absolute bottom-2 right-2 bg-black/50 px-2 py-1 rounded text-xs">
          Station: {radarStation}
        </div>
      </div>
    </div>
  );
};

export default WeatherRadar;

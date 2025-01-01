
import React, { useState, useEffect } from 'react';
import { Moon } from 'lucide-react';
import * as Astronomy from 'astronomy-engine';
import { config } from '../config/config.js';
import SkyView from './SkyView';

const PLANETS = [
  { body: Astronomy.Body.Venus, name: 'Venus', color: '#FFE5CC' },
  { body: Astronomy.Body.Mars, name: 'Mars', color: '#FF6B4A' },
  { body: Astronomy.Body.Jupiter, name: 'Jupiter', color: '#FFDEB0' },
  { body: Astronomy.Body.Saturn, name: 'Saturn', color: '#FFE5B0' }
];

const NightSky = () => {
  const [skyData, setSkyData] = useState({
    moonPhase: 0,
    moonIllumination: 0,
    visiblePlanets: [],
    celestialObjects: []
  });
  
  useEffect(() => {
    const calculateSkyData = () => {
      try {
        // Use midnight for static display
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const time = Astronomy.MakeTime(now);
        const observer = new Astronomy.Observer(
          config.location.lat,
          config.location.lon,
          0
        );

        // Calculate moon data
        const moonPhase = Astronomy.MoonPhase(time);
        const moonPos = Astronomy.GeoMoon(time);
        const moonEquator = Astronomy.Equator(moonPos, time, false, false);
        const moonHorizon = Astronomy.Horizon(time, observer, moonEquator.ra, moonEquator.dec, 'normal');
        const moonIllum = Astronomy.Illumination(Astronomy.Body.Moon, time);

        // Calculate planet positions and visibility
        const visiblePlanets = [];
        const celestialObjects = [
          {
            type: 'moon',
            name: 'Moon',
            altitude: moonHorizon.altitude,
            azimuth: moonHorizon.azimuth,
            size: 0.5,
            magnitude: moonIllum.mag,
            illumination: moonIllum.phase_fraction * 100
          }
        ];

        // Calculate each planet's position
        for (const planet of PLANETS) {
          try {
            const planetPos = Astronomy.GeoVector(planet.body, time, false);
            const planetEquator = Astronomy.Equator(planetPos, time, false, false);
            const planetHorizon = Astronomy.Horizon(time, observer, planetEquator.ra, planetEquator.dec, 'normal');
            const planetIllum = Astronomy.Illumination(planet.body, time);
            
            // Consider visible if above horizon and not too close to the Sun
            if (planetHorizon.altitude > 0) {
              const elongation = Astronomy.AngleFromSun(planet.body, time);
              if (elongation > 15) { // More than 15 degrees from Sun
                visiblePlanets.push(planet.name);
                celestialObjects.push({
                  type: 'planet',
                  name: planet.name,
                  altitude: planetHorizon.altitude,
                  azimuth: planetHorizon.azimuth,
                  size: 0.1,
                  magnitude: planetIllum.mag
                });
              }
            }
          } catch (error) {
            // Silently handle planet calculation errors
          }
        }

        setSkyData({
          moonPhase,
          moonIllumination: moonIllum.phase_fraction * 100,
          visiblePlanets,
          celestialObjects
        });

      } catch (error) {
        // Silently handle non-critical errors
        if (error?.message?.includes('API') || error?.message?.includes('network')) {
          console.error('Critical sky data error:', error.message);
        }
      }
    };

    calculateSkyData();
  }, []);

  const getMoonPhaseDescription = (phase) => {
    const normalizedPhase = phase % 360;
    if (normalizedPhase < 45) return 'New Moon';
    if (normalizedPhase < 90) return 'Waxing Crescent';
    if (normalizedPhase < 135) return 'First Quarter';
    if (normalizedPhase < 225) return 'Waxing Gibbous';
    if (normalizedPhase < 270) return 'Full Moon';
    if (normalizedPhase < 315) return 'Waning Gibbous';
    if (normalizedPhase < 360) return 'Last Quarter';
    return 'Waning Crescent';
  };

  return (
    <div className="h-full flex flex-col">
      <h2 className="text-3xl font-bold mb-6">Night Sky</h2>

      <div className="flex-grow bg-gray-800/30 rounded-lg p-6 space-y-6">
        {/* Sky View */}
        <div className="bg-gray-900/50 rounded-lg overflow-hidden mb-6">
          <SkyView
            observer={new Astronomy.Observer(
              config.location.lat,
              config.location.lon,
              0
            )}
            time={new Date()}
            celestialObjects={skyData.celestialObjects}
          />
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-gray-400 mb-1">Moon Phase</div>
            <div className="flex items-center gap-2">
              <Moon className="w-6 h-6" />
              <div>
                <div className="font-bold">
                  {getMoonPhaseDescription(skyData.moonPhase)}
                </div>
                <div className="text-sm text-gray-400">
                  {Math.round(skyData.moonIllumination)}% illuminated
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <div className="text-gray-400 mb-1">Visible Planets</div>
            <div className="font-bold">
              {skyData.visiblePlanets.length > 0 
                ? skyData.visiblePlanets.join(', ')
                : 'None currently visible'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NightSky;

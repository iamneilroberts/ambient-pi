import React, { useState, useEffect } from 'react';
import { Rocket, Satellite, Star, Clock, Moon, AlertCircle } from 'lucide-react';
import { config } from '../config/display-config';

const SpaceTracker = () => {
  const [spaceData, setSpaceData] = useState({
    issPasses: [
      { 
        time: '2024-12-23 20:45',
        duration: '6 min',
        maxElevation: '45°',
        direction: 'NW to SE',
        brightness: '-3.2'
      },
      { 
        time: '2024-12-24 19:32',
        duration: '4 min',
        maxElevation: '32°',
        direction: 'W to NE',
        brightness: '-2.8'
      }
    ],
    launches: [
      { 
        mission: 'SpaceX Crew-9',
        date: '2024-12-25 15:00',
        location: 'Kennedy Space Center',
        countdown: '1d 18h',
        provider: 'SpaceX',
        payload: 'Crew Dragon',
        status: 'GO'
      },
      { 
        mission: 'Artemis II',
        date: '2024-12-30',
        location: 'Kennedy Space Center',
        countdown: '6d 12h',
        provider: 'NASA',
        payload: 'Orion Spacecraft',
        status: 'GO'
      }
    ],
    starlink: [
      { 
        trainId: 'G7-24',
        time: '2024-12-23 21:15',
        brightness: '3.2',
        direction: 'SW',
        elevation: '45°'
      },
      { 
        trainId: 'G7-25',
        time: '2024-12-24 20:45',
        brightness: '2.8',
        direction: 'W',
        elevation: '38°'
      }
    ],
    nightSky: {
      moonPhase: 'Waxing Gibbous',
      moonset: '03:24',
      moonrise: '15:45',
      illumination: '84%',
      visiblePlanets: [
        { name: 'Mars', direction: 'SW', elevation: '45°', brightness: '1.2' },
        { name: 'Jupiter', direction: 'S', elevation: '65°', brightness: '-2.4' },
        { name: 'Saturn', direction: 'W', elevation: '25°', brightness: '0.8' }
      ],
      conditions: {
        visibility: 'Good',
        cloudCover: '15%',
        temperature: '68°F',
        humidity: '65%',
        seeing: '3/5'
      }
    }
  });

  useEffect(() => {
    const fetchSpaceData = async () => {
      try {
        // TODO: Implement API calls
        // ISS passes: N2YO API
        // const issResponse = await fetch(`https://api.n2yo.com/rest/v1/satellite/visualpasses/25544/${config.location.lat}/${config.location.lon}/0/7/300/&apiKey=${config.apis.space.n2yo}`);
        
        // Launches: Launch Library 2 API
        // const launchResponse = await fetch(`https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=5&apikey=${config.apis.space.launchLibrary}`);
        
        // Night sky data could come from various astronomy APIs
        
      } catch (error) {
        console.error('Error fetching space data:', error);
      }
    };

    fetchSpaceData();
    const interval = setInterval(fetchSpaceData, config.rotation.displays.find(d => d.id === 'space').updateInterval * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Calculate time until next event
  const getNextEvent = () => {
    const events = [
      ...spaceData.issPasses.map(pass => ({ type: 'ISS Pass', time: new Date(pass.time) })),
      ...spaceData.launches.map(launch => ({ type: 'Launch', time: new Date(launch.date) })),
      ...spaceData.starlink.map(train => ({ type: 'Starlink', time: new Date(train.time) }))
    ];
    
    const nextEvent = events
      .filter(event => event.time > new Date())
      .sort((a, b) => a.time - b.time)[0];

    return nextEvent;
  };

  const nextEvent = getNextEvent();

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Space Tracker</h1>
        <div className="text-xl">{config.location.city}, {config.location.state}</div>
      </div>

      {/* Next Event Alert */}
      <div className="bg-blue-900/75 p-4 rounded-lg flex items-center space-x-4">
        <AlertCircle className="w-6 h-6" />
        <div>
          <div className="font-bold">Next Space Event</div>
          <div>
            {nextEvent ? `${nextEvent.type} - ${nextEvent.time.toLocaleString()}` : 'No upcoming events'}
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* ISS Passes */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="flex items-center space-x-3 mb-4">
            <Satellite className="w-6 h-6" />
            <h2 className="text-xl font-bold">ISS Visible Passes</h2>
          </div>
          <div className="space-y-4">
            {spaceData.issPasses.map((pass, index) => (
              <div key={index} className="bg-gray-700/50 p-4 rounded-lg">
                <div className="font-bold">{new Date(pass.time).toLocaleString()}</div>
                <div className="text-sm text-gray-400">
                  Duration: {pass.duration} | Max Elevation: {pass.maxElevation}
                  <br />
                  Direction: {pass.direction} | Magnitude: {pass.brightness}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Launches */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="flex items-center space-x-3 mb-4">
            <Rocket className="w-6 h-6" />
            <h2 className="text-xl font-bold">Upcoming Launches</h2>
          </div>
          <div className="space-y-4">
            {spaceData.launches.map((launch, index) => (
              <div key={index} className="bg-gray-700/50 p-4 rounded-lg">
                <div className="font-bold">{launch.mission}</div>
                <div className="text-sm text-gray-400">
                  {new Date(launch.date).toLocaleDateString()} at {launch.location}
                  <br />
                  {launch.provider} | {launch.payload} | T-{launch.countdown}
                  <div className="mt-1">
                    Status: <span className="text-green-400">{launch.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Night Sky Conditions */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="flex items-center space-x-3 mb-4">
            <Star className="w-6 h-6" />
            <h2 className="text-xl font-bold">Night Sky Conditions</h2>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="flex items-center space-x-2">
                <Moon className="w-5 h-5" />
                <div className="font-bold">Moon</div>
              </div>
              <div className="text-sm text-gray-400">
                Phase: {spaceData.nightSky.moonPhase}
                <br />
                Rise: {spaceData.nightSky.moonrise}
                <br />
                Set: {spaceData.nightSky.moonset}
                <br />
                Illumination: {spaceData.nightSky.illumination}
              </div>
            </div>
            <div>
              <div className="font-bold">Viewing Conditions</div>
              <div className="text-sm text-gray-400">
                Visibility: {spaceData.nightSky.conditions.visibility}
                <br />
                Cloud Cover: {spaceData.nightSky.conditions.cloudCover}
                <br />
                Temperature: {spaceData.nightSky.conditions.temperature}
                <br />
                Seeing: {spaceData.nightSky.conditions.seeing}
              </div>
            </div>
          </div>
        </div>

        {/* Visible Planets */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="flex items-center space-x-3 mb-4">
            <Star className="w-6 h-6" />
            <h2 className="text-xl font-bold">Visible Planets</h2>
          </div>
          <div className="space-y-4">
            {spaceData.nightSky.visiblePlanets.map((planet, index) => (
              <div key={index} className="bg-gray-700/50 p-4 rounded-lg">
                <div className="font-bold">{planet.name}</div>
                <div className="text-sm text-gray-400">
                  Direction: {planet.direction} | Elevation: {planet.elevation}
                  <br />
                  Brightness: {planet.brightness} magnitude
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Starlink Passes */}
        <div className="col-span-2 bg-gray-800 p-6 rounded-lg">
          <div className="flex items-center space-x-3 mb-4">
            <Clock className="w-6 h-6" />
            <h2 className="text-xl font-bold">Starlink Passes</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {spaceData.starlink.map((train, index) => (
              <div key={index} className="bg-gray-700/50 p-4 rounded-lg">
                <div className="font-bold">Train {train.trainId}</div>
                <div className="text-sm text-gray-400">
                  {new Date(train.time).toLocaleString()}
                  <br />
                  Brightness: Mag {train.brightness} | Direction: {train.direction}
                  <br />
                  Maximum Elevation: {train.elevation}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpaceTracker;

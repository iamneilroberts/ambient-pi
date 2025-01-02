import React, { useState, useEffect, useCallback } from 'react';
import { 
  Rocket, Satellite, Star, AlertCircle, 
  Bell
} from 'lucide-react';
import { config } from '../config/config.js';
import NightSky from './NightSky';

const SpaceTracker = () => {
  const [launchError, setLaunchError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [events, setEvents] = useState([]);
  const [countdowns, setCountdowns] = useState({});

  const calculateCountdown = useCallback((timestamp) => {
    const target = new Date(timestamp);
    const now = new Date();
    const diff = target - now;
    
    if (diff < 0) return { timeString: 'Past', isImminent: false };
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    let timeString;
    const isImminent = diff < 1000 * 60 * 60; // Less than 1 hour
    
    if (days > 0) {
      timeString = `T-${days}d ${hours}h`;
    } else if (hours > 0) {
      timeString = `T-${hours}h ${minutes}m`;
    } else {
      timeString = `T-${minutes}m`;
    }
    
    return { timeString, isImminent };
  }, []);

  useEffect(() => {
    const updateCountdowns = () => {
      const newCountdowns = {};
      events.forEach(event => {
        if (event.type === 'launch') {
          newCountdowns[event.name] = calculateCountdown(event.time);
        } else if (event.type === 'iss') {
          newCountdowns[event.name] = calculateCountdown(event.startTime);
        }
      });
      setCountdowns(newCountdowns);
    };

    updateCountdowns();
    const interval = setInterval(updateCountdowns, 60000);
    return () => clearInterval(interval);
  }, [events, calculateCountdown]);

  const fetchLaunches = useCallback(async (skipLoading = false) => {
    try {
      setLaunchError(null);
      if (!skipLoading) {
        setIsLoading(true);
      }
      
      const response = await fetch('/api/space/launches?limit=5', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        if (response.status === 429) {
          return; // Keep using existing events
        } else if (response.status === 404) {
          throw new Error('Launch data not available.');
        } else {
          throw new Error(`API error: ${response.status}`);
        }
      }

      const data = await response.json();
      
      const launchEvents = (data.results && Array.isArray(data.results)) ? data.results.map(launch => ({
        type: 'launch',
        name: launch.name || 'Unknown Launch',
        countdown: calculateCountdown(launch.net),
        location: launch.pad?.location?.name || 'Location TBD',
        vehicle: launch.rocket?.configuration?.name || 'Vehicle TBD',
        description: launch.mission?.description || launch.mission_description,
        launchPad: launch.pad?.name,
        probability: launch.probability !== null ? `${launch.probability}%` : null,
        time: launch.net,
        orbit: launch.mission?.orbit?.name,
        provider: launch.launch_service_provider?.name,
        holdReason: launch.holdreason
      })) : [];

      const issResponse = await fetch(
        `/api/space/iss/passes?lat=${config.location.lat}&lng=${config.location.lon}&days=5`
      );
      if (!issResponse.ok) {
        if (issResponse.status === 429) {
          return; // Keep using existing events
        }
        throw new Error('Failed to fetch ISS passes');
      }
      const issData = await issResponse.json();
      
      const timeFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: config.location.timezone,
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      
      const issPasses = issData.passes
        .slice(0, 5)
        .map(pass => ({
          type: 'iss',
          name: 'ISS Pass',
          passTime: timeFormatter.format(pass.startTime),
          elevation: pass.elevation,
          direction: pass.direction,
          duration: pass.duration,
          magnitude: pass.magnitude,
          startTime: pass.startTime,
          isHighlyVisible: pass.elevation > 40 && pass.magnitude <= -2.5
        }));

      const allEvents = [
        ...launchEvents
          .filter(event => {
            const eventTime = new Date(event.time).getTime();
            const now = new Date().getTime();
            return eventTime > now - (60 * 60 * 1000);
          })
          .map(event => ({
            ...event,
            sortTime: new Date(event.time).getTime()
          })),
        ...issPasses.map(pass => ({
          ...pass,
          sortTime: pass.startTime * 1000
        }))
      ].sort((a, b) => {
        if (a.type === 'iss' && b.type === 'iss') {
          if (a.isHighlyVisible && !b.isHighlyVisible) return -1;
          if (!a.isHighlyVisible && b.isHighlyVisible) return 1;
        }
        return a.sortTime - b.sortTime;
      });

      setEvents(allEvents);
      setLastUpdate(new Date());
      setIsLoading(false);
    } catch (error) {
      if (!error.message.includes('Rate limit')) {
        setLaunchError(error.message);
        setEvents(prevEvents => prevEvents.filter(event => event.type !== 'launch'));
      }
      setIsLoading(false);
    }
  }, [calculateCountdown]);

  useEffect(() => {
    fetch('/api/space/launches?limit=5', {
      headers: {
        'Cache-Control': 'only-if-cached',
        'Pragma': 'no-cache'
      }
    })
    .then(async response => {
      if (response.ok) {
        const data = await response.json();
        setEvents(prevEvents => {
          const launchEvents = (data.results && Array.isArray(data.results)) 
            ? data.results.map(launch => ({
                type: 'launch',
                name: launch.name || 'Unknown Launch',
                countdown: calculateCountdown(launch.net),
                location: launch.pad?.location?.name || 'Location TBD',
                vehicle: launch.rocket?.configuration?.name || 'Vehicle TBD',
                description: launch.mission?.description || launch.mission_description,
                launchPad: launch.pad?.name,
                probability: launch.probability !== null ? `${launch.probability}%` : null,
                time: launch.net,
                orbit: launch.mission?.orbit?.name,
                provider: launch.launch_service_provider?.name,
                holdReason: launch.holdreason,
                sortTime: new Date(launch.net).getTime()
              }))
            : [];
          return [...launchEvents, ...prevEvents.filter(event => event.type === 'iss')];
        });
        setIsLoading(false);
      }
    })
    .catch(() => {/* Ignore cache misses */});

    fetchLaunches(true);
    const interval = setInterval(() => fetchLaunches(true), 300000);
    return () => clearInterval(interval);
  }, [fetchLaunches, calculateCountdown]);

  const PassRating = ({ magnitude, elevation }) => {
    const rating = magnitude < -2.5 && elevation > 40 ? 3 
                 : (magnitude < -2.0 || elevation > 30) ? 2 
                 : 1;
    return (
      <div className="flex">
        {[...Array(rating)].map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 overflow-auto bg-gray-900 text-white pb-32">
      <div className="flex flex-col md:flex-row min-h-screen">
        <div className="w-full md:w-1/2 p-4 md:p-6 md:border-r border-gray-800 mb-4 md:mb-0">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Space Events</h1>
            <div className="text-gray-400">
              {config.location.city}, {config.location.state}
            </div>
          </div>

          {launchError && (
            <div className="bg-red-900/50 border border-red-800 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-1 text-red-400" />
            <div>
              <div className="font-bold text-red-200">Launch Data Error</div>
              <div className="text-red-300">{launchError}</div>
              {lastUpdate && (
                <div className="text-red-400 text-sm mt-1">
                  Last successful update: {lastUpdate.toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
          )}

          {isLoading && events.length === 0 && (
            <div className="bg-gray-800/50 rounded-lg p-8 mb-6">
            <div className="flex justify-center items-center">
              <Rocket className="w-6 h-6 animate-pulse" />
              <span className="ml-3">Loading launch data...</span>
            </div>
          </div>
          )}

            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="space-y-3">
            {events.length === 0 ? (
              <div className="text-gray-400 text-center py-4">No upcoming events</div>
            ) : (
              events.map((event, index) => {
                const getEventIcon = () => {
                  switch (event.type) {
                    case 'launch':
                      return <Rocket className="w-5 h-5 text-orange-400" />;
                    case 'iss':
                      return <Satellite className="w-5 h-5 text-blue-400" />;
                    default:
                      return null;
                  }
                };

                const countdown = countdowns[event.name] || { timeString: '', isImminent: false };

                return (
                  <div 
                    key={index} 
                    className={`p-2 md:p-3 rounded-lg transition-colors ${
                      event.type === 'launch' 
                        ? new Date(event.time).getTime() < new Date().getTime()
                          ? 'bg-orange-900/20 hover:bg-orange-800/30 border border-orange-700/30'
                          : new Date(event.time).getTime() - new Date().getTime() < 24 * 60 * 60 * 1000
                            ? 'bg-green-900/20 hover:bg-green-800/30 border border-green-700/30'
                            : 'bg-gray-700/50 hover:bg-gray-600/50'
                        : event.type === 'iss' && event.isHighlyVisible
                        ? 'bg-yellow-900/20 hover:bg-yellow-800/30 border border-yellow-700/30'
                        : 'bg-gray-700/50 hover:bg-gray-600/50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex gap-2 md:gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getEventIcon()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <div className="font-bold text-sm md:text-base break-words">
                              {event.name}
                              {event.type === 'iss' && event.isHighlyVisible && (
                                <span className="block md:inline mt-1 md:mt-0 md:ml-2 text-xs bg-yellow-500/30 text-yellow-300 px-2 py-0.5 rounded-full font-medium">
                                  Highly Visible
                                </span>
                              )}
                            </div>
                            {event.type === 'iss' && (
                              <PassRating 
                                magnitude={event.magnitude} 
                                elevation={event.elevation} 
                              />
                            )}
                          </div>
                          <div className="text-sm text-gray-300">
                            {event.type === 'launch' && (
                              <>
                                <div className="mb-2">
                                  <div className="font-medium text-sm md:text-base">{event.location}</div>
                                  <div className="text-sm">{event.launchPad}</div>
                                  <div className="text-xs md:text-sm text-gray-400">
                                    {new Date(event.time).toLocaleString('en-US', {
                                      timeZone: config.location.timezone,
                                      weekday: 'short',
                                      month: 'short',
                                      day: 'numeric',
                                      hour: 'numeric',
                                      minute: '2-digit',
                                      hour12: true
                                    })}
                                  </div>
                                </div>
                                <div className="mb-2">
                                  <div>{event.vehicle}</div>
                                  {event.probability && (
                                    <div className="text-green-400">
                                      Launch probability: {event.probability}
                                    </div>
                                  )}
                                  {event.type === 'launch' && 
                                   new Date(event.time).getTime() - new Date().getTime() < 24 * 60 * 60 * 1000 ? (
                                    <div className="mt-2 p-2 bg-green-900/30 rounded-lg border border-green-700/30">
                                      <div className="text-lg md:text-xl font-bold text-green-400">
                                        {countdown.timeString}
                                      </div>
                                      <div className="text-sm text-green-300">
                                        Launch is imminent
                                      </div>
                                    </div>
                                  ) : (
                                    <div className={countdown.isImminent ? 'text-blue-300' : ''}>
                                      {countdown.timeString}
                                    </div>
                                  )}
                                </div>
                                <div className="text-xs md:text-sm text-gray-400 mt-2 space-y-2">
                                  {event.description && (
                                    <div>{event.description}</div>
                                  )}
                                  {event.orbit && (
                                    <div>
                                      <span className="text-gray-500">Orbit:</span> {event.orbit}
                                    </div>
                                  )}
                                  {event.provider && (
                                    <div>
                                      <span className="text-gray-500">Provider:</span> {event.provider}
                                    </div>
                                  )}
                                  {event.holdReason && (
                                    <div className="text-yellow-400">
                                      Hold: {event.holdReason}
                                    </div>
                                  )}
                                </div>
                              </>
                            )}
                            {event.type === 'iss' && (
                              <>
                                <div className="mb-2">
                                  <div className="text-gray-400">
                                    {event.passTime}
                                  </div>
                                  <div className={countdown.isImminent ? 'text-blue-300' : ''}>
                                    {countdown.timeString}
                                  </div>
                                </div>
                                <div>
                                  {event.elevation}° max elevation | {event.direction}
                                  <br />
                                  {event.duration} min | Magnitude: {event.magnitude}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <button className="bg-blue-900/50 p-1.5 md:p-2 rounded-lg hover:bg-blue-800/50 flex-shrink-0">
                        <Bell className="w-3 h-3 md:w-4 md:h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
              </div>
            </div>
        </div>

        <div className="w-full md:w-1/2 p-4 md:p-6 h-[400px] md:h-auto">
          <NightSky />
        </div>
      </div>
    </div>
  );
};

export default SpaceTracker;

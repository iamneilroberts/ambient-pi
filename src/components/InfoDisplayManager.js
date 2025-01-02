import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PhotoFrame from './PhotoFrame';
import WeatherDashboard from './weather/WeatherDashboard';
import SpaceTracker from './SpaceTracker';
import FinanceDashboard from './finance/FinanceDashboard';
import FlightTracker from './flight/FlightTracker';
import SystemMonitor from './SystemMonitor';
import WebGLDemo from './WebGLDemo';
import CalendarDashboard from './calendar/CalendarDashboard';
import { config } from '../config/display-config.js';

const InfoDisplayManager = () => {
  // List of currently implemented displays
  const IMPLEMENTED_DISPLAYS = useMemo(() => 
    ['weather', 'photos', 'space', 'finance', 'flight', 'system', 'webgl', 'calendar'],
    []
  );

  // Initialize with display from URL parameter or first enabled display
  const [currentDisplay, setCurrentDisplay] = useState(() => {
    // Check URL parameters
    const params = new URLSearchParams(window.location.search);
    const displayParam = params.get('display');

    // If display parameter exists and is implemented/enabled, use it
    if (displayParam && IMPLEMENTED_DISPLAYS.includes(displayParam)) {
      const display = config.rotation.displays.find(d => d.id === displayParam);
      if (display?.enabled) {
        return displayParam;
      }
    }

    // Otherwise use first enabled display
    const enabledDisplays = config.rotation.displays.filter(d => 
      d.enabled && IMPLEMENTED_DISPLAYS.includes(d.id)
    );
    return enabledDisplays.length > 0 ? enabledDisplays[0].id : 'photos';
  });
  const [isScreensaver, setIsScreensaver] = useState(false);
  const [idleTime, setIdleTime] = useState(0);

  // Get next display helper function
  const getNextDisplay = useCallback(() => {
    const displays = config.rotation.displays.filter(d => 
      d.enabled && IMPLEMENTED_DISPLAYS.includes(d.id)
    );
    const currentIndex = displays.findIndex(d => d.id === currentDisplay);
    const nextIndex = (currentIndex + 1) % displays.length;
    return displays[nextIndex].id;
  }, [currentDisplay, IMPLEMENTED_DISPLAYS]);

  // Handle manual rotation
  const rotateToNextDisplay = useCallback(() => {
    const nextDisplay = getNextDisplay();
    console.log('Manually rotating to:', nextDisplay);
    setCurrentDisplay(nextDisplay);
    // Update URL without reloading page
    const url = new URL(window.location);
    url.searchParams.set('display', nextDisplay);
    window.history.pushState({}, '', url);
    // Reset idle time when manually rotating
    setIdleTime(0);
    setIsScreensaver(false);
  }, [getNextDisplay]);

  // Handle keyboard navigation and browser history
  useEffect(() => {
    const handleKeyPress = (event) => {
      // Check for spacebar or right arrow
      if (event.key === ' ' || event.key === 'ArrowRight') {
        event.preventDefault(); // Prevent scrolling with spacebar
        rotateToNextDisplay();
      }
    };

    // Handle browser history navigation
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const displayParam = params.get('display');
      if (displayParam && IMPLEMENTED_DISPLAYS.includes(displayParam)) {
        const display = config.rotation.displays.find(d => d.id === displayParam);
        if (display?.enabled) {
          setCurrentDisplay(displayParam);
          setIdleTime(0);
          setIsScreensaver(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [rotateToNextDisplay, IMPLEMENTED_DISPLAYS]);

  // Handle automatic display rotation
  useEffect(() => {
    const displays = config.rotation.displays.filter(d => 
      d.enabled && IMPLEMENTED_DISPLAYS.includes(d.id)
    );
    
    const rotateDisplay = () => {
      setCurrentDisplay(current => {
        const currentIndex = displays.findIndex(d => d.id === current);
        const nextIndex = (currentIndex + 1) % displays.length;
        const nextDisplay = displays[nextIndex].id;
        
        // Update URL without reloading page
        const url = new URL(window.location);
        url.searchParams.set('display', nextDisplay);
        window.history.pushState({}, '', url);
        
        return nextDisplay;
      });
    };

    // Set up rotation interval
    const interval = setInterval(rotateDisplay, config.rotation.interval * 1000);

    return () => clearInterval(interval);
  }, [currentDisplay, IMPLEMENTED_DISPLAYS]);

  // Handle idle detection
  useEffect(() => {
    const resetIdle = () => {
      setIdleTime(0);
      setIsScreensaver(false);
    };

    const incrementIdle = () => {
      setIdleTime(prev => {
        const newTime = prev + 1;
        if (newTime >= config.rotation.idleTimeout) {
          setIsScreensaver(true);
        }
        return newTime;
      });
    };

    // Reset idle on user interaction
    window.addEventListener('mousemove', resetIdle);
    window.addEventListener('keydown', resetIdle);
    window.addEventListener('click', resetIdle);

    // Increment idle time every second
    const idleInterval = setInterval(incrementIdle, 1000);

    return () => {
      window.removeEventListener('mousemove', resetIdle);
      window.removeEventListener('keydown', resetIdle);
      window.removeEventListener('click', resetIdle);
      clearInterval(idleInterval);
    };
  }, [idleTime]);

  const renderCurrentDisplay = () => {    
    switch (currentDisplay) {
      case 'weather':
        return <WeatherDashboard />;
      case 'photos':
        return <PhotoFrame />;
      case 'space':
        return <SpaceTracker />;
      case 'finance':
        return <FinanceDashboard />;
      case 'flight':
        return <FlightTracker />;
      case 'system':
        return <SystemMonitor />;
      case 'webgl':
        return <WebGLDemo rotationInterval={config.rotation.displays.find(d => d.id === 'webgl')?.updateInterval || 300} />;
      case 'calendar':
        return <CalendarDashboard />;
      default:
        // If display is not implemented yet, show photos
        // Remove this display from rotation to avoid showing unimplemented components
        const enabledDisplays = config.rotation.displays.filter(d => 
          d.enabled && IMPLEMENTED_DISPLAYS.includes(d.id)
        );
        if (enabledDisplays.length > 0) {
          setCurrentDisplay(enabledDisplays[0].id);
        }
        return <PhotoFrame />;
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden relative">
      {renderCurrentDisplay()}
      
      {/* Mobile Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-black bg-opacity-75 backdrop-blur-sm md:hidden z-50">
        <div className="flex justify-around items-center p-2 gap-2">
          {config.rotation.displays
            .filter(d => d.enabled && IMPLEMENTED_DISPLAYS.includes(d.id))
            .map(display => (
              <button
                key={display.id}
                onClick={() => {
                  setCurrentDisplay(display.id);
                  const url = new URL(window.location);
                  url.searchParams.set('display', display.id);
                  window.history.pushState({}, '', url);
                }}
                className={`flex-1 py-3 px-2 rounded-lg transition-all ${
                  currentDisplay === display.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <div className="text-center">
                  <div className="text-xs capitalize">{display.name || display.id}</div>
                </div>
              </button>
            ))}
        </div>
        {/* Add safe area padding for mobile devices */}
        <div className="h-safe-area-inset-bottom bg-black"></div>
      </div>

      {/* Info Overlay - Desktop only */}
      <div className="fixed top-0 right-0 bg-black bg-opacity-50 text-white p-2 text-sm hidden md:block pointer-events-none">
        Mode: {isScreensaver ? 'Screensaver' : 'Active'}<br />
        Idle: {idleTime}s<br />
        Display: {config.rotation.displays.find(d => d.id === currentDisplay)?.name || currentDisplay}<br />
        Press Space/→ to rotate
      </div>

      {/* Mobile Info Button */}
      <button 
        onClick={() => setIsScreensaver(prev => !prev)}
        className="fixed top-2 right-2 bg-black bg-opacity-50 text-white p-2 rounded-full text-xs md:hidden z-40"
      >
        ℹ️
      </button>
    </div>
  );
};

export default InfoDisplayManager;

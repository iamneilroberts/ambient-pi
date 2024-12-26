import React, { useState, useEffect, useCallback } from 'react';
import WeatherDashboard from './WeatherDashboard';
import SystemMonitor from './SystemMonitor';
import PhotoFrame from './PhotoFrame';
import MarineStaticMap from './MarineStaticMap';
import WebGLDemo from './WebGLDemo';
import FinanceDashboard from './finance/FinanceDashboard';
import { config } from '../config/display-config';

const InfoDisplayManager = () => {
  const [currentDisplay, setCurrentDisplay] = useState('weather');
  const [isScreensaver, setIsScreensaver] = useState(false);
  const [idleTime, setIdleTime] = useState(0);
  
  // Get next display helper function
  const getNextDisplay = useCallback(() => {
    const displays = config.rotation.displays.filter(d => d.enabled);
    const currentIndex = displays.findIndex(d => d.id === currentDisplay);
    const nextIndex = (currentIndex + 1) % displays.length;
    return displays[nextIndex].id;
  }, [currentDisplay]);

  // Handle manual rotation
  const rotateToNextDisplay = useCallback(() => {
    const nextDisplay = getNextDisplay();
    console.log('Manually rotating to:', nextDisplay);
    setCurrentDisplay(nextDisplay);
    // Reset idle time when manually rotating
    setIdleTime(0);
    setIsScreensaver(false);
  }, [getNextDisplay]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event) => {
      // Check for spacebar (key code 32) or right arrow (key code 39)
      if (event.keyCode === 32 || event.keyCode === 39) {
        event.preventDefault(); // Prevent scrolling with spacebar
        rotateToNextDisplay();
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [rotateToNextDisplay]);

  // Handle display rotation
  useEffect(() => {
    console.log('Rotation effect running, isScreensaver:', isScreensaver);
    
    const displays = config.rotation.displays.filter(d => d.enabled);
    console.log('Available displays:', displays);
    
    const rotateDisplay = () => {
      console.log('Rotating display, current:', currentDisplay);
      setCurrentDisplay(current => {
        const currentIndex = displays.findIndex(d => d.id === current);
        const nextIndex = (currentIndex + 1) % displays.length;
        const nextDisplay = displays[nextIndex].id;
        console.log('Switching to:', nextDisplay);
        return nextDisplay;
      });
    };

    // Only rotate if in screensaver mode
    let interval = null;
    if (isScreensaver) {
      console.log('Setting up rotation interval');
      interval = setInterval(rotateDisplay, config.rotation.interval * 1000);
    }

    return () => {
      if (interval) {
        console.log('Clearing rotation interval');
        clearInterval(interval);
      }
    };
  }, [isScreensaver, currentDisplay]);

  // Handle idle detection
  useEffect(() => {
    console.log('Current idle time:', idleTime);
    
    const resetIdle = () => {
      console.log('Resetting idle time');
      setIdleTime(0);
      setIsScreensaver(false);
    };

    const incrementIdle = () => {
      setIdleTime(prev => {
        const newTime = prev + 1;
        console.log('Incrementing idle time to:', newTime);
        if (newTime >= config.rotation.idleTimeout) {
          console.log('Entering screensaver mode');
          setIsScreensaver(true);
        }
        return newTime;
      });
    };

    // Reset idle on user interaction
    window.addEventListener('mousemove', resetIdle);
    window.addEventListener('keypress', resetIdle);
    window.addEventListener('click', resetIdle);

    // Increment idle time every second
    const idleInterval = setInterval(incrementIdle, 1000);

    return () => {
      window.removeEventListener('mousemove', resetIdle);
      window.removeEventListener('keypress', resetIdle);
      window.removeEventListener('click', resetIdle);
      clearInterval(idleInterval);
    };
  }, [idleTime]);

  const renderCurrentDisplay = () => {
    console.log('Rendering display:', currentDisplay);
    switch (currentDisplay) {
      case 'weather':
        return <WeatherDashboard />;
      case 'system':
        return <SystemMonitor />;
      case 'marine':
        return <MarineStaticMap />;
      case 'photos':
        return <PhotoFrame />;
      case 'webgl':
        return <WebGLDemo rotationInterval={config.rotation.displays.find(d => d.id === 'webgl')?.updateInterval || 300} />;
      case 'finance':
        return <FinanceDashboard />;
      default:
        return <WeatherDashboard />;
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden">
      {renderCurrentDisplay()}
      {/* Debug overlay */}
      <div className="fixed top-0 right-0 bg-black bg-opacity-50 text-white p-2 text-sm">
        Mode: {isScreensaver ? 'Screensaver' : 'Active'}<br />
        Idle: {idleTime}s<br />
        Display: {currentDisplay}<br />
        Press Space/→ to rotate
      </div>
    </div>
  );
};

export default InfoDisplayManager;

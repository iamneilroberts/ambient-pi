import React, { useState, useEffect } from 'react';
import { useTheme } from '../themes/ThemeProvider';
import FlipClock from './components/FlipClock';
import PaperCalendar from './components/PaperCalendar';
import LEDClock from './components/LEDClock';
import CalendarEvents from './components/CalendarEvents';

const CalendarDashboard = () => {
  const { themeConfig: theme } = useTheme();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [displayMode, setDisplayMode] = useState(0); // Cycles through different display modes
  const displayModes = ['flip', 'paper', 'led'];

  useEffect(() => {
    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  const switchDisplayMode = (mode) => {
    setDisplayMode(displayModes.indexOf(mode));
  };

  const renderTimeDisplay = () => {
    switch (displayModes[displayMode]) {
      case 'flip':
        return <FlipClock time={currentTime} />;
      case 'paper':
        return <PaperCalendar date={currentTime} />;
      case 'led':
        return <LEDClock time={currentTime} />;
      default:
        return <FlipClock time={currentTime} />;
    }
  };

  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-4"
         style={{ backgroundColor: theme.colors.background, color: theme.colors.text }}>
      <div className="flex-1 flex items-center justify-center">
        {renderTimeDisplay()}
      </div>
      <div className="flex gap-4 mt-4 mb-4">
        <button
          className="px-4 py-2 rounded"
          style={{ 
            backgroundColor: displayModes[displayMode] === 'flip' ? theme.colors.primary : theme.colors.background,
            border: `1px solid ${theme.colors.primary}`
          }}
          onClick={() => switchDisplayMode('flip')}
        >
          Flip Clock
        </button>
        <button
          className="px-4 py-2 rounded"
          style={{ 
            backgroundColor: displayModes[displayMode] === 'paper' ? theme.colors.primary : theme.colors.background,
            border: `1px solid ${theme.colors.primary}`
          }}
          onClick={() => switchDisplayMode('paper')}
        >
          Paper Calendar
        </button>
        <button
          className="px-4 py-2 rounded"
          style={{ 
            backgroundColor: displayModes[displayMode] === 'led' ? theme.colors.primary : theme.colors.background,
            border: `1px solid ${theme.colors.primary}`
          }}
          onClick={() => switchDisplayMode('led')}
        >
          LED Clock
        </button>
      </div>
      <div className="w-full">
        <CalendarEvents />
      </div>
    </div>
  );
};

export default CalendarDashboard;

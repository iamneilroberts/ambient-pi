import React from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '../../themes/ThemeProvider';

const LEDDigit = ({ value }) => {
  const { themeConfig: theme } = useTheme();
  
  return (
    <div 
      className="w-16 h-24 mx-1 rounded flex items-center justify-center text-4xl font-bold"
      style={{
        backgroundColor: theme.colors.background,
        border: `2px solid ${theme.colors.primary}`,
        color: theme.colors.primary,
        textShadow: `0 0 10px ${theme.colors.primary}`,
        fontFamily: 'monospace'
      }}
    >
      {value}
    </div>
  );
};

LEDDigit.propTypes = {
  value: PropTypes.string.isRequired
};

const LEDSeparator = () => {
  const { themeConfig: theme } = useTheme();
  
  return (
    <div className="mx-1 flex flex-col justify-center space-y-4">
      <div 
        className="w-2 h-2 rounded-full"
        style={{
          backgroundColor: theme.colors.primary,
          boxShadow: `0 0 10px ${theme.colors.primary}`
        }}
      />
      <div 
        className="w-2 h-2 rounded-full"
        style={{
          backgroundColor: theme.colors.primary,
          boxShadow: `0 0 10px ${theme.colors.primary}`
        }}
      />
    </div>
  );
};

const LEDClock = ({ time }) => {
  const hours = time.getHours().toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const seconds = time.getSeconds().toString().padStart(2, '0');

  return (
    <div className="flex items-center">
      <LEDDigit value={hours[0]} />
      <LEDDigit value={hours[1]} />
      <LEDSeparator />
      <LEDDigit value={minutes[0]} />
      <LEDDigit value={minutes[1]} />
      <LEDSeparator />
      <LEDDigit value={seconds[0]} />
      <LEDDigit value={seconds[1]} />
    </div>
  );
};

LEDClock.propTypes = {
  time: PropTypes.instanceOf(Date).isRequired
};

export default LEDClock;

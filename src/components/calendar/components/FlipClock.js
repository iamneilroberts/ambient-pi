import React from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '../../themes/ThemeProvider';

const FlipCard = ({ value, label }) => {
  const { themeConfig: theme } = useTheme();
  
  return (
    <div className="flex flex-col items-center mx-2">
      <div className="relative">
        <div 
          className="w-20 h-24 rounded-lg flex items-center justify-center text-4xl font-bold shadow-lg"
          style={{
            backgroundColor: theme.colors.primary,
            perspective: '400px'
          }}
        >
          {value}
        </div>
      </div>
      <div className="mt-2 text-sm uppercase">{label}</div>
    </div>
  );
};

FlipCard.propTypes = {
  value: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired
};

const FlipClock = ({ time }) => {
  const hours = time.getHours().toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const seconds = time.getSeconds().toString().padStart(2, '0');

  return (
    <div className="flex items-center">
      <FlipCard value={hours} label="Hours" />
      <div className="text-4xl mx-2">:</div>
      <FlipCard value={minutes} label="Minutes" />
      <div className="text-4xl mx-2">:</div>
      <FlipCard value={seconds} label="Seconds" />
    </div>
  );
};

FlipClock.propTypes = {
  time: PropTypes.instanceOf(Date).isRequired
};

export default FlipClock;

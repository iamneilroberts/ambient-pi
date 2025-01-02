import React from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '../../themes/ThemeProvider';

const PaperCalendar = ({ date }) => {
  const { themeConfig: theme } = useTheme();
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const year = date.getFullYear();

  // Get first day of month and total days
  const firstDay = new Date(year, date.getMonth(), 1).getDay();
  const daysInMonth = new Date(year, date.getMonth() + 1, 0).getDate();
  
  // Create calendar grid
  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null); // Empty cells before first day
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  return (
    <div 
      className="w-96 rounded-lg shadow-xl p-4"
      style={{ 
        backgroundColor: theme.colors.background,
        border: `2px solid ${theme.colors.primary}`
      }}
    >
      <div className="text-center mb-4">
        <div 
          className="text-3xl font-bold p-2 rounded-t-lg"
          style={{ backgroundColor: theme.colors.primary }}
        >
          {monthNames[date.getMonth()]} {year}
        </div>
        <div className="text-6xl font-bold my-4">
          {date.getDate()}
        </div>
        <div className="text-xl">
          {dayNames[date.getDay()]}
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1 mt-4">
        {/* Day headers */}
        {dayNames.map(day => (
          <div key={day} className="text-center text-sm font-bold">
            {day.slice(0, 2)}
          </div>
        ))}
        
        {/* Calendar days */}
        {days.map((day, index) => (
          <div 
            key={index}
            className={`text-center p-1 ${
              day === date.getDate() ? 'bg-primary text-white rounded-lg' : ''
            }`}
            style={day === date.getDate() ? { backgroundColor: theme.colors.primary } : {}}
          >
            {day}
          </div>
        ))}
      </div>
    </div>
  );
};

PaperCalendar.propTypes = {
  date: PropTypes.instanceOf(Date).isRequired
};

export default PaperCalendar;

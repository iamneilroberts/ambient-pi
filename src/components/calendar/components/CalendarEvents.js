import React, { useState, useEffect } from 'react';
import { useTheme } from '../../themes/ThemeProvider';

const EventCard = ({ event }) => {
  const { themeConfig: theme } = useTheme();
  const startTime = new Date(event.start.dateTime || event.start.date);
  const endTime = new Date(event.end.dateTime || event.end.date);
  
  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const isAllDay = !event.start.dateTime;
  const timeStr = isAllDay ? 'All Day' : `${formatTime(startTime)} - ${formatTime(endTime)}`;

  return (
    <div 
      className="p-3 mb-2 rounded-lg"
      style={{ 
        backgroundColor: theme.colors.background,
        border: `1px solid ${theme.colors.primary}`,
      }}
    >
      <div className="font-bold">{event.summary}</div>
      <div className="text-sm opacity-75">{timeStr}</div>
      {event.location && (
        <div className="text-sm mt-1 opacity-75">📍 {event.location}</div>
      )}
    </div>
  );
};

const CalendarEvents = () => {
  const { themeConfig: theme } = useTheme();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('/api/calendar/events');
        if (!response.ok) {
          throw new Error('Failed to fetch calendar events');
        }
        const data = await response.json();
        setEvents(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchEvents();
    // Refresh events every 5 minutes
    const interval = setInterval(fetchEvents, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="text-center p-4">
        Loading events...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4 text-red-500">
        {error}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center p-4 opacity-75">
        No upcoming events
      </div>
    );
  }

  return (
    <div 
      className="max-h-64 overflow-y-auto p-4 rounded-lg"
      style={{ backgroundColor: `${theme.colors.background}99` }}
    >
      <h2 className="text-xl font-bold mb-4">Upcoming Events</h2>
      {events.map((event, index) => (
        <EventCard key={event.id || index} event={event} />
      ))}
    </div>
  );
};

export default CalendarEvents;

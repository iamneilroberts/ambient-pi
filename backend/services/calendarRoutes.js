const express = require('express');
const calendarService = require('./calendarService');

const setupCalendarRoutes = (app) => {
  app.get('/api/calendar/events', async (req, res) => {
    try {
      const events = await calendarService.getEvents();
      res.json(events);
    } catch (error) {
      console.error('Calendar API error:', error);
      res.status(500).json({ error: 'Failed to fetch calendar events' });
    }
  });
};

module.exports = { setupCalendarRoutes };

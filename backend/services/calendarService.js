const { google } = require('googleapis');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

const readFile = promisify(fs.readFile);

class CalendarService {
  constructor() {
    this.calendar = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      const credentials = {
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN
      };

      const auth = new google.auth.OAuth2(
        credentials.client_id,
        credentials.client_secret
      );

      auth.setCredentials({
        refresh_token: credentials.refresh_token
      });

      this.calendar = google.calendar({ version: 'v3', auth });
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize calendar service:', error);
      throw error;
    }
  }

  async getEvents() {
    await this.initialize();

    try {
      const now = new Date();
      const response = await this.calendar.events.list({
        calendarId: 'primary',
        timeMin: now.toISOString(),
        maxResults: 10,
        singleEvents: true,
        orderBy: 'startTime'
      });

      return response.data.items;
    } catch (error) {
      console.error('Failed to fetch calendar events:', error);
      throw error;
    }
  }
}

module.exports = new CalendarService();

const getEnvVar = (key) => {
  // Handle both Node.js and browser environments
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  // For browser environment
  return window[key] || process.env[key];
};

export const config = {
  // Location Settings
  location: {
    city: "Bexley",
    state: "MS",
    lat: 30.8352,
    lon: -88.7205,
    timezone: "America/Chicago",
    nearestPort: "Mobile",
    railroadLine: "CSX NO&M"
  },

  // API Keys and External Services
  apis: {
    weather: {
      openWeatherMap: getEnvVar('REACT_APP_OPENWEATHER_API_KEY'),
      nwsOffice: "MOB", // Mobile, AL office
      radarStation: "KMOB"
    },
    space: {
      n2yo: getEnvVar('REACT_APP_N2YO_API_KEY'),
    },
    marine: {
      marineTraffic: getEnvVar('REACT_APP_MARINE_TRAFFIC_API_KEY'),
      aisReceiver: {
        enabled: false,
        device: "/dev/ttyUSB0"
      }
    },
    railroad: {
      railroad_live: getEnvVar('REACT_APP_RAILROAD_LIVE_API_KEY'),
      atcsMonitor: {
        enabled: false
      }
    },
    finance: {
      alphaVantage: getEnvVar('REACT_APP_ALPHA_VANTAGE_API_KEY')
    },
    flight: {
      opensky: {
        username: getEnvVar('OPENSKY_USERNAME'),
        password: getEnvVar('OPENSKY_PASSWORD')
      }
    }
  },

  // Local Services
  localServices: {
    pihole: {
      enabled: true,
      host: "pi.hole",
      apiKey: getEnvVar('REACT_APP_PIHOLE_API_KEY')
    },
    adsb: {
      enabled: false,
      host: "localhost:8080"
    },
    photos: {
      enabled: true,
      sources: [
        {
          type: "local",
          name: "Local Photos",
          enabled: true,
          paths: [
            {
              path: "backend/local-photos",
              recursive: true,
              watchForChanges: true
            }
          ]
        },
        {
          type: "cached_remote",
          name: "Google Photos Cache",
          enabled: true,
          service: "google_photos",
          albumUrl: "https://photos.app.goo.gl/3iGTnvD86HjxYeuL9",
          cacheLocation: "backend/photo-cache",
          syncStrategy: "periodic",
          syncInterval: 3600 // seconds
        }
      ],
      display: {
        interval: 5000,
        transition: "fade",
        shuffle: true,
        showMetadata: true,
        preloadCount: 2
      }
    }
  },

  // Display Preferences
  preferences: {
    theme: "dark",
    units: {
      temperature: "F",
      wind: "mph",
      pressure: "mb",
      distance: "mi"
    },
    stocks: {
      symbols: ["AAPL", "GOOGL", "MSFT", "AMZN", "ASTS", "RKLB"],
      updateInterval: 300
    },
    radar: {
      defaultLayer: "base",
      animations: true,
      range: 150 // miles
    }
  },

  api: {
    dailyLimit: 250
  }
};

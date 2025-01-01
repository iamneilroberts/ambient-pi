const getEnvVar = (key) => {
  // Handle both Node.js and browser environments
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  // For browser environment
  return window[key] || process.env[key];
};

const config = {
  // Location Settings
  location: {
    city: "Bexley",
    state: "MS",
    lat: 30.9386,
    lon: -88.6358,
    timezone: "America/Chicago",
    nearestPort: "Mobile",
    railroadLine: "CSX NO&M"
  },

  // Display Rotation Settings
  rotation: {
    interval: 30, // seconds per display
    idleTimeout: 5, // seconds before screensaver mode
    enableTransitions: false,
    transitionDuration: 1.5, // seconds
    transitionEffects: [
      "fade",
      "slide",
      "dissolve",
      "wave",
      "matrix"
    ],
    displays: [
      {
        id: "weather",
        name: "Weather Dashboard",
        enabled: true,
        updateInterval: 300 // seconds
      },
      {
        id: "system",
        name: "System Monitor",
        enabled: true,
        updateInterval: 5,
        components: ["hardware", "services"],
        errorBehavior: {
          enabled: true,
          showOnError: true,
          errorDisplayDuration: 300, // Show for 5 minutes when error occurs
          normalInterval: 3600 // Show once per hour normally
        }
      },
      {
        id: "space",
        name: "Space Tracker",
        enabled: true,
        updateInterval: 600,
        thresholds: {
          launchAlert: 24,    // Hours before launch to highlight
          issAlert: 30,       // Minutes before ISS pass to highlight
          maxPasses: 5        // Maximum number of ISS passes to display
        },
        datasources: {
          meteorShowers: true,
          lunarEvents: true,
          comets: true,
          celestialEvents: {
            provider: "astronomyapi"
          }
        }
      },
      {
        id: "port",
        name: "Port Traffic",
        enabled: true,
        updateInterval: 300
      },
      {
        id: "train",
        name: "Railroad Monitor",
        enabled: true,
        updateInterval: 60
      },
      {
        id: "photos",
        name: "Photo Slideshow",
        enabled: true,
        updateInterval: 30
      },
      {
        id: "webgl",
        name: "WebGL Demos",
        enabled: true,
        updateInterval: 300  // 5 minutes per demo
      },
      {
        id: "finance",
        name: "Market Dashboard",
        enabled: true,
        updateInterval: 60, // Update every minute
        stocks: {
          symbols: ["AAPL", "GOOGL", "MSFT"], // Default stocks
          updateInterval: 60 // Seconds
        }
      },
      {
        id: "flight",
        name: "Flight Tracker",
        enabled: true,
        updateInterval: 30, // Update every 30 seconds
        center: {
          lat: 30.9386,  // Using location from config
          lon: -88.6358
        },
        radius: 250 // km
      }
    ]
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
      symbols: ["AAPL", "GOOGL", "MSFT", "AMZN"],
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

module.exports = { config };

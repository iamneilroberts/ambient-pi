export const config = {
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
    interval: 30, // seconds per display (shortened for testing)
    idleTimeout: 10, // seconds before screensaver mode (shortened for testing)
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
        updateInterval: 5
      },
      {
        id: "space",
        name: "Space Tracker",
        enabled: true,
        updateInterval: 600
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
	}	      
    ]
  },

  // API Keys and External Services
  apis: {
    weather: {
      openWeatherMap: "YOUR_API_KEY",
      nwsOffice: "MOB", // Mobile, AL office
      radarStation: "KMOB"
    },
    space: {
      n2yo: "YOUR_API_KEY", // Satellite tracking
      launchLibrary: "YOUR_API_KEY"
    },
    marine: {
      marineTraffic: "YOUR_API_KEY",
      aisReceiver: {
        enabled: false,
        device: "/dev/ttyUSB0"
        // Add custom settings when hardware is set up
      }
    },
    railroad: {
      railroad_live: "YOUR_API_KEY",
      atcsMonitor: {
        enabled: false
        // Add custom settings when hardware is set up
      }
    }
  },

  // Local Services
  localServices: {
    pihole: {
      enabled: true,
      host: "pi.hole",
      apiKey: "YOUR_API_KEY"
    },
    adsb: {
      enabled: false,
      host: "localhost:8080"
      // Add custom settings when hardware is set up
    },
    photos: {
      enabled: true,
      source: "local", // or "google" or "nextcloud"
      path: "/home/neil/ambient-display/photos"
      // Add API keys if using cloud services
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
  }
};

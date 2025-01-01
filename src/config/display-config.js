export const config = {
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
  }
};

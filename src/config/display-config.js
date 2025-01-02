export const config = {
  // Theme Settings
  themes: {
    current: 'default', // Changed to default theme to reduce visual effects load
    available: {
      twenties: {
        name: 'Roaring Twenties',
        fontFamily: 'Playfair Display',
        colors: {
          primary: '#d4af37',
          background: '#000000',
          text: '#ffffff',
          accent: '#c0b283'
        },
        effects: {
          enableArtDeco: true
        }
      },
      steampunk: {
        name: 'Steampunk',
        fontFamily: 'IM Fell DW Pica',
        colors: {
          primary: '#b87333',
          background: '#1a0f00',
          text: '#d4a76a',
          accent: '#8b4513'
        },
        effects: {
          enableGear: true
        }
      },
      ratrod: {
        name: 'Rat Rod',
        fontFamily: 'Impact, sans-serif',
        colors: {
          primary: '#8b0000',
          background: '#1a1a1a',
          text: '#ffffff',
          accent: '#ff4500'
        },
        effects: {
          enableFlames: true
        }
      },
      miami: {
        name: 'Miami Vice',
        fontFamily: 'Helvetica Neue',
        colors: {
          primary: '#ff69b4',
          background: '#1a1a2e',
          text: '#ffffff',
          accent: '#00ffff'
        },
        effects: {
          enablePalmTrees: true
        }
      },
      mardigras: {
        name: 'Mardi Gras',
        fontFamily: 'Brush Script MT, cursive',
        colors: {
          primary: '#9453a6',
          background: '#000000',
          text: '#ffffff',
          accent: '#f2cc0f'
        },
        effects: {
          enableConfetti: true
        }
      },
      ocean: {
        name: 'Ocean Deep',
        fontFamily: 'sans-serif',
        colors: {
          primary: '#00a8ff',
          background: '#001e3c',
          text: '#e0f7ff',
          accent: '#00e5ff'
        },
        effects: {
          enableWaves: true,
          enableBubbles: true
        }
      },
      synthwave: {
        name: 'Synthwave',
        fontFamily: 'VT323',
        colors: {
          primary: '#ff00ff',
          background: '#1a0033',
          text: '#00ffff',
          accent: '#ff00aa'
        },
        effects: {
          enableGrid: true,
          enableGlow: true,
          enableNeonPulse: true
        }
      },
      cyberpunk: {
        name: 'Cyberpunk',
        fontFamily: 'VT323',
        colors: {
          primary: '#ff00ff',
          background: '#000033',
          text: '#00ffff',
          accent: '#ff00aa'
        },
        effects: {
          enableGlow: true,
          enableNeon: true,
          enableGlitch: true
        }
      },
      matrix: {
        name: 'Matrix',
        fontFamily: 'VT323',
        colors: {
          primary: '#00ff00',
          background: '#001100',
          text: '#00cc00',
          accent: '#003300'
        },
        effects: {
          enableMatrixRain: true,
          enableGlow: true
        }
      },
      sunset: {
        name: 'Sunset',
        fontFamily: 'sans-serif',
        colors: {
          primary: '#ff6b6b',
          background: '#2c3e50',
          text: '#f8c291',
          accent: '#e17055'
        },
        effects: {
          enableGradient: true,
          enableBloom: true
        }
      },
      default: {
        name: 'Default Theme',
        fontFamily: 'sans-serif',
        colors: {
          primary: 'rgb(59, 130, 246)',
          background: 'rgb(17, 24, 39)',
          text: 'rgb(229, 231, 235)',
          accent: 'rgb(99, 102, 241)'
        }
      },
      retro: {
        name: 'Retro Computer',
        fontFamily: 'VT323',
        colors: {
          primary: '#00ff00',
          background: '#000000',
          text: '#33ff33',
          accent: '#004400'
        },
        effects: {
          enableScanlines: false, // Disabled intensive animation
          enableGlow: false,      // Disabled complex filter
          enableFlicker: false    // Disabled rapid opacity changes
        }
      },
      christmas: {
        name: 'Christmas',
        fontFamily: 'Mountains of Christmas',
        colors: {
          primary: '#ff0000',
          background: '#ffffff',
          text: '#006400',
          accent: '#ffd700'
        },
        effects: {
          enableSnow: true,
          enableLights: true,
          enableBells: true
        }
      }
    }
  },
  // Display Rotation Settings
  rotation: {
    interval: 300, // Increased rotation interval to 5 minutes
    idleTimeout: 5, // seconds before screensaver mode
    enableTransitions: true,
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
        enabled: false, // Disabled WebGL demos to reduce GPU load
        updateInterval: 300
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
        updateInterval: 60, // Reduced flight tracker update frequency
        center: {
          lat: 30.9386,  // Using location from config
          lon: -88.6358
        },
        radius: 250 // km
      },
      {
        id: "calendar",
        name: "Calendar & Clock",
        enabled: true,
        updateInterval: 1, // Update every second for clock
        components: {
          clock: {
            styles: ["flip", "paper", "led"],
            rotationInterval: 60 // Rotate clock style every minute
          },
          calendar: {
            enabled: true,
            updateInterval: 300 // Update calendar events every 5 minutes
          }
        }
      }
    ]
  }
};

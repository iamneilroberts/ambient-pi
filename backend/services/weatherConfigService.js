const { config } = require('../../config.cjs');

class WeatherConfigService {
  constructor() {
    this.loadConfig();
  }

  loadConfig() {
    this.config = {
      nws: {
        baseUrl: 'https://api.weather.gov',
        office: config.apis?.weather?.nwsOffice,
        radarStation: config.apis?.weather?.radarStation,
        headers: {
          'User-Agent': 'Ambient-Pi Weather Display (neil@homelab.local)',
          'Accept': 'application/geo+json'
        }
      },
      openWeather: {
        baseUrl: 'https://api.openweathermap.org/data/2.5',
        apiKey: process.env.OPENWEATHER_API_KEY || config.apis?.weather?.openWeatherMap,
        units: 'imperial'
      }
    };

    // Validate required configuration
    if (!this.config.nws.office) {
      throw new Error('NWS office not configured');
    }

    if (!this.config.nws.radarStation) {
      throw new Error('NWS radar station not configured');
    }
  }

  get nwsConfig() {
    return this.config.nws;
  }

  get openWeatherConfig() {
    return this.config.openWeather;
  }

  get hasOpenWeatherKey() {
    return Boolean(this.config.openWeather.apiKey);
  }

  get nwsHeaders() {
    return this.config.nws.headers;
  }

  get radarStation() {
    return this.config.nws.radarStation;
  }

  validateLocation(lat, lon) {
    if (!lat || !lon) {
      throw new Error('Location coordinates are required');
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    if (isNaN(latitude) || isNaN(longitude)) {
      throw new Error('Invalid location coordinates');
    }

    if (latitude < -90 || latitude > 90) {
      throw new Error('Latitude must be between -90 and 90');
    }

    if (longitude < -180 || longitude > 180) {
      throw new Error('Longitude must be between -180 and 180');
    }

    return {
      lat: latitude.toFixed(4),
      lon: longitude.toFixed(4)
    };
  }
}

module.exports = new WeatherConfigService();

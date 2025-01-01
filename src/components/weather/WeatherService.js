import React from 'react';
import WeatherCache from './WeatherCache';
import WeatherAlerts from './WeatherAlerts';
import HourlyForecast from './HourlyForecast';
import WeatherRadar from './WeatherRadar';
import CurrentConditions from './CurrentConditions';
import { config } from '../../config/config.js';

export class WeatherService {
  constructor() {
    this.cache = new WeatherCache();
    this.baseUrls = {
      nws: 'https://api.weather.gov',
      openWeather: 'https://api.openweathermap.org/data/2.5'
    };
    
    this.openWeatherApiKey = config.apis.weather.openWeatherMap;
    this.nwsOffice = config.apis.weather.nwsOffice;
    this.radarStation = config.apis.weather.radarStation;
    
    this.retryConfig = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000
    };

    this.headers = {
      'User-Agent': '(ambient-pi.local, contact@example.com)',
      'Accept': 'application/geo+json'
    };
  }

  // Helper method for exponential backoff
  async fetchWithRetry(url, options = {}, attempt = 1) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: { ...this.headers, ...options.headers }
      });

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : this.calculateBackoff(attempt);
        
        if (attempt <= this.retryConfig.maxRetries) {
          console.log(`Rate limited. Retrying after ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.fetchWithRetry(url, options, attempt + 1);
        }
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response;

    } catch (error) {
      if (attempt <= this.retryConfig.maxRetries) {
        const delay = this.calculateBackoff(attempt);
        console.log(`Request failed. Retrying after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.fetchWithRetry(url, options, attempt + 1);
      }
      throw error;
    }
  }

  calculateBackoff(attempt) {
    const delay = Math.min(
      this.retryConfig.baseDelay * Math.pow(2, attempt - 1),
      this.retryConfig.maxDelay
    );
    return delay + Math.random() * 1000; // Add jitter
  }

  async getNWSPoints(lat, lon) {
    const cacheParams = { type: 'points', lat, lon };
    const cachedPoints = this.cache.get('points', cacheParams);
    
    if (cachedPoints) {
      return cachedPoints;
    }

    const response = await this.fetchWithRetry(
      `${this.baseUrls.nws}/points/${lat},${lon}`
    );

    const pointsData = await response.json();
    this.cache.set('points', cacheParams, pointsData);
    return pointsData;
  }

  async getWeatherData(lat, lon) {
    const cacheKey = `weather:${lat},${lon}`;
    console.log('Generated cache key:', cacheKey);
    
    try {
      // Check cache first
      const cachedData = this.cache.get('currentWeather', { type: 'currentWeather', key: cacheKey });

      
      if (cachedData) {
        console.log('Returning cached weather data');
        return cachedData;
      }

      // Try NWS first
      const nwsData = await this.getNWSWeather(lat, lon);
      console.log('Fetched NWS weather data:', nwsData);
	 this.cache.set('currentWeather', { type: 'currentWeather', key: cacheKey }, nwsData);
      return nwsData;

    } catch (error) {
      console.log('NWS API failed, falling back to OpenWeather:', error);
      
      // Try OpenWeather as fallback
      if (this.openWeatherApiKey) {
        try {
          const openWeatherData = await this.getOpenWeatherData(lat, lon);
          const transformedData = this.transformOpenWeatherData(openWeatherData);
          console.log('Fetched OpenWeather data (transformed):', transformedData);
          this.cache.set('current', { type: 'current', key: cacheKey }, transformedData);
          return transformedData;
        } catch (fallbackError) {
          console.error('Both weather services failed:', fallbackError);
          throw new Error('Unable to fetch weather data from any source');
        }
      } else {
        throw new Error('Weather service unavailable and no fallback configured');
      }
    }
  }

  async getNWSWeather(lat, lon) {
    try {
      const pointsData = await this.getNWSPoints(lat, lon);
      
      if (!pointsData?.properties?.forecast) {
        throw new Error('Invalid points data from NWS');
      }

      const forecastUrl = pointsData.properties.forecast;
      const hourlyForecastUrl = pointsData.properties.forecastHourly;

      const [forecastResponse, hourlyResponse] = await Promise.all([
        this.fetchWithRetry(forecastUrl),
        this.fetchWithRetry(hourlyForecastUrl)
      ]);
      
      if (!forecastResponse.ok || !hourlyResponse.ok) {
        throw new Error('Failed to fetch forecast data');
      }

      const [forecastData, hourlyData] = await Promise.all([
        forecastResponse.json(),
        hourlyResponse.json()
      ]);
      
      if (!forecastData?.properties?.periods?.[0]) {
        throw new Error('Invalid or empty forecast data received');
      }

      const currentPeriod = forecastData.properties.periods[0];
      
      const weatherData = {
        currentWeather: {
          temperature: currentPeriod.temperature,
          temperatureUnit: currentPeriod.temperatureUnit,
          windSpeed: currentPeriod.windSpeed,
          windDirection: currentPeriod.windDirection,
          shortForecast: currentPeriod.shortForecast,
          detailedForecast: currentPeriod.detailedForecast
        },
        forecast: forecastData.properties.periods.slice(1),
        hourly: hourlyData.properties.periods,
        metadata: {
          source: 'NWS',
          timestamp: new Date().toISOString(),
          station: pointsData.properties.radarStation
        }
      };

      return weatherData;

    } catch (error) {
      console.error('Error in getNWSWeather:', error);
      throw error;
    }
  }

  async getOpenWeatherData(lat, lon) {
    if (!this.openWeatherApiKey) {
      throw new Error('OpenWeather API key not configured');
    }

    const response = await fetch(
      `${this.baseUrls.openWeather}/weather?` + 
      `lat=${lat}&lon=${lon}&` +
      `appid=${this.openWeatherApiKey}&` +
      'units=imperial'
    );
    
    if (!response.ok) {
      throw new Error('OpenWeather API error');
    }

    return await response.json();
  }

  async getAlerts(lat, lon) {
    const cacheParams = { type: 'alerts', lat, lon };
    const cachedAlerts = this.cache.get('alerts', cacheParams);
    
    if (cachedAlerts) {
      return cachedAlerts;
    }

    try {
      const response = await this.fetchWithRetry(
        `${this.baseUrls.nws}/alerts/active?point=${lat},${lon}`
      );

      const alertsData = await response.json();
      this.cache.set('alerts', cacheParams, alertsData);
      return alertsData;
    } catch (error) {
      console.error('Error fetching alerts:', error);
      return { features: [] }; // Return empty alerts array on error
    }
  }

  transformOpenWeatherData(owData) {
    return {
      currentWeather: {
        temperature: Math.round(owData.main.temp),
        temperatureUnit: 'F',
        windSpeed: `${Math.round(owData.wind.speed)} mph`,
        windDirection: this.degreesToCardinal(owData.wind.deg),
        shortForecast: owData.weather[0].main,
        detailedForecast: owData.weather[0].description,
      },
      forecast: [],
      hourly: [],
      metadata: {
        source: 'OpenWeather',
        timestamp: new Date().toISOString()
      }
    };
  }


  degreesToCardinal(degrees) {
    const cardinals = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return cardinals[Math.round(degrees / 45) % 8];
  }

  getRadarUrls(radarStation) {
    if (!radarStation) return null;
    
    return {
      base: `https://radar.weather.gov/ridge/standard/${radarStation}_loop.gif`,
      velocity: `https://radar.weather.gov/ridge/standard/${radarStation}_vel_loop.gif`
    };
  }

  // Helper method to render weather components
// In WeatherService.js
  renderWeatherComponents(props) {
    const {
      weatherData = {},
      hourlyForecast = [],
      alerts = [],
      radarStation = null
    } = props;

    return {
      alerts: alerts?.length > 0 ? (
        <WeatherAlerts alerts={alerts} />
      ) : null,
      hourly: <HourlyForecast hourlyForecast={hourlyForecast} />,
      currentConditions: <CurrentConditions currentWeather={weatherData?.currentWeather || null} />,
      radar: radarStation ? (
        <WeatherRadar
          radarStation={radarStation}
          getRadarUrls={() => this.getRadarUrls(radarStation)}
        />
      ) : null
    };
  }
}

export default WeatherService;

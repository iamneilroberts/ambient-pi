import WeatherAlerts from './WeatherAlerts';
import HourlyForecast from './HourlyForecast';
import WeatherRadar from './WeatherRadar';
import CurrentConditions from './CurrentConditions';
import { config } from '../../config/config.js';

export class WeatherService {
  constructor() {
    this.baseUrl = '/api/weather';
    this.radarStation = config.apis?.weather?.radarStation;
  }

  async getWeatherData(lat, lon) {
    const response = await fetch(`${this.baseUrl}/current?lat=${lat}&lon=${lon}`);
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }
    return await response.json();
  }

  async getAlerts(lat, lon) {
    const response = await fetch(`${this.baseUrl}/alerts?lat=${lat}&lon=${lon}`);
    if (!response.ok) {
      throw new Error(`Weather alerts API error: ${response.status}`);
    }
    return await response.json();
  }

  getRadarUrls(radarStation) {
    if (!radarStation) return null;
    
    return {
      base: `https://radar.weather.gov/ridge/standard/${radarStation}_loop.gif`,
      velocity: `https://radar.weather.gov/ridge/standard/${radarStation}_vel_loop.gif`
    };
  }

  renderWeatherComponents(props) {
    const {
      weatherData = {},
      hourlyForecast = [],
      alerts = [],
      radarStation = null
    } = props;

    return {
      alerts: alerts.length > 0 ? (
        <WeatherAlerts alerts={alerts} />
      ) : null,
      hourly: <HourlyForecast hourlyForecast={hourlyForecast} />,
      currentConditions: <CurrentConditions currentWeather={weatherData.currentWeather || null} />,
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

class WeatherTransformService {
  transformNWSData(forecastData, hourlyData, pointsData) {
    if (!forecastData?.properties?.periods?.[0]) {
      throw new Error('Invalid or empty forecast data received');
    }

    const currentPeriod = forecastData.properties.periods[0];
    
    return {
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

  transformAlertsData(alertsData) {
    return {
      ...alertsData,
      metadata: {
        source: 'NWS',
        timestamp: new Date().toISOString()
      }
    };
  }

  degreesToCardinal(degrees) {
    const cardinals = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return cardinals[Math.round(degrees / 45) % 8];
  }

  validateWeatherData(data) {
    const requiredFields = ['currentWeather', 'forecast', 'hourly', 'metadata'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Invalid weather data: missing ${missingFields.join(', ')}`);
    }

    const currentWeatherFields = [
      'temperature',
      'temperatureUnit',
      'windSpeed',
      'windDirection',
      'shortForecast',
      'detailedForecast'
    ];

    const missingCurrentFields = currentWeatherFields.filter(
      field => !data.currentWeather[field]
    );

    if (missingCurrentFields.length > 0) {
      throw new Error(`Invalid current weather data: missing ${missingCurrentFields.join(', ')}`);
    }

    if (!Array.isArray(data.forecast)) {
      throw new Error('Invalid forecast data: must be an array');
    }

    if (!Array.isArray(data.hourly)) {
      throw new Error('Invalid hourly data: must be an array');
    }

    return true;
  }
}

module.exports = new WeatherTransformService();

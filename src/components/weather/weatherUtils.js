// Weather icon mapping
export const getWeatherIcon = (forecast) => {
  const description = forecast.toLowerCase();
  
  // Rain conditions
  if (description.includes('rain') || description.includes('shower')) {
    if (description.includes('light')) return '🌦';
    if (description.includes('heavy')) return '🌧';
    return '🌧';
  }
  
  // Snow conditions
  if (description.includes('snow')) {
    if (description.includes('light')) return '🌨';
    if (description.includes('heavy')) return '❄️';
    return '🌨';
  }
  
  // Thunderstorms
  if (description.includes('thunder') || description.includes('storm')) return '⛈';
  
  // Cloudy conditions
  if (description.includes('cloudy')) {
    if (description.includes('partly') || description.includes('mostly')) return '⛅';
    return '☁️';
  }
  
  // Clear conditions
  if (description.includes('clear') || description.includes('sunny')) {
    if (description.includes('partly')) return '⛅';
    return '☀️';
  }
  
  // Foggy conditions
  if (description.includes('fog')) return '🌫';
  
  // Default sunny
  return '☀️';
};

// Extract precipitation chance from forecast text
export const getPrecipitation = (detailedForecast) => {
  if (!detailedForecast) return null;
  const text = detailedForecast.toLowerCase();
  
  // Look for percentage patterns
  const percentMatch = text.match(/(\d+)(?:\s)?% chance of/);
  if (percentMatch) {
    return parseInt(percentMatch[1]);
  }
  
  return null;
};

// Transform alerts data for WeatherAlerts component
export const transformAlerts = (alerts) => {
  if (!alerts?.features) return [];
  return alerts.features.map(alert => ({
    event: alert.properties.event,
    expires: alert.properties.expires,
    headline: alert.properties.headline,
    description: alert.properties.description,
    severity: alert.properties.severity,
    urgency: alert.properties.urgency,
    areaDesc: alert.properties.areaDesc,
    instruction: alert.properties.instruction
  }));
};

// Chart configurations
export const chartConfig = {
  hourly: {
    margin: { top: 5, right: 5, bottom: 5, left: 0 },
    grid: {
      strokeDasharray: "3 3",
      stroke: "#374151"
    },
    xAxis: {
      stroke: "#9CA3AF",
      fontSize: 13,
      height: 30
    },
    yAxis: {
      temp: {
        stroke: "#9CA3AF",
        fontSize: 14,
        fontWeight: "bold",
        width: 45
      },
      precip: {
        stroke: "#60A5FA",
        domain: [0, 100]
      }
    },
    tooltip: {
      style: { backgroundColor: '#1F2937', border: 'none' }
    },
    temperature: {
      stroke: "#EF4444",
      strokeWidth: 2
    },
    precipitation: {
      fill: "#60A5FA",
      opacity: 0.3
    }
  },
  forecast: {
    margin: { top: 5, right: 5, bottom: 5, left: 0 },
    grid: {
      strokeDasharray: "3 3",
      stroke: "#374151"
    },
    xAxis: {
      stroke: "#9CA3AF",
      fontSize: 12,
      height: 20
    },
    yAxis: {
      temp: {
        stroke: "#9CA3AF",
        fontSize: 12,
        width: 35
      },
      precip: {
        stroke: "#60A5FA",
        domain: [0, 100]
      }
    },
    tooltip: {
      style: { backgroundColor: '#1F2937', border: 'none' }
    },
    temperature: {
      stroke: "#EF4444",
      strokeWidth: 2,
      dot: { fill: "#EF4444" }
    },
    precipitation: {
      fill: "#60A5FA",
      opacity: 0.3
    }
  }
};

// Alert severity colors
export const alertColors = {
  Extreme: 'bg-red-900/90',
  Severe: 'bg-orange-800/70',
  default: 'bg-orange-700/60'
};

// Wind direction mapping
export const getWindDirectionRotation = (direction) => {
  const directions = {
    'N': '0deg',
    'NE': '45deg',
    'E': '90deg',
    'SE': '135deg',
    'S': '180deg',
    'SW': '225deg',
    'W': '270deg',
    'NW': '315deg'
  };
  return directions[direction] || '0deg';
};

/**
 * Wetter-Service für Darmstadt
 * Nutzt Open-Meteo API (kostenlos, keine API-Key nötig)
 */

export interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  pressure: number;
  weatherCode: number;
  description: string;
  timestamp: Date;
}

export interface ForecastDay {
  date: string;
  maxTemp: number;
  minTemp: number;
  avgTemp: number;
  precipitation: number;
  weatherCode: number;
  description: string;
}

export interface ForecastData {
  days: ForecastDay[];
  source: string;
  fetchedAt: Date;
}

// Darmstadt Koordinaten
const DARMSTADT_LAT = 49.8717;
const DARMSTADT_LON = 8.6503;

// Wetter-Code zu Beschreibung
const weatherCodeMap: Record<number, string> = {
  0: 'Klarer Himmel',
  1: 'Überwiegend klar',
  2: 'Teilweise bewölkt',
  3: 'Bedeckt',
  45: 'Nebel',
  48: 'Gefrierender Nebel',
  51: 'Leichter Nieselregen',
  53: 'Mäßiger Nieselregen',
  55: 'Starker Nieselregen',
  61: 'Leichter Regen',
  63: 'Mäßiger Regen',
  65: 'Starker Regen',
  71: 'Leichter Schneefall',
  73: 'Mäßiger Schneefall',
  75: 'Starker Schneefall',
  77: 'Schneegriesel',
  80: 'Leichte Regenschauer',
  81: 'Mäßige Regenschauer',
  82: 'Starke Regenschauer',
  85: 'Leichte Schneeschauer',
  86: 'Starke Schneeschauer',
  95: 'Gewitter',
  96: 'Gewitter mit Hagel',
  99: 'Schweres Gewitter mit Hagel',
};

function getWeatherDescription(code: number): string {
  return weatherCodeMap[code] || 'Unbekannt';
}

/**
 * Aktuelles Wetter für Darmstadt abrufen
 */
export async function getCurrentWeather(): Promise<WeatherData> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${DARMSTADT_LAT}&longitude=${DARMSTADT_LON}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m&timezone=Europe/Berlin`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const current = data.current;

    return {
      temperature: current.temperature_2m,
      feelsLike: current.apparent_temperature,
      humidity: current.relative_humidity_2m,
      windSpeed: current.wind_speed_10m,
      windDirection: current.wind_direction_10m,
      pressure: current.surface_pressure,
      weatherCode: current.weather_code,
      description: getWeatherDescription(current.weather_code),
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Fehler beim Abrufen des Wetters:', error);
    throw new Error('Wetterdaten konnten nicht geladen werden');
  }
}

/**
 * 7-Tage Wettervorhersage für Darmstadt
 */
export async function getForecast(): Promise<ForecastData> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${DARMSTADT_LAT}&longitude=${DARMSTADT_LON}&daily=weather_code,temperature_2m_max,temperature_2m_min,temperature_2m_mean,precipitation_sum&timezone=Europe/Berlin&forecast_days=7`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const daily = data.daily;

    const days: ForecastDay[] = [];
    for (let i = 0; i < daily.time.length; i++) {
      days.push({
        date: daily.time[i],
        maxTemp: daily.temperature_2m_max[i],
        minTemp: daily.temperature_2m_min[i],
        avgTemp: daily.temperature_2m_mean?.[i] ?? 
          ((daily.temperature_2m_max[i] + daily.temperature_2m_min[i]) / 2),
        precipitation: daily.precipitation_sum[i],
        weatherCode: daily.weather_code[i],
        description: getWeatherDescription(daily.weather_code[i]),
      });
    }

    return {
      days,
      source: 'Open-Meteo',
      fetchedAt: new Date(),
    };
  } catch (error) {
    console.error('Fehler beim Abrufen der Vorhersage:', error);
    throw new Error('Wettervorhersage konnte nicht geladen werden');
  }
}

/**
 * Prüft ob morgen kälter wird als heute
 * Nützlich für Heizungs-Optimierung
 */
export function isTomorrowColderThanToday(forecast: ForecastData): boolean {
  if (forecast.days.length < 2) return false;
  const today = forecast.days[0];
  const tomorrow = forecast.days[1];
  return tomorrow.minTemp < today.minTemp;
}

/**
 * Berechnet den Temperatur-Trend über die nächsten Tage
 */
export function getTemperatureTrend(forecast: ForecastData): 'falling' | 'rising' | 'stable' {
  if (forecast.days.length < 2) return 'stable';
  
  const firstDay = forecast.days[0];
  const lastDay = forecast.days[forecast.days.length - 1];
  const diff = lastDay.avgTemp - firstDay.avgTemp;
  
  if (diff < -2) return 'falling';
  if (diff > 2) return 'rising';
  return 'stable';
}

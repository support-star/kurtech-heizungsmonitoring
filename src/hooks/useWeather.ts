/**
 * React Hook für Wetterdaten
 */
import { useState, useEffect, useCallback } from 'react';
import { getCurrentWeather, getForecast, type WeatherData, type ForecastData } from '@/services/weather';

interface UseWeatherReturn {
  current: WeatherData | null;
  forecast: ForecastData | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  lastUpdated: Date | null;
}

const REFRESH_INTERVAL = 10 * 60 * 1000; // 10 Minuten

export function useWeather(): UseWeatherReturn {
  const [current, setCurrent] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchWeather = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [currentData, forecastData] = await Promise.all([
        getCurrentWeather(),
        getForecast(),
      ]);

      setCurrent(currentData);
      setForecast(forecastData);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial laden
  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  // Automatisch aktualisieren
  useEffect(() => {
    const interval = setInterval(fetchWeather, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchWeather]);

  return {
    current,
    forecast,
    loading,
    error,
    refresh: fetchWeather,
    lastUpdated,
  };
}

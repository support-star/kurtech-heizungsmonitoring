/**
 * React Hook für Strompreise
 */
import { useState, useEffect, useCallback } from 'react';
import { getCurrentPrice, type PriceData, getHeatingRecommendation } from '@/services/energy';

interface UseEnergyPricesReturn {
  data: PriceData | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  lastUpdated: Date | null;
  recommendation: 'heat_now' | 'wait' | 'normal' | null;
}

const REFRESH_INTERVAL = 15 * 60 * 1000; // 15 Minuten

export function useEnergyPrices(): UseEnergyPricesReturn {
  const [data, setData] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchPrices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const priceData = await getCurrentPrice();
      setData(priceData);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial laden
  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  // Automatisch aktualisieren
  useEffect(() => {
    const interval = setInterval(fetchPrices, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  const recommendation = data ? getHeatingRecommendation(data) : null;

  return {
    data,
    loading,
    error,
    refresh: fetchPrices,
    lastUpdated,
    recommendation,
  };
}

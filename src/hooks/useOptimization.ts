/**
 * React Hook für Optimierungs-Empfehlungen
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useWeather } from './useWeather';
import { useEnergyPrices } from './useEnergyPrices';
import {
  calculateOptimalSchedule,
  type OptimizationResult,
  type OptimizationRecommendation,
} from '@/services/optimization';

interface UseOptimizationReturn {
  result: OptimizationResult | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  shouldHeatNow: boolean;
  highPriorityRecommendations: OptimizationRecommendation[];
}

export function useOptimization(): UseOptimizationReturn {
  const { forecast, loading: weatherLoading, error: weatherError } = useWeather();
  const { data: prices, loading: pricesLoading, error: pricesError } = useEnergyPrices();
  
  const [result, setResult] = useState<OptimizationResult | null>(null);

  const calculateOptimization = useCallback(() => {
    if (forecast && prices) {
      try {
        const optResult = calculateOptimalSchedule(forecast, prices);
        setResult(optResult);
      } catch (err) {
        console.error('Optimierungsfehler:', err);
      }
    }
  }, [forecast, prices]);

  // Berechne bei Datenänderung
  useEffect(() => {
    calculateOptimization();
  }, [calculateOptimization]);

  const loading = weatherLoading || pricesLoading;
  const error = weatherError || pricesError || null;

  const shouldHeatNow = useMemo(() => {
    if (!result) return false;
    return result.recommendations.some(r => r.type === 'heat_now' && r.priority === 'high');
  }, [result]);

  const highPriorityRecommendations = useMemo(() => {
    if (!result) return [];
    return result.recommendations.filter(r => r.priority === 'high');
  }, [result]);

  return {
    result,
    loading,
    error,
    refresh: calculateOptimization,
    shouldHeatNow,
    highPriorityRecommendations,
  };
}

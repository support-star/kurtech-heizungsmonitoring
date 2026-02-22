/**
 * React Hook für System-Monitoring
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  checkInternetConnection,
  checkSystemHealth,
  calculateOverallStatus,
  shouldEscalate,
  scheduleChecks,
  type MonitoringState,
} from '@/services/monitoring';

interface UseMonitoringProps {
  isMqttConnected: boolean;
  lastDataTimestamp: Date | null;
  checkIntervalMs?: number;
}

interface UseMonitoringReturn {
  state: MonitoringState;
  checkNow: () => Promise<void>;
  isChecking: boolean;
  hasEscalation: boolean;
  escalationHours: number;
}

const DEFAULT_STATE: MonitoringState = {
  internet: {
    name: 'Internet',
    status: 'unknown',
    message: 'Noch nicht geprüft',
    lastCheck: new Date(),
    nextCheck: new Date(),
  },
  mqtt: {
    name: 'MQTT-Broker',
    status: 'unknown',
    message: 'Noch nicht geprüft',
    lastCheck: new Date(),
    nextCheck: new Date(),
  },
  dataFreshness: {
    name: 'Daten-Aktualität',
    status: 'unknown',
    message: 'Noch nicht geprüft',
    lastCheck: new Date(),
    nextCheck: new Date(),
  },
  overall: 'unknown',
  escalationLevel: 0,
  lastEscalation: null,
};

export function useMonitoring({
  isMqttConnected,
  lastDataTimestamp,
  checkIntervalMs = 4 * 60 * 60 * 1000, // 4h
}: UseMonitoringProps): UseMonitoringReturn {
  const [state, setState] = useState<MonitoringState>(DEFAULT_STATE);
  const [isChecking, setIsChecking] = useState(false);
  const alarmStartTimeRef = useRef<Date | null>(null);

  const performCheck = useCallback(async () => {
    setIsChecking(true);

    try {
      // Internet prüfen
      const internet = await checkInternetConnection();

      // MQTT und Daten prüfen
      const { mqtt, data } = checkSystemHealth(isMqttConnected, lastDataTimestamp);

      // Gesamt-Status berechnen
      const overall = calculateOverallStatus([internet, mqtt, data]);

      // Eskalation prüfen
      let escalationLevel = 0;
      let lastEscalation = state.lastEscalation;

      if (overall === 'error') {
        if (!alarmStartTimeRef.current) {
          alarmStartTimeRef.current = new Date();
        }
        const escalation = shouldEscalate(alarmStartTimeRef.current);
        if (escalation.shouldEscalate) {
          escalationLevel = 2;
          lastEscalation = new Date();
        } else {
          escalationLevel = 1;
        }
      } else {
        alarmStartTimeRef.current = null;
        escalationLevel = 0;
      }

      setState({
        internet,
        mqtt,
        dataFreshness: data,
        overall,
        escalationLevel,
        lastEscalation,
      });
    } catch (error) {
      console.error('Monitoring check failed:', error);
    } finally {
      setIsChecking(false);
    }
  }, [isMqttConnected, lastDataTimestamp, state.lastEscalation]);

  // Initial check + regelmäßige Checks
  useEffect(() => {
    performCheck();
    const cleanup = scheduleChecks(performCheck, checkIntervalMs);
    return cleanup;
  }, [performCheck, checkIntervalMs]);

  const hasEscalation = state.escalationLevel >= 2;
  const escalationHours = alarmStartTimeRef.current 
    ? Math.round((new Date().getTime() - alarmStartTimeRef.current.getTime()) / (1000 * 60 * 60) * 10) / 10
    : 0;

  return {
    state,
    checkNow: performCheck,
    isChecking,
    hasEscalation,
    escalationHours,
  };
}

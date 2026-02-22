/**
 * React Hook für Heizungs-Steuerung
 */
import { useState, useEffect, useCallback } from 'react';
import {
  type HeatingMode,
  type HeatingSchedule,
  type HeatingControlState,
  loadControlState,
  saveControlState,
  sendControlCommand,
  calculateTargetTemp,
  getActiveSchedule,
  DEFAULT_SCHEDULE,
} from '@/services/heatingControl';

interface UseHeatingControlReturn {
  state: HeatingControlState;
  setMode: (mode: HeatingMode) => Promise<void>;
  setTargetTemp: (temp: number) => Promise<void>;
  enableManualOverride: () => void;
  disableManualOverride: () => void;
  addSchedule: (schedule: Omit<HeatingSchedule, 'id'>) => void;
  updateSchedule: (id: string, updates: Partial<HeatingSchedule>) => void;
  removeSchedule: (id: string) => void;
  toggleSchedule: (id: string) => void;
  activeSchedule: HeatingSchedule | null;
  isLoading: boolean;
  error: string | null;
}

const DEFAULT_STATE: HeatingControlState = {
  mode: 'comfort',
  targetTemp: 22,
  isHeating: false,
  currentTemp: 20,
  schedule: DEFAULT_SCHEDULE,
  manualOverride: false,
  manualOverrideUntil: null,
};

export function useHeatingControl(
  currentTemp: number = 20,
  isHeating: boolean = false
): UseHeatingControlReturn {
  const [state, setState] = useState<HeatingControlState>(DEFAULT_STATE);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initial laden
  useEffect(() => {
    const stored = loadControlState();
    setState(prev => ({
      ...prev,
      ...stored,
      currentTemp,
      isHeating,
    }));
  }, [currentTemp, isHeating]);

  // Speichern bei Änderungen
  useEffect(() => {
    saveControlState({
      mode: state.mode,
      targetTemp: state.targetTemp,
      schedule: state.schedule,
      manualOverride: state.manualOverride,
      manualOverrideUntil: state.manualOverrideUntil,
    });
  }, [state.mode, state.targetTemp, state.schedule, state.manualOverride, state.manualOverrideUntil]);

  // Modus ändern
  const setMode = useCallback(async (mode: HeatingMode) => {
    setIsLoading(true);
    setError(null);

    const result = await sendControlCommand('setMode', mode);
    
    if (result.success) {
      setState(prev => ({
        ...prev,
        mode,
        targetTemp: calculateTargetTemp(mode, prev.schedule, prev.manualOverride),
      }));
    } else {
      setError(result.error || 'Fehler beim Setzen des Modus');
    }

    setIsLoading(false);
  }, [state.schedule, state.manualOverride]);

  // Sollwert ändern
  const setTargetTemp = useCallback(async (temp: number) => {
    setIsLoading(true);
    setError(null);

    const result = await sendControlCommand('setTemp', temp);
    
    if (result.success) {
      setState(prev => ({
        ...prev,
        targetTemp: temp,
        manualOverride: true,
        manualOverrideUntil: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2h Override
      }));
    } else {
      setError(result.error || 'Fehler beim Setzen der Temperatur');
    }

    setIsLoading(false);
  }, []);

  // Manuelle Überschreibung aktivieren
  const enableManualOverride = useCallback(() => {
    setState(prev => ({
      ...prev,
      manualOverride: true,
      manualOverrideUntil: new Date(Date.now() + 2 * 60 * 60 * 1000),
    }));
  }, []);

  // Manuelle Überschreibung deaktivieren
  const disableManualOverride = useCallback(() => {
    setState(prev => ({
      ...prev,
      manualOverride: false,
      manualOverrideUntil: null,
      targetTemp: calculateTargetTemp(prev.mode, prev.schedule, false),
    }));
  }, []);

  // Zeitplan hinzufügen
  const addSchedule = useCallback((schedule: Omit<HeatingSchedule, 'id'>) => {
    const newSchedule: HeatingSchedule = {
      ...schedule,
      id: `schedule-${Date.now()}`,
    };
    setState(prev => ({
      ...prev,
      schedule: [...prev.schedule, newSchedule],
    }));
  }, []);

  // Zeitplan aktualisieren
  const updateSchedule = useCallback((id: string, updates: Partial<HeatingSchedule>) => {
    setState(prev => ({
      ...prev,
      schedule: prev.schedule.map(s => 
        s.id === id ? { ...s, ...updates } : s
      ),
    }));
  }, []);

  // Zeitplan entfernen
  const removeSchedule = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      schedule: prev.schedule.filter(s => s.id !== id),
    }));
  }, []);

  // Zeitplan ein/ausschalten
  const toggleSchedule = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      schedule: prev.schedule.map(s => 
        s.id === id ? { ...s, enabled: !s.enabled } : s
      ),
    }));
  }, []);

  const activeSchedule = getActiveSchedule(state.schedule);

  return {
    state,
    setMode,
    setTargetTemp,
    enableManualOverride,
    disableManualOverride,
    addSchedule,
    updateSchedule,
    removeSchedule,
    toggleSchedule,
    activeSchedule,
    isLoading,
    error,
  };
}

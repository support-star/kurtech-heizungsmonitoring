/**
 * Heizungs-Steuerungs-Service
 * Verwaltet Modi, Sollwerte und Zeitpläne
 */

export type HeatingMode = 'comfort' | 'eco' | 'away' | 'vacation';

export interface HeatingSchedule {
  id: string;
  name: string;
  enabled: boolean;
  days: number[]; // 0=So, 1=Mo, ..., 6=Sa
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  targetTemp: number;
  mode: HeatingMode;
}

export interface HeatingControlState {
  mode: HeatingMode;
  targetTemp: number;
  isHeating: boolean;
  currentTemp: number;
  schedule: HeatingSchedule[];
  manualOverride: boolean;
  manualOverrideUntil: Date | null;
}

// Sollwerte pro Modus (°C)
export const MODE_TEMPERATURES: Record<HeatingMode, number> = {
  comfort: 22,
  eco: 19,
  away: 16,
  vacation: 10,
};

export const MODE_LABELS: Record<HeatingMode, string> = {
  comfort: 'Komfort',
  eco: 'Eco',
  away: 'Abwesend',
  vacation: 'Urlaub',
};

export const MODE_DESCRIPTIONS: Record<HeatingMode, string> = {
  comfort: 'Angenehme 22°C für zu Hause',
  eco: 'Energiesparende 19°C',
  away: 'Reduziert auf 16°C wenn niemand da',
  vacation: 'Minimal 10°C für Frostschutz',
};

// Standard-Zeitplan
export const DEFAULT_SCHEDULE: HeatingSchedule[] = [
  {
    id: 'morning',
    name: 'Morgens',
    enabled: true,
    days: [1, 2, 3, 4, 5], // Mo-Fr
    startTime: '06:00',
    endTime: '08:00',
    targetTemp: 22,
    mode: 'comfort',
  },
  {
    id: 'evening',
    name: 'Abends',
    enabled: true,
    days: [1, 2, 3, 4, 5, 6, 0], // Täglich
    startTime: '17:00',
    endTime: '22:00',
    targetTemp: 22,
    mode: 'comfort',
  },
  {
    id: 'night',
    name: 'Nachts',
    enabled: true,
    days: [1, 2, 3, 4, 5, 6, 0], // Täglich
    startTime: '22:00',
    endTime: '06:00',
    targetTemp: 19,
    mode: 'eco',
  },
];

const STORAGE_KEY = 'bauverein_heating_control';

/**
 * Lädt die Steuerungs-Konfiguration aus localStorage
 */
export function loadControlState(): Partial<HeatingControlState> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...parsed,
        manualOverrideUntil: parsed.manualOverrideUntil ? new Date(parsed.manualOverrideUntil) : null,
      };
    }
  } catch {
    // Ignorieren
  }
  return {
    mode: 'comfort',
    targetTemp: 22,
    schedule: DEFAULT_SCHEDULE,
  };
}

/**
 * Speichert die Steuerungs-Konfiguration
 */
export function saveControlState(state: Partial<HeatingControlState>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignorieren
  }
}

/**
 * Prüft ob ein Zeitplan aktuell aktiv sein sollte
 */
export function isScheduleActive(schedule: HeatingSchedule): boolean {
  if (!schedule.enabled) return false;

  const now = new Date();
  const currentDay = now.getDay();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  if (!schedule.days.includes(currentDay)) return false;

  // Zeitbereich prüfen
  if (schedule.startTime <= schedule.endTime) {
    // Normaler Bereich (z.B. 06:00-22:00)
    return currentTime >= schedule.startTime && currentTime <= schedule.endTime;
  } else {
    // Über Mitternacht (z.B. 22:00-06:00)
    return currentTime >= schedule.startTime || currentTime <= schedule.endTime;
  }
}

/**
 * Findet den aktuell aktiven Zeitplan
 */
export function getActiveSchedule(schedules: HeatingSchedule[]): HeatingSchedule | null {
  return schedules.find(isScheduleActive) || null;
}

/**
 * Berechnet den Sollwert basierend auf Zeitplan und Modus
 */
export function calculateTargetTemp(
  mode: HeatingMode,
  schedules: HeatingSchedule[],
  manualOverride: boolean
): number {
  if (manualOverride) {
    return MODE_TEMPERATURES[mode];
  }

  const activeSchedule = getActiveSchedule(schedules);
  if (activeSchedule) {
    return activeSchedule.targetTemp;
  }

  return MODE_TEMPERATURES[mode];
}

/**
 * Sendet Steuerbefehl an die Anlage (Mock - würde MQTT verwenden)
 */
export async function sendControlCommand(
  command: 'setMode' | 'setTemp' | 'enableSchedule' | 'disableSchedule',
  value: unknown
): Promise<{ success: boolean; error?: string }> {
  try {
    // Hier würde der MQTT-Befehl gesendet werden
    console.log(`Steuerbefehl: ${command} = ${JSON.stringify(value)}`);
    
    // Simulierte Verzögerung
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unbekannter Fehler' 
    };
  }
}

/**
 * Monitoring-Service für System-Überwachung
 * Prüft Internet, MQTT-Verbindung und Daten-Aktualität
 */

export type SystemStatus = 'healthy' | 'warning' | 'error' | 'unknown';

export interface HealthCheck {
  name: string;
  status: SystemStatus;
  message: string;
  lastCheck: Date;
  nextCheck: Date;
}

export interface MonitoringState {
  internet: HealthCheck;
  mqtt: HealthCheck;
  dataFreshness: HealthCheck;
  overall: SystemStatus;
  escalationLevel: number; // 0 = normal, 1 = warning, 2 = critical
  lastEscalation: Date | null;
}

export interface AlarmRule {
  id: string;
  name: string;
  condition: 'offline' | 'no_data' | 'high_temp' | 'low_temp' | 'custom';
  threshold?: number;
  enabled: boolean;
  notifyAfterMinutes: number;
  escalateAfterHours: number;
}

// Standard-Alarmregeln
export const DEFAULT_ALARM_RULES: AlarmRule[] = [
  {
    id: 'internet-offline',
    name: 'Internet-Verbindung',
    condition: 'offline',
    enabled: true,
    notifyAfterMinutes: 5,
    escalateAfterHours: 4,
  },
  {
    id: 'mqtt-disconnect',
    name: 'MQTT-Verbindung',
    condition: 'offline',
    enabled: true,
    notifyAfterMinutes: 5,
    escalateAfterHours: 2,
  },
  {
    id: 'no-data',
    name: 'Keine Daten',
    condition: 'no_data',
    enabled: true,
    notifyAfterMinutes: 15,
    escalateAfterHours: 4,
  },
  {
    id: 'high-temp',
    name: 'Zu hohe Temperatur',
    condition: 'high_temp',
    threshold: 70,
    enabled: true,
    notifyAfterMinutes: 0,
    escalateAfterHours: 13,
  },
];

const CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000; // 4 Stunden
const ESCALATION_THRESHOLD_HOURS = 13;

/**
 * Prüft Internet-Verbindung via Ping zu 8.8.8.8
 * In Browser-Context: Fetch zu einem zuverlässigen Endpoint
 */
export async function checkInternetConnection(): Promise<HealthCheck> {
  const now = new Date();
  const nextCheck = new Date(now.getTime() + CHECK_INTERVAL_MS);

  try {
    // Verwende einen zuverlässigen Endpoint
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch('https://8.8.8.8', {
      method: 'HEAD',
      mode: 'no-cors',
      signal: controller.signal,
    });
    void response; // Response wird nicht verwendet, nur Verbindung prüfen

    clearTimeout(timeout);

    return {
      name: 'Internet',
      status: 'healthy',
      message: 'Verbindung hergestellt',
      lastCheck: now,
      nextCheck,
    };
  } catch {
    // Fallback: Versuche Google DNS
    try {
      await fetch('https://dns.google/resolve?name=example.com', {
        method: 'GET',
        mode: 'cors',
      });
      return {
        name: 'Internet',
        status: 'healthy',
        message: 'Verbindung hergestellt (Fallback)',
        lastCheck: now,
        nextCheck,
      };
    } catch {
      return {
        name: 'Internet',
        status: 'error',
        message: 'Keine Internet-Verbindung',
        lastCheck: now,
        nextCheck,
      };
    }
  }
}

/**
 * Prüft MQTT-Verbindung und Daten-Aktualität
 */
export function checkSystemHealth(
  isMqttConnected: boolean,
  lastDataTimestamp: Date | null,
  maxDataAgeMinutes: number = 30
): { mqtt: HealthCheck; data: HealthCheck } {
  const now = new Date();
  const nextCheck = new Date(now.getTime() + CHECK_INTERVAL_MS);

  // MQTT-Status
  const mqtt: HealthCheck = {
    name: 'MQTT-Broker',
    status: isMqttConnected ? 'healthy' : 'error',
    message: isMqttConnected ? 'Verbunden' : 'Nicht verbunden',
    lastCheck: now,
    nextCheck,
  };

  // Daten-Aktualität
  let dataStatus: SystemStatus = 'unknown';
  let dataMessage = 'Keine Daten verfügbar';

  if (lastDataTimestamp) {
    const ageMinutes = (now.getTime() - lastDataTimestamp.getTime()) / (1000 * 60);
    
    if (ageMinutes < 5) {
      dataStatus = 'healthy';
      dataMessage = `Daten aktuell (${Math.round(ageMinutes)} Min. alt)`;
    } else if (ageMinutes < maxDataAgeMinutes) {
      dataStatus = 'warning';
      dataMessage = `Daten veraltet (${Math.round(ageMinutes)} Min. alt)`;
    } else {
      dataStatus = 'error';
      dataMessage = `Keine aktuellen Daten (${Math.round(ageMinutes)} Min. alt)`;
    }
  }

  const data: HealthCheck = {
    name: 'Daten-Aktualität',
    status: dataStatus,
    message: dataMessage,
    lastCheck: now,
    nextCheck,
  };

  return { mqtt, data };
}

/**
 * Berechnet Gesamt-Status
 */
export function calculateOverallStatus(checks: HealthCheck[]): SystemStatus {
  if (checks.some(c => c.status === 'error')) return 'error';
  if (checks.some(c => c.status === 'warning')) return 'warning';
  if (checks.every(c => c.status === 'healthy')) return 'healthy';
  return 'unknown';
}

/**
 * Prüft ob Eskalation nötig (nach 13h)
 */
export function shouldEscalate(
  alarmStartTime: Date,
  currentTime: Date = new Date()
): { shouldEscalate: boolean; hoursElapsed: number } {
  const hoursElapsed = (currentTime.getTime() - alarmStartTime.getTime()) / (1000 * 60 * 60);
  return {
    shouldEscalate: hoursElapsed >= ESCALATION_THRESHOLD_HOURS,
    hoursElapsed: Math.round(hoursElapsed * 10) / 10,
  };
}

/**
 * Zeitplan für Checks erstellen
 * Führt Checks alle 4h durch
 */
export function scheduleChecks(
  callback: () => void,
  intervalMs: number = CHECK_INTERVAL_MS
): () => void {
  // Sofort ausführen
  callback();

  // Interval einrichten
  const interval = setInterval(callback, intervalMs);

  // Cleanup-Funktion zurückgeben
  return () => clearInterval(interval);
}

/**
 * Speichert Monitoring-Status im localStorage
 */
export function saveMonitoringState(state: Partial<MonitoringState>): void {
  try {
    localStorage.setItem('bauverein_monitoring', JSON.stringify({
      ...state,
      lastUpdate: new Date().toISOString(),
    }));
  } catch {
    // Ignorieren
  }
}

/**
 * Lädt Monitoring-Status aus localStorage
 */
export function loadMonitoringState(): Partial<MonitoringState> | null {
  try {
    const stored = localStorage.getItem('bauverein_monitoring');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignorieren
  }
  return null;
}

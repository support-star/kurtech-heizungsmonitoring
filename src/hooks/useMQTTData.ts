import { useState, useEffect, useCallback, useRef } from 'react';
import type { HeatingData, Alarm, TimeRange } from '@/types/heating';
import { MQTT_CONFIG, SIM_CONFIG, getSimulationMode } from '@/config/runtime.config';
import { generateLiveData, generateHistoricalData, generateAlarms } from '@/lib/simulation';

interface UseMQTTDataReturn {
  liveData: HeatingData | null;
  historicalData: HeatingData[];
  alarms: Alarm[];
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  acknowledgeAlarm: (id: string) => void;
  exportData: () => string;
  isConnected: boolean;
  connectionError: string | null;
  reconnect: () => void;
  isSimulation: boolean;
}

// ─── Simulation-Modus ─────────────────────────────────────────
function useSimulationData(): UseMQTTDataReturn {
  const [liveData, setLiveData] = useState<HeatingData | null>(null);
  const [historicalData, setHistoricalData] = useState<HeatingData[]>([]);
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');

  // Initialisierung
  useEffect(() => {
    setLiveData(generateLiveData());
    setAlarms(generateAlarms());
  }, []);

  // Live-Daten-Updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveData(generateLiveData());
    }, SIM_CONFIG.updateIntervalMs);
    return () => clearInterval(interval);
  }, []);

  // Historische Daten bei Zeitbereich-Änderung
  useEffect(() => {
    const hours = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720;
    setHistoricalData(generateHistoricalData(hours, SIM_CONFIG.historyResolutionMinutes));
  }, [timeRange]);

  // Gelegentlich neue Alarme erzeugen
  useEffect(() => {
    const alarmMessages = [
      { type: 'info' as const, title: 'Abtauzyklus gestartet', message: 'Automatischer Abtauzyklus wird durchgeführt.' },
      { type: 'warning' as const, title: 'Hoher Stromverbrauch', message: 'Stromverbrauch über 7 kWh. COP prüfen.' },
      { type: 'info' as const, title: 'Sollwert erreicht', message: 'Pufferspeicher hat Solltemperatur erreicht. Wechsel auf Standby.' },
    ];
    let msgIndex = 0;

    const interval = setInterval(() => {
      if (Math.random() > 0.6) { // 40% Chance auf neuen Alarm
        const msg = alarmMessages[msgIndex % alarmMessages.length];
        msgIndex++;
        setAlarms(prev => [{
          id: `sim-live-${Date.now()}`,
          ...msg,
          timestamp: new Date(),
          acknowledged: false,
        }, ...prev]);
      }
    }, SIM_CONFIG.alarmCheckIntervalMs);
    return () => clearInterval(interval);
  }, []);

  const acknowledgeAlarm = useCallback((id: string) => {
    setAlarms(prev =>
      prev.map(a => a.id === id ? { ...a, acknowledged: true } : a)
    );
  }, []);

  const exportData = useCallback(() => {
    return buildCSV(historicalData.length > 0 ? historicalData : liveData ? [liveData] : []);
  }, [historicalData, liveData]);

  return {
    liveData, historicalData, alarms, timeRange, setTimeRange,
    acknowledgeAlarm, exportData,
    isConnected: true,
    connectionError: null,
    reconnect: () => {},
    isSimulation: true,
  };
}

// ─── MQTT-Modus ───────────────────────────────────────────────
function useMQTTLiveData(): UseMQTTDataReturn {
  const [liveData, setLiveData] = useState<HeatingData | null>(null);
  const [historicalData, setHistoricalData] = useState<HeatingData[]>([]);
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const clientRef = useRef<ReturnType<typeof import('mqtt').connect> | null>(null);
  const dataBufferRef = useRef<Partial<HeatingData>>({});

  const connectMQTT = useCallback(async () => {
    try {
      setConnectionError(null);
      const mqtt = await import('mqtt');

      const client = mqtt.connect(MQTT_CONFIG.broker, {
        username: MQTT_CONFIG.username,
        password: MQTT_CONFIG.password,
        clientId: `${MQTT_CONFIG.clientIdPrefix}-${Math.random().toString(36).substring(7)}`,
        reconnectPeriod: MQTT_CONFIG.reconnectPeriod,
        connectTimeout: MQTT_CONFIG.connectTimeout,
      });

      client.on('connect', () => {
        setIsConnected(true);
        setConnectionError(null);
        const topics = Object.values(MQTT_CONFIG.topics);
        client.subscribe(topics, (err) => {
          if (err) setConnectionError('Fehler beim Abonnieren der Topics');
        });
      });

      client.on('message', (topic, message) => {
        const value = message.toString();
        const topicMap: Record<string, { key: keyof HeatingData; parser: (v: string) => any }> = {
          [MQTT_CONFIG.topics.aussentemperatur]:    { key: 'aussentemperatur', parser: parseFloat },
          [MQTT_CONFIG.topics.vorlauftemperatur]:   { key: 'vorlauftemperatur', parser: parseFloat },
          [MQTT_CONFIG.topics.ruecklauftemperatur]: { key: 'ruecklauftemperatur', parser: parseFloat },
          [MQTT_CONFIG.topics.puffer_oben]:         { key: 'puffer_oben', parser: parseFloat },
          [MQTT_CONFIG.topics.puffer_mitte]:        { key: 'puffer_mitte', parser: parseFloat },
          [MQTT_CONFIG.topics.puffer_unten]:        { key: 'puffer_unten', parser: parseFloat },
          [MQTT_CONFIG.topics.drehzahl_pumpe]:      { key: 'drehzahl_pumpe', parser: parseInt },
          [MQTT_CONFIG.topics.stromverbrauch]:      { key: 'stromverbrauch', parser: parseFloat },
          [MQTT_CONFIG.topics.cop]:                 { key: 'cop', parser: parseFloat },
          [MQTT_CONFIG.topics.betriebsstunden]:     { key: 'betriebsstunden', parser: parseFloat },
          [MQTT_CONFIG.topics.status]:              { key: 'status', parser: (v) => v as HeatingData['status'] },
          [MQTT_CONFIG.topics.fehlercode]:          { key: 'fehlercode', parser: (v) => v || null },
        };

        if (topic === MQTT_CONFIG.topics.alarm) {
          try {
            const d = JSON.parse(value);
            setAlarms(prev => [{
              id: d.id || Date.now().toString(),
              type: d.type || 'info',
              title: d.title || 'Alarm',
              message: d.message || '',
              timestamp: new Date(d.timestamp || Date.now()),
              acknowledged: false,
            }, ...prev]);
          } catch { /* ignore parse errors */ }
          return;
        }

        const mapping = topicMap[topic];
        if (mapping) {
          dataBufferRef.current[mapping.key] = mapping.parser(value);
          setLiveData(prev => ({
            ...prev,
            timestamp: new Date(),
            [mapping.key]: mapping.parser(value),
          } as HeatingData));
        }
      });

      client.on('error', (err) => {
        setConnectionError(err.message);
        setIsConnected(false);
      });
      client.on('disconnect', () => setIsConnected(false));
      client.on('offline', () => setIsConnected(false));

      clientRef.current = client;
    } catch (err) {
      setConnectionError('Verbindung fehlgeschlagen');
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    const simMode = getSimulationMode();
    if (simMode) return; // Don't connect in simulation mode
    connectMQTT();
    return () => { clientRef.current?.end(); };
  }, [connectMQTT]);

  useEffect(() => {
    setHistoricalData([]); // Historische Daten müssten von einer API kommen
  }, [timeRange]);

  const acknowledgeAlarm = useCallback((id: string) => {
    setAlarms(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
  }, []);

  const exportData = useCallback(() => {
    return buildCSV(historicalData.length > 0 ? historicalData : liveData ? [liveData] : []);
  }, [historicalData, liveData]);

  const reconnect = useCallback(() => {
    clientRef.current?.end();
    connectMQTT();
  }, [connectMQTT]);

  return {
    liveData, historicalData, alarms, timeRange, setTimeRange,
    acknowledgeAlarm, exportData, isConnected, connectionError, reconnect,
    isSimulation: false,
  };
}

// ─── CSV-Export Hilfsfunktion ─────────────────────────────────
function buildCSV(data: HeatingData[]): string {
  const headers = [
    'Zeitstempel', 'Außentemp (°C)', 'Vorlauf (°C)', 'Rücklauf (°C)',
    'Puffer oben (°C)', 'Puffer mitte (°C)', 'Puffer unten (°C)',
    'Pumpe (U/min)', 'Strom (kWh)', 'COP', 'Betriebsstd', 'Status',
  ];
  const rows = data.map(d => [
    d.timestamp.toISOString(),
    d.aussentemperatur, d.vorlauftemperatur, d.ruecklauftemperatur,
    d.puffer_oben, d.puffer_mitte, d.puffer_unten,
    d.drehzahl_pumpe, d.stromverbrauch, d.cop,
    d.betriebsstunden.toFixed(1), d.status,
  ]);
  return [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
}

// ─── Öffentlicher Hook ───────────────────────────────────────
export function useMQTTData(): UseMQTTDataReturn {
  // Runtime-check for simulation mode (can be toggled without rebuild)
  const isSim = getSimulationMode();
  const simData = useSimulationData();
  const mqttData = useMQTTLiveData();
  return isSim ? simData : mqttData;
}

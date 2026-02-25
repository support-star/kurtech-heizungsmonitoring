import { useState, useEffect, useCallback, useRef } from 'react';
import type { HeatingData, Alarm, TimeRange } from '@/types/heating';
import { SIM_CONFIG, getSimulationMode } from '@/config/runtime.config';
import { generateLiveData, generateHistoricalData, generateAlarms } from '@/lib/simulation';

// Backend URL - MQTT Credentials sind NUR serverseitig
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://bauverein.kurtech.shop';
const WS_URL = BACKEND_URL.replace(/^http/, 'ws') + '/ws';

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

// ─── Simulation (unverändert) ─────────────────────────────────
function useSimulationData(): UseMQTTDataReturn {
  const [liveData, setLiveData] = useState<HeatingData | null>(null);
  const [historicalData, setHistoricalData] = useState<HeatingData[]>([]);
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');

  useEffect(() => { setLiveData(generateLiveData()); setAlarms(generateAlarms()); }, []);
  useEffect(() => { const i = setInterval(() => setLiveData(generateLiveData()), SIM_CONFIG.updateIntervalMs); return () => clearInterval(i); }, []);
  useEffect(() => { const h = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720; setHistoricalData(generateHistoricalData(h, SIM_CONFIG.historyResolutionMinutes)); }, [timeRange]);

  useEffect(() => {
    const msgs = [
      { type: 'info' as const, title: 'Abtauzyklus gestartet', message: 'Automatischer Abtauzyklus wird durchgeführt.' },
      { type: 'warning' as const, title: 'Hoher Stromverbrauch', message: 'Stromverbrauch über 7 kWh. COP prüfen.' },
      { type: 'info' as const, title: 'Sollwert erreicht', message: 'Pufferspeicher hat Solltemperatur erreicht.' },
    ];
    let idx = 0;
    const i = setInterval(() => { if (Math.random() > 0.6) { const m = msgs[idx++ % msgs.length]; setAlarms(p => [{ id: `sim-${Date.now()}`, ...m, timestamp: new Date(), acknowledged: false }, ...p]); } }, SIM_CONFIG.alarmCheckIntervalMs);
    return () => clearInterval(i);
  }, []);

  const acknowledgeAlarm = useCallback((id: string) => setAlarms(p => p.map(a => a.id === id ? { ...a, acknowledged: true } : a)), []);
  const exportData = useCallback(() => buildCSV(historicalData.length ? historicalData : liveData ? [liveData] : []), [historicalData, liveData]);

  return { liveData, historicalData, alarms, timeRange, setTimeRange, acknowledgeAlarm, exportData, isConnected: true, connectionError: null, reconnect: () => {}, isSimulation: true };
}

// ─── Backend WebSocket Modus ──────────────────────────────────
function useBackendLiveData(): UseMQTTDataReturn {
  const [liveData, setLiveData] = useState<HeatingData | null>(null);
  const [historicalData, setHistoricalData] = useState<HeatingData[]>([]);
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getToken = () => localStorage.getItem('bauverein_jwt');

  const connect = useCallback(() => {
    const token = getToken();
    if (!token) { setConnectionError('Kein Auth-Token. Bitte neu einloggen.'); return; }

    if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close(); }

    const ws = new WebSocket(`${WS_URL}?token=${encodeURIComponent(token)}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setConnectionError(null);
      pingRef.current = setInterval(() => { if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'ping' })); }, 25000);
    };

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        switch (msg.type) {
          case 'data': setLiveData({ ...msg.payload, timestamp: new Date(msg.payload.timestamp) }); break;
          case 'history': setHistoricalData(msg.payload.map((d: any) => ({ ...d, timestamp: new Date(d.timestamp) }))); break;
          case 'alarms': setAlarms(msg.payload.map((a: any) => ({ ...a, timestamp: new Date(a.timestamp) }))); break;
          case 'alarm': setAlarms(p => [{ ...msg.payload, timestamp: new Date(msg.payload.timestamp) }, ...p]); break;
          case 'alarm_acked': setAlarms(p => p.map(a => a.id === msg.id ? { ...a, acknowledged: true } : a)); break;
          case 'error': setConnectionError(msg.message); break;
        }
      } catch { /* ignore */ }
    };

    ws.onclose = (evt) => {
      setIsConnected(false);
      if (pingRef.current) clearInterval(pingRef.current);
      if (evt.code === 4001) { setConnectionError('Nicht autorisiert. Bitte neu einloggen.'); return; }
      setConnectionError('Verbindung unterbrochen. Verbinde neu...');
      reconnectRef.current = setTimeout(connect, 5000);
    };

    ws.onerror = () => { setConnectionError('Verbindung fehlgeschlagen'); setIsConnected(false); };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      if (pingRef.current) clearInterval(pingRef.current);
      if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close(); }
    };
  }, [connect]);

  useEffect(() => {
    const hours = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720;
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'get_history', hours }));
    }
  }, [timeRange]);

  const acknowledgeAlarm = useCallback((id: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(JSON.stringify({ type: 'ack_alarm', id }));
    setAlarms(p => p.map(a => a.id === id ? { ...a, acknowledged: true } : a));
  }, []);

  const exportData = useCallback(() => buildCSV(historicalData.length ? historicalData : liveData ? [liveData] : []), [historicalData, liveData]);
  const reconnect = useCallback(() => { if (reconnectRef.current) clearTimeout(reconnectRef.current); connect(); }, [connect]);

  return { liveData, historicalData, alarms, timeRange, setTimeRange, acknowledgeAlarm, exportData, isConnected, connectionError, reconnect, isSimulation: false };
}

function buildCSV(data: HeatingData[]): string {
  const h = ['Zeitstempel','Außentemp (°C)','Vorlauf (°C)','Rücklauf (°C)','Puffer oben (°C)','Puffer mitte (°C)','Puffer unten (°C)','Pumpe (U/min)','Strom (kWh)','COP','Betriebsstd','Status'];
  const r = data.map(d => [d.timestamp.toISOString(),d.aussentemperatur,d.vorlauftemperatur,d.ruecklauftemperatur,d.puffer_oben,d.puffer_mitte,d.puffer_unten,d.drehzahl_pumpe,d.stromverbrauch,d.cop,d.betriebsstunden.toFixed(1),d.status]);
  return [h.join(';'),...r.map(row => row.join(';'))].join('\n');
}

export function useMQTTData(): UseMQTTDataReturn {
  const isSim = getSimulationMode();
  const sim = useSimulationData();
  const live = useBackendLiveData();
  return isSim ? sim : live;
}

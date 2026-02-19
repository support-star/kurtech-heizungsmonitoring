import { useState, useEffect, useCallback, useRef } from 'react';
import type { HeatingData, Alarm, TimeRange } from '@/types/heating';

// Simulierte Echtzeit-Daten
function generateLiveData(): HeatingData {
  const now = new Date();
  const baseTemp = 5 + Math.sin(now.getHours() / 24 * Math.PI * 2) * 3;
  
  return {
    timestamp: now,
    aussentemperatur: Math.round((baseTemp + (Math.random() - 0.5) * 2) * 10) / 10,
    vorlauftemperatur: Math.round((35 + Math.random() * 5) * 10) / 10,
    ruecklauftemperatur: Math.round((30 + Math.random() * 4) * 10) / 10,
    puffer_oben: Math.round((55 + Math.random() * 3) * 10) / 10,
    puffer_mitte: Math.round((45 + Math.random() * 4) * 10) / 10,
    puffer_unten: Math.round((38 + Math.random() * 3) * 10) / 10,
    drehzahl_pumpe: Math.round(1200 + Math.random() * 400),
    stromverbrauch: Math.round(2.5 + Math.random() * 1.5 * 10) / 10,
    cop: Math.round((3.2 + Math.random() * 0.8) * 10) / 10,
    betriebsstunden: 2847 + Math.random() * 10,
    fehlercode: null,
    status: Math.random() > 0.1 ? 'heizen' : 'standby',
  };
}

// Generiere historische Daten
function generateHistoricalData(hours: number): HeatingData[] {
  const data: HeatingData[] = [];
  const now = new Date();
  
  for (let i = hours; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
    const baseTemp = 5 + Math.sin((timestamp.getHours() / 24) * Math.PI * 2) * 3;
    
    data.push({
      timestamp,
      aussentemperatur: Math.round((baseTemp + (Math.random() - 0.5) * 3) * 10) / 10,
      vorlauftemperatur: Math.round((35 + Math.sin(i / 10) * 5 + Math.random() * 2) * 10) / 10,
      ruecklauftemperatur: Math.round((30 + Math.sin(i / 10) * 4 + Math.random() * 2) * 10) / 10,
      puffer_oben: Math.round((55 + Math.sin(i / 8) * 3) * 10) / 10,
      puffer_mitte: Math.round((45 + Math.sin(i / 8) * 4) * 10) / 10,
      puffer_unten: Math.round((38 + Math.sin(i / 8) * 3) * 10) / 10,
      drehzahl_pumpe: Math.round(1200 + Math.sin(i / 6) * 300 + Math.random() * 200),
      stromverbrauch: Math.round((2.5 + Math.sin(i / 12) * 1 + Math.random() * 0.5) * 10) / 10,
      cop: Math.round((3.2 + Math.sin(i / 15) * 0.5 + Math.random() * 0.3) * 10) / 10,
      betriebsstunden: 2847 + (hours - i) * 0.5,
      fehlercode: null,
      status: i % 8 < 6 ? 'heizen' : 'standby',
    });
  }
  
  return data;
}

// Generiere Alarme
function generateAlarms(): Alarm[] {
  return [
    {
      id: '1',
      type: 'info',
      title: 'Wartung fällig',
      message: 'Die jährliche Wartung steht in 14 Tagen an.',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      acknowledged: false,
    },
    {
      id: '2',
      type: 'warning',
      title: 'Niedrige Außentemperatur',
      message: 'Außentemperatur unter 0°C. Frostschutz aktiv.',
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
      acknowledged: true,
    },
    {
      id: '3',
      type: 'info',
      title: 'System-Update',
      message: 'Firmware-Update erfolgreich installiert.',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      acknowledged: true,
    },
  ];
}

interface UseHeatingDataReturn {
  liveData: HeatingData | null;
  historicalData: HeatingData[];
  alarms: Alarm[];
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  acknowledgeAlarm: (id: string) => void;
  exportData: () => string;
  isConnected: boolean;
}

export function useHeatingData(): UseHeatingDataReturn {
  const [liveData, setLiveData] = useState<HeatingData | null>(null);
  const [historicalData, setHistoricalData] = useState<HeatingData[]>([]);
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [isConnected, setIsConnected] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialisierung
  useEffect(() => {
    setLiveData(generateLiveData());
    setAlarms(generateAlarms());
    setIsConnected(true);

    // Echtzeit-Updates alle 5 Sekunden
    intervalRef.current = setInterval(() => {
      setLiveData(generateLiveData());
    }, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Historische Daten bei Zeitbereich-Änderung
  useEffect(() => {
    const hours = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720;
    setHistoricalData(generateHistoricalData(hours));
  }, [timeRange]);

  const acknowledgeAlarm = useCallback((id: string) => {
    setAlarms(prev => 
      prev.map(alarm => 
        alarm.id === id ? { ...alarm, acknowledged: true } : alarm
      )
    );
  }, []);

  const exportData = useCallback(() => {
    const data = historicalData.length > 0 ? historicalData : liveData ? [liveData] : [];
    
    const headers = [
      'Zeitstempel',
      'Außentemperatur (°C)',
      'Vorlauftemperatur (°C)',
      'Rücklauftemperatur (°C)',
      'Puffer oben (°C)',
      'Puffer mitte (°C)',
      'Puffer unten (°C)',
      'Drehzahl Pumpe (U/min)',
      'Stromverbrauch (kWh)',
      'COP',
      'Betriebsstunden',
      'Status',
    ];

    const rows = data.map(d => [
      d.timestamp.toISOString(),
      d.aussentemperatur,
      d.vorlauftemperatur,
      d.ruecklauftemperatur,
      d.puffer_oben,
      d.puffer_mitte,
      d.puffer_unten,
      d.drehzahl_pumpe,
      d.stromverbrauch,
      d.cop,
      d.betriebsstunden.toFixed(1),
      d.status,
    ]);

    return [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
  }, [historicalData, liveData]);

  return {
    liveData,
    historicalData,
    alarms,
    timeRange,
    setTimeRange,
    acknowledgeAlarm,
    exportData,
    isConnected,
  };
}

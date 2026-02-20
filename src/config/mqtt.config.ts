/**
 * MQTT & App-Konfiguration – KurTech Heizungs-Monitoring
 * ======================================================
 * Angepasst für WAGO PFC200 Darmstadt 2026
 */

// ─── Datenquelle ──────────────────────────────────────────────
export let useSimulation = false; // PRODUKTION: Echte MQTT-Daten

export function setSimulationMode(enabled: boolean) {
  useSimulation = enabled;
}

// ─── MQTT Broker ──────────────────────────────────────────────
export const MQTT_CONFIG = {
  // WebSocket für Browser (Mosquitto muss ws-Port 9001 haben!)
  // Falls nicht: TCP-Bridge oder MQTT-over-WebSocket-Proxy nötig
  broker: 'ws://187.77.75.165:9002',
  username: '', // Anonymous auth auf Pi
  password: '',
  clientIdPrefix: 'kurtech-web-darmstadt',

  reconnectPeriod: 5000,
  connectTimeout: 10000,
  keepalive: 60,

  // WAGO MQTT Topics (aus CODESYS PRG_Mqtt)
  topics: {
    // Temperaturen
    aussentemperatur:    'darmstadt/temp/aussen',
    vorlauftemperatur:   'darmstadt/temp/wp175_vl',
    ruecklauftemperatur: 'darmstadt/temp/wp175_rl',
    quelle_vl:           'darmstadt/temp/source_vl',
    quelle_rl:           'darmstadt/temp/source_rl',
    
    // Puffer (falls vorhanden)
    puffer_oben:         'darmstadt/temp/puffer_oben',
    puffer_mitte:        'darmstadt/temp/puffer_mitte',
    puffer_unten:        'darmstadt/temp/puffer_unten',
    
    // Pumpen / Aktoren
    drehzahl_pumpe:      'darmstadt/pump/drehzahl',
    
    // Leistung / Energie
    stromverbrauch:      'darmstadt/power/strom',
    cop:                 'darmstadt/efficiency/cop',
    
    // Betrieb
    betriebsstunden:     'darmstadt/runtime/hours',
    status:              'darmstadt/status/mode',
    fehlercode:          'darmstadt/alarm/code',
    alarm:               'darmstadt/alarm/active',
  },
} as const;

// ─── Anlage ───────────────────────────────────────────────────
export const ANLAGE_CONFIG = {
  id: 'WP-Darmstadt-2026',
  name: 'Wärmepumpenanlage Darmstadt 2026',
  address: 'Darmstadt',
  gesamtleistung: '175 kW',
  waermepumpeElektrisch: '38,9 kW',
  pufferHeizung: '1500 L',
  pufferPVT: '2000 L',
  pufferKaelte: '1000 L',
  glycolAnteil: '30%',
  auslegungDeltaT: '3 K',
  massenstrom: '42,1 m³/h',
  ansprechdruckSV: '3,5 bar',
};

// ─── Simulation (Fallback) ────────────────────────────────────
export const SIM_CONFIG = {
  updateIntervalMs: 5000,
  historyResolutionMinutes: 15,
  alarmCheckIntervalMs: 30000,
  thresholds: {
    vorlaufMax: 55,
    ruecklaufMax: 50,
    aussenMin: -15,
    aussenMax: 35,
    copMin: 2.5,
    pufferObenMax: 65,
    stromverbrauchMax: 40,
  },
};

// ─── Branding ─────────────────────────────────────────────────
export const BRAND = {
  name: 'KurTech',
  fullName: 'KurTech GmbH',
  product: 'Heizungs-Monitoring Darmstadt',
  version: '2.1-WAGO',
  colors: {
    primary: '#00B37D',
    primaryDark: '#009966',
    accent: '#22D3EE',
    warning: '#F59E0B',
    error: '#EF4444',
  },
};

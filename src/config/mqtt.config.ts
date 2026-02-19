/**
 * MQTT & App-Konfiguration – KurTech Heizungs-Monitoring
 * ======================================================
 *
 * Simulationsmodus:  useSimulation = true  → Keine Broker-Verbindung nötig
 * Produktionsmodus:  useSimulation = false → Verbindet sich mit MQTT-Broker
 */

// ─── Datenquelle ──────────────────────────────────────────────
export let useSimulation = true; // true = Demo mit simulierten Daten

export function setSimulationMode(enabled: boolean) {
  useSimulation = enabled;
}

// ─── MQTT Broker ──────────────────────────────────────────────
export const MQTT_CONFIG = {
  broker: 'ws://187.77.75.165:9001',
  username: 'iot',
  password: 'darmstadt2026',
  clientIdPrefix: 'kurtech-web',

  reconnectPeriod: 5000,
  connectTimeout: 10000,
  keepalive: 60,

  topics: {
    aussentemperatur:    'kurtech/wp001/aussentemperatur',
    vorlauftemperatur:   'kurtech/wp001/vorlauftemperatur',
    ruecklauftemperatur: 'kurtech/wp001/ruecklauftemperatur',
    puffer_oben:         'kurtech/wp001/puffer/oben',
    puffer_mitte:        'kurtech/wp001/puffer/mitte',
    puffer_unten:        'kurtech/wp001/puffer/unten',
    drehzahl_pumpe:      'kurtech/wp001/pumpe/drehzahl',
    stromverbrauch:      'kurtech/wp001/stromverbrauch',
    cop:                 'kurtech/wp001/cop',
    betriebsstunden:     'kurtech/wp001/betriebsstunden',
    status:              'kurtech/wp001/status',
    fehlercode:          'kurtech/wp001/fehlercode',
    alarm:               'kurtech/wp001/alarm',
  },
} as const;

// ─── Anlage ───────────────────────────────────────────────────
export const ANLAGE_CONFIG = {
  id: 'WP-001',
  name: 'Wärmepumpenanlage Darmstadt',
  address: 'Darmstadt 2026',
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

// ─── Simulation ───────────────────────────────────────────────
export const SIM_CONFIG = {
  updateIntervalMs: 3000,
  historyResolutionMinutes: 15,
  alarmCheckIntervalMs: 30000,
  thresholds: {
    vorlaufMax: 55,
    ruecklaufMax: 50,
    aussenMin: -10,
    copMin: 2.5,
    pufferObenMax: 65,
    stromverbrauchMax: 8,
  },
};

// ─── Branding ─────────────────────────────────────────────────
export const BRAND = {
  name: 'KurTech',
  fullName: 'KurTech GmbH',
  product: 'Heizungs-Monitoring',
  version: '2.0',
  colors: {
    primary: '#00B37D',
    primaryDark: '#009966',
    accent: '#22D3EE',
    warning: '#F59E0B',
    error: '#EF4444',
  },
};

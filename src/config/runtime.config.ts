/**
 * Runtime-Konfiguration - Lädt Einstellungen aus Umgebungsvariablen
 * Ermöglicht Deployment ohne Code-Änderung
 * PATCH4: Live-Modus fix - SIMULATION_MODE immer false
 */

// Kunden-Daten
export const CUSTOMER = {
    name: import.meta.env.VITE_CUSTOMER_NAME || 'Bauverein AG',
    address: import.meta.env.VITE_CUSTOMER_ADDRESS || 'Siemensstraße 20, 64289 Darmstadt',
    id: import.meta.env.VITE_CUSTOMER_ID || 'bauverein-darmstadt',
};

// Modus-Konfiguration (Demo vs. Echt)
// PATCH4 FIX: || true entfernt - jetzt immer false (Live-Modus)
export const SIMULATION_MODE = import.meta.env.VITE_SIMULATION_MODE === 'true';

export function getSimulationMode(): boolean {
    // Prüfe auch localStorage für Runtime-Override
  const stored = localStorage.getItem('bauverein_simulation_mode');
    if (stored !== null) {
          return stored === 'true';
    }
    return SIMULATION_MODE;
}

export function setSimulationMode(mode: boolean): void {
    localStorage.setItem('bauverein_simulation_mode', String(mode));
    window.location.reload();
}

// MQTT-Konfiguration
export const MQTT_CONFIG = {
    broker: import.meta.env.VITE_MQTT_BROKER || 'wss://bauverein.kurtech.shop:9002',
    username: import.meta.env.VITE_MQTT_USERNAME || 'wago',
    password: import.meta.env.VITE_MQTT_PASSWORD || 'wago123',
    clientIdPrefix: import.meta.env.VITE_MQTT_CLIENT_PREFIX || 'bauverein',
    reconnectPeriod: 5000,
    connectTimeout: 10000,
    keepalive: 60,
    topics: {
          aussentemperatur:    import.meta.env.VITE_MQTT_TOPIC_AUSSEN      || 'darmstadt/gross/temp/aussen',
          vorlauftemperatur:   import.meta.env.VITE_MQTT_TOPIC_VORLAUF     || 'darmstadt/gross/temp/wp175_vl',
          ruecklauftemperatur: import.meta.env.VITE_MQTT_TOPIC_RUECKLAUF   || 'darmstadt/gross/temp/wp175_rl',
          quelle_vl:           import.meta.env.VITE_MQTT_TOPIC_QUELLE_VL   || 'darmstadt/gross/temp/source_vl',
          quelle_rl:           import.meta.env.VITE_MQTT_TOPIC_QUELLE_RL   || 'darmstadt/gross/temp/source_rl',
          puffer_oben:         import.meta.env.VITE_MQTT_TOPIC_PUFFER_OBEN || 'darmstadt/gross/temp/puffer_h1',
          puffer_mitte:        import.meta.env.VITE_MQTT_TOPIC_PUFFER_MITTE|| 'darmstadt/gross/temp/puffer_h2',
          puffer_unten:        import.meta.env.VITE_MQTT_TOPIC_PUFFER_UNTEN|| 'darmstadt/gross/temp/puffer_h3',
          drehzahl_pumpe:      import.meta.env.VITE_MQTT_TOPIC_PUMPE       || 'darmstadt/gross/pump/p01_speed',
          stromverbrauch:      import.meta.env.VITE_MQTT_TOPIC_STROM       || 'darmstadt/gross/power/strom',
          cop:                 import.meta.env.VITE_MQTT_TOPIC_COP         || 'darmstadt/gross/efficiency/cop',
          betriebsstunden:     import.meta.env.VITE_MQTT_TOPIC_BETRIEBSSTUNDEN || 'darmstadt/gross/runtime/p06_hours',
          status:              import.meta.env.VITE_MQTT_TOPIC_STATUS      || 'darmstadt/gross/status/run',
          fehlercode:          import.meta.env.VITE_MQTT_TOPIC_FEHLERCODE  || 'darmstadt/gross/alarm/code',
          alarm:               import.meta.env.VITE_MQTT_TOPIC_ALARM       || 'darmstadt/gross/alarm/active',
    },
} as const;

// Anlagen-Konfiguration
export const ANLAGE_CONFIG = {
    id: CUSTOMER.id,
    name: import.meta.env.VITE_ANLAGE_NAME || `Wärmepumpenanlage ${CUSTOMER.name}`,
    address: CUSTOMER.address,
    gesamtleistung: `${import.meta.env.VITE_ANLAGE_LEISTUNG_THERMISCH || 175} kW`,
    waermepumpeElektrisch: `${import.meta.env.VITE_ANLAGE_LEISTUNG_ELEKTRISCH || 38.9} kW`,
    pufferHeizung: `${import.meta.env.VITE_ANLAGE_PUFFER_HEIZUNG || 1500} L`,
    pufferPVT: `${import.meta.env.VITE_ANLAGE_PUFFER_PVT || 2000} L`,
    pufferKaelte: `${import.meta.env.VITE_ANLAGE_PUFFER_KAELTE || 1000} L`,
    glycolAnteil: '30%',
    auslegungDeltaT: '3 K',
    massenstrom: '42,1 m³/h',
    ansprechdruckSV: '3,5 bar',
};

// Simulation-Config
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

// Branding
export const BRAND = {
    name: CUSTOMER.name,
    fullName: CUSTOMER.name,
    product: `Heizungs-Monitoring ${CUSTOMER.name}`,
    version: '2.1-Bauverein',
    colors: {
          primary: '#00B37D',
          primaryDark: '#009966',
          accent: '#22D3EE',
          warning: '#F59E0B',
          error: '#EF4444',
    },
};

// Feature-Toggles
export const FEATURES = {
    enableExport: import.meta.env.VITE_ENABLE_EXPORT !== 'false',
    enableAlarmAck: import.meta.env.VITE_ENABLE_ALARM_ACK !== 'false',
    enableSettings: import.meta.env.VITE_ENABLE_SETTINGS !== 'false',
    enableModeSwitch: true,
};

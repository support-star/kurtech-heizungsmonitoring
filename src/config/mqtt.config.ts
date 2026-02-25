/**
 * MQTT & App-Konfiguration – KurTech Heizungs-Monitoring
 * ======================================================
 * Angepasst für WAGO PFC200 Darmstadt 2026
 * PATCH4: Live-Modus, VPS Mosquitto, WAGO flache Topics | Build: 2026-02-24
 */

// ─── Datenquelle ──────────────────────────────────────────────
// true = Demo mit simulierten Daten, false = MQTT-Broker
export const SIMULATION_MODE = false;

export function getSimulationMode(): boolean {
      return SIMULATION_MODE;
}

// ─── MQTT Broker ──────────────────────────────────────────────
export const MQTT_CONFIG = {
      // WebSocket Port 9002 auf VPS Mosquitto
          broker: 'wss://bauverein.kurtech.shop:9001',
      username: 'wago',
      password: 'wago123',
      clientIdPrefix: 'kurtech-web-darmstadt',

      reconnectPeriod: 5000,
      connectTimeout: 10000,
      keepalive: 60,

      // WAGO MQTT Topics (PATCH4 - flache Scalar-Werte)
      topics: {
              // Temperaturen
        aussentemperatur:    'darmstadt/gross/temp/aussen',
              vorlauftemperatur:   'darmstadt/gross/temp/wp175_vl',
              ruecklauftemperatur: 'darmstadt/gross/temp/wp175_rl',
              quelle_vl:           'darmstadt/gross/temp/source_vl',
              quelle_rl:           'darmstadt/gross/temp/source_rl',

              // Puffer Heizung
              puffer_oben:         'darmstadt/gross/temp/puffer_h1',
              puffer_mitte:        'darmstadt/gross/temp/puffer_h2',
              puffer_unten:        'darmstadt/gross/temp/puffer_h3',

              // Pumpen / Aktoren
              drehzahl_pumpe:      'darmstadt/gross/pump/p01_speed',

              // Leistung / Energie
              stromverbrauch:      'darmstadt/gross/power/strom',
              cop:                 'darmstadt/gross/efficiency/cop',

              // Betrieb
              betriebsstunden:     'darmstadt/gross/runtime/p06_hours',
              status:              'darmstadt/gross/status/run',
              fehlercode:          'darmstadt/gross/alarm/code',
              alarm:               'darmstadt/gross/alarm/active',
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

/**
 * Simulationsengine für realistische Heizungsdaten
 * =================================================
 * Erzeugt physikalisch plausible Datenverläufe:
 * - Tagesgang der Außentemperatur (Sinus-Modell)
 * - Heizkurven-abhängige Vorlauf/Rücklauf-Temperatur
 * - Pufferspeicher-Schichtung
 * - COP abhängig von Außentemperatur
 * - Betriebsmodi-Wechsel (Heizen, Standby, Abtauen)
 */

import type { HeatingData, Alarm } from '@/types/heating';

// ─── Interne Zustandsvariablen für glatte Übergänge ──────────
let _betriebsstunden = 2847.5;
let _lastUpdate = Date.now();
let _statusCycle = 0;
let _abtauTimer = 0;

/** Simulierte Außentemperatur mit Tagesgang */
function simAussentemperatur(date: Date): number {
  const hour = date.getHours() + date.getMinutes() / 60;
  // Minimum ~6 Uhr, Maximum ~15 Uhr
  const tagesgang = -Math.cos(((hour - 6) / 24) * 2 * Math.PI) * 4;
  // Basistemperatur Februar: ca. 2°C
  const basis = 2;
  // Leichtes Rauschen
  const noise = (Math.random() - 0.5) * 0.6;
  return Math.round((basis + tagesgang + noise) * 10) / 10;
}

/** Vorlauftemperatur basierend auf Heizkurve */
function simVorlauf(aussen: number, status: string): number {
  if (status === 'standby') return 25 + Math.random() * 2;
  // Heizkurve: Je kälter draußen, desto höher der Vorlauf
  const base = 40 - aussen * 0.8;
  const clamped = Math.max(30, Math.min(55, base));
  return Math.round((clamped + (Math.random() - 0.5) * 1.5) * 10) / 10;
}

/** Rücklauf = Vorlauf - Spreizung */
function simRuecklauf(vorlauf: number, status: string): number {
  if (status === 'standby') return 22 + Math.random() * 2;
  const spreizung = 4 + Math.random() * 1.5; // 4-5.5 K Spreizung
  return Math.round((vorlauf - spreizung) * 10) / 10;
}

/** Pufferspeicher-Schichtung */
function simPuffer(vorlauf: number, status: string) {
  const base = status === 'heizen' ? vorlauf + 8 : vorlauf;
  return {
    oben:  Math.round((base + 5 + (Math.random() - 0.5) * 2) * 10) / 10,
    mitte: Math.round((base - 2 + (Math.random() - 0.5) * 2) * 10) / 10,
    unten: Math.round((base - 10 + (Math.random() - 0.5) * 2) * 10) / 10,
  };
}

/** COP abhängig von Außentemperatur – realistischer Carnot-Näherung */
function simCOP(aussen: number, vorlauf: number): number {
  // Idealer COP = Tvorlauf / (Tvorlauf - Taussen) * eta
  const eta = 0.45; // Gütegrad
  const tVL = vorlauf + 273.15;
  const tAussen = aussen + 273.15;
  const idealCOP = tVL / (tVL - tAussen);
  const realCOP = idealCOP * eta;
  const clamped = Math.max(2.0, Math.min(6.0, realCOP));
  return Math.round((clamped + (Math.random() - 0.5) * 0.3) * 10) / 10;
}

/** Stromverbrauch basierend auf COP und thermischer Leistung */
function simStromverbrauch(cop: number, status: string): number {
  if (status === 'standby') return Math.round((0.3 + Math.random() * 0.2) * 10) / 10;
  if (status === 'abtauen') return Math.round((5 + Math.random() * 1) * 10) / 10;
  // Thermische Leistung ~30-50 kW bei Teillast
  const thermalPower = 35 + Math.random() * 15;
  return Math.round((thermalPower / cop) * 10) / 10;
}

/** Betriebsstatus-Simulation */
function simStatus(date: Date): 'heizen' | 'standby' | 'stoerung' | 'abtauen' {
  _statusCycle++;

  // Abtauen alle ~200 Zyklen (ca. 10 min bei 3s Intervall)
  if (_abtauTimer > 0) {
    _abtauTimer--;
    return 'abtauen';
  }
  if (_statusCycle % 200 === 0 && date.getHours() >= 6 && date.getHours() <= 22) {
    _abtauTimer = 4; // 4 Zyklen = ~12 Sekunden Abtauen
    return 'abtauen';
  }

  const hour = date.getHours();
  // Nachts (23-5): Standby mit gelegentlichem Heizen
  if (hour >= 23 || hour < 5) {
    return _statusCycle % 10 < 3 ? 'heizen' : 'standby';
  }
  // Tagsüber: Meistens heizen
  return _statusCycle % 12 < 10 ? 'heizen' : 'standby';
}

// ─── Öffentliche API ─────────────────────────────────────────

/** Erzeugt einen einzelnen Live-Datenpunkt */
export function generateLiveData(date?: Date): HeatingData {
  const now = date || new Date();
  const dt = (Date.now() - _lastUpdate) / 3600000; // Stunden seit letztem Update
  _betriebsstunden += dt * 0.8; // ~80% Laufzeit
  _lastUpdate = Date.now();

  const status = simStatus(now);
  const aussen = simAussentemperatur(now);
  const vorlauf = simVorlauf(aussen, status);
  const ruecklauf = simRuecklauf(vorlauf, status);
  const puffer = simPuffer(vorlauf, status);
  const cop = simCOP(aussen, vorlauf);
  const strom = simStromverbrauch(cop, status);
  const drehzahl = status === 'heizen' ? 1200 + Math.round(Math.random() * 400)
                 : status === 'abtauen' ? 800 + Math.round(Math.random() * 200)
                 : Math.round(Math.random() * 100);

  return {
    timestamp: now,
    aussentemperatur: aussen,
    vorlauftemperatur: vorlauf,
    ruecklauftemperatur: ruecklauf,
    puffer_oben: puffer.oben,
    puffer_mitte: puffer.mitte,
    puffer_unten: puffer.unten,
    drehzahl_pumpe: drehzahl,
    stromverbrauch: strom,
    cop,
    betriebsstunden: Math.round(_betriebsstunden * 10) / 10,
    fehlercode: null,
    status,
  };
}

/** Erzeugt historische Daten für den angegebenen Zeitraum */
export function generateHistoricalData(hours: number, resolutionMinutes = 15): HeatingData[] {
  const data: HeatingData[] = [];
  const now = new Date();
  const totalPoints = Math.floor((hours * 60) / resolutionMinutes);

  for (let i = totalPoints; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * resolutionMinutes * 60 * 1000);
    const hour = timestamp.getHours() + timestamp.getMinutes() / 60;

    // Deterministischer Tagesgang (ohne Random für glatte Kurven)
    const tagesgang = -Math.cos(((hour - 6) / 24) * 2 * Math.PI) * 4;
    // Tag-zu-Tag-Variation basierend auf dem Datum
    const dayOffset = Math.sin(timestamp.getDate() * 0.5) * 2;
    const aussen = Math.round((2 + tagesgang + dayOffset + (Math.random() - 0.5) * 0.8) * 10) / 10;

    const isNight = hour >= 23 || hour < 5;
    const status: HeatingData['status'] = isNight
      ? (i % 10 < 3 ? 'heizen' : 'standby')
      : (i % 12 < 10 ? 'heizen' : 'standby');

    const vorlauf = status === 'heizen'
      ? Math.round((40 - aussen * 0.8 + (Math.random() - 0.5) * 1) * 10) / 10
      : Math.round((25 + (Math.random() - 0.5) * 1) * 10) / 10;

    const spreizung = 4 + Math.random() * 1;
    const ruecklauf = Math.round((vorlauf - spreizung) * 10) / 10;

    const pufferBase = status === 'heizen' ? vorlauf + 8 : vorlauf;
    const cop = status === 'heizen'
      ? Math.round((3.0 + aussen * 0.1 + (Math.random() - 0.5) * 0.3) * 10) / 10
      : Math.round((4.5 + (Math.random() - 0.5) * 0.5) * 10) / 10;

    const strom = status === 'heizen'
      ? Math.round(((35 + Math.random() * 10) / cop) * 10) / 10
      : Math.round((0.3 + Math.random() * 0.2) * 10) / 10;

    data.push({
      timestamp,
      aussentemperatur: aussen,
      vorlauftemperatur: Math.max(20, vorlauf),
      ruecklauftemperatur: Math.max(18, ruecklauf),
      puffer_oben: Math.round((pufferBase + 5 + (Math.random() - 0.5)) * 10) / 10,
      puffer_mitte: Math.round((pufferBase - 2 + (Math.random() - 0.5)) * 10) / 10,
      puffer_unten: Math.round((pufferBase - 10 + (Math.random() - 0.5)) * 10) / 10,
      drehzahl_pumpe: status === 'heizen' ? 1200 + Math.round(Math.random() * 400) : Math.round(Math.random() * 100),
      stromverbrauch: strom,
      cop: Math.max(2.0, cop),
      betriebsstunden: Math.round((2847 + (totalPoints - i) * resolutionMinutes / 60 * 0.8) * 10) / 10,
      fehlercode: null,
      status,
    });
  }

  return data;
}

/** Erzeugt realistische Demo-Alarme */
export function generateAlarms(): Alarm[] {
  const now = Date.now();
  return [
    {
      id: 'sim-1',
      type: 'warning',
      title: 'Vorlauftemperatur hoch',
      message: 'Vorlauftemperatur hat 52°C überschritten (Grenzwert: 55°C). Bitte System prüfen.',
      timestamp: new Date(now - 25 * 60 * 1000), // vor 25 Min
      acknowledged: false,
    },
    {
      id: 'sim-2',
      type: 'info',
      title: 'Wartung fällig',
      message: 'Die jährliche Wartung steht in 14 Tagen an. Bitte Termin vereinbaren.',
      timestamp: new Date(now - 2 * 60 * 60 * 1000), // vor 2 Std
      acknowledged: false,
    },
    {
      id: 'sim-3',
      type: 'info',
      title: 'Abtauzyklus abgeschlossen',
      message: 'Automatischer Abtauzyklus wurde erfolgreich durchgeführt. Dauer: 4 Min.',
      timestamp: new Date(now - 4 * 60 * 60 * 1000),
      acknowledged: true,
    },
    {
      id: 'sim-4',
      type: 'warning',
      title: 'Niedrige Außentemperatur',
      message: 'Außentemperatur unter 0°C. Frostschutz aktiv. COP wird sinken.',
      timestamp: new Date(now - 8 * 60 * 60 * 1000),
      acknowledged: true,
    },
    {
      id: 'sim-5',
      type: 'info',
      title: 'Firmware-Update installiert',
      message: 'WAGO PLC Firmware v3.2.1 erfolgreich installiert.',
      timestamp: new Date(now - 24 * 60 * 60 * 1000),
      acknowledged: true,
    },
  ];
}

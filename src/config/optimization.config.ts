/**
 * Optimierungs-Konfiguration
 * Zentrale Einstellungen für Heizungs-Optimierung
 */

export const OPTIMIZATION_CONFIG = {
  // Standort
  location: {
    lat: 49.8717,    // Darmstadt
    lon: 8.6503,
    city: 'Darmstadt',
    country: 'DE',
  },

  // Heizkurve
  heatingCurve: {
    baseTemp: 20,     // Basis-Raumtemperatur
    slope: 0.8,       // Heizkurven-Steigung
    minFlowTemp: 25,  // Minimale Vorlauftemperatur
    maxFlowTemp: 55,  // Maximale Vorlauftemperatur
    nightReduction: 3, // Nachtabsenkung in K
  },

  // Preis-Schwellen (ct/kWh)
  priceThresholds: {
    veryCheap: 20,    // Sehr günstig - ideal zum Heizen
    cheap: 25,        // Günstig - gute Zeit zum Heizen
    normal: 30,       // Normal - standard Heizen
    expensive: 35,    // Teuer - nur wenn nötig
  },

  // Optimierungs-Strategien
  strategies: {
    // Wenn morgen kälter → heute mehr laden
    weatherPreload: {
      enabled: true,
      tempDiffThreshold: 3, // Kälteunterschied in °C
      preloadHours: 4,      // Stunden Vorlauf
    },
    
    // Wenn Strom günstig → vorheizen
    priceOptimization: {
      enabled: true,
      maxPreloadTemp: 24,   // Max. Vorheiztemperatur
      minSavings: 2,        // Min. Ersparnis in €
    },
    
    // Nachtabsenkung
    nightSetback: {
      enabled: true,
      startHour: 22,
      endHour: 6,
      reductionK: 3,
    },
  },

  // Aktualisierungsintervalle
  refreshIntervals: {
    weather: 10 * 60 * 1000,      // 10 Minuten
    prices: 15 * 60 * 1000,       // 15 Minuten
    optimization: 30 * 60 * 1000, // 30 Minuten
  },

  // Komfort-Einstellungen
  comfort: {
    minRoomTemp: 18,      // Minimale Raumtemperatur
    maxRoomTemp: 24,      // Maximale Raumtemperatur
    rapidHeatingBoost: true, // Schnelles Aufheizen erlauben
  },

  // Alarm-Grenzen
  alarms: {
    maxOutsideTemp: 35,   // Hitzewarnung
    minOutsideTemp: -15,  // Kältewarnung
    maxFlowTemp: 60,      // Überhitzung
    minCop: 2.0,          // COP zu niedrig
  },
} as const;

// Hilfsfunktionen
export function getPriceLabel(price: number): string {
  const { priceThresholds } = OPTIMIZATION_CONFIG;
  if (price < priceThresholds.veryCheap) return 'sehr günstig';
  if (price < priceThresholds.cheap) return 'günstig';
  if (price < priceThresholds.normal) return 'normal';
  if (price < priceThresholds.expensive) return 'teuer';
  return 'sehr teuer';
}

export function getPriceColor(price: number): string {
  const { priceThresholds } = OPTIMIZATION_CONFIG;
  if (price < priceThresholds.veryCheap) return 'text-emerald-400';
  if (price < priceThresholds.cheap) return 'text-lime-400';
  if (price < priceThresholds.normal) return 'text-slate-400';
  if (price < priceThresholds.expensive) return 'text-amber-400';
  return 'text-red-400';
}

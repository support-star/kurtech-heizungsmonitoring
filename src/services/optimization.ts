/**
 * Optimierungs-Service für Heizungs-Steuerung
 * Berücksichtigt Wetter und Strompreise
 */

import type { ForecastData } from './weather';
import type { PriceData } from './energy';

export interface OptimizationRecommendation {
  type: 'heat_now' | 'wait' | 'normal';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  reason: string;
  potentialSavings: number; // €/Monat geschätzt
  actionRequired: boolean;
}

export interface OptimalSchedule {
  hour: number;
  shouldHeat: boolean;
  reason: string;
  price: number;
  temperature: number;
}

export interface OptimizationResult {
  recommendations: OptimizationRecommendation[];
  schedule: OptimalSchedule[];
  summary: {
    heatingHoursRecommended: number;
    estimatedSavings: number;
    comfortScore: number; // 0-100
  };
}

// Heizkurven-Konfiguration
const HEATING_CURVE = {
  baseTemp: 20, // Basis-Temperatur
  slope: 0.8,   // Steigung der Heizkurve
  minFlowTemp: 25, // Minimale Vorlauftemperatur
  maxFlowTemp: 55, // Maximale Vorlauftemperatur
};

// Preis-Schwellenwerte (ct/kWh)
const PRICE_THRESHOLDS = {
  veryCheap: 20,   // Sehr günstig - ideal zum Heizen
  cheap: 25,       // Günstig - gute Zeit zum Heizen
  normal: 30,      // Normal - standard Heizen
  expensive: 35,   // Teuer - nur wenn nötig
};

/**
 * Berechnet die optimale Vorlauftemperatur basierend auf Außentemperatur
 */
export function calculateFlowTemperature(outsideTemp: number): number {
  const temp = HEATING_CURVE.baseTemp + HEATING_CURVE.slope * (HEATING_CURVE.baseTemp - outsideTemp);
  return Math.max(HEATING_CURVE.minFlowTemp, Math.min(HEATING_CURVE.maxFlowTemp, temp));
}

/**
 * Haupt-Optimierungsfunktion
 * "Wenn morgen kälter → heute mehr laden"
 * "Wenn Strom günstig → vorheizen"
 */
export function calculateOptimalSchedule(
  forecast: ForecastData,
  prices: PriceData
): OptimizationResult {
  const recommendations: OptimizationRecommendation[] = [];
  const schedule: OptimalSchedule[] = [];

  const today = forecast.days[0];
  const tomorrow = forecast.days[1];
  const currentPrice = prices.trend.currentPrice;
  const avgPrice = prices.trend.averageToday;

  // ─── Empfehlung 1: Morgen kälter? → Heute vorheizen ───
  if (tomorrow && tomorrow.minTemp < today.minTemp - 3) {
    const tempDiff = today.minTemp - tomorrow.minTemp;
    recommendations.push({
      type: 'heat_now',
      priority: 'high',
      title: 'Kälteeinbruch morgen erwartet',
      description: `Morgen ${tomorrow.minTemp.toFixed(1)}°C (heute ${today.minTemp.toFixed(1)}°C). Puffer jetzt zusätzlich laden.`,
      reason: 'Wetterprognose zeigt Temperaturabfall',
      potentialSavings: tempDiff * 0.5,
      actionRequired: true,
    });
  }

  // ─── Empfehlung 2: Günstige Preise? → Jetzt heizen ───
  if (currentPrice < PRICE_THRESHOLDS.veryCheap) {
    recommendations.push({
      type: 'heat_now',
      priority: 'high',
      title: 'Strompreis sehr günstig',
      description: `Aktuell ${currentPrice.toFixed(2)} ct/kWh (Durchschnitt: ${avgPrice.toFixed(2)}). Jetzt heizen lohnt sich!`,
      reason: 'Strompreis unter 20 ct/kWh',
      potentialSavings: (avgPrice - currentPrice) * 0.1,
      actionRequired: false,
    });
  } else if (currentPrice < PRICE_THRESHOLDS.cheap && prices.trend.direction === 'rising') {
    recommendations.push({
      type: 'heat_now',
      priority: 'medium',
      title: 'Preise steigen gerade',
      description: 'Strom wird teurer. Letzte Chance für günstiges Heizen heute.',
      reason: 'Preistrend steigend',
      potentialSavings: 2,
      actionRequired: false,
    });
  }

  // ─── Empfehlung 3: Teure Preise? → Warten ───
  if (currentPrice > PRICE_THRESHOLDS.expensive && prices.trend.direction === 'falling') {
    recommendations.push({
      type: 'wait',
      priority: 'medium',
      title: 'Strompreis hoch, fällt aber',
      description: `Aktuell ${currentPrice.toFixed(2)} ct/kWh. In ${prices.trend.bestHour !== null ? prices.trend.bestHour - new Date().getHours() : 'wenigen'} Stunden wieder günstiger.`,
      reason: 'Preistrend fallend',
      potentialSavings: (currentPrice - prices.trend.minPrice) * 0.1,
      actionRequired: false,
    });
  }

  // ─── Empfehlung 4: Frostschutz bei sehr kalten Temperaturen ───
  if (today.minTemp < -5) {
    recommendations.push({
      type: 'heat_now',
      priority: 'high',
      title: 'Frostschutz aktivieren',
      description: `Sehr kalte Temperaturen (${today.minTemp}°C). Mindestheizung sicherstellen.`,
      reason: 'Frostgefahr',
      potentialSavings: 0, // Keine Einsparung, aber wichtig
      actionRequired: true,
    });
  }

  // ─── 24h-Stundenplan erstellen ───
  for (let h = 0; h < 24; h++) {
    const hourPrice = prices.prices.find(p => p.timestamp.getHours() === h)?.price ?? avgPrice;
    const isCheap = hourPrice < PRICE_THRESHOLDS.cheap;
    const isVeryCheap = hourPrice < PRICE_THRESHOLDS.veryCheap;
    
    // Temperatur-Modellierung (vereinfacht)
    const hourTemp = today.avgTemp + Math.sin((h - 6) * Math.PI / 12) * (today.maxTemp - today.minTemp) / 2;
    
    let shouldHeat = false;
    let reason = '';

    if (isVeryCheap) {
      shouldHeat = true;
      reason = 'Sehr günstiger Strom';
    } else if (isCheap && h >= 22 || h <= 6) {
      shouldHeat = true;
      reason = 'Günstig + Nachtabsenkung';
    } else if (hourTemp < 5) {
      shouldHeat = true;
      reason = 'Kälteschutz';
    } else if (h >= 6 && h <= 22) {
      shouldHeat = true;
      reason = 'Tagesheizung';
    } else {
      reason = 'Nachtabsenkung';
    }

    schedule.push({
      hour: h,
      shouldHeat,
      reason,
      price: hourPrice,
      temperature: hourTemp,
    });
  }

  // Zusammenfassung
  const heatingHoursRecommended = schedule.filter(s => s.shouldHeat).length;
  const estimatedSavings = recommendations.reduce((sum, r) => sum + r.potentialSavings, 0);
  const comfortScore = Math.min(100, 60 + (recommendations.filter(r => r.type === 'heat_now').length * 10));

  return {
    recommendations,
    schedule,
    summary: {
      heatingHoursRecommended,
      estimatedSavings,
      comfortScore,
    },
  };
}

/**
 * Formatiert eine Empfehlung für die Anzeige
 */
export function formatRecommendation(rec: OptimizationRecommendation): string {
  const icons = {
    heat_now: '🔥',
    wait: '⏸️',
    normal: '✓',
  };

  return `${icons[rec.type]} ${rec.title}`;
}

/**
 * Prüft ob aktuell eine Aktion empfohlen wird
 */
export function shouldHeatNow(result: OptimizationResult): boolean {
  return result.recommendations.some(r => r.type === 'heat_now' && r.priority === 'high');
}

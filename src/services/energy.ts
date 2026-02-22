/**
 * Energie/Strompreis-Service
 * Nutzt Awattar API für Deutschland (Stundengenaue Preise)
 */

export interface EnergyPrice {
  timestamp: Date;
  price: number; // ct/kWh
  unit: string;
  market: string;
}

export interface PriceTrend {
  direction: 'rising' | 'falling' | 'stable';
  currentPrice: number;
  nextHourPrice: number | null;
  averageToday: number;
  minPrice: number;
  maxPrice: number;
  bestHour: number | null; // Stunde mit niedrigstem Preis (0-23)
}

export interface PriceData {
  prices: EnergyPrice[];
  trend: PriceTrend;
  fetchedAt: Date;
}

// Awattar API für Deutschland
const AWATTAR_API_URL = 'https://api.awattar.de/v1/marketdata';

/**
 * Aktuelle Strompreise abrufen
 * Gibt Preise für heute und morgen (falls verfügbar)
 */
export async function getCurrentPrice(): Promise<PriceData> {
  try {
    const url = `${AWATTAR_API_URL}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.data || !Array.isArray(data.data)) {
      throw new Error('Ungültige API-Antwort');
    }

    // Preise in ct/kWh umrechnen (API gibt €/MWh zurück)
    const prices: EnergyPrice[] = data.data.map((item: { start_timestamp: number; marketprice: number }) => ({
      timestamp: new Date(item.start_timestamp),
      price: (item.marketprice / 10), // €/MWh → ct/kWh
      unit: 'ct/kWh',
      market: 'DE-LU',
    }));

    const trend = calculateTrend(prices);

    return {
      prices,
      trend,
      fetchedAt: new Date(),
    };
  } catch (error) {
    console.error('Fehler beim Abrufen der Strompreise:', error);
    throw new Error('Strompreise konnten nicht geladen werden');
  }
}

/**
 * Berechnet den Preis-Trend
 */
function calculateTrend(prices: EnergyPrice[]): PriceTrend {
  if (prices.length === 0) {
    return {
      direction: 'stable',
      currentPrice: 0,
      nextHourPrice: null,
      averageToday: 0,
      minPrice: 0,
      maxPrice: 0,
      bestHour: null,
    };
  }

  const now = new Date();
  const currentHour = prices.find(p => {
    const pHour = p.timestamp.getHours();
    return pHour === now.getHours();
  }) || prices[0];

  const nextHour = prices.find(p => {
    const pHour = p.timestamp.getHours();
    return pHour === (now.getHours() + 1) % 24;
  }) || null;

  // Nur heutige Preise für Statistik
  const todayPrices = prices.filter(p => 
    p.timestamp.toDateString() === now.toDateString()
  );

  const pricesOnly = todayPrices.map(p => p.price);
  const average = pricesOnly.reduce((a, b) => a + b, 0) / pricesOnly.length;
  const min = Math.min(...pricesOnly);
  const max = Math.max(...pricesOnly);

  // Beste Stunde finden
  const minPriceEntry = todayPrices.find(p => p.price === min);
  const bestHour = minPriceEntry ? minPriceEntry.timestamp.getHours() : null;

  // Trend bestimmen
  let direction: 'rising' | 'falling' | 'stable' = 'stable';
  if (nextHour) {
    const diff = nextHour.price - currentHour.price;
    if (diff > 0.5) direction = 'rising';
    else if (diff < -0.5) direction = 'falling';
  }

  return {
    direction,
    currentPrice: currentHour.price,
    nextHourPrice: nextHour?.price ?? null,
    averageToday: average,
    minPrice: min,
    maxPrice: max,
    bestHour,
  };
}

/**
 * Gibt eine einfache Trend-Beschreibung zurück
 */
export function getPriceTrend(priceData: PriceData): string {
  const { trend } = priceData;
  
  if (trend.direction === 'rising') {
    return `Preise steigen (aktuell: ${trend.currentPrice.toFixed(2)} ct/kWh)`;
  } else if (trend.direction === 'falling') {
    return `Preise fallen (aktuell: ${trend.currentPrice.toFixed(2)} ct/kWh)`;
  }
  return `Preise stabil (aktuell: ${trend.currentPrice.toFixed(2)} ct/kWh)`;
}

/**
 * Prüft ob aktuell günstige Preise sind (< Durchschnitt)
 */
export function isCheapPrice(priceData: PriceData): boolean {
  return priceData.trend.currentPrice < priceData.trend.averageToday;
}

/**
 * Prüft ob aktuell sehr günstige Preise sind (Minimum des Tages)
 */
export function isBestPrice(priceData: PriceData): boolean {
  return priceData.trend.currentPrice <= priceData.trend.minPrice * 1.05; // 5% Toleranz
}

/**
 * Empfehlung für Heizungs-Optimierung
 */
export function getHeatingRecommendation(priceData: PriceData): 'heat_now' | 'wait' | 'normal' {
  const { trend } = priceData;
  
  // Wenn aktuell sehr günstig → jetzt heizen
  if (trend.currentPrice <= trend.minPrice * 1.1) {
    return 'heat_now';
  }
  
  // Wenn Preise steigen und aktuell unter Durchschnitt → jetzt heizen
  if (trend.direction === 'rising' && trend.currentPrice < trend.averageToday) {
    return 'heat_now';
  }
  
  // Wenn Preise fallen und aktuell über Durchschnitt → warten
  if (trend.direction === 'falling' && trend.currentPrice > trend.averageToday) {
    return 'wait';
  }
  
  return 'normal';
}

import { useState } from 'react';
import { Zap, TrendingDown, Calculator, Leaf, Sun } from 'lucide-react';
import type { HeatingData } from '@/types/heating';

interface EnergyCalculatorProps {
  liveData: HeatingData | null;
  historicalData: HeatingData[];
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#1e2736] bg-[#111620]/80 overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#1e2736]">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">{icon}</div>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function StatCard({ label, value, unit, sub, color = 'emerald' }: { label: string; value: string; unit?: string; sub?: string; color?: string }) {
  const c = color === 'emerald' ? 'text-emerald-400' : color === 'amber' ? 'text-amber-400' : color === 'sky' ? 'text-sky-400' : color === 'violet' ? 'text-violet-400' : 'text-slate-400';
  return (
    <div className="rounded-xl border border-[#1e2736] bg-[#0d1117] p-4">
      <p className="text-[11px] text-slate-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${c}`}>{value}{unit && <span className="text-sm font-normal text-slate-400 ml-1">{unit}</span>}</p>
      {sub && <p className="text-[10px] text-slate-600 mt-1">{sub}</p>}
    </div>
  );
}

export function EnergyCalculator({ liveData, historicalData }: EnergyCalculatorProps) {
  const [strompreis, setStrompreis] = useState(0.35);
  const [stunden, setStunden] = useState(8);
  const [cop, setCop] = useState(liveData?.cop ?? 3.8);

  // Berechnungen
  const verbrauchProStunde = liveData?.stromverbrauch ?? 5.2;
  const kostenProStunde    = verbrauchProStunde * strompreis;
  const kostenProTag       = kostenProStunde * stunden;
  const kostenProMonat     = kostenProTag * 30;
  const kostenProJahr      = kostenProMonat * 12;

  // Historisch (letzte 24h)
  const summe24h = historicalData.reduce((a, d) => a + d.stromverbrauch, 0) / Math.max(1, historicalData.length) * 24;
  const kosten24h = summe24h * strompreis;

  // CO2
  const co2ProKwh   = 0.366; // kg CO2 per kWh (DE Netz 2024)
  const co2ProJahr  = kostenProJahr / strompreis * co2ProKwh;
  const co2Gespart  = (kostenProJahr / strompreis) * cop * co2ProKwh - (kostenProJahr / strompreis) * co2ProKwh;

  // Wärmeleistung
  const waermeleistung = verbrauchProStunde * cop;
  const heizkostenVsGas = (waermeleistung * stunden * 30 * 0.12) - kostenProMonat; // 12ct/kWh Gas

  return (
    <div className="space-y-6">
      {/* Rechner */}
      <Section title="Energie-Kostenrechner" icon={<Calculator className="w-4 h-4" />}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {/* Strompreis */}
          <div className="space-y-2">
            <label className="text-xs text-slate-400">Strompreis (€/kWh)</label>
            <div className="flex items-center gap-2">
              <input
                type="range" min={0.20} max={0.60} step={0.01}
                value={strompreis}
                onChange={e => setStrompreis(parseFloat(e.target.value))}
                className="flex-1 accent-emerald-500"
              />
              <span className="text-sm font-mono text-emerald-400 w-12 text-right">{strompreis.toFixed(2)}</span>
            </div>
          </div>

          {/* Betriebsstunden */}
          <div className="space-y-2">
            <label className="text-xs text-slate-400">Betriebsstunden/Tag</label>
            <div className="flex items-center gap-2">
              <input
                type="range" min={1} max={24} step={1}
                value={stunden}
                onChange={e => setStunden(parseInt(e.target.value))}
                className="flex-1 accent-emerald-500"
              />
              <span className="text-sm font-mono text-emerald-400 w-12 text-right">{stunden} h</span>
            </div>
          </div>

          {/* COP */}
          <div className="space-y-2">
            <label className="text-xs text-slate-400">COP-Wert</label>
            <div className="flex items-center gap-2">
              <input
                type="range" min={1.5} max={6.0} step={0.1}
                value={cop}
                onChange={e => setCop(parseFloat(e.target.value))}
                className="flex-1 accent-emerald-500"
              />
              <span className="text-sm font-mono text-emerald-400 w-12 text-right">{cop.toFixed(1)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Kosten / Stunde"  value={kostenProStunde.toFixed(2)} unit="€"    color="amber" />
          <StatCard label="Kosten / Tag"     value={kostenProTag.toFixed(2)}    unit="€"    color="amber" />
          <StatCard label="Kosten / Monat"   value={kostenProMonat.toFixed(0)}  unit="€"    color="amber" />
          <StatCard label="Kosten / Jahr"    value={kostenProJahr.toFixed(0)}   unit="€"    color="amber" />
        </div>
      </Section>

      {/* Live-Kosten */}
      <Section title="Aktuelle Kosten" icon={<Zap className="w-4 h-4" />}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard label="Live-Verbrauch"  value={(liveData?.stromverbrauch ?? 0).toFixed(1)} unit="kWh" color="sky" />
          <StatCard label="Kosten gerade"   value={kostenProStunde.toFixed(3)} unit="€/h" color="amber" />
          <StatCard label="Letzten 24h"     value={kosten24h.toFixed(2)} unit="€" sub={`${summe24h.toFixed(1)} kWh verbraucht`} color="violet" />
        </div>

        <div className="mt-4 p-4 rounded-xl bg-[#0d1117] border border-[#1e2736]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400">Tagesbudget Auslastung</span>
            <span className="text-xs text-emerald-400 font-medium">{Math.min(100, (kosten24h / 10 * 100)).toFixed(0)}%</span>
          </div>
          <div className="h-2.5 bg-[#1a2030] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-amber-500 rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, kosten24h / 10 * 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-600 mt-1">Budget: 10€/Tag (Beispiel)</p>
        </div>
      </Section>

      {/* Vergleich & CO2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section title="Vergleich: Wärmepumpe vs. Gas" icon={<TrendingDown className="w-4 h-4" />}>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0d1117] border border-emerald-500/20">
              <div>
                <p className="text-xs text-slate-400">Wärmepumpe / Monat</p>
                <p className="text-lg font-bold text-emerald-400">{kostenProMonat.toFixed(0)} €</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Wärmeleistung</p>
                <p className="text-sm font-semibold text-slate-300">{waermeleistung.toFixed(1)} kWh/h</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0d1117] border border-[#1e2736]">
              <div>
                <p className="text-xs text-slate-400">Gasheizung / Monat</p>
                <p className="text-lg font-bold text-slate-400">{(kostenProMonat + heizkostenVsGas).toFixed(0)} €</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Preis</p>
                <p className="text-sm font-semibold text-slate-300">0.12 €/kWh</p>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-xs text-emerald-400 font-medium">Monatliche Ersparnis</p>
              <p className="text-xl font-bold text-emerald-400">{heizkostenVsGas > 0 ? '+' : ''}{heizkostenVsGas.toFixed(0)} €</p>
              <p className="text-[10px] text-slate-500 mt-0.5">durch Wärmepumpe vs. Gasheizung</p>
            </div>
          </div>
        </Section>

        <Section title="CO₂ & Umwelt" icon={<Leaf className="w-4 h-4" />}>
          <div className="space-y-3">
            <StatCard label="CO₂ Verbrauch / Jahr" value={(co2ProJahr / 1000).toFixed(1)} unit="t CO₂" color="sky" />
            <StatCard label="CO₂ gespart vs. Gas"  value={(co2Gespart / 1000).toFixed(1)} unit="t CO₂" sub="gegenüber Gasheizung" color="emerald" />

            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#0d1117] border border-[#1e2736]">
              <Sun className="w-8 h-8 text-amber-400 shrink-0" />
              <div>
                <p className="text-xs text-slate-400">Äquivalent in Bäumen</p>
                <p className="text-lg font-bold text-amber-400">{Math.round(co2Gespart / 22)} Bäume</p>
                <p className="text-[10px] text-slate-500">die Ihr System jährlich einspart</p>
              </div>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}

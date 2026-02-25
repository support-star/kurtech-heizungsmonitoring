import { useState, useMemo } from 'react';
import { Euro, Leaf, TrendingDown, Calculator, Sun } from 'lucide-react';
import type { HeatingData } from '@/types/heating';

interface EnergyCalculatorProps {
  liveData: HeatingData | null;
  historicalData: HeatingData[];
}

function Section({ title, icon, children, accent = 'emerald' }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; accent?: string;
}) {
  const accents: Record<string, string> = {
    emerald: 'text-emerald-400 bg-emerald-500/10', amber: 'text-amber-400 bg-amber-500/10',
    sky: 'text-sky-400 bg-sky-500/10', violet: 'text-violet-400 bg-violet-500/10',
  };
  const a = accents[accent] || accents.emerald;
  return (
    <div className="rounded-2xl border border-[#1a2235] bg-[#0a0f1a] overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[#1a2235]">
        <div className={`w-8 h-8 rounded-lg ${a} flex items-center justify-center shrink-0`}>{icon}</div>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function StatCard({ label, value, unit, sub, color = 'emerald' }: {
  label: string; value: string; unit?: string; sub?: string; color?: string;
}) {
  const c: Record<string, string> = {
    emerald: 'text-emerald-400', amber: 'text-amber-400', sky: 'text-sky-400',
    violet: 'text-violet-400', orange: 'text-orange-400', red: 'text-red-400',
  };
  return (
    <div className="rounded-xl border border-[#1a2235] bg-[#0d1220] p-4">
      <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-2xl font-bold font-mono ${c[color] || c.emerald}`}>
        {value}
        {unit && <span className="text-sm font-normal text-slate-500 ml-1">{unit}</span>}
      </p>
      {sub && <p className="text-[10px] text-slate-600 mt-1">{sub}</p>}
    </div>
  );
}

function Slider({ label, value, min, max, step, unit, onChange }: {
  label: string; value: number; min: number; max: number; step: number; unit: string; onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs">
        <span className="text-slate-500">{label}</span>
        <span className="text-emerald-400 font-mono font-semibold">{value.toFixed(step < 1 ? 2 : 0)} {unit}</span>
      </div>
      <div className="relative">
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #34d399 0%, #34d399 ${pct}%, #1a2235 ${pct}%, #1a2235 100%)`,
          }}
        />
      </div>
    </div>
  );
}

export function EnergyCalculator({ liveData, historicalData }: EnergyCalculatorProps) {
  const [strompreis, setStrompreis] = useState(0.32);
  const [stunden, setStunden] = useState(12);
  const [cop, setCop] = useState(liveData?.cop ?? 3.8);
  const [pvLeistung, setPvLeistung] = useState(10);
  const [pvErtrag, setPvErtrag] = useState(0.4);

  const verbrauch = liveData?.stromverbrauch ?? 5.5;

  const calc = useMemo(() => {
    const kostenH = verbrauch * strompreis;
    const kostenTag = kostenH * stunden;
    const kostenMonat = kostenTag * 30;
    const kostenJahr = kostenMonat * 12;

    const hist24h = historicalData.length > 0
      ? (historicalData.reduce((s, d) => s + d.stromverbrauch, 0) / historicalData.length) * 24
      : verbrauch * 24;

    const kosten24h = hist24h * strompreis;
    const co2ProKwh = 0.366;
    const co2H = verbrauch * co2ProKwh;
    const co2Tag = co2H * stunden;
    const co2Jahr = co2Tag * 365;

    // Wärmeleistung via COP
    const waermeH = verbrauch * cop;
    const waermeTag = waermeH * stunden;

    // PV savings
    const pvEinsparungH = Math.min(verbrauch, pvLeistung * pvErtrag);
    const pvEinsparungTag = pvEinsparungH * stunden * strompreis;
    const pvEinsparungJahr = pvEinsparungTag * 365;

    // Vergleich: Gasheizung
    const gasPreis = 0.095; // €/kWh
    const gasAeq = waermeTag / 0.9; // 90% Wirkungsgrad
    const gasKostenTag = gasAeq * gasPreis;
    const wpVorteilTag = gasKostenTag - kostenTag;

    return {
      kostenH, kostenTag, kostenMonat, kostenJahr,
      kosten24h, hist24h,
      co2H, co2Tag, co2Jahr,
      waermeH, waermeTag,
      pvEinsparungH, pvEinsparungTag, pvEinsparungJahr,
      gasKostenTag, wpVorteilTag,
    };
  }, [verbrauch, strompreis, stunden, cop, historicalData, pvLeistung, pvErtrag]);

  return (
    <div className="space-y-4">
      {/* Parameter */}
      <Section title="Berechnungsparameter" icon={<Calculator className="w-4 h-4" />} accent="emerald">
        <div className="space-y-5">
          <Slider label="Strompreis" value={strompreis} min={0.20} max={0.50} step={0.01} unit="€/kWh" onChange={setStrompreis} />
          <Slider label="Betriebsstunden pro Tag" value={stunden} min={1} max={24} step={1} unit="h/Tag" onChange={setStunden} />
          <Slider label="COP (Leistungszahl)" value={cop} min={1} max={7} step={0.1} unit="" onChange={setCop} />
        </div>
      </Section>

      {/* Kosten-Übersicht */}
      <Section title="Betriebskosten" icon={<Euro className="w-4 h-4" />} accent="amber">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Stunde" value={calc.kostenH.toFixed(3)} unit="€" color="amber" />
          <StatCard label="Tag" value={calc.kostenTag.toFixed(2)} unit="€" sub={`${stunden}h Betrieb`} color="amber" />
          <StatCard label="Monat" value={calc.kostenMonat.toFixed(0)} unit="€" sub="30 Tage" color="orange" />
          <StatCard label="Jahr" value={(calc.kostenJahr / 1000).toFixed(1)} unit="T€" sub={`${calc.kostenJahr.toFixed(0)} €`} color="red" />
        </div>

        {historicalData.length > 0 && (
          <div className="mt-3 p-3 rounded-xl bg-[#0d1220] border border-[#1a2235] flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-600 mb-0.5">Letzten 24h (Messung)</p>
              <p className="font-mono text-lg font-bold text-amber-400">{calc.hist24h.toFixed(1)} <span className="text-sm font-normal text-slate-500">kWh</span></p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-600 mb-0.5">Kosten gestern</p>
              <p className="font-mono text-lg font-bold text-amber-400">{calc.kosten24h.toFixed(2)} <span className="text-sm font-normal text-slate-500">€</span></p>
            </div>
          </div>
        )}
      </Section>

      {/* Wärmeleistung */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Section title="Wärmeerzeugung" icon={<TrendingDown className="w-4 h-4" />} accent="orange">
          <div className="space-y-3">
            <StatCard label="Wärme / Stunde" value={calc.waermeH.toFixed(1)} unit="kWh" color="orange"
              sub={`COP ${cop.toFixed(1)} × ${verbrauch.toFixed(1)} kW Strom`}
            />
            <StatCard label="Wärme / Tag" value={calc.waermeTag.toFixed(0)} unit="kWh" color="orange" />

            <div className="p-3 rounded-xl bg-[#0d1220] border border-[#1a2235]">
              <p className="text-[10px] text-slate-600 mb-2">Vorteil vs. Gasheizung (0,095 €/kWh)</p>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-[10px] text-slate-500">Gas-Kosten/Tag</p>
                  <p className="font-mono text-sm font-bold text-red-400">{calc.gasKostenTag.toFixed(2)} €</p>
                </div>
                <div className="text-center">
                  <span className="text-emerald-400 text-lg font-bold">→</span>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-500">WP-Ersparnis</p>
                  <p className={`font-mono text-sm font-bold ${calc.wpVorteilTag >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {calc.wpVorteilTag >= 0 ? '+' : ''}{calc.wpVorteilTag.toFixed(2)} €/Tag
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Section>

        <Section title="CO₂ Bilanz" icon={<Leaf className="w-4 h-4" />} accent="emerald">
          <div className="space-y-3">
            <StatCard label="CO₂ / Tag" value={(calc.co2Tag).toFixed(1)} unit="kg" sub="Faktor: 366g/kWh (DE 2024)" color="emerald" />
            <StatCard label="CO₂ / Jahr" value={(calc.co2Jahr / 1000).toFixed(2)} unit="t" color="sky" />
            <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
              <p className="text-xs text-emerald-400 font-medium mb-1">Effizienz-Bonus</p>
              <p className="text-[11px] text-slate-500">
                Im Vergleich zu einer Gasheizung spart diese WP-Anlage mit COP {cop.toFixed(1)} ca.{' '}
                <span className="text-emerald-400 font-semibold">{(calc.co2Jahr * 0.4).toFixed(0)} kg CO₂</span> pro Jahr.
              </p>
            </div>
          </div>
        </Section>
      </div>

      {/* PV-Rechner */}
      <Section title="PV-Eigenverbrauch Simulation" icon={<Sun className="w-4 h-4" />} accent="amber">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-4">
            <Slider label="PV-Anlagenleistung" value={pvLeistung} min={3} max={30} step={1} unit="kWp" onChange={setPvLeistung} />
            <Slider label="Eigenverbrauchsquote" value={pvErtrag} min={0.1} max={1.0} step={0.05} unit="" onChange={setPvErtrag} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Ersparnis/Tag" value={(calc.pvEinsparungTag).toFixed(2)} unit="€" color="emerald" />
            <StatCard label="Ersparnis/Jahr" value={(calc.pvEinsparungJahr).toFixed(0)} unit="€" color="emerald" sub={`~${(calc.pvEinsparungH).toFixed(1)} kW/h selbst` }/>
          </div>
        </div>
      </Section>
    </div>
  );
}

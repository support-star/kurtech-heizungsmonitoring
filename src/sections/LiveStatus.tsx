import { Badge } from '@/components/ui/badge';
import { Wind, Clock, Activity, Thermometer, Flame, Droplets } from 'lucide-react';
import type { HeatingData } from '@/types/heating';

interface LiveStatusProps { data: HeatingData | null; }

// ── Circular Gauge ────────────────────────────────────────────
function Gauge({ value, max = 6, label, unit, color }: {
  value: number; max?: number; label: string; unit: string; color: string;
}) {
  const r = 36; const cx = 50; const cy = 50;
  const startAngle = -215; const endAngle = 35;
  const totalArc = endAngle - startAngle;
  const pct = Math.min(1, Math.max(0, value / max));

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const pt = (angle: number) => ({
    x: cx + r * Math.cos(toRad(angle)),
    y: cy + r * Math.sin(toRad(angle)),
  });
  const arcPath = (start: number, end: number) => {
    const s = pt(start); const e = pt(end);
    const large = Math.abs(end - start) > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
  };

  const colorHex: Record<string, { stroke: string; glow: string }> = {
    emerald: { stroke: '#34d399', glow: '#34d39940' },
    orange:  { stroke: '#fb923c', glow: '#fb923c40' },
    amber:   { stroke: '#fbbf24', glow: '#fbbf2440' },
    sky:     { stroke: '#38bdf8', glow: '#38bdf840' },
    red:     { stroke: '#f87171', glow: '#f8717140' },
    violet:  { stroke: '#a78bfa', glow: '#a78bfa40' },
  };
  const col = colorHex[color] || colorHex.emerald;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="100" height="72" className="gauge-svg overflow-visible">
        {/* Background track */}
        <path d={arcPath(startAngle, endAngle)} fill="none" stroke="#1a2540" strokeWidth="5.5" strokeLinecap="round" />
        {/* Colored fill */}
        {pct > 0 && (
          <path
            d={arcPath(startAngle, startAngle + totalArc * pct)}
            fill="none" stroke={col.stroke} strokeWidth="5.5" strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 5px ${col.glow})`, transition: 'all 0.8s ease-out' }}
          />
        )}
        {/* Center value */}
        <text x={cx} y={cy - 3} textAnchor="middle" fill="white" fontSize="15" fontWeight="700"
          fontFamily="JetBrains Mono, monospace" style={{ letterSpacing: '-0.5px' }}>
          {value < 100 ? value.toFixed(value < 10 ? 1 : 0) : Math.round(value)}
        </text>
        <text x={cx} y={cy + 9} textAnchor="middle" fill={col.stroke} fontSize="7" fontWeight="600" opacity="0.9">
          {unit}
        </text>
      </svg>
      <p className="text-[9px] text-slate-600 uppercase tracking-widest font-medium">{label}</p>
    </div>
  );
}

// ── Temperature Bar ───────────────────────────────────────────
function TempBar({ label, value, min = -15, max = 70, color, unit = '°C', icon }: {
  label: string; value: number; min?: number; max?: number; color: string; unit?: string; icon?: React.ReactNode;
}) {
  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  const colorMap: Record<string, { bar: string; text: string }> = {
    orange:  { bar: '#fb923c', text: 'text-orange-400' },
    emerald: { bar: '#34d399', text: 'text-emerald-400' },
    sky:     { bar: '#38bdf8', text: 'text-sky-400' },
    red:     { bar: '#f87171', text: 'text-red-400' },
    amber:   { bar: '#fbbf24', text: 'text-amber-400' },
    violet:  { bar: '#a78bfa', text: 'text-violet-400' },
  };
  const c = colorMap[color] || colorMap.emerald;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
          {icon && <span className="opacity-60">{icon}</span>}
          {label}
        </span>
        <span className={`font-mono text-xs font-bold ${c.text}`}>{value.toFixed(1)}{unit}</span>
      </div>
      <div className="h-1.5 bg-[#111827] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: c.bar, boxShadow: `0 0 6px ${c.bar}55` }} />
      </div>
    </div>
  );
}

export function LiveStatus({ data }: LiveStatusProps) {
  if (!data) {
    return (
      <div className="rounded-2xl border border-[#151e30] bg-[#070b14] p-4 space-y-3">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-8 bg-[#0f1827] rounded-xl animate-pulse" style={{ opacity: 1 - i * 0.08 }} />
        ))}
      </div>
    );
  }

  const statusConfig: Record<string, { label: string; cls: string; dot: string }> = {
    heizen:   { label: 'Heizen',   cls: 'bg-orange-500/12 text-orange-400 border-orange-500/25',  dot: 'bg-orange-400' },
    standby:  { label: 'Standby', cls: 'bg-blue-500/12   text-blue-400   border-blue-500/25',    dot: 'bg-blue-400' },
    stoerung: { label: 'Störung', cls: 'bg-red-500/12    text-red-400    border-red-500/25',      dot: 'bg-red-400' },
    abtauen:  { label: 'Abtauen', cls: 'bg-teal-500/12   text-teal-400   border-teal-500/25',    dot: 'bg-teal-400' },
  };
  const st = statusConfig[data.status] ?? { label: data.status, cls: 'bg-slate-500/12 text-slate-400 border-slate-500/25', dot: 'bg-slate-400' };

  return (
    <div className="rounded-2xl border border-[#151e30] bg-[#070b14] overflow-hidden fade-up">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#151e30]"
        style={{ background: 'linear-gradient(90deg, #080e1a 0%, #0a1020 100%)' }}>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold text-white tracking-tight">Live-Status</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-600 font-mono">
            {data.timestamp.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <Badge className={`text-[10px] border px-2 py-0 font-medium ${st.cls}`}>
            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${st.dot}`} style={{ display: 'inline-block' }} />
            {st.label}
          </Badge>
        </div>
      </div>

      <div className="p-4 space-y-5">
        {/* Gauges */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[#0b1020] rounded-xl p-2 text-center border border-[#151e30]">
            <Gauge
              value={data.cop} max={6} label="COP" unit="Leistung"
              color={data.cop >= 4 ? 'emerald' : data.cop >= 3 ? 'amber' : 'red'}
            />
          </div>
          <div className="bg-[#0b1020] rounded-xl p-2 text-center border border-[#151e30]">
            <Gauge value={data.stromverbrauch} max={45} label="Strom" unit="kW" color="orange" />
          </div>
        </div>

        {/* Temperatures */}
        <div className="space-y-2.5">
          <p className="stat-label">Temperaturen</p>
          <TempBar label="Außen"    value={data.aussentemperatur}    min={-15} max={35} color="sky"    icon={<Thermometer className="w-3 h-3" />} />
          <TempBar label="Vorlauf"  value={data.vorlauftemperatur}   min={20}  max={65} color="orange" icon={<Flame className="w-3 h-3" />} />
          <TempBar label="Rücklauf" value={data.ruecklauftemperatur} min={15}  max={55} color="emerald" icon={<Droplets className="w-3 h-3" />} />
        </div>

        {/* Buffer tank */}
        <div>
          <p className="stat-label mb-2.5">Pufferspeicher · 1500 L</p>
          <div className="flex gap-2 items-stretch">
            {/* Data rows */}
            <div className="flex-1 space-y-1">
              {[
                { lbl: 'Oben',  val: data.puffer_oben,  textCls: 'text-orange-400',  dot: '#fb923c' },
                { lbl: 'Mitte', val: data.puffer_mitte, textCls: 'text-emerald-400', dot: '#34d399' },
                { lbl: 'Unten', val: data.puffer_unten, textCls: 'text-sky-400',     dot: '#38bdf8' },
              ].map(({ lbl, val, textCls, dot }) => (
                <div key={lbl} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#0b1020] border border-[#151e30]">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: dot, opacity: 0.8 }} />
                  <span className="text-[10px] text-slate-500 flex-1">{lbl}</span>
                  <span className={`font-mono text-xs font-bold ${textCls}`}>{val.toFixed(0)}°C</span>
                </div>
              ))}
            </div>
            {/* Vertical tank visual */}
            <div className="w-7 bg-[#0b1020] rounded-xl overflow-hidden relative flex flex-col-reverse border border-[#151e30]">
              {[data.puffer_unten, data.puffer_mitte, data.puffer_oben].map((v, i) => (
                <div key={i} className="w-full flex-1 transition-all duration-700"
                  style={{
                    background: i === 2 ? `rgba(251,146,60,${Math.min(0.75, v/60)})` :
                                 i === 1 ? `rgba(52,211,153,${Math.min(0.75, v/60)})` :
                                           `rgba(56,189,248,${Math.min(0.75, v/60)})`,
                  }} />
              ))}
            </div>
          </div>
        </div>

        {/* System stats */}
        <div>
          <p className="stat-label mb-2">System</p>
          <div className="space-y-0.5">
            {[
              { icon: <Wind className="w-3.5 h-3.5" />, label: 'Pumpe', value: String(data.drehzahl_pumpe), unit: 'U/min', color: 'text-sky-400' },
              { icon: <Clock className="w-3.5 h-3.5" />, label: 'Betriebsst.', value: Math.floor(data.betriebsstunden).toLocaleString('de-DE'), unit: 'h', color: 'text-emerald-400' },
              { icon: <Activity className="w-3.5 h-3.5" />, label: 'Fehler', value: data.fehlercode || 'Kein', unit: '', color: data.fehlercode ? 'text-red-400' : 'text-slate-400' },
            ].map(({ icon, label, value, unit, color }) => (
              <div key={label} className="flex items-center gap-2.5 py-1.5 border-b border-[#111827] last:border-0">
                <span className="text-slate-600 opacity-80">{icon}</span>
                <span className="text-[11px] text-slate-500 flex-1">{label}</span>
                <span className={`font-mono text-xs font-semibold ${color}`}>
                  {value}{unit && <span className="text-[10px] text-slate-600 ml-1">{unit}</span>}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* COP efficiency bar */}
        <div className="rounded-xl bg-[#0b1020] border border-[#151e30] p-3">
          <div className="flex items-center justify-between text-[11px] mb-2">
            <span className="text-slate-500">Effizienz-Index</span>
            <span className={`font-semibold ${data.cop >= 4 ? 'text-emerald-400' : data.cop >= 3 ? 'text-amber-400' : 'text-red-400'}`}>
              COP {data.cop.toFixed(2)} · {data.cop >= 4.5 ? 'Exzellent' : data.cop >= 3.5 ? 'Sehr gut' : data.cop >= 3 ? 'Gut' : 'Gering'}
            </span>
          </div>
          <div className="h-2 bg-[#111827] rounded-full overflow-hidden relative">
            {/* Thresholds */}
            {[3/6, 3.5/6, 4.5/6].map((pos, i) => (
              <div key={i} className="absolute top-0 bottom-0 w-px bg-[#1a2540]" style={{ left: `${pos*100}%` }} />
            ))}
            <div className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.min(100, (data.cop / 6) * 100)}%`,
                background: data.cop >= 4 ? 'linear-gradient(90deg, #34d399, #10b981)' : data.cop >= 3 ? 'linear-gradient(90deg, #fbbf24, #f59e0b)' : 'linear-gradient(90deg, #f87171, #ef4444)',
                boxShadow: data.cop >= 4 ? '0 0 8px #34d39955' : data.cop >= 3 ? '0 0 8px #fbbf2455' : '0 0 8px #f8717155',
              }} />
          </div>
          <div className="flex justify-between text-[9px] text-slate-700 mt-1">
            <span>0</span><span>3</span><span>4</span><span>6</span>
          </div>
        </div>
      </div>
    </div>
  );
}

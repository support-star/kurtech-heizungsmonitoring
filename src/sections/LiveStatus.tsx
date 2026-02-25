import { Badge } from '@/components/ui/badge';
import { Wind, Zap, Clock, Activity } from 'lucide-react';
import type { HeatingData } from '@/types/heating';

interface LiveStatusProps {
  data: HeatingData | null;
}

function TempBar({ label, value, min = 0, max = 70, color }: { label: string; value: number; min?: number; max?: number; color: string }) {
  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400">{label}</span>
        <span className={`font-mono font-semibold ${color}`}>{value.toFixed(1)} °C</span>
      </div>
      <div className="h-2 bg-[#1a2030] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color.includes('orange') ? '#f97316' : color.includes('blue') ? '#38bdf8' : color.includes('red') ? '#ef4444' : '#34d399' }}
        />
      </div>
    </div>
  );
}

function StatPill({ label, value, unit, icon, color }: { label: string; value: string; unit: string; icon: React.ReactNode; color: string }) {
  const bg = color === 'emerald' ? 'bg-emerald-500/10 border-emerald-500/20' : color === 'orange' ? 'bg-orange-500/10 border-orange-500/20' : color === 'sky' ? 'bg-sky-500/10 border-sky-500/20' : 'bg-slate-500/10 border-slate-500/20';
  const txt = color === 'emerald' ? 'text-emerald-400' : color === 'orange' ? 'text-orange-400' : color === 'sky' ? 'text-sky-400' : 'text-slate-400';
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border ${bg}`}>
      <div className={txt}>{icon}</div>
      <div className="min-w-0">
        <p className="text-[11px] text-slate-500 leading-none mb-0.5">{label}</p>
        <p className={`text-base font-bold leading-none ${txt}`}>
          {value}<span className="text-xs font-normal text-slate-400 ml-1">{unit}</span>
        </p>
      </div>
    </div>
  );
}

export function LiveStatus({ data }: LiveStatusProps) {
  if (!data) {
    return (
      <div className="rounded-2xl border border-[#1e2736] bg-[#111620]/80 p-5">
        <div className="animate-pulse space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-12 bg-[#1a2030] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const statusConfig: Record<string, { label: string; cls: string }> = {
    heizen:   { label: 'Heizen',  cls: 'bg-orange-500/20 text-orange-400 border-orange-500/40' },
    standby:  { label: 'Standby', cls: 'bg-blue-500/20   text-blue-400   border-blue-500/40' },
    stoerung: { label: 'Störung', cls: 'bg-red-500/20    text-red-400    border-red-500/40' },
    abtauen:  { label: 'Abtauen', cls: 'bg-teal-500/20   text-teal-400   border-teal-500/40' },
  };
  const st = statusConfig[data.status] ?? { label: data.status, cls: 'bg-slate-500/20 text-slate-400' };

  return (
    <div className="rounded-2xl border border-[#1e2736] bg-[#111620]/80 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e2736]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-sm font-semibold text-white">Live-Status</span>
        </div>
        <Badge className={`text-xs border ${st.cls}`}>{st.label}</Badge>
      </div>

      <div className="p-4 space-y-5">
        {/* Timestamp */}
        <p className="text-[10px] text-slate-600 text-right">
          Aktualisiert: {data.timestamp.toLocaleTimeString('de-DE')}
        </p>

        {/* Temperaturen Bars */}
        <div>
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-3">Temperaturen</p>
          <div className="space-y-3">
            <TempBar label="Außen"    value={data.aussentemperatur}   min={-15} max={35}  color="text-sky-400" />
            <TempBar label="Vorlauf"  value={data.vorlauftemperatur}  min={20}  max={65}  color="text-orange-400" />
            <TempBar label="Rücklauf" value={data.ruecklauftemperatur} min={15}  max={55}  color="text-emerald-400" />
          </div>
        </div>

        {/* Puffer */}
        <div>
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-3">Pufferspeicher</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { lbl: 'Oben',  val: data.puffer_oben,  color: 'text-orange-400' },
              { lbl: 'Mitte', val: data.puffer_mitte, color: 'text-emerald-400' },
              { lbl: 'Unten', val: data.puffer_unten, color: 'text-sky-400' },
            ].map(({ lbl, val, color }) => (
              <div key={lbl} className="text-center p-2.5 rounded-xl bg-[#0d1117] border border-[#1e2736]">
                <p className="text-[10px] text-slate-500 mb-1">{lbl}</p>
                <p className={`text-lg font-bold leading-none ${color}`}>{val.toFixed(0)}°</p>
              </div>
            ))}
          </div>
          {/* Stacked bar */}
          <div className="flex h-2.5 rounded-full overflow-hidden mt-3 gap-0.5">
            {[data.puffer_oben, data.puffer_mitte, data.puffer_unten].map((v, i) => (
              <div key={i} className="flex-1 rounded-full" style={{
                background: i === 0 ? `rgba(249,115,22,${Math.min(1,v/65)})` : i === 1 ? `rgba(52,211,153,${Math.min(1,v/65)})` : `rgba(56,189,248,${Math.min(1,v/65)})`
              }} />
            ))}
          </div>
        </div>

        {/* System Stats */}
        <div>
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-3">System</p>
          <div className="space-y-2">
            <StatPill label="COP (Leistungszahl)" value={data.cop.toFixed(2)} unit="" icon={<Activity className="w-4 h-4" />} color={data.cop > 3.5 ? 'emerald' : 'orange'} />
            <StatPill label="Stromverbrauch"      value={data.stromverbrauch.toFixed(1)} unit="kWh" icon={<Zap className="w-4 h-4" />} color="orange" />
            <StatPill label="Drehzahl Pumpe"      value={String(data.drehzahl_pumpe)} unit="U/min" icon={<Wind className="w-4 h-4" />} color="sky" />
            <StatPill label="Betriebsstunden"     value={Math.floor(data.betriebsstunden).toLocaleString('de-DE')} unit="h" icon={<Clock className="w-4 h-4" />} color="emerald" />
          </div>
        </div>

        {/* COP Bar */}
        <div className="p-3 rounded-xl bg-[#0d1117] border border-[#1e2736]">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-slate-400">Effizienz-Index</span>
            <span className={`font-semibold ${data.cop > 4 ? 'text-emerald-400' : data.cop > 3 ? 'text-yellow-400' : 'text-red-400'}`}>
              {data.cop > 4 ? 'Exzellent' : data.cop > 3 ? 'Gut' : 'Gering'}
            </span>
          </div>
          <div className="h-3 bg-[#1a2030] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.min(100, (data.cop / 6) * 100)}%`,
                background: data.cop > 4 ? '#34d399' : data.cop > 3 ? '#fbbf24' : '#ef4444',
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-600 mt-1">
            <span>0</span><span>COP {data.cop.toFixed(1)}</span><span>6.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}

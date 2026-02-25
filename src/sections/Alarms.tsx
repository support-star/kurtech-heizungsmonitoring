import { Bell, AlertTriangle, AlertCircle, Info, CheckCircle2, X } from 'lucide-react';
import type { Alarm } from '@/types/heating';

interface AlarmsProps {
  alarms: Alarm[];
  onAcknowledge: (id: string) => void;
}

const typeConfig = {
  error:   { icon: AlertCircle,   label: 'Fehler',  cls: 'text-red-400',    bg: 'bg-red-500/8 border-red-500/20',    dot: 'bg-red-400' },
  warning: { icon: AlertTriangle, label: 'Warnung', cls: 'text-amber-400',  bg: 'bg-amber-500/8 border-amber-500/20', dot: 'bg-amber-400' },
  info:    { icon: Info,          label: 'Info',    cls: 'text-sky-400',    bg: 'bg-sky-500/8 border-sky-500/20',     dot: 'bg-sky-400' },
};

function timeAgo(date: Date): string {
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return 'Jetzt';
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
}

export function Alarms({ alarms, onAcknowledge }: AlarmsProps) {
  const unack = alarms.filter(a => !a.acknowledged);
  const acked = alarms.filter(a => a.acknowledged).slice(0, 3);

  return (
    <div className="rounded-2xl border border-[#1a2235] bg-[#0a0f1a] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a2235]">
        <div className="flex items-center gap-2">
          <Bell className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-xs font-semibold text-white">Alarme & Meldungen</span>
        </div>
        {unack.length > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 text-[10px] font-bold border border-red-500/25">
            {unack.length} aktiv
          </span>
        )}
      </div>

      <div className="p-3 space-y-2 max-h-[600px] overflow-y-auto">
        {/* Active alarms */}
        {unack.length === 0 && acked.length === 0 && (
          <div className="py-8 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-500/30 mx-auto mb-2" />
            <p className="text-xs text-slate-600">Keine aktiven Alarme</p>
          </div>
        )}

        {unack.map((alarm) => {
          const cfg = typeConfig[alarm.type as keyof typeof typeConfig] || typeConfig.info;
          const Icon = cfg.icon;
          return (
            <div key={alarm.id} className={`rounded-xl border p-3 ${cfg.bg} relative group`}>
              <div className="flex items-start gap-2.5">
                <div className={`mt-0.5 ${cfg.cls}`}><Icon className="w-3.5 h-3.5" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <p className={`text-xs font-semibold truncate ${cfg.cls}`}>{alarm.title}</p>
                    <span className="text-[9px] text-slate-600 shrink-0">{timeAgo(alarm.timestamp)}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">{alarm.message}</p>
                </div>
              </div>
              <button
                onClick={() => onAcknowledge(alarm.id)}
                className="absolute top-2 right-2 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-all"
                title="Quittieren"
              >
                <X className="w-3 h-3 text-slate-500" />
              </button>
            </div>
          );
        })}

        {/* Acknowledged / recent */}
        {acked.length > 0 && (
          <>
            <p className="text-[9px] text-slate-700 uppercase tracking-widest font-semibold pt-2 px-1">Quittiert</p>
            {acked.map((alarm) => {
              const cfg = typeConfig[alarm.type as keyof typeof typeConfig] || typeConfig.info;
              const Icon = cfg.icon;
              return (
                <div key={alarm.id} className="rounded-xl border border-[#1a2235] bg-[#0d1220] p-3 opacity-50">
                  <div className="flex items-start gap-2.5">
                    <div className={`mt-0.5 ${cfg.cls}`}><Icon className="w-3.5 h-3.5" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <p className="text-xs font-medium text-slate-400 truncate">{alarm.title}</p>
                        <span className="text-[9px] text-slate-700 shrink-0">{timeAgo(alarm.timestamp)}</span>
                      </div>
                      <p className="text-[11px] text-slate-600">{alarm.message}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Footer */}
      {alarms.length > 0 && (
        <div className="px-4 py-2.5 border-t border-[#1a2235] flex justify-between items-center">
          <span className="text-[10px] text-slate-700">{alarms.length} Meldung(en) gesamt</span>
          {unack.length > 0 && (
            <button
              onClick={() => unack.forEach(a => onAcknowledge(a.id))}
              className="text-[10px] text-emerald-500 hover:text-emerald-400 transition-colors"
            >
              Alle quittieren
            </button>
          )}
        </div>
      )}
    </div>
  );
}

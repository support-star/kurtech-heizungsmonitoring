import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  MapPin, AlertTriangle, CheckCircle2, XCircle, Mail,
  Plus, Trash2, Bell, BellOff, Settings2, Send, ChevronDown, ChevronUp,
  Thermometer, Zap, Clock, Activity,
} from 'lucide-react';
import { toast } from 'sonner';
import type { HeatingData } from '@/types/heating';

/* ═══════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════ */
type AnlagenStatus = 'running' | 'standby' | 'alarm' | 'offline';

interface Standort {
  id: string;
  name: string;
  adresse: string;
  anlageTyp: string;
  status: AnlagenStatus;
  lastUpdate: string;
  temperaturen: { vl: number; rl: number; aussen: number };
  pumpen: { name: string; aktiv: boolean }[];
  alarme: AlarmEntry[];
  leistung: number;
  cop: number;
  betriebsstunden: number;
}

interface AlarmEntry {
  id: string;
  zeit: string;
  typ: 'error' | 'warning' | 'info';
  text: string;
  quittiert: boolean;
}

interface EmailConfig {
  aktiv: boolean;
  adressen: string[];
  beiAlarm: boolean;
  beiStandby: boolean;
  taeglicherBericht: boolean;
}

/* ═══════════════════════════════════════════════════════════
   DEMO STANDORTE
   ═══════════════════════════════════════════════════════════ */
function createDemoStandorte(liveData: HeatingData | null): Standort[] {
  const now = new Date().toLocaleString('de-DE');
  const vl = liveData?.vorlauftemperatur ?? 43;
  const rl = liveData?.ruecklauftemperatur ?? 28;
  const aus = liveData?.aussentemperatur ?? 5;
  const cop = liveData?.cop ?? 4.2;

  return [
    {
      id: 'DA-01',
      name: 'Darmstadt Hauptgebäude',
      adresse: 'Musterstraße 12, 64283 Darmstadt',
      anlageTyp: 'WP 175kW + PVT + Erdwärme',
      status: 'running',
      lastUpdate: now,
      temperaturen: { vl, rl, aussen: aus },
      pumpen: [
        { name: 'P01 Erdwärme', aktiv: true },
        { name: 'P02 Abluft-WP', aktiv: true },
        { name: 'P03 PVT-Sole', aktiv: true },
        { name: 'P04 Heizkreis', aktiv: true },
        { name: 'P05 Verteiler', aktiv: true },
      ],
      alarme: [],
      leistung: liveData?.stromverbrauch ?? 38.9,
      cop,
      betriebsstunden: liveData?.betriebsstunden ?? 12450,
    },
    {
      id: 'DA-02',
      name: 'Satellitenhaus E',
      adresse: 'Nebenweg 4, 64283 Darmstadt',
      anlageTyp: 'Heizkreis über Hauptstation',
      status: 'running',
      lastUpdate: now,
      temperaturen: { vl: vl - 2, rl: rl + 1, aussen: aus },
      pumpen: [
        { name: 'P-SAT Umwälzung', aktiv: true },
      ],
      alarme: [],
      leistung: 5.2,
      cop: cop - 0.3,
      betriebsstunden: 11200,
    },
    {
      id: 'DA-03',
      name: 'Neubau West',
      adresse: 'Westring 8, 64283 Darmstadt',
      anlageTyp: 'WP 90kW + Erdwärme',
      status: 'alarm',
      lastUpdate: now,
      temperaturen: { vl: 35, rl: 26, aussen: aus },
      pumpen: [
        { name: 'P01 Erdwärme', aktiv: true },
        { name: 'P02 Heizkreis', aktiv: false },
        { name: 'P03 Verteiler', aktiv: true },
      ],
      alarme: [
        { id: 'a1', zeit: now, typ: 'error', text: 'P02 Heizkreis – Pumpe ausgefallen, kein Durchfluss', quittiert: false },
        { id: 'a2', zeit: now, typ: 'warning', text: 'VL-Temperatur unter Sollwert (35°C < 40°C)', quittiert: false },
      ],
      leistung: 22.5,
      cop: 3.1,
      betriebsstunden: 8900,
    },
    {
      id: 'FFM-01',
      name: 'Frankfurt Bürogebäude',
      adresse: 'Mainzer Landstr. 55, 60329 Frankfurt',
      anlageTyp: 'WP 250kW + Solar + Kälte',
      status: 'standby',
      lastUpdate: now,
      temperaturen: { vl: 22, rl: 20, aussen: aus + 1 },
      pumpen: [
        { name: 'P01 Wärmepumpe', aktiv: false },
        { name: 'P02 Solar', aktiv: false },
        { name: 'P03 Kälte', aktiv: false },
      ],
      alarme: [
        { id: 'a3', zeit: now, typ: 'info', text: 'Anlage im Sommerbetrieb – nur Kühlung bei Bedarf', quittiert: true },
      ],
      leistung: 0,
      cop: 0,
      betriebsstunden: 15600,
    },
  ];
}

/* ═══════════════════════════════════════════════════════════
   STATUS BADGE
   ═══════════════════════════════════════════════════════════ */
function StatusBadge({ status }: { status: AnlagenStatus }) {
  const cfg = {
    running: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30', label: 'Läuft', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
    standby: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30', label: 'Standby', icon: <Clock className="w-3.5 h-3.5" /> },
    alarm: { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30', label: 'ALARM', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
    offline: { bg: 'bg-slate-500/15', text: 'text-slate-400', border: 'border-slate-500/30', label: 'Offline', icon: <XCircle className="w-3.5 h-3.5" /> },
  }[status];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      {cfg.icon} {cfg.label}
      {status === 'running' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
      {status === 'alarm' && <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════
   STANDORT CARD
   ═══════════════════════════════════════════════════════════ */
function StandortCard({ s, onQuittieren }: { s: Standort; onQuittieren: (sid: string, aid: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const offeneAlarme = s.alarme.filter(a => !a.quittiert);

  return (
    <div className={`rounded-xl border transition-all ${
      s.status === 'alarm'
        ? 'border-red-500/40 bg-red-500/5 shadow-lg shadow-red-500/5'
        : s.status === 'running'
          ? 'border-emerald-500/20 bg-[#111620]/80'
          : 'border-[#1e2736] bg-[#111620]/60'
    }`}>
      {/* Header */}
      <div className="p-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className={`mt-0.5 p-2 rounded-lg ${
              s.status === 'alarm' ? 'bg-red-500/10' : s.status === 'running' ? 'bg-emerald-500/10' : 'bg-slate-500/10'
            }`}>
              <MapPin className={`w-5 h-5 ${
                s.status === 'alarm' ? 'text-red-400' : s.status === 'running' ? 'text-emerald-400' : 'text-slate-400'
              }`} />
            </div>
            <div className="min-w-0">
              <h3 className="text-white font-bold text-sm truncate">{s.name}</h3>
              <p className="text-slate-500 text-xs truncate">{s.adresse}</p>
              <p className="text-slate-600 text-[10px] mt-0.5">{s.anlageTyp}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <StatusBadge status={s.status} />
            {offeneAlarme.length > 0 && (
              <span className="text-[10px] text-red-400 font-semibold">
                {offeneAlarme.length} offene{offeneAlarme.length > 1 ? ' Alarme' : 'r Alarm'}
              </span>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-2 mt-3">
          <MiniStat icon={<Thermometer className="w-3 h-3" />} label="VL/RL" value={`${s.temperaturen.vl}/${s.temperaturen.rl}°C`}
            color={s.status === 'alarm' ? 'text-red-400' : 'text-orange-400'} />
          <MiniStat icon={<Zap className="w-3 h-3" />} label="Leistung" value={`${s.leistung.toFixed(1)} kW`}
            color="text-amber-400" />
          <MiniStat icon={<Activity className="w-3 h-3" />} label="COP" value={s.cop > 0 ? s.cop.toFixed(1) : '--'}
            color="text-emerald-400" />
          <MiniStat icon={<Clock className="w-3 h-3" />} label="Betrieb" value={`${Math.floor(s.betriebsstunden).toLocaleString('de-DE')}h`}
            color="text-sky-400" />
        </div>

        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] text-slate-600">Aktualisiert: {s.lastUpdate}</span>
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-[#1e2736] px-4 py-3 space-y-3">
          {/* Pumpen */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 mb-1.5">Pumpen</h4>
            <div className="flex flex-wrap gap-1.5">
              {s.pumpen.map(p => (
                <span key={p.name} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${
                  p.aktiv
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${p.aktiv ? 'bg-emerald-400' : 'bg-red-400'}`} />
                  {p.name}
                </span>
              ))}
            </div>
          </div>

          {/* Alarme */}
          {s.alarme.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 mb-1.5">Alarme</h4>
              <div className="space-y-1">
                {s.alarme.map(a => (
                  <div key={a.id} className={`flex items-start gap-2 p-2 rounded-lg text-xs ${
                    a.typ === 'error' ? 'bg-red-500/8 border border-red-500/15' :
                    a.typ === 'warning' ? 'bg-amber-500/8 border border-amber-500/15' :
                    'bg-slate-500/8 border border-slate-500/15'
                  }`}>
                    <AlertTriangle className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                      a.typ === 'error' ? 'text-red-400' : a.typ === 'warning' ? 'text-amber-400' : 'text-slate-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium ${a.quittiert ? 'text-slate-500 line-through' : 'text-slate-300'}`}>{a.text}</p>
                      <p className="text-slate-600 text-[10px] mt-0.5">{a.zeit}</p>
                    </div>
                    {!a.quittiert && (
                      <Button size="sm" variant="ghost" className="text-[10px] h-6 px-2 text-slate-400 hover:text-white"
                        onClick={(e) => { e.stopPropagation(); onQuittieren(s.id, a.id); }}>
                        Quittieren
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Außentemperatur */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Thermometer className="w-3 h-3" />
            Außentemperatur: <span className="text-slate-300 font-medium">{s.temperaturen.aussen}°C</span>
          </div>
        </div>
      )}
    </div>
  );
}

function MiniStat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="bg-[#0a0e14]/50 rounded-lg p-1.5 text-center">
      <div className={`flex items-center justify-center gap-1 ${color} mb-0.5`}>{icon}</div>
      <div className={`text-xs font-bold ${color}`}>{value}</div>
      <div className="text-[9px] text-slate-600">{label}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   EMAIL KONFIGURATION
   ═══════════════════════════════════════════════════════════ */
function EmailSettings({ config, onChange }: { config: EmailConfig; onChange: (c: EmailConfig) => void }) {
  const [newEmail, setNewEmail] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  const addEmail = () => {
    const email = newEmail.trim();
    if (!email || !email.includes('@')) {
      toast.error('Bitte gültige E-Mail eingeben');
      return;
    }
    if (config.adressen.includes(email)) {
      toast.error('E-Mail bereits vorhanden');
      return;
    }
    onChange({ ...config, adressen: [...config.adressen, email] });
    setNewEmail('');
    toast.success(`${email} hinzugefügt`);
  };

  const removeEmail = (email: string) => {
    onChange({ ...config, adressen: config.adressen.filter(e => e !== email) });
    toast.info(`${email} entfernt`);
  };

  const sendTestEmail = () => {
    if (config.adressen.length === 0) {
      toast.error('Keine E-Mail-Adressen konfiguriert');
      return;
    }

    // Build email body with current status
    const subject = encodeURIComponent('KurTech Heizungsmonitoring – Testreport');
    const body = encodeURIComponent(
      `KurTech Heizungsmonitoring – Statusbericht\n` +
      `========================================\n\n` +
      `Datum: ${new Date().toLocaleString('de-DE')}\n\n` +
      `Dies ist ein Testbericht des Alarm-Systems.\n` +
      `Bei echten Alarmen erhalten Sie automatisch eine Benachrichtigung.\n\n` +
      `--\nKurTech Heizungsmonitoring v2.0\nkurtech.de`
    );

    window.open(`mailto:${config.adressen.join(',')}?subject=${subject}&body=${body}`, '_blank');
    toast.success('E-Mail-Client geöffnet');
  };

  // sendAlarmEmail could be triggered by backend webhook / MQTT alarm

  return (
    <div className="rounded-xl border border-[#1e2736] bg-[#111620]/80 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-sky-400" />
          <h3 className="text-white font-bold text-sm">E-Mail Benachrichtigung</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost"
            className={`h-7 px-2 text-xs ${config.aktiv ? 'text-emerald-400' : 'text-slate-500'}`}
            onClick={() => onChange({ ...config, aktiv: !config.aktiv })}>
            {config.aktiv ? <Bell className="w-3.5 h-3.5 mr-1" /> : <BellOff className="w-3.5 h-3.5 mr-1" />}
            {config.aktiv ? 'Aktiv' : 'Inaktiv'}
          </Button>
          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-slate-400"
            onClick={() => setShowSettings(!showSettings)}>
            <Settings2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* E-Mail Adressen */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type="email"
            placeholder="name@firma.de"
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addEmail()}
            className="flex-1 h-8 px-3 text-xs bg-[#0a0e14] border border-[#1e2736] rounded-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-500/50"
          />
          <Button size="sm" className="h-8 px-3 bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 border border-sky-500/20" onClick={addEmail}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Hinzufügen
          </Button>
        </div>

        {config.adressen.length > 0 ? (
          <div className="space-y-1">
            {config.adressen.map(email => (
              <div key={email} className="flex items-center justify-between bg-[#0a0e14]/50 rounded-lg px-3 py-1.5">
                <span className="text-xs text-slate-300 font-mono">{email}</span>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-slate-500 hover:text-red-400"
                  onClick={() => removeEmail(email)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-600 italic py-2">Keine E-Mail-Adressen konfiguriert</p>
        )}

        {/* Test + Send Buttons */}
        {config.adressen.length > 0 && (
          <div className="flex gap-2 pt-1">
            <Button size="sm" variant="ghost" className="h-7 px-3 text-xs text-slate-400 hover:text-white border border-[#1e2736]"
              onClick={sendTestEmail}>
              <Send className="w-3 h-3 mr-1" /> Test senden
            </Button>
          </div>
        )}
      </div>

      {/* Erweiterte Einstellungen */}
      {showSettings && (
        <div className="mt-3 pt-3 border-t border-[#1e2736] space-y-2">
          <h4 className="text-xs font-semibold text-slate-400 mb-2">Benachrichtigen bei:</h4>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={config.beiAlarm}
              onChange={e => onChange({ ...config, beiAlarm: e.target.checked })}
              className="rounded border-slate-600 bg-[#0a0e14] text-sky-500" />
            <span className="text-xs text-slate-300">Alarm (Fehler & Warnungen)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={config.beiStandby}
              onChange={e => onChange({ ...config, beiStandby: e.target.checked })}
              className="rounded border-slate-600 bg-[#0a0e14] text-sky-500" />
            <span className="text-xs text-slate-300">Anlage geht in Standby</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={config.taeglicherBericht}
              onChange={e => onChange({ ...config, taeglicherBericht: e.target.checked })}
              className="rounded border-slate-600 bg-[#0a0e14] text-sky-500" />
            <span className="text-xs text-slate-300">Täglicher Statusbericht (8:00 Uhr)</span>
          </label>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ÜBERSICHT HEADER
   ═══════════════════════════════════════════════════════════ */
function OverviewStats({ standorte }: { standorte: Standort[] }) {
  const running = standorte.filter(s => s.status === 'running').length;
  const alarm = standorte.filter(s => s.status === 'alarm').length;
  const standby = standorte.filter(s => s.status === 'standby').length;
  
  const totalAlarme = standorte.reduce((sum, s) => sum + s.alarme.filter(a => !a.quittiert).length, 0);
  const totalLeistung = standorte.reduce((sum, s) => sum + s.leistung, 0);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      <StatCard label="Gesamt" value={standorte.length.toString()} icon={<MapPin className="w-4 h-4" />} color="text-slate-300" bg="bg-slate-500/10" />
      <StatCard label="Laufend" value={running.toString()} icon={<CheckCircle2 className="w-4 h-4" />} color="text-emerald-400" bg="bg-emerald-500/10" />
      <StatCard label="Alarm" value={alarm.toString()} icon={<AlertTriangle className="w-4 h-4" />} color="text-red-400" bg="bg-red-500/10" pulse={alarm > 0} />
      <StatCard label="Standby" value={standby.toString()} icon={<Clock className="w-4 h-4" />} color="text-amber-400" bg="bg-amber-500/10" />
      <StatCard label="Offene Alarme" value={totalAlarme.toString()} icon={<Bell className="w-4 h-4" />} color={totalAlarme > 0 ? 'text-red-400' : 'text-slate-400'} bg={totalAlarme > 0 ? 'bg-red-500/10' : 'bg-slate-500/10'} />
      <StatCard label="Ges. Leistung" value={`${totalLeistung.toFixed(1)} kW`} icon={<Zap className="w-4 h-4" />} color="text-amber-400" bg="bg-amber-500/10" />
    </div>
  );
}

function StatCard({ label, value, icon, color, bg, pulse }: {
  label: string; value: string; icon: React.ReactNode; color: string; bg: string; pulse?: boolean;
}) {
  return (
    <div className={`rounded-xl border border-[#1e2736] ${bg} p-3`}>
      <div className={`flex items-center gap-1.5 ${color} mb-1`}>
        {icon}
        <span className="text-[10px] uppercase tracking-wider font-semibold opacity-60">{label}</span>
        {pulse && <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />}
      </div>
      <div className={`text-lg font-bold ${color}`}>{value}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   HAUPTKOMPONENTE
   ═══════════════════════════════════════════════════════════ */
export function StandorteDashboard({ data }: { data: HeatingData | null }) {
  const [standorte, setStandorte] = useState<Standort[]>([]);
  const [emailConfig, setEmailConfig] = useState<EmailConfig>(() => {
    const saved = localStorage.getItem('kurtech-email-config');
    return saved ? JSON.parse(saved) : {
      aktiv: false,
      adressen: [],
      beiAlarm: true,
      beiStandby: false,
      taeglicherBericht: false,
    };
  });

  // Init demo data
  useEffect(() => {
    setStandorte(createDemoStandorte(data));
  }, [data]);

  // Save email config
  useEffect(() => {
    localStorage.setItem('kurtech-email-config', JSON.stringify(emailConfig));
  }, [emailConfig]);

  const quittieren = (standortId: string, alarmId: string) => {
    setStandorte(prev => prev.map(s =>
      s.id === standortId
        ? { ...s, alarme: s.alarme.map(a => a.id === alarmId ? { ...a, quittiert: true } : a) }
        : s
    ));
    toast.success('Alarm quittiert');
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-sky-400" />
            Standort-Übersicht
          </h2>
          <p className="text-xs text-slate-500 mt-1">Alle Anlagen im Überblick</p>
        </div>
        <Button size="sm" variant="ghost"
          className="text-xs text-slate-400 border border-[#1e2736] hover:text-white">
          <Plus className="w-3.5 h-3.5 mr-1" /> Standort hinzufügen
        </Button>
      </div>

      {/* Overview Stats */}
      <OverviewStats standorte={standorte} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Standort Cards */}
        <div className="lg:col-span-2 space-y-4">
          {/* Alarme zuerst */}
          {standorte
            .sort((sa, sb) => {
              const prio: Record<AnlagenStatus, number> = { alarm: 0, offline: 1, running: 2, standby: 3 };
              return prio[sa.status] - prio[sb.status];
            })
            .map(s => (
              <StandortCard key={s.id} s={s} onQuittieren={quittieren} />
            ))}
        </div>

        {/* Email Config (rechte Seite) */}
        <div className="space-y-4">
          <EmailSettings config={emailConfig} onChange={setEmailConfig} />

          {/* Alarm-Protokoll */}
          <div className="rounded-xl border border-[#1e2736] bg-[#111620]/80 p-4">
            <h3 className="text-white font-bold text-sm flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Alarm-Protokoll
            </h3>
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {standorte.flatMap(s =>
                s.alarme.map(a => ({
                  ...a,
                  standort: s.name,
                  standortId: s.id,
                }))
              )
              .sort((sa, _sb) => sa.quittiert ? 1 : -1)
              .map(a => (
                <div key={a.id} className={`flex items-start gap-2 px-2.5 py-1.5 rounded text-[11px] ${
                  a.quittiert ? 'opacity-40' : ''
                } ${
                  a.typ === 'error' ? 'bg-red-500/5' :
                  a.typ === 'warning' ? 'bg-amber-500/5' : 'bg-slate-500/5'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                    a.typ === 'error' ? 'bg-red-400' : a.typ === 'warning' ? 'bg-amber-400' : 'bg-slate-400'
                  }`} />
                  <div>
                    <span className="text-slate-500 font-medium">{a.standort}:</span>{' '}
                    <span className="text-slate-300">{a.text}</span>
                  </div>
                </div>
              ))}
              {standorte.every(s => s.alarme.length === 0) && (
                <p className="text-xs text-slate-600 italic text-center py-4">
                  Keine Alarme – alle Anlagen laufen normal
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

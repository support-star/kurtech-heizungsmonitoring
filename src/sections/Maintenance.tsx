import { useState } from 'react';
import { CheckCircle2, AlertCircle, Clock, Plus, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { ANLAGE_CONFIG } from '@/config/mqtt.config';

interface MaintenanceEntry {
  id: string; date: string;
  type: 'wartung' | 'inspektion' | 'reparatur' | 'tausch';
  title: string; technician: string; notes: string; completed: boolean;
}
interface Task {
  id: string; title: string; interval: string; lastDone: string;
  nextDue: string; status: 'ok' | 'due' | 'overdue'; category: string;
}

const INITIAL_LOG: MaintenanceEntry[] = [
  { id: '1', date: '2026-01-15', type: 'wartung',    title: 'Jahreswartung Wärmepumpe',     technician: 'M. Schulz', notes: 'Kältemitteldruck geprüft. Filter gereinigt. OK.', completed: true },
  { id: '2', date: '2025-09-03', type: 'inspektion', title: 'Hydraulikprüfung',             technician: 'A. Braun',  notes: 'Druckverlust festgestellt. Pumpe nachjustiert.', completed: true },
  { id: '3', date: '2025-06-20', type: 'tausch',     title: 'Filterwechsel Pufferspeicher', technician: 'M. Schulz', notes: 'Filter stark verschmutzt. Kürzere Intervalle empfohlen.', completed: true },
  { id: '4', date: '2025-03-10', type: 'reparatur',  title: 'Drucksensor ausgetauscht',     technician: 'T. Koch',   notes: 'Sensor defekt. Ersatzteil Nr. 4712 verbaut.', completed: true },
];

const INITIAL_TASKS: Task[] = [
  { id: 't1', title: 'Kältemitteldruck prüfen',     interval: '6 Monate',  lastDone: '2026-01-15', nextDue: '2026-07-15', status: 'ok',      category: 'Kältekreis' },
  { id: 't2', title: 'Filter reinigen',              interval: '3 Monate',  lastDone: '2026-01-15', nextDue: '2026-04-15', status: 'ok',      category: 'Filter' },
  { id: 't3', title: 'Glykol-Konzentration messen',  interval: '12 Monate', lastDone: '2025-06-20', nextDue: '2026-06-20', status: 'ok',      category: 'Hydraulik' },
  { id: 't4', title: 'Elektrische Anschlüsse',       interval: '12 Monate', lastDone: '2025-01-20', nextDue: '2026-01-20', status: 'due',     category: 'Elektrik' },
  { id: 't5', title: 'Abtauautomatik testen',        interval: '6 Monate',  lastDone: '2025-09-03', nextDue: '2026-03-03', status: 'overdue', category: 'Funktion' },
  { id: 't6', title: 'Betriebsprotokoll auswerten',  interval: '1 Monat',   lastDone: '2026-01-01', nextDue: '2026-02-01', status: 'overdue', category: 'Dokumentation' },
];

const typeConf = {
  wartung:    { label: 'Wartung',    cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' },
  inspektion: { label: 'Inspektion', cls: 'bg-sky-500/15 text-sky-400 border-sky-500/25' },
  reparatur:  { label: 'Reparatur',  cls: 'bg-red-500/15 text-red-400 border-red-500/25' },
  tausch:     { label: 'Tausch',     cls: 'bg-amber-500/15 text-amber-400 border-amber-500/25' },
};

const statusConf = {
  ok:      { label: 'OK',      icon: <CheckCircle2 className="w-4 h-4" />, cls: 'text-emerald-400 bg-emerald-500/8 border-emerald-500/20' },
  due:     { label: 'Fällig',  icon: <Clock className="w-4 h-4" />,        cls: 'text-amber-400 bg-amber-500/8 border-amber-500/20' },
  overdue: { label: 'Überfällig', icon: <AlertCircle className="w-4 h-4" />, cls: 'text-red-400 bg-red-500/8 border-red-500/20' },
};

function LogEntry({ entry }: { entry: MaintenanceEntry }) {
  const [open, setOpen] = useState(false);
  const tc = typeConf[entry.type];
  return (
    <div className="rounded-xl border border-[#1a2235] bg-[#0d1220] overflow-hidden">
      <button className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#111827] transition-colors" onClick={() => setOpen(!open)}>
        <div className="text-[10px] text-slate-700 font-mono shrink-0">{entry.date}</div>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${tc.cls} shrink-0`}>{tc.label}</span>
        <span className="text-sm text-white font-medium flex-1 truncate">{entry.title}</span>
        <span className="text-[11px] text-slate-600 shrink-0 hidden sm:block">{entry.technician}</span>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-slate-600 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-600 shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-3 border-t border-[#1a2235]">
          <p className="text-xs text-slate-500 mt-2.5 leading-relaxed">{entry.notes}</p>
          <div className="flex gap-3 mt-2">
            <span className="text-[10px] text-slate-700">Techniker: <span className="text-slate-500">{entry.technician}</span></span>
            {entry.completed && <span className="text-[10px] text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Abgeschlossen</span>}
          </div>
        </div>
      )}
    </div>
  );
}

export function Maintenance() {
  const [log, setLog] = useState<MaintenanceEntry[]>(INITIAL_LOG);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [tab, setTab] = useState<'tasks' | 'log' | 'new'>('tasks');
  const [form, setForm] = useState({ type: 'wartung', title: '', technician: '', notes: '', date: new Date().toISOString().slice(0,10) });

  const overdue = tasks.filter(t => t.status === 'overdue').length;
  const due = tasks.filter(t => t.status === 'due').length;

  const handleAddEntry = () => {
    if (!form.title || !form.technician) return;
    const entry: MaintenanceEntry = {
      id: Date.now().toString(), ...form,
      type: form.type as MaintenanceEntry['type'],
      completed: true,
    };
    setLog(prev => [entry, ...prev]);
    setForm({ type: 'wartung', title: '', technician: '', notes: '', date: new Date().toISOString().slice(0,10) });
    setTab('log');
  };

  const markDone = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'ok' as const, lastDone: new Date().toISOString().slice(0,10) } : t));
  };

  return (
    <div className="space-y-4">
      {/* Header stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-[#1a2235] bg-[#0a0f1a] p-4">
          <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-1">Anlage</p>
          <p className="font-mono text-sm font-bold text-white">{ANLAGE_CONFIG.id}</p>
          <p className="text-[10px] text-slate-700 mt-0.5">{ANLAGE_CONFIG.gesamtleistung}</p>
        </div>
        <div className={`rounded-xl border p-4 ${overdue > 0 ? 'border-red-500/20 bg-red-500/5' : 'border-[#1a2235] bg-[#0a0f1a]'}`}>
          <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-1">Überfällig</p>
          <p className={`font-mono text-2xl font-bold ${overdue > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{overdue}</p>
        </div>
        <div className={`rounded-xl border p-4 ${due > 0 ? 'border-amber-500/20 bg-amber-500/5' : 'border-[#1a2235] bg-[#0a0f1a]'}`}>
          <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-1">Fällig</p>
          <p className={`font-mono text-2xl font-bold ${due > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>{due}</p>
        </div>
        <div className="rounded-xl border border-[#1a2235] bg-[#0a0f1a] p-4">
          <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-1">Einträge gesamt</p>
          <p className="font-mono text-2xl font-bold text-slate-300">{log.length}</p>
        </div>
      </div>

      {/* Tab card */}
      <div className="rounded-2xl border border-[#1a2235] bg-[#0a0f1a] overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-[#1a2235]">
          {[
            { key: 'tasks', label: 'Aufgaben', icon: <Clock className="w-3.5 h-3.5" /> },
            { key: 'log',   label: 'Protokoll', icon: <Calendar className="w-3.5 h-3.5" /> },
            { key: 'new',   label: 'Eintrag hinzufügen', icon: <Plus className="w-3.5 h-3.5" /> },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as typeof tab)}
              className={`flex items-center gap-2 px-5 py-3.5 text-xs font-medium border-b-2 transition-all ${
                tab === t.key
                  ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                  : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-[#0d1220]'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* Tasks */}
          {tab === 'tasks' && (
            <div className="space-y-2">
              {tasks.map(task => {
                const sc = statusConf[task.status];
                return (
                  <div key={task.id} className="flex items-center gap-3 rounded-xl border border-[#1a2235] bg-[#0d1220] px-4 py-3">
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs ${sc.cls} shrink-0`}>
                      {sc.icon} <span className="hidden sm:inline">{sc.label}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{task.title}</p>
                      <p className="text-[10px] text-slate-600">
                        {task.category} · Alle {task.interval} · Nächste: <span className="text-slate-500">{task.nextDue}</span>
                      </p>
                    </div>
                    {task.status !== 'ok' && (
                      <button onClick={() => markDone(task.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-all border border-emerald-500/20 shrink-0"
                      >
                        Erledigt
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Log */}
          {tab === 'log' && (
            <div className="space-y-2">
              {log.map(entry => <LogEntry key={entry.id} entry={entry} />)}
            </div>
          )}

          {/* New entry form */}
          {tab === 'new' && (
            <div className="space-y-4 max-w-lg">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Typ</label>
                  <select
                    value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#0d1220] border border-[#1a2235] text-white text-sm focus:outline-none focus:border-emerald-500/40"
                  >
                    {Object.entries(typeConf).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Datum</label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#0d1220] border border-[#1a2235] text-white text-sm focus:outline-none focus:border-emerald-500/40"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Titel *</label>
                <input type="text" placeholder="z.B. Jahreswartung Wärmepumpe" value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#0d1220] border border-[#1a2235] text-white text-sm focus:outline-none focus:border-emerald-500/40 placeholder:text-slate-700"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Techniker *</label>
                <input type="text" placeholder="Name Techniker" value={form.technician}
                  onChange={e => setForm(f => ({ ...f, technician: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#0d1220] border border-[#1a2235] text-white text-sm focus:outline-none focus:border-emerald-500/40 placeholder:text-slate-700"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Notizen</label>
                <textarea rows={3} placeholder="Durchgeführte Arbeiten, Befunde, Empfehlungen…" value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#0d1220] border border-[#1a2235] text-white text-sm focus:outline-none focus:border-emerald-500/40 placeholder:text-slate-700 resize-none"
                />
              </div>
              <button onClick={handleAddEntry}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all shadow-lg shadow-emerald-500/15"
              >
                Eintrag speichern
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

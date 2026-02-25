import { useState } from 'react';
import { Wrench, CheckCircle2, AlertCircle, Clock, Plus, Calendar, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { ANLAGE_CONFIG } from '@/config/mqtt.config';

interface MaintenanceEntry {
  id: string;
  date: string;
  type: 'wartung' | 'inspektion' | 'reparatur' | 'tausch';
  title: string;
  technician: string;
  notes: string;
  completed: boolean;
}

interface Task {
  id: string;
  title: string;
  interval: string;
  lastDone: string;
  nextDue: string;
  status: 'ok' | 'due' | 'overdue';
  category: string;
}

const INITIAL_LOG: MaintenanceEntry[] = [
  { id: '1', date: '2026-01-15', type: 'wartung',    title: 'Jahreswartung Wärmepumpe',      technician: 'M. Schulz',   notes: 'Kältemitteldruck geprüft. Filter gereinigt. Alles in Ordnung.',  completed: true },
  { id: '2', date: '2025-09-03', type: 'inspektion', title: 'Hydraulikprüfung',              technician: 'A. Braun',    notes: 'Druckverlust im Heizkreis festgestellt. Pumpe nachjustiert.', completed: true },
  { id: '3', date: '2025-06-20', type: 'tausch',     title: 'Filterwechsel Pufferspeicher',  technician: 'M. Schulz',   notes: 'Filter stark verschmutzt. Empfehle kürzere Wartungsintervalle.', completed: true },
  { id: '4', date: '2025-03-10', type: 'reparatur',  title: 'Drucksensor ausgetauscht',      technician: 'T. Koch',     notes: 'Sensor defekt. Ersatzteil Nr. 4712 verbaut.', completed: true },
];

const INITIAL_TASKS: Task[] = [
  { id: 't1', title: 'Kältemitteldruck prüfen',    interval: '6 Monate',  lastDone: '2026-01-15', nextDue: '2026-07-15', status: 'ok',      category: 'Kältekreis' },
  { id: 't2', title: 'Filter reinigen',             interval: '3 Monate',  lastDone: '2026-01-15', nextDue: '2026-04-15', status: 'ok',      category: 'Filter' },
  { id: 't3', title: 'Glykol-Konzentration messen', interval: '12 Monate', lastDone: '2025-06-20', nextDue: '2026-06-20', status: 'ok',      category: 'Hydraulik' },
  { id: 't4', title: 'Elektrische Anschlüsse',      interval: '12 Monate', lastDone: '2025-01-20', nextDue: '2026-01-20', status: 'due',     category: 'Elektrik' },
  { id: 't5', title: 'Abtauautomatik testen',       interval: '6 Monate',  lastDone: '2025-09-03', nextDue: '2026-03-03', status: 'overdue', category: 'Funktion' },
  { id: 't6', title: 'Betriebsprotokoll auswerten', interval: '1 Monat',   lastDone: '2026-01-01', nextDue: '2026-02-01', status: 'overdue', category: 'Dokumentation' },
];

const typeConfig: Record<string, { label: string; color: string; bg: string }> = {
  wartung:    { label: 'Wartung',    color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30' },
  inspektion: { label: 'Inspektion', color: 'text-sky-400',     bg: 'bg-sky-500/15 border-sky-500/30' },
  reparatur:  { label: 'Reparatur',  color: 'text-red-400',     bg: 'bg-red-500/15 border-red-500/30' },
  tausch:     { label: 'Tausch',     color: 'text-amber-400',   bg: 'bg-amber-500/15 border-amber-500/30' },
};

const statusConfig: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
  ok:      { label: 'OK',         icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />, cls: 'text-emerald-400' },
  due:     { label: 'Fällig',     icon: <Clock className="w-4 h-4 text-amber-400" />,          cls: 'text-amber-400' },
  overdue: { label: 'Überfällig', icon: <AlertCircle className="w-4 h-4 text-red-400" />,      cls: 'text-red-400' },
};

function NewEntryForm({ onAdd, onCancel }: { onAdd: (e: MaintenanceEntry) => void; onCancel: () => void }) {
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), type: 'wartung', title: '', technician: '', notes: '' });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-[#0d1117] p-5 space-y-4">
      <h4 className="text-sm font-semibold text-white">Neuer Eintrag</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-slate-400">Datum</label>
          <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
            className="w-full bg-[#111620] border border-[#1e2736] text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-emerald-500/50" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-400">Typ</label>
          <select value={form.type} onChange={e => set('type', e.target.value)}
            className="w-full bg-[#111620] border border-[#1e2736] text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-emerald-500/50">
            {Object.entries(typeConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-400">Titel</label>
          <input type="text" placeholder="z.B. Jahreswartung" value={form.title} onChange={e => set('title', e.target.value)}
            className="w-full bg-[#111620] border border-[#1e2736] text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-emerald-500/50 placeholder:text-slate-600" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-400">Techniker</label>
          <input type="text" placeholder="Name" value={form.technician} onChange={e => set('technician', e.target.value)}
            className="w-full bg-[#111620] border border-[#1e2736] text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-emerald-500/50 placeholder:text-slate-600" />
        </div>
        <div className="sm:col-span-2 space-y-1">
          <label className="text-xs text-slate-400">Notizen</label>
          <textarea rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Beschreibung der durchgeführten Arbeiten..."
            className="w-full bg-[#111620] border border-[#1e2736] text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-emerald-500/50 placeholder:text-slate-600 resize-none" />
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => { if (form.title && form.technician) onAdd({ ...form, type: form.type as any, id: Date.now().toString(), completed: true }); }}
          className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 text-sm font-medium rounded-lg px-4 py-2 transition-all">
          Speichern
        </button>
        <button onClick={onCancel} className="px-4 py-2 text-slate-400 hover:text-white text-sm rounded-lg border border-[#1e2736] hover:border-[#2a3548] transition-all">
          Abbrechen
        </button>
      </div>
    </div>
  );
}

export function Maintenance() {
  const [log, setLog] = useState<MaintenanceEntry[]>(INITIAL_LOG);
  const [tasks] = useState<Task[]>(INITIAL_TASKS);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const addEntry = (e: MaintenanceEntry) => { setLog(prev => [e, ...prev]); setShowForm(false); };

  const overdueCount = tasks.filter(t => t.status === 'overdue').length;
  const dueCount     = tasks.filter(t => t.status === 'due').length;

  return (
    <div className="space-y-6">
      {/* Header KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Anlage',           value: ANLAGE_CONFIG.id,          cls: 'text-white' },
          { label: 'Einträge gesamt',  value: String(log.length),        cls: 'text-emerald-400' },
          { label: 'Aufgaben fällig',  value: String(dueCount),          cls: dueCount > 0 ? 'text-amber-400' : 'text-emerald-400' },
          { label: 'Überfällig',       value: String(overdueCount),      cls: overdueCount > 0 ? 'text-red-400' : 'text-emerald-400' },
        ].map(({ label, value, cls }) => (
          <div key={label} className="rounded-xl border border-[#1e2736] bg-[#111620]/80 p-4">
            <p className="text-[11px] text-slate-500 mb-1">{label}</p>
            <p className={`text-xl font-bold ${cls}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Aufgaben */}
      <div className="rounded-2xl border border-[#1e2736] bg-[#111620]/80 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#1e2736]">
          <Clock className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-white">Wiederkehrende Aufgaben</h3>
        </div>
        <div className="divide-y divide-[#1e2736]">
          {tasks.map(task => {
            const st = statusConfig[task.status];
            return (
              <div key={task.id} className="flex items-center justify-between px-5 py-3 hover:bg-[#0d1117]/50 transition-colors">
                <div className="flex items-center gap-3">
                  {st.icon}
                  <div>
                    <p className="text-sm text-slate-200">{task.title}</p>
                    <p className="text-[10px] text-slate-500">{task.category} · alle {task.interval}</p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className={`text-xs font-medium ${st.cls}`}>{task.nextDue}</p>
                  <p className="text-[10px] text-slate-600">zuletzt: {task.lastDone}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Servicelogbuch */}
      <div className="rounded-2xl border border-[#1e2736] bg-[#111620]/80 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e2736]">
          <div className="flex items-center gap-3">
            <Wrench className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">Servicelogbuch</h3>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Neuer Eintrag
          </button>
        </div>

        <div className="p-5 space-y-3">
          {showForm && <NewEntryForm onAdd={addEntry} onCancel={() => setShowForm(false)} />}

          {log.map(entry => {
            const tc = typeConfig[entry.type];
            const isOpen = expanded === entry.id;
            return (
              <div key={entry.id} className="rounded-xl border border-[#1e2736] bg-[#0d1117] overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#111620]/50 transition-colors"
                  onClick={() => setExpanded(isOpen ? null : entry.id)}
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
                    <div className="text-left">
                      <p className="text-sm text-slate-200 font-medium">{entry.title}</p>
                      <p className="text-[10px] text-slate-500">{entry.date} · {entry.technician}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${tc.bg} ${tc.color}`}>{tc.label}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                  </div>
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 border-t border-[#1e2736]">
                    <div className="flex items-start gap-2 mt-3">
                      <Info className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                      <p className="text-sm text-slate-400">{entry.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

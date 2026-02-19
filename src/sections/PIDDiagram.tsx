import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import type { HeatingData } from '@/types/heating';

import pidHeizungImg from '@/assets/pid-heizung.png';
import pidKuehlungImg from '@/assets/pid-kuehlung.png';

// ═══════════════════════════════════════════════════════════════
//  HOTSPOT-KONFIGURATION  (x, y, w, h in Prozent des Bildes)
// ═══════════════════════════════════════════════════════════════

interface Hotspot {
  id: string;
  name: string;
  desc: string;
  x: number; y: number; w: number; h: number;
  dn?: string;
  power?: string;
  flow?: number;
  getTemp?: (d: HeatingData) => string;
  getTempReturn?: (d: HeatingData) => string;
  getStatus?: (d: HeatingData) => 'running' | 'standby' | 'off';
}

const HEIZ_HOTSPOTS: Hotspot[] = [
  { id: 'ABWP', name: 'Abluft-Wärmepumpe', desc: 'auf Dach', x: 23, y: 1, w: 6, h: 7, power: 'Rohrbegl.heizung',
    getStatus: d => d.status === 'heizen' ? 'running' : 'standby' },
  { id: 'PVT', name: 'PVT-Solarkollektoren', desc: 'auf Dach, th. Leistung 6,2 kW', x: 5, y: 6, w: 8, h: 7, power: '6,2 kW th.',
    getTemp: d => d.aussentemperatur?.toFixed(1) + '°C', getStatus: () => 'running' },
  { id: 'P02', name: 'Pumpe P02', desc: 'Umwälzpumpe Abluft-WP', x: 17, y: 16, w: 3, h: 5, flow: 15.2, dn: 'DN 65',
    getStatus: d => d.status === 'heizen' ? 'running' : 'off' },
  { id: 'PS1', name: 'Pufferspeicher PVT', desc: '2000 Liter, hydr. Trennung', x: 9, y: 18, w: 6, h: 32, power: '2000 L', dn: 'DN 100',
    getTemp: d => d.puffer_oben?.toFixed(1) + '°C', getStatus: d => d.status === 'heizen' ? 'running' : 'standby' },
  { id: 'P01', name: 'Pumpe P01', desc: 'Umwälzpumpe Erdwärmefeld', x: 10, y: 23, w: 3, h: 5, flow: 42.1, dn: 'DN 80',
    getStatus: d => d.status === 'heizen' ? 'running' : 'off' },
  { id: 'ERD', name: 'Erdwärmefeld', desc: 'Zuleitung FVU Nahwärme', x: 0, y: 24, w: 7, h: 6, flow: 42.1,
    getStatus: d => d.status === 'heizen' ? 'running' : 'standby' },
  { id: 'P03', name: 'Pumpe P03', desc: 'Umwälzpumpe Puffer PVT', x: 19, y: 23, w: 3, h: 5, flow: 28.5, dn: 'DN 100',
    getStatus: d => d.status === 'heizen' ? 'running' : 'off' },
  { id: 'WT1', name: 'Wärmetauscher', desc: 'Plattenwärmetauscher 47 kW', x: 17, y: 36, w: 4, h: 18, power: '47 kW', dn: 'DN 80',
    getStatus: d => d.status === 'heizen' ? 'running' : 'standby' },
  { id: 'WP1', name: 'Wärmepumpe', desc: '175 kW th. / 38,9 kW el.', x: 25, y: 33, w: 11, h: 17, power: '175 kW', dn: 'DN 100',
    getTemp: d => d.vorlauftemperatur?.toFixed(1) + '°C', getTempReturn: d => d.ruecklauftemperatur?.toFixed(1) + '°C',
    getStatus: d => d.status === 'heizen' ? 'running' : 'standby' },
  { id: 'P04', name: 'Pumpe P04', desc: 'Umwälzpumpe Heizung', x: 36, y: 34, w: 3, h: 5, flow: 18.3, dn: 'DN 100',
    getStatus: d => d.status === 'heizen' ? 'running' : 'off' },
  { id: 'PS2', name: 'Pufferspeicher Heizung', desc: '1500 Liter', x: 42, y: 21, w: 6, h: 30, power: '1500 L', dn: 'DN 80',
    getTemp: d => d.vorlauftemperatur?.toFixed(1) + '°C', getTempReturn: d => d.ruecklauftemperatur?.toFixed(1) + '°C',
    getStatus: d => d.status === 'heizen' ? 'running' : 'standby' },
  { id: 'P05', name: 'Pumpe P05', desc: 'Umwälzpumpe Puffer HZ', x: 60, y: 27, w: 3, h: 5, flow: 22.1, dn: 'DN 80',
    getStatus: d => d.status === 'heizen' ? 'running' : 'off' },
  { id: 'VH', name: 'Verteiler Heizung', desc: 'Heizungsverteiler', x: 60, y: 36, w: 18, h: 8, dn: 'DN 80',
    getStatus: d => d.status === 'heizen' ? 'running' : 'standby' },
];

const KUEHL_HOTSPOTS: Hotspot[] = [
  { id: 'PS3', name: 'Pufferspeicher Kälte', desc: '1000 Liter', x: 20, y: 25, w: 7, h: 42, power: '1000 L', dn: 'DN 80',
    getStatus: d => d.status === 'standby' ? 'running' : 'standby' },
  { id: 'P07', name: 'Pumpe P07', desc: 'Umwälzpumpe Kältepuffer', x: 38, y: 36, w: 4, h: 5, flow: 8.7, dn: 'DN 50',
    getStatus: d => d.status === 'standby' ? 'running' : 'off' },
  { id: 'VK', name: 'Verteiler Kühlung', desc: 'Kühlverteiler', x: 36, y: 64, w: 20, h: 7, dn: 'DN 50',
    getStatus: d => d.status === 'standby' ? 'running' : 'standby' },
  { id: 'P06', name: 'Pumpe P06', desc: 'Umwälzpumpe Kühlung', x: 8, y: 73, w: 4, h: 5, flow: 12.4, dn: 'DN 80',
    getStatus: d => d.status === 'standby' ? 'running' : 'off' },
];

// ═══════════════════════════════════════════════════════════════

interface PIDDiagramProps {
  data: HeatingData | null;
}

export function PIDDiagram({ data }: PIDDiagramProps) {
  const [tab, setTab] = useState<'heizung' | 'kuehlung'>('heizung');
  const [selected, setSelected] = useState<Hotspot | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [mousePos, setMousePos] = useState('');

  const heating = data?.status === 'heizen';
  const imgSrc = tab === 'heizung' ? pidHeizungImg : pidKuehlungImg;
  const hotspots = tab === 'heizung' ? HEIZ_HOTSPOTS : KUEHL_HOTSPOTS;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">P&ID-Diagramm</h2>
          <p className="text-sm text-slate-400">② Hauptstation + Anschluss Satellitenhaus</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Edit Toggle */}
          <button onClick={() => setEditMode(!editMode)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${
              editMode ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' : 'text-slate-400 border-slate-700 hover:border-slate-500'
            }`}>
            {editMode ? '📐 Edit AN' : '📐 Positionen'}
          </button>
          {/* Tabs */}
          <div className="flex gap-1 bg-[#111620] rounded-lg border border-[#1e2736] p-1">
            <button onClick={() => { setTab('heizung'); setSelected(null); }}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                tab === 'heizung' ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30' : 'text-slate-400 border border-transparent'
              }`}>🔥 Heizung</button>
            <button onClick={() => { setTab('kuehlung'); setSelected(null); }}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                tab === 'kuehlung' ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 border border-transparent'
              }`}>❄️ Kühlung</button>
          </div>
        </div>
      </div>

      {/* Status-Bar */}
      <div className="flex flex-wrap items-center gap-4 px-3 py-2 bg-[#111620]/50 rounded-lg border border-[#1e2736] text-xs">
        <span className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${heating ? 'bg-orange-400 animate-pulse' : 'bg-slate-600'}`} />
          <span className={heating ? 'text-orange-400 font-medium' : 'text-slate-500'}>Heizen</span>
        </span>
        <span className="text-slate-700">|</span>
        <span className="text-slate-400 font-mono">VL <span className="text-orange-400">{data?.vorlauftemperatur?.toFixed(1) ?? '--'}°C</span></span>
        <span className="text-slate-400 font-mono">RL <span className="text-sky-400">{data?.ruecklauftemperatur?.toFixed(1) ?? '--'}°C</span></span>
        <span className="text-slate-400 font-mono">COP <span className="text-emerald-400">{data?.cop?.toFixed(1) ?? '--'}</span></span>
        <span className="text-slate-400 font-mono">Außen <span className="text-emerald-400">{data?.aussentemperatur?.toFixed(1) ?? '--'}°C</span></span>
      </div>

      {/* Edit-Modus Koordinaten */}
      {editMode && (
        <div className="px-3 py-2 bg-amber-500/10 rounded-lg border border-amber-500/30 text-xs font-mono text-amber-400">
          📐 Edit-Modus: Bewege die Maus über das Bild → <span className="font-bold">{mousePos || 'Warte auf Maus...'}</span>
          <span className="text-amber-400/50 ml-2">• Alle Hotspots werden als gelbe Rahmen angezeigt</span>
        </div>
      )}

      {/* ══════ BILD MIT HOTSPOTS ══════ */}
      <div
        className="relative overflow-auto rounded-xl border border-[#1e2736]"
        style={{ maxHeight: '650px', background: '#fff' }}
        onClick={() => setSelected(null)}
      >
        {/* Bild als Block-Element - scrollbar statt transform */}
        <div
          className="relative inline-block"
          onMouseMove={e => {
            if (!editMode) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width * 100).toFixed(1);
            const y = ((e.clientY - rect.top) / rect.height * 100).toFixed(1);
            setMousePos(`x: ${x}%  y: ${y}%`);
          }}
        >
          <img
            src={imgSrc}
            alt={`P&ID ${tab}`}
            className="block"
            style={{ width: '1400px', height: 'auto' }}
            draggable={false}
          />

          {/* Hotspots */}
          {hotspots.map(h => {
            const status = data && h.getStatus ? h.getStatus(data) : 'standby';
            const active = status === 'running';
            const isSel = selected?.id === h.id;

            return (
              <div
                key={h.id}
                className="absolute cursor-pointer"
                style={{
                  left: `${h.x}%`,
                  top: `${h.y}%`,
                  width: `${h.w}%`,
                  height: `${h.h}%`,
                  border: isSel
                    ? '2px solid #10b981'
                    : editMode
                      ? '2px dashed #f59e0b'
                      : active
                        ? '2px solid rgba(16,185,129,0.4)'
                        : '2px solid transparent',
                  borderRadius: '4px',
                  background: isSel
                    ? 'rgba(16,185,129,0.15)'
                    : editMode
                      ? 'rgba(245,158,11,0.08)'
                      : active
                        ? 'rgba(16,185,129,0.05)'
                        : 'transparent',
                  transition: 'all 0.15s ease',
                }}
                onClick={e => { e.stopPropagation(); setSelected(h); }}
              >
                {/* Edit: ID + Koordinaten */}
                {editMode && (
                  <span style={{
                    position: 'absolute', top: -14, left: 0,
                    background: '#f59e0b', color: '#000', fontSize: 8,
                    fontWeight: 700, padding: '0 3px', borderRadius: 2,
                    whiteSpace: 'nowrap', fontFamily: 'monospace',
                    lineHeight: '12px',
                  }}>
                    {h.id} {h.x},{h.y}
                  </span>
                )}

                {/* Status-Dot */}
                {!editMode && (active || isSel) && (
                  <span style={{
                    position: 'absolute', top: -4, right: -4,
                    width: 10, height: 10, borderRadius: '50%',
                    background: active ? '#22c55e' : '#f59e0b',
                    border: '2px solid white',
                    boxShadow: active ? '0 0 6px rgba(34,197,94,0.5)' : 'none',
                    display: 'block',
                  }} />
                )}
              </div>
            );
          })}

          {/* Live-Temperaturen (nur Heizung, nur wenn nicht Edit-Modus) */}
          {tab === 'heizung' && data && !editMode && (
            <>
              <LiveLabel x={50} y={26} text={`${data.vorlauftemperatur?.toFixed(0)}°C`} color="#dc2626" />
              <LiveLabel x={50} y={42} text={`${data.ruecklauftemperatur?.toFixed(0)}°C`} color="#2563eb" />
              <LiveLabel x={16} y={25} text={`${data.puffer_oben?.toFixed(0)}°C`} color="#dc2626" />
              <LiveLabel x={16} y={33} text={`${data.puffer_mitte?.toFixed(0)}°C`} color="#ea580c" />
              <LiveLabel x={16} y={41} text={`${data.puffer_unten?.toFixed(0)}°C`} color="#2563eb" />
              <LiveLabel x={30} y={52} text={`COP ${data.cop?.toFixed(1)}`} color="#7c3aed" />
              <LiveLabel x={5} y={15} text={`Außen ${data.aussentemperatur?.toFixed(1)}°C`} color="#059669" />
            </>
          )}
        </div>
      </div>

      {/* Detail-Panel */}
      {selected && (
        <div className="bg-[#111620] rounded-xl border border-[#1e2736] p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="text-white font-bold text-sm">{selected.name}</h3>
              <p className="text-slate-400 text-xs">{selected.desc}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSelected(null)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <InfoChip label="ID" value={selected.id} />
            <InfoChip label="Status" badge={
              <Badge className={`text-[10px] ${
                (data && selected.getStatus?.(data)) === 'running' ? 'bg-emerald-500/20 text-emerald-400' :
                (data && selected.getStatus?.(data)) === 'standby' ? 'bg-amber-500/20 text-amber-400' :
                'bg-slate-500/20 text-slate-400'
              }`}>
                {(data && selected.getStatus?.(data)) === 'running' ? 'Laufend' :
                 (data && selected.getStatus?.(data)) === 'standby' ? 'Bereit' : 'Aus'}
              </Badge>
            } />
            {data && selected.getTemp && <InfoChip label="Vorlauf" value={selected.getTemp(data)} color="text-orange-400" />}
            {data && selected.getTempReturn && <InfoChip label="Rücklauf" value={selected.getTempReturn(data)} color="text-sky-400" />}
            {selected.flow != null && <InfoChip label="Durchfluss" value={`${selected.flow} m³/h`} color="text-emerald-400" />}
            {selected.dn && <InfoChip label="Nennweite" value={selected.dn} />}
            {selected.power && <InfoChip label="Leistung" value={selected.power} color="text-amber-400" />}
            {editMode && <InfoChip label="Position" value={`x:${selected.x} y:${selected.y} w:${selected.w} h:${selected.h}`} color="text-amber-400" />}
          </div>
        </div>
      )}

      {/* Hinweis */}
      <p className="text-[11px] text-slate-500 px-1">
        💡 Klicke Komponenten für Details · Scrolle im Bild zum Navigieren · Edit-Modus zeigt Koordinaten zum Anpassen
      </p>
    </div>
  );
}

// ─── Hilfs-Komponenten ───

function LiveLabel({ x, y, text, color }: { x: number; y: number; text: string; color: string }) {
  return (
    <div className="absolute pointer-events-none" style={{ left: `${x}%`, top: `${y}%` }}>
      <span style={{
        background: 'rgba(255,255,255,0.92)',
        color,
        fontSize: 11,
        fontWeight: 700,
        padding: '1px 5px',
        borderRadius: 3,
        border: `1.5px solid ${color}30`,
        whiteSpace: 'nowrap',
        fontFamily: "'JetBrains Mono', monospace",
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}>{text}</span>
    </div>
  );
}

function InfoChip({ label, value, badge, color = 'text-white' }: {
  label: string; value?: string; badge?: React.ReactNode; color?: string;
}) {
  return (
    <div className="bg-[#0a0e14] rounded-lg px-3 py-1.5 inline-flex items-center gap-2">
      <span className="text-[9px] text-slate-500 uppercase">{label}</span>
      {badge || <span className={`font-semibold text-xs ${color}`}>{value}</span>}
    </div>
  );
}

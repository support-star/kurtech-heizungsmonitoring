import { useState, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCcw, X } from 'lucide-react';
import type { HeatingData } from '@/types/heating';

// ═══════════════════════════════════════════════════════════════
//  HOTSPOT-DEFINITIONEN  (Positionen in % der Bildgröße)
//  → Einfach anpassbar: x/y in Prozent, w/h in Prozent
// ═══════════════════════════════════════════════════════════════

interface Hotspot {
  id: string;
  name: string;
  desc: string;
  /** Position & Größe in % des Bildes */
  x: number; y: number; w: number; h: number;
  dn?: string;
  power?: string;
  flow?: number;
  getTemp?: (d: HeatingData) => string | undefined;
  getTempReturn?: (d: HeatingData) => string | undefined;
  getStatus?: (d: HeatingData) => 'running' | 'standby' | 'off';
}

/** Live-Overlay: Temperatur-Werte über das Bild */
interface LiveOverlay {
  /** Position in % */
  x: number; y: number;
  getValue: (d: HeatingData) => string;
  color: string;
  fontSize?: number;
}

// ─── HEIZUNG HOTSPOTS (Bild 1: pid-heizung.png 2000x1204) ───
const HEIZUNG_HOTSPOTS: Hotspot[] = [
  {
    id: 'ABWP', name: 'Abluft-Wärmepumpe', desc: 'Abluft-WP auf Dach',
    x: 33, y: 2, w: 7, h: 8,
    power: 'Rohrbegl.heizung',
    getStatus: d => d.status === 'heizen' ? 'running' : 'standby',
  },
  {
    id: 'PVT', name: 'PVT-Solarkollektoren', desc: 'Zuleitung PVT auf Dach',
    x: 7, y: 6, w: 10, h: 9,
    power: '6,2 kW th.',
    getTemp: d => d.aussentemperatur?.toFixed(1) + '°C',
    getStatus: () => 'running',
  },
  {
    id: 'P02', name: 'Pumpe P02', desc: 'Umwälzpumpe Abluft-WP',
    x: 21, y: 17, w: 4, h: 5,
    flow: 15.2, dn: 'DN 65',
    getStatus: d => d.status === 'heizen' ? 'running' : 'off',
  },
  {
    id: 'PS1', name: 'Pufferspeicher PVT', desc: 'Hydr. Trennung / PVT, 2000 Liter',
    x: 12, y: 20, w: 8, h: 38,
    power: '2000 L', dn: 'DN 100',
    getTemp: d => d.puffer_oben?.toFixed(1) + '°C',
    getStatus: d => d.status === 'heizen' ? 'running' : 'standby',
  },
  {
    id: 'ERD', name: 'Erdwärmefeld', desc: 'Nahwärme aus Erdwärmefeld, FVU',
    x: 1, y: 24, w: 8, h: 7,
    flow: 42.1,
    getStatus: d => d.status === 'heizen' ? 'running' : 'standby',
  },
  {
    id: 'P01', name: 'Pumpe P01', desc: 'Umwälzpumpe Erdwärmefeld',
    x: 9, y: 25, w: 4, h: 5,
    flow: 42.1, dn: 'DN 80',
    getStatus: d => d.status === 'heizen' ? 'running' : 'off',
  },
  {
    id: 'P03', name: 'Pumpe P03', desc: 'Umwälzpumpe Puffer PVT',
    x: 27, y: 25, w: 4, h: 5,
    flow: 28.5, dn: 'DN 100',
    getStatus: d => d.status === 'heizen' ? 'running' : 'off',
  },
  {
    id: 'WT1', name: 'Wärmetauscher', desc: 'Plattenwärmetauscher, 47 kW',
    x: 20, y: 38, w: 6, h: 18,
    power: '47 kW', dn: 'DN 80',
    getStatus: d => d.status === 'heizen' ? 'running' : 'standby',
  },
  {
    id: 'WP1', name: 'Wärmepumpe', desc: 'Hauptwärmepumpe 175 kW th. / 38,9 kW el.',
    x: 30, y: 36, w: 13, h: 16,
    power: '175 kW', dn: 'DN 100',
    getTemp: d => d.vorlauftemperatur?.toFixed(1) + '°C',
    getTempReturn: d => d.ruecklauftemperatur?.toFixed(1) + '°C',
    getStatus: d => d.status === 'heizen' ? 'running' : 'standby',
  },
  {
    id: 'P04', name: 'Pumpe P04', desc: 'Umwälzpumpe Heizung',
    x: 43, y: 34, w: 4, h: 6,
    flow: 18.3, dn: 'DN 100',
    getStatus: d => d.status === 'heizen' ? 'running' : 'off',
  },
  {
    id: 'PS2', name: 'Pufferspeicher Heizung', desc: 'Heizungspuffer 1500 Liter',
    x: 50, y: 22, w: 8, h: 32,
    power: '1500 L', dn: 'DN 80',
    getTemp: d => d.vorlauftemperatur?.toFixed(1) + '°C',
    getTempReturn: d => d.ruecklauftemperatur?.toFixed(1) + '°C',
    getStatus: d => d.status === 'heizen' ? 'running' : 'standby',
  },
  {
    id: 'P05', name: 'Pumpe P05', desc: 'Umwälzpumpe Puffer HZ',
    x: 60, y: 28, w: 4, h: 5,
    flow: 22.1, dn: 'DN 80',
    getStatus: d => d.status === 'heizen' ? 'running' : 'off',
  },
  {
    id: 'VH', name: 'Verteiler Heizung', desc: 'Heizungsverteiler',
    x: 68, y: 35, w: 16, h: 10,
    dn: 'DN 80',
    getStatus: d => d.status === 'heizen' ? 'running' : 'standby',
  },
];

// Live-Overlays für Heizung
const HEIZUNG_OVERLAYS: LiveOverlay[] = [
  // Vorlauftemperatur am Puffer HZ oben
  { x: 58, y: 28, getValue: d => d.vorlauftemperatur?.toFixed(0) + '°C', color: '#dc2626', fontSize: 12 },
  // Rücklauftemperatur am Puffer HZ unten
  { x: 58, y: 44, getValue: d => d.ruecklauftemperatur?.toFixed(0) + '°C', color: '#2563eb', fontSize: 12 },
  // Puffer PVT oben
  { x: 18, y: 24, getValue: d => d.puffer_oben?.toFixed(0) + '°C', color: '#dc2626', fontSize: 11 },
  // Puffer PVT mitte
  { x: 18, y: 34, getValue: d => d.puffer_mitte?.toFixed(0) + '°C', color: '#ea580c', fontSize: 11 },
  // Puffer PVT unten
  { x: 18, y: 44, getValue: d => d.puffer_unten?.toFixed(0) + '°C', color: '#2563eb', fontSize: 11 },
  // Außentemperatur bei PVT
  { x: 8, y: 16, getValue: d => d.aussentemperatur?.toFixed(1) + '°C', color: '#059669', fontSize: 11 },
  // COP bei WP
  { x: 35, y: 54, getValue: d => 'COP: ' + d.cop?.toFixed(1), color: '#7c3aed', fontSize: 11 },
  // Status bei WP
  { x: 35, y: 47, getValue: d => d.status === 'heizen' ? '● HEIZEN' : d.status === 'abtauen' ? '● ABTAUEN' : '○ STANDBY', color: '#059669', fontSize: 10 },
];

// ─── KÜHLUNG HOTSPOTS (Bild 2: pid-kuehlung.png 2000x1211) ───
const KUEHLUNG_HOTSPOTS: Hotspot[] = [
  {
    id: 'PS3', name: 'Pufferspeicher Kälte', desc: 'Kältepuffer 1000 Liter',
    x: 18, y: 23, w: 8, h: 42,
    power: '1000 L', dn: 'DN 80',
    getStatus: d => d.status === 'standby' ? 'running' : 'standby',
  },
  {
    id: 'P07', name: 'Pumpe P07', desc: 'Umwälzpumpe Kältepuffer',
    x: 39, y: 35, w: 5, h: 6,
    flow: 8.7, dn: 'DN 50',
    getStatus: d => d.status === 'standby' ? 'running' : 'off',
  },
  {
    id: 'VK', name: 'Verteiler Kühlung', desc: 'Kühlverteiler',
    x: 38, y: 63, w: 18, h: 8,
    dn: 'DN 50',
    getStatus: d => d.status === 'standby' ? 'running' : 'standby',
  },
  {
    id: 'P06', name: 'Pumpe P06', desc: 'Umwälzpumpe Kühlung',
    x: 8, y: 73, w: 5, h: 6,
    flow: 12.4, dn: 'DN 80',
    getStatus: d => d.status === 'standby' ? 'running' : 'off',
  },
];

const KUEHLUNG_OVERLAYS: LiveOverlay[] = [
  // Kälte Puffer Temperaturen
  { x: 14, y: 35, getValue: () => '22°C', color: '#0891b2', fontSize: 11 },
  { x: 14, y: 58, getValue: () => '18°C', color: '#1d4ed8', fontSize: 11 },
];


// ═══════════════════════════════════════════════════════════════
//  DETAIL-PANEL
// ═══════════════════════════════════════════════════════════════

function DetailPanel({ comp, data, onClose }: { comp: Hotspot; data: HeatingData | null; onClose: () => void }) {
  const status = data && comp.getStatus ? comp.getStatus(data) : 'standby';
  const temp = data && comp.getTemp ? comp.getTemp(data) : undefined;
  const tempReturn = data && comp.getTempReturn ? comp.getTempReturn(data) : undefined;

  const sc = status === 'running' ? 'bg-emerald-500/20 text-emerald-400'
    : status === 'standby' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-500/20 text-slate-400';
  const sl = status === 'running' ? 'Laufend' : status === 'standby' ? 'Bereit' : 'Aus';

  return (
    <div className="absolute bottom-3 left-3 right-3 z-30 bg-[#0f1520]/95 backdrop-blur-xl border border-[#1e2736] rounded-xl p-4 shadow-2xl"
      onClick={e => e.stopPropagation()}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-white font-bold text-sm">{comp.name}</h3>
          <p className="text-slate-400 text-xs">{comp.desc}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="text-slate-400 hover:text-white -mt-1 -mr-1">
          <X className="w-4 h-4" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        <Chip label="ID" value={comp.id} mono />
        <Chip label="Status" badge={<Badge className={`text-[10px] ${sc}`}>{sl}</Badge>} />
        {temp && <Chip label="Vorlauf" value={temp} color="text-orange-400" />}
        {tempReturn && <Chip label="Rücklauf" value={tempReturn} color="text-sky-400" />}
        {comp.flow != null && <Chip label="Durchfluss" value={`${comp.flow} m³/h`} color="text-emerald-400" />}
        {comp.dn && <Chip label="Nennweite" value={comp.dn} />}
        {comp.power && <Chip label="Leistung" value={comp.power} color="text-amber-400" />}
      </div>
    </div>
  );
}

function Chip({ label, value, badge, color = 'text-white', mono }: {
  label: string; value?: string; badge?: React.ReactNode; color?: string; mono?: boolean;
}) {
  return (
    <div className="bg-[#111620] rounded-lg px-3 py-1.5">
      <span className="text-[9px] text-slate-500 uppercase mr-2">{label}</span>
      {badge || <span className={`font-semibold ${color} ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
//  P&ID BILD-VIEW MIT OVERLAYS
// ═══════════════════════════════════════════════════════════════

function PIDImageView({ imgSrc, hotspots, overlays, data, imgWidth, imgHeight }: {
  imgSrc: string;
  hotspots: Hotspot[];
  overlays: LiveOverlay[];
  data: HeatingData | null;
  imgWidth: number;
  imgHeight: number;
}) {
  const [zoom, setZoom] = useState(0.65);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selected, setSelected] = useState<Hotspot | null>(null);
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const onMD = (e: React.MouseEvent) => { dragging.current = true; dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }; };
  const onMM = (e: React.MouseEvent) => { if (!dragging.current) return; setPan({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y }); };
  const onMU = () => { dragging.current = false; };

  return (
    <div className="relative">
      {/* Zoom-Controls */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1 bg-[#111620]/90 backdrop-blur rounded-lg border border-[#1e2736] p-1">
        <Button variant="ghost" size="sm" onClick={() => setZoom(Math.max(0.3, zoom - 0.1))} className="text-slate-400 h-7 w-7 p-0"><ZoomOut className="w-3.5 h-3.5" /></Button>
        <span className="text-xs text-slate-400 w-10 text-center">{Math.round(zoom * 100)}%</span>
        <Button variant="ghost" size="sm" onClick={() => setZoom(Math.min(2, zoom + 0.1))} className="text-slate-400 h-7 w-7 p-0"><ZoomIn className="w-3.5 h-3.5" /></Button>
        <Button variant="ghost" size="sm" onClick={() => { setZoom(0.65); setPan({ x: 0, y: 0 }); }} className="text-slate-400 h-7 w-7 p-0"><RotateCcw className="w-3.5 h-3.5" /></Button>
      </div>

      {/* Bild + Overlays */}
      <div
        className="overflow-hidden rounded-xl border border-[#1e2736] cursor-grab active:cursor-grabbing select-none"
        style={{ height: '600px', background: '#f5f5f5' }}
        onMouseDown={onMD} onMouseMove={onMM} onMouseUp={onMU} onMouseLeave={onMU}
        onClick={() => setSelected(null)}
      >
        <div style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          position: 'relative',
          width: imgWidth,
          height: imgHeight,
        }}>
          {/* Original-Zeichnung */}
          <img src={imgSrc} alt="P&ID" style={{ width: imgWidth, height: imgHeight, display: 'block' }} draggable={false} />

          {/* Klickbare Hotspots */}
          {hotspots.map(h => {
            const status = data && h.getStatus ? h.getStatus(data) : 'standby';
            const isActive = status === 'running';
            const isSelected = selected?.id === h.id;

            return (
              <div key={h.id}
                className="absolute cursor-pointer transition-all duration-200"
                style={{
                  left: `${h.x}%`, top: `${h.y}%`,
                  width: `${h.w}%`, height: `${h.h}%`,
                  border: isSelected ? '2px solid #34d399' : isActive ? '2px solid rgba(16,185,129,0.4)' : '2px solid transparent',
                  borderRadius: 6,
                  background: isSelected ? 'rgba(16,185,129,0.08)' : isActive ? 'rgba(16,185,129,0.04)' : 'transparent',
                }}
                onClick={e => { e.stopPropagation(); setSelected(h); }}
                title={h.name}
              >
                {/* Status-Dot */}
                <div style={{
                  position: 'absolute', top: -4, right: -4,
                  width: 10, height: 10, borderRadius: '50%',
                  background: isActive ? '#22c55e' : status === 'standby' ? '#f59e0b' : '#64748b',
                  border: '2px solid white',
                  boxShadow: isActive ? '0 0 6px rgba(34,197,94,0.5)' : 'none',
                  display: isSelected || isActive ? 'block' : 'none',
                }} />
              </div>
            );
          })}

          {/* Live-Daten Overlays */}
          {data && overlays.map((ov, i) => (
            <div key={i} className="absolute pointer-events-none" style={{
              left: `${ov.x}%`, top: `${ov.y}%`,
            }}>
              <span style={{
                background: 'rgba(255,255,255,0.92)',
                color: ov.color,
                fontSize: ov.fontSize || 11,
                fontWeight: 700,
                padding: '1px 5px',
                borderRadius: 4,
                border: `1px solid ${ov.color}30`,
                whiteSpace: 'nowrap',
                fontFamily: 'JetBrains Mono, monospace',
              }}>
                {ov.getValue(data)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Detail-Panel */}
      {selected && <DetailPanel comp={selected} data={data} onClose={() => setSelected(null)} />}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
//  HAUPTKOMPONENTE
// ═══════════════════════════════════════════════════════════════

interface PIDDiagramProps {
  data: HeatingData | null;
}

export function PIDDiagram({ data }: PIDDiagramProps) {
  const [activeTab, setActiveTab] = useState<'heizung' | 'kuehlung'>('heizung');

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">P&ID-Diagramm</h2>
          <p className="text-sm text-slate-400">② Hauptstation + Anschluss an Satellitenhaus – Detail</p>
        </div>

        {/* Tab-Schalter */}
        <div className="flex items-center gap-1 bg-[#111620] rounded-lg border border-[#1e2736] p-1">
          <button
            onClick={() => setActiveTab('heizung')}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'heizung'
                ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
                : 'text-slate-400 hover:text-slate-300 border border-transparent'
            }`}
          >
            🔥 Heizung
          </button>
          <button
            onClick={() => setActiveTab('kuehlung')}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'kuehlung'
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-300 border border-transparent'
            }`}
          >
            ❄️ Kühlung
          </button>
        </div>
      </div>

      {/* Status-Bar */}
      <div className="flex flex-wrap items-center gap-4 px-4 py-2 bg-[#111620]/60 rounded-lg border border-[#1e2736] text-xs">
        <span className="text-slate-500">Status:</span>
        <span className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${data?.status === 'heizen' ? 'bg-orange-400 animate-pulse' : 'bg-slate-600'}`} />
          <span className={data?.status === 'heizen' ? 'text-orange-400' : 'text-slate-500'}>Heizen</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${data?.status === 'standby' ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600'}`} />
          <span className={data?.status === 'standby' ? 'text-cyan-400' : 'text-slate-500'}>Standby</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${data?.status === 'abtauen' ? 'bg-blue-400 animate-pulse' : 'bg-slate-600'}`} />
          <span className={data?.status === 'abtauen' ? 'text-blue-400' : 'text-slate-500'}>Abtauen</span>
        </span>
        <span className="text-slate-600">|</span>
        <span className="text-slate-400">
          VL: <span className="text-orange-400 font-mono">{data?.vorlauftemperatur?.toFixed(1) ?? '--'}°C</span>
        </span>
        <span className="text-slate-400">
          RL: <span className="text-sky-400 font-mono">{data?.ruecklauftemperatur?.toFixed(1) ?? '--'}°C</span>
        </span>
        <span className="text-slate-400">
          COP: <span className="text-emerald-400 font-mono">{data?.cop?.toFixed(1) ?? '--'}</span>
        </span>
        <span className="text-slate-400">
          Außen: <span className="text-emerald-400 font-mono">{data?.aussentemperatur?.toFixed(1) ?? '--'}°C</span>
        </span>
      </div>

      {/* P&ID Ansicht */}
      {activeTab === 'heizung' ? (
        <PIDImageView
          imgSrc="./pid-heizung.png"
          hotspots={HEIZUNG_HOTSPOTS}
          overlays={HEIZUNG_OVERLAYS}
          data={data}
          imgWidth={2000}
          imgHeight={1204}
        />
      ) : (
        <PIDImageView
          imgSrc="./pid-kuehlung.png"
          hotspots={KUEHLUNG_HOTSPOTS}
          overlays={KUEHLUNG_OVERLAYS}
          data={data}
          imgWidth={2000}
          imgHeight={1211}
        />
      )}

      {/* Hinweis */}
      <div className="flex items-center gap-3 px-4 py-2 bg-[#111620]/40 rounded-lg border border-[#1e2736] text-xs text-slate-500">
        <span>💡</span>
        <span>Klicke auf Komponenten für Details. Ziehen zum Verschieben, Mausrad/Buttons zum Zoomen. Live-Temperaturen werden alle 3 Sek. aktualisiert.</span>
      </div>
    </div>
  );
}

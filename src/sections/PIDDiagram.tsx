import { useState, useRef, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCcw, X, Move, MousePointer } from 'lucide-react';
import type { HeatingData } from '@/types/heating';

// ═══════════════════════════════════════════════════════════════
//  HOTSPOT & OVERLAY DEFINITIONEN
//  x, y, w, h → alles in PROZENT des Bildes
//
//  ANLEITUNG ZUM ANPASSEN:
//  1. Edit-Modus einschalten (Stift-Button)
//  2. Über das Bild fahren → Koordinaten werden unten angezeigt
//  3. Werte hier im Code anpassen
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

interface LiveOverlay {
  id: string;
  x: number; y: number;
  getValue: (d: HeatingData) => string;
  color: string;
  bg?: string;
  fontSize?: number;
}

// ─── BILD 1: HEIZUNG (CL7_klein_neu_2.png) ──────────────────

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

const HEIZ_OVERLAYS: LiveOverlay[] = [
  { id: 'vl-ps2', x: 50, y: 26, getValue: d => d.vorlauftemperatur?.toFixed(0) + '°C', color: '#dc2626', bg: 'rgba(255,255,255,0.95)' },
  { id: 'rl-ps2', x: 50, y: 42, getValue: d => d.ruecklauftemperatur?.toFixed(0) + '°C', color: '#2563eb', bg: 'rgba(255,255,255,0.95)' },
  { id: 'cop', x: 30, y: 52, getValue: d => 'COP ' + d.cop?.toFixed(1), color: '#7c3aed', bg: 'rgba(255,255,255,0.95)', fontSize: 12 },
  { id: 'status', x: 30, y: 32, getValue: d => d.status === 'heizen' ? '● HEIZEN' : '○ STANDBY', color: '#dc2626', bg: 'rgba(255,255,255,0.95)', fontSize: 10 },
  { id: 'aussen', x: 5, y: 15, getValue: d => 'Außen: ' + d.aussentemperatur?.toFixed(1) + '°C', color: '#059669', bg: 'rgba(255,255,255,0.95)' },
  { id: 'p-oben', x: 16, y: 25, getValue: d => d.puffer_oben?.toFixed(0) + '°C', color: '#dc2626', bg: 'rgba(255,255,255,0.9)', fontSize: 10 },
  { id: 'p-mitte', x: 16, y: 33, getValue: d => d.puffer_mitte?.toFixed(0) + '°C', color: '#ea580c', bg: 'rgba(255,255,255,0.9)', fontSize: 10 },
  { id: 'p-unten', x: 16, y: 41, getValue: d => d.puffer_unten?.toFixed(0) + '°C', color: '#2563eb', bg: 'rgba(255,255,255,0.9)', fontSize: 10 },
];

// ─── BILD 2: KÜHLUNG (CL7_klein_neu_1.png) ──────────────────

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

const KUEHL_OVERLAYS: LiveOverlay[] = [
  { id: 'k-oben', x: 17, y: 33, getValue: () => '22°C', color: '#0891b2', bg: 'rgba(255,255,255,0.95)' },
  { id: 'k-unten', x: 17, y: 55, getValue: () => '18°C', color: '#1d4ed8', bg: 'rgba(255,255,255,0.95)' },
];


// ═══════════════════════════════════════════════════════════════
//  P&ID BILD-VIEW KOMPONENTE
// ═══════════════════════════════════════════════════════════════

function PIDView({ imgSrc, hotspots, overlays, data, imgW, imgH }: {
  imgSrc: string; hotspots: Hotspot[]; overlays: LiveOverlay[];
  data: HeatingData | null; imgW: number; imgH: number;
}) {
  const [zoom, setZoom] = useState(0.7);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selected, setSelected] = useState<Hotspot | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0, px: 0, py: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const onMD = (e: React.MouseEvent) => {
    dragging.current = true;
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };
  const onMM = useCallback((e: React.MouseEvent) => {
    if (dragging.current) {
      setPan({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
    }
    // Track mouse position for edit mode
    if (editMode && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const relX = (e.clientX - rect.left - pan.x) / zoom;
      const relY = (e.clientY - rect.top - pan.y) / zoom;
      const pctX = (relX / imgW) * 100;
      const pctY = (relY / imgH) * 100;
      setMousePos({ x: Math.round(relX), y: Math.round(relY), px: Math.round(pctX * 10) / 10, py: Math.round(pctY * 10) / 10 });
    }
  }, [editMode, pan, zoom, imgW, imgH]);
  const onMU = () => { dragging.current = false; };

  const reset = () => { setZoom(0.7); setPan({ x: 0, y: 0 }); };

  return (
    <div className="relative">
      {/* Controls */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
        {/* Edit Mode Toggle */}
        <Button variant="outline" size="sm" onClick={() => setEditMode(!editMode)}
          className={`border-[#1e2736] text-xs h-8 ${editMode ? 'bg-amber-500/15 text-amber-400' : 'text-slate-400'}`}>
          {editMode ? <Move className="w-3.5 h-3.5 mr-1" /> : <MousePointer className="w-3.5 h-3.5 mr-1" />}
          {editMode ? 'Edit-Modus AN' : 'Positionen anpassen'}
        </Button>

        {/* Zoom */}
        <div className="flex items-center gap-1 bg-[#111620]/90 backdrop-blur rounded-lg border border-[#1e2736] p-0.5">
          <Button variant="ghost" size="sm" onClick={() => setZoom(Math.max(0.3, zoom - 0.1))} className="text-slate-400 h-7 w-7 p-0">
            <ZoomOut className="w-3.5 h-3.5" />
          </Button>
          <span className="text-xs text-slate-400 w-10 text-center">{Math.round(zoom * 100)}%</span>
          <Button variant="ghost" size="sm" onClick={() => setZoom(Math.min(2, zoom + 0.1))} className="text-slate-400 h-7 w-7 p-0">
            <ZoomIn className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={reset} className="text-slate-400 h-7 w-7 p-0">
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Edit-Modus Koordinaten-Anzeige */}
      {editMode && (
        <div className="absolute bottom-16 left-3 z-20 bg-[#0f1520]/95 backdrop-blur border border-amber-500/30 rounded-lg px-3 py-2 font-mono text-xs">
          <div className="text-amber-400 font-bold mb-1">📐 Edit-Modus</div>
          <div className="text-slate-300">
            Position: <span className="text-amber-400">x: {mousePos.px}%</span> / <span className="text-amber-400">y: {mousePos.py}%</span>
          </div>
          <div className="text-slate-500">
            Pixel: {mousePos.x} / {mousePos.y}
          </div>
          <div className="text-slate-500 mt-1 text-[10px]">
            Klicke auf Komponenten → Koordinaten werden kopierbar.
            <br />Passe x/y Werte in PIDDiagram.tsx an.
          </div>
        </div>
      )}

      {/* Bild Container */}
      <div
        ref={containerRef}
        className="overflow-hidden rounded-xl border border-[#1e2736] cursor-grab active:cursor-grabbing select-none"
        style={{ height: '620px', background: '#f8f8f8' }}
        onMouseDown={onMD} onMouseMove={onMM} onMouseUp={onMU} onMouseLeave={onMU}
        onClick={() => !editMode && setSelected(null)}
      >
        <div style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0', position: 'relative',
          width: imgW, height: imgH,
        }}>
          {/* Original-Zeichnung */}
          <img src={imgSrc} alt="P&ID" style={{ width: imgW, height: imgH, display: 'block' }} draggable={false} />

          {/* ── Hotspots ── */}
          {hotspots.map(h => {
            const status = data && h.getStatus ? h.getStatus(data) : 'standby';
            const active = status === 'running';
            const isSel = selected?.id === h.id;

            return (
              <div key={h.id}
                className="absolute transition-all duration-150"
                style={{
                  left: `${h.x}%`, top: `${h.y}%`,
                  width: `${h.w}%`, height: `${h.h}%`,
                  border: isSel
                    ? '2px solid #34d399'
                    : editMode
                      ? '1px dashed #f59e0b80'
                      : active
                        ? '2px solid rgba(16,185,129,0.3)'
                        : '2px solid transparent',
                  borderRadius: 4,
                  background: isSel
                    ? 'rgba(16,185,129,0.1)'
                    : editMode
                      ? 'rgba(245,158,11,0.05)'
                      : 'transparent',
                  cursor: 'pointer',
                  zIndex: isSel ? 10 : 1,
                }}
                onClick={e => { e.stopPropagation(); setSelected(h); }}
              >
                {/* ID-Label im Edit-Modus */}
                {editMode && (
                  <div style={{
                    position: 'absolute', top: -16, left: 0,
                    background: '#f59e0b', color: '#000', fontSize: 9,
                    fontWeight: 700, padding: '0 4px', borderRadius: 2,
                    whiteSpace: 'nowrap', fontFamily: 'monospace',
                  }}>
                    {h.id} ({h.x},{h.y} {h.w}x{h.h})
                  </div>
                )}

                {/* Status-Punkt */}
                {(active || isSel) && !editMode && (
                  <div style={{
                    position: 'absolute', top: -4, right: -4,
                    width: 10, height: 10, borderRadius: '50%',
                    background: active ? '#22c55e' : '#f59e0b',
                    border: '2px solid white',
                    boxShadow: active ? '0 0 8px rgba(34,197,94,0.6)' : 'none',
                  }} />
                )}
              </div>
            );
          })}

          {/* ── Live-Daten Overlays ── */}
          {data && !editMode && overlays.map(ov => (
            <div key={ov.id} className="absolute pointer-events-none" style={{
              left: `${ov.x}%`, top: `${ov.y}%`, zIndex: 5,
            }}>
              <span style={{
                display: 'inline-block',
                background: ov.bg || 'rgba(255,255,255,0.92)',
                color: typeof ov.color === 'function' ? (ov.color as any)(data) : ov.color,
                fontSize: ov.fontSize || 11,
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: 4,
                border: `1.5px solid ${typeof ov.color === 'string' ? ov.color : '#999'}25`,
                whiteSpace: 'nowrap',
                fontFamily: "'JetBrains Mono', monospace",
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              }}>
                {ov.getValue(data)}
              </span>
            </div>
          ))}

          {/* Edit-Modus: Crosshair */}
          {editMode && (
            <div className="absolute pointer-events-none" style={{
              left: `${mousePos.px}%`, top: 0, width: 1, height: '100%',
              borderLeft: '1px dashed rgba(245,158,11,0.3)',
            }} />
          )}
          {editMode && (
            <div className="absolute pointer-events-none" style={{
              top: `${mousePos.py}%`, left: 0, height: 1, width: '100%',
              borderTop: '1px dashed rgba(245,158,11,0.3)',
            }} />
          )}
        </div>
      </div>

      {/* Detail-Panel */}
      {selected && !editMode && (
        <DetailPanel comp={selected} data={data} onClose={() => setSelected(null)} />
      )}

      {/* Selected Info im Edit-Modus */}
      {selected && editMode && (
        <div className="absolute bottom-3 right-3 z-20 bg-[#0f1520]/95 backdrop-blur border border-amber-500/30 rounded-lg px-3 py-2 font-mono text-xs max-w-xs">
          <div className="flex justify-between items-center mb-1">
            <span className="text-amber-400 font-bold">{selected.id}</span>
            <button onClick={() => setSelected(null)} className="text-slate-500 hover:text-white">✕</button>
          </div>
          <div className="text-slate-300 text-[10px] leading-relaxed">
            <code className="text-amber-300">x: {selected.x}, y: {selected.y}</code><br />
            <code className="text-amber-300">w: {selected.w}, h: {selected.h}</code>
          </div>
          <div className="text-slate-500 text-[10px] mt-1">
            Kopiere diese Werte und passe sie in
            <br /><code className="text-slate-400">src/sections/PIDDiagram.tsx</code> an.
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  DETAIL-PANEL
// ═══════════════════════════════════════════════════════════════

function DetailPanel({ comp, data, onClose }: { comp: Hotspot; data: HeatingData | null; onClose: () => void }) {
  const status = data && comp.getStatus ? comp.getStatus(data) : 'standby';
  const temp = data && comp.getTemp ? comp.getTemp(data) : undefined;
  const tempRet = data && comp.getTempReturn ? comp.getTempReturn(data) : undefined;
  const sc = status === 'running' ? 'bg-emerald-500/20 text-emerald-400'
    : status === 'standby' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-500/20 text-slate-400';
  const sl = status === 'running' ? 'Laufend' : status === 'standby' ? 'Bereit' : 'Aus';

  return (
    <div className="absolute bottom-3 left-3 right-3 z-30 bg-[#0f1520]/95 backdrop-blur-xl border border-[#1e2736] rounded-xl p-3 shadow-2xl"
      onClick={e => e.stopPropagation()}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-white font-bold text-sm">{comp.name}</h3>
          <p className="text-slate-400 text-xs">{comp.desc}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="text-slate-400 hover:text-white -mt-1 -mr-1"><X className="w-4 h-4" /></Button>
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        <C label="ID" value={comp.id} mono />
        <C label="Status" badge={<Badge className={`text-[10px] ${sc}`}>{sl}</Badge>} />
        {temp && <C label="Vorlauf" value={temp} color="text-orange-400" />}
        {tempRet && <C label="Rücklauf" value={tempRet} color="text-sky-400" />}
        {comp.flow != null && <C label="Durchfluss" value={`${comp.flow} m³/h`} color="text-emerald-400" />}
        {comp.dn && <C label="Nennweite" value={comp.dn} />}
        {comp.power && <C label="Leistung" value={comp.power} color="text-amber-400" />}
      </div>
    </div>
  );
}

function C({ label, value, badge, color = 'text-white', mono }: {
  label: string; value?: string; badge?: React.ReactNode; color?: string; mono?: boolean;
}) {
  return (
    <div className="bg-[#111620] rounded-lg px-3 py-1.5 inline-flex items-center gap-2">
      <span className="text-[9px] text-slate-500 uppercase">{label}</span>
      {badge || <span className={`font-semibold ${color} ${mono ? 'font-mono text-[11px]' : 'text-xs'}`}>{value}</span>}
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
  const [tab, setTab] = useState<'heizung' | 'kuehlung'>('heizung');

  return (
    <div className="space-y-3">
      {/* Header + Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">P&ID-Diagramm</h2>
          <p className="text-sm text-slate-400">② Hauptstation + Anschluss Satellitenhaus – Detail</p>
        </div>
        <div className="flex gap-1 bg-[#111620] rounded-lg border border-[#1e2736] p-1">
          <button onClick={() => setTab('heizung')}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
              tab === 'heizung' ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30' : 'text-slate-400 border border-transparent'
            }`}>🔥 Heizung</button>
          <button onClick={() => setTab('kuehlung')}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
              tab === 'kuehlung' ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 border border-transparent'
            }`}>❄️ Kühlung</button>
        </div>
      </div>

      {/* Status-Leiste */}
      <div className="flex flex-wrap items-center gap-4 px-3 py-2 bg-[#111620]/50 rounded-lg border border-[#1e2736] text-xs">
        <span className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${data?.status === 'heizen' ? 'bg-orange-400 animate-pulse' : 'bg-slate-600'}`} />
          <span className={data?.status === 'heizen' ? 'text-orange-400 font-medium' : 'text-slate-500'}>Heizen</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${data?.status === 'standby' ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600'}`} />
          <span className={data?.status === 'standby' ? 'text-cyan-400 font-medium' : 'text-slate-500'}>Standby</span>
        </span>
        <span className="text-slate-700">|</span>
        <span className="text-slate-400 font-mono">VL <span className="text-orange-400">{data?.vorlauftemperatur?.toFixed(1) ?? '--'}°C</span></span>
        <span className="text-slate-400 font-mono">RL <span className="text-sky-400">{data?.ruecklauftemperatur?.toFixed(1) ?? '--'}°C</span></span>
        <span className="text-slate-400 font-mono">COP <span className="text-emerald-400">{data?.cop?.toFixed(1) ?? '--'}</span></span>
        <span className="text-slate-400 font-mono">Außen <span className="text-emerald-400">{data?.aussentemperatur?.toFixed(1) ?? '--'}°C</span></span>
      </div>

      {/* P&ID View */}
      {tab === 'heizung' ? (
        <PIDView imgSrc="./pid-heizung.png" hotspots={HEIZ_HOTSPOTS} overlays={HEIZ_OVERLAYS} data={data} imgW={2000} imgH={1204} />
      ) : (
        <PIDView imgSrc="./pid-kuehlung.png" hotspots={KUEHL_HOTSPOTS} overlays={KUEHL_OVERLAYS} data={data} imgW={2000} imgH={1211} />
      )}

      {/* Hinweis */}
      <div className="text-[11px] text-slate-500 px-2">
        💡 Klicke auf markierte Bereiche für Details · Ziehen zum Verschieben · Buttons zum Zoomen · <span className="text-amber-400/60">Edit-Modus</span> für Positionsanpassung
      </div>
    </div>
  );
}

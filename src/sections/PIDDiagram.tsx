import { useState, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCcw, Eye, EyeOff, X } from 'lucide-react';
import type { HeatingData } from '@/types/heating';

// ═══════════════════════════════════════════════════════════════
//  KONFIGURATION – Positionen hier anpassen!
// ═══════════════════════════════════════════════════════════════

const LAYOUT = {
  // Quellen (oben)
  pvt:        { x: 120,  y: 60  },
  abwp:       { x: 340,  y: 60  },
  erdwaerme:  { x: 60,   y: 430 },

  // Speicher & Wandler (mitte)
  pufferPVT:  { x: 200,  y: 220 },
  wt:         { x: 490,  y: 330 },
  wp:         { x: 670,  y: 220 },

  // Pumpen
  p01:        { x: 130,  y: 340 },
  p02:        { x: 360,  y: 175 },
  p03:        { x: 400,  y: 270 },
  p04:        { x: 830,  y: 300 },
  p05:        { x: 1050, y: 280 },
  p06:        { x: 830,  y: 620 },
  p07:        { x: 1130, y: 530 },

  // Verteilung (rechts)
  pufferHZ:   { x: 910,  y: 170 },
  pufferK:    { x: 910,  y: 490 },
  verteilerH: { x: 1160, y: 180 },
  verteilerK: { x: 1250, y: 490 },

  // Anschlüsse
  satHZ:      { x: 1380, y: 170 },
  satK:       { x: 1420, y: 490 },
} as const;

// ═══════════════════════════════════════════════════════════════
//  SVG SYMBOLE
// ═══════════════════════════════════════════════════════════════

/** Pumpen-Symbol (Kreis mit Dreieck) – DIN-nah */
function PumpSymbol({ x, y, id, running, onClick }: {
  x: number; y: number; id: string; running: boolean; onClick: () => void;
}) {
  return (
    <g transform={`translate(${x},${y})`} className="cursor-pointer" onClick={onClick}>
      <circle cx="0" cy="0" r="16" fill={running ? '#059669' : '#1e293b'} stroke={running ? '#34d399' : '#475569'} strokeWidth="2" />
      <polygon points="0,-8 7,5 -7,5" fill={running ? '#fff' : '#64748b'} />
      {running && (
        <circle cx="0" cy="0" r="18" fill="none" stroke="#34d399" strokeWidth="1" opacity="0.4">
          <animate attributeName="r" values="18;24;18" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite" />
        </circle>
      )}
      <text x="0" y="28" textAnchor="middle" fill={running ? '#34d399' : '#64748b'} fontSize="10" fontWeight="600">{id}</text>
    </g>
  );
}

/** Speicher/Tank-Symbol */
function TankSymbol({ x, y, width, height, label, sublabel, capacity, zones, color, borderColor, onClick }: {
  x: number; y: number; width: number; height: number;
  label: string; sublabel?: string; capacity: string;
  zones: { value: string; color: string; label?: string }[];
  color: string; borderColor: string; onClick: () => void;
}) {
  const zoneH = (height - 16) / zones.length;
  return (
    <g transform={`translate(${x},${y})`} className="cursor-pointer" onClick={onClick}>
      {/* Label oben */}
      <text x={width / 2} y="-22" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="500">{label}</text>
      {sublabel && <text x={width / 2} y="-10" textAnchor="middle" fill="#64748b" fontSize="9">{sublabel}</text>}

      {/* Behälter */}
      <rect x="0" y="0" width={width} height={height} rx="6" fill={color} stroke={borderColor} strokeWidth="2" />

      {/* Temperaturzonen */}
      {zones.map((z, i) => (
        <g key={i}>
          <rect x="6" y={6 + i * zoneH} width={width - 12} height={zoneH - 4} rx="3" fill={z.color} opacity="0.85" />
          <text x={width / 2} y={6 + i * zoneH + zoneH / 2 + 4} textAnchor="middle" fill="#fff" fontSize="12" fontWeight="700">
            {z.value}
          </text>
          {z.label && (
            <text x={width - 8} y={6 + i * zoneH + 12} textAnchor="end" fill="rgba(255,255,255,0.5)" fontSize="7">{z.label}</text>
          )}
        </g>
      ))}

      {/* Kapazität */}
      <text x={width / 2} y={height + 14} textAnchor="middle" fill="#64748b" fontSize="9">{capacity}</text>
    </g>
  );
}

/** Wärmetauscher-Symbol (gekreuzte Platten) */
function HeatExchangerSymbol({ x, y, onClick }: { x: number; y: number; onClick: () => void }) {
  return (
    <g transform={`translate(${x},${y})`} className="cursor-pointer" onClick={onClick}>
      <text x="30" y="-12" textAnchor="middle" fill="#94a3b8" fontSize="10">Wärmetauscher</text>
      <rect x="0" y="0" width="60" height="80" rx="4" fill="#1e1b4b" stroke="#7c3aed" strokeWidth="2" />
      {/* Platten-Muster */}
      {[12, 24, 36, 48, 60].map(py => (
        <line key={py} x1="8" y1={py} x2="52" y2={py} stroke="rgba(167,139,250,0.3)" strokeWidth="1" />
      ))}
      {/* Diagonal-Pfeile */}
      <line x1="10" y1="10" x2="50" y2="70" stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="4,3" />
      <line x1="50" y1="10" x2="10" y2="70" stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="4,3" />
      <text x="30" y="95" textAnchor="middle" fill="#a78bfa" fontSize="9" fontWeight="600">47 kW</text>
    </g>
  );
}

/** Wärmepumpen-Symbol (großer Kasten) */
function HeatPumpSymbol({ x, y, data, onClick }: {
  x: number; y: number; data: HeatingData | null; onClick: () => void;
}) {
  const running = data?.status === 'heizen';
  return (
    <g transform={`translate(${x},${y})`} className="cursor-pointer" onClick={onClick}>
      <text x="65" y="-10" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="500">Wärmepumpe</text>
      <rect x="0" y="0" width="130" height="105" rx="6"
        fill={running ? '#7c2d12' : '#1e293b'}
        stroke={running ? '#f97316' : '#475569'} strokeWidth="2.5" />

      <text x="65" y="22" textAnchor="middle" fill="#fdba74" fontSize="9">Nenn-Wärmeleistung</text>
      <text x="65" y="42" textAnchor="middle" fill="#fff" fontSize="18" fontWeight="800">175 kW</text>
      <text x="65" y="60" textAnchor="middle" fill="#fdba74" fontSize="9">Elektrisch: 38,9 kW</text>

      <line x1="10" y1="70" x2="120" y2="70" stroke="rgba(255,255,255,0.1)" />

      <text x="36" y="85" textAnchor="middle" fill="#94a3b8" fontSize="9">COP</text>
      <text x="36" y="100" textAnchor="middle" fill="#34d399" fontSize="14" fontWeight="700">
        {data?.cop?.toFixed(1) ?? '--'}
      </text>
      <text x="98" y="85" textAnchor="middle" fill="#94a3b8" fontSize="9">Status</text>
      <text x="98" y="100" textAnchor="middle" fill={running ? '#f59e0b' : '#60a5fa'} fontSize="10" fontWeight="600">
        {running ? 'HEIZEN' : 'STANDBY'}
      </text>

      {running && (
        <rect x="-2" y="-2" width="134" height="109" rx="8" fill="none" stroke="#f97316" strokeWidth="1" opacity="0.3">
          <animate attributeName="opacity" values="0.3;0.1;0.3" dur="2s" repeatCount="indefinite" />
        </rect>
      )}
    </g>
  );
}

/** Verteiler-Symbol */
function DistributorSymbol({ x, y, label, color, borderColor, count, onClick }: {
  x: number; y: number; label: string; color: string; borderColor: string; count: number; onClick: () => void;
}) {
  return (
    <g transform={`translate(${x},${y})`} className="cursor-pointer" onClick={onClick}>
      <text x="50" y="-10" textAnchor="middle" fill={borderColor} fontSize="10" fontWeight="600">{label}</text>
      <rect x="0" y="0" width="100" height="50" rx="4" fill={color} stroke={borderColor} strokeWidth="2" />
      {/* Vorlauf / Rücklauf Balken */}
      <line x1="10" y1="18" x2="90" y2="18" stroke={borderColor} strokeWidth="2" opacity="0.6" />
      <line x1="10" y1="33" x2="90" y2="33" stroke={borderColor} strokeWidth="2" opacity="0.4" />
      {/* Abgänge */}
      {Array.from({ length: count }).map((_, i) => {
        const cx = 20 + i * (60 / (count - 1));
        return <line key={i} x1={cx} y1="0" x2={cx} y2="-8" stroke={borderColor} strokeWidth="1.5" opacity="0.7" />;
      })}
    </g>
  );
}

/** Quelle/Erzeuger-Symbol */
function SourceSymbol({ x, y, label, sublabel, icon, value, unit, onClick }: {
  x: number; y: number; label: string; sublabel: string;
  icon: 'sun' | 'wind' | 'earth'; value?: string; unit?: string; onClick: () => void;
}) {
  const icons = {
    sun: <><circle cx="20" cy="20" r="10" fill="#fbbf24" opacity="0.8" />{[0, 45, 90, 135, 180, 225, 270, 315].map(a => (
      <line key={a} x1={20 + 14 * Math.cos(a * Math.PI / 180)} y1={20 + 14 * Math.sin(a * Math.PI / 180)}
        x2={20 + 18 * Math.cos(a * Math.PI / 180)} y2={20 + 18 * Math.sin(a * Math.PI / 180)}
        stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />))}</>,
    wind: <><path d="M8,20 Q14,10 20,20 Q26,30 32,20" fill="none" stroke="#22d3ee" strokeWidth="2" />
      <path d="M8,28 Q14,18 20,28 Q26,38 32,28" fill="none" stroke="#22d3ee" strokeWidth="2" opacity="0.6" /></>,
    earth: <><circle cx="20" cy="20" r="14" fill="#166534" stroke="#22c55e" strokeWidth="2" />
      <path d="M10,16 Q20,10 30,16 M10,24 Q20,30 30,24" fill="none" stroke="#4ade80" strokeWidth="1.5" /></>,
  };

  return (
    <g transform={`translate(${x},${y})`} className="cursor-pointer" onClick={onClick}>
      <rect x="0" y="0" width="120" height="60" rx="8" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
      <g transform="translate(8,10)">{icons[icon]}</g>
      <text x="52" y="18" fill="#e2e8f0" fontSize="10" fontWeight="600">{label}</text>
      <text x="52" y="30" fill="#64748b" fontSize="8">{sublabel}</text>
      {value && (
        <text x="52" y="48" fill="#94a3b8" fontSize="9">{value} {unit}</text>
      )}
    </g>
  );
}

/** Temperaturfühler */
function TempSensor({ x, y, value, color = '#94a3b8' }: { x: number; y: number; value?: string; color?: string }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <circle cx="0" cy="0" r="5" fill="#1e293b" stroke={color} strokeWidth="1.5" />
      <text x="0" y="3" textAnchor="middle" fill={color} fontSize="6" fontWeight="600">T</text>
      {value && <text x="12" y="3" fill={color} fontSize="8" fontWeight="500">{value}</text>}
    </g>
  );
}

/** DN-Label */
function DNLabel({ x, y, text }: { x: number; y: number; text: string }) {
  return <text x={x} y={y} fill="#475569" fontSize="8" fontWeight="500">{text}</text>;
}

// ═══════════════════════════════════════════════════════════════
//  ROHRLEITUNGEN (Paths)
// ═══════════════════════════════════════════════════════════════

function Pipes({ data, showFlow }: { data: HeatingData | null; showFlow: boolean }) {
  const heating = data?.status === 'heizen';
  const standby = data?.status === 'standby';

  // Hilfsfunktion: L-förmige Rohrleitung
  const pipe = (d: string, color: string, w = 4) => (
    <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
  );

  // Animierter Strömungspfeil
  const flowDot = (d: string, color: string, active: boolean) => active && (
    <circle r="3" fill={color}>
      <animateMotion dur="3s" repeatCount="indefinite" path={d} />
    </circle>
  );

  return (
    <g>
      {/* ── Quellenkreis: PVT → Puffer PVT ── */}
      {pipe(`M 180 120 L 180 155 L 240 155 L 240 220`, '#eab308', 5)}
      {showFlow && flowDot(`M 180 120 L 180 155 L 240 155 L 240 220`, '#fbbf24', !!heating)}

      {/* ── Quellenkreis: Abluft-WP → P02 → Puffer PVT ── */}
      {pipe(`M 400 120 L 400 155 L 360 175`, '#22d3ee', 4)}
      {pipe(`M 360 175 L 310 195 L 310 220`, '#22d3ee', 4)}

      {/* ── Erdwärme → P01 → Wärmetauscher ── */}
      {pipe(`M 120 430 L 130 390 L 130 340`, '#22c55e', 5)}
      {pipe(`M 130 340 L 130 300 L 200 300 L 200 370 L 490 370`, '#22c55e', 5)}
      {showFlow && flowDot(`M 120 430 L 130 390 L 130 340 L 130 300 L 200 300 L 200 370 L 490 370`, '#4ade80', !!heating)}

      {/* ── Puffer PVT → P03 → WT (Primär-Seite) ── */}
      {pipe(`M 310 310 L 400 310 L 400 270`, '#f97316', 5)}
      {pipe(`M 400 270 L 400 250 L 460 250 L 460 340 L 490 340`, '#f97316', 4)}

      {/* ── WT → WP (Sekundär) ── */}
      {pipe(`M 550 370 L 620 370 L 620 290 L 670 290`, '#ef4444', 5)}
      {showFlow && flowDot(`M 550 370 L 620 370 L 620 290 L 670 290`, '#f87171', !!heating)}

      {/* ── WP → P04 → Puffer HZ ── */}
      {pipe(`M 800 270 L 830 300`, '#ef4444', 5)}
      {pipe(`M 830 300 L 870 270 L 910 270`, '#ef4444', 5)}
      {showFlow && flowDot(`M 800 270 L 830 300 L 870 270 L 910 270`, '#f87171', !!heating)}

      {/* ── Puffer HZ → P05 → Verteiler HZ ── */}
      {pipe(`M 1010 260 L 1050 280`, '#ef4444', 4)}
      {pipe(`M 1050 280 L 1100 260 L 1160 260`, '#ef4444', 4)}

      {/* ── Verteiler HZ → Satellitenhaus ── */}
      {pipe(`M 1260 200 L 1310 200 L 1310 200 L 1380 200`, '#f97316', 3)}

      {/* ── Rücklauf HZ (kalt, blau gestrichelt) ── */}
      <path d="M 1380 230 L 1310 230 L 1310 230 L 1260 230" fill="none" stroke="#3b82f6" strokeWidth="3" strokeDasharray="8,4" />
      <path d="M 1160 230 L 1080 230 L 1080 350 L 990 350 L 990 340" fill="none" stroke="#3b82f6" strokeWidth="3" strokeDasharray="8,4" />
      <path d="M 940 340 L 940 395 L 735 395 L 735 325" fill="none" stroke="#3b82f6" strokeWidth="3" strokeDasharray="8,4" />

      {/* ── Kältekreis: WP → P06 → Puffer Kälte ── */}
      {pipe(`M 735 325 L 735 550 L 770 600 L 830 620`, '#06b6d4', 4)}
      {pipe(`M 830 620 L 880 600 L 910 580`, '#06b6d4', 4)}
      {showFlow && flowDot(`M 735 325 L 735 550 L 770 600 L 830 620 L 880 600 L 910 580`, '#22d3ee', !!standby)}

      {/* ── Puffer Kälte → P07 → Verteiler Kühlung ── */}
      {pipe(`M 1010 540 L 1070 540 L 1130 530`, '#06b6d4', 4)}
      {pipe(`M 1130 530 L 1190 520 L 1250 520`, '#06b6d4', 4)}

      {/* ── Verteiler Kühlung → Satellitenhaus ── */}
      {pipe(`M 1350 510 L 1420 510`, '#06b6d4', 3)}
      <path d="M 1420 530 L 1350 530" fill="none" stroke="#0ea5e9" strokeWidth="3" strokeDasharray="8,4" />
    </g>
  );
}

// ═══════════════════════════════════════════════════════════════
//  DETAIL-PANEL
// ═══════════════════════════════════════════════════════════════

interface CompInfo {
  id: string; name: string; desc: string;
  temp?: number; tempReturn?: number; flow?: number;
  dn?: string; power?: string; status: string;
}

function DetailPanel({ comp, onClose }: { comp: CompInfo; onClose: () => void }) {
  const statusColor = comp.status === 'running' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
    : comp.status === 'standby' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
    : 'bg-slate-500/20 text-slate-400 border-slate-500/40';
  const statusLabel = comp.status === 'running' ? 'Laufend' : comp.status === 'standby' ? 'Bereit' : 'Aus';

  return (
    <div className="absolute bottom-4 left-4 right-4 z-20 bg-[#0f1520]/95 backdrop-blur-xl border border-[#1e2736] rounded-xl p-4 shadow-2xl">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-white font-bold text-base">{comp.name}</h3>
          <p className="text-slate-400 text-xs">{comp.desc}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="text-slate-400 hover:text-white -mt-1 -mr-1">
          <X className="w-4 h-4" />
        </Button>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        <InfoCell label="ID" value={comp.id} mono />
        <InfoCell label="Status" badge={<Badge className={`text-[10px] ${statusColor}`}>{statusLabel}</Badge>} />
        {comp.temp != null && <InfoCell label="Temperatur" value={`${comp.temp.toFixed(1)}°C`} color="text-orange-400" />}
        {comp.tempReturn != null && <InfoCell label="Rücklauf" value={`${comp.tempReturn.toFixed(1)}°C`} color="text-sky-400" />}
        {comp.flow != null && <InfoCell label="Durchfluss" value={`${comp.flow} m³/h`} color="text-emerald-400" />}
        {comp.dn && <InfoCell label="Nennweite" value={comp.dn} />}
        {comp.power && <InfoCell label="Leistung" value={comp.power} color="text-amber-400" />}
      </div>
    </div>
  );
}

function InfoCell({ label, value, badge, color = 'text-white', mono }: {
  label: string; value?: string; badge?: React.ReactNode; color?: string; mono?: boolean;
}) {
  return (
    <div className="bg-[#111620] rounded-lg p-2">
      <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">{label}</div>
      {badge || <div className={`text-sm font-semibold ${color} ${mono ? 'font-mono text-xs' : ''}`}>{value}</div>}
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
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [showFlow, setShowFlow] = useState(true);
  const [selected, setSelected] = useState<CompInfo | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const heating = data?.status === 'heizen';
  const standby = data?.status === 'standby';

  const compInfo = (id: string, name: string, desc: string, extra: Partial<CompInfo> = {}): CompInfo => ({
    id, name, desc, status: 'standby', ...extra,
  });

  const select = (info: CompInfo) => setSelected(info);

  const onMouseDown = (e: React.MouseEvent) => {
    dragging.current = true;
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current) return;
    setPan({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
  };
  const onMouseUp = () => { dragging.current = false; };
  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">P&ID-Diagramm</h2>
          <p className="text-sm text-slate-400">Hauptstation Darmstadt 2026 – Heizung & Kühlung</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowFlow(!showFlow)}
            className={`border-[#1e2736] text-xs ${showFlow ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-400'}`}>
            {showFlow ? <Eye className="w-3.5 h-3.5 mr-1" /> : <EyeOff className="w-3.5 h-3.5 mr-1" />}
            Strömung
          </Button>
          <div className="flex items-center gap-1 bg-[#111620] rounded-lg border border-[#1e2736] p-0.5">
            <Button variant="ghost" size="sm" onClick={() => setZoom(Math.max(0.4, zoom - 0.1))} className="text-slate-400 h-7 w-7 p-0">
              <ZoomOut className="w-3.5 h-3.5" />
            </Button>
            <span className="text-xs text-slate-400 w-10 text-center">{Math.round(zoom * 100)}%</span>
            <Button variant="ghost" size="sm" onClick={() => setZoom(Math.min(2.5, zoom + 0.1))} className="text-slate-400 h-7 w-7 p-0">
              <ZoomIn className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={resetView} className="text-slate-400 h-7 w-7 p-0">
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Diagramm */}
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-xl border border-[#1e2736] bg-[#080c12] cursor-grab active:cursor-grabbing select-none"
        style={{ height: '680px' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        <div className="absolute"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0', width: '1500px', height: '700px',
          }}>
          <svg viewBox="0 0 1500 700" className="w-full h-full">
            {/* Hintergrund-Grid */}
            <defs>
              <pattern id="pid-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#111827" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="1500" height="700" fill="url(#pid-grid)" />

            {/* Bereichs-Labels */}
            <text x="180" y="35" textAnchor="middle" fill="#1e293b" fontSize="32" fontWeight="800" letterSpacing="2">QUELLEN</text>
            <text x="600" y="195" textAnchor="middle" fill="#1e293b" fontSize="24" fontWeight="800" letterSpacing="2">ERZEUGUNG</text>
            <text x="1100" y="135" textAnchor="middle" fill="#1e293b" fontSize="24" fontWeight="800" letterSpacing="2">VERTEILUNG</text>

            {/* ═══ ROHRLEITUNGEN (hinter Symbolen) ═══ */}
            <Pipes data={data} showFlow={showFlow} />

            {/* ═══ QUELLEN ═══ */}
            <SourceSymbol {...LAYOUT.pvt} label="PVT-Solar" sublabel="auf Dach" icon="sun" value="6,2 kW th."
              onClick={() => select(compInfo('PVT', 'PVT-Solarkollektoren', 'Zuleitung PVT auf Dach', { temp: data?.aussentemperatur, power: '6,2 kW th.', status: 'running' }))} />

            <SourceSymbol {...LAYOUT.abwp} label="Abluft-WP" sublabel="auf Dach" icon="wind" value="Rohrbegl.heizung"
              onClick={() => select(compInfo('ABWP', 'Abluft-Wärmepumpe', 'Abluft-WP auf Dach', { temp: 40, tempReturn: 35, status: heating ? 'running' : 'standby' }))} />

            <SourceSymbol {...LAYOUT.erdwaerme} label="Erdwärmefeld" sublabel="Nahwärme FVU" icon="earth" value="42,1 m³/h"
              onClick={() => select(compInfo('ERD', 'Erdwärmefeld', 'Nahwärme aus Erdwärmefeld', { temp: 18, tempReturn: 12, flow: 42.1, status: heating ? 'running' : 'standby' }))} />

            {/* ═══ PUMPEN ═══ */}
            <PumpSymbol {...LAYOUT.p01} id="P01" running={!!heating}
              onClick={() => select(compInfo('P01', 'Pumpe P01', 'Umwälzpumpe Erdwärmefeld', { flow: 42.1, dn: 'DN 80', status: heating ? 'running' : 'off' }))} />
            <PumpSymbol {...LAYOUT.p02} id="P02" running={!!heating}
              onClick={() => select(compInfo('P02', 'Pumpe P02', 'Umwälzpumpe Abluft-WP', { flow: 15.2, dn: 'DN 65', status: heating ? 'running' : 'off' }))} />
            <PumpSymbol {...LAYOUT.p03} id="P03" running={!!heating}
              onClick={() => select(compInfo('P03', 'Pumpe P03', 'Umwälzpumpe Puffer PVT', { flow: 28.5, dn: 'DN 100', status: heating ? 'running' : 'off' }))} />
            <PumpSymbol {...LAYOUT.p04} id="P04" running={!!heating}
              onClick={() => select(compInfo('P04', 'Pumpe P04', 'Umwälzpumpe Heizung', { flow: 18.3, dn: 'DN 100', status: heating ? 'running' : 'off' }))} />
            <PumpSymbol {...LAYOUT.p05} id="P05" running={!!heating}
              onClick={() => select(compInfo('P05', 'Pumpe P05', 'Umwälzpumpe Puffer HZ', { flow: 22.1, dn: 'DN 80', status: heating ? 'running' : 'off' }))} />
            <PumpSymbol {...LAYOUT.p06} id="P06" running={!!standby}
              onClick={() => select(compInfo('P06', 'Pumpe P06', 'Umwälzpumpe Kühlung', { flow: 12.4, dn: 'DN 80', status: standby ? 'running' : 'off' }))} />
            <PumpSymbol {...LAYOUT.p07} id="P07" running={!!standby}
              onClick={() => select(compInfo('P07', 'Pumpe P07', 'Umwälzpumpe Kältepuffer', { flow: 8.7, dn: 'DN 50', status: standby ? 'running' : 'off' }))} />

            {/* ═══ SPEICHER ═══ */}
            <TankSymbol {...LAYOUT.pufferPVT} width={100} height={100} label="Puffer PVT" sublabel="hydr. Trennung" capacity="2000 L"
              color="#1e1b4b" borderColor="#6366f1"
              zones={[
                { value: `${data?.puffer_oben?.toFixed(0) ?? '--'}°C`, color: '#dc2626', label: 'oben' },
                { value: `${data?.puffer_mitte?.toFixed(0) ?? '--'}°C`, color: '#ea580c', label: 'mitte' },
                { value: `${data?.puffer_unten?.toFixed(0) ?? '--'}°C`, color: '#0369a1', label: 'unten' },
              ]}
              onClick={() => select(compInfo('PS1', 'Pufferspeicher PVT', 'Hydr. Trennung / PVT', { temp: data?.puffer_oben, power: '2000 L', dn: 'DN 100', status: heating ? 'running' : 'standby' }))} />

            <TankSymbol {...LAYOUT.pufferHZ} width={100} height={140} label="Puffer Heizung" capacity="1500 L"
              color="#7c2d12" borderColor="#f97316"
              zones={[
                { value: `${data?.vorlauftemperatur?.toFixed(0) ?? '--'}°C`, color: '#dc2626', label: 'VL' },
                { value: `${data?.ruecklauftemperatur?.toFixed(0) ?? '--'}°C`, color: '#0369a1', label: 'RL' },
              ]}
              onClick={() => select(compInfo('PS2', 'Pufferspeicher Heizung', 'Heizungspuffer', { temp: data?.puffer_mitte, power: '1500 L', dn: 'DN 80', status: heating ? 'running' : 'standby' }))} />

            <TankSymbol {...LAYOUT.pufferK} width={100} height={100} label="Puffer Kälte" capacity="1000 L"
              color="#0c4a6e" borderColor="#06b6d4"
              zones={[
                { value: '22°C', color: '#0891b2', label: 'oben' },
                { value: '18°C', color: '#164e63', label: 'unten' },
              ]}
              onClick={() => select(compInfo('PS3', 'Pufferspeicher Kälte', 'Kältepuffer', { temp: 22, power: '1000 L', dn: 'DN 80', status: standby ? 'running' : 'standby' }))} />

            {/* ═══ WÄRMETAUSCHER ═══ */}
            <HeatExchangerSymbol {...LAYOUT.wt}
              onClick={() => select(compInfo('WT1', 'Wärmetauscher', 'Plattenwärmetauscher', { temp: 42, tempReturn: 39, dn: 'DN 80', power: '47 kW', status: heating ? 'running' : 'standby' }))} />

            {/* ═══ WÄRMEPUMPE ═══ */}
            <HeatPumpSymbol {...LAYOUT.wp} data={data}
              onClick={() => select(compInfo('WP1', 'Wärmepumpe', 'Hauptwärmepumpe', { temp: data?.vorlauftemperatur, power: '175 kW', dn: 'DN 100', status: heating ? 'running' : 'standby' }))} />

            {/* ═══ VERTEILER ═══ */}
            <DistributorSymbol {...LAYOUT.verteilerH} label="VERTEILER HEIZUNG" color="#451a03" borderColor="#f97316" count={4}
              onClick={() => select(compInfo('VH', 'Verteiler Heizung', 'Heizungsverteiler', { temp: 43, tempReturn: 30, dn: 'DN 80', status: heating ? 'running' : 'standby' }))} />

            <DistributorSymbol {...LAYOUT.verteilerK} label="VERTEILER KÜHLUNG" color="#083344" borderColor="#06b6d4" count={3}
              onClick={() => select(compInfo('VK', 'Verteiler Kühlung', 'Kühlverteiler', { temp: 22, tempReturn: 18, dn: 'DN 50', status: standby ? 'running' : 'standby' }))} />

            {/* ═══ ANSCHLÜSSE SATELLITENHAUS ═══ */}
            <g transform={`translate(${LAYOUT.satHZ.x},${LAYOUT.satHZ.y})`}>
              <rect x="0" y="-15" width="90" height="60" rx="6" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="4,3" />
              <text x="45" y="4" textAnchor="middle" fill="#64748b" fontSize="9">Satellitenhaus</text>
              <text x="45" y="18" textAnchor="middle" fill="#f97316" fontSize="10" fontWeight="600">Heizung</text>
              <text x="45" y="33" textAnchor="middle" fill="#64748b" fontSize="8">DN 65</text>
            </g>

            <g transform={`translate(${LAYOUT.satK.x},${LAYOUT.satK.y})`}>
              <rect x="0" y="-15" width="90" height="60" rx="6" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="4,3" />
              <text x="45" y="4" textAnchor="middle" fill="#64748b" fontSize="9">Satellitenhaus</text>
              <text x="45" y="18" textAnchor="middle" fill="#06b6d4" fontSize="10" fontWeight="600">Kühlung</text>
              <text x="45" y="33" textAnchor="middle" fill="#64748b" fontSize="8">DN 50</text>
            </g>

            {/* ═══ TEMPERATURFÜHLER ═══ */}
            <TempSensor x={180} y={155} value={`${data?.aussentemperatur?.toFixed(1) ?? '--'}°C`} color="#fbbf24" />
            <TempSensor x={620} y={280} value={`${data?.vorlauftemperatur?.toFixed(1) ?? '--'}°C`} color="#f97316" />
            <TempSensor x={870} y={240} color="#ef4444" />
            <TempSensor x={1100} y={240} color="#ef4444" />

            {/* ═══ DN-LABELS ═══ */}
            <DNLabel x={155} y={400} text="DN 80" />
            <DNLabel x={420} y={260} text="DN 100" />
            <DNLabel x={620} y={310} text="DN 100" />
            <DNLabel x={850} y={262} text="DN 100" />
            <DNLabel x={1070} y={270} text="DN 80" />
            <DNLabel x={1110} y={540} text="DN 80" />

            {/* ═══ SYSTEM-PARAMETER BOX ═══ */}
            <g transform="translate(30, 560)">
              <rect x="0" y="0" width="220" height="100" rx="8" fill="#0f172a" stroke="#1e293b" strokeWidth="1" />
              <text x="15" y="20" fill="#64748b" fontSize="10" fontWeight="600">SYSTEM-PARAMETER</text>
              <text x="15" y="38" fill="#475569" fontSize="9">Auslegung ΔT: <tspan fill="#94a3b8">3 K</tspan></text>
              <text x="15" y="52" fill="#475569" fontSize="9">Glycol-Anteil: <tspan fill="#94a3b8">30%</tspan></text>
              <text x="15" y="66" fill="#475569" fontSize="9">Massenstrom: <tspan fill="#94a3b8">42,1 m³/h</tspan></text>
              <text x="15" y="80" fill="#475569" fontSize="9">Ansprechdruck SV: <tspan fill="#94a3b8">3,5 bar</tspan></text>
              <text x="15" y="94" fill="#475569" fontSize="9">Versorgung: <tspan fill="#94a3b8">400 V / 50 Hz</tspan></text>
            </g>
          </svg>
        </div>

        {/* Detail-Panel */}
        {selected && <DetailPanel comp={selected} onClose={() => setSelected(null)} />}
      </div>

      {/* Legende */}
      <div className="flex flex-wrap items-center gap-6 px-4 py-3 bg-[#111620]/80 rounded-xl border border-[#1e2736] text-xs">
        <span className="text-slate-500 font-medium">Legende:</span>
        <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-400" /><span className="text-slate-400">Pumpe läuft</span></span>
        <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-slate-700 border border-slate-500" /><span className="text-slate-400">Pumpe aus</span></span>
        <span className="flex items-center gap-2"><span className="w-6 h-1.5 rounded bg-gradient-to-r from-amber-500 to-red-500" /><span className="text-slate-400">Vorlauf (heiß)</span></span>
        <span className="flex items-center gap-2"><span className="w-6 h-1.5 rounded bg-gradient-to-r from-cyan-500 to-blue-500" /><span className="text-slate-400">Rücklauf (kalt)</span></span>
        <span className="flex items-center gap-2"><span className="w-6 h-0.5 rounded bg-blue-400" style={{ borderTop: '2px dashed #3b82f6' }} /><span className="text-slate-400">Rücklauf gestrichelt</span></span>
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-slate-700 border border-slate-400 flex items-center justify-center text-[6px] text-white font-bold">T</span>
          <span className="text-slate-400">Temperaturfühler</span>
        </span>
      </div>
    </div>
  );
}

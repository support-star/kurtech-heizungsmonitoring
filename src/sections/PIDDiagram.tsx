import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, ZoomIn, ZoomOut, RotateCcw, Droplets } from 'lucide-react';
import type { HeatingData } from '@/types/heating';

// ═══════════════════════════════════════════════════════════════
//  FARB-PALETTE
// ═══════════════════════════════════════════════════════════════
const C = {
  bg: '#0c1017',
  panel: '#111820',
  border: '#1a2332',
  hotPipe: '#ef4444',
  hotGlow: '#ef444440',
  warmPipe: '#f97316',
  warmGlow: '#f9731640',
  coldPipe: '#3b82f6',
  coldGlow: '#3b82f640',
  coolPipe: '#06b6d4',
  coolGlow: '#06b6d440',
  geoPipe: '#22c55e',
  geoGlow: '#22c55e40',
  pumpOn: '#22c55e',
  pumpOff: '#475569',
  tankStroke: '#64748b',
  tankFill: '#0f172a',
  text: '#94a3b8',
  textBright: '#e2e8f0',
  textDim: '#475569',
  accent: '#10b981',
};

// ═══════════════════════════════════════════════════════════════
//  SVG DEFS (Gradienten, Filter, Animationen)
// ═══════════════════════════════════════════════════════════════
function Defs() {
  return (
    <defs>
      {/* Pipe Gradients */}
      <linearGradient id="pipeHot" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#dc2626" /><stop offset="100%" stopColor="#ef4444" />
      </linearGradient>
      <linearGradient id="pipeCold" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#2563eb" /><stop offset="100%" stopColor="#3b82f6" />
      </linearGradient>
      <linearGradient id="pipeWarm" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#ea580c" /><stop offset="100%" stopColor="#f97316" />
      </linearGradient>
      <linearGradient id="pipeCool" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#0891b2" /><stop offset="100%" stopColor="#06b6d4" />
      </linearGradient>
      <linearGradient id="pipeGeo" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#16a34a" /><stop offset="100%" stopColor="#22c55e" />
      </linearGradient>

      {/* Tank Gradients */}
      <linearGradient id="tankHot" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#dc2626" stopOpacity="0.3" />
        <stop offset="50%" stopColor="#ea580c" stopOpacity="0.15" />
        <stop offset="100%" stopColor="#2563eb" stopOpacity="0.2" />
      </linearGradient>
      <linearGradient id="tankCold" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.2" />
        <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.3" />
      </linearGradient>

      {/* Heat Exchanger */}
      <linearGradient id="wtGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ef4444" /><stop offset="50%" stopColor="#8b5cf6" /><stop offset="100%" stopColor="#3b82f6" />
      </linearGradient>

      {/* Glow Filter */}
      <filter id="glowGreen" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
      <filter id="glowRed" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
      <filter id="glowBlue" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>

      {/* Animated Flow Dots */}
      <style>{`
        @keyframes flowRight { from { offset-distance: 0% } to { offset-distance: 100% } }
        @keyframes flowLeft { from { offset-distance: 100% } to { offset-distance: 0% } }
        @keyframes flowDown { from { offset-distance: 0% } to { offset-distance: 100% } }
        @keyframes pulse { 0%, 100% { opacity: 0.6 } 50% { opacity: 1 } }
        @keyframes pumpSpin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        .flow-dot { animation: flowRight 3s linear infinite; }
        .flow-dot-slow { animation: flowRight 5s linear infinite; }
        .flow-dot-rev { animation: flowLeft 3s linear infinite; }
        .flow-dot-down { animation: flowDown 4s linear infinite; }
        .pump-pulse { animation: pulse 2s ease-in-out infinite; }
        .temp-badge { font-family: 'JetBrains Mono', 'Fira Code', monospace; }
      `}</style>
    </defs>
  );
}

// ═══════════════════════════════════════════════════════════════
//  KOMPONENTEN-SYMBOLE
// ═══════════════════════════════════════════════════════════════

/** Pumpe – DIN-Kreis mit Dreieck */
function Pump({ x, y, id, on, onClick }: {
  x: number; y: number; id: string; on: boolean; onClick?: () => void;
}) {
  return (
    <g transform={`translate(${x},${y})`} className="cursor-pointer" onClick={onClick}>
      {on && <circle cx="0" cy="0" r="20" fill={C.pumpOn} opacity="0.15" filter="url(#glowGreen)" />}
      <circle cx="0" cy="0" r="15" fill={C.tankFill} stroke={on ? C.pumpOn : C.pumpOff} strokeWidth="2.5" />
      <polygon points="0,-8 8,5 -8,5" fill={on ? C.pumpOn : C.pumpOff} className={on ? 'pump-pulse' : ''} />
      <text x="0" y="28" textAnchor="middle" fill={on ? C.pumpOn : C.pumpOff} fontSize="10" fontWeight="700">{id}</text>
    </g>
  );
}

/** Tank / Pufferspeicher */
function Tank({ x, y, w, h, label, vol, temps, grad, onClick }: {
  x: number; y: number; w: number; h: number; label: string; vol: string;
  temps?: { top?: string; mid?: string; bot?: string };
  grad: string; onClick?: () => void;
}) {
  const rx = w / 2;
  return (
    <g className="cursor-pointer" onClick={onClick}>
      {/* Körper */}
      <rect x={x} y={y} width={w} height={h} rx={rx} fill={`url(#${grad})`} stroke={C.tankStroke} strokeWidth="2" />
      {/* Temperaturfühler-Linien */}
      {temps?.top && (
        <g>
          <line x1={x + w + 4} y1={y + h * 0.15} x2={x + w + 15} y2={y + h * 0.15} stroke={C.textDim} strokeWidth="1" />
          <TempBadge x={x + w + 18} y={y + h * 0.15} temp={temps.top} color={C.hotPipe} />
        </g>
      )}
      {temps?.mid && (
        <g>
          <line x1={x + w + 4} y1={y + h * 0.5} x2={x + w + 15} y2={y + h * 0.5} stroke={C.textDim} strokeWidth="1" />
          <TempBadge x={x + w + 18} y={y + h * 0.5} temp={temps.mid} color={C.warmPipe} />
        </g>
      )}
      {temps?.bot && (
        <g>
          <line x1={x + w + 4} y1={y + h * 0.85} x2={x + w + 15} y2={y + h * 0.85} stroke={C.textDim} strokeWidth="1" />
          <TempBadge x={x + w + 18} y={y + h * 0.85} temp={temps.bot} color={C.coldPipe} />
        </g>
      )}
      {/* Temperaturfühler-Punkte */}
      {[0.15, 0.3, 0.5, 0.7, 0.85].map((p, i) => (
        <circle key={i} cx={x + w + 4} cy={y + h * p} r="2.5" fill={C.textDim} stroke={C.panel} strokeWidth="1" />
      ))}
      {/* Label */}
      <text x={x + w / 2} y={y - 8} textAnchor="middle" fill={C.textBright} fontSize="10" fontWeight="600">{label}</text>
      <text x={x + w / 2} y={y - 20} textAnchor="middle" fill={C.textDim} fontSize="8">{vol}</text>
    </g>
  );
}

/** Temperatur-Badge */
function TempBadge({ x, y, temp, color }: { x: number; y: number; temp: string; color: string }) {
  return (
    <g className="temp-badge">
      <rect x={x} y={y - 8} width={42} height={16} rx="4" fill={C.panel} stroke={color} strokeWidth="1" strokeOpacity="0.4" />
      <text x={x + 21} y={y + 3} textAnchor="middle" fill={color} fontSize="10" fontWeight="700">{temp}</text>
    </g>
  );
}

/** Absperrventil (Bowtie) */
function Valve({ x, y, rot = 0 }: { x: number; y: number; rot?: number }) {
  return (
    <g transform={`translate(${x},${y}) rotate(${rot})`}>
      <polygon points="-6,-5 0,0 -6,5" fill="none" stroke={C.textDim} strokeWidth="1.5" />
      <polygon points="6,-5 0,0 6,5" fill="none" stroke={C.textDim} strokeWidth="1.5" />
    </g>
  );
}

/** MAG */
function MAG({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <ellipse cx="0" cy="0" rx="12" ry="15" fill={C.tankFill} stroke={C.textDim} strokeWidth="1.5" />
      <text x="0" y="3" textAnchor="middle" fill={C.textDim} fontSize="7" fontWeight="600">MAG</text>
    </g>
  );
}

/** Beschriftungs-Box (Komponente) */
function CompBox({ x, y, w, h, title, sub, active, color, onClick }: {
  x: number; y: number; w: number; h: number;
  title: string; sub?: string; active?: boolean; color?: string; onClick?: () => void;
}) {
  const c = color || C.accent;
  return (
    <g className="cursor-pointer" onClick={onClick}>
      {active && <rect x={x - 2} y={y - 2} width={w + 4} height={h + 4} rx="6" fill={c} opacity="0.08" filter="url(#glowGreen)" />}
      <rect x={x} y={y} width={w} height={h} rx="4" fill={C.panel} stroke={active ? c : C.border} strokeWidth={active ? 2 : 1.5} />
      <text x={x + w / 2} y={y + (sub ? h / 2 - 4 : h / 2 + 3)} textAnchor="middle" fill={C.textBright} fontSize="10" fontWeight="600">{title}</text>
      {sub && <text x={x + w / 2} y={y + h / 2 + 8} textAnchor="middle" fill={C.textDim} fontSize="8">{sub}</text>}
    </g>
  );
}

/** DN-Label */
function DN({ x, y, text }: { x: number; y: number; text: string }) {
  return <text x={x} y={y} fill={C.textDim} fontSize="8" fontWeight="500">{text}</text>;
}

/** Verteiler-Balken */
function Verteiler({ x, y, w, h, label, active, color, onClick }: {
  x: number; y: number; w: number; h: number;
  label: string; active?: boolean; color?: string; onClick?: () => void;
}) {
  const c = color || C.accent;
  return (
    <g className="cursor-pointer" onClick={onClick}>
      <rect x={x} y={y} width={w} height={h} rx="3" fill={C.panel} stroke={active ? c : C.border} strokeWidth={active ? 2 : 1.5} />
      <text x={x + w / 2} y={y + h / 2 + 4} textAnchor="middle" fill={C.textBright} fontSize="11" fontWeight="700" letterSpacing="1">{label}</text>
      {/* Abgänge oben */}
      {[0.2, 0.4, 0.6, 0.8].map((p, i) => (
        <g key={i}>
          <line x1={x + w * p} y1={y} x2={x + w * p} y2={y - 15} stroke={C.border} strokeWidth="1.5" />
          <Valve x={x + w * p} y={y - 15} rot={90} />
        </g>
      ))}
    </g>
  );
}

/** Pipe mit optionalem Flow */
function Pipe({ d, color, width = 3, dash, glow }: {
  d: string; color: string; width?: number; dash?: string; glow?: string;
}) {
  return (
    <g>
      {glow && <path d={d} fill="none" stroke={glow} strokeWidth={width + 6} strokeLinecap="round" strokeLinejoin="round" opacity="0.3" />}
      <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray={dash} />
    </g>
  );
}

/** Animierter Flow-Punkt */
function FlowDot({ path, color, dur = '3s', delay = '0s', size = 4 }: {
  path: string; color: string; dur?: string; delay?: string; size?: number;
}) {
  return (
    <circle r={size} fill={color} opacity="0.9">
      <animateMotion dur={dur} repeatCount="indefinite" begin={delay} path={path} />
    </circle>
  );
}

/** Region-Label (Hintergrund) */
function Region({ x, y, text }: { x: number; y: number; text: string }) {
  return <text x={x} y={y} fill={C.textDim} fontSize="11" fontWeight="700" letterSpacing="3" opacity="0.3">{text}</text>;
}

// ═══════════════════════════════════════════════════════════════
//  DETAIL-PANEL
// ═══════════════════════════════════════════════════════════════

interface CompInfo {
  id: string; name: string; desc: string;
  status?: string; temp?: string; tempRet?: string;
  flow?: string; dn?: string; power?: string;
}

function DetailPanel({ info, onClose }: { info: CompInfo; onClose: () => void }) {
  const isOn = info.status === 'running';
  return (
    <div className="absolute bottom-4 left-4 right-4 z-30 bg-[#0f1520]/95 backdrop-blur-xl border border-[#1e2736] rounded-xl p-4 shadow-2xl">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-white font-bold text-sm">{info.name}</h3>
          <p className="text-slate-400 text-xs">{info.desc}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="text-slate-400 hover:text-white -mt-1 -mr-1"><X className="w-4 h-4" /></Button>
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        <Chip label="ID" value={info.id} mono />
        <Chip label="Status" badge={
          <Badge className={`text-[10px] ${isOn ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
            {isOn ? 'Laufend' : 'Bereit'}
          </Badge>
        } />
        {info.temp && <Chip label="VL" value={info.temp} color="text-orange-400" />}
        {info.tempRet && <Chip label="RL" value={info.tempRet} color="text-sky-400" />}
        {info.flow && <Chip label="Durchfluss" value={info.flow} color="text-emerald-400" />}
        {info.dn && <Chip label="DN" value={info.dn} />}
        {info.power && <Chip label="Leistung" value={info.power} color="text-amber-400" />}
      </div>
    </div>
  );
}

function Chip({ label, value, badge, color = 'text-slate-300', mono }: {
  label: string; value?: string; badge?: React.ReactNode; color?: string; mono?: boolean;
}) {
  return (
    <div className="bg-[#0a0e14] rounded-lg px-3 py-1.5 inline-flex items-center gap-2">
      <span className="text-[9px] text-slate-500 uppercase">{label}</span>
      {badge || <span className={`font-semibold text-xs ${color} ${mono ? 'font-mono' : ''}`}>{value}</span>}
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
  const [selected, setSelected] = useState<CompInfo | null>(null);
  const [showFlow, setShowFlow] = useState(true);
  const [zoom, setZoom] = useState(1);

  const heating = data?.status === 'heizen';
  const sel = (info: CompInfo) => setSelected(info);

  // Live temps
  const vl = data?.vorlauftemperatur?.toFixed(0) ?? '--';
  const rl = data?.ruecklauftemperatur?.toFixed(0) ?? '--';
  const po = data?.puffer_oben?.toFixed(0) ?? '--';
  const pm = data?.puffer_mitte?.toFixed(0) ?? '--';
  const pu = data?.puffer_unten?.toFixed(0) ?? '--';
  const cop = data?.cop?.toFixed(1) ?? '--';
  const aussen = data?.aussentemperatur?.toFixed(1) ?? '--';

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">P&ID-Diagramm</h2>
          <p className="text-sm text-slate-400">② Hauptstation + Anschluss Satellitenhaus – Detail</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowFlow(!showFlow)}
            className={`border-[#1e2736] text-xs ${showFlow ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-400'}`}>
            <Droplets className="w-3.5 h-3.5 mr-1" />
            Strömung {showFlow ? 'AN' : 'AUS'}
          </Button>
          <div className="flex items-center gap-1 bg-[#111620] rounded-lg border border-[#1e2736] p-0.5">
            <Button variant="ghost" size="sm" onClick={() => setZoom(Math.max(0.5, zoom - 0.1))} className="text-slate-400 h-7 w-7 p-0"><ZoomOut className="w-3.5 h-3.5" /></Button>
            <span className="text-xs text-slate-400 w-10 text-center">{Math.round(zoom * 100)}%</span>
            <Button variant="ghost" size="sm" onClick={() => setZoom(Math.min(2, zoom + 0.1))} className="text-slate-400 h-7 w-7 p-0"><ZoomIn className="w-3.5 h-3.5" /></Button>
            <Button variant="ghost" size="sm" onClick={() => setZoom(1)} className="text-slate-400 h-7 w-7 p-0"><RotateCcw className="w-3.5 h-3.5" /></Button>
          </div>
        </div>
      </div>

      {/* Status-Bar */}
      <div className="flex flex-wrap items-center gap-4 px-3 py-2 bg-[#111620]/50 rounded-lg border border-[#1e2736] text-xs">
        <span className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${heating ? 'bg-orange-400 animate-pulse' : 'bg-slate-600'}`} />
          <span className={heating ? 'text-orange-400 font-medium' : 'text-slate-500'}>
            {data?.status === 'heizen' ? 'Heizen' : data?.status === 'abtauen' ? 'Abtauen' : 'Standby'}
          </span>
        </span>
        <span className="text-slate-700">|</span>
        <span className="text-slate-400 font-mono">VL <span className="text-orange-400">{vl}°C</span></span>
        <span className="text-slate-400 font-mono">RL <span className="text-sky-400">{rl}°C</span></span>
        <span className="text-slate-400 font-mono">COP <span className="text-emerald-400">{cop}</span></span>
        <span className="text-slate-400 font-mono">Außen <span className="text-teal-400">{aussen}°C</span></span>
        <span className="text-slate-400 font-mono">Puffer <span className="text-orange-400">{po}</span>/<span className="text-amber-400">{pm}</span>/<span className="text-sky-400">{pu}°C</span></span>
      </div>

      {/* ══════ SVG DIAGRAMM ══════ */}
      <div className="relative overflow-auto rounded-xl border border-[#1e2736]" style={{ background: C.bg }}
        onClick={() => setSelected(null)}>
        <div style={{ transform: `scale(${zoom})`, transformOrigin: '0 0', width: 1700 / zoom, minHeight: 620 / zoom }}>
          <svg viewBox="0 0 1700 620" style={{ width: 1700, height: 620, display: 'block' }}>
            <Defs />

            {/* Hintergrund-Grid */}
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.5" fill={C.textDim} opacity="0.15" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* ══════ REGION LABELS ══════ */}
            <Region x={60} y={100} text="QUELLEN" />
            <Region x={350} y={550} text="ERZEUGUNG" />
            <Region x={850} y={100} text="SPEICHER" />
            <Region x={1060} y={270} text="VERTEILUNG" />
            <Region x={1360} y={270} text="KÄLTE" />

            {/* Trennlinie Heizung / Kälte */}
            <line x1="1300" y1="80" x2="1300" y2="580" stroke={C.border} strokeWidth="1" strokeDasharray="8,4" opacity="0.5" />

            {/* ═══════════════════════════════════════════
                 QUELLEN (oben links)
                 ═══════════════════════════════════════════ */}

            {/* PVT-Solarkollektoren */}
            <CompBox x={120} y={60} w={120} h={50} title="PVT-Solar" sub="6,2 kW th." active={!!heating} color={C.warmPipe}
              onClick={() => sel({ id: 'PVT', name: 'PVT-Solarkollektoren', desc: 'Auf Dach, thermische Leistung 6,2 kW', status: 'running', temp: `${aussen}°C`, power: '6,2 kW th.' })} />
            {/* Solar-Icon */}
            <circle cx="165" cy="48" r="10" fill="none" stroke="#fbbf24" strokeWidth="1.5" opacity="0.5" />
            <circle cx="165" cy="48" r="3" fill="#fbbf24" opacity="0.5" />

            {/* Abluft-Wärmepumpe */}
            <CompBox x={380} y={60} w={130} h={50} title="Abluft-WP" sub="Dach + Rohrbegl." active={!!heating} color={C.warmPipe}
              onClick={() => sel({ id: 'ABWP', name: 'Abluft-Wärmepumpe', desc: 'Auf Dach mit Rohrbegleitheizung', status: heating ? 'running' : 'standby', temp: '40°C', tempRet: '35°C' })} />

            {/* Erdwärmefeld */}
            <CompBox x={30} y={380} w={110} h={50} title="Erdwärmefeld" sub="FVU Nahwärme" active={!!heating} color={C.geoPipe}
              onClick={() => sel({ id: 'ERD', name: 'Erdwärmefeld', desc: 'Zuleitung FVU Nahwärme', status: heating ? 'running' : 'standby', flow: '42,1 m³/h', dn: 'DN 80' })} />

            {/* ═══ ROHRLEITUNGEN QUELLEN → PUFFER PVT ═══ */}

            {/* PVT → Puffer PVT VL */}
            <Pipe d="M180,110 L180,180 L265,180 L265,260" color={C.warmPipe} glow={C.warmGlow} />
            <DN x={188} y={160} text="DN 65" />

            {/* Abluft-WP → Puffer PVT */}
            <Pipe d="M445,110 L445,150 L340,150 L340,180 L340,260" color={C.warmPipe} glow={C.warmGlow} />
            <TempBadge x={450} y={132} temp="35°C" color={C.warmPipe} />
            <TempBadge x={450} y={152} temp="40°C" color={C.hotPipe} />

            {/* P02 */}
            <Pump x={390} y={180} id="P02" on={!!heating}
              onClick={() => sel({ id: 'P02', name: 'Pumpe P02', desc: 'Umwälzpumpe Abluft-WP', status: heating ? 'running' : 'off', flow: '15,2 m³/h', dn: 'DN 65' })} />

            {/* Erdwärme → WT */}
            <Pipe d="M140,400 L200,400 L200,440 L390,440" color={C.geoPipe} glow={C.geoGlow} width={3.5} />
            <Pipe d="M390,500 L200,500 L200,480 L140,480 L80,480 L80,430" color={C.geoPipe} glow={C.geoGlow} width={3.5} dash="6,3" />
            <DN x={148} y={395} text="DN 80" />

            {/* P01 */}
            <Pump x={170} y={400} id="P01" on={!!heating}
              onClick={() => sel({ id: 'P01', name: 'Pumpe P01', desc: 'Umwälzpumpe Erdwärmefeld', status: heating ? 'running' : 'off', flow: '42,1 m³/h', dn: 'DN 80' })} />

            {/* Auslegungsdaten */}
            <g transform="translate(220,445)">
              <rect x="0" y="0" width="100" height="52" rx="3" fill={C.panel} stroke={C.border} strokeWidth="1" opacity="0.8" />
              <text x="50" y="13" textAnchor="middle" fill={C.textDim} fontSize="7" fontWeight="600">Auslegung:</text>
              <text x="50" y="24" textAnchor="middle" fill={C.text} fontSize="7">ΔT: 3K · Glycol: 30%</text>
              <text x="50" y="35" textAnchor="middle" fill={C.text} fontSize="7">Massenstrom: 42,1 m³/h</text>
              <text x="50" y="46" textAnchor="middle" fill={C.text} fontSize="7">SV: 3,5 bar · 400V</text>
            </g>

            {/* ═══════════════════════════════════════════
                 PUFFERSPEICHER PVT (2000 Liter)
                 ═══════════════════════════════════════════ */}
            <Tank x={275} y={230} w={60} h={220} label="Puffer PVT" vol="2000 Liter"
              temps={{ top: `${po}°`, mid: `${pm}°`, bot: `${pu}°` }}
              grad="tankHot"
              onClick={() => sel({ id: 'PS1', name: 'Pufferspeicher PVT', desc: 'Hydr. Trennung/PVT, 2000 Liter', status: heating ? 'running' : 'standby', temp: `${po}°C`, power: '2000 L', dn: 'DN 100' })} />
            <DN x={265} y={275} text="DN 63" />

            {/* P03 (rechts vom Puffer) */}
            <Pump x={380} y={310} id="P03" on={!!heating}
              onClick={() => sel({ id: 'P03', name: 'Pumpe P03', desc: 'Umwälzpumpe Puffer PVT', status: heating ? 'running' : 'off', flow: '28,5 m³/h', dn: 'DN 100' })} />

            {/* Puffer PVT → WT (Vorlauf) */}
            <Pipe d="M335,310 L366,310" color={C.warmPipe} width={3} />
            <Pipe d="M394,310 L440,310 L440,370" color={C.warmPipe} glow={C.warmGlow} width={3} />
            <DN x={345} y={305} text="DN 100" />

            {/* Puffer PVT → WT (Rücklauf) */}
            <Pipe d="M335,420 L360,420 L360,500 L440,500" color={C.coldPipe} width={2.5} dash="6,3" />
            <DN x={345} y={415} text="DN 80" />

            {/* ═══════════════════════════════════════════
                 WÄRMETAUSCHER (47 kW)
                 ═══════════════════════════════════════════ */}
            <g className="cursor-pointer" onClick={() => sel({ id: 'WT1', name: 'Wärmetauscher', desc: 'Plattenwärmetauscher 47 kW', status: heating ? 'running' : 'standby', power: '47 kW', dn: 'DN 80' })}>
              <rect x={430} y={370} width={35} height={140} rx="3" fill="url(#wtGrad)" stroke={C.textDim} strokeWidth="2" opacity="0.9" />
              {/* Platten */}
              {[0, 1, 2, 3, 4, 5].map(i => (
                <line key={i} x1={434} y1={385 + i * 20} x2={461} y2={385 + i * 20} stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" />
              ))}
              <text x={448} y={545} textAnchor="middle" fill={C.textDim} fontSize="9">Wärme-</text>
              <text x={448} y={556} textAnchor="middle" fill={C.textDim} fontSize="9">tauscher</text>
              <text x={448} y={568} textAnchor="middle" fill={C.accent} fontSize="9" fontWeight="600">47 kW</text>
            </g>

            {/* WT → WP Vorlauf */}
            <Pipe d="M465,400 L560,400" color={C.warmPipe} glow={C.warmGlow} width={3.5} />
            {/* WT → WP Rücklauf */}
            <Pipe d="M465,480 L560,480" color={C.coldPipe} glow={C.coldGlow} width={3} dash="6,3" />
            <DN x={490} y={395} text="DN 80" />
            <DN x={490} y={495} text="DN 80" />

            {/* ═══════════════════════════════════════════
                 WÄRMEPUMPE (175 kW)
                 ═══════════════════════════════════════════ */}
            <g className="cursor-pointer" onClick={() => sel({ id: 'WP1', name: 'Wärmepumpe', desc: '175 kW th. / 38,9 kW el.', status: heating ? 'running' : 'standby', temp: `${vl}°C`, tempRet: `${rl}°C`, power: '175 kW', dn: 'DN 100' })}>
              {heating && <rect x={558} y={358} width={144} height={154} rx="8" fill={C.hotPipe} opacity="0.06" filter="url(#glowRed)" />}
              <rect x={560} y={360} width={140} height={150} rx="6" fill={C.panel} stroke={heating ? C.hotPipe : C.border} strokeWidth={heating ? 2.5 : 1.5} />
              <text x={630} y={390} textAnchor="middle" fill={C.textBright} fontSize="12" fontWeight="700">Wärmepumpe</text>
              <text x={630} y={408} textAnchor="middle" fill={C.textDim} fontSize="9">175 kW th. · 38,9 kW el.</text>
              {/* COP Display */}
              <rect x={590} y={420} width={80} height={30} rx="4" fill={C.bg} stroke={C.border} strokeWidth="1" />
              <text x={630} y={432} textAnchor="middle" fill={C.textDim} fontSize="8">COP</text>
              <text x={630} y={445} textAnchor="middle" fill={C.accent} fontSize="14" fontWeight="800" className="temp-badge">{cop}</text>
              {/* Status */}
              <circle cx={583} cy={485} r={5} fill={heating ? C.pumpOn : C.pumpOff} className={heating ? 'pump-pulse' : ''} />
              <text x={595} y={489} fill={heating ? C.pumpOn : C.pumpOff} fontSize="9" fontWeight="600">
                {heating ? 'AKTIV' : 'STANDBY'}
              </text>
              {/* 400V */}
              <rect x={590} y={460} width={40} height={14} rx="2" fill="none" stroke={C.textDim} strokeWidth="1" />
              <text x={610} y={471} textAnchor="middle" fill={C.textDim} fontSize="8" fontWeight="600">400V</text>
              {/* SV */}
              <text x={650} y={471} fill={C.textDim} fontSize="7">SV: 3,5 bar</text>
            </g>

            {/* WP → P04 → Puffer HZ (Vorlauf) */}
            <Pipe d="M700,400 L740,400" color={C.hotPipe} glow={C.hotGlow} width={4} />
            <Pump x={760} y={400} id="P04" on={!!heating}
              onClick={() => sel({ id: 'P04', name: 'Pumpe P04', desc: 'Umwälzpumpe Heizung', status: heating ? 'running' : 'off', flow: '18,3 m³/h', dn: 'DN 100' })} />
            <Pipe d="M774,400 L830,400 L830,340 L860,340" color={C.hotPipe} glow={C.hotGlow} width={4} />
            <TempBadge x={780} y={392} temp={`${vl}°`} color={C.hotPipe} />
            <DN x={790} y={420} text="DN 100" />

            {/* WP ← Puffer HZ (Rücklauf) */}
            <Pipe d="M700,480 L740,480 L830,480 L830,440 L860,440" color={C.coldPipe} glow={C.coldGlow} width={3} dash="6,3" />
            <TempBadge x={780} y={472} temp={`${rl}°`} color={C.coldPipe} />
            <DN x={790} y={498} text="DN 100" />

            {/* ═══════════════════════════════════════════
                 PUFFERSPEICHER HEIZUNG (1500 Liter)
                 ═══════════════════════════════════════════ */}
            <Tank x={860} y={260} w={55} h={200} label="Puffer HZ" vol="1500 Liter"
              temps={{ top: `${vl}°`, bot: `${rl}°` }}
              grad="tankHot"
              onClick={() => sel({ id: 'PS2', name: 'Pufferspeicher Heizung', desc: '1500 Liter', status: heating ? 'running' : 'standby', temp: `${vl}°C`, tempRet: `${rl}°C`, power: '1500 L', dn: 'DN 80' })} />
            <DN x={850} y={310} text="DN 80" />
            <MAG x={930} y={380} />

            {/* P05 */}
            <Pump x={980} y={340} id="P05" on={!!heating}
              onClick={() => sel({ id: 'P05', name: 'Pumpe P05', desc: 'Umwälzpumpe Puffer HZ', status: heating ? 'running' : 'off', flow: '22,1 m³/h', dn: 'DN 80' })} />

            {/* Puffer HZ → P05 → Verteiler */}
            <Pipe d="M915,340 L966,340" color={C.hotPipe} glow={C.hotGlow} width={3.5} />
            <Pipe d="M994,340 L1060,340 L1060,355" color={C.hotPipe} glow={C.hotGlow} width={3.5} />
            {/* Rücklauf */}
            <Pipe d="M1060,405 L1060,440 L915,440" color={C.coldPipe} glow={C.coldGlow} width={2.5} dash="6,3" />
            <DN x={1000} y={335} text="DN 65" />

            {/* ═══════════════════════════════════════════
                 VERTEILER HEIZUNG
                 ═══════════════════════════════════════════ */}
            <Verteiler x={1060} y={355} w={180} h={50} label="VERTEILER HEIZUNG" active={!!heating} color={C.hotPipe}
              onClick={() => sel({ id: 'VH', name: 'Verteiler Heizung', desc: 'Heizungsverteiler', status: heating ? 'running' : 'standby', temp: `${vl}°C`, tempRet: `${rl}°C`, dn: 'DN 80' })} />

            {/* Anschluss Stockwerke oben */}
            <line x1="1120" y1="340" x2="1120" y2="280" stroke={C.hotPipe} strokeWidth="2" />
            <line x1="1170" y1="340" x2="1170" y2="280" stroke={C.coldPipe} strokeWidth="2" strokeDasharray="4,2" />
            <path d="M1108,275 Q1120,260 1132,275 Q1144,290 1156,275 Q1168,260 1180,275" fill="none" stroke={C.textDim} strokeWidth="1.5" />
            <text x="1145" y="258" textAnchor="middle" fill={C.textDim} fontSize="8">Anschluss weitere</text>
            <text x="1145" y="268" textAnchor="middle" fill={C.textDim} fontSize="8">Stockwerke</text>

            {/* Satellitenhaus HZ (rechts) */}
            <Pipe d="M1240,370 L1290,370" color={C.hotPipe} glow={C.hotGlow} width={3} />
            <Pipe d="M1240,395 L1290,395" color={C.coldPipe} glow={C.coldGlow} width={2} dash="6,3" />
            <CompBox x={1200} y={420} w={90} h={35} title="Satellitenhaus" sub="Heizung E" color={C.hotPipe}
              onClick={() => sel({ id: 'SAT-H', name: 'Satellitenhaus E', desc: 'Zuleitung Heizung', dn: 'DN 65' })} />
            <DN x={1250} y={365} text="DN 65" />

            {/* Druckhaltestation */}
            <g transform="translate(1060,470)">
              <rect x="0" y="0" width="140" height="30" rx="3" fill={C.panel} stroke={C.border} strokeWidth="1" strokeDasharray="4,2" />
              <text x="70" y="13" textAnchor="middle" fill={C.textDim} fontSize="7">Druckhalte- / Entgasungs-</text>
              <text x="70" y="23" textAnchor="middle" fill={C.textDim} fontSize="7">und Nachspeisestation</text>
            </g>

            {/* ═══════════════════════════════════════════
                 KÄLTE-BEREICH (rechts)
                 ═══════════════════════════════════════════ */}

            {/* Pufferspeicher Kälte */}
            <Tank x={1360} y={300} w={50} h={180} label="Puffer Kälte" vol="1000 Liter"
              temps={{ top: '22°', bot: '18°' }}
              grad="tankCold"
              onClick={() => sel({ id: 'PS3', name: 'Pufferspeicher Kälte', desc: '1000 Liter', status: 'standby', temp: '22°C', power: '1000 L', dn: 'DN 80' })} />
            <DN x={1350} y={350} text="DN 80" />

            {/* Pendelleitung DN 20 */}
            <line x1="1355" y1="320" x2="1340" y2="320" stroke={C.coolPipe} strokeWidth="1" opacity="0.5" />
            <line x1="1340" y1="320" x2="1340" y2="470" stroke={C.coolPipe} strokeWidth="1" opacity="0.5" strokeDasharray="3,2" />
            <text x="1335" y="400" textAnchor="end" fill={C.coolPipe} fontSize="7" opacity="0.5" transform="rotate(-90,1335,400)">Pendelleitung DN20</text>

            {/* P07 */}
            <Pump x={1470} y={380} id="P07" on={false}
              onClick={() => sel({ id: 'P07', name: 'Pumpe P07', desc: 'Umwälzpumpe Kältepuffer', status: 'standby', flow: '8,7 m³/h', dn: 'DN 50' })} />
            <Pipe d="M1410,380 L1456,380" color={C.coolPipe} width={2.5} />
            <Pipe d="M1484,380 L1520,380 L1520,430" color={C.coolPipe} width={2.5} />
            <DN x={1430} y={375} text="DN 50" />
            <Valve x={1440} y={380} />

            {/* Rücklauf Kälte */}
            <Pipe d="M1520,490 L1520,530 L1390,530 L1390,480" color={C.coolPipe} width={2} dash="5,3" />

            {/* P06 */}
            <Pump x={1390} y={540} id="P06" on={false}
              onClick={() => sel({ id: 'P06', name: 'Pumpe P06', desc: 'Umwälzpumpe Kühlung', status: 'standby', flow: '12,4 m³/h', dn: 'DN 80' })} />

            {/* Verteiler Kühlung */}
            <Verteiler x={1450} y={450} w={160} h={40} label="VERTEILER KÜHLUNG" active={false} color={C.coolPipe}
              onClick={() => sel({ id: 'VK', name: 'Verteiler Kühlung', desc: 'Kühlverteiler', status: 'standby', temp: '22°C', tempRet: '18°C', dn: 'DN 50' })} />

            {/* Satellitenhaus Kühlung */}
            <CompBox x={1530} y={510} w={90} h={35} title="Satellitenhaus" sub="Kühlung E" color={C.coolPipe}
              onClick={() => sel({ id: 'SAT-K', name: 'Satellitenhaus E', desc: 'Zuleitung Kühlung', dn: 'DN 50' })} />
            <Pipe d="M1610,490 L1610,510" color={C.coolPipe} width={2} />
            <DN x={1575} y={505} text="DN 50" />

            {/* MAG Kälte */}
            <MAG x={1430} y={530} />

            {/* ═══════════════════════════════════════════
                 ANIMIERTE STRÖMUNG
                 ═══════════════════════════════════════════ */}
            {showFlow && heating && (
              <g>
                {/* Erdwärme → WT */}
                <FlowDot path="M140,400 L200,400 L200,440 L430,440" color={C.geoPipe} dur="3s" />
                <FlowDot path="M140,400 L200,400 L200,440 L430,440" color={C.geoPipe} dur="3s" delay="1.5s" />

                {/* PVT → Puffer */}
                <FlowDot path="M180,110 L180,180 L265,180 L265,260" color={C.warmPipe} dur="2.5s" />

                {/* Puffer PVT → WT */}
                <FlowDot path="M335,310 L440,310 L440,370" color={C.warmPipe} dur="2s" />

                {/* WT → WP */}
                <FlowDot path="M465,400 L560,400" color={C.warmPipe} dur="1.5s" />
                <FlowDot path="M465,400 L560,400" color={C.warmPipe} dur="1.5s" delay="0.7s" />

                {/* WP → P04 → Puffer HZ */}
                <FlowDot path="M700,400 L830,400 L830,340 L860,340" color={C.hotPipe} dur="2.5s" size={5} />
                <FlowDot path="M700,400 L830,400 L830,340 L860,340" color={C.hotPipe} dur="2.5s" delay="1.2s" size={5} />

                {/* Puffer HZ → Verteiler */}
                <FlowDot path="M915,340 L1060,340 L1060,355" color={C.hotPipe} dur="2s" size={4} />

                {/* Rücklauf WP */}
                <FlowDot path="M860,440 L830,440 L830,480 L700,480" color={C.coldPipe} dur="2.5s" size={4} />

                {/* Abluft-WP → Puffer */}
                <FlowDot path="M445,110 L445,150 L340,150 L340,260" color={C.warmPipe} dur="2s" />
              </g>
            )}

            {/* ═══════════════════════════════════════════
                 TITLE BLOCK
                 ═══════════════════════════════════════════ */}
            <text x="850" y="600" textAnchor="middle" fill={C.textDim} fontSize="10">
              ② Hauptstation + Anschluss an Satellitenhaus - Detail · Darmstadt 2026
            </text>

          </svg>
        </div>

        {/* Detail-Panel */}
        {selected && <DetailPanel info={selected} onClose={() => setSelected(null)} />}
      </div>

      {/* Legende */}
      <div className="flex flex-wrap items-center gap-5 px-4 py-2.5 bg-[#111620]/60 rounded-xl border border-[#1e2736] text-[11px]">
        <span className="text-slate-500 font-medium">Legende:</span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-1 rounded-full" style={{ background: C.hotPipe }} /><span className="text-slate-400">Vorlauf (heiß)</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-0.5 rounded-full" style={{ background: C.coldPipe, border: `1px dashed ${C.coldPipe}` }} /><span className="text-slate-400">Rücklauf (kalt)</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-1 rounded-full" style={{ background: C.geoPipe }} /><span className="text-slate-400">Erdwärme</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-1 rounded-full" style={{ background: C.coolPipe }} /><span className="text-slate-400">Kältekreis</span>
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="14" height="14"><circle cx="7" cy="7" r="5" fill="none" stroke={C.pumpOn} strokeWidth="1.5" /><polygon points="7,4 10,9 4,9" fill={C.pumpOn} /></svg>
          <span className="text-slate-400">Pumpe aktiv</span>
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="14" height="14"><circle cx="7" cy="7" r="5" fill="none" stroke={C.pumpOff} strokeWidth="1.5" /><polygon points="7,4 10,9 4,9" fill={C.pumpOff} /></svg>
          <span className="text-slate-400">Pumpe aus</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-gradient-to-b from-red-500 via-purple-500 to-blue-500" />
          <span className="text-slate-400">Wärmetauscher</span>
        </span>
      </div>
    </div>
  );
}

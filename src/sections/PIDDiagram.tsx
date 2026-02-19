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
  borderLight: '#243044',
  hotPipe: '#ef4444',     // Vorlauf
  hotGlow: '#ef444430',
  warmPipe: '#f97316',    // Quelle warm
  warmGlow: '#f9731630',
  coldPipe: '#3b82f6',    // Rücklauf
  coldGlow: '#3b82f630',
  coolPipe: '#06b6d4',    // Kältekreis
  coolGlow: '#06b6d430',
  geoPipe: '#22c55e',     // Erdwärme
  geoGlow: '#22c55e30',
  pumpOn: '#22c55e',
  pumpOff: '#475569',
  tankStroke: '#475569',
  tankFill: '#0f172a',
  text: '#94a3b8',
  textBright: '#e2e8f0',
  textDim: '#334155',
  accent: '#10b981',
};

// ═══════════════════════════════════════════════════════════════
//  GRID-KONSTANTEN (saubere Positionierung)
// ═══════════════════════════════════════════════════════════════
const Y = {
  source: 65,       // Quellen-Boxen (Oberkante)
  srcPipe: 155,     // Quellen-Rohre horizontal
  tankTop: 185,     // Tank Oberkante
  vl: 260,          // ═══ VORLAUF Hauptleitung ═══
  mid: 300,         // Mittelachse
  rl: 350,          // ═══ RÜCKLAUF Hauptleitung ═══
  tankBot: 420,     // Tank Unterkante
  info: 470,        // Info-Boxen
  title: 550,       // Titelzeile
};

const CX = {
  erd: 75,          // Erdwärmefeld
  p01: 160,         // Pumpe P01
  pvt: 235,         // Puffer PVT Mitte
  p03: 330,         // Pumpe P03
  wt: 400,          // Wärmetauscher Mitte
  wtR: 420,         // WT rechte Kante
  wp: 550,          // Wärmepumpe Mitte
  wpR: 630,         // WP rechte Kante
  p04: 680,         // Pumpe P04
  psHz: 760,        // Puffer HZ Mitte
  p05: 840,         // Pumpe P05
  vert: 960,        // Verteiler HZ Mitte
  vertR: 1050,      // Verteiler rechte Kante
  sat: 1100,        // Satellitenhaus
  div: 1170,        // Trennlinie
  psK: 1260,        // Puffer Kälte Mitte
  p07: 1340,        // Pumpe P07
  vertK: 1400,      // Verteiler Kühlung Mitte
};

// ═══════════════════════════════════════════════════════════════
//  SVG DEFS
// ═══════════════════════════════════════════════════════════════
function Defs() {
  return (
    <defs>
      <linearGradient id="tankHot" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ef4444" stopOpacity="0.25" />
        <stop offset="50%" stopColor="#ea580c" stopOpacity="0.1" />
        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.15" />
      </linearGradient>
      <linearGradient id="tankCold" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.15" />
        <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.2" />
      </linearGradient>
      <linearGradient id="wtGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
        <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.7" />
        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
      </linearGradient>
      <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="3" result="b" />
        <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
      <style>{`
        @keyframes pulse { 0%,100% { opacity:.5 } 50% { opacity:1 } }
        .pump-pulse { animation: pulse 2s ease-in-out infinite }
        .temp-font { font-family: 'JetBrains Mono','Fira Code',ui-monospace,monospace }
      `}</style>
    </defs>
  );
}

// ═══════════════════════════════════════════════════════════════
//  PRIMITIVE KOMPONENTEN
// ═══════════════════════════════════════════════════════════════

/** Rohrleitung – sauber horizontal/vertikal */
function Pipe({ d, color, w = 3, dash, glow }: {
  d: string; color: string; w?: number; dash?: string; glow?: string;
}) {
  return (
    <g>
      {glow && <path d={d} fill="none" stroke={glow} strokeWidth={w + 8} strokeLinecap="round" strokeLinejoin="round" />}
      <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dash} />
    </g>
  );
}

/** Animierter Strömungspunkt */
function Flow({ path, color, dur = '3s', delay = '0s', r = 4 }: {
  path: string; color: string; dur?: string; delay?: string; r?: number;
}) {
  return (
    <circle r={r} fill={color} opacity="0.85">
      <animateMotion dur={dur} repeatCount="indefinite" begin={delay} path={path} />
    </circle>
  );
}

/** Pumpe – DIN-Symbol */
function Pump({ x, y, id, on, onClick }: {
  x: number; y: number; id: string; on: boolean; onClick?: () => void;
}) {
  return (
    <g transform={`translate(${x},${y})`} className="cursor-pointer" onClick={onClick}>
      {on && <circle r="19" fill={C.pumpOn} opacity="0.12" filter="url(#glow)" />}
      <circle r="14" fill={C.tankFill} stroke={on ? C.pumpOn : C.pumpOff} strokeWidth="2" />
      <polygon points="0,-7 7,4 -7,4" fill={on ? C.pumpOn : C.pumpOff} className={on ? 'pump-pulse' : ''} />
      <text y="26" textAnchor="middle" fill={on ? C.pumpOn : C.pumpOff} fontSize="9" fontWeight="700">{id}</text>
    </g>
  );
}

/** Pufferspeicher */
function Tank({ cx, y, w, h, label, vol, temps, grad, onClick }: {
  cx: number; y: number; w: number; h: number; label: string; vol: string;
  temps?: [string, string?, string?]; grad: string; onClick?: () => void;
}) {
  const x = cx - w / 2;
  return (
    <g className="cursor-pointer" onClick={onClick}>
      <rect x={x} y={y} width={w} height={h} rx={w / 2} fill={`url(#${grad})`} stroke={C.tankStroke} strokeWidth="2" />
      {/* Sensor-Punkte + Temps */}
      {temps?.[0] && <>
        <circle cx={x + w + 5} cy={y + h * 0.18} r="2" fill={C.tankStroke} />
        <line x1={x + w + 5} y1={y + h * 0.18} x2={x + w + 16} y2={y + h * 0.18} stroke={C.textDim} strokeWidth="1" />
        <Temp x={x + w + 19} y={y + h * 0.18} v={temps[0]} c={C.hotPipe} />
      </>}
      {temps?.[1] && <>
        <circle cx={x + w + 5} cy={y + h * 0.5} r="2" fill={C.tankStroke} />
        <line x1={x + w + 5} y1={y + h * 0.5} x2={x + w + 16} y2={y + h * 0.5} stroke={C.textDim} strokeWidth="1" />
        <Temp x={x + w + 19} y={y + h * 0.5} v={temps[1]} c={C.warmPipe} />
      </>}
      {temps?.[2] && <>
        <circle cx={x + w + 5} cy={y + h * 0.82} r="2" fill={C.tankStroke} />
        <line x1={x + w + 5} y1={y + h * 0.82} x2={x + w + 16} y2={y + h * 0.82} stroke={C.textDim} strokeWidth="1" />
        <Temp x={x + w + 19} y={y + h * 0.82} v={temps[2]} c={C.coldPipe} />
      </>}
      {/* Label */}
      <text x={cx} y={y - 6} textAnchor="middle" fill={C.textBright} fontSize="10" fontWeight="600">{label}</text>
      <text x={cx} y={y - 18} textAnchor="middle" fill={C.textDim} fontSize="8">{vol}</text>
    </g>
  );
}

/** Temperatur-Badge (kompakt) */
function Temp({ x, y, v, c }: { x: number; y: number; v: string; c: string }) {
  return (
    <g className="temp-font">
      <rect x={x} y={y - 7} width={38} height={14} rx="3" fill={C.panel} stroke={c} strokeWidth="0.8" strokeOpacity="0.5" />
      <text x={x + 19} y={y + 4} textAnchor="middle" fill={c} fontSize="9" fontWeight="700">{v}</text>
    </g>
  );
}

/** Inline Temp-Label an Pipe */
function PipeTemp({ x, y, v, c }: { x: number; y: number; v: string; c: string }) {
  return (
    <g className="temp-font">
      <rect x={x - 22} y={y - 8} width={44} height={16} rx="4" fill={C.bg} stroke={c} strokeWidth="1" strokeOpacity="0.4" />
      <text x={x} y={y + 3} textAnchor="middle" fill={c} fontSize="10" fontWeight="800">{v}</text>
    </g>
  );
}

/** Kompaktes Info-Label */
function Label({ x, y, text, size = 8 }: { x: number; y: number; text: string; size?: number }) {
  return <text x={x} y={y} fill={C.textDim} fontSize={size} fontWeight="500">{text}</text>;
}

/** Absperrventil */
function Valve({ x, y, rot = 0 }: { x: number; y: number; rot?: number }) {
  return (
    <g transform={`translate(${x},${y}) rotate(${rot})`}>
      <polygon points="-5,-4 0,0 -5,4" fill="none" stroke={C.tankStroke} strokeWidth="1.3" />
      <polygon points="5,-4 0,0 5,4" fill="none" stroke={C.tankStroke} strokeWidth="1.3" />
    </g>
  );
}

/** MAG-Gefäß */
function MAG({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <line x1={x} y1={y - 16} x2={x} y2={y - 8} stroke={C.textDim} strokeWidth="1" />
      <ellipse cx={x} cy={y} rx="10" ry="12" fill={C.tankFill} stroke={C.textDim} strokeWidth="1.2" />
      <text x={x} y={y + 3} textAnchor="middle" fill={C.textDim} fontSize="6" fontWeight="600">MAG</text>
    </g>
  );
}

/** Komponenten-Box */
function Box({ x, y, w, h, title, sub, active, color, onClick }: {
  x: number; y: number; w: number; h: number;
  title: string; sub?: string; active?: boolean; color?: string; onClick?: () => void;
}) {
  const c = color || C.accent;
  return (
    <g className="cursor-pointer" onClick={onClick}>
      {active && <rect x={x - 2} y={y - 2} width={w + 4} height={h + 4} rx="6" fill={c} opacity="0.06" filter="url(#glow)" />}
      <rect x={x} y={y} width={w} height={h} rx="4" fill={C.panel} stroke={active ? c : C.border} strokeWidth={active ? 1.8 : 1.2} />
      <text x={x + w / 2} y={y + (sub ? h / 2 - 3 : h / 2 + 3)} textAnchor="middle" fill={C.textBright} fontSize="10" fontWeight="600">{title}</text>
      {sub && <text x={x + w / 2} y={y + h / 2 + 8} textAnchor="middle" fill={C.textDim} fontSize="7.5">{sub}</text>}
    </g>
  );
}

/** Verteiler (breiter Balken mit Abgängen) */
function Dist({ x, y, w, h, label, active, color, onClick }: {
  x: number; y: number; w: number; h: number;
  label: string; active?: boolean; color?: string; onClick?: () => void;
}) {
  const c = color || C.accent;
  return (
    <g className="cursor-pointer" onClick={onClick}>
      <rect x={x} y={y} width={w} height={h} rx="3" fill={C.panel} stroke={active ? c : C.border} strokeWidth={active ? 2 : 1.2} />
      <text x={x + w / 2} y={y + h / 2 + 4} textAnchor="middle" fill={C.textBright} fontSize="10" fontWeight="700" letterSpacing="0.5">{label}</text>
      {[0.2, 0.4, 0.6, 0.8].map((p, i) => (
        <g key={i}>
          <line x1={x + w * p} y1={y} x2={x + w * p} y2={y - 12} stroke={C.border} strokeWidth="1.2" />
          <Valve x={x + w * p} y={y - 12} rot={90} />
        </g>
      ))}
    </g>
  );
}

/** Hintergrund-Region Label */
function Region({ x, y, text }: { x: number; y: number; text: string }) {
  return <text x={x} y={y} fill={C.textDim} fontSize="10" fontWeight="700" letterSpacing="2.5" opacity="0.25">{text}</text>;
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
  const on = info.status === 'running';
  return (
    <div className="absolute bottom-3 left-3 right-3 z-30 bg-[#0f1520]/95 backdrop-blur-xl border border-[#1e2736] rounded-xl p-3.5 shadow-2xl"
      onClick={e => e.stopPropagation()}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-white font-bold text-sm">{info.name}</h3>
          <p className="text-slate-400 text-xs">{info.desc}</p>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white p-1"><X className="w-4 h-4" /></button>
      </div>
      <div className="flex flex-wrap gap-1.5 text-xs">
        <Chip label="ID" value={info.id} mono />
        <Chip label="Status" badge={
          <Badge className={`text-[10px] ${on ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
            {on ? 'Laufend' : 'Bereit'}
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
    <div className="bg-[#0a0e14] rounded-md px-2.5 py-1 inline-flex items-center gap-1.5">
      <span className="text-[8px] text-slate-500 uppercase">{label}</span>
      {badge || <span className={`font-semibold text-xs ${color} ${mono ? 'font-mono' : ''}`}>{value}</span>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  HAUPTKOMPONENTE
// ═══════════════════════════════════════════════════════════════
export function PIDDiagram({ data }: { data: HeatingData | null }) {
  const [selected, setSelected] = useState<CompInfo | null>(null);
  const [showFlow, setShowFlow] = useState(true);
  const [zoom, setZoom] = useState(1);

  const on = data?.status === 'heizen';
  const sel = (i: CompInfo) => setSelected(i);

  const vl = data?.vorlauftemperatur?.toFixed(0) ?? '--';
  const rl = data?.ruecklauftemperatur?.toFixed(0) ?? '--';
  const po = data?.puffer_oben?.toFixed(0) ?? '--';
  const pm = data?.puffer_mitte?.toFixed(0) ?? '--';
  const pu = data?.puffer_unten?.toFixed(0) ?? '--';
  const cop = data?.cop?.toFixed(1) ?? '--';
  const aus = data?.aussentemperatur?.toFixed(1) ?? '--';

  const W = 1500, H = 580;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">P&ID-Diagramm</h2>
          <p className="text-sm text-slate-400">② Hauptstation + Anschluss Satellitenhaus</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowFlow(!showFlow)}
            className={`border-[#1e2736] text-xs ${showFlow ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-400'}`}>
            <Droplets className="w-3.5 h-3.5 mr-1" />
            {showFlow ? 'Strömung AN' : 'Strömung AUS'}
          </Button>
          <div className="flex items-center gap-1 bg-[#111620] rounded-lg border border-[#1e2736] p-0.5">
            <Button variant="ghost" size="sm" onClick={() => setZoom(Math.max(0.5, zoom - 0.15))} className="text-slate-400 h-7 w-7 p-0"><ZoomOut className="w-3.5 h-3.5" /></Button>
            <span className="text-xs text-slate-400 w-10 text-center">{Math.round(zoom * 100)}%</span>
            <Button variant="ghost" size="sm" onClick={() => setZoom(Math.min(2, zoom + 0.15))} className="text-slate-400 h-7 w-7 p-0"><ZoomIn className="w-3.5 h-3.5" /></Button>
            <Button variant="ghost" size="sm" onClick={() => setZoom(1)} className="text-slate-400 h-7 w-7 p-0"><RotateCcw className="w-3.5 h-3.5" /></Button>
          </div>
        </div>
      </div>

      {/* Status-Bar */}
      <div className="flex flex-wrap items-center gap-4 px-3 py-2 bg-[#111620]/50 rounded-lg border border-[#1e2736] text-xs font-mono">
        <span className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${on ? 'bg-orange-400 animate-pulse' : 'bg-slate-600'}`} />
          <span className={on ? 'text-orange-400 font-semibold' : 'text-slate-500'}>
            {data?.status === 'heizen' ? 'HEIZEN' : data?.status === 'abtauen' ? 'ABTAUEN' : 'STANDBY'}
          </span>
        </span>
        <span className="text-slate-700">│</span>
        <span className="text-slate-500">VL <span className="text-orange-400 font-semibold">{vl}°C</span></span>
        <span className="text-slate-500">RL <span className="text-sky-400 font-semibold">{rl}°C</span></span>
        <span className="text-slate-500">COP <span className="text-emerald-400 font-semibold">{cop}</span></span>
        <span className="text-slate-500">Außen <span className="text-teal-400 font-semibold">{aus}°C</span></span>
      </div>

      {/* ══════════════════════════════════════════════════
           SVG DIAGRAMM
         ══════════════════════════════════════════════════ */}
      <div className="relative overflow-auto rounded-xl border border-[#1e2736]"
        style={{ background: C.bg, maxHeight: 640 }}
        onClick={() => setSelected(null)}>

        <div style={{ transform: `scale(${zoom})`, transformOrigin: '0 0' }}>
          <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ display: 'block' }}>
            <Defs />

            {/* Grid-Punkte */}
            <pattern id="g" width="30" height="30" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.4" fill="#334155" opacity="0.12" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#g)" />

            {/* Region Labels */}
            <Region x={50} y={48} text="QUELLEN" />
            <Region x={380} y={520} text="ERZEUGUNG" />
            <Region x={700} y={175} text="SPEICHER" />
            <Region x={870} y={220} text="VERTEILUNG" />
            <Region x={1200} y={175} text="KÄLTE" />

            {/* ══════ Trennlinie Heizung / Kälte ══════ */}
            <line x1={CX.div} y1="50" x2={CX.div} y2="530" stroke={C.border} strokeWidth="1" strokeDasharray="6,4" opacity="0.4" />

            {/* ════════════════════════════════════════════════════════════
                 QUELLEN (oben)
                 ════════════════════════════════════════════════════════════ */}

            {/* PVT-Solarkollektoren */}
            <Box x={155} y={Y.source} w={110} h={42} title="PVT-Solar" sub="6,2 kW th." active={!!on} color={C.warmPipe}
              onClick={() => sel({ id: 'PVT', name: 'PVT-Solarkollektoren', desc: 'Auf Dach, 6,2 kW thermisch', status: 'running', temp: `${aus}°C`, power: '6,2 kW' })} />
            {/* Sun icon */}
            <circle cx="210" cy={Y.source - 8} r="7" fill="none" stroke="#fbbf24" strokeWidth="1.2" opacity="0.4" />
            <circle cx="210" cy={Y.source - 8} r="2.5" fill="#fbbf24" opacity="0.4" />

            {/* Abluft-Wärmepumpe */}
            <Box x={345} y={Y.source} w={120} h={42} title="Abluft-WP" sub="Rohrbegleitheizung" active={!!on} color={C.warmPipe}
              onClick={() => sel({ id: 'ABWP', name: 'Abluft-Wärmepumpe', desc: 'Auf Dach + Rohrbegleitheizung', status: on ? 'running' : 'standby', temp: '40°C', tempRet: '35°C' })} />

            {/* Erdwärmefeld */}
            <Box x={20} y={Y.vl - 20} w={100} h={42} title="Erdwärmefeld" sub="FVU Nahwärme" active={!!on} color={C.geoPipe}
              onClick={() => sel({ id: 'ERD', name: 'Erdwärmefeld', desc: 'Zuleitung FVU Nahwärme', status: on ? 'running' : 'standby', flow: '42,1 m³/h', dn: 'DN 80' })} />

            {/* ════════════════════════════════════════════════════════════
                 ROHRLEITUNGEN – Quellen → Puffer PVT
                 ════════════════════════════════════════════════════════════ */}

            {/* PVT → runter → Puffer PVT oben (VL) */}
            <Pipe d={`M210,${Y.source + 42} L210,${Y.srcPipe} L${CX.pvt - 15},${Y.srcPipe} L${CX.pvt - 15},${Y.tankTop}`}
              color={C.warmPipe} glow={C.warmGlow} />
            <Label x={215} y={Y.srcPipe - 4} text="DN 65" />

            {/* Abluft-WP → runter → Puffer PVT oben */}
            <Pipe d={`M405,${Y.source + 42} L405,${Y.srcPipe + 20} L${CX.pvt + 15},${Y.srcPipe + 20} L${CX.pvt + 15},${Y.tankTop}`}
              color={C.warmPipe} glow={C.warmGlow} />
            {/* P02 auf der Leitung */}
            <Pump x={405} y={Y.srcPipe - 10} id="P02" on={!!on}
              onClick={() => sel({ id: 'P02', name: 'Pumpe P02', desc: 'Umwälzpumpe Abluft-WP', status: on ? 'running' : 'off', flow: '15,2 m³/h', dn: 'DN 65' })} />

            {/* Erdwärme → rechts → WT (Vorlauf auf Y.vl) */}
            <Pipe d={`M120,${Y.vl} L${CX.p01 - 14},${Y.vl}`} color={C.geoPipe} glow={C.geoGlow} w={3.5} />
            <Pump x={CX.p01} y={Y.vl} id="P01" on={!!on}
              onClick={() => sel({ id: 'P01', name: 'Pumpe P01', desc: 'Umwälzpumpe Erdwärme', status: on ? 'running' : 'off', flow: '42,1 m³/h', dn: 'DN 80' })} />
            <Pipe d={`M${CX.p01 + 14},${Y.vl} L${CX.wt - 12},${Y.vl}`} color={C.geoPipe} glow={C.geoGlow} w={3.5} />
            <Label x={CX.p01 - 10} y={Y.vl - 18} text="DN 80" />

            {/* Erdwärme ← Rücklauf auf Y.rl */}
            <Pipe d={`M${CX.wt - 12},${Y.rl} L120,${Y.rl} L70,${Y.rl} L70,${Y.vl + 20}`}
              color={C.geoPipe} w={2.5} dash="5,3" />

            {/* Auslegungsdaten */}
            <g transform={`translate(${CX.p01 - 30},${Y.rl + 25})`}>
              <rect width="100" height="46" rx="3" fill={C.panel} stroke={C.border} strokeWidth="0.8" opacity="0.7" />
              <text x="50" y="12" textAnchor="middle" fill={C.textDim} fontSize="7" fontWeight="600">Auslegung Erdwärme</text>
              <text x="50" y="22" textAnchor="middle" fill={C.text} fontSize="6.5">ΔT 3K · Glycol 30%</text>
              <text x="50" y="31" textAnchor="middle" fill={C.text} fontSize="6.5">42,1 m³/h · DN 80</text>
              <text x="50" y="40" textAnchor="middle" fill={C.text} fontSize="6.5">SV 3,5 bar · 400V</text>
            </g>

            {/* ════════════════════════════════════════════════════════════
                 PUFFER PVT  (2000 L)
                 ════════════════════════════════════════════════════════════ */}
            <Tank cx={CX.pvt} y={Y.tankTop} w={50} h={Y.tankBot - Y.tankTop} label="Puffer PVT" vol="2000 L"
              temps={[`${po}°`, `${pm}°`, `${pu}°`]} grad="tankHot"
              onClick={() => sel({ id: 'PS1', name: 'Pufferspeicher PVT', desc: 'Hydr. Trennung, 2000 L', status: on ? 'running' : 'standby', temp: `${po}°C`, power: '2000 L', dn: 'DN 100' })} />
            <Label x={CX.pvt - 30} y={Y.tankTop + 15} text="DN 63" />

            {/* Puffer PVT → P03 → WT  (VL auf Y.vl) */}
            <Pipe d={`M${CX.pvt + 25},${Y.vl} L${CX.p03 - 14},${Y.vl}`} color={C.warmPipe} glow={C.warmGlow} />
            <Pump x={CX.p03} y={Y.vl} id="P03" on={!!on}
              onClick={() => sel({ id: 'P03', name: 'Pumpe P03', desc: 'Umwälzpumpe Puffer PVT', status: on ? 'running' : 'off', flow: '28,5 m³/h', dn: 'DN 100' })} />
            <Pipe d={`M${CX.p03 + 14},${Y.vl} L${CX.wt - 12},${Y.vl}`} color={C.warmPipe} glow={C.warmGlow} />
            <Label x={CX.p03 - 5} y={Y.vl - 18} text="DN 100" />

            {/* Puffer PVT ← WT  (RL auf Y.rl) */}
            <Pipe d={`M${CX.pvt + 25},${Y.rl} L${CX.wt - 12},${Y.rl}`} color={C.coldPipe} w={2.5} dash="5,3" />

            {/* ════════════════════════════════════════════════════════════
                 WÄRMETAUSCHER  (47 kW)
                 ════════════════════════════════════════════════════════════ */}
            <g className="cursor-pointer" onClick={() => sel({ id: 'WT1', name: 'Wärmetauscher', desc: 'Plattenwärmetauscher 47 kW', status: on ? 'running' : 'standby', power: '47 kW', dn: 'DN 80' })}>
              <rect x={CX.wt - 12} y={Y.vl - 10} width={24} height={Y.rl - Y.vl + 20} rx="3"
                fill="url(#wtGrad)" stroke={C.tankStroke} strokeWidth="1.5" />
              {[0, 1, 2, 3, 4].map(i => (
                <line key={i} x1={CX.wt - 9} y1={Y.vl + 5 + i * 18} x2={CX.wt + 9} y2={Y.vl + 5 + i * 18}
                  stroke="rgba(255,255,255,0.15)" strokeWidth="0.7" />
              ))}
            </g>
            <text x={CX.wt} y={Y.rl + 30} textAnchor="middle" fill={C.textDim} fontSize="8">WT · 47 kW</text>

            {/* WT → WP (VL auf Y.vl) */}
            <Pipe d={`M${CX.wt + 12},${Y.vl} L${CX.wp - 60},${Y.vl}`} color={C.warmPipe} glow={C.warmGlow} w={3.5} />
            <Label x={CX.wt + 20} y={Y.vl - 8} text="DN 80" />

            {/* WT ← WP (RL auf Y.rl) */}
            <Pipe d={`M${CX.wt + 12},${Y.rl} L${CX.wp - 60},${Y.rl}`} color={C.coldPipe} glow={C.coldGlow} w={2.5} dash="5,3" />
            <Label x={CX.wt + 20} y={Y.rl + 12} text="DN 80" />

            {/* ════════════════════════════════════════════════════════════
                 WÄRMEPUMPE  (175 kW th. / 38,9 kW el.)
                 ════════════════════════════════════════════════════════════ */}
            <g className="cursor-pointer" onClick={() => sel({ id: 'WP1', name: 'Wärmepumpe', desc: '175 kW th. / 38,9 kW el.', status: on ? 'running' : 'standby', temp: `${vl}°C`, tempRet: `${rl}°C`, power: '175 kW', dn: 'DN 100' })}>
              {on && <rect x={CX.wp - 62} y={Y.vl - 35} width={124} height={Y.rl - Y.vl + 70} rx="8" fill={C.hotPipe} opacity="0.05" filter="url(#glow)" />}
              <rect x={CX.wp - 60} y={Y.vl - 33} width={120} height={Y.rl - Y.vl + 66} rx="6"
                fill={C.panel} stroke={on ? C.hotPipe : C.border} strokeWidth={on ? 2 : 1.2} />
              <text x={CX.wp} y={Y.vl - 12} textAnchor="middle" fill={C.textBright} fontSize="11" fontWeight="700">Wärmepumpe</text>
              <text x={CX.wp} y={Y.vl + 2} textAnchor="middle" fill={C.textDim} fontSize="8">175 kW th · 38,9 kW el</text>
              {/* COP Box */}
              <rect x={CX.wp - 35} y={Y.mid - 15} width={70} height={30} rx="4" fill={C.bg} stroke={C.border} strokeWidth="0.8" />
              <text x={CX.wp} y={Y.mid - 2} textAnchor="middle" fill={C.textDim} fontSize="7.5">COP</text>
              <text x={CX.wp} y={Y.mid + 12} textAnchor="middle" fill={C.accent} fontSize="14" fontWeight="800" className="temp-font">{cop}</text>
              {/* Status */}
              <circle cx={CX.wp - 40} cy={Y.rl + 18} r={4} fill={on ? C.pumpOn : C.pumpOff} className={on ? 'pump-pulse' : ''} />
              <text x={CX.wp - 30} y={Y.rl + 22} fill={on ? C.pumpOn : C.pumpOff} fontSize="8.5" fontWeight="600">
                {on ? 'AKTIV' : 'STANDBY'}
              </text>
              {/* 400V / SV */}
              <text x={CX.wp + 10} y={Y.rl + 22} fill={C.textDim} fontSize="7">400V · SV 3,5 bar</text>
            </g>

            {/* WP → P04 (VL auf Y.vl) */}
            <Pipe d={`M${CX.wpR},${Y.vl} L${CX.p04 - 14},${Y.vl}`} color={C.hotPipe} glow={C.hotGlow} w={4} />
            <Pump x={CX.p04} y={Y.vl} id="P04" on={!!on}
              onClick={() => sel({ id: 'P04', name: 'Pumpe P04', desc: 'Umwälzpumpe Heizung', status: on ? 'running' : 'off', flow: '18,3 m³/h', dn: 'DN 100' })} />
            <PipeTemp x={CX.p04 + 40} y={Y.vl} v={`${vl}°`} c={C.hotPipe} />

            {/* P04 → Puffer HZ (VL auf Y.vl) */}
            <Pipe d={`M${CX.p04 + 14},${Y.vl} L${CX.psHz - 28},${Y.vl}`} color={C.hotPipe} glow={C.hotGlow} w={4} />
            <Label x={CX.p04 + 5} y={Y.vl - 18} text="DN 100" />

            {/* WP ← Puffer HZ (RL auf Y.rl) */}
            <Pipe d={`M${CX.wpR},${Y.rl} L${CX.psHz - 28},${Y.rl}`} color={C.coldPipe} glow={C.coldGlow} w={3} dash="5,3" />
            <PipeTemp x={CX.p04 + 40} y={Y.rl} v={`${rl}°`} c={C.coldPipe} />
            <Label x={CX.p04 + 5} y={Y.rl + 14} text="DN 100" />

            {/* ════════════════════════════════════════════════════════════
                 PUFFER HEIZUNG  (1500 L)
                 ════════════════════════════════════════════════════════════ */}
            <Tank cx={CX.psHz} y={Y.tankTop} w={48} h={Y.tankBot - Y.tankTop} label="Puffer HZ" vol="1500 L"
              temps={[`${vl}°`, undefined, `${rl}°`]} grad="tankHot"
              onClick={() => sel({ id: 'PS2', name: 'Pufferspeicher HZ', desc: '1500 Liter', status: on ? 'running' : 'standby', temp: `${vl}°C`, tempRet: `${rl}°C`, power: '1500 L', dn: 'DN 80' })} />
            <MAG x={CX.psHz + 42} y={Y.mid + 10} />
            <Label x={CX.psHz - 32} y={Y.tankTop + 12} text="DN 80" />

            {/* Puffer HZ → P05 (VL auf Y.vl) */}
            <Pipe d={`M${CX.psHz + 24},${Y.vl} L${CX.p05 - 14},${Y.vl}`} color={C.hotPipe} glow={C.hotGlow} w={3.5} />
            <Pump x={CX.p05} y={Y.vl} id="P05" on={!!on}
              onClick={() => sel({ id: 'P05', name: 'Pumpe P05', desc: 'Umwälzpumpe Puffer HZ', status: on ? 'running' : 'off', flow: '22,1 m³/h', dn: 'DN 80' })} />
            <Label x={CX.p05 - 5} y={Y.vl - 18} text="DN 65" />

            {/* P05 → Verteiler HZ (VL auf Y.vl) */}
            <Pipe d={`M${CX.p05 + 14},${Y.vl} L${CX.vert - 80},${Y.vl}`} color={C.hotPipe} glow={C.hotGlow} w={3.5} />

            {/* Verteiler HZ ← Rücklauf (RL auf Y.rl) */}
            <Pipe d={`M${CX.psHz + 24},${Y.rl} L${CX.vert - 80},${Y.rl}`} color={C.coldPipe} glow={C.coldGlow} w={2.5} dash="5,3" />

            {/* ════════════════════════════════════════════════════════════
                 VERTEILER HEIZUNG
                 ════════════════════════════════════════════════════════════ */}
            <Dist x={CX.vert - 80} y={Y.vl - 5} w={160} h={40} label="VERTEILER HEIZUNG" active={!!on} color={C.hotPipe}
              onClick={() => sel({ id: 'VH', name: 'Verteiler Heizung', desc: 'Heizungsverteiler', status: on ? 'running' : 'standby', temp: `${vl}°C`, tempRet: `${rl}°C`, dn: 'DN 80' })} />

            {/* Stockwerks-Anschluss (oben) */}
            <line x1={CX.vert - 20} y1={Y.vl - 20} x2={CX.vert - 20} y2={Y.vl - 50} stroke={C.hotPipe} strokeWidth="1.5" />
            <line x1={CX.vert + 20} y1={Y.vl - 20} x2={CX.vert + 20} y2={Y.vl - 50} stroke={C.coldPipe} strokeWidth="1.5" strokeDasharray="3,2" />
            <text x={CX.vert} y={Y.vl - 58} textAnchor="middle" fill={C.textDim} fontSize="7.5">↑ Stockwerke</text>

            {/* Satellitenhaus HZ (rechts) */}
            <Pipe d={`M${CX.vert + 80},${Y.vl + 5} L${CX.sat},${Y.vl + 5}`} color={C.hotPipe} glow={C.hotGlow} w={2.5} />
            <Pipe d={`M${CX.vert + 80},${Y.vl + 25} L${CX.sat},${Y.vl + 25}`} color={C.coldPipe} w={2} dash="4,2" />
            <Box x={CX.sat} y={Y.vl - 8} w={55} h={50} title="Sat.-" sub="Haus E" active={!!on} color={C.hotPipe}
              onClick={() => sel({ id: 'SAT-H', name: 'Satellitenhaus E', desc: 'Heizung-Zuleitung', dn: 'DN 65' })} />
            <Label x={CX.sat + 5} y={Y.vl - 2} text="DN 65" />

            {/* Druckhaltestation (unter Verteiler) */}
            <g transform={`translate(${CX.vert - 65},${Y.rl + 20})`}>
              <rect width="130" height="25" rx="3" fill={C.panel} stroke={C.border} strokeWidth="0.8" strokeDasharray="4,2" />
              <text x="65" y="10" textAnchor="middle" fill={C.textDim} fontSize="7">Druckhalte-/Entgasungs-</text>
              <text x="65" y="20" textAnchor="middle" fill={C.textDim} fontSize="7">und Nachspeisestation</text>
            </g>

            {/* ════════════════════════════════════════════════════════════
                 KÄLTE-BEREICH  (rechts der Trennlinie)
                 ════════════════════════════════════════════════════════════ */}

            {/* Puffer Kälte */}
            <Tank cx={CX.psK} y={Y.tankTop + 10} w={44} h={Y.tankBot - Y.tankTop - 30}
              label="Puffer Kälte" vol="1000 L" temps={['22°', undefined, '18°']} grad="tankCold"
              onClick={() => sel({ id: 'PS3', name: 'Pufferspeicher Kälte', desc: '1000 L', status: 'standby', temp: '22°C', power: '1000 L', dn: 'DN 80' })} />
            <Label x={CX.psK - 28} y={Y.tankTop + 25} text="DN 80" />

            {/* Pendelleitung */}
            <Pipe d={`M${CX.psK - 22},${Y.vl + 10} L${CX.psK - 40},${Y.vl + 10} L${CX.psK - 40},${Y.rl + 60}`}
              color={C.coolPipe} w={1} dash="3,2" />
            <text x={CX.psK - 48} y={Y.mid + 10} fill={C.coolPipe} fontSize="6" opacity="0.5"
              transform={`rotate(-90,${CX.psK - 48},${Y.mid + 10})`}>Pendelltg. DN20</text>

            {/* Puffer Kälte → P07 → Verteiler (VL) */}
            <Pipe d={`M${CX.psK + 22},${Y.vl + 15} L${CX.p07 - 14},${Y.vl + 15}`} color={C.coolPipe} w={2.5} />
            <Pump x={CX.p07} y={Y.vl + 15} id="P07" on={false}
              onClick={() => sel({ id: 'P07', name: 'Pumpe P07', desc: 'Umwälzpumpe Kältepuffer', status: 'standby', flow: '8,7 m³/h', dn: 'DN 50' })} />
            <Pipe d={`M${CX.p07 + 14},${Y.vl + 15} L${CX.vertK - 60},${Y.vl + 15} L${CX.vertK - 60},${Y.vl + 30}`}
              color={C.coolPipe} w={2.5} />
            <Label x={CX.p07 - 5} y={Y.vl + 2} text="DN 50" />

            {/* Rücklauf Kälte */}
            <Pipe d={`M${CX.vertK - 60},${Y.rl + 20} L${CX.vertK - 60},${Y.rl + 50} L${CX.psK + 22},${Y.rl + 50} L${CX.psK + 22},${Y.rl}`}
              color={C.coolPipe} w={2} dash="4,3" />

            {/* Verteiler Kühlung */}
            <Dist x={CX.vertK - 60} y={Y.vl + 30} w={120} h={35} label="VERTEILER KÜHLUNG" color={C.coolPipe}
              onClick={() => sel({ id: 'VK', name: 'Verteiler Kühlung', desc: 'Kühlverteiler', status: 'standby', temp: '22°C', tempRet: '18°C', dn: 'DN 50' })} />

            {/* P06 */}
            <Pump x={CX.psK} y={Y.rl + 50} id="P06" on={false}
              onClick={() => sel({ id: 'P06', name: 'Pumpe P06', desc: 'Umwälzpumpe Kühlung', status: 'standby', flow: '12,4 m³/h', dn: 'DN 80' })} />

            {/* Satellitenhaus Kühlung */}
            <Box x={CX.vertK + 65} y={Y.vl + 25} w={55} h={45} title="Sat.-" sub="Haus K" color={C.coolPipe}
              onClick={() => sel({ id: 'SAT-K', name: 'Satellitenhaus E', desc: 'Kühlung-Zuleitung', dn: 'DN 50' })} />
            <Pipe d={`M${CX.vertK + 60},${Y.vl + 45} L${CX.vertK + 65},${Y.vl + 45}`} color={C.coolPipe} w={2} />
            <Label x={CX.vertK + 65} y={Y.vl + 22} text="DN 50" />

            {/* MAG Kälte */}
            <MAG x={CX.vertK - 20} y={Y.rl + 50} />

            {/* ════════════════════════════════════════════════════════════
                 ANIMIERTE STRÖMUNG
                 ════════════════════════════════════════════════════════════ */}
            {showFlow && on && (
              <g>
                {/* Erdwärme → WT */}
                <Flow path={`M120,${Y.vl} L${CX.wt - 12},${Y.vl}`} color={C.geoPipe} dur="2.5s" />
                <Flow path={`M120,${Y.vl} L${CX.wt - 12},${Y.vl}`} color={C.geoPipe} dur="2.5s" delay="1.2s" />

                {/* PVT → Puffer */}
                <Flow path={`M210,${Y.source + 42} L210,${Y.srcPipe} L${CX.pvt - 15},${Y.srcPipe} L${CX.pvt - 15},${Y.tankTop}`}
                  color={C.warmPipe} dur="2s" />

                {/* Abluft → Puffer */}
                <Flow path={`M405,${Y.source + 42} L405,${Y.srcPipe + 20} L${CX.pvt + 15},${Y.srcPipe + 20} L${CX.pvt + 15},${Y.tankTop}`}
                  color={C.warmPipe} dur="2.5s" />

                {/* Puffer PVT → WT */}
                <Flow path={`M${CX.pvt + 25},${Y.vl} L${CX.wt - 12},${Y.vl}`} color={C.warmPipe} dur="1.5s" />

                {/* WT → WP */}
                <Flow path={`M${CX.wt + 12},${Y.vl} L${CX.wp - 60},${Y.vl}`} color={C.warmPipe} dur="1.5s" />
                <Flow path={`M${CX.wt + 12},${Y.vl} L${CX.wp - 60},${Y.vl}`} color={C.warmPipe} dur="1.5s" delay="0.7s" />

                {/* WP → Puffer HZ (VL) */}
                <Flow path={`M${CX.wpR},${Y.vl} L${CX.psHz - 28},${Y.vl}`} color={C.hotPipe} dur="2s" r={5} />
                <Flow path={`M${CX.wpR},${Y.vl} L${CX.psHz - 28},${Y.vl}`} color={C.hotPipe} dur="2s" delay="1s" r={5} />

                {/* Puffer HZ → Verteiler */}
                <Flow path={`M${CX.psHz + 24},${Y.vl} L${CX.vert - 80},${Y.vl}`} color={C.hotPipe} dur="2s" r={4} />

                {/* Rücklauf WP */}
                <Flow path={`M${CX.psHz - 28},${Y.rl} L${CX.wpR},${Y.rl}`} color={C.coldPipe} dur="2.5s" r={4} />

                {/* Rücklauf Erdwärme */}
                <Flow path={`M${CX.wt - 12},${Y.rl} L120,${Y.rl}`} color={C.geoPipe} dur="2.5s" r={3} />
              </g>
            )}

            {/* Titelzeile */}
            <text x={W / 2} y={Y.title} textAnchor="middle" fill={C.textDim} fontSize="9">
              ② Hauptstation + Anschluss an Satellitenhaus – Detail · Darmstadt 2026
            </text>

          </svg>
        </div>

        {/* Detail-Panel Overlay */}
        {selected && <DetailPanel info={selected} onClose={() => setSelected(null)} />}
      </div>

      {/* Legende */}
      <div className="flex flex-wrap items-center gap-4 px-3 py-2 bg-[#111620]/50 rounded-lg border border-[#1e2736] text-[10px]">
        <span className="text-slate-500 font-medium text-[11px]">Legende</span>
        {[
          { c: C.hotPipe, l: 'Vorlauf (heiß)' },
          { c: C.coldPipe, l: 'Rücklauf (kalt)', dash: true },
          { c: C.geoPipe, l: 'Erdwärme' },
          { c: C.warmPipe, l: 'Quelle (warm)' },
          { c: C.coolPipe, l: 'Kältekreis' },
        ].map(({ c, l, dash }) => (
          <span key={l} className="flex items-center gap-1.5">
            <span className="w-5 h-0.5 rounded-full" style={{ background: c, borderBottom: dash ? `1px dashed ${c}` : undefined }} />
            <span className="text-slate-400">{l}</span>
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <svg width="12" height="12"><circle cx="6" cy="6" r="5" fill="none" stroke={C.pumpOn} strokeWidth="1.2" /><polygon points="6,3 9,8 3,8" fill={C.pumpOn} /></svg>
          <span className="text-slate-400">Pumpe aktiv</span>
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="12" height="12"><circle cx="6" cy="6" r="5" fill="none" stroke={C.pumpOff} strokeWidth="1.2" /><polygon points="6,3 9,8 3,8" fill={C.pumpOff} /></svg>
          <span className="text-slate-400">Pumpe aus</span>
        </span>
      </div>
    </div>
  );
}

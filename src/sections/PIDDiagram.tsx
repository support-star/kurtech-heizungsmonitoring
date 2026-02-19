import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, ZoomIn, ZoomOut, RotateCcw, Droplets } from 'lucide-react';
import type { HeatingData } from '@/types/heating';

/* ═══════════════════════════════════════════════════════════
   FARB-PALETTE
   ═══════════════════════════════════════════════════════════ */
const C = {
  bg: '#0c1017',
  panel: '#111820',
  border: '#1a2332',
  hotPipe: '#ef4444',
  hotGlow: '#ef444425',
  warmPipe: '#f97316',
  warmGlow: '#f9731625',
  coldPipe: '#3b82f6',
  coldGlow: '#3b82f625',
  coolPipe: '#06b6d4',
  coolGlow: '#06b6d425',
  geoPipe: '#22c55e',
  geoGlow: '#22c55e25',
  pumpOn: '#22c55e',
  pumpOff: '#475569',
  tankStroke: '#475569',
  tankFill: '#0f172a',
  text: '#94a3b8',
  bright: '#e2e8f0',
  dim: '#334155',
  accent: '#10b981',
  enclosure: '#3b82f680', // WP Einhausung
};

/* ═══════════════════════════════════════════════════════════
   SVG DEFS
   ═══════════════════════════════════════════════════════════ */
function Defs() {
  return (
    <defs>
      <linearGradient id="gTankHot" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ef4444" stopOpacity="0.25" />
        <stop offset="50%" stopColor="#ea580c" stopOpacity="0.08" />
        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.15" />
      </linearGradient>
      <linearGradient id="gTankCold" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.12" />
        <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.2" />
      </linearGradient>
      <linearGradient id="gWt" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#ef4444" stopOpacity="0.7" />
        <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.6" />
        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.7" />
      </linearGradient>
      <filter id="gl" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="3" result="b" />
        <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
      <style>{`
        @keyframes pulse{0%,100%{opacity:.5}50%{opacity:1}}
        .pp{animation:pulse 2s ease-in-out infinite}
        .mf{font-family:'JetBrains Mono','Fira Code',ui-monospace,monospace}
      `}</style>
    </defs>
  );
}

/* ═══════════════════════════════════════════════════════════
   PRIMITIVES
   ═══════════════════════════════════════════════════════════ */
function Pipe({ d, c, w = 3, dash, glow }: { d: string; c: string; w?: number; dash?: string; glow?: string }) {
  return <g>
    {glow && <path d={d} fill="none" stroke={glow} strokeWidth={w + 8} strokeLinecap="round" strokeLinejoin="round" />}
    <path d={d} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dash} />
  </g>;
}

function Flow({ path, c, dur = '3s', delay = '0s', r = 4 }: { path: string; c: string; dur?: string; delay?: string; r?: number }) {
  return <circle r={r} fill={c} opacity="0.85"><animateMotion dur={dur} repeatCount="indefinite" begin={delay} path={path} /></circle>;
}

function Pump({ x, y, id, on, onClick }: { x: number; y: number; id: string; on: boolean; onClick?: () => void }) {
  return <g transform={`translate(${x},${y})`} className="cursor-pointer" onClick={onClick}>
    {on && <circle r="18" fill={C.pumpOn} opacity="0.1" filter="url(#gl)" />}
    <circle r="13" fill={C.tankFill} stroke={on ? C.pumpOn : C.pumpOff} strokeWidth="2" />
    <polygon points="0,-6 6,4 -6,4" fill={on ? C.pumpOn : C.pumpOff} className={on ? 'pp' : ''} />
    <text y="24" textAnchor="middle" fill={on ? C.pumpOn : C.pumpOff} fontSize="8.5" fontWeight="700">{id}</text>
  </g>;
}

function Tank({ cx, y, w, h, label, vol, temps, grad, onClick }: {
  cx: number; y: number; w: number; h: number; label: string; vol: string;
  temps?: [string, string?, string?]; grad: string; onClick?: () => void;
}) {
  const lx = cx - w / 2;
  return <g className="cursor-pointer" onClick={onClick}>
    <rect x={lx} y={y} width={w} height={h} rx={w / 2} fill={`url(#${grad})`} stroke={C.tankStroke} strokeWidth="2" />
    {temps?.[0] && <><circle cx={lx + w + 4} cy={y + h * 0.17} r="2" fill={C.tankStroke} />
      <line x1={lx + w + 4} y1={y + h * 0.17} x2={lx + w + 14} y2={y + h * 0.17} stroke={C.dim} strokeWidth="1" />
      <T x={lx + w + 17} y={y + h * 0.17} v={temps[0]} c={C.hotPipe} /></>}
    {temps?.[1] && <><circle cx={lx + w + 4} cy={y + h * 0.5} r="2" fill={C.tankStroke} />
      <line x1={lx + w + 4} y1={y + h * 0.5} x2={lx + w + 14} y2={y + h * 0.5} stroke={C.dim} strokeWidth="1" />
      <T x={lx + w + 17} y={y + h * 0.5} v={temps[1]} c={C.warmPipe} /></>}
    {temps?.[2] && <><circle cx={lx + w + 4} cy={y + h * 0.83} r="2" fill={C.tankStroke} />
      <line x1={lx + w + 4} y1={y + h * 0.83} x2={lx + w + 14} y2={y + h * 0.83} stroke={C.dim} strokeWidth="1" />
      <T x={lx + w + 17} y={y + h * 0.83} v={temps[2]} c={C.coldPipe} /></>}
    <text x={cx} y={y - 6} textAnchor="middle" fill={C.bright} fontSize="9.5" fontWeight="600">{label}</text>
    <text x={cx} y={y - 17} textAnchor="middle" fill={C.dim} fontSize="7.5">{vol}</text>
  </g>;
}

function T({ x, y, v, c }: { x: number; y: number; v: string; c: string }) {
  return <g className="mf"><rect x={x} y={y - 7} width={36} height={14} rx="3" fill={C.panel} stroke={c} strokeWidth="0.7" strokeOpacity="0.5" />
    <text x={x + 18} y={y + 3.5} textAnchor="middle" fill={c} fontSize="9" fontWeight="700">{v}</text></g>;
}

function PT({ x, y, v, c }: { x: number; y: number; v: string; c: string }) {
  return <g className="mf"><rect x={x - 20} y={y - 8} width={40} height={16} rx="4" fill={C.bg} stroke={c} strokeWidth="1" strokeOpacity="0.4" />
    <text x={x} y={y + 3} textAnchor="middle" fill={c} fontSize="9.5" fontWeight="800">{v}</text></g>;
}

function L({ x, y, t }: { x: number; y: number; t: string }) {
  return <text x={x} y={y} fill={C.dim} fontSize="7.5" fontWeight="500">{t}</text>;
}

function V({ x, y, r = 0 }: { x: number; y: number; r?: number }) {
  return <g transform={`translate(${x},${y}) rotate(${r})`}>
    <polygon points="-5,-4 0,0 -5,4" fill="none" stroke={C.tankStroke} strokeWidth="1.2" />
    <polygon points="5,-4 0,0 5,4" fill="none" stroke={C.tankStroke} strokeWidth="1.2" />
  </g>;
}

function MAG({ x, y }: { x: number; y: number }) {
  return <g>
    <line x1={x} y1={y - 14} x2={x} y2={y - 6} stroke={C.dim} strokeWidth="1" />
    <ellipse cx={x} cy={y} rx="9" ry="11" fill={C.tankFill} stroke={C.dim} strokeWidth="1.2" />
    <text x={x} y={y + 3} textAnchor="middle" fill={C.dim} fontSize="5.5" fontWeight="600">MAG</text>
  </g>;
}

function Box({ x, y, w, h, title, sub, active, color, onClick }: {
  x: number; y: number; w: number; h: number;
  title: string; sub?: string; active?: boolean; color?: string; onClick?: () => void;
}) {
  const cl = color || C.accent;
  return <g className="cursor-pointer" onClick={onClick}>
    {active && <rect x={x - 2} y={y - 2} width={w + 4} height={h + 4} rx="6" fill={cl} opacity="0.06" filter="url(#gl)" />}
    <rect x={x} y={y} width={w} height={h} rx="4" fill={C.panel} stroke={active ? cl : C.border} strokeWidth={active ? 1.8 : 1.2} />
    <text x={x + w / 2} y={y + (sub ? h / 2 - 3 : h / 2 + 3)} textAnchor="middle" fill={C.bright} fontSize="9.5" fontWeight="600">{title}</text>
    {sub && <text x={x + w / 2} y={y + h / 2 + 8} textAnchor="middle" fill={C.dim} fontSize="7">{sub}</text>}
  </g>;
}

/** Fußbodenheizung Zickzack-Symbol */
function FBH({ x, y, label }: { x: number; y: number; label: string }) {
  return <g>
    <path d={`M${x - 15},${y} L${x - 8},${y - 8} L${x},${y} L${x + 8},${y - 8} L${x + 15},${y}`}
      fill="none" stroke={C.dim} strokeWidth="1.5" />
    <path d={`M${x - 12},${y + 4} L${x - 5},${y - 4} L${x + 3},${y + 4} L${x + 11},${y - 4} L${x + 18},${y + 4}`}
      fill="none" stroke={C.dim} strokeWidth="1.2" strokeDasharray="2,2" />
    <text x={x + 22} y={y - 2} fill={C.dim} fontSize="7">{label}</text>
  </g>;
}

/** 3-Wege-Mischer (Dreiwegemischventil) – DIN Symbol */
function Mischer({ x, y, rot = 0, on }: { x: number; y: number; rot?: number; on?: boolean }) {
  const cl = on ? C.pumpOn : C.pumpOff;
  return <g transform={`translate(${x},${y}) rotate(${rot})`}>
    {/* Zwei Dreiecke = Bowtie + dritter Anschluss */}
    <polygon points="-7,-6 0,0 -7,6" fill="none" stroke={cl} strokeWidth="1.5" />
    <polygon points="7,-6 0,0 7,6" fill="none" stroke={cl} strokeWidth="1.5" />
    {/* Bypass-Pfeil (3. Weg) */}
    <line x1="0" y1="0" x2="0" y2="-10" stroke={cl} strokeWidth="1.3" />
    <polygon points="-2.5,-10 0,-14 2.5,-10" fill={cl} />
    {/* M-Kreis (Stellantrieb) */}
    <circle cx="0" cy="-18" r="5" fill={C.tankFill} stroke={cl} strokeWidth="1" />
    <text x="0" y="-15.5" textAnchor="middle" fill={cl} fontSize="5.5" fontWeight="700">M</text>
  </g>;
}

/** Heizkreis-Abgang: VL-Pipe + Mischer + RL-Pipe + Temp-Labels */
function HKAbgang({ vlX, y, rlY, nr, vlTemp, rlTemp, on, dn }: {
  vlX: number; y: number; rlY?: number; nr: number; vlTemp: string; rlTemp: string; on?: boolean; dn: string;
}) {
  const rlX = vlX + 22;
  const topY = y - 68;
  const rlStart = rlY ?? y + 24;
  return <g>
    {/* VL hoch (aus VL-Balken) */}
    <line x1={vlX} y1={y} x2={vlX} y2={topY + 28} stroke={C.hotPipe} strokeWidth="1.8" />
    {/* Mischer auf VL-Leitung */}
    <Mischer x={vlX} y={topY + 20} rot={0} on={on} />
    {/* VL weiter hoch */}
    <line x1={vlX} y1={topY + 6} x2={vlX} y2={topY} stroke={C.hotPipe} strokeWidth="1.5" />
    {/* RL hoch (aus RL-Balken) */}
    <line x1={rlX} y1={rlStart} x2={rlX} y2={topY} stroke={C.coldPipe} strokeWidth="1.5" strokeDasharray="3,2" />
    {/* Temp VL */}
    <T x={vlX + 12} y={topY + 38} v={vlTemp} c={C.hotPipe} />
    {/* Temp RL */}
    <T x={rlX + 12} y={topY + 52} v={rlTemp} c={C.coldPipe} />
    {/* DN Label */}
    <L x={vlX - 3} y={y - 4} t={dn} />
    {/* HK Nummer */}
    <text x={vlX + 11} y={topY - 5} textAnchor="middle" fill={C.dim} fontSize="6.5" fontWeight="600">HK{nr}</text>
  </g>;
}

/** Unused - kept for reference */
// Dist component removed - replaced by inline Verteiler bars with HKAbgang

function Rgn({ x, y, t }: { x: number; y: number; t: string }) {
  return <text x={x} y={y} fill={C.dim} fontSize="10" fontWeight="700" letterSpacing="2.5" opacity="0.22">{t}</text>;
}

/* ═══════════════════════════════════════════════════════════
   DETAIL-PANEL
   ═══════════════════════════════════════════════════════════ */
interface CI { id: string; name: string; desc: string; status?: string; temp?: string; tempRet?: string; flow?: string; dn?: string; power?: string; }

function DetailPanel({ i, onClose }: { i: CI; onClose: () => void }) {
  const on = i.status === 'running';
  return <div className="absolute bottom-3 left-3 right-3 z-30 bg-[#0f1520]/95 backdrop-blur-xl border border-[#1e2736] rounded-xl p-3 shadow-2xl" onClick={e => e.stopPropagation()}>
    <div className="flex justify-between items-start mb-2">
      <div><h3 className="text-white font-bold text-sm">{i.name}</h3><p className="text-slate-400 text-xs">{i.desc}</p></div>
      <button onClick={onClose} className="text-slate-500 hover:text-white p-1"><X className="w-4 h-4" /></button>
    </div>
    <div className="flex flex-wrap gap-1.5 text-xs">
      <Ch l="ID" v={i.id} mono />
      <Ch l="Status" badge={<Badge className={`text-[10px] ${on ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>{on ? 'Laufend' : 'Bereit'}</Badge>} />
      {i.temp && <Ch l="VL" v={i.temp} c="text-orange-400" />}
      {i.tempRet && <Ch l="RL" v={i.tempRet} c="text-sky-400" />}
      {i.flow && <Ch l="Durchfluss" v={i.flow} c="text-emerald-400" />}
      {i.dn && <Ch l="DN" v={i.dn} />}
      {i.power && <Ch l="Leistung" v={i.power} c="text-amber-400" />}
    </div>
  </div>;
}

function Ch({ l, v, badge, c = 'text-slate-300', mono }: { l: string; v?: string; badge?: React.ReactNode; c?: string; mono?: boolean }) {
  return <div className="bg-[#0a0e14] rounded-md px-2.5 py-1 inline-flex items-center gap-1.5">
    <span className="text-[8px] text-slate-500 uppercase">{l}</span>
    {badge || <span className={`font-semibold text-xs ${c} ${mono ? 'font-mono' : ''}`}>{v}</span>}
  </div>;
}

/* ═══════════════════════════════════════════════════════════
   HAUPTKOMPONENTE
   ═══════════════════════════════════════════════════════════ */
export function PIDDiagram({ data }: { data: HeatingData | null }) {
  const [sel, setSel] = useState<CI | null>(null);
  const [flow, setFlow] = useState(true);
  const [zoom, setZoom] = useState(1);

  const on = data?.status === 'heizen';
  const s = (i: CI) => setSel(i);

  const vl = data?.vorlauftemperatur?.toFixed(0) ?? '--';
  const rl = data?.ruecklauftemperatur?.toFixed(0) ?? '--';
  const po = data?.puffer_oben?.toFixed(0) ?? '--';
  const pm = data?.puffer_mitte?.toFixed(0) ?? '--';
  const pu = data?.puffer_unten?.toFixed(0) ?? '--';
  const cop = data?.cop?.toFixed(1) ?? '--';
  const aus = data?.aussentemperatur?.toFixed(1) ?? '--';

  // Layout: Y-Achsen
  const VL = 280;   // ═══ VORLAUF ═══
  const RL = 370;   // ═══ RÜCKLAUF ═══

  return <div className="space-y-3">
    {/* Header */}
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-xl font-bold text-white">P&ID-Diagramm</h2>
        <p className="text-sm text-slate-400">② Hauptstation + Anschluss Satellitenhaus – Detail</p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setFlow(!flow)}
          className={`border-[#1e2736] text-xs ${flow ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-400'}`}>
          <Droplets className="w-3.5 h-3.5 mr-1" />{flow ? 'Strömung AN' : 'Strömung AUS'}
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

    {/* ═════════════ SVG ═════════════ */}
    <div className="relative overflow-auto rounded-xl border border-[#1e2736]" style={{ background: C.bg, maxHeight: 680 }}
      onClick={() => setSel(null)}>
      <div style={{ transform: `scale(${zoom})`, transformOrigin: '0 0' }}>
        <svg viewBox="0 0 1550 620" width={1550} height={620} style={{ display: 'block' }}>
          <Defs />
          {/* Grid */}
          <pattern id="gr" width="30" height="30" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.35" fill="#334155" opacity="0.1" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#gr)" />

          {/* Region Labels */}
          <Rgn x={40} y={48} t="QUELLEN" />
          <Rgn x={340} y={540} t="ERZEUGUNG" />
          <Rgn x={740} y={170} t="SPEICHER" />
          <Rgn x={940} y={210} t="VERTEILUNG" />
          <Rgn x={1230} y={170} t="KÄLTE" />

          {/* Trennlinie Heizung ┊ Kälte */}
          <line x1="1175" y1="50" x2="1175" y2="560" stroke={C.border} strokeWidth="1" strokeDasharray="6,4" opacity="0.35" />

          {/* ════════════════════════════════════════
               ABLUFT-WP AUF DACH (oben Mitte)
               ════════════════════════════════════════ */}
          <Box x={390} y={55} w={130} h={45} title="Abluft-WP" sub="auf Dach · Rohrbegl." active={!!on} color={C.warmPipe}
            onClick={() => s({ id: 'ABWP', name: 'Abluft-Wärmepumpe', desc: 'Auf Dach mit Rohrbegleitheizung', status: on ? 'running' : 'standby', temp: '40°C', tempRet: '35°C' })} />
          {/* Rohrbegleitheizung-Zickzack */}
          <path d="M528,68 L536,60 L544,68 L552,60 L560,68" fill="none" stroke="#fb923c" strokeWidth="1" strokeDasharray="2,1" opacity="0.5" />

          {/* PVT-Solar (oben links) */}
          <Box x={155} y={55} w={105} h={45} title="PVT-Solar" sub="6,2 kW th." active={!!on} color={C.warmPipe}
            onClick={() => s({ id: 'PVT', name: 'PVT-Solarkollektoren', desc: 'Auf Dach, 6,2 kW thermisch', status: 'running', temp: `${aus}°C`, power: '6,2 kW' })} />
          <circle cx="208" cy={46} r="7" fill="none" stroke="#fbbf24" strokeWidth="1.2" opacity="0.35" />
          <circle cx="208" cy={46} r="2.5" fill="#fbbf24" opacity="0.35" />

          {/* Erdwärmefeld (links) */}
          <Box x={20} y={VL - 20} w={95} h={42} title="Erdwärme" sub="FVU Nahwärme" active={!!on} color={C.geoPipe}
            onClick={() => s({ id: 'ERD', name: 'Erdwärmefeld', desc: 'Zuleitung FVU Nahwärme', status: on ? 'running' : 'standby', flow: '42,1 m³/h', dn: 'DN 80' })} />

          {/* ════════════════════════════════════════
               ROHRE QUELLEN → PUFFER PVT
               ════════════════════════════════════════ */}

          {/* PVT → runter zum Puffer */}
          <Pipe d={`M207,100 L207,155 L220,155 L220,${VL - 45}`} c={C.warmPipe} glow={C.warmGlow} />
          <L x={212} y={140} t="DN 65" />

          {/* Abluft-WP → runter → Puffer PVT (durch WP-Einhausung) */}
          <Pipe d={`M455,100 L455,140 L250,140 L250,${VL - 45}`} c={C.warmPipe} glow={C.warmGlow} />
          <Pump x={455} y={125} id="P02" on={!!on}
            onClick={() => s({ id: 'P02', name: 'Pumpe P02', desc: 'Umwälzpumpe Abluft-WP', status: on ? 'running' : 'off', flow: '15,2 m³/h', dn: 'DN 65' })} />
          <PT x={470} y={100} v="35°C" c={C.warmPipe} />
          <PT x={525} y={100} v="40°C" c={C.hotPipe} />

          {/* Erdwärme → P01 → WT (VL) */}
          <Pipe d={`M115,${VL} L140,${VL}`} c={C.geoPipe} glow={C.geoGlow} w={3.5} />
          <Pump x={158} y={VL} id="P01" on={!!on}
            onClick={() => s({ id: 'P01', name: 'Pumpe P01', desc: 'Umwälzpumpe Erdwärme', status: on ? 'running' : 'off', flow: '42,1 m³/h', dn: 'DN 80' })} />
          <Pipe d={`M172,${VL} L350,${VL}`} c={C.geoPipe} glow={C.geoGlow} w={3.5} />
          <L x={178} y={VL - 16} t="DN 80" />

          {/* Erdwärme ← RL */}
          <Pipe d={`M350,${RL} L115,${RL} L65,${RL} L65,${VL + 20}`} c={C.geoPipe} w={2.5} dash="5,3" />

          {/* Auslegungsdaten Erdwärme */}
          <g transform={`translate(120,${RL + 22})`}>
            <rect width="100" height="42" rx="3" fill={C.panel} stroke={C.border} strokeWidth="0.7" opacity="0.7" />
            <text x="50" y="10" textAnchor="middle" fill={C.dim} fontSize="6.5" fontWeight="600">Auslegung Erdwärme</text>
            <text x="50" y="20" textAnchor="middle" fill={C.text} fontSize="6">ΔT 3K · Glycol 30%</text>
            <text x="50" y="29" textAnchor="middle" fill={C.text} fontSize="6">42,1 m³/h · DN 80</text>
            <text x="50" y="38" textAnchor="middle" fill={C.text} fontSize="6">SV 3,5 bar · 400V</text>
          </g>

          {/* ════════════════════════════════════════
               PUFFER PVT  (2000 L)
               ════════════════════════════════════════ */}
          <Tank cx={235} y={VL - 45} w={48} h={RL - VL + 90} label="Puffer PVT" vol="2000 L"
            temps={[`${po}°`, `${pm}°`, `${pu}°`]} grad="gTankHot"
            onClick={() => s({ id: 'PS1', name: 'Pufferspeicher PVT', desc: 'Hydr. Trennung, 2000 L', status: on ? 'running' : 'standby', temp: `${po}°C`, power: '2000 L', dn: 'DN 100' })} />

          {/* Puffer PVT → P03 → WT  (VL) */}
          <Pipe d={`M259,${VL} L312,${VL}`} c={C.warmPipe} glow={C.warmGlow} />
          <Pump x={330} y={VL} id="P03" on={!!on}
            onClick={() => s({ id: 'P03', name: 'Pumpe P03', desc: 'Umwälzpumpe Puffer PVT', status: on ? 'running' : 'off', flow: '28,5 m³/h', dn: 'DN 100' })} />
          <Pipe d={`M344,${VL} L352,${VL}`} c={C.warmPipe} glow={C.warmGlow} />
          <L x={300} y={VL - 16} t="DN 100" />

          {/* Puffer PVT ← WT (RL) */}
          <Pipe d={`M259,${RL} L352,${RL}`} c={C.coldPipe} w={2.5} dash="5,3" />

          {/* ════════════════════════════════════════
               WÄRMETAUSCHER  (47 kW) – Halbkreis
               ════════════════════════════════════════ */}
          <g className="cursor-pointer" onClick={() => s({ id: 'WT1', name: 'Wärmetauscher', desc: 'Plattenwärmetauscher 47 kW', status: on ? 'running' : 'standby', power: '47 kW', dn: 'DN 80' })}>
            {/* Halbkreis-Symbol (DIN-Norm) */}
            <path d={`M355,${VL - 5} A45,45 0 0,1 355,${RL + 5}`} fill="url(#gWt)" stroke={C.tankStroke} strokeWidth="2" />
            {/* Platten-Linien */}
            {[0, 1, 2, 3].map(i => <line key={i} x1={358} y1={VL + 10 + i * 22} x2={390} y2={VL + 10 + i * 22} stroke="rgba(255,255,255,0.12)" strokeWidth="0.7" />)}
          </g>
          <text x={380} y={RL + 28} textAnchor="middle" fill={C.dim} fontSize="7.5">WT 47 kW</text>
          <L x={362} y={VL - 12} t="DN 80" />

          {/* WT → WP (VL) */}
          <Pipe d={`M400,${VL} L465,${VL}`} c={C.warmPipe} glow={C.warmGlow} w={3.5} />
          {/* WT ← WP (RL) */}
          <Pipe d={`M400,${RL} L465,${RL}`} c={C.coldPipe} glow={C.coldGlow} w={2.5} dash="5,3" />

          {/* ════════════════════════════════════════
               WP-EINHAUSUNG (blaue gestrichelte Box)
               ════════════════════════════════════════ */}
          <rect x={460} y={VL - 55} width={180} height={RL - VL + 110} rx="5"
            fill="none" stroke={C.enclosure} strokeWidth="1.5" strokeDasharray="8,4" />
          <text x={550} y={VL - 62} textAnchor="middle" fill={C.enclosure} fontSize="7.5" fontWeight="600">Maschinenraum WP</text>

          {/* ════════════════════════════════════════
               WÄRMEPUMPE  (175 kW)
               ════════════════════════════════════════ */}
          <g className="cursor-pointer" onClick={() => s({ id: 'WP1', name: 'Wärmepumpe', desc: '175 kW th. / 38,9 kW el.', status: on ? 'running' : 'standby', temp: `${vl}°C`, tempRet: `${rl}°C`, power: '175 kW', dn: 'DN 100' })}>
            {on && <rect x={473} y={VL - 28} width={114} height={RL - VL + 56} rx="7" fill={C.hotPipe} opacity="0.04" filter="url(#gl)" />}
            <rect x={475} y={VL - 26} width={110} height={RL - VL + 52} rx="5"
              fill={C.panel} stroke={on ? C.hotPipe : C.border} strokeWidth={on ? 2 : 1.2} />
            <text x={530} y={VL - 8} textAnchor="middle" fill={C.bright} fontSize="10.5" fontWeight="700">Wärmepumpe</text>
            <text x={530} y={VL + 5} textAnchor="middle" fill={C.dim} fontSize="7.5">175 kW th · 38,9 kW el</text>
            {/* COP */}
            <rect x={500} y={VL + 18} width={60} height={26} rx="4" fill={C.bg} stroke={C.border} strokeWidth="0.7" />
            <text x={530} y={VL + 28} textAnchor="middle" fill={C.dim} fontSize="7">COP</text>
            <text x={530} y={VL + 40} textAnchor="middle" fill={C.accent} fontSize="13" fontWeight="800" className="mf">{cop}</text>
            {/* Status */}
            <circle cx={490} cy={RL + 12} r={3.5} fill={on ? C.pumpOn : C.pumpOff} className={on ? 'pp' : ''} />
            <text x={500} y={RL + 15} fill={on ? C.pumpOn : C.pumpOff} fontSize="8" fontWeight="600">{on ? 'AKTIV' : 'STANDBY'}</text>
            <text x={530} y={RL + 25} textAnchor="middle" fill={C.dim} fontSize="6.5">400V · SV 3,5 bar</text>
          </g>
          <L x={470} y={VL - 12} t="DN 100" />

          {/* WP → P04 (VL) */}
          <Pipe d={`M585,${VL} L640,${VL}`} c={C.hotPipe} glow={C.hotGlow} w={4} />
          <Pump x={660} y={VL} id="P04" on={!!on}
            onClick={() => s({ id: 'P04', name: 'Pumpe P04', desc: 'Umwälzpumpe Heizung', status: on ? 'running' : 'off', flow: '18,3 m³/h', dn: 'DN 100' })} />
          <Pipe d={`M674,${VL} L720,${VL}`} c={C.hotPipe} glow={C.hotGlow} w={4} />
          <PT x={700} y={VL - 20} v={`${vl}°`} c={C.hotPipe} />
          <L x={640} y={VL - 16} t="DN 100" />

          {/* WP ← RL */}
          <Pipe d={`M585,${RL} L720,${RL}`} c={C.coldPipe} glow={C.coldGlow} w={3} dash="5,3" />
          <PT x={700} y={RL + 20} v={`${rl}°`} c={C.coldPipe} />

          {/* ════════════════════════════════════════
               PUFFER HEIZUNG  (1500 L)
               ════════════════════════════════════════ */}
          <Tank cx={750} y={VL - 45} w={44} h={RL - VL + 90} label="Puffer HZ" vol="1500 L"
            temps={[`${vl}°`, undefined, `${rl}°`]} grad="gTankHot"
            onClick={() => s({ id: 'PS2', name: 'Pufferspeicher HZ', desc: '1500 L', status: on ? 'running' : 'standby', temp: `${vl}°C`, tempRet: `${rl}°C`, power: '1500 L', dn: 'DN 80' })} />
          <MAG x={788} y={VL + 35} />

          {/* Puffer HZ → P05 → Verteiler (VL) */}
          <Pipe d={`M772,${VL} L818,${VL}`} c={C.hotPipe} glow={C.hotGlow} w={3.5} />
          <Pump x={835} y={VL} id="P05" on={!!on}
            onClick={() => s({ id: 'P05', name: 'Pumpe P05', desc: 'Umwälzpumpe Verteiler', status: on ? 'running' : 'off', flow: '22,1 m³/h', dn: 'DN 65' })} />
          <Pipe d={`M849,${VL} L895,${VL}`} c={C.hotPipe} glow={C.hotGlow} w={3.5} />
          <L x={850} y={VL - 16} t="DN 65" />

          {/* Puffer HZ ← Verteiler (RL) */}
          <Pipe d={`M772,${RL} L895,${RL}`} c={C.coldPipe} glow={C.coldGlow} w={2.5} dash="5,3" />
          <L x={850} y={RL + 14} t="DN 55" />

          {/* ════════════════════════════════════════
               VERTEILER HEIZUNG (mit Mischern + Temps)
               ════════════════════════════════════════ */}
          {/* Verteiler-Balken */}
          <g className="cursor-pointer" onClick={() => s({ id: 'VH', name: 'Verteiler Heizung', desc: 'Heizungsverteiler mit 4 Heizkreisen', status: on ? 'running' : 'standby', temp: `${vl}°C`, tempRet: `${rl}°C`, dn: 'DN 56/55' })}>
            <rect x={895} y={VL + 20} width={180} height={18} rx="3" fill={C.panel} stroke={on ? C.hotPipe : C.border} strokeWidth={on ? 2 : 1.2} />
            <text x={985} y={VL + 33} textAnchor="middle" fill={C.bright} fontSize="9" fontWeight="700" letterSpacing="0.5">VERTEILER HEIZUNG</text>
            {/* RL-Balken darunter */}
            <rect x={895} y={VL + 44} width={180} height={14} rx="3" fill={C.panel} stroke={on ? C.coldPipe : C.border} strokeWidth={on ? 1.5 : 1} strokeDasharray="4,2" />
            <text x={985} y={VL + 54} textAnchor="middle" fill={C.coldPipe} fontSize="7" opacity="0.6">Rücklauf</text>
          </g>

          {/* VL/RL Zuleitungen */}
          <Pipe d={`M895,${VL} L895,${VL + 20}`} c={C.hotPipe} w={3} />
          <Pipe d={`M895,${RL} L895,${VL + 58}`} c={C.coldPipe} w={2.5} dash="4,2" />

          {/* ── Heizkreis 1: FBH EG ── */}
          <HKAbgang vlX={920} y={VL + 20} rlY={VL + 58} nr={1} vlTemp={`${vl}°`} rlTemp={`${rl}°`} on={on} dn="DN 56" />
          <FBH x={930} y={VL - 62} label="FBH EG" />

          {/* ── Heizkreis 2: FBH OG ── */}
          <HKAbgang vlX={965} y={VL + 20} rlY={VL + 58} nr={2} vlTemp={`${vl}°`} rlTemp={`${rl}°`} on={on} dn="DN 56" />
          <FBH x={975} y={VL - 62} label="FBH OG" />

          {/* ── Heizkreis 3: Stockwerke ── */}
          <HKAbgang vlX={1010} y={VL + 20} rlY={VL + 58} nr={3} vlTemp={`${vl}°`} rlTemp={`${rl}°`} on={on} dn="DN 56" />
          <text x={1021} y={VL - 54} textAnchor="middle" fill={C.dim} fontSize="6">Anschluss</text>
          <text x={1021} y={VL - 46} textAnchor="middle" fill={C.dim} fontSize="6">weitere SW</text>

          {/* ── Heizkreis 4: Satellitenhaus E ── */}
          <HKAbgang vlX={1055} y={VL + 20} rlY={VL + 58} nr={4} vlTemp={`${vl}°`} rlTemp={`${rl}°`} on={on} dn="DN 56" />
          <text x={1066} y={VL - 54} textAnchor="middle" fill={C.dim} fontSize="6">Sat.-Haus E</text>
          <text x={1066} y={VL - 46} textAnchor="middle" fill={C.dim} fontSize="6">Heizung</text>

          {/* Druckhalte-/Nachspeise */}
          <g transform={`translate(895,${RL + 22})`}>
            <rect width="140" height="24" rx="3" fill={C.panel} stroke={C.border} strokeWidth="0.7" strokeDasharray="4,2" />
            <text x="70" y="9" textAnchor="middle" fill={C.dim} fontSize="6.5">Druckhalte-/Entgasungs-</text>
            <text x="70" y="19" textAnchor="middle" fill={C.dim} fontSize="6.5">und Nachspeisestation</text>
          </g>

          {/* Anschluss P04 / Kapselfeed */}
          <g transform={`translate(895,${RL + 56})`}>
            <rect width="100" height="16" rx="2" fill={C.panel} stroke={C.border} strokeWidth="0.5" />
            <text x="50" y="11" textAnchor="middle" fill={C.dim} fontSize="6">Kapselfeed · Anschluss P04</text>
          </g>

          {/* ════════════════════════════════════════
               KÄLTE-BEREICH
               ════════════════════════════════════════ */}

          {/* Puffer Kälte (1000L) */}
          <Tank cx={1250} y={VL - 30} w={42} h={RL - VL + 70} label="Puffer Kälte" vol="1000 L"
            temps={['37°', undefined, '18°']} grad="gTankCold"
            onClick={() => s({ id: 'PS3', name: 'Pufferspeicher Kälte', desc: '1000 L', status: 'standby', temp: '37°C', tempRet: '18°C', power: '1000 L', dn: 'DN 80' })} />

          {/* Pendelleitung DN 20 */}
          <Pipe d={`M1224,${VL} L1200,${VL} L1200,${RL + 80}`} c={C.coolPipe} w={1} dash="3,2" />
          <text x={1194} y={VL + 50} fill={C.coolPipe} fontSize="5.5" opacity="0.4"
            transform={`rotate(-90,1194,${VL + 50})`}>Pendelltg. DN 20</text>

          {/* Puffer Kälte → P07 → Verteiler K (VL) */}
          <Pipe d={`M1271,${VL + 5} L1320,${VL + 5}`} c={C.coolPipe} w={2.5} />
          <Pump x={1338} y={VL + 5} id="P07" on={false}
            onClick={() => s({ id: 'P07', name: 'Pumpe P07', desc: 'Umwälzpumpe Kältepuffer', status: 'standby', flow: '8,7 m³/h', dn: 'DN 65' })} />
          <Pipe d={`M1352,${VL + 5} L1385,${VL + 5} L1385,${VL + 30}`} c={C.coolPipe} w={2.5} />
          <L x={1300} y={VL - 8} t="DN 65" />
          <V x={1305} y={VL + 5} />

          {/* Rücklauf Kälte */}
          <Pipe d={`M1385,${RL + 5} L1385,${RL + 40} L1271,${RL + 40} L1271,${RL}`} c={C.coolPipe} w={2} dash="4,3" />

          {/* P06 */}
          <Pump x={1250} y={RL + 40} id="P06" on={false}
            onClick={() => s({ id: 'P06', name: 'Pumpe P06', desc: 'Umwälzpumpe Kühlung', status: 'standby', flow: '12,4 m³/h', dn: 'DN 80' })} />

          {/* Verteiler Kühlung */}
          <g className="cursor-pointer" onClick={() => s({ id: 'VK', name: 'Verteiler Kühlung', desc: 'Kühlverteiler mit 3 Kreisen', status: 'standby', temp: '37°C', tempRet: '18°C', dn: 'DN 65' })}>
            <rect x={1385} y={VL + 30} width={130} height={16} rx="3" fill={C.panel} stroke={C.coolPipe} strokeWidth="1.2" strokeOpacity="0.6" />
            <text x={1450} y={VL + 41} textAnchor="middle" fill={C.bright} fontSize="8.5" fontWeight="700" letterSpacing="0.5">VERT. KÜHLUNG</text>
            <rect x={1385} y={VL + 50} width={130} height={12} rx="3" fill={C.panel} stroke={C.coolPipe} strokeWidth="0.8" strokeDasharray="4,2" strokeOpacity="0.4" />
            <text x={1450} y={VL + 59} textAnchor="middle" fill={C.coolPipe} fontSize="6" opacity="0.5">Rücklauf</text>
          </g>

          {/* Kälte-Abgänge mit Mischern */}
          {/* KK1: FBH Kühlung */}
          <HKAbgang vlX={1405} y={VL + 30} rlY={VL + 62} nr={1} vlTemp="37°" rlTemp="18°" on={false} dn="DN 65" />
          <FBH x={1415} y={VL - 32} label="FBH Kühl." />

          {/* KK2: Sat.E Kühlung */}
          <HKAbgang vlX={1450} y={VL + 30} rlY={VL + 62} nr={2} vlTemp="37°" rlTemp="18°" on={false} dn="DN 65" />
          <text x={1461} y={VL - 24} textAnchor="middle" fill={C.dim} fontSize="6">Sat.E</text>
          <text x={1461} y={VL - 16} textAnchor="middle" fill={C.dim} fontSize="6">Kühlung</text>

          {/* KK3: Reserve */}
          <HKAbgang vlX={1495} y={VL + 30} rlY={VL + 62} nr={3} vlTemp="37°" rlTemp="18°" on={false} dn="DN 63" />
          <text x={1506} y={VL - 24} textAnchor="middle" fill={C.dim} fontSize="6">Reserve</text>

          {/* MAG Kälte */}
          <MAG x={1420} y={RL + 40} />

          {/* ════════════════════════════════════════
               ANIMIERTE STRÖMUNG
               ════════════════════════════════════════ */}
          {flow && on && <g>
            {/* Erdwärme → WT */}
            <Flow path={`M115,${VL} L350,${VL}`} c={C.geoPipe} dur="2.5s" />
            <Flow path={`M115,${VL} L350,${VL}`} c={C.geoPipe} dur="2.5s" delay="1.2s" />
            {/* PVT → Puffer */}
            <Flow path={`M207,100 L207,155 L220,155 L220,${VL - 45}`} c={C.warmPipe} dur="2s" />
            {/* Abluft → Puffer */}
            <Flow path={`M455,100 L455,140 L250,140 L250,${VL - 45}`} c={C.warmPipe} dur="2.5s" />
            {/* Puffer PVT → WT */}
            <Flow path={`M259,${VL} L355,${VL}`} c={C.warmPipe} dur="1.5s" />
            {/* WT → WP */}
            <Flow path={`M400,${VL} L465,${VL}`} c={C.warmPipe} dur="1.2s" />
            <Flow path={`M400,${VL} L465,${VL}`} c={C.warmPipe} dur="1.2s" delay="0.6s" />
            {/* WP → Puffer HZ (VL) */}
            <Flow path={`M585,${VL} L720,${VL}`} c={C.hotPipe} dur="2s" r={5} />
            <Flow path={`M585,${VL} L720,${VL}`} c={C.hotPipe} dur="2s" delay="1s" r={5} />
            {/* Puffer HZ → Verteiler */}
            <Flow path={`M772,${VL} L895,${VL}`} c={C.hotPipe} dur="1.8s" r={4} />
            {/* Rücklauf WP */}
            <Flow path={`M720,${RL} L585,${RL}`} c={C.coldPipe} dur="2.5s" r={4} />
            {/* RL Erdwärme */}
            <Flow path={`M350,${RL} L115,${RL}`} c={C.geoPipe} dur="2.5s" r={3} />
          </g>}

          {/* Titel */}
          <text x="775" y="598" textAnchor="middle" fill={C.dim} fontSize="8.5">
            ② Hauptstation + Anschluss an Satellitenhaus – Detail · Darmstadt 2026
          </text>
        </svg>
      </div>

      {sel && <DetailPanel i={sel} onClose={() => setSel(null)} />}
    </div>

    {/* Legende */}
    <div className="flex flex-wrap items-center gap-4 px-3 py-2 bg-[#111620]/50 rounded-lg border border-[#1e2736] text-[10px]">
      <span className="text-slate-500 font-medium text-[11px]">Legende</span>
      {[
        [C.hotPipe, 'Vorlauf (heiß)'], [C.coldPipe, 'Rücklauf (kalt)'], [C.geoPipe, 'Erdwärme'],
        [C.warmPipe, 'Quelle (warm)'], [C.coolPipe, 'Kältekreis'],
      ].map(([c, l]) => <span key={l} className="flex items-center gap-1.5">
        <span className="w-5 h-0.5 rounded-full" style={{ background: c }} /><span className="text-slate-400">{l}</span>
      </span>)}
      <span className="flex items-center gap-1.5">
        <svg width="12" height="12"><circle cx="6" cy="6" r="5" fill="none" stroke={C.pumpOn} strokeWidth="1.2" /><polygon points="6,3 9,8 3,8" fill={C.pumpOn} /></svg>
        <span className="text-slate-400">Pumpe aktiv</span>
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-5 h-0.5 rounded-full border-b border-dashed" style={{ borderColor: C.enclosure }} />
        <span className="text-slate-400">Einhausung</span>
      </span>
    </div>
  </div>;
}

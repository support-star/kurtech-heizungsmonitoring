import { useState, useRef, useCallback, useEffect, createContext, useContext } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, ZoomIn, ZoomOut, RotateCcw, Droplets, Pencil, Copy, Check, MousePointer, Trash2 } from 'lucide-react';
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
  pumpOff: '#ef4444',
  pumpOnGlow: '#22c55e20',
  pumpOffGlow: '#ef444418',
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
   EDIT MODE – Drag & Drop für alle Elemente
   ═══════════════════════════════════════════════════════════ */
interface EditCtx {
  active: boolean;
  selected: string | null;
  select: (id: string) => void;
  offsets: Record<string, { dx: number; dy: number }>;
  startDrag: (id: string, e: React.PointerEvent) => void;
}
const EditContext = createContext<EditCtx>({
  active: false, selected: null, select: () => {}, offsets: {}, startDrag: () => {},
});

/** Editable wrapper – umhüllt jede Komponente. Normal: passthrough. Edit: draggable. */
function E({ id, children }: { id: string; children: React.ReactNode }) {
  const { active, selected, select, offsets, startDrag } = useContext(EditContext);
  const o = offsets[id];
  const isSel = selected === id;
  return <g
    transform={o ? `translate(${o.dx},${o.dy})` : undefined}
    style={{ cursor: active ? 'move' : undefined }}
    onPointerDown={active ? (e) => { e.stopPropagation(); select(id); startDrag(id, e); } : undefined}
  >
    {active && isSel && <>
      {/* Selection highlight ring */}
      <circle cx="0" cy="0" r="16" fill="#fbbf24" fillOpacity="0.06" stroke="#fbbf24" strokeWidth="0.8" strokeDasharray="3,2" />
    </>}
    {children}
  </g>;
}

/* ═══════════════════════════════════════════════════════════
   PRIMITIVES
   ═══════════════════════════════════════════════════════════ */
function Pipe({ d, c, w = 2, dash, glow }: { d: string; c: string; w?: number; dash?: string; glow?: string }) {
  return <g>
    {glow && <path d={d} fill="none" stroke={glow} strokeWidth={w + 8} strokeLinecap="round" strokeLinejoin="round" />}
    <path d={d} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dash} />
  </g>;
}

function Flow({ path, c, dur = '3s', delay = '0s', r = 2.5 }: { path: string; c: string; dur?: string; delay?: string; r?: number }) {
  return <circle r={r} fill={c} opacity="0.85"><animateMotion dur={dur} repeatCount="indefinite" begin={delay} path={path} /></circle>;
}

function Pump({ x, y, id, on, onClick }: { x: number; y: number; id: string; on: boolean; onClick?: () => void }) {
  const cl = on ? C.pumpOn : C.pumpOff;
  const gw = on ? C.pumpOnGlow : C.pumpOffGlow;
  return <g transform={`translate(${x},${y})`} className="cursor-pointer" onClick={onClick}>
    <circle r="11" fill={gw} />
    <circle r="8" fill={C.tankFill} stroke={cl} strokeWidth="1.2" />
    <polygon points="0,-3.5 3.5,2.5 -3.5,2.5" fill={cl} className={on ? 'pp' : ''} />
    <text y="14" textAnchor="middle" fill={cl} fontSize="4" fontWeight="700">{id}</text>
  </g>;
}

function Tank({ cx, y, w, h, label, vol, temps, grad, onClick }: {
  cx: number; y: number; w: number; h: number; label: string; vol: string;
  temps?: [string, string?, string?]; grad: string; onClick?: () => void;
}) {
  const lx = cx - w / 2;
  return <g className="cursor-pointer" onClick={onClick}>
    <rect x={lx} y={y} width={w} height={h} rx={w / 2} fill={`url(#${grad})`} stroke={C.tankStroke} strokeWidth="1.2" />
    {temps?.[0] && <><circle cx={lx + w + 4} cy={y + h * 0.17} r="1.2" fill={C.tankStroke} />
      <line x1={lx + w + 4} y1={y + h * 0.17} x2={lx + w + 14} y2={y + h * 0.17} stroke={C.dim} strokeWidth="0.6" />
      <T x={lx + w + 17} y={y + h * 0.17} v={temps[0]} c={C.hotPipe} /></>}
    {temps?.[1] && <><circle cx={lx + w + 4} cy={y + h * 0.5} r="1.2" fill={C.tankStroke} />
      <line x1={lx + w + 4} y1={y + h * 0.5} x2={lx + w + 14} y2={y + h * 0.5} stroke={C.dim} strokeWidth="0.6" />
      <T x={lx + w + 17} y={y + h * 0.5} v={temps[1]} c={C.warmPipe} /></>}
    {temps?.[2] && <><circle cx={lx + w + 4} cy={y + h * 0.83} r="1.2" fill={C.tankStroke} />
      <line x1={lx + w + 4} y1={y + h * 0.83} x2={lx + w + 14} y2={y + h * 0.83} stroke={C.dim} strokeWidth="0.6" />
      <T x={lx + w + 17} y={y + h * 0.83} v={temps[2]} c={C.coldPipe} /></>}
    <text x={cx} y={y - 6} textAnchor="middle" fill={C.bright} fontSize="5" fontWeight="600">{label}</text>
    <text x={cx} y={y - 17} textAnchor="middle" fill={C.dim} fontSize="4">{vol}</text>
  </g>;
}

function T({ x, y, v, c }: { x: number; y: number; v: string; c: string }) {
  return <g>
    <rect x={x} y={y - 4.5} width={20} height={9} rx="1.5" fill={C.bg} fillOpacity="0.85" stroke={c} strokeWidth="0.3" strokeOpacity="0.35" />
    <text x={x + 10} y={y + 2} textAnchor="middle" fill={c} fontSize="4.5" fontWeight="600" fontFamily="monospace">{v}</text>
  </g>;
}

function PT({ x, y, v, c }: { x: number; y: number; v: string; c: string }) {
  return <g>
    <rect x={x - 11} y={y - 5} width={22} height={10} rx="2" fill={C.bg} fillOpacity="0.9" stroke={c} strokeWidth="0.35" strokeOpacity="0.4" />
    <text x={x} y={y + 2.5} textAnchor="middle" fill={c} fontSize="5" fontWeight="700" fontFamily="monospace">{v}</text>
  </g>;
}

function L({ x, y, t }: { x: number; y: number; t: string }) {
  return <text x={x} y={y} fill={C.dim} fontSize="4" fontWeight="500">{t}</text>;
}

function V({ x, y, r = 0 }: { x: number; y: number; r?: number }) {
  return <g transform={`translate(${x},${y}) rotate(${r})`}>
    <polygon points="-3,-2.5 0,0 -3,2.5" fill="none" stroke={C.tankStroke} strokeWidth="0.7" />
    <polygon points="3,-2.5 0,0 3,2.5" fill="none" stroke={C.tankStroke} strokeWidth="0.7" />
  </g>;
}

/** Rückschlagventil (Check Valve) – DIN: Dreieck + Sperrlinie */
function RV({ x, y, rot = 0 }: { x: number; y: number; rot?: number }) {
  return <g transform={`translate(${x},${y}) rotate(${rot})`}>
    <polygon points="-2.5,-3 -2.5,3 2.5,0" fill="none" stroke={C.tankStroke} strokeWidth="0.7" />
    <line x1="2.5" y1="-3" x2="2.5" y2="3" stroke={C.tankStroke} strokeWidth="0.8" />
  </g>;
}

/** Sicherheitsventil (Safety Valve) – DIN */
function SV({ x, y, label = 'SV' }: { x: number; y: number; label?: string }) {
  return <g>
    <line x1={x} y1={y - 5} x2={x} y2={y - 1} stroke={C.dim} strokeWidth="0.6" />
    <polygon points={`${x - 3},${y - 1} ${x + 3},${y - 1} ${x},${y + 4}`} fill="none" stroke="#f59e0b" strokeWidth="0.7" />
    <line x1={x - 2.5} y1={y + 5} x2={x + 2.5} y2={y + 5} stroke="#f59e0b" strokeWidth="0.6" />
    <text x={x} y={y + 10} textAnchor="middle" fill="#f59e0b" fontSize="3" fontWeight="600">{label}</text>
  </g>;
}

/** Überströmventil zwischen VL und RL */
function USV({ x, y1v, y2r }: { x: number; y1v: number; y2r: number }) {
  const mid = (y1v + y2r) / 2;
  return <g>
    <line x1={x} y1={y1v} x2={x} y2={y2r} stroke={C.dim} strokeWidth="0.6" strokeDasharray="3,2" />
    <V x={x} y={mid} r={90} />
    <text x={x + 8} y={mid + 3} fill={C.dim} fontSize="2.5">ÜSV</text>
  </g>;
}

/** Temperaturfühler-Symbol (kleiner Kreis mit T) */
function TF({ x, y, c = C.dim }: { x: number; y: number; c?: string }) {
  return <g>
    <circle cx={x} cy={y} r="2.5" fill={C.tankFill} stroke={c} strokeWidth="0.5" />
    <text x={x} y={y + 2.5} textAnchor="middle" fill={c} fontSize="3" fontWeight="700">T</text>
  </g>;
}

function MAG({ x, y }: { x: number; y: number }) {
  return <g>
    <line x1={x} y1={y - 9} x2={x} y2={y - 4} stroke={C.dim} strokeWidth="0.6" />
    <ellipse cx={x} cy={y} rx="5.5" ry="7" fill={C.tankFill} stroke={C.dim} strokeWidth="0.7" />
    <text x={x} y={y + 3} textAnchor="middle" fill={C.dim} fontSize="3" fontWeight="600">MAG</text>
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
    <text x={x + w / 2} y={y + (sub ? h / 2 - 2 : h / 2 + 2)} textAnchor="middle" fill={C.bright} fontSize="5" fontWeight="600">{title}</text>
    {sub && <text x={x + w / 2} y={y + h / 2 + 5} textAnchor="middle" fill={C.dim} fontSize="3.5">{sub}</text>}
  </g>;
}

/** Fußbodenheizung Zickzack-Symbol */
function FBH({ x, y, label }: { x: number; y: number; label: string }) {
  return <g>
    <path d={`M${x - 9},${y} L${x - 5},${y - 5} L${x},${y} L${x + 5},${y - 5} L${x + 9},${y}`}
      fill="none" stroke={C.dim} strokeWidth="0.8" />
    <path d={`M${x - 7},${y + 3} L${x - 3},${y - 3} L${x + 2},${y + 3} L${x + 7},${y - 3} L${x + 11},${y + 3}`}
      fill="none" stroke={C.dim} strokeWidth="0.7" strokeDasharray="2,2" />
    <text x={x + 13} y={y - 1} fill={C.dim} fontSize="3.5">{label}</text>
  </g>;
}

/** 3-Wege-Mischer (Dreiwegemischventil) – DIN Symbol */
function Mischer({ x, y, rot = 0, on }: { x: number; y: number; rot?: number; on?: boolean }) {
  const cl = on ? C.pumpOn : C.pumpOff;
  return <g transform={`translate(${x},${y}) rotate(${rot})`}>
    {/* Zwei Dreiecke = Bowtie + dritter Anschluss */}
    <polygon points="-4,-3.5 0,0 -4,3.5" fill="none" stroke={cl} strokeWidth="0.8" />
    <polygon points="4,-3.5 0,0 4,3.5" fill="none" stroke={cl} strokeWidth="0.8" />
    {/* Bypass-Pfeil (3. Weg) */}
    <line x1="0" y1="0" x2="0" y2="-6" stroke={cl} strokeWidth="1.3" />
    <polygon points="-1.5,-6 0,-9 1.5,-6" fill={cl} />
    {/* M-Kreis (Stellantrieb) */}
    <circle cx="0" cy="-12" r="3" fill={C.tankFill} stroke={cl} strokeWidth="0.6" />
    <text x="0" y="-10.5" textAnchor="middle" fill={cl} fontSize="3" fontWeight="700">M</text>
  </g>;
}

/** Heizkreis-Abgang KOMPLETT: Absperr-V → RV → Mischer → T-Sensor → FBH  |  RL: Absperr-V → Strangregulier → T-Sensor */
function HKAbgang({ vlX, y, rlY, nr, vlTemp, rlTemp, on, dn }: {
  vlX: number; y: number; rlY?: number; nr: number; vlTemp: string; rlTemp: string; on?: boolean; dn: string;
}) {
  const rlX = vlX + 22;
  const topY = y - 80;
  const rlStart = rlY ?? y + 24;
  return <g>
    {/* ── VL-Leitung (von unten nach oben) ── */}
    {/* VL aus Balken hoch */}
    <line x1={vlX} y1={y} x2={vlX} y2={y - 6} stroke={C.hotPipe} strokeWidth="1" />
    {/* Absperrventil VL */}
    <V x={vlX} y={y - 10} r={90} />
    <line x1={vlX} y1={y - 14} x2={vlX} y2={y - 20} stroke={C.hotPipe} strokeWidth="1" />
    {/* Rückschlagventil VL */}
    <RV x={vlX} y={y - 24} rot={-90} />
    <line x1={vlX} y1={y - 28} x2={vlX} y2={topY + 34} stroke={C.hotPipe} strokeWidth="1" />
    {/* T-Sensor VL */}
    <TF x={vlX + 7} y={topY + 38} c={C.hotPipe} />
    {/* Mischer */}
    <Mischer x={vlX} y={topY + 24} rot={0} on={on} />
    {/* VL weiter hoch */}
    <line x1={vlX} y1={topY + 10} x2={vlX} y2={topY} stroke={C.hotPipe} strokeWidth="0.8" />

    {/* ── RL-Leitung (von unten nach oben) ── */}
    {/* RL aus Balken hoch */}
    <line x1={rlX} y1={rlStart} x2={rlX} y2={rlStart - 6} stroke={C.coldPipe} strokeWidth="0.8" strokeDasharray="3,2" />
    {/* Absperrventil RL */}
    <V x={rlX} y={rlStart - 10} r={90} />
    <line x1={rlX} y1={rlStart - 14} x2={rlX} y2={rlStart - 22} stroke={C.coldPipe} strokeWidth="0.8" strokeDasharray="3,2" />
    {/* Strangregulierventil RL */}
    <g transform={`translate(${rlX},${rlStart - 26})`}>
      <polygon points="-4,-3 0,0 -4,3" fill="none" stroke={C.coldPipe} strokeWidth="0.6" />
      <polygon points="4,-3 0,0 4,3" fill={C.coldPipe} stroke={C.coldPipe} strokeWidth="0.6" />
    </g>
    <line x1={rlX} y1={rlStart - 30} x2={rlX} y2={topY + 38} stroke={C.coldPipe} strokeWidth="0.8" strokeDasharray="3,2" />
    {/* T-Sensor RL */}
    <TF x={rlX + 7} y={topY + 44} c={C.coldPipe} />
    <line x1={rlX} y1={topY + 38} x2={rlX} y2={topY} stroke={C.coldPipe} strokeWidth="0.8" strokeDasharray="3,2" />

    {/* Temp-Anzeigen */}
    <T x={vlX - 30} y={topY + 52} v={vlTemp} c={C.hotPipe} />
    <T x={rlX + 12} y={topY + 60} v={rlTemp} c={C.coldPipe} />
    {/* DN Label */}
    <L x={vlX - 3} y={y - 36} t={dn} />
    {/* HK Nummer */}
    <text x={vlX + 11} y={topY - 5} textAnchor="middle" fill={C.dim} fontSize="3.5" fontWeight="600">HK{nr}</text>
  </g>;
}

/** Unused - kept for reference */
// Dist component removed - replaced by inline Verteiler bars with HKAbgang

/** Wärmemengenzähler (WMZ / Σ-Symbol) */
function WMZ({ x, y, c = C.dim }: { x: number; y: number; c?: string }) {
  return <g>
    <rect x={x - 3.5} y={y - 3.5} width={7} height={7} rx="1" fill={C.coldPipe} fillOpacity="0.15" stroke={c} strokeWidth="0.5" />
    <text x={x} y={y + 3} textAnchor="middle" fill={c} fontSize="3.5" fontWeight="700">Σ</text>
  </g>;
}

/** Entlüftungs-/Entleerungs-Box */
function EBox({ x, y, label }: { x: number; y: number; label: string }) {
  return <g>
    <line x1={x} y1={y - 5} x2={x} y2={y - 2} stroke={C.dim} strokeWidth="0.5" />
    <rect x={x - 8} y={y - 2} width={16} height={7} rx="1" fill={C.panel} stroke={C.border} strokeWidth="0.5" />
    <text x={x} y={y + 4} textAnchor="middle" fill={C.dim} fontSize="4.5">{label}</text>
  </g>;
}

function Rgn({ x, y, t }: { x: number; y: number; t: string }) {
  return <text x={x} y={y} fill={C.dim} fontSize="5.5" fontWeight="700" letterSpacing="2.5" opacity="0.22">{t}</text>;
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
      <Ch l="Status" badge={<Badge className={`text-[10px] ${on ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>{on ? 'Laufend' : 'Aus'}</Badge>} />
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
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, px: 0, py: 0 });
  const didPan = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Edit Mode ──
  const [editMode, setEditMode] = useState(false);
  const [editSel, setEditSel] = useState<string | null>(null);
  const [offsets, setOffsets] = useState<Record<string, { dx: number; dy: number }>>({});
  const [dragInfo, setDragInfo] = useState<{ id: string; startX: number; startY: number; oDx: number; oDy: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const [svgMouse, setSvgMouse] = useState({ x: 0, y: 0 });

  const startDrag = useCallback((id: string, e: React.PointerEvent) => {
    const o = offsets[id] || { dx: 0, dy: 0 };
    setDragInfo({ id, startX: e.clientX, startY: e.clientY, oDx: o.dx, oDy: o.dy });
    (e.target as Element).setPointerCapture?.(e.pointerId);
  }, [offsets]);

  const onEditPointerMove = useCallback((e: React.PointerEvent) => {
    // Track SVG mouse position
    const container = containerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      const svgX = Math.round((e.clientX - rect.left - pan.x) / zoom * (1560 / container.clientWidth) );
      const svgY = Math.round((e.clientY - rect.top - pan.y) / zoom * (640 / (container.clientWidth * 640 / 1560)));
      setSvgMouse({ x: svgX, y: svgY });
    }
    if (!dragInfo) return;
    const container2 = containerRef.current;
    if (!container2) return;
    // Convert pixel delta to SVG units
    const svgScale = 1560 / (container2.clientWidth * zoom);
    const dx = Math.round((e.clientX - dragInfo.startX) * svgScale);
    const dy = Math.round((e.clientY - dragInfo.startY) * svgScale);
    setOffsets(prev => ({
      ...prev,
      [dragInfo.id]: { dx: dragInfo.oDx + dx, dy: dragInfo.oDy + dy },
    }));
  }, [dragInfo, zoom, pan]);

  const onEditPointerUp = useCallback(() => setDragInfo(null), []);

  // Arrow keys in edit mode
  useEffect(() => {
    if (!editMode || !editSel) return;
    const handler = (e: KeyboardEvent) => {
      const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Delete', 'Escape'];
      if (!keys.includes(e.key)) return;
      e.preventDefault();
      if (e.key === 'Escape') { setEditSel(null); return; }
      if (e.key === 'Delete') {
        setOffsets(p => { const n = { ...p }; delete n[editSel]; return n; });
        return;
      }
      const step = e.shiftKey ? 5 : 1;
      setOffsets(p => {
        const c = p[editSel] || { dx: 0, dy: 0 };
        return { ...p, [editSel]: {
          dx: c.dx + (e.key === 'ArrowRight' ? step : e.key === 'ArrowLeft' ? -step : 0),
          dy: c.dy + (e.key === 'ArrowDown' ? step : e.key === 'ArrowUp' ? -step : 0),
        }};
      });
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [editMode, editSel]);

  const changedItems = Object.entries(offsets).filter(([, v]) => v.dx !== 0 || v.dy !== 0);

  const exportChanges = () => {
    const txt = changedItems.map(([id, v]) => `${id}: dx=${v.dx}, dy=${v.dy}`).join('\n');
    navigator.clipboard.writeText(txt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const editCtx: EditCtx = {
    active: editMode, selected: editSel, select: setEditSel, offsets, startDrag,
  };

  const zoomIn = () => setZoom(z => Math.min(5, z * 1.3));
  const zoomOut = () => setZoom(z => Math.max(0.5, z / 1.3));
  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  // Wheel zoom towards pointer
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    const newZoom = Math.max(0.5, Math.min(5, zoom * factor));
    // Zoom towards mouse position
    const container = containerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const scale = newZoom / zoom;
      setPan(p => ({
        x: mx - scale * (mx - p.x),
        y: my - scale * (my - p.y),
      }));
    }
    setZoom(newZoom);
  }, [zoom]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    setIsPanning(true);
    didPan.current = false;
    panStart.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
    (e.target as Element).setPointerCapture(e.pointerId);
  }, [pan]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isPanning) return;
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) didPan.current = true;
    setPan({ x: panStart.current.px + dx, y: panStart.current.py + dy });
  }, [isPanning]);

  const onPointerUp = useCallback(() => setIsPanning(false), []);

  // Prevent page scroll on container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const prevent = (e: WheelEvent) => e.preventDefault();
    el.addEventListener('wheel', prevent, { passive: false });
    return () => el.removeEventListener('wheel', prevent);
  }, []);

  const on = data?.status === 'heizen';
  const s = (i: CI) => { if (!didPan.current) setSel(i); };

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
          <Button variant="ghost" size="sm" onClick={zoomOut} className="text-slate-400 h-7 w-7 p-0"><ZoomOut className="w-3.5 h-3.5" /></Button>
          <span className="text-xs text-slate-400 w-12 text-center font-mono">{Math.round(zoom * 100)}%</span>
          <Button variant="ghost" size="sm" onClick={zoomIn} className="text-slate-400 h-7 w-7 p-0"><ZoomIn className="w-3.5 h-3.5" /></Button>
          <Button variant="ghost" size="sm" onClick={resetView} className="text-slate-400 h-7 w-7 p-0"><RotateCcw className="w-3.5 h-3.5" /></Button>
        </div>
        <Button variant="outline" size="sm" onClick={() => { setEditMode(!editMode); setEditSel(null); }}
          className={`border-[#1e2736] text-xs ${editMode ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'text-slate-400'}`}>
          <Pencil className="w-3.5 h-3.5 mr-1" />{editMode ? 'Edit AN' : 'Edit'}
        </Button>
      </div>
    </div>

    {/* Status-Bar */}
    <div className="flex flex-wrap items-center gap-4 px-3 py-2 bg-[#111620]/50 rounded-lg border border-[#1e2736] text-xs font-mono">
      <span className="flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full ${on ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
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

    {/* Edit-Mode Bar */}
    {editMode && <div className="flex flex-wrap items-center gap-3 px-3 py-2 bg-amber-500/10 rounded-lg border border-amber-500/30 text-xs">
      <span className="text-amber-400 font-bold">✏️ EDIT</span>
      <span className="text-amber-400/60 text-[10px]">Ziehen = Verschieben · Pfeiltasten ±1 (Shift ±5) · ESC = Abwählen</span>
      <div className="flex-1" />
      <span className="text-slate-500 font-mono text-[10px]">
        <MousePointer className="w-3 h-3 inline" /> {svgMouse.x}, {svgMouse.y}
      </span>
      {editSel && <span className="text-emerald-400 font-mono text-[10px]">
        ▸ {editSel} {offsets[editSel] && `(Δ${offsets[editSel].dx}, Δ${offsets[editSel].dy})`}
      </span>}
      {changedItems.length > 0 && <>
        <span className="text-amber-400 font-mono">{changedItems.length}×</span>
        <Button variant="ghost" size="sm" onClick={exportChanges} className="h-6 px-2 text-[10px] text-amber-400">
          {copied ? <><Check className="w-3 h-3 mr-1" />Kopiert!</> : <><Copy className="w-3 h-3 mr-1" />Export</>}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => { setOffsets({}); setEditSel(null); }} className="h-6 px-2 text-[10px] text-red-400">
          <Trash2 className="w-3 h-3 mr-1" />Reset
        </Button>
      </>}
    </div>}

    {/* ═════════════ SVG ═════════════ */}
    <EditContext.Provider value={editCtx}>
    <div ref={containerRef}
      className={`relative rounded-xl select-none overflow-hidden border ${editMode ? 'border-amber-500/40' : 'border-[#1e2736]'}`}
      style={{ background: C.bg, touchAction: 'none', cursor: editMode ? (dragInfo ? 'grabbing' : 'crosshair') : isPanning ? 'grabbing' : zoom > 1 ? 'grab' : 'default' }}
      onClick={() => { if (!editMode && !didPan.current) setSel(null); }}
      onWheel={onWheel}
      onPointerDown={editMode ? undefined : onPointerDown}
      onPointerMove={editMode ? onEditPointerMove : onPointerMove}
      onPointerUp={editMode ? onEditPointerUp : onPointerUp}
      onPointerLeave={editMode ? onEditPointerUp : onPointerUp}
      onDoubleClick={editMode ? undefined : resetView}>
      {zoom > 1.05 && <div className="absolute top-2 left-2 z-10 text-[10px] text-slate-500 bg-[#0a0e14]/80 px-2 py-1 rounded font-mono pointer-events-none">
        {Math.round(zoom * 100)}% – Doppelklick = Reset
      </div>}
      <svg
        viewBox="0 0 1560 640"
        style={{
          display: 'block', width: '100%',
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}>
          <Defs />
          {/* Grid */}
          <pattern id="gr" width="30" height="30" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.25" fill="#334155" opacity="0.1" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#gr)" />

          {/* Region Labels */}
          <Rgn x={40} y={48} t="QUELLEN" />
          <Rgn x={340} y={540} t="ERZEUGUNG" />
          <Rgn x={740} y={170} t="SPEICHER" />
          <Rgn x={940} y={210} t="VERTEILUNG" />
          <Rgn x={1230} y={170} t="KÄLTE" />

          {/* Trennlinie Heizung ┊ Kälte */}
          <line x1="1175" y1="50" x2="1175" y2="560" stroke={C.border} strokeWidth="0.6" strokeDasharray="6,4" opacity="0.35" />

          {/* ════════════════════════════════════════
               ABLUFT-WP AUF DACH (oben Mitte)
               ════════════════════════════════════════ */}
          <E id="BOX_ABWP"><Box x={390} y={55} w={130} h={45} title="Abluft-WP" sub="auf Dach · Rohrbegl." active={!!on} color={C.warmPipe}
            onClick={() => s({ id: 'ABWP', name: 'Abluft-Wärmepumpe', desc: 'Auf Dach mit Rohrbegleitheizung', status: on ? 'running' : 'standby', temp: '40°C', tempRet: '35°C' })} /></E>
          {/* Rohrbegleitheizung-Zickzack */}
          <path d="M528,68 L536,60 L544,68 L552,60 L560,68" fill="none" stroke="#fb923c" strokeWidth="0.6" strokeDasharray="2,1" opacity="0.5" />
          {/* "in: Lüftung 400V" */}
          <text x={455} y={108} textAnchor="middle" fill={C.dim} fontSize="3">in: Lüftung 400V</text>

          {/* PVT-Solar (oben links) */}
          <E id="BOX_PVT"><Box x={155} y={55} w={105} h={45} title="PVT-Solar" sub="6,2 kW th." active={!!on} color={C.warmPipe}
            onClick={() => s({ id: 'PVT', name: 'PVT-Solarkollektoren', desc: 'Auf Dach, 6,2 kW thermisch', status: 'running', temp: `${aus}°C`, power: '6,2 kW' })} /></E>
          <circle cx="208" cy={46} r="7" fill="none" stroke="#fbbf24" strokeWidth="0.7" opacity="0.35" />
          <circle cx="208" cy={46} r="2.5" fill="#fbbf24" opacity="0.35" />
          {/* PVT Detail-Label */}
          <g transform="translate(155,108)">
            <rect width="92" height="22" rx="2" fill={C.panel} stroke={C.border} strokeWidth="0.5" opacity="0.7" />
            <text x="46" y="9" textAnchor="middle" fill={C.dim} fontSize="3">Rohrfeldstation</text>
            <text x="46" y="18" textAnchor="middle" fill={C.text} fontSize="3">6,5°C opt. · DN 65</text>
          </g>

          {/* Erdwärmefeld (links) */}
          <E id="BOX_ERD"><Box x={20} y={VL - 20} w={95} h={42} title="Erdwärme" sub="FVU Nahwärme" active={!!on} color={C.geoPipe}
            onClick={() => s({ id: 'ERD', name: 'Erdwärmefeld', desc: 'Zuleitung FVU Nahwärme', status: on ? 'running' : 'standby', flow: '42,1 m³/h', dn: 'DN 80' })} /></E>
          {/* Erdwärme-Sonden Zigzag (unterirdisch) */}
          <g opacity="0.35">
            <path d={`M30,${VL + 25} L38,${VL + 35} L46,${VL + 25} L54,${VL + 35} L62,${VL + 25}`} fill="none" stroke={C.geoPipe} strokeWidth="0.7" />
            <path d={`M55,${VL + 30} L63,${VL + 40} L71,${VL + 30} L79,${VL + 40} L87,${VL + 30}`} fill="none" stroke={C.geoPipe} strokeWidth="0.7" />
            <text x="58" y={VL + 50} textAnchor="middle" fill={C.geoPipe} fontSize="2.5">Sondernfeld</text>
          </g>

          {/* ════════════════════════════════════════
               ROHRE QUELLEN → PUFFER PVT
               ════════════════════════════════════════ */}

          {/* PVT → runter zum Puffer */}
          <Pipe d={`M207,100 L207,155 L220,155 L220,${VL - 45}`} c={C.warmPipe} glow={C.warmGlow} />
          <L x={212} y={140} t="DN 65" />

          {/* Abluft-WP → runter → Puffer PVT (durch WP-Einhausung) */}
          <Pipe d={`M455,100 L455,140 L250,140 L250,${VL - 45}`} c={C.warmPipe} glow={C.warmGlow} />
          <E id="P02"><Pump x={455} y={125} id="P02" on={!!on}
            onClick={() => s({ id: 'P02', name: 'Pumpe P02', desc: 'Umwälzpumpe Abluft-WP', status: on ? 'running' : 'off', flow: '15,2 m³/h', dn: 'DN 65' })} /></E>
          <E id="PT1"><PT x={470} y={100} v="35°C" c={C.warmPipe} /></E>
          <E id="PT2"><PT x={525} y={100} v="40°C" c={C.hotPipe} /></E>

          {/* Erdwärme → Absperrventil → P01 → Schmutzfänger → Absperrventil → WT (VL) */}
          <Pipe d={`M115,${VL} L128,${VL}`} c={C.geoPipe} glow={C.geoGlow} w={3.5} />
          <V x={133} y={VL} />
          <Pipe d={`M138,${VL} L147,${VL}`} c={C.geoPipe} glow={C.geoGlow} w={3.5} />
          <E id="P01"><Pump x={162} y={VL} id="P01" on={!!on}
            onClick={() => s({ id: 'P01', name: 'Pumpe P01', desc: 'Umwälzpumpe Erdwärme', status: on ? 'running' : 'off', flow: '42,1 m³/h', dn: 'DN 80' })} /></E>
          <Pipe d={`M176,${VL} L188,${VL}`} c={C.geoPipe} glow={C.geoGlow} w={3.5} />
          {/* Rückschlagventil nach P01 */}
          <RV x={192} y={VL} />
          <Pipe d={`M196,${VL} L198,${VL}`} c={C.geoPipe} glow={C.geoGlow} w={3.5} />
          {/* Schmutzfänger (Y-Filter Symbol) */}
          <g transform={`translate(202,${VL})`}>
            <polygon points="-5,-5 5,-5 0,5" fill="none" stroke={C.geoPipe} strokeWidth="0.7" />
            <line x1="0" y1="5" x2="0" y2="9" stroke={C.geoPipe} strokeWidth="0.6" />
          </g>
          <Pipe d={`M208,${VL} L222,${VL}`} c={C.geoPipe} glow={C.geoGlow} w={3.5} />
          <V x={228} y={VL} />
          <Pipe d={`M234,${VL} L350,${VL}`} c={C.geoPipe} glow={C.geoGlow} w={3.5} />
          <L x={142} y={VL - 16} t="DN 80" />
          {/* VL Temperatur-Fühler */}
          <E id="PT3"><PT x={298} y={VL - 18} v={`${aus}°`} c={C.geoPipe} /></E>
          <TF x={275} y={VL - 8} c={C.geoPipe} />

          {/* Erdwärme ← Absperrventil ← RL */}
          <Pipe d={`M350,${RL} L228,${RL}`} c={C.geoPipe} w={2.5} dash="5,3" />
          <V x={222} y={RL} />
          <Pipe d={`M216,${RL} L115,${RL} L65,${RL} L65,${VL + 20}`} c={C.geoPipe} w={2.5} dash="5,3" />
          {/* RL Temperatur-Fühler */}
          <E id="PT4"><PT x={298} y={RL + 18} v={`${rl}°`} c={C.coldPipe} /></E>
          <TF x={275} y={RL + 10} c={C.coldPipe} />

          {/* Auslegungsdaten Erdwärme */}
          <g transform={`translate(120,${RL + 22})`}>
            <rect width="100" height="42" rx="3" fill={C.panel} stroke={C.border} strokeWidth="0.4" opacity="0.7" />
            <text x="50" y="10" textAnchor="middle" fill={C.dim} fontSize="3.5" fontWeight="600">Auslegung Erdwärme</text>
            <text x="50" y="20" textAnchor="middle" fill={C.text} fontSize="3">ΔT 3K · Glycol 30%</text>
            <text x="50" y="29" textAnchor="middle" fill={C.text} fontSize="3">42,1 m³/h · DN 80</text>
            <text x="50" y="38" textAnchor="middle" fill={C.text} fontSize="3">SV 3,5 bar · 400V</text>
          </g>

          {/* ════════════════════════════════════════
               PUFFER PVT  (2000 L)
               ════════════════════════════════════════ */}
          <E id="TANK_PVT"><Tank cx={235} y={VL - 45} w={48} h={RL - VL + 90} label="Puffer PVT" vol="2000 L"
            temps={[`${po}°`, `${pm}°`, `${pu}°`]} grad="gTankHot"
            onClick={() => s({ id: 'PS1', name: 'Pufferspeicher PVT', desc: 'Hydr. Trennung, 2000 L', status: on ? 'running' : 'standby', temp: `${po}°C`, power: '2000 L', dn: 'DN 100' })} /></E>
          {/* MAG am Puffer PVT */}
          <E id="MAG1"><MAG x={195} y={VL + 35} /></E>
          {/* Sicherheitsventil Puffer PVT */}
          <E id="SV3bar"><SV x={195} y={RL + 20} label="SV 3bar" /></E>

          {/* Puffer PVT Info-Box */}
          <g transform={`translate(175,${RL + 50})`}>
            <rect width="100" height="28" rx="2" fill={C.panel} stroke={C.border} strokeWidth="0.5" opacity="0.7" />
            <text x="50" y="10" textAnchor="middle" fill={C.dim} fontSize="3" fontWeight="600">Pufferspeicher PVT</text>
            <text x="50" y="19" textAnchor="middle" fill={C.text} fontSize="3">hydr. Trennung · 2000 L</text>
            <text x="50" y="27" textAnchor="middle" fill={C.text} fontSize="3">Unterdruckspeicher · 395 AT</text>
          </g>

          {/* Puffer PVT → Absperrventil → P03 → WT  (VL) */}
          <Pipe d={`M259,${VL} L290,${VL}`} c={C.warmPipe} glow={C.warmGlow} />
          <V x={296} y={VL} />
          <Pipe d={`M302,${VL} L316,${VL}`} c={C.warmPipe} glow={C.warmGlow} />
          <E id="P03"><Pump x={330} y={VL} id="P03" on={!!on}
            onClick={() => s({ id: 'P03', name: 'Pumpe P03', desc: 'Umwälzpumpe Puffer PVT', status: on ? 'running' : 'off', flow: '28,5 m³/h', dn: 'DN 100' })} /></E>
          <RV x={346} y={VL} />
          <Pipe d={`M350,${VL} L352,${VL}`} c={C.warmPipe} glow={C.warmGlow} />
          <L x={286} y={VL - 16} t="DN 100" />
          <TF x={270} y={VL - 8} c={C.warmPipe} />

          {/* Puffer PVT ← Absperrventil ← WT (RL) */}
          <Pipe d={`M259,${RL} L302,${RL}`} c={C.coldPipe} w={2.5} dash="5,3" />
          <V x={296} y={RL} />
          <Pipe d={`M290,${RL} L352,${RL}`} c={C.coldPipe} w={2.5} dash="5,3" />
          <TF x={270} y={RL + 10} c={C.coldPipe} />

          {/* ════════════════════════════════════════
               WÄRMETAUSCHER  (47 kW) – Halbkreis
               ════════════════════════════════════════ */}
          <g className="cursor-pointer" onClick={() => s({ id: 'WT1', name: 'Wärmetauscher', desc: 'Plattenwärmetauscher 47 kW', status: on ? 'running' : 'standby', power: '47 kW', dn: 'DN 80' })}>
            {/* Halbkreis-Symbol (DIN-Norm) */}
            <path d={`M355,${VL - 5} A45,45 0 0,1 355,${RL + 5}`} fill="url(#gWt)" stroke={C.tankStroke} strokeWidth="1.2" />
            {/* Platten-Linien */}
            {[0, 1, 2, 3].map(i => <line key={i} x1={358} y1={VL + 10 + i * 22} x2={390} y2={VL + 10 + i * 22} stroke="rgba(255,255,255,0.12)" strokeWidth="0.4" />)}
          </g>
          <text x={380} y={RL + 28} textAnchor="middle" fill={C.dim} fontSize="4">WT 47 kW</text>
          <L x={362} y={VL - 12} t="DN 80" />
          {/* WT VL/RL Temps */}
          <E id="PT5"><PT x={370} y={VL - 24} v={`${aus}°`} c={C.geoPipe} /></E>
          <E id="PT6"><PT x={370} y={RL + 35} v={`${rl}°`} c={C.coldPipe} /></E>
          {/* TF sensors at WT (4 total) */}
          <TF x={358} y={VL + 8} c={C.warmPipe} />
          <TF x={358} y={RL - 8} c={C.coldPipe} />
          <TF x={395} y={VL + 8} c={C.hotPipe} />
          <TF x={395} y={RL - 8} c={C.coldPipe} />

          {/* WT → Absperrventil → WP (VL) */}
          <Pipe d={`M400,${VL} L422,${VL}`} c={C.warmPipe} glow={C.warmGlow} w={3.5} />
          <V x={428} y={VL} />
          <Pipe d={`M434,${VL} L465,${VL}`} c={C.warmPipe} glow={C.warmGlow} w={3.5} />
          {/* WT ← Absperrventil ← WP (RL) */}
          <Pipe d={`M400,${RL} L434,${RL}`} c={C.coldPipe} glow={C.coldGlow} w={2.5} dash="5,3" />
          <V x={428} y={RL} />
          <Pipe d={`M422,${RL} L465,${RL}`} c={C.coldPipe} glow={C.coldGlow} w={2.5} dash="5,3" />

          {/* WP Zuleitung Info-Box */}
          <g transform={`translate(590,${VL - 70})`}>
            <rect width="115" height="40" rx="3" fill={C.panel} stroke={C.border} strokeWidth="0.4" opacity="0.8" />
            <text x="58" y="10" textAnchor="middle" fill={C.dim} fontSize="3" fontWeight="600">Zuleitung WP</text>
            <text x="58" y="20" textAnchor="middle" fill={C.text} fontSize="3">Wärmetauscher · 38°C</text>
            <text x="58" y="29" textAnchor="middle" fill={C.text} fontSize="3">Abl. Wärm.-rückg. · 6,4 kW</text>
            <text x="58" y="38" textAnchor="middle" fill={C.text} fontSize="3">DN 25</text>
          </g>

          {/* ════════════════════════════════════════
               WP-EINHAUSUNG (blaue gestrichelte Box)
               ════════════════════════════════════════ */}
          <rect x={460} y={VL - 55} width={180} height={RL - VL + 110} rx="5"
            fill="none" stroke={C.enclosure} strokeWidth="0.8" strokeDasharray="8,4" />
          <text x={550} y={VL - 62} textAnchor="middle" fill={C.enclosure} fontSize="4" fontWeight="600">Maschinenraum WP</text>

          {/* Soleanbindung Label */}
          <g transform={`translate(462,${RL + 30})`}>
            <rect width="78" height="22" rx="2" fill={C.panel} stroke={C.enclosure} strokeWidth="0.35" opacity="0.8" />
            <text x="39" y="9" textAnchor="middle" fill={C.dim} fontSize="3">Soleanbindung</text>
            <text x="39" y="18" textAnchor="middle" fill={C.text} fontSize="3">DN 65 · SV 3 bar</text>
          </g>

          {/* SC (Sole Circuit) Label innerhalb Einhausung */}
          <text x={510} y={RL + 8} textAnchor="middle" fill={C.enclosure} fontSize="3" opacity="0.5">SC</text>

          {/* DN 25 interne Leitung (Zuleitung Wärmerückgewinnung) */}
          <line x1={530} y1={VL - 50} x2={530} y2={VL - 30} stroke={C.dim} strokeWidth="0.4" strokeDasharray="2,2" />
          <text x={538} y={VL - 40} fill={C.dim} fontSize="4.5">DN 25</text>

          {/* SV (Sicherheitsventil) im WP-Bereich */}
          <E id="SV3,5"><SV x={580} y={VL - 42} label="SV 3,5" /></E>

          {/* 400V Label */}
          <text x={550} y={RL + 54} textAnchor="middle" fill={C.dim} fontSize="3" opacity="0.4">400V · 3~ · 50Hz</text>

          {/* ════════════════════════════════════════
               WÄRMEPUMPE  (175 kW)
               ════════════════════════════════════════ */}
          <E id="WP"><g className="cursor-pointer" onClick={() => s({ id: 'WP1', name: 'Wärmepumpe', desc: '175 kW th. / 38,9 kW el.', status: on ? 'running' : 'standby', temp: `${vl}°C`, tempRet: `${rl}°C`, power: '175 kW', dn: 'DN 100' })}>
            {on && <rect x={473} y={VL - 28} width={114} height={RL - VL + 56} rx="7" fill={C.hotPipe} opacity="0.04" filter="url(#gl)" />}
            <rect x={475} y={VL - 26} width={110} height={RL - VL + 52} rx="5"
              fill={C.panel} stroke={on ? C.hotPipe : C.border} strokeWidth={on ? 2 : 1.2} />
            <text x={530} y={VL - 8} textAnchor="middle" fill={C.bright} fontSize="5.5" fontWeight="700">Wärmepumpe</text>
            <text x={530} y={VL + 5} textAnchor="middle" fill={C.dim} fontSize="4">175 kW th · 38,9 kW el</text>
            {/* COP */}
            <rect x={500} y={VL + 18} width={60} height={26} rx="4" fill={C.bg} stroke={C.border} strokeWidth="0.4" />
            <text x={530} y={VL + 28} textAnchor="middle" fill={C.dim} fontSize="3.5">COP</text>
            <text x={530} y={VL + 40} textAnchor="middle" fill={C.accent} fontSize="7" fontWeight="800" className="mf">{cop}</text>
            {/* Status */}
            <circle cx={490} cy={RL + 12} r={3.5} fill={on ? C.pumpOn : C.pumpOff} className={on ? 'pp' : ''} />
            <text x={500} y={RL + 15} fill={on ? C.pumpOn : C.pumpOff} fontSize="4" fontWeight="600">{on ? 'AKTIV' : 'STANDBY'}</text>
            <text x={530} y={RL + 25} textAnchor="middle" fill={C.dim} fontSize="3.5">400V · SV 3,5 bar</text>
          </g></E>
          <L x={470} y={VL - 12} t="DN 100" />

          {/* WP → Absperrventil → P04 (VL) */}
          <Pipe d={`M585,${VL} L605,${VL}`} c={C.hotPipe} glow={C.hotGlow} w={4} />
          <V x={612} y={VL} />
          <Pipe d={`M618,${VL} L640,${VL}`} c={C.hotPipe} glow={C.hotGlow} w={4} />
          <E id="P04"><Pump x={660} y={VL} id="P04" on={!!on}
            onClick={() => s({ id: 'P04', name: 'Pumpe P04', desc: 'Umwälzpumpe Heizung', status: on ? 'running' : 'off', flow: '18,3 m³/h', dn: 'DN 100' })} /></E>
          <RV x={678} y={VL} />
          <Pipe d={`M682,${VL} L720,${VL}`} c={C.hotPipe} glow={C.hotGlow} w={4} />
          <E id="PT7"><PT x={700} y={VL - 20} v={`${vl}°`} c={C.hotPipe} /></E>
          <L x={620} y={VL - 16} t="DN 100" />
          <TF x={710} y={VL + 10} c={C.hotPipe} />

          {/* WP ← Absperrventil ← RL */}
          <Pipe d={`M585,${RL} L618,${RL}`} c={C.coldPipe} glow={C.coldGlow} w={3} dash="5,3" />
          <V x={625} y={RL} />
          <Pipe d={`M632,${RL} L720,${RL}`} c={C.coldPipe} glow={C.coldGlow} w={3} dash="5,3" />
          <E id="PT8"><PT x={700} y={RL + 20} v={`${rl}°`} c={C.coldPipe} /></E>
          <L x={620} y={RL + 14} t="DN 100" />
          <TF x={710} y={RL - 8} c={C.coldPipe} />

          {/* Aufstellung Info */}
          <g transform={`translate(610,${RL + 28})`}>
            <rect width="105" height="34" rx="3" fill={C.panel} stroke={C.border} strokeWidth="0.35" opacity="0.7" />
            <text x="52" y="10" textAnchor="middle" fill={C.dim} fontSize="3" fontWeight="600">Aufstellung WP</text>
            <text x="52" y="19" textAnchor="middle" fill={C.text} fontSize="3">400V · 3~ · 50Hz</text>
            <text x="52" y="28" textAnchor="middle" fill={C.text} fontSize="3">Nennleistung 38,9 kW el</text>
          </g>

          {/* ════════════════════════════════════════
               PUFFER HEIZUNG  (1500 L)
               ════════════════════════════════════════ */}
          <E id="TANK_HZ"><Tank cx={750} y={VL - 45} w={44} h={RL - VL + 90} label="Puffer HZ" vol="1500 L"
            temps={[`${vl}°`, undefined, `${rl}°`]} grad="gTankHot"
            onClick={() => s({ id: 'PS2', name: 'Pufferspeicher HZ', desc: '1500 L', status: on ? 'running' : 'standby', temp: `${vl}°C`, tempRet: `${rl}°C`, power: '1500 L', dn: 'DN 80' })} /></E>
          <E id="MAG2"><MAG x={788} y={VL + 35} /></E>
          {/* SV am Puffer HZ */}
          <E id="SV3"><SV x={726} y={VL - 52} label="SV 3" /></E>

          {/* Puffer HZ info */}
          <g transform={`translate(720,${RL + 52})`}>
            <rect width="80" height="20" rx="2" fill={C.panel} stroke={C.border} strokeWidth="0.5" opacity="0.6" />
            <text x="40" y="8" textAnchor="middle" fill={C.dim} fontSize="3">SV 3 bar · 6K ΔT</text>
            <text x="40" y="16" textAnchor="middle" fill={C.dim} fontSize="3">DN 80 · 1500 L</text>
          </g>

          {/* Puffer HZ → Absperrventil → P05 → Verteiler (VL) */}
          <Pipe d={`M772,${VL} L794,${VL}`} c={C.hotPipe} glow={C.hotGlow} w={3.5} />
          <V x={800} y={VL} />
          <Pipe d={`M806,${VL} L818,${VL}`} c={C.hotPipe} glow={C.hotGlow} w={3.5} />
          <E id="P05"><Pump x={835} y={VL} id="P05" on={!!on}
            onClick={() => s({ id: 'P05', name: 'Pumpe P05', desc: 'Umwälzpumpe Verteiler', status: on ? 'running' : 'off', flow: '22,1 m³/h', dn: 'DN 65' })} /></E>
          <Pipe d={`M849,${VL} L870,${VL}`} c={C.hotPipe} glow={C.hotGlow} w={3.5} />
          {/* Strangregulierventil */}
          <g transform={`translate(877,${VL})`}>
            <polygon points="-3,-2.5 0,0 -3,2.5" fill="none" stroke={C.hotPipe} strokeWidth="0.7" />
            <polygon points="3,-2.5 0,0 3,2.5" fill={C.hotPipe} stroke={C.hotPipe} strokeWidth="0.7" />
          </g>
          <Pipe d={`M883,${VL} L895,${VL}`} c={C.hotPipe} glow={C.hotGlow} w={3.5} />
          <L x={810} y={VL - 16} t="DN 65" />
          {/* VL Temp nach P05 */}
          <E id="PT9"><PT x={865} y={VL - 20} v={`${vl}°`} c={C.hotPipe} /></E>

          {/* Puffer HZ ← Absperrventil ← Verteiler (RL) */}
          <Pipe d={`M772,${RL} L806,${RL}`} c={C.coldPipe} glow={C.coldGlow} w={2.5} dash="5,3" />
          <V x={800} y={RL} />
          <Pipe d={`M794,${RL} L895,${RL}`} c={C.coldPipe} glow={C.coldGlow} w={2.5} dash="5,3" />
          <L x={810} y={RL + 14} t="DN 55" />
          {/* RL Temp */}
          <E id="PT10"><PT x={865} y={RL + 18} v={`${rl}°`} c={C.coldPipe} /></E>

          {/* ════════════════════════════════════════
               VERTEILER HEIZUNG (mit Mischern + Temps)
               ════════════════════════════════════════ */}
          {/* Verteiler-Balken */}
          <g className="cursor-pointer" onClick={() => s({ id: 'VH', name: 'Verteiler Heizung', desc: 'Heizungsverteiler mit 4 Heizkreisen', status: on ? 'running' : 'standby', temp: `${vl}°C`, tempRet: `${rl}°C`, dn: 'DN 56/55' })}>
            <rect x={895} y={VL + 20} width={180} height={18} rx="3" fill={C.panel} stroke={on ? C.hotPipe : C.border} strokeWidth={on ? 2 : 1.2} />
            <text x={985} y={VL + 33} textAnchor="middle" fill={C.bright} fontSize="5" fontWeight="700" letterSpacing="0.5">VERTEILER HEIZUNG</text>
            {/* RL-Balken darunter */}
            <rect x={895} y={VL + 44} width={180} height={14} rx="3" fill={C.panel} stroke={on ? C.coldPipe : C.border} strokeWidth={on ? 1.5 : 1} strokeDasharray="4,2" />
            <text x={985} y={VL + 54} textAnchor="middle" fill={C.coldPipe} fontSize="3.5" opacity="0.6">Rücklauf</text>
          </g>

          {/* VL/RL Zuleitungen */}
          <Pipe d={`M895,${VL} L895,${VL + 20}`} c={C.hotPipe} w={3} />
          <Pipe d={`M895,${RL} L895,${VL + 58}`} c={C.coldPipe} w={2.5} dash="4,2" />
          {/* WMZ am Verteiler-Eingang */}
          <WMZ x={888} y={VL + 10} c={C.hotPipe} />
          <WMZ x={888} y={VL + 50} c={C.coldPipe} />

          {/* ── Heizkreis 1: FBH EG ── */}
          <HKAbgang vlX={920} y={VL + 20} rlY={VL + 58} nr={1} vlTemp={`${vl}°`} rlTemp={`${rl}°`} on={on} dn="DN 56" />
          <FBH x={930} y={VL - 62} label="FBH EG" />

          {/* ── Heizkreis 2: FBH OG ── */}
          <HKAbgang vlX={965} y={VL + 20} rlY={VL + 58} nr={2} vlTemp={`${vl}°`} rlTemp={`${rl}°`} on={on} dn="DN 56" />
          <FBH x={975} y={VL - 62} label="FBH OG" />

          {/* ── Heizkreis 3: Stockwerke ── */}
          <HKAbgang vlX={1010} y={VL + 20} rlY={VL + 58} nr={3} vlTemp={`${vl}°`} rlTemp={`${rl}°`} on={on} dn="DN 56" />
          <text x={1021} y={VL - 54} textAnchor="middle" fill={C.dim} fontSize="3">Anschluss</text>
          <text x={1021} y={VL - 46} textAnchor="middle" fill={C.dim} fontSize="3">weitere SW</text>

          {/* ── Heizkreis 4: Satellitenhaus E ── */}
          <HKAbgang vlX={1055} y={VL + 20} rlY={VL + 58} nr={4} vlTemp={`${vl}°`} rlTemp={`${rl}°`} on={on} dn="DN 56" />
          <text x={1066} y={VL - 54} textAnchor="middle" fill={C.dim} fontSize="3">Sat.-Haus E</text>
          <text x={1066} y={VL - 46} textAnchor="middle" fill={C.dim} fontSize="3">Heizung</text>

          {/* Druckhalte-/Nachspeise */}
          <g transform={`translate(895,${RL + 22})`}>
            <rect width="140" height="24" rx="3" fill={C.panel} stroke={C.border} strokeWidth="0.4" strokeDasharray="4,2" />
            <text x="70" y="9" textAnchor="middle" fill={C.dim} fontSize="3.5">Druckhalte-/Entgasungs-</text>
            <text x="70" y="19" textAnchor="middle" fill={C.dim} fontSize="3.5">und Nachspeisestation</text>
          </g>

          {/* USV (Überströmventil) zwischen VL und RL am Verteiler */}
          <USV x={1090} y1v={VL + 20} y2r={VL + 58} />

          {/* Wasseraufbereitung */}
          <g transform={`translate(1050,${RL + 22})`}>
            <rect width="85" height="22" rx="2" fill={C.panel} stroke={C.border} strokeWidth="0.5" />
            <text x="42" y="9" textAnchor="middle" fill={C.dim} fontSize="3">Wasseraufbereitung</text>
            <text x="42" y="18" textAnchor="middle" fill={C.text} fontSize="3">Enthärtung · Füllung</text>
          </g>

          {/* Anschluss P04 / Kapselfeed */}
          <g transform={`translate(895,${RL + 50})`}>
            <rect width="100" height="16" rx="2" fill={C.panel} stroke={C.border} strokeWidth="0.5" />
            <text x="50" y="11" textAnchor="middle" fill={C.dim} fontSize="3">Kapselfeed · Anschluss P04</text>
          </g>

          {/* Entleerung/Füllung Label */}
          <g transform={`translate(1050,${RL + 48})`}>
            <rect width="85" height="16" rx="2" fill={C.panel} stroke={C.border} strokeWidth="0.4" />
            <text x="42" y="11" textAnchor="middle" fill={C.dim} fontSize="3">Füllung Heizung · Anl.</text>
          </g>

          {/* Entleerungshähne an Tiefpunkten */}
          <EBox x={400} y={RL + 20} label="Entl." />
          <EBox x={720} y={RL + 42} label="Entl." />

          {/* Entlüftung an Hochpunkten */}
          <EBox x={240} y={VL - 52} label="Entlüft." />
          <EBox x={750} y={VL - 52} label="Entlüft." />

          {/* ════════════════════════════════════════
               KÄLTE-BEREICH – KOMPLETT
               ════════════════════════════════════════ */}

          {/* ── Füllung Heizung / Verbindung links ── */}
          <Pipe d={`M1100,${VL} L1140,${VL}`} c={C.hotPipe} glow={C.hotGlow} w={2} dash="6,3" />
          <Pipe d={`M1100,${RL} L1140,${RL}`} c={C.coldPipe} w={1.5} dash="4,3" />
          <text x={1115} y={VL - 8} fill={C.dim} fontSize="3">Füllung Heiz.</text>
          <text x={1115} y={VL - 2} fill={C.dim} fontSize="4.5">zu Gas Brunnen P</text>

          {/* ──── Nullenergiebrunnen (großer Halbkreis / WT-Symbol) ──── */}
          <g className="cursor-pointer" onClick={() => s({ id: 'NEB', name: 'Nullenergiebrunnen', desc: 'Kälte-WT · 4/50 · 40m³ · 1000 L', status: 'standby', power: '25 kW', dn: 'DN 80', temp: '37°C', tempRet: '18°C' })}>
            {/* Großer Halbkreis – Brunnen-WT */}
            <path d={`M1180,${VL - 12} A55,55 0 0,1 1180,${RL + 12}`} fill="url(#gTankCold)" stroke={C.tankStroke} strokeWidth="1.5" />
            {/* Interne Platten-Linien */}
            {[0, 1, 2, 3, 4].map(i => <line key={i} x1={1185} y1={VL + i * 18} x2={1225} y2={VL + i * 18} stroke="rgba(255,255,255,0.08)" strokeWidth="0.4" />)}
            {/* Temperatur-Schichtung */}
            <text x={1205} y={VL + 10} textAnchor="middle" fill={C.coolPipe} fontSize="3" opacity="0.4">warm</text>
            <text x={1205} y={RL - 5} textAnchor="middle" fill={C.coolPipe} fontSize="3" opacity="0.4">kalt</text>
          </g>
          <text x={1210} y={RL + 28} textAnchor="middle" fill={C.dim} fontSize="4" fontWeight="600">Brunnen-WT</text>

          {/* Brunnen-WT Info-Box (oben) */}
          <g transform={`translate(1155,${VL - 78})`}>
            <rect width="115" height="48" rx="3" fill={C.panel} stroke={C.coolPipe} strokeWidth="0.5" opacity="0.85" />
            <text x="57" y="11" textAnchor="middle" fill={C.coolPipe} fontSize="4" fontWeight="700">Nullenergiebrunnen</text>
            <text x="57" y="22" textAnchor="middle" fill={C.text} fontSize="3">4/50 · 40m³ · 1000 Liter</text>
            <text x="57" y="32" textAnchor="middle" fill={C.text} fontSize="3">DN 80 · ΔT 5K</text>
            <text x="57" y="42" textAnchor="middle" fill={C.text} fontSize="3">Druckhaltesystem m. Entgasung</text>
          </g>

          {/* SV + Entlüftung am Brunnen-WT */}
          <E id="SV3"><SV x={1190} y={VL - 25} label="SV 3" /></E>
          <EBox x={1225} y={VL - 25} label="Entlüft." />

          {/* ──── Primär-VL: Brunnen-WT → rechts ──── */}
          <Pipe d={`M1232,${VL} L1250,${VL}`} c={C.coolPipe} w={2.5} />
          <V x={1256} y={VL} />
          <Pipe d={`M1262,${VL} L1280,${VL}`} c={C.coolPipe} w={2.5} />
          <TF x={1275} y={VL - 10} c={C.coolPipe} />
          {/* Strangregulierventil */}
          <g transform={`translate(1288,${VL})`}>
            <polygon points="-4,-3 0,0 -4,3" fill="none" stroke={C.coolPipe} strokeWidth="0.6" />
            <polygon points="4,-3 0,0 4,3" fill={C.coolPipe} stroke={C.coolPipe} strokeWidth="0.6" />
          </g>
          <Pipe d={`M1294,${VL} L1320,${VL}`} c={C.coolPipe} w={2.5} />
          <E id="PT11"><PT x={1260} y={VL - 22} v="37°" c={C.coolPipe} /></E>
          <L x={1296} y={VL - 10} t="DN 65" />

          {/* ──── Primär-RL: Brunnen-WT ← links ──── */}
          <Pipe d={`M1232,${RL} L1262,${RL}`} c={C.coolPipe} w={2} dash="4,3" />
          <V x={1256} y={RL} />
          <Pipe d={`M1250,${RL} L1320,${RL}`} c={C.coolPipe} w={2} dash="4,3" />
          <TF x={1275} y={RL + 10} c={C.coolPipe} />
          <E id="PT12"><PT x={1260} y={RL + 22} v="18°" c={C.coolPipe} /></E>
          <L x={1296} y={RL + 12} t="DN 65" />

          {/* ──── Pendelleitung DN 20 (vertikal links) ──── */}
          <Pipe d={`M1160,${VL} L1160,${RL + 115}`} c={C.coolPipe} w={0.8} dash="2,2" />
          <Pipe d={`M1160,${VL} L1180,${VL}`} c={C.coolPipe} w={0.8} dash="2,2" />
          <text x={1154} y={(VL + RL) / 2} fill={C.coolPipe} fontSize="2.5" opacity="0.35"
            transform={`rotate(-90,1154,${(VL + RL) / 2})`}>Pendelltg. DN 20</text>

          {/* ──── Vertikale VL-Pipe: nach unten zum Kältegestell ──── */}
          <Pipe d={`M1320,${VL} L1320,${VL + 18}`} c={C.coolPipe} w={2.5} />
          <TF x={1328} y={VL + 10} c={C.coolPipe} />
          <Pipe d={`M1320,${VL + 18} L1320,${VL + 36}`} c={C.coolPipe} w={2.5} />
          <TF x={1328} y={VL + 30} c={C.coolPipe} />
          <Pipe d={`M1320,${VL + 36} L1320,${VL + 54}`} c={C.coolPipe} w={2.5} />
          <TF x={1328} y={VL + 48} c={C.coolPipe} />
          <Pipe d={`M1320,${VL + 54} L1320,${VL + 72}`} c={C.coolPipe} w={2.5} />

          {/* ──── Vertikale RL-Pipe: nach unten zum Kältegestell ──── */}
          <Pipe d={`M1320,${RL} L1320,${RL + 18}`} c={C.coolPipe} w={2} dash="4,3" />
          <TF x={1328} y={RL + 10} c={C.coolPipe} />
          <Pipe d={`M1320,${RL + 18} L1320,${RL + 38}`} c={C.coolPipe} w={2} dash="4,3" />
          <TF x={1328} y={RL + 30} c={C.coolPipe} />

          {/* DN labels vertikal */}
          <L x={1304} y={VL + 25} t="DN 65" />
          <L x={1304} y={RL + 22} t="DN 65" />

          {/* ──── Kältegestell / Einhausung (cyan) ──── */}
          <rect x={1170} y={RL + 40} width={240} height={85} rx="5"
            fill={C.coolPipe} fillOpacity="0.03" stroke={C.coolPipe} strokeWidth="1" opacity="0.5" />
          <text x={1290} y={RL + 52} textAnchor="middle" fill={C.coolPipe} fontSize="3.5" fontWeight="600" opacity="0.6">Kältegestell · Einhausung</text>

          {/* ── Interne VL-Verrohrung im Kältegestell ── */}
          <Pipe d={`M1185,${RL + 68} L1210,${RL + 68}`} c={C.coolPipe} w={2.2} />
          <V x={1216} y={RL + 68} />
          <Pipe d={`M1222,${RL + 68} L1238,${RL + 68}`} c={C.coolPipe} w={2.2} />
          {/* Schmutzfänger */}
          <g transform={`translate(1245,${RL + 68})`}>
            <polygon points="-5,-5 5,-5 0,5" fill="none" stroke={C.coolPipe} strokeWidth="0.7" />
            <line x1="0" y1="5" x2="0" y2="9" stroke={C.coolPipe} strokeWidth="0.5" />
          </g>
          <Pipe d={`M1252,${RL + 68} L1280,${RL + 68}`} c={C.coolPipe} w={2.2} />
          <TF x={1268} y={RL + 58} c={C.coolPipe} />

          {/* ── Puffer Kälte Tank (innen im Gestell) ── */}
          <rect x={1280} y={RL + 55} width={80} height={30} rx="6" fill={C.tankFill} stroke={C.coolPipe} strokeWidth="1.2" />
          {/* Innere Schichtung */}
          <line x1={1290} y1={RL + 70} x2={1350} y2={RL + 70} stroke={C.coolPipe} strokeWidth="0.4" strokeDasharray="3,2" opacity="0.3" />
          <text x={1320} y={RL + 64} textAnchor="middle" fill={C.coolPipe} fontSize="3.5" fontWeight="600">Puffer Kälte</text>
          <text x={1320} y={RL + 77} textAnchor="middle" fill={C.coolPipe} fontSize="3">1000 L</text>
          {/* Temp-Sensoren am Puffer */}
          <circle cx={1365} cy={RL + 60} r="2" fill={C.coolPipe} opacity="0.5" />
          <line x1={1365} y1={RL + 60} x2={1378} y2={RL + 60} stroke={C.dim} strokeWidth="0.35" />
          <T x={1380} y={RL + 60} v="37°" c={C.coolPipe} />
          <circle cx={1365} cy={RL + 78} r="2" fill={C.coolPipe} opacity="0.5" />
          <line x1={1365} y1={RL + 78} x2={1378} y2={RL + 78} stroke={C.dim} strokeWidth="0.35" />
          <T x={1380} y={RL + 78} v="18°" c={C.coolPipe} />

          <Pipe d={`M1360,${RL + 68} L1385,${RL + 68}`} c={C.coolPipe} w={2.2} />
          <V x={1392} y={RL + 68} />

          {/* ── Interne RL-Verrohrung ── */}
          <Pipe d={`M1185,${RL + 95} L1230,${RL + 95}`} c={C.coolPipe} w={1.5} dash="3,2" />
          <V x={1236} y={RL + 95} />
          <Pipe d={`M1242,${RL + 95} L1280,${RL + 95}`} c={C.coolPipe} w={1.5} dash="3,2" />
          <Pipe d={`M1360,${RL + 95} L1392,${RL + 95}`} c={C.coolPipe} w={1.5} dash="3,2" />
          <V x={1398} y={RL + 95} />
          <TF x={1268} y={RL + 102} c={C.coolPipe} />

          {/* MAG am Kältegestell */}
          <E id="MAG3"><MAG x={1405} y={RL + 68} /></E>

          {/* P06 + P07 */}
          <E id="P06"><Pump x={1185} y={RL + 68} id="P06" on={false}
            onClick={() => s({ id: 'P06', name: 'Pumpe P06', desc: 'Umwälzpumpe Kühlung Primär', status: 'standby', flow: '12,4 m³/h', dn: 'DN 80' })} /></E>
          <E id="P07"><Pump x={1185} y={RL + 95} id="P07" on={false}
            onClick={() => s({ id: 'P07', name: 'Pumpe P07', desc: 'Umwälzpumpe Kühlung Sekundär', status: 'standby', flow: '8,7 m³/h', dn: 'DN 65' })} /></E>

          {/* DN Labels */}
          <L x={1222} y={RL + 60} t="DN 80" />
          <L x={1222} y={RL + 106} t="DN 80" />

          {/* SV am Kältegestell */}
          <E id="SV3"><SV x={1320} y={RL + 45} label="SV 3" /></E>

          {/* ── Kältespeicher Info-Box (unten) ── */}
          <g transform={`translate(1180,${RL + 128})`}>
            <rect width="130" height="38" rx="3" fill={C.panel} stroke={C.coolPipe} strokeWidth="0.4" opacity="0.8" />
            <text x="65" y="10" textAnchor="middle" fill={C.coolPipe} fontSize="3.5" fontWeight="600">Kältepufferanlage</text>
            <text x="65" y="20" textAnchor="middle" fill={C.text} fontSize="3">Nullenergiebrunnen · 1000 L</text>
            <text x="65" y="29" textAnchor="middle" fill={C.text} fontSize="3">ΔT 5K · SV 3 bar · DN 80</text>
            <text x="65" y="37" textAnchor="middle" fill={C.text} fontSize="3">Druckhalte m. Entgasung</text>
          </g>

          {/* ── Rohre zum Verteiler Kühlung ── */}
          <Pipe d={`M1320,${VL + 72} L1320,${VL + 82} L1420,${VL + 82} L1420,${VL + 96}`} c={C.coolPipe} w={2.5} />
          <Pipe d={`M1320,${RL + 38} L1320,${RL + 42} L1440,${RL + 42} L1440,${VL + 116}`} c={C.coolPipe} w={2} dash="4,3" />

          {/* VL/RL Temps vor Verteiler */}
          <E id="PT13"><PT x={1395} y={VL + 76} v="37°" c={C.coolPipe} /></E>
          <E id="PT14"><PT x={1460} y={RL + 36} v="18°" c={C.coolPipe} /></E>
          <L x={1330} y={VL + 78} t="DN 65" />
          <L x={1330} y={RL + 38} t="DN 65" />

          {/* ── Zuleitung Kälte → rechter Rand ── */}
          <g transform={`translate(1510,${VL - 10})`}>
            <rect width="42" height="24" rx="2" fill={C.panel} stroke={C.coolPipe} strokeWidth="0.35" opacity="0.7" />
            <text x="21" y="9" textAnchor="middle" fill={C.coolPipe} fontSize="2.5">Zuleitung</text>
            <text x="21" y="19" textAnchor="middle" fill={C.coolPipe} fontSize="2.5">Kälte</text>
          </g>
          <Pipe d={`M1420,${VL + 2} L1510,${VL + 2}`} c={C.coolPipe} w={1.5} />

          {/* Verteiler Kühlung */}
          <g className="cursor-pointer" onClick={() => s({ id: 'VK', name: 'Verteiler Kühlung', desc: 'Kühlverteiler mit 3 Kreisen', status: 'standby', temp: '37°C', tempRet: '18°C', dn: 'DN 65' })}>
            <rect x={1385} y={VL + 96} width={130} height={16} rx="3" fill={C.panel} stroke={C.coolPipe} strokeWidth="0.7" strokeOpacity="0.6" />
            <text x={1450} y={VL + 107} textAnchor="middle" fill={C.bright} fontSize="4.5" fontWeight="700" letterSpacing="0.5">VERT. KÜHLUNG</text>
            <rect x={1385} y={VL + 116} width={130} height={12} rx="3" fill={C.panel} stroke={C.coolPipe} strokeWidth="0.5" strokeDasharray="4,2" strokeOpacity="0.4" />
            <text x={1450} y={VL + 125} textAnchor="middle" fill={C.coolPipe} fontSize="3" opacity="0.5">Rücklauf</text>
          </g>

          {/* Kälte-Abgänge mit Mischern */}
          {/* KK1: FBH Kühlung */}
          <HKAbgang vlX={1405} y={VL + 96} rlY={VL + 128} nr={1} vlTemp="37°" rlTemp="18°" on={false} dn="DN 65" />
          <FBH x={1415} y={VL + 18} label="FBH Kühl." />

          {/* KK2: Sat.E Kühlung */}
          <HKAbgang vlX={1450} y={VL + 96} rlY={VL + 128} nr={2} vlTemp="22°" rlTemp="18°" on={false} dn="DN 80" />
          <text x={1461} y={VL + 22} textAnchor="middle" fill={C.dim} fontSize="3">Sat.E</text>
          <text x={1461} y={VL + 30} textAnchor="middle" fill={C.dim} fontSize="3">Kühlung</text>

          {/* KK3: Reserve */}
          <HKAbgang vlX={1495} y={VL + 96} rlY={VL + 128} nr={3} vlTemp="37°" rlTemp="18°" on={false} dn="DN 63" />
          <text x={1506} y={VL + 22} textAnchor="middle" fill={C.dim} fontSize="3">Reserve</text>

          {/* MAG Kälte Verteiler */}
          <E id="MAG4"><MAG x={1420} y={VL + 148} /></E>

          {/* ════════════════════════════════════════
               ANIMIERTE STRÖMUNG
               ════════════════════════════════════════ */}
          {flow && on && <g>
            {/* Erdwärme → WT (VL mit Ventilen) */}
            <Flow path={`M115,${VL} L350,${VL}`} c={C.geoPipe} dur="3s" />
            <Flow path={`M115,${VL} L350,${VL}`} c={C.geoPipe} dur="3s" delay="1.5s" />
            {/* PVT → Puffer */}
            <Flow path={`M207,100 L207,155 L220,155 L220,${VL - 45}`} c={C.warmPipe} dur="2s" />
            {/* Abluft → Puffer */}
            <Flow path={`M455,100 L455,140 L250,140 L250,${VL - 45}`} c={C.warmPipe} dur="2.5s" />
            {/* Puffer PVT → WT */}
            <Flow path={`M259,${VL} L352,${VL}`} c={C.warmPipe} dur="1.5s" />
            {/* WT → WP (mit Ventil) */}
            <Flow path={`M400,${VL} L465,${VL}`} c={C.warmPipe} dur="1.2s" />
            <Flow path={`M400,${VL} L465,${VL}`} c={C.warmPipe} dur="1.2s" delay="0.6s" />
            {/* WP → Puffer HZ (VL mit Ventil) */}
            <Flow path={`M585,${VL} L720,${VL}`} c={C.hotPipe} dur="2s" r={5} />
            <Flow path={`M585,${VL} L720,${VL}`} c={C.hotPipe} dur="2s" delay="1s" r={5} />
            {/* Puffer HZ → Verteiler (mit Ventil + Strangregulier) */}
            <Flow path={`M772,${VL} L895,${VL}`} c={C.hotPipe} dur="1.8s" r={4} />
            {/* Rücklauf WP */}
            <Flow path={`M720,${RL} L585,${RL}`} c={C.coldPipe} dur="2.5s" r={4} />
            {/* RL Erdwärme */}
            <Flow path={`M350,${RL} L115,${RL}`} c={C.geoPipe} dur="3s" r={3} />
          </g>}

          {/* Titel */}
          <text x="775" y="620" textAnchor="middle" fill={C.dim} fontSize="4.5">
            ② Hauptstation + Anschluss an Satellitenhaus – Detail · Darmstadt 2026
          </text>
        </svg>

      {sel && !editMode && <DetailPanel i={sel} onClose={() => setSel(null)} />}
    </div>
    </EditContext.Provider>

    {/* Edit Changes Panel */}
    {editMode && changedItems.length > 0 && <div className="px-3 py-2 bg-[#111620] rounded-lg border border-amber-500/20 text-[10px] font-mono">
      <span className="text-slate-400 text-[11px] font-sans font-medium">Geänderte Positionen:</span>
      <div className="mt-1 grid grid-cols-[auto_1fr_auto] gap-x-4 gap-y-0.5">
        {changedItems.map(([id, v]) => (
          <div key={id} className="contents">
            <span className={`${editSel === id ? 'text-amber-400' : 'text-emerald-400'} cursor-pointer`}
              onClick={() => setEditSel(id)}>{id}</span>
            <span className="text-amber-400">Δx={v.dx} Δy={v.dy}</span>
            <button onClick={() => setOffsets(p => { const n = { ...p }; delete n[id]; return n; })}
              className="text-red-500/60 hover:text-red-400">×</button>
          </div>
        ))}
      </div>
    </div>}

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
        <svg width="12" height="12"><circle cx="6" cy="6" r="5" fill="none" stroke={C.pumpOn} strokeWidth="0.7" /><polygon points="6,3 9,8 3,8" fill={C.pumpOn} /></svg>
        <span className="text-slate-400">Pumpe AN</span>
      </span>
      <span className="flex items-center gap-1.5">
        <svg width="12" height="12"><circle cx="6" cy="6" r="5" fill="none" stroke={C.pumpOff} strokeWidth="0.7" /><polygon points="6,3 9,8 3,8" fill={C.pumpOff} /></svg>
        <span className="text-slate-400">Pumpe AUS</span>
      </span>
      <span className="flex items-center gap-1.5">
        <svg width="12" height="12"><polygon points="3,2 9,6 3,10" fill="none" stroke={C.tankStroke} strokeWidth="0.7" /><polygon points="9,2 3,6 9,10" fill="none" stroke={C.tankStroke} strokeWidth="0.7" /></svg>
        <span className="text-slate-400">Absperrventil</span>
      </span>
      <span className="flex items-center gap-1.5">
        <svg width="12" height="12"><polygon points="6,1 11,11 1,11" fill="none" stroke={C.geoPipe} strokeWidth="0.6" /><line x1="6" y1="11" x2="6" y2="14" stroke={C.geoPipe} strokeWidth="0.5" /></svg>
        <span className="text-slate-400">Schmutzfänger</span>
      </span>
      <span className="flex items-center gap-1.5">
        <svg width="16" height="12"><polygon points="2,2 8,6 2,10" fill="none" stroke={C.accent} strokeWidth="0.6" /><polygon points="14,2 8,6 14,10" fill={C.accent} stroke={C.accent} strokeWidth="0.6" /></svg>
        <span className="text-slate-400">Strangregulierventil</span>
      </span>
      <span className="flex items-center gap-1.5">
        <svg width="14" height="14"><polygon points="4,2 10,2 7,8" fill="none" stroke={C.pumpOn} strokeWidth="0.6" /><circle cx="7" cy="12" r="3" fill={C.tankFill} stroke={C.pumpOn} strokeWidth="0.5" /><text x="7" y="13.5" textAnchor="middle" fill={C.pumpOn} fontSize="4">M</text></svg>
        <span className="text-slate-400">3-Wege-Mischer</span>
      </span>
    </div>
  </div>;
}

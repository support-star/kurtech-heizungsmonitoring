import { useState, useRef, useCallback, useEffect, createContext, useContext } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, ZoomIn, ZoomOut, RotateCcw, Droplets, Pencil, Copy, Check, MousePointer, Trash2, Download } from 'lucide-react';
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

  // ── SVG Download ──
  const downloadSVG = () => {
    const svg = containerRef.current?.querySelector('svg');
    if (!svg) return;
    const clone = svg.cloneNode(true) as SVGSVGElement;
    // Remove animation classes, add white bg for Inkscape
    clone.querySelectorAll('.pp').forEach(el => el.classList.remove('pp'));
    clone.querySelectorAll('animate, animateMotion, animateTransform').forEach(el => el.remove());
    // Set explicit size
    clone.setAttribute('width', '1560');
    clone.setAttribute('height', '640');
    clone.removeAttribute('style');
    const blob = new Blob(
      ['<?xml version="1.0" encoding="UTF-8"?>\n', new XMLSerializer().serializeToString(clone)],
      { type: 'image/svg+xml' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pid-diagram.svg';
    a.click();
    URL.revokeObjectURL(url);
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

  // Layout: Neues 1600×1100 Layout basierend auf SVG-Vorlage

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
        <Button variant="outline" size="sm" onClick={downloadSVG}
          className="border-[#1e2736] text-xs text-slate-400">
          <Download className="w-3.5 h-3.5 mr-1" />SVG
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
        viewBox="0 0 2200 1500"
        style={{
          display: 'block', width: '100%',
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}>
          <Defs />
          {/* Grid */}
          <pattern id="gr" width="50" height="50" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.3" fill="#334155" opacity="0.06" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#gr)" />

          {/* ═══════════ Region Labels ═══════════ */}
          <Rgn x={60} y={370} t="QUELLEN" />
          <Rgn x={280} y={760} t="WÄRMETAUSCHER" />
          <Rgn x={580} y={760} t="ERZEUGUNG" />
          <Rgn x={1080} y={510} t="SPEICHER" />
          <Rgn x={1530} y={600} t="VERTEILUNG" />

          {/* ════════════════════════════════════════════════════════════════
               ABLUFT-WÄRMEPUMPE AUF DACH (oben Mitte, ~700,198)
             ════════════════════════════════════════════════════════════════ */}
          <E id="BOX_ABWP"><g transform="translate(700,210)">
            <rect x={-32} y={-22} width={64} height={44} rx={3} fill={C.panel} stroke={C.border} strokeWidth="1.5" />
            {/* Ventilator-Symbol */}
            <circle cx={0} cy={0} r={16} fill="none" stroke={C.dim} strokeWidth="1.2" />
            <line x1={-10} y1={0} x2={10} y2={0} stroke={C.dim} strokeWidth="1" />
            <line x1={0} y1={-10} x2={0} y2={10} stroke={C.dim} strokeWidth="1" />
            {/* Filter-Symbole */}
            <rect x={-18} y={-38} width={8} height={10} fill={C.coldPipe} fillOpacity="0.3" rx={1} />
            <rect x={-8} y={-38} width={8} height={10} fill={C.hotPipe} fillOpacity="0.3" rx={1} />
          </g></E>
          <text x={700} y={178} textAnchor="middle" fill={C.bright} fontSize="5.5" fontWeight="600">Abluft-Wärmepumpe auf Dach</text>
          <text x={625} y={242} fill={C.dim} fontSize="4.5">th. Leistung: 6,2kW</text>
          <PT x={678} y={265} v="35°" c={C.coldPipe} />
          <PT x={720} y={265} v="40°" c={C.hotPipe} />
          {/* Rohrbegleitheizung */}
          <rect x={750} y={200} width={60} height={22} rx={2} fill={C.panel} stroke="#daa520" strokeWidth="0.6" />
          <text x={780} y={214} textAnchor="middle" fill="#daa520" fontSize="4">Rohrbegl.heizung</text>

          {/* Abluft-WP Leitungen runter */}
          <Pipe d="M700,242 L700,340" c={C.hotPipe} w={2.5} />
          <Pipe d="M682,242 L682,340" c={C.coldPipe} w={2.5} dash="4,3" />
          <Pipe d="M700,340 L700,540" c={C.hotPipe} w={2.5} />
          <Pipe d="M682,340 L682,540" c={C.coldPipe} w={2.5} dash="4,3" />
          <text x={625} y={315} fill={C.dim} fontSize="4">Zuleitung Wärme aus</text>
          <text x={625} y={325} fill={C.dim} fontSize="4">Abluft-Wärmepumpe auf Dach</text>
          <L x={710} y={345} t="35°C" />
          <L x={670} y={345} t="40°C" />
          <L x={710} y={360} t="DN 25" />
          <L x={670} y={360} t="DN 25" />

          {/* ════════════════════════════════════════════════════════════════
               PVT-SOLARKOLLEKTOREN ZULEITUNG (oben links, ~500,238)
             ════════════════════════════════════════════════════════════════ */}
          <text x={410} y={210} fill={C.dim} fontSize="4.5">Zuleitung PVT - Solarkollektoren auf Dach</text>
          <Pipe d="M500,238 L500,390" c={C.geoPipe} w={2.5} />
          <Pipe d="M482,238 L482,390" c={C.geoPipe} w={2.5} dash="4,3" />
          <L x={465} y={310} t="DN 25" />
          <L x={510} y={310} t="DN 25" />

          {/* ════════════════════════════════════════════════════════════════
               ERDWÄRMEFELD ZULEITUNG (links, ~120,400)
             ════════════════════════════════════════════════════════════════ */}
          <text x={60} y={370} fill={C.geoPipe} fontSize="4.5">Zuleitung FVU</text>
          <text x={60} y={380} fill={C.geoPipe} fontSize="4.5">Erdwärmefeld</text>
          <Pipe d="M120,400 L270,400" c={C.geoPipe} glow={C.geoGlow} w={2.5} />
          <TF x={130} y={390} c={C.geoPipe} />
          <TF x={130} y={410} c={C.geoPipe} />
          {/* Absperrventil + Rückschlagventil */}
          <V x={240} y={400} />
          <RV x={260} y={400} />

          {/* ════════════════════════════════════════════════════════════════
               P01 – Quellenkreis (300,550)
             ════════════════════════════════════════════════════════════════ */}
          <E id="P01"><Pump x={300} y={550} id="P01" on={!!on}
            onClick={() => s({ id: 'P01', name: 'Pumpe P01', desc: 'Quellenkreis · 0-10V', status: on ? 'running' : 'standby', flow: '0-10V' })} /></E>
          <TF x={282} y={540} c={C.geoPipe} />
          <TF x={318} y={540} c={C.geoPipe} />
          <V x={270} y={550} />
          <RV x={330} y={550} />
          {/* P01 Leitungen */}
          <Pipe d="M270,400 L270,550 L286,550" c={C.geoPipe} glow={C.geoGlow} w={2.5} />
          <Pipe d="M314,550 L450,550" c={C.geoPipe} w={2.5} />

          {/* ════════════════════════════════════════════════════════════════
               PUFFERSPEICHER 2000L (500, 485-615)
             ════════════════════════════════════════════════════════════════ */}
          <E id="PUFF2000"><g transform="translate(500,550)">
            {/* Standfüße */}
            <line x1={-25} y1={65} x2={-35} y2={83} stroke={C.dim} strokeWidth="1.5" />
            <line x1={25} y1={65} x2={35} y2={83} stroke={C.dim} strokeWidth="1.5" />
            <line x1={-35} y1={83} x2={-40} y2={83} stroke={C.dim} strokeWidth="1.5" />
            <line x1={35} y1={83} x2={40} y2={83} stroke={C.dim} strokeWidth="1.5" />
            {/* Tank */}
            <ellipse cx={0} cy={-65} rx={50} ry={12} fill={C.panel} stroke={C.tankStroke} strokeWidth="1.2" />
            <rect x={-50} y={-65} width={100} height={130} fill={C.tankFill} stroke={C.tankStroke} strokeWidth="1.2" />
            <ellipse cx={0} cy={65} rx={50} ry={12} fill={C.panel} stroke={C.tankStroke} strokeWidth="1.2" />
            {/* Spirale (Wärmetauscher innen) */}
            {[-45,-34,-23,-12,-1,10,21].map(dy => <path key={dy} d={`M-22,${dy} Q0,${dy-7} 22,${dy} Q0,${dy+7} -22,${dy}`} fill="none" stroke={C.coldPipe} strokeWidth="1.2" opacity="0.3" />)}
            {/* Temp-Sensoren */}
            <TF x={0} y={-40} c={C.hotPipe} />
            <TF x={0} y={-5} c={C.warmPipe} />
            <TF x={0} y={30} c={C.coldPipe} />
          </g></E>
          <text x={500} y={473} textAnchor="middle" fill={C.bright} fontSize="5.5" fontWeight="600">Pufferspeicher</text>
          <text x={500} y={483} textAnchor="middle" fill={C.dim} fontSize="4.5">hydr. Trennung/PVT</text>
          <text x={500} y={638} textAnchor="middle" fill={C.dim} fontSize="5" fontWeight="600">2000 Liter</text>

          {/* TF an den Tankwänden */}
          <TF x={420} y={490} c={C.hotPipe} />
          <TF x={580} y={490} c={C.hotPipe} />
          <TF x={680} y={490} c={C.warmPipe} />

          {/* P02 – PVT-Solarkreis (500,400) */}
          <E id="P02"><Pump x={500} y={400} id="P02" on={!!on}
            onClick={() => s({ id: 'P02', name: 'Pumpe P02', desc: 'PVT-Solarkreis', status: on ? 'running' : 'standby' })} /></E>
          <TF x={482} y={390} c={C.geoPipe} />
          <TF x={518} y={390} c={C.geoPipe} />
          <V x={470} y={400} />
          <V x={530} y={400} />
          {/* MAG am P02 */}
          <MAG x={500} y={430} />
          {/* P02 → Puffer VL */}
          <Pipe d="M500,414 L500,485" c={C.hotPipe} w={2.5} />

          {/* ════════════════════════════════════════════════════════════════
               P03 – Solekreis (700,550)
             ════════════════════════════════════════════════════════════════ */}
          <E id="P03"><Pump x={700} y={550} id="P03" on={!!on}
            onClick={() => s({ id: 'P03', name: 'Pumpe P03', desc: 'Solekreis · ΔT 3K · Glycol 30%', status: on ? 'running' : 'standby', flow: '42,1 m³/h' })} /></E>
          <TF x={718} y={540} c={C.hotPipe} />
          <V x={670} y={550} />
          <RV x={730} y={550} />
          <MAG x={718} y={580} />
          <text x={755} y={545} fill={C.dim} fontSize="4">Auslegung: DeltaT: 3K, Glycol: 30%,</text>
          <text x={755} y={556} fill={C.dim} fontSize="4">Massenstrom: 42,1 m³/h</text>
          {/* P03 → Puffer Verbindung */}
          <Pipe d="M550,550 L670,550" c={C.hotPipe} w={2.5} />
          <Pipe d="M450,528 L425,528" c={C.hotPipe} w={2} />
          <Pipe d="M450,550 L425,550" c={C.hotPipe} w={2} />
          <Pipe d="M450,572 L425,572" c={C.hotPipe} w={2} />
          <L x={555} y={520} t="DN 100" />
          <L x={555} y={585} t="DN 100" />

          {/* ════════════════════════════════════════════════════════════════
               WÄRMETAUSCHER 47 kW (350, 785-855)
             ════════════════════════════════════════════════════════════════ */}
          <E id="WT47"><g transform="translate(350,820)">
            <rect x={-28} y={-35} width={56} height={70} rx={2} fill={C.coolPipe} fillOpacity="0.1" stroke={C.coolPipe} strokeWidth="1.5" />
            {/* Platten */}
            {[-25,-15,-5,5,15,25].map(dy => <line key={dy} x1={-16} y1={dy} x2={16} y2={dy} stroke="white" strokeWidth="1" strokeOpacity="0.2" />)}
          </g></E>
          <text x={350} y={870} textAnchor="middle" fill={C.dim} fontSize="5">Wärmetauscher</text>
          <text x={350} y={880} textAnchor="middle" fill={C.dim} fontSize="4.5">Leistung:</text>
          <text x={350} y={892} textAnchor="middle" fill={C.bright} fontSize="5.5" fontWeight="600">47 kW</text>
          <TF x={315} y={795} c={C.geoPipe} />
          <TF x={385} y={795} c={C.hotPipe} />
          <TF x={315} y={845} c={C.coldPipe} />
          <TF x={385} y={845} c={C.coldPipe} />
          <L x={295} y={785} t="DN 80" />
          <L x={390} y={785} t="DN 80" />
          <L x={295} y={858} t="DN 80" />
          <L x={390} y={858} t="DN 80" />

          {/* WT Leitungen → WP */}
          <Pipe d="M378,795 L415,795 L415,808 L605,808" c={C.coldPipe} w={2.5} dash="4,3" />
          <Pipe d="M378,845 L435,845 L435,832 L605,832" c={C.coldPipe} w={2.5} dash="4,3" />
          {/* WT ← Puffer Leitungen */}
          <Pipe d="M322,795 L280,795 L280,615" c={C.geoPipe} w={2.5} />
          <Pipe d="M322,845 L260,845 L260,750" c={C.coldPipe} w={2.5} dash="4,3" />

          {/* ════════════════════════════════════════════════════════════════
               WÄRMEPUMPE 175 kW (650, 785-855)
             ════════════════════════════════════════════════════════════════ */}
          <E id="WP175"><g transform="translate(650,820)">
            <rect x={-45} y={-35} width={90} height={70} rx={3} fill={C.panel} stroke={on ? C.accent : C.border} strokeWidth="2" />
            <text x={0} y={-20} textAnchor="middle" fill={C.bright} fontSize="5.5" fontWeight="700">Wärmepumpe</text>
            <text x={0} y={-8} textAnchor="middle" fill={C.dim} fontSize="4">Nenn-Wärmeleistung:</text>
            <text x={0} y={4} textAnchor="middle" fill={C.accent} fontSize="5">175 kW</text>
            <text x={0} y={18} textAnchor="middle" fill={C.dim} fontSize="4">Elektrische Leistungsaufnahme:</text>
            <text x={0} y={30} textAnchor="middle" fill={C.accent} fontSize="5">38,9 kW</text>
          </g></E>
          <text x={650} y={862} textAnchor="middle" fill={C.dim} fontSize="4">400 V</text>
          <text x={585} y={778} fill={C.dim} fontSize="4">Ansprechdruck SV: 3,5 bar</text>

          {/* WP → P04 Leitungen */}
          <Pipe d="M695,808 L735,808 L735,668 L840,668" c={C.hotPipe} glow={C.hotGlow} w={2.5} />
          <Pipe d="M695,832 L755,832 L755,692 L840,692" c={C.hotPipe} w={2.5} />

          {/* ════════════════════════════════════════════════════════════════
               P04 – Heizkreis primär (850,680)
             ════════════════════════════════════════════════════════════════ */}
          <E id="P04"><Pump x={850} y={680} id="P04" on={!!on}
            onClick={() => s({ id: 'P04', name: 'Pumpe P04', desc: 'Heizkreis primär · DN 100', status: on ? 'running' : 'standby', temp: vl + '°C' })} /></E>
          <PT x={872} y={675} v={vl + '°'} c={C.hotPipe} />
          <L x={872} y={688} t="DN 100" />
          <V x={820} y={680} />
          <RV x={920} y={680} />
          <text x={850} y={720} textAnchor="middle" fill={C.dim} fontSize="4">Anschlussstutzen mit Absperrorgan und Storz-C Kupplung</text>
          <PT x={820} y={725} v={rl + '°'} c={C.coldPipe} />
          <L x={820} y={738} t="38°C" />

          {/* P04 → Puffer 1500L */}
          <Pipe d="M864,680 L1100,578" c={C.hotPipe} glow={C.hotGlow} w={2.5} />

          {/* ════════════════════════════════════════════════════════════════
               PUFFERSPEICHER 1500L HEIZUNG (1150, 535-665)
             ════════════════════════════════════════════════════════════════ */}
          <E id="PUFF1500"><g transform="translate(1150,600)">
            {/* Standfüße */}
            <line x1={-25} y1={65} x2={-35} y2={83} stroke={C.dim} strokeWidth="1.5" />
            <line x1={25} y1={65} x2={35} y2={83} stroke={C.dim} strokeWidth="1.5" />
            <line x1={-35} y1={83} x2={-40} y2={83} stroke={C.dim} strokeWidth="1.5" />
            <line x1={35} y1={83} x2={40} y2={83} stroke={C.dim} strokeWidth="1.5" />
            {/* Tank */}
            <ellipse cx={0} cy={-65} rx={50} ry={12} fill={C.panel} stroke={C.tankStroke} strokeWidth="1.2" />
            <rect x={-50} y={-65} width={100} height={130} fill={C.tankFill} stroke={C.tankStroke} strokeWidth="1.2" />
            <ellipse cx={0} cy={65} rx={50} ry={12} fill={C.panel} stroke={C.tankStroke} strokeWidth="1.2" />
            {/* Temp-Sensoren */}
            <TF x={0} y={-40} c={C.hotPipe} />
            <TF x={0} y={-5} c={C.warmPipe} />
            <TF x={0} y={30} c={C.coldPipe} />
          </g></E>
          <text x={1150} y={523} textAnchor="middle" fill={C.bright} fontSize="5.5" fontWeight="600">Pufferspeicher</text>
          <text x={1150} y={533} textAnchor="middle" fill={C.dim} fontSize="4.5">Heizung</text>
          <text x={1150} y={688} textAnchor="middle" fill={C.dim} fontSize="5" fontWeight="600">1500 Liter</text>

          {/* Puffer Temp-Anzeigen */}
          <PT x={1215} y={560} v={po + '°'} c={C.hotPipe} />
          <PT x={1215} y={595} v={pm + '°'} c={C.warmPipe} />
          <PT x={1215} y={630} v={pu + '°'} c={C.coldPipe} />
          <L x={1205} y={570} t="DN 80" />
          <L x={1205} y={640} t="DN 80" />

          {/* Puffer 1500 → Verteiler */}
          <Pipe d="M1200,600 L1535,650" c={C.hotPipe} glow={C.hotGlow} w={2.5} />

          {/* ════════════════════════════════════════════════════════════════
               P05 – Verteilerkreis (1400,580)
             ════════════════════════════════════════════════════════════════ */}
          <E id="P05"><Pump x={1400} y={580} id="P05" on={!!on}
            onClick={() => s({ id: 'P05', name: 'Pumpe P05', desc: 'Verteilerkreis · 0-10V', status: on ? 'running' : 'standby', flow: '0-10V' })} /></E>
          <TF x={1400} y={600} c={C.coldPipe} />
          <V x={1350} y={580} />
          {/* P05 → Verteiler */}
          <Pipe d="M1414,580 L1535,628" c={C.hotPipe} w={2.5} />

          {/* ════════════════════════════════════════════════════════════════
               VERTEILER HEIZUNG (1600, 628-672)
             ════════════════════════════════════════════════════════════════ */}
          <E id="VERT"><g transform="translate(1600,650)">
            <rect x={-65} y={-22} width={130} height={44} rx={3} fill={C.panel} stroke={C.border} strokeWidth="2" />
            <text x={0} y={5} textAnchor="middle" fill={C.bright} fontSize="6.5" fontWeight="700">VERTEILER HEIZUNG</text>
          </g></E>

          <TF x={1280} y={560} c={C.hotPipe} />
          <TF x={1500} y={620} c={C.hotPipe} />
          <TF x={820} y={620} c={C.coldPipe} />
          <TF x={1050} y={620} c={C.coldPipe} />

          {/* ════════════════════════════════════════════════════════════════
               ANSCHLUSS WEITERE STOCKWERKE (1600,260-445)
             ════════════════════════════════════════════════════════════════ */}
          <text x={1620} y={260} fill={C.dim} fontSize="5">Anschluss weitere Stockwerke</text>
          <Pipe d="M1600,295 L1600,628" c={C.hotPipe} w={2.5} />
          <Pipe d="M1620,295 L1620,628" c={C.coldPipe} w={2.5} dash="4,3" />
          <L x={1572} y={370} t="DN 65" />
          <L x={1625} y={370} t="DN 65" />
          <TF x={1600} y={355} c={C.hotPipe} />
          <TF x={1620} y={355} c={C.coldPipe} />
          <V x={1600} y={400} r={90} />
          <V x={1620} y={400} r={90} />

          {/* ════════════════════════════════════════════════════════════════
               ZULEITUNG SATELLITENHAUS E (rechts, 1850,500)
             ════════════════════════════════════════════════════════════════ */}
          <text x={1850} y={475} fill={C.dim} fontSize="5">Zuleitung Heizung zu Satellitenhaus E</text>
          <Pipe d="M1665,650 L1710,650 L1710,500 L1850,500" c={C.hotPipe} w={2.5} />
          <Pipe d="M1665,672 L1730,672 L1730,512 L1850,512" c={C.coldPipe} w={2.5} dash="4,3" />
          <L x={1795} y={494} t="DN 50" />
          <L x={1795} y={520} t="DN 50" />
          <TF x={1822} y={490} c={C.hotPipe} />
          <TF x={1822} y={522} c={C.coldPipe} />
          <V x={1808} y={500} />
          <V x={1808} y={512} />

          {/* ════════════════════════════════════════════════════════════════
               DRUCKHALTE-/ENTGASUNGSSTATION (unten, ~1400,770)
             ════════════════════════════════════════════════════════════════ */}
          <E id="DRUCK"><g transform="translate(1400,800)">
            <rect x={-45} y={-30} width={90} height={60} rx={3} fill={C.panel} stroke={C.border} strokeWidth="1" />
            <circle cx={-20} cy={-8} r={10} fill="none" stroke={C.dim} strokeWidth="0.8" />
            <rect x={-28} y={-14} width={8} height={10} fill={C.coolPipe} fillOpacity="0.2" stroke={C.dim} strokeWidth="0.4" />
            <rect x={12} y={-18} width={16} height={32} rx={2} fill="none" stroke={C.dim} strokeWidth="0.8" />
          </g></E>
          <text x={1400} y={845} textAnchor="middle" fill={C.dim} fontSize="4.5">Druckhalte-, Entgasungs- und Nachspeisestation</text>

          {/* Aufbereitung */}
          <E id="AUFB"><g transform="translate(1600,800)">
            <rect x={-32} y={-18} width={64} height={36} rx={2} fill={C.panel} stroke={C.border} strokeWidth="0.8" />
            <text x={0} y={5} textAnchor="middle" fill={C.dim} fontSize="4.5">Aufbereitung</text>
          </g></E>

          {/* Systemtrenner BA */}
          <E id="SYST"><g transform="translate(1800,800)">
            <rect x={-22} y={-11} width={44} height={22} rx={2} fill={C.panel} stroke={C.border} strokeWidth="0.8" />
            <text x={0} y={3} textAnchor="middle" fill={C.dim} fontSize="4">Systemtrenner BA</text>
          </g></E>

          {/* Anschluss TW */}
          <text x={1950} y={800} fill={C.geoPipe} fontSize="4.5">Anschluss TW</text>
          <Pipe d="M1822,800 L1920,800" c={C.geoPipe} w={1.5} />

          {/* Druckstation Leitungen */}
          <Pipe d="M1710,800 L1355,800" c={C.coldPipe} w={1.5} />
          <Pipe d="M1445,800 L1568,800" c={C.coldPipe} w={1.5} />
          <Pipe d="M1632,800 L1778,800" c={C.coldPipe} w={1.5} />

          {/* ════════════════════════════════════════════════════════════════
               MAG-BEHÄLTER
             ════════════════════════════════════════════════════════════════ */}
          <MAG x={450} y={618} />
          <MAG x={680} y={618} />

          {/* ════════════════════════════════════════════════════════════════
               TEMPERATUREN (prominent)
             ════════════════════════════════════════════════════════════════ */}
          <PT x={1510} y={662} v="30°" c={C.coldPipe} />
          <PT x={1680} y={638} v={vl + '°'} c={C.hotPipe} />

          {/* ════════════════════════════════════════════════════════════════
               FLOW ANIMATION
             ════════════════════════════════════════════════════════════════ */}
          {flow && on && <g>
            {/* Erdwärme → P01 → Puffer */}
            <Flow path="M120,400 L270,400 L270,550 L450,550" c={C.geoPipe} dur="3s" r={4} />
            {/* PVT → Puffer */}
            <Flow path="M500,238 L500,485" c={C.geoPipe} dur="2.5s" r={3} />
            {/* Abluft → Puffer */}
            <Flow path="M700,242 L700,540" c={C.hotPipe} dur="3s" r={3} />
            {/* WP → P04 → Puffer 1500 */}
            <Flow path="M695,808 L735,808 L735,668 L850,680 L1100,578" c={C.hotPipe} dur="4s" r={4} />
            {/* Puffer 1500 → Verteiler */}
            <Flow path="M1200,600 L1535,650" c={C.hotPipe} dur="2.5s" r={4} />
            {/* Abluft kalt */}
            <Flow path="M682,340 L682,540" c={C.coldPipe} dur="3s" r={3} />
          </g>}

          {/* ═══════════ Titel ═══════════ */}
          <circle cx={72} cy={1242} r={16} fill="none" stroke={C.dim} strokeWidth="1.5" />
          <text x={80} y={1250} fill={C.bright} fontSize="12" fontWeight="700">2</text>
          <text x={105} y={1250} fill={C.bright} fontSize="10" fontWeight="700">Hauptstation + Anschluss an Satellitenhaus - Detail</text>
          <text x={105} y={1268} fill={C.dim} fontSize="5">Darmstadt 2026 · KurTech</text>
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

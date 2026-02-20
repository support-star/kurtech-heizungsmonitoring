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
        viewBox="0 0 1600 1100"
        style={{
          display: 'block', width: '100%',
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}>
          <Defs />
          {/* Grid */}
          <pattern id="gr" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.3" fill="#334155" opacity="0.08" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#gr)" />

          {/* ═══════════════════ Region Labels ═══════════════════ */}
          <Rgn x={40} y={390} t="QUELLEN" />
          <Rgn x={230} y={620} t="WÄRMETAUSCHER" />
          <Rgn x={480} y={555} t="ERZEUGUNG" />
          <Rgn x={860} y={440} t="SPEICHER" />
          <Rgn x={1120} y={555} t="VERTEILUNG" />

          {/* ════════════════════════════════════════════════════════
               ABLUFT-WÄRMEPUMPE AUF DACH (oben Mitte)
             ════════════════════════════════════════════════════════ */}
          <E id="BOX_ABWP"><g transform="translate(580,120)">
            <rect x={-40} y={-30} width={80} height={60} rx={3} fill={C.panel} stroke={C.border} strokeWidth="1.5" />
            <circle cx={0} cy={-5} r={18} fill="none" stroke={C.dim} strokeWidth="1.5" />
            <line x1={-12} y1={-5} x2={12} y2={-5} stroke={C.dim} strokeWidth="1.5" />
            <line x1={0} y1={-17} x2={0} y2={7} stroke={C.dim} strokeWidth="1.5" />
            {/* Kalt/Warm Anzeige */}
            <rect x={-23} y={-48} width={10} height={11} fill={C.coldPipe} rx={1} />
            <rect x={-11} y={-48} width={10} height={11} fill={C.hotPipe} rx={1} />
            <text x={0} y={45} textAnchor="middle" fill={C.bright} fontSize="4.5">Abluft-Wärmepumpe</text>
            <text x={0} y={56} textAnchor="middle" fill={C.dim} fontSize="4">auf Dach</text>
            <text x={-70} y={35} textAnchor="middle" fill={C.dim} fontSize="4">th. Leistung: 6,2kW</text>
          </g></E>

          {/* Rohrbegleitheizung */}
          <E id="RBHZ"><g transform="translate(680,100)">
            <rect x={-30} y={-15} width={60} height={30} rx={2} fill={C.panel} stroke="#daa520" strokeWidth="0.8" />
            <text x={0} y={3} textAnchor="middle" fill="#daa520" fontSize="4">Rohrbegl.heizung</text>
          </g></E>

          {/* Abluft-WP Leitungen (VL rot runter, RL blau) */}
          <Pipe d="M620,150 L620,350" c={C.hotPipe} w={2.5} />
          <Pipe d="M580,150 L580,350" c={C.coldPipe} w={2.5} dash="4,3" />
          <V x={620} y={220} r={90} />
          <V x={580} y={220} r={90} />
          <PT x={640} y={195} v="40°" c={C.hotPipe} />
          <PT x={548} y={195} v="35°" c={C.coldPipe} />
          <L x={635} y={230} t="DN 25" />
          <L x={548} y={230} t="DN 25" />
          {/* Flussrichtungspfeile */}
          <polygon points="620,160 615,170 625,170" fill={C.hotPipe} />
          <polygon points="580,240 575,230 585,230" fill={C.coldPipe} />

          {/* ════════════════════════════════════════════════════════
               PVT-SOLARKOLLEKTOREN ZULEITUNG (oben links)
             ════════════════════════════════════════════════════════ */}
          <E id="PVT"><text x={220} y={215} fill={C.dim} fontSize="4">Zuleitung</text>
          <text x={220} y={227} fill={C.dim} fontSize="4">PVT –</text>
          <text x={220} y={239} fill={C.dim} fontSize="4">Solarkollektoren</text>
          <text x={220} y={251} fill={C.dim} fontSize="4">auf Dach</text></E>
          <Pipe d="M280,180 L280,250" c={C.geoPipe} w={2.5} />
          <Pipe d="M280,250 L280,270" c={C.geoPipe} w={2.5} />
          <Pipe d="M280,294 L280,345" c={C.hotPipe} w={2.5} />
          <Pipe d="M300,180 L300,345" c={C.coldPipe} w={2.5} dash="4,3" />
          <V x={280} y={235} r={90} />
          <RV x={280} y={255} rot={-90} />
          <TF x={265} y={250} c={C.geoPipe} />
          <TF x={312} y={250} c={C.coldPipe} />
          <L x={305} y={240} t="DN 65" />

          {/* ════════════════════════════════════════════════════════
               ERDWÄRMEFELD ZULEITUNG (links)
             ════════════════════════════════════════════════════════ */}
          <E id="ERD_ZU"><text x={40} y={405} fill={C.geoPipe} fontSize="4">Zuleitung FVU</text>
          <text x={40} y={417} fill={C.geoPipe} fontSize="4">Niedrigtemperatur aus</text>
          <text x={40} y={429} fill={C.geoPipe} fontSize="4">Erdwärmefeld</text></E>
          <Pipe d="M50,420 L120,420 L120,380 L186,380" c={C.geoPipe} glow={C.geoGlow} w={2.5} />
          <V x={135} y={380} />
          <RV x={155} y={380} />
          <TF x={100} y={420} c={C.geoPipe} />
          <TF x={100} y={375} c={C.geoPipe} />

          {/* Rücklauf Erdwärmefeld (blau) */}
          <Pipe d="M214,750 L120,750 L120,460 L50,460" c={C.coldPipe} w={2.5} dash="4,3" />
          <V x={135} y={460} />
          <RV x={155} y={460} />
          <text x={40} y={475} fill={C.coldPipe} fontSize="4">Rücklauf</text>

          {/* ════════════════════════════════════════════════════════
               PUFFERSPEICHER 2000L (hydr. Trennung / PVT)
             ════════════════════════════════════════════════════════ */}
          <E id="PUFF2000"><g transform="translate(280,420)">
            {/* Standfüße */}
            <line x1={-35} y1={75} x2={-45} y2={95} stroke={C.dim} strokeWidth="1.5" />
            <line x1={35} y1={75} x2={45} y2={95} stroke={C.dim} strokeWidth="1.5" />
            <line x1={-45} y1={95} x2={-50} y2={95} stroke={C.dim} strokeWidth="1.5" />
            <line x1={45} y1={95} x2={50} y2={95} stroke={C.dim} strokeWidth="1.5" />
            {/* Tankform */}
            <ellipse cx={0} cy={-75} rx={55} ry={15} fill={C.panel} stroke={C.tankStroke} strokeWidth="1.5" />
            <rect x={-55} y={-75} width={110} height={150} fill={C.tankFill} stroke={C.tankStroke} strokeWidth="1.5" />
            <ellipse cx={0} cy={75} rx={55} ry={15} fill={C.panel} stroke={C.tankStroke} strokeWidth="1.5" />
            {/* Spirale/Wärmetauscher */}
            {[-50,-35,-20,-5,10,25,40].map(dy => <path key={dy} d={`M-30,${dy} Q0,${dy-10} 30,${dy} Q0,${dy+10} -30,${dy}`} fill="none" stroke={C.coldPipe} strokeWidth="1.5" opacity="0.4" />)}
            {/* Temperatursensoren */}
            <TF x={0} y={-55} c={C.hotPipe} />
            <TF x={0} y={-10} c={C.warmPipe} />
            <TF x={0} y={35} c={C.coldPipe} />
            <text x={0} y={-95} textAnchor="middle" fill={C.bright} fontSize="5" fontWeight="600">Pufferspeicher</text>
            <text x={0} y={-83} textAnchor="middle" fill={C.dim} fontSize="4.5">hydr. Trennung/PVT</text>
            <text x={0} y={105} textAnchor="middle" fill={C.dim} fontSize="4.5">2000 Liter</text>
          </g></E>

          {/* Puffer Temp-Anzeigen */}
          <PT x={360} y={365} v={po + '°'} c={C.hotPipe} />
          <PT x={360} y={410} v={pm + '°'} c={C.warmPipe} />
          <PT x={360} y={455} v={pu + '°'} c={C.coldPipe} />

          {/* P01 – Quellenkreis */}
          <E id="P01"><Pump x={200} y={420} id="P01" on={!!on}
            onClick={() => s({ id: 'P01', name: 'Pumpe P01', desc: 'Quellenkreis · 0-10V', status: on ? 'running' : 'standby', flow: '0-10V' })} /></E>
          <Pipe d="M214,420 L225,420" c={C.geoPipe} w={2} />
          <L x={205} y={400} t="0-10V" />

          {/* P02 – PVT-Solarkreis */}
          <E id="P02"><Pump x={280} y={280} id="P02" on={!!on}
            onClick={() => s({ id: 'P02', name: 'Pumpe P02', desc: 'PVT-Solarkreis', status: on ? 'running' : 'standby' })} /></E>
          <MAG x={340} y={280} />
          <L x={305} y={275} t="DN 65" />
          <L x={350} y={275} t="DN 65" />

          {/* P03 – Solekreis */}
          <E id="P03"><Pump x={420} y={420} id="P03" on={!!on}
            onClick={() => s({ id: 'P03', name: 'Pumpe P03', desc: 'Solekreis · ΔT 3K · Glycol 30%', status: on ? 'running' : 'standby', flow: '42,1 m³/h' })} /></E>
          <text x={465} y={410} fill={C.dim} fontSize="3.5">Auslegung:</text>
          <text x={465} y={420} fill={C.dim} fontSize="3.5">DeltaT: 3K</text>
          <text x={465} y={430} fill={C.dim} fontSize="3.5">Glycol: 30%</text>
          <text x={465} y={440} fill={C.dim} fontSize="3.5">Massenstrom: 42,1 m³/h</text>

          {/* MAG bei P03 */}
          <MAG x={380} y={380} />

          {/* P03 Leitungen */}
          <Pipe d="M335,380 L406,380" c={C.hotPipe} w={2.5} />
          <Pipe d="M406,380 L406,406" c={C.hotPipe} w={2.5} />
          <Pipe d="M335,420 L406,420" c={C.coldPipe} w={2.5} dash="4,3" />
          <Pipe d="M406,420 L406,434" c={C.coldPipe} w={2.5} dash="4,3" />
          <L x={355} y={375} t="DN 65" />
          <L x={350} y={455} t="DN 100" />
          <L x={350} y={495} t="DN 100" />

          {/* ════════════════════════════════════════════════════════
               WÄRMETAUSCHER 47 kW
             ════════════════════════════════════════════════════════ */}
          <E id="WT47"><g transform="translate(280,680)">
            <rect x={-35} y={-50} width={70} height={100} rx={3} fill={C.coolPipe} fillOpacity="0.08" stroke={C.coolPipe} strokeWidth="1.5" />
            {/* Platten */}
            {[-35,-20,-5,10,25,40].map(dy => <line key={dy} x1={-20} y1={dy} x2={20} y2={dy} stroke={C.coolPipe} strokeWidth="1" strokeOpacity="0.3" />)}
            <text x={0} y={68} textAnchor="middle" fill={C.dim} fontSize="4.5">Wärmetauscher</text>
            <text x={0} y={80} textAnchor="middle" fill={C.dim} fontSize="4">Leistung:</text>
            <text x={0} y={92} textAnchor="middle" fill={C.dim} fontSize="4.5">47 kW</text>
          </g></E>
          <TF x={235} y={645} c={C.geoPipe} />
          <TF x={325} y={645} c={C.hotPipe} />
          <TF x={235} y={715} c={C.coldPipe} />
          <TF x={325} y={715} c={C.coldPipe} />

          {/* Puffer → WT Leitungen */}
          <Pipe d="M245,495 L245,630" c={C.geoPipe} w={2.5} />
          <Pipe d="M315,495 L315,630" c={C.hotPipe} w={2.5} />
          <L x={200} y={640} t="DN 80" />
          <L x={325} y={640} t="DN 80" />

          {/* WT → WP & Rücklauf */}
          <Pipe d="M245,730 L245,620 L490,620" c={C.coldPipe} w={2.5} dash="4,3" />
          <Pipe d="M315,730 L315,750 L214,750" c={C.coldPipe} w={2.5} dash="4,3" />
          <L x={200} y={755} t="DN 80" />
          <L x={325} y={755} t="DN 80" />

          {/* ════════════════════════════════════════════════════════
               WÄRMEPUMPE 175 kW
             ════════════════════════════════════════════════════════ */}
          <E id="WP175"><g transform="translate(550,620)">
            <rect x={-60} y={-50} width={120} height={100} rx={5} fill={C.panel} stroke={on ? C.accent : C.border} strokeWidth="2" />
            <text x={0} y={-25} textAnchor="middle" fill={C.bright} fontSize="5.5" fontWeight="700">Wärmepumpe</text>
            <text x={0} y={-10} textAnchor="middle" fill={C.dim} fontSize="4">Nenn-Wärmeleistung:</text>
            <text x={0} y={2} textAnchor="middle" fill={C.accent} fontSize="5">175 kW</text>
            <text x={0} y={16} textAnchor="middle" fill={C.dim} fontSize="4">Elektrische</text>
            <text x={0} y={28} textAnchor="middle" fill={C.dim} fontSize="4">Leistungsaufnahme:</text>
            <text x={0} y={40} textAnchor="middle" fill={C.accent} fontSize="5">38,9 kW</text>
            <text x={0} y={62} textAnchor="middle" fill={C.dim} fontSize="4">400 V</text>
          </g></E>
          <TF x={480} y={590} c={C.coldPipe} />
          <TF x={480} y={650} c={C.coldPipe} />
          <TF x={620} y={590} c={C.hotPipe} />
          <TF x={620} y={650} c={C.hotPipe} />
          <L x={500} y={465} t="DN 100" />
          <L x={500} y={610} t="DN 100" />

          {/* WP Ausgang → P04 */}
          <Pipe d="M610,620 L700,620 L700,534" c={C.hotPipe} glow={C.hotGlow} w={2.5} />

          {/* ════════════════════════════════════════════════════════
               P04 – Heizkreis primär
             ════════════════════════════════════════════════════════ */}
          <E id="P04"><Pump x={700} y={520} id="P04" on={!!on}
            onClick={() => s({ id: 'P04', name: 'Pumpe P04', desc: 'Heizkreis primär', status: on ? 'running' : 'standby', temp: vl + '°C' })} /></E>
          <PT x={722} y={560} v={vl + '°'} c={C.hotPipe} />
          <text x={640} y={500} fill={C.dim} fontSize="3.5">Anschlusstutzen mit</text>
          <text x={640} y={510} fill={C.dim} fontSize="3.5">Absperrorgan und</text>
          <text x={640} y={520} fill={C.dim} fontSize="3.5">Storz-C Kupplung</text>

          {/* Ansprechdruck SV */}
          <E id="SV_35"><g transform="translate(650,450)">
            <line x1={0} y1={0} x2={0} y2={30} stroke={C.dim} strokeWidth="0.8" />
            <polygon points="-4,25 4,25 0,33" fill={C.dim} />
            <text x={10} y={15} fill={C.dim} fontSize="4">Ansprechdruck</text>
            <text x={10} y={27} fill={C.dim} fontSize="4">SV : 3,5</text>
            <text x={10} y={39} fill={C.dim} fontSize="4">bar</text>
          </g></E>

          {/* P04 → Pufferspeicher 1500L */}
          <Pipe d="M700,506 L700,480 L750,480" c={C.hotPipe} glow={C.hotGlow} w={2.5} />
          <Pipe d="M750,480 L870,480 L870,520" c={C.hotPipe} glow={C.hotGlow} w={2.5} />
          <V x={750} y={480} />
          <V x={780} y={480} />
          <L x={770} y={470} t="DN 100" />
          <PT x={832} y={507} v={vl + '°'} c={C.hotPipe} />

          {/* Rücklauf WP */}
          <Pipe d="M870,585 L870,620 L700,620" c={C.coldPipe} w={2.5} dash="4,3" />
          <PT x={832} y={555} v={rl + '°'} c={C.coldPipe} />
          <L x={830} y={595} t="DN 80" />

          {/* ════════════════════════════════════════════════════════
               PUFFERSPEICHER 1500L HEIZUNG
             ════════════════════════════════════════════════════════ */}
          <E id="PUFF1500"><g transform="translate(920,520)">
            {/* Standfüße */}
            <line x1={-30} y1={70} x2={-40} y2={90} stroke={C.dim} strokeWidth="1.5" />
            <line x1={30} y1={70} x2={40} y2={90} stroke={C.dim} strokeWidth="1.5" />
            <line x1={-40} y1={90} x2={-45} y2={90} stroke={C.dim} strokeWidth="1.5" />
            <line x1={40} y1={90} x2={45} y2={90} stroke={C.dim} strokeWidth="1.5" />
            {/* Tankform */}
            <ellipse cx={0} cy={-65} rx={50} ry={12} fill={C.panel} stroke={C.tankStroke} strokeWidth="1.5" />
            <rect x={-50} y={-65} width={100} height={130} fill={C.tankFill} stroke={C.tankStroke} strokeWidth="1.5" />
            <ellipse cx={0} cy={65} rx={50} ry={12} fill={C.panel} stroke={C.tankStroke} strokeWidth="1.5" />
            {/* Temperatursensoren */}
            <TF x={0} y={-45} c={C.hotPipe} />
            <TF x={0} y={-5} c={C.warmPipe} />
            <TF x={0} y={35} c={C.coldPipe} />
            <text x={0} y={-82} textAnchor="middle" fill={C.bright} fontSize="5" fontWeight="600">Pufferspeicher</text>
            <text x={0} y={-70} textAnchor="middle" fill={C.dim} fontSize="4.5">Heizung</text>
            <text x={0} y={90} textAnchor="middle" fill={C.dim} fontSize="4.5">1500 Liter</text>
          </g></E>

          {/* Puffer 1500 Temp-Anzeigen */}
          <PT x={990} y={475} v={po + '°'} c={C.hotPipe} />
          <PT x={990} y={515} v={pm + '°'} c={C.warmPipe} />
          <PT x={990} y={555} v={pu + '°'} c={C.coldPipe} />

          {/* MAG 50l */}
          <MAG x={1020} y={520} />
          <text x={1020} y={545} textAnchor="middle" fill={C.dim} fontSize="3.5">MAG</text>
          <text x={1020} y={555} textAnchor="middle" fill={C.dim} fontSize="3.5">50l</text>

          {/* Puffer → Verteiler Leitungen */}
          <Pipe d="M920,455 L920,480" c={C.hotPipe} w={2.5} />
          <Pipe d="M920,585 L920,620" c={C.coldPipe} w={2.5} dash="4,3" />
          <Pipe d="M970,520 L1080,520" c={C.hotPipe} glow={C.hotGlow} w={2.5} />
          <Pipe d="M970,580 L1080,580" c={C.coldPipe} w={2.5} dash="4,3" />
          <L x={1000} y={510} t="DN 80" />
          <L x={1000} y={595} t="DN 80" />

          {/* P05 – Verteilerkreis */}
          <E id="P05"><Pump x={1100} y={480} id="P05" on={!!on}
            onClick={() => s({ id: 'P05', name: 'Pumpe P05', desc: 'Verteilerkreis · 0-10V', status: on ? 'running' : 'standby', flow: '0-10V' })} /></E>
          <V x={1060} y={480} />
          <V x={1140} y={480} />
          <Pipe d="M1080,480 L1080,466" c={C.hotPipe} w={2} />
          <Pipe d="M1114,480 L1180,480" c={C.hotPipe} w={2.5} />
          <L x={1088} y={465} t="0-10V" />
          <L x={1130} y={470} t="DN 50" />
          <L x={1130} y={495} t="DN 50" />

          {/* Verteiler Anschlüsse */}
          <Pipe d="M1080,595 L1080,645" c={C.hotPipe} w={2.5} />
          <Pipe d="M1080,680 L1080,700" c={C.coldPipe} w={2.5} dash="4,3" />
          <PT x={1040} y={595} v="30°" c={C.coldPipe} />

          {/* ════════════════════════════════════════════════════════
               VERTEILER HEIZUNG
             ════════════════════════════════════════════════════════ */}
          <E id="VERT"><g transform="translate(1180,620)">
            <rect x={-100} y={-25} width={200} height={50} rx={3} fill={C.panel} stroke={C.border} strokeWidth="2" />
            <text x={0} y={5} textAnchor="middle" fill={C.bright} fontSize="6" fontWeight="700">VERTEILER HEIZUNG</text>
          </g></E>
          <TF x={1100} y={585} c={C.hotPipe} />
          <TF x={1260} y={585} c={C.hotPipe} />
          <TF x={1100} y={655} c={C.coldPipe} />
          <TF x={1260} y={655} c={C.coldPipe} />

          {/* ════════════════════════════════════════════════════════
               HEIZKREISE AUS VERTEILER
             ════════════════════════════════════════════════════════ */}
          {/* Anschluss weitere Stockwerke (ganz rechts vom Verteiler) */}
          <Pipe d="M1250,250 L1250,595" c={C.hotPipe} w={2.5} />
          <Pipe d="M1280,250 L1280,645" c={C.coldPipe} w={2.5} dash="4,3" />
          <V x={1250} y={380} r={90} />
          <V x={1280} y={380} r={90} />
          <TF x={1250} y={350} c={C.hotPipe} />
          <TF x={1280} y={350} c={C.coldPipe} />
          <TF x={1250} y={420} c={C.hotPipe} />
          <TF x={1280} y={420} c={C.coldPipe} />
          <L x={1235} y={325} t="DN 65" />
          <L x={1290} y={325} t="DN 65" />
          <text x={1305} y={280} fill={C.dim} fontSize="4">Anschluss</text>
          <text x={1305} y={292} fill={C.dim} fontSize="4">weitere</text>
          <text x={1305} y={304} fill={C.dim} fontSize="4">Stockwerke</text>

          {/* ════════════════════════════════════════════════════════
               ZULEITUNG SATELLITENHAUS E (rechts)
             ════════════════════════════════════════════════════════ */}
          <E id="SAT"><text x={1400} y={505} fill={C.dim} fontSize="4">Zuleitung Heizung</text>
          <text x={1400} y={517} fill={C.dim} fontSize="4">zu Satellitenhaus E</text></E>
          <Pipe d="M1380,520 L1500,520 L1500,400" c={C.hotPipe} w={2.5} />
          <Pipe d="M1380,580 L1520,580 L1520,400" c={C.coldPipe} w={2.5} dash="4,3" />
          <TF x={1420} y={520} c={C.hotPipe} />
          <TF x={1420} y={580} c={C.coldPipe} />
          <L x={1440} y={535} t="DN 50" />
          <L x={1440} y={595} t="DN 50" />

          {/* ════════════════════════════════════════════════════════
               DRUCKHALTE- UND ENTGASUNGSSTATION
             ════════════════════════════════════════════════════════ */}
          <E id="DRUCK"><g transform="translate(1050,680)">
            <rect x={-50} y={-30} width={100} height={60} rx={3} fill={C.panel} stroke={C.border} strokeWidth="1" />
            <circle cx={-25} cy={-10} r={10} fill="none" stroke={C.dim} strokeWidth="0.8" />
            <rect x={-30} y={-15} width={10} height={10} fill={C.coolPipe} fillOpacity="0.3" stroke={C.dim} strokeWidth="0.5" />
            <rect x={15} y={-20} width={18} height={36} rx={2} fill="none" stroke={C.dim} strokeWidth="0.8" />
            <text x={0} y={42} textAnchor="middle" fill={C.dim} fontSize="4">Druckhalte-,</text>
            <text x={0} y={54} textAnchor="middle" fill={C.dim} fontSize="4">Entgasungs- und</text>
            <text x={0} y={66} textAnchor="middle" fill={C.dim} fontSize="4">Nachspeisestation</text>
          </g></E>

          {/* Aufbereitung */}
          <g transform="translate(1180,680)">
            <line x1={0} y1={-12} x2={0} y2={12} stroke={C.dim} strokeWidth="1.2" />
            <line x1={-6} y1={-8} x2={6} y2={-8} stroke={C.dim} strokeWidth="1" />
            <line x1={-6} y1={8} x2={6} y2={8} stroke={C.dim} strokeWidth="1" />
            <text x={0} y={25} textAnchor="middle" fill={C.dim} fontSize="4">Aufbereitung</text>
          </g>

          {/* Systemtrenner BA */}
          <g transform="translate(1250,680)">
            <RV x={0} y={0} />
            <RV x={15} y={0} />
            <text x={7} y={18} textAnchor="middle" fill={C.dim} fontSize="4">Systemtrenner BA</text>
          </g>

          {/* Anschluss TW */}
          <Pipe d="M1270,680 L1320,680" c={C.geoPipe} w={1.5} />
          <text x={1330} y={683} fill={C.geoPipe} fontSize="4">Anschluss TW</text>
          <polygon points="1315,677 1315,683 1320,680" fill={C.geoPipe} />

          {/* Verbindungen Druckstation */}
          <Pipe d="M1000,650 L1000,680" c={C.coldPipe} w={1.5} />
          <Pipe d="M1100,680 L1180,680" c={C.coldPipe} w={1.5} />
          <Pipe d="M1180,650 L1250,650" c={C.coldPipe} w={1.5} />
          <Pipe d="M1250,650 L1320,650" c={C.geoPipe} w={1.5} />

          {/* ════════════════════════════════════════════════════════
               DREIWEGEVENTILE (Mitte)
             ════════════════════════════════════════════════════════ */}
          <Mischer x={500} y={380} on={on} />
          <Mischer x={580} y={380} on={on} />
          <Mischer x={660} y={380} on={on} />
          <TF x={450} y={380} c={C.hotPipe} />
          <TF x={540} y={380} c={C.hotPipe} />
          <TF x={620} y={380} c={C.hotPipe} />
          <Pipe d="M500,380 L660,380" c={C.hotPipe} w={1.5} />
          <PT x={440} y={295} v="35°" c={C.coldPipe} />
          <PT x={505} y={295} v="40°" c={C.hotPipe} />

          {/* ════════════════════════════════════════════════════════
               PASSTÜCKE
             ════════════════════════════════════════════════════════ */}
          {[[150,380],[480,460],[580,480],[750,580],[850,520],[980,580]].map(([px,py]) =>
            <g key={'ps'+px+py}>
              <rect x={px-10} y={py-5} width={20} height={10} fill={C.panel} stroke={C.border} strokeWidth="0.4" rx="1" />
              <text x={px} y={py+2.5} textAnchor="middle" fill={C.dim} fontSize="3">Passtück</text>
            </g>
          )}

          {/* ════════════════════════════════════════════════════════
               FLOW ANIMATION
             ════════════════════════════════════════════════════════ */}
          {flow && on && <g>
            <Flow path="M50,420 L120,420 L120,380 L225,380" c={C.geoPipe} dur="3s" r={3} />
            <Flow path="M245,495 L245,630" c={C.geoPipe} dur="2s" r={3} />
            <Flow path="M610,620 L700,620 L700,480 L870,480 L870,520" c={C.hotPipe} dur="3.5s" r={4} />
            <Flow path="M970,520 L1080,520 L1180,480" c={C.hotPipe} dur="2s" r={4} />
            <Flow path="M1080,580 L970,580" c={C.coldPipe} dur="2.5s" r={3} />
            <Flow path="M870,585 L870,620 L700,620 L490,620" c={C.coldPipe} dur="3s" r={3} />
            <Flow path="M280,180 L280,345" c={C.geoPipe} dur="2.5s" r={3} />
            <Flow path="M620,150 L620,350" c={C.hotPipe} dur="2s" r={3} />
          </g>}

          {/* Titel */}
          <text x={800} y={1060} textAnchor="middle" fill={C.dim} fontSize="6">
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

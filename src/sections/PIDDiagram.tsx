import { useState, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCcw, Eye, EyeOff, X } from 'lucide-react';
import type { HeatingData } from '@/types/heating';

// ═══════════════════════════════════════════════════════════════
//  P&ID SYMBOLE (DIN-konform)
// ═══════════════════════════════════════════════════════════════

/** Pumpe: Kreis mit Dreieck */
function Pump({ x, y, id, running, onClick }: {
  x: number; y: number; id: string; running: boolean; onClick: () => void;
}) {
  return (
    <g transform={`translate(${x},${y})`} className="cursor-pointer" onClick={onClick}>
      <circle cx="0" cy="0" r="14" fill="none" stroke={running ? '#dc2626' : '#666'} strokeWidth="2"
        strokeDasharray={running ? '' : '3,2'} />
      <polygon points="0,-7 7,5 -7,5" fill={running ? '#dc2626' : '#999'} />
      <text x="0" y="24" textAnchor="middle" fill={running ? '#dc2626' : '#888'} fontSize="10" fontWeight="700">{id}</text>
    </g>
  );
}

/** Absperrventil (Butterfly): Doppel-Dreieck / Bowtie */
function Valve({ x, y, size = 8 }: { x: number; y: number; size?: number }) {
  const s = size;
  return (
    <g transform={`translate(${x},${y})`}>
      <polygon points={`${-s},${-s} ${s},0 ${-s},${s}`} fill="none" stroke="#555" strokeWidth="1.5" />
      <polygon points={`${s},${-s} ${-s},0 ${s},${s}`} fill="none" stroke="#555" strokeWidth="1.5" />
    </g>
  );
}

/** Rückschlagventil */
function CheckValve({ x, y, rot = 0 }: { x: number; y: number; rot?: number }) {
  return (
    <g transform={`translate(${x},${y}) rotate(${rot})`}>
      <polygon points="-6,-6 6,0 -6,6" fill="none" stroke="#555" strokeWidth="1.5" />
      <line x1="6" y1="-6" x2="6" y2="6" stroke="#555" strokeWidth="1.5" />
    </g>
  );
}

/** Temperaturfühler */
function TSensor({ x, y, label }: { x: number; y: number; label?: string }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <circle cx="0" cy="0" r="6" fill="none" stroke="#333" strokeWidth="1.2" />
      <text x="0" y="3.5" textAnchor="middle" fill="#333" fontSize="8" fontWeight="600">T</text>
      {label && <text x="12" y="4" fill="#555" fontSize="8">{label}</text>}
    </g>
  );
}

/** Wärmemengenzähler */
function WMZ({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x="-14" y="-8" width="28" height="16" rx="2" fill="none" stroke="#333" strokeWidth="1.2" />
      <text x="0" y="4" textAnchor="middle" fill="#333" fontSize="6" fontWeight="600">WMZ</text>
    </g>
  );
}

/** Passstück */
function Passtueck({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x="-10" y="-4" width="20" height="8" rx="1" fill="none" stroke="#333" strokeWidth="1" strokeDasharray="3,2" />
      <text x="0" y="14" textAnchor="middle" fill="#999" fontSize="7">Passstück</text>
    </g>
  );
}

/** MAG (Membranausdehnungsgefäß) */
function MAG({ x, y, size = '50l' }: { x: number; y: number; size?: string }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <ellipse cx="0" cy="0" rx="14" ry="18" fill="none" stroke="#999" strokeWidth="1.5" />
      <text x="0" y="3" textAnchor="middle" fill="#999" fontSize="7" fontWeight="600">MAG</text>
      <text x="0" y="28" textAnchor="middle" fill="#999" fontSize="7">{size}</text>
    </g>
  );
}

/** Sicherheitsventil */
function SVentil({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <polygon points="0,-8 6,4 -6,4" fill="none" stroke="#333" strokeWidth="1.2" />
      <line x1="0" y1="4" x2="0" y2="10" stroke="#333" strokeWidth="1.2" />
    </g>
  );
}

/** DN-Label */
function DN({ x, y, text }: { x: number; y: number; text: string }) {
  return <text x={x} y={y} fill="#888" fontSize="9" fontWeight="500">{text}</text>;
}

/** Temperatur-Annotation */
function TempLabel({ x, y, temp, color = '#dc2626' }: { x: number; y: number; temp: string; color?: string }) {
  return <text x={x} y={y} fill={color} fontSize="10" fontWeight="600">{temp}</text>;
}

/** Beschriftung */
function Label({ x, y, lines, size = 9, anchor = 'start', color = '#555' }: {
  x: number; y: number; lines: string[]; size?: number; anchor?: 'start' | 'middle' | 'end'; color?: string;
}) {
  return (
    <g>
      {lines.map((line, i) => (
        <text key={i} x={x} y={y + i * (size + 3)} textAnchor={anchor} fill={color} fontSize={size}>{line}</text>
      ))}
    </g>
  );
}

/** Druckhaltestation */
function Druckhaltestation({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x="0" y="0" width="120" height="35" rx="2" fill="none" stroke="#999" strokeWidth="1" strokeDasharray="4,2" />
      <Label x={5} y={12} lines={['Druckhalte-,', 'Entgasungs- und', 'Nachspeisestation']} size={7} color="#999" />
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
  const sc = comp.status === 'running' ? 'bg-emerald-500/20 text-emerald-400'
    : comp.status === 'standby' ? 'bg-amber-500/20 text-amber-400'
    : 'bg-slate-500/20 text-slate-400';
  const sl = comp.status === 'running' ? 'Laufend' : comp.status === 'standby' ? 'Bereit' : 'Aus';
  return (
    <div className="absolute bottom-4 left-4 right-4 z-20 bg-[#0f1520]/95 backdrop-blur-xl border border-[#1e2736] rounded-xl p-4 shadow-2xl">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-white font-bold">{comp.name}</h3>
          <p className="text-slate-400 text-xs">{comp.desc}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="text-slate-400 hover:text-white -mt-1 -mr-1"><X className="w-4 h-4" /></Button>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-xs">
        <div className="bg-[#111620] rounded-lg p-2"><div className="text-[9px] text-slate-500 uppercase mb-1">ID</div><div className="text-emerald-400 font-mono">{comp.id}</div></div>
        <div className="bg-[#111620] rounded-lg p-2"><div className="text-[9px] text-slate-500 uppercase mb-1">Status</div><Badge className={`text-[10px] ${sc}`}>{sl}</Badge></div>
        {comp.temp != null && <div className="bg-[#111620] rounded-lg p-2"><div className="text-[9px] text-slate-500 uppercase mb-1">Temperatur</div><div className="text-orange-400 font-semibold">{comp.temp.toFixed(1)}°C</div></div>}
        {comp.tempReturn != null && <div className="bg-[#111620] rounded-lg p-2"><div className="text-[9px] text-slate-500 uppercase mb-1">Rücklauf</div><div className="text-sky-400 font-semibold">{comp.tempReturn.toFixed(1)}°C</div></div>}
        {comp.flow != null && <div className="bg-[#111620] rounded-lg p-2"><div className="text-[9px] text-slate-500 uppercase mb-1">Durchfluss</div><div className="text-emerald-400 font-semibold">{comp.flow} m³/h</div></div>}
        {comp.dn && <div className="bg-[#111620] rounded-lg p-2"><div className="text-[9px] text-slate-500 uppercase mb-1">Nennweite</div><div className="text-slate-300 font-semibold">{comp.dn}</div></div>}
        {comp.power && <div className="bg-[#111620] rounded-lg p-2"><div className="text-[9px] text-slate-500 uppercase mb-1">Leistung</div><div className="text-amber-400 font-semibold">{comp.power}</div></div>}
      </div>
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
  const [zoom, setZoom] = useState(0.85);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [showFlow, setShowFlow] = useState(true);
  const [selected, setSelected] = useState<CompInfo | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const heating = data?.status === 'heizen';
  const standby = data?.status === 'standby';

  const ci = (id: string, name: string, desc: string, extra: Partial<CompInfo> = {}): CompInfo => ({
    id, name, desc, status: 'standby', ...extra,
  });
  const sel = (info: CompInfo) => setSelected(info);

  const onMD = (e: React.MouseEvent) => { dragging.current = true; dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }; };
  const onMM = (e: React.MouseEvent) => { if (!dragging.current) return; setPan({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y }); };
  const onMU = () => { dragging.current = false; };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">P&ID-Diagramm</h2>
          <p className="text-sm text-slate-400">② Hauptstation + Anschluss an Satellitenhaus – Detail</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowFlow(!showFlow)}
            className={`border-[#1e2736] text-xs ${showFlow ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-400'}`}>
            {showFlow ? <Eye className="w-3.5 h-3.5 mr-1" /> : <EyeOff className="w-3.5 h-3.5 mr-1" />}
            Strömung
          </Button>
          <div className="flex items-center gap-1 bg-[#111620] rounded-lg border border-[#1e2736] p-0.5">
            <Button variant="ghost" size="sm" onClick={() => setZoom(Math.max(0.3, zoom - 0.1))} className="text-slate-400 h-7 w-7 p-0"><ZoomOut className="w-3.5 h-3.5" /></Button>
            <span className="text-xs text-slate-400 w-10 text-center">{Math.round(zoom * 100)}%</span>
            <Button variant="ghost" size="sm" onClick={() => setZoom(Math.min(2.5, zoom + 0.1))} className="text-slate-400 h-7 w-7 p-0"><ZoomIn className="w-3.5 h-3.5" /></Button>
            <Button variant="ghost" size="sm" onClick={() => { setZoom(0.85); setPan({ x: 0, y: 0 }); }} className="text-slate-400 h-7 w-7 p-0"><RotateCcw className="w-3.5 h-3.5" /></Button>
          </div>
        </div>
      </div>

      {/* Diagramm */}
      <div ref={containerRef}
        className="relative overflow-hidden rounded-xl border border-[#1e2736] bg-white cursor-grab active:cursor-grabbing select-none"
        style={{ height: '700px' }}
        onMouseDown={onMD} onMouseMove={onMM} onMouseUp={onMU} onMouseLeave={onMU}>
        <div className="absolute" style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0', width: '2000px', height: '1200px',
        }}>
          <svg viewBox="0 0 2000 1200" className="w-full h-full" style={{ background: '#fff' }}>

            {/* ════════════════════════════════════════════
                 TEIL 1: HEIZUNG (oberer Bereich)
                 ════════════════════════════════════════════ */}

            {/* ── Abluft-Wärmepumpe auf Dach (oben mitte) ── */}
            <g className="cursor-pointer" onClick={() => sel(ci('ABWP', 'Abluft-Wärmepumpe', 'Abluft-WP auf Dach', { temp: 40, tempReturn: 35, status: heating ? 'running' : 'standby' }))}>
              <rect x="470" y="30" width="80" height="40" rx="3" fill="none" stroke="#333" strokeWidth="1.5" />
              <line x1="480" y1="50" x2="540" y2="50" stroke="#333" strokeWidth="1" />
              <Label x={475} y={20} lines={['Abluft-Wärmepumpe', 'auf Dach']} size={8} anchor="start" />
              <text x="575" y="55" fill="#888" fontSize="8">Rohrbegl.heizung</text>
            </g>

            {/* ── PVT-Solarkollektoren auf Dach (oben links) ── */}
            <g className="cursor-pointer" onClick={() => sel(ci('PVT', 'PVT-Solarkollektoren', 'Zuleitung PVT auf Dach', { temp: data?.aussentemperatur, power: '6,2 kW th.', status: 'running' }))}>
              <rect x="140" y="85" width="80" height="45" fill="none" stroke="#333" strokeWidth="1.5" />
              {/* Kollektor-Linien */}
              <line x1="155" y1="85" x2="155" y2="130" stroke="#333" strokeWidth="0.8" />
              <line x1="170" y1="85" x2="170" y2="130" stroke="#333" strokeWidth="0.8" />
              <line x1="185" y1="85" x2="185" y2="130" stroke="#333" strokeWidth="0.8" />
              <line x1="200" y1="85" x2="200" y2="130" stroke="#333" strokeWidth="0.8" />
              <Label x={140} y={78} lines={['Zuleitung', 'PVT-', 'Solarkollektoren', 'auf Dach']} size={8} />
              <text x="240" y={108} fill="#888" fontSize="8">th. Leistung: 6,2kW</text>
            </g>

            {/* ── Leitungen von Abluft-WP herunter ── */}
            <line x1="490" y1="70" x2="490" y2="165" stroke="#000" strokeWidth="1.5" />
            <line x1="530" y1="70" x2="530" y2="165" stroke="#000" strokeWidth="1.5" />
            <TempLabel x={440} y={160} temp="35°C" color="#000" />
            <TempLabel x={540} y={160} temp="40°C" color="#000" />

            {/* ── Zuleitung Abluft-WP Label ── */}
            <Label x={380} y={175} lines={['Zuleitung', 'Wärme aus', 'Abluft-Wärmepumpe', 'auf Dach']} size={8} />
            <text x="435" y="175" fill="#888" fontSize="8">35°C</text>
            <text x="540" y="175" fill="#888" fontSize="8">40°C</text>

            {/* ── P02 (zwischen Abluft-WP und Puffer) ── */}
            <Pump x={360} y={200} id="P02" running={!!heating}
              onClick={() => sel(ci('P02', 'Pumpe P02', 'Umwälzpumpe Abluft-WP', { flow: 15.2, dn: 'DN 65', status: heating ? 'running' : 'off' }))} />
            <TSensor x={330} y={195} />
            <TSensor x={330} y={220} />
            <DN x={380} y={195} text="DN 65" />
            <DN x={380} y={225} text="DN 65" />

            {/* ── Leitungen P02 zu Puffer ── */}
            <line x1="345" y1="200" x2="300" y2="200" stroke="#000" strokeWidth="1.5" />
            <line x1="300" y1="200" x2="300" y2="260" stroke="#000" strokeWidth="1.5" />

            {/* MAG oben */}
            <MAG x={430} y={220} />
            <DN x={490} y={225} text="DN 25" />

            {/* ── PVT Leitungen herunter ── */}
            <line x1="180" y1="130" x2="180" y2="200" stroke="#000" strokeWidth="1.5" />
            <line x1="180" y1="200" x2="230" y2="200" stroke="#000" strokeWidth="1.5" />

            {/* ══════════════════════════════════════════════
                 PUFFERSPEICHER PVT (2000 Liter) – links
                 ══════════════════════════════════════════════ */}
            <g className="cursor-pointer" onClick={() => sel(ci('PS1', 'Pufferspeicher PVT', 'Hydr. Trennung / PVT, 2000 Liter', { temp: data?.puffer_oben, power: '2000 L', dn: 'DN 100', status: heating ? 'running' : 'standby' }))}>
              {/* Tank Körper */}
              <rect x="230" y="240" width="70" height="250" rx="35" fill="none" stroke="#333" strokeWidth="2" />
              {/* Beschriftung */}
              <Label x={155} y={250} lines={['Pufferspeicher', 'hydr. Trennung/PVT', '2000 Liter']} size={8} />
              <DN x={200} y={285} text="DN 63" />

              {/* Temperaturfühler entlang des Tanks */}
              <TSensor x={308} y={270} />
              <TSensor x={308} y={310} />
              <TSensor x={308} y={350} />
              <TSensor x={308} y={390} />
              <TSensor x={308} y={430} />
              <TSensor x={308} y={470} />

              {/* Anschlüsse links */}
              <line x1="230" y1="280" x2="200" y2="280" stroke="#000" strokeWidth="1.5" />
              <line x1="230" y1="470" x2="200" y2="470" stroke="#000" strokeWidth="1.5" />
            </g>

            {/* ══════════════════════════════════════════════
                 ERDWÄRMEFELD (links unten)
                 ══════════════════════════════════════════════ */}
            <g className="cursor-pointer" onClick={() => sel(ci('ERD', 'Erdwärmefeld', 'Nahwärme aus Erdwärmefeld', { temp: 18, tempReturn: 12, flow: 42.1, status: heating ? 'running' : 'standby' }))}>
              <Label x={30} y={318} lines={['Zuleitung FVU', 'Nahwärme aus', 'Erdwärmefeld']} size={9} />
            </g>

            {/* ── P01 (Erdwärme-Pumpe) ── */}
            <Pump x={190} y={300} id="P01" running={!!heating}
              onClick={() => sel(ci('P01', 'Pumpe P01', 'Umwälzpumpe Erdwärmefeld', { flow: 42.1, dn: 'DN 80', status: heating ? 'running' : 'off' }))} />

            {/* Erdwärme Leitungen */}
            <line x1="30" y1="300" x2="176" y2="300" stroke="#000" strokeWidth="1.5" />
            <CheckValve x={150} y={300} />
            <TSensor x={155} y={280} />
            <text x="170" y="335" fill="#888" fontSize="8">0-10V</text>

            {/* WMZ und Passstück für Erdwärme */}
            <WMZ x={100} y={340} />
            <Passtueck x={100} y={370} />

            {/* Erdwärme zu Wärmetauscher */}
            <line x1="190" y1="314" x2="190" y2="400" stroke="#000" strokeWidth="1.5" />
            <line x1="30" y1="400" x2="190" y2="400" stroke="#000" strokeWidth="1.5" />

            {/* ── P03 (rechts von Puffer) ── */}
            <Pump x={400} y={300} id="P03" running={!!heating}
              onClick={() => sel(ci('P03', 'Pumpe P03', 'Umwälzpumpe Puffer PVT', { flow: 28.5, dn: 'DN 100', status: heating ? 'running' : 'off' }))} />

            {/* Puffer zu P03 */}
            <line x1="300" y1="300" x2="386" y2="300" stroke="#000" strokeWidth="1.5" />
            <DN x={330} y={295} text="DN 100" />

            {/* Auslegungsdaten bei P03 */}
            <Label x={420} y={335} lines={['Auslegung:', 'DeltaT: 3K', 'Glycol: 30%', 'Massenstrom: 42,1 m³/h']} size={8} color="#888" />
            <TSensor x={430} y={285} />

            {/* P03 herunter zum Wärmetauscher */}
            <line x1="400" y1="314" x2="400" y2="440" stroke="#000" strokeWidth="1.5" />
            <DN x={370} y={420} text="DN 100" />

            {/* Rücklauf vom Puffer unten */}
            <line x1="230" y1="470" x2="130" y2="470" stroke="#000" strokeWidth="1.5" />
            <line x1="130" y1="470" x2="130" y2="530" stroke="#000" strokeWidth="1.5" />
            <line x1="130" y1="530" x2="400" y2="530" stroke="#000" strokeWidth="1.5" />

            <Valve x={165} y={470} />
            <CheckValve x={200} y={420} rot={-90} />
            <TSensor x={350} y={445} />
            <DN x={220} y={545} text="DN 80" />

            {/* ══════════════════════════════════════════════
                 WÄRMETAUSCHER (mitte unten)
                 ══════════════════════════════════════════════ */}
            <g className="cursor-pointer" onClick={() => sel(ci('WT1', 'Wärmetauscher', 'Plattenwärmetauscher, 47 kW', { temp: 42, tempReturn: 39, dn: 'DN 80', power: '47 kW', status: heating ? 'running' : 'standby' }))}>
              {/* WT Körper mit Gradient */}
              <defs>
                <linearGradient id="wtGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="50%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
              <rect x="380" y="450" width="40" height="100" fill="url(#wtGrad)" stroke="#333" strokeWidth="2" />
              {/* Platten-Linien */}
              <line x1="385" y1="465" x2="415" y2="465" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
              <line x1="385" y1="480" x2="415" y2="480" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
              <line x1="385" y1="495" x2="415" y2="495" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
              <line x1="385" y1="510" x2="415" y2="510" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
              <line x1="385" y1="525" x2="415" y2="525" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />

              <Label x={350} y={570} lines={['Wärmetauscher', 'Leistung:', '47 kW']} size={9} />
            </g>

            <TSensor x={370} y={455} />
            <TSensor x={370} y={540} />
            <DN x={320} y={460} text="DN 80" />
            <DN x={320} y={540} text="DN 80" />
            <WMZ x={340} y={530} />

            {/* WT Primär-Anschlüsse (links) */}
            <line x1="380" y1="460" x2="300" y2="460" stroke="#000" strokeWidth="1.5" />
            <line x1="380" y1="540" x2="300" y2="540" stroke="#000" strokeWidth="1.5" />
            <line x1="300" y1="460" x2="300" y2="540" stroke="#000" strokeWidth="1.5" />

            {/* WT Sekundär (rechts) → Wärmepumpe */}
            <line x1="420" y1="460" x2="500" y2="460" stroke="#000" strokeWidth="1.5" />
            <line x1="420" y1="540" x2="500" y2="540" stroke="#000" strokeWidth="1.5" />
            <DN x={440} y={455} text="DN 80" />
            <DN x={440} y={555} text="DN 80" />

            {/* ══════════════════════════════════════════════
                 WÄRMEPUMPE (mitte)
                 ══════════════════════════════════════════════ */}
            <g className="cursor-pointer" onClick={() => sel(ci('WP1', 'Wärmepumpe', 'Hauptwärmepumpe 175 kW', { temp: data?.vorlauftemperatur, power: '175 kW th. / 38,9 kW el.', dn: 'DN 100', status: heating ? 'running' : 'standby' }))}>
              <rect x="500" y="430" width="150" height="80" rx="3" fill="none" stroke="#333" strokeWidth="2" />
              <text x="575" y="455" textAnchor="middle" fill="#333" fontSize="10" fontWeight="600">Wärmepumpe</text>

              <Label x={508} y={468} lines={['Nenn-Wärmeleistung:', '175 kW', 'Elektrische', 'Leistungsaufn.: 38,9 kW']} size={8} />
            </g>

            <TSensor x={555} y={425} />
            <text x="575" y="420" fill="#888" fontSize="8">Ansprechdruck</text>
            <text x="575" y="430" fill="#888" fontSize="8">SV: 3,5 bar</text>

            {/* 400V Anschluss */}
            <rect x="560" y="520" width="40" height="16" rx="2" fill="none" stroke="#333" strokeWidth="1" />
            <text x="580" y="532" textAnchor="middle" fill="#333" fontSize="8" fontWeight="600">400 V</text>

            {/* WP Sekundär-Ausgang rechts */}
            <line x1="650" y1="450" x2="720" y2="450" stroke="#000" strokeWidth="1.5" />
            <line x1="650" y1="500" x2="720" y2="500" stroke="#000" strokeWidth="1.5" />

            {/* ── P04 (rechts von WP) ── */}
            <Pump x={750} y={440} id="P04" running={!!heating}
              onClick={() => sel(ci('P04', 'Pumpe P04', 'Umwälzpumpe Heizung', { flow: 18.3, dn: 'DN 100', status: heating ? 'running' : 'off' }))} />

            <TSensor x={720} y={435} />
            <TempLabel x={770} y={440} temp="43°C" color="#dc2626" />
            <DN x={770} y={460} text="DN 100" />
            <Label x={690} y={405} lines={['Anschlusstutzen mit', 'Absperrorgan und', 'Storz-C Kupplung']} size={7} color="#888" />

            {/* Rücklauf WP */}
            <TempLabel x={770} y={505} temp="38°C" color="#0369a1" />
            <DN x={770} y={520} text="DN 100" />
            <WMZ x={720} y={520} />
            <Passtueck x={720} y={545} />
            <Label x={690} y={490} lines={['Anschlusstutzen mit', 'Absperrorgan und', 'Storz-C Kupplung']} size={7} color="#888" />

            {/* P04 zu Puffer HZ */}
            <line x1="764" y1="440" x2="870" y2="440" stroke="#dc2626" strokeWidth="1.5" />
            <line x1="764" y1="500" x2="870" y2="500" stroke="#0369a1" strokeWidth="1.5" />

            {/* ══════════════════════════════════════════════
                 PUFFERSPEICHER HEIZUNG (1500 Liter)
                 ══════════════════════════════════════════════ */}
            <g className="cursor-pointer" onClick={() => sel(ci('PS2', 'Pufferspeicher Heizung', 'Heizungspuffer 1500 Liter', { temp: data?.vorlauftemperatur, power: '1500 L', dn: 'DN 80', status: heating ? 'running' : 'standby' }))}>
              <rect x="870" y="340" width="70" height="200" rx="35" fill="none" stroke="#333" strokeWidth="2" />
              <Label x={850} y={325} lines={['Pufferspeicher', 'Heizung', '1500 Liter']} size={8} />

              <TSensor x={948} y={370} />
              <TSensor x={948} y={410} />
              <TSensor x={948} y={450} />
              <TSensor x={948} y={490} />
              <TSensor x={948} y={520} />

              {/* Live-Temperaturen */}
              <TempLabel x={960} y={375} temp={`${data?.vorlauftemperatur?.toFixed(0) ?? '--'}°C`} color="#dc2626" />
              <TempLabel x={960} y={500} temp={`${data?.ruecklauftemperatur?.toFixed(0) ?? '--'}°C`} color="#0369a1" />
            </g>

            <DN x={850} y={395} text="DN 80" />

            {/* Anschlüsse Puffer HZ */}
            <line x1="870" y1="370" x2="870" y2="370" stroke="#000" strokeWidth="1.5" />
            <line x1="940" y1="380" x2="990" y2="380" stroke="#dc2626" strokeWidth="1.5" />
            <line x1="940" y1="500" x2="990" y2="500" stroke="#0369a1" strokeWidth="1.5" />

            {/* MAG am Puffer HZ */}
            <MAG x={990} y={420} />
            <DN x={975} y={445} text="DN 80" />

            {/* ── P05 (rechts von Puffer HZ) ── */}
            <Pump x={1030} y={380} id="P05" running={!!heating}
              onClick={() => sel(ci('P05', 'Pumpe P05', 'Umwälzpumpe Puffer HZ', { flow: 22.1, dn: 'DN 80', status: heating ? 'running' : 'off' }))} />
            <text x="1030" y="408" textAnchor="middle" fill="#888" fontSize="8">0-10V</text>
            <TSensor x={1060} y={370} />

            {/* P05 zu Verteiler */}
            <line x1="1044" y1="380" x2="1100" y2="380" stroke="#dc2626" strokeWidth="1.5" />
            <line x1="1044" y1="500" x2="1100" y2="500" stroke="#0369a1" strokeWidth="1.5" />

            {/* Druckhaltestation */}
            <Druckhaltestation x={1080} y={530} />
            <Label x={1210} y={540} lines={['Aufbereitung']} size={7} color="#888" />
            <Label x={1210} y={555} lines={['Systemtrenner BA']} size={7} color="#888" />

            {/* Anschluss TW */}
            <Label x={1210} y={525} lines={['Anschluss TW']} size={7} color="#888" />

            {/* ══════════════════════════════════════════════
                 VERTEILER HEIZUNG (rechts)
                 ══════════════════════════════════════════════ */}
            <g className="cursor-pointer" onClick={() => sel(ci('VH', 'Verteiler Heizung', 'Heizungsverteiler', { temp: 43, tempReturn: 30, dn: 'DN 80', status: heating ? 'running' : 'standby' }))}>
              <rect x="1130" y="400" width="200" height="50" rx="3" fill="none" stroke="#333" strokeWidth="2" />
              <text x="1230" y="430" textAnchor="middle" fill="#333" fontSize="12" fontWeight="700">VERTEILER HEIZUNG</text>
            </g>

            {/* Verteiler-Rohre Vorlauf/Rücklauf */}
            <line x1="1100" y1="380" x2="1130" y2="410" stroke="#dc2626" strokeWidth="1.5" />
            <line x1="1100" y1="500" x2="1130" y2="440" stroke="#0369a1" strokeWidth="1.5" />

            {/* Abgänge oben nach Stockwerke */}
            <line x1="1180" y1="400" x2="1180" y2="330" stroke="#000" strokeWidth="1.5" />
            <line x1="1230" y1="400" x2="1230" y2="330" stroke="#000" strokeWidth="1.5" />
            <DN x={1160} y={325} text="DN 65" />
            <DN x={1240} y={325} text="DN 65" />
            <TempLabel x={1160} y={360} temp="43°C" color="#dc2626" />
            <TempLabel x={1240} y={360} temp="30°C" color="#0369a1" />

            {/* Anschluss weitere Stockwerke */}
            <line x1="1180" y1="330" x2="1180" y2="290" stroke="#000" strokeWidth="1.5" />
            <line x1="1230" y1="330" x2="1230" y2="290" stroke="#000" strokeWidth="1.5" />
            {/* Wellenlinie */}
            <path d="M1170,280 Q1180,270 1190,280 Q1200,290 1210,280 Q1220,270 1230,280 Q1240,290 1250,280" fill="none" stroke="#333" strokeWidth="1.5" />
            <Label x={1175} y={270} lines={['Anschluss', 'weitere', 'Stockwerke']} size={8} />

            {/* Abgang rechts: Zuleitung Satellitenhaus HZ */}
            <line x1="1330" y1="410" x2="1430" y2="410" stroke="#dc2626" strokeWidth="1.5" />
            <line x1="1330" y1="440" x2="1430" y2="440" stroke="#0369a1" strokeWidth="1.5" />
            <DN x={1350} y={405} text="DN 65" />
            <DN x={1410} y={405} text="DN 65" />
            <Label x={1440} y={415} lines={['Zuleitung Heizung', 'zu Satellitenhaus E']} size={8} />

            {/* Abgang unten rechts: DN 50 */}
            <line x1="1280" y1="450" x2="1280" y2="490" stroke="#000" strokeWidth="1" />
            <line x1="1320" y1="450" x2="1320" y2="490" stroke="#000" strokeWidth="1" />
            <DN x={1260} y={488} text="DN 50" />
            <DN x={1325} y={488} text="DN 50" />


            {/* ════════════════════════════════════════════
                 TEIL 2: KÜHLUNG (unterer Bereich)
                 ════════════════════════════════════════════ */}

            {/* Trennlinie */}
            <line x1="0" y1="590" x2="2000" y2="590" stroke="#ddd" strokeWidth="1" strokeDasharray="10,5" />

            {/* ══════════════════════════════════════════════
                 PUFFERSPEICHER KÄLTE (1000 Liter)
                 ══════════════════════════════════════════════ */}
            <g className="cursor-pointer" onClick={() => sel(ci('PS3', 'Pufferspeicher Kälte', 'Kältepuffer 1000 Liter', { temp: 22, power: '1000 L', dn: 'DN 80', status: standby ? 'running' : 'standby' }))}>
              <rect x="400" y="640" width="70" height="250" rx="35" fill="none" stroke="#333" strokeWidth="2" />
              <Label x={305} y={660} lines={['Pufferspeicher', 'Kälte', '1000 Liter']} size={8} />

              <TempLabel x={340} y={680} temp="22°C" color="#000" />
              <DN x={340} y={700} text="DN 80" />

              <TSensor x={478} y={670} />
              <TSensor x={478} y={720} />
              <TSensor x={478} y={770} />
              <TSensor x={478} y={820} />
              <TSensor x={478} y={870} />
            </g>

            {/* Pendelleitung DN 20 */}
            <line x1="400" y1="760" x2="360" y2="760" stroke="#d946ef" strokeWidth="1" />
            <line x1="360" y1="660" x2="360" y2="900" stroke="#d946ef" strokeWidth="1" />
            <text x="345" y="780" textAnchor="end" fill="#d946ef" fontSize="7" transform="rotate(-90, 345, 780)">Pendelleitung DN 20</text>

            {/* Puffer Kälte Anschlüsse oben */}
            <line x1="435" y1="640" x2="435" y2="600" stroke="#000" strokeWidth="1.5" />
            <line x1="435" y1="600" x2="600" y2="600" stroke="#000" strokeWidth="1.5" />
            <DN x={500} y={615} text="DN 80" />

            {/* Anschluss weitere Stockwerke Kühlung (oben) */}
            <line x1="600" y1="600" x2="600" y2="560" stroke="#000" strokeWidth="1.5" />
            <line x1="650" y1="600" x2="650" y2="560" stroke="#000" strokeWidth="1.5" />
            <path d="M590,550 Q600,540 610,550 Q620,560 630,550 Q640,540 650,550 Q660,560 670,550" fill="none" stroke="#333" strokeWidth="1.5" />
            <Label x={600} y={540} lines={['Anschluss', 'weitere', 'Stockwerke']} size={8} />
            <DN x={580} y={580} text="DN 65" />
            <DN x={655} y={580} text="DN 65" />

            {/* MAG am Kältepuffer */}
            <MAG x={530} y={860} />

            {/* SVentil */}
            <SVentil x={470} y={900} />

            {/* Puffer unten: Anschlüsse */}
            <line x1="435" y1="890" x2="435" y2="930" stroke="#000" strokeWidth="1.5" />
            <line x1="435" y1="930" x2="550" y2="930" stroke="#000" strokeWidth="1.5" />
            <DN x={460} y={920} text="DN 80" />

            {/* ── P07 (rechts von Kältepuffer) ── */}
            <Pump x={660} y={720} id="P07" running={!!standby}
              onClick={() => sel(ci('P07', 'Pumpe P07', 'Umwälzpumpe Kältepuffer', { flow: 8.7, dn: 'DN 50', status: standby ? 'running' : 'off' }))} />

            {/* Leitung Puffer → P07 */}
            <line x1="470" y1="720" x2="550" y2="720" stroke="#000" strokeWidth="1.5" />
            <Valve x={520} y={720} />
            <TSensor x={550} y={705} />
            <WMZ x={590} y={720} />
            <Passtueck x={610} y={740} />

            {/* P07 zu Verteiler Kühlung */}
            <line x1="674" y1="720" x2="800" y2="720" stroke="#000" strokeWidth="1.5" />
            <TSensor x={700} y={705} />
            <TempLabel x={780} y={715} temp="22°C" color="#000" />
            <TempLabel x={850} y={715} temp="18°C" color="#000" />
            <DN x={780} y={700} text="DN 50" />
            <DN x={850} y={700} text="DN 50" />

            {/* Ventile zum Verteiler */}
            <Valve x={750} y={720} />
            <CheckValve x={780} y={720} />

            {/* ══════════════════════════════════════════════
                 VERTEILER KÜHLUNG
                 ══════════════════════════════════════════════ */}
            <g className="cursor-pointer" onClick={() => sel(ci('VK', 'Verteiler Kühlung', 'Kühlverteiler', { temp: 22, tempReturn: 18, dn: 'DN 50', status: standby ? 'running' : 'standby' }))}>
              <rect x="650" y="850" width="230" height="50" rx="3" fill="none" stroke="#333" strokeWidth="2" />
              <text x="765" y="880" textAnchor="middle" fill="#333" fontSize="12" fontWeight="700">VERTEILER KÜHLUNG</text>
            </g>

            {/* Ventile über Verteiler Kühlung */}
            <Valve x={680} y={830} />
            <Valve x={750} y={830} />
            <TSensor x={810} y={810} />
            <TSensor x={850} y={810} />

            {/* Leitung runter zum Verteiler */}
            <line x1="700" y1="750" x2="700" y2="850" stroke="#000" strokeWidth="1.5" />
            <line x1="800" y1="750" x2="800" y2="850" stroke="#000" strokeWidth="1.5" />

            {/* Ausgang Kühlung rechts */}
            <line x1="880" y1="860" x2="1000" y2="860" stroke="#000" strokeWidth="1.5" />
            <line x1="880" y1="890" x2="1000" y2="890" stroke="#000" strokeWidth="1.5" />
            <Label x={1010} y={865} lines={['Zuleitung Kühlung', 'zu Satellitenhaus E']} size={8} />
            <DN x={920} y={855} text="DN 50" />
            <DN x={920} y={910} text="DN 50" />
            <TempLabel x={930} y={880} temp="22°C" color="#000" />
            <TempLabel x={970} y={880} temp="18°C" color="#000" />

            {/* ── P06 (unten links) ── */}
            <Pump x={200} y={950} id="P06" running={!!standby}
              onClick={() => sel(ci('P06', 'Pumpe P06', 'Umwälzpumpe Kühlung', { flow: 12.4, dn: 'DN 80', status: standby ? 'running' : 'off' }))} />

            <TSensor x={260} y={940} />
            <TempLabel x={280} y={945} temp="18°C" color="#000" />
            <DN x={280} y={960} text="DN 80" />

            {/* Leitung P06 zum Puffer Kälte (Rücklauf) */}
            <line x1="200" y1="936" x2="200" y2="930" stroke="#d946ef" strokeWidth="1.5" />
            <line x1="100" y1="960" x2="186" y2="960" stroke="#d946ef" strokeWidth="1.5" />
            <line x1="100" y1="640" x2="100" y2="960" stroke="#d946ef" strokeWidth="1.5" />
            <line x1="100" y1="640" x2="400" y2="640" stroke="#d946ef" strokeWidth="1.5" />

            {/* Ventile in Rücklauf */}
            <Valve x={150} y={960} />
            <CheckValve x={130} y={950} rot={-90} />

            {/* ════════════════════════════════════════════
                 STRÖMUNGSPFEILE (animiert)
                 ════════════════════════════════════════════ */}
            {showFlow && heating && (
              <g>
                {/* Erdwärme → WT */}
                <circle r="3" fill="#22c55e">
                  <animateMotion dur="4s" repeatCount="indefinite" path="M130,300 L130,400 L490,370" />
                </circle>
                {/* WT → WP */}
                <circle r="3" fill="#ef4444">
                  <animateMotion dur="3s" repeatCount="indefinite" path="M420,460 L500,460 L650,450" />
                </circle>
                {/* WP → Puffer HZ */}
                <circle r="3" fill="#dc2626">
                  <animateMotion dur="2.5s" repeatCount="indefinite" path="M764,440 L870,440" />
                </circle>
                {/* Puffer HZ → Verteiler */}
                <circle r="3" fill="#dc2626">
                  <animateMotion dur="2s" repeatCount="indefinite" path="M1044,380 L1130,410" />
                </circle>
              </g>
            )}

            {showFlow && standby && (
              <g>
                {/* Kältekreis */}
                <circle r="3" fill="#06b6d4">
                  <animateMotion dur="3s" repeatCount="indefinite" path="M470,720 L660,720 L800,720" />
                </circle>
              </g>
            )}

            {/* ════════════════════════════════════════════
                 TITLE BLOCK
                 ════════════════════════════════════════════ */}
            <text x="600" y="1080" textAnchor="middle" fill="#333" fontSize="16" fontWeight="700">
              ② Hauptstation + Anschluss an Satellitenhaus - Detail
            </text>

          </svg>
        </div>

        {/* Detail-Panel */}
        {selected && <DetailPanel comp={selected} onClose={() => setSelected(null)} />}
      </div>

      {/* Legende */}
      <div className="flex flex-wrap items-center gap-5 px-4 py-3 bg-[#111620]/80 rounded-xl border border-[#1e2736] text-xs">
        <span className="text-slate-500 font-medium">Legende:</span>
        <span className="flex items-center gap-1.5">
          <svg width="14" height="14"><circle cx="7" cy="7" r="5" fill="none" stroke="#dc2626" strokeWidth="1.5" /><polygon points="7,4 10,9 4,9" fill="#dc2626" /></svg>
          <span className="text-slate-400">Pumpe (aktiv)</span>
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="14" height="14"><polygon points="0,0 7,3.5 0,7" fill="none" stroke="#555" strokeWidth="1" /><polygon points="7,0 0,3.5 7,7" fill="none" stroke="#555" strokeWidth="1" /></svg>
          <span className="text-slate-400">Absperrventil</span>
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="14" height="14"><circle cx="7" cy="7" r="5" fill="none" stroke="#333" strokeWidth="1" /><text x="7" y="10" textAnchor="middle" fill="#333" fontSize="7">T</text></svg>
          <span className="text-slate-400">Temperaturfühler</span>
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="20" height="12"><rect x="0" y="0" width="20" height="12" rx="1" fill="none" stroke="#333" strokeWidth="1" /><text x="10" y="9" textAnchor="middle" fill="#333" fontSize="5">WMZ</text></svg>
          <span className="text-slate-400">Wärmezähler</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-5 h-0.5 bg-red-600 inline-block rounded" />
          <span className="text-slate-400">Vorlauf (heiß)</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-5 h-0.5 bg-blue-700 inline-block rounded" />
          <span className="text-slate-400">Rücklauf (kalt)</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-5 h-0.5 bg-fuchsia-500 inline-block rounded" />
          <span className="text-slate-400">Kältekreis</span>
        </span>
      </div>
    </div>
  );
}

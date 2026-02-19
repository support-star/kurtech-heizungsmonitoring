import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Settings2,
  Info,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from 'lucide-react';
import type { HeatingData } from '@/types/heating';

interface PIDDiagramProps {
  data: HeatingData | null;
}

interface ComponentInfo {
  id: string;
  name: string;
  description: string;
  temp?: number;
  tempReturn?: number;
  flow?: number;
  dn?: string;
  power?: string;
  status: 'running' | 'standby' | 'off';
}

export function PIDDiagram({ data }: PIDDiagramProps) {
  const [zoom, setZoom] = useState(1);
  const [selectedComponent, setSelectedComponent] = useState<ComponentInfo | null>(null);
  const [showFlow, setShowFlow] = useState(true);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const isHeating = data?.status === 'heizen';
  const isStandby = data?.status === 'standby';

  const components: Record<string, ComponentInfo> = {
    'PVT': { 
      id: 'PVT', 
      name: 'PVT-Solarkollektoren', 
      description: 'Zuleitung PVT-Solarkollektoren auf Dach',
      temp: data?.aussentemperatur,
      power: '6,2 kW th.',
      status: 'running'
    },
    'ABWP': { 
      id: 'ABWP', 
      name: 'Abluft-Wärmepumpe', 
      description: 'Abluft-Wärmepumpe auf Dach',
      temp: 40,
      tempReturn: 35,
      status: isHeating ? 'running' : 'standby'
    },
    'ERD': { 
      id: 'ERD', 
      name: 'Erdwärmefeld', 
      description: 'Zuleitung FVU Nahwärme aus Erdwärmefeld',
      temp: 18,
      tempReturn: 12,
      flow: 42.1,
      status: isHeating ? 'running' : 'standby'
    },
    'P01': { 
      id: 'P01', 
      name: 'Pumpe P01', 
      description: 'Umwälzpumpe Erdwärmefeld',
      flow: 42.1,
      dn: 'DN 80',
      status: isHeating ? 'running' : 'off'
    },
    'P02': { 
      id: 'P02', 
      name: 'Pumpe P02', 
      description: 'Umwälzpumpe Abluft-WP',
      flow: 15.2,
      dn: 'DN 65',
      status: isHeating ? 'running' : 'off'
    },
    'P03': { 
      id: 'P03', 
      name: 'Pumpe P03', 
      description: 'Umwälzpumpe Puffer PVT',
      flow: 28.5,
      dn: 'DN 100',
      status: isHeating ? 'running' : 'off'
    },
    'P04': { 
      id: 'P04', 
      name: 'Pumpe P04', 
      description: 'Umwälzpumpe Heizung',
      flow: 18.3,
      dn: 'DN 100',
      status: isHeating ? 'running' : 'off'
    },
    'P05': { 
      id: 'P05', 
      name: 'Pumpe P05', 
      description: 'Umwälzpumpe Puffer Heizung',
      flow: 22.1,
      dn: 'DN 80',
      status: isHeating ? 'running' : 'off'
    },
    'P06': { 
      id: 'P06', 
      name: 'Pumpe P06', 
      description: 'Umwälzpumpe Kühlung',
      flow: 12.4,
      dn: 'DN 80',
      status: isStandby ? 'running' : 'off'
    },
    'P07': { 
      id: 'P07', 
      name: 'Pumpe P07', 
      description: 'Umwälzpumpe Kältepuffer',
      flow: 8.7,
      dn: 'DN 50',
      status: isStandby ? 'running' : 'off'
    },
    'WT1': { 
      id: 'WT1', 
      name: 'Wärmetauscher', 
      description: 'Plattenwärmetauscher',
      temp: 42,
      tempReturn: 39,
      dn: 'DN 80',
      power: '47 kW',
      status: isHeating ? 'running' : 'standby'
    },
    'WP1': { 
      id: 'WP1', 
      name: 'Wärmepumpe', 
      description: 'Hauptwärmepumpe',
      temp: 43,
      tempReturn: 38,
      dn: 'DN 100',
      power: '175 kW',
      status: isHeating ? 'running' : 'standby'
    },
    'PS1': { 
      id: 'PS1', 
      name: 'Pufferspeicher PVT', 
      description: 'Pufferspeicher hydr. Trennung/PVT',
      temp: data?.puffer_oben,
      power: '2000 L',
      dn: 'DN 100',
      status: isHeating ? 'running' : 'standby'
    },
    'PS2': { 
      id: 'PS2', 
      name: 'Pufferspeicher Heizung', 
      description: 'Pufferspeicher Heizung',
      temp: data?.puffer_mitte,
      power: '1500 L',
      dn: 'DN 80',
      status: isHeating ? 'running' : 'standby'
    },
    'PS3': { 
      id: 'PS3', 
      name: 'Pufferspeicher Kälte', 
      description: 'Pufferspeicher Kälte',
      temp: 22,
      power: '1000 L',
      dn: 'DN 80',
      status: isStandby ? 'running' : 'standby'
    },
    'VH': { 
      id: 'VH', 
      name: 'Verteiler Heizung', 
      description: 'Heizungsverteiler',
      temp: 43,
      tempReturn: 30,
      dn: 'DN 80',
      status: isHeating ? 'running' : 'standby'
    },
    'VK': { 
      id: 'VK', 
      name: 'Verteiler Kühlung', 
      description: 'Kühlverteiler',
      temp: 22,
      tempReturn: 18,
      dn: 'DN 50',
      status: isStandby ? 'running' : 'standby'
    },
    'MAG': {
      id: 'MAG',
      name: 'Magnetventil',
      description: 'MAG 50l',
      status: isHeating ? 'running' : 'standby'
    },
    'SV': {
      id: 'SV',
      name: 'Sicherheitsventil',
      description: 'Ansprechdruck SV: 3,5 bar',
      status: 'standby'
    }
  };

  const handleComponentClick = (id: string) => {
    const comp = components[id];
    if (comp) setSelectedComponent(comp);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    setPan({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">P&ID-Diagramm</h2>
          <p className="text-sm text-slate-400">Hauptstation + Anschluss an Satellitenhaus - Detail</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFlow(!showFlow)}
            className={`border-slate-600 ${showFlow ? 'bg-emerald-500/15 text-emerald-400' : 'text-slate-400'}`}
          >
            <Info className="w-4 h-4 mr-1" />
            Strömung
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
            className="border-slate-600 text-slate-400"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm text-slate-400 w-12 text-center">{Math.round(zoom * 100)}%</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setZoom(Math.min(2, zoom + 0.1))}
            className="border-slate-600 text-slate-400"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={resetView}
            className="border-slate-600 text-slate-400"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Diagramm Container */}
      <div 
        ref={containerRef}
        className="relative overflow-hidden bg-slate-950 rounded-xl border border-[#1e2736] cursor-grab active:cursor-grabbing"
        style={{ height: '700px' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div 
          className="absolute"
          style={{ 
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            width: '1800px',
            height: '1000px'
          }}
        >
          <svg viewBox="0 0 1800 1000" className="w-full h-full">
            <defs>
              {/* Marker für Strömung */}
              <marker id="arrowFlow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                <polygon points="0,0 8,4 0,8" fill="#22c55e" />
              </marker>
              
              {/* Gradienten */}
              <linearGradient id="pipeHot" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
              <linearGradient id="pipeWarm" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#eab308" />
                <stop offset="100%" stopColor="#f97316" />
              </linearGradient>
              <linearGradient id="pipeCold" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
              <linearGradient id="wtGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="50%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>

            {/* Hintergrund Gitter */}
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#1e293b" strokeWidth="0.5"/>
            </pattern>
            <rect width="1800" height="1000" fill="url(#grid)" />

            {/* ============================================
                 PVT-SOLARKOLLEKTOREN (OBEN LINKS)
                 ============================================ */}
            <g transform="translate(150, 30)">
              {/* Zuleitung */}
              <text x="0" y="15" fill="#94a3b8" fontSize="10">Zuleitung</text>
              <text x="0" y="28" fill="#94a3b8" fontSize="10">PVT-Solarkollektoren</text>
              <text x="0" y="41" fill="#94a3b8" fontSize="10">auf Dach</text>
              
              {/* Kollektor-Symbol */}
              <g transform="translate(0, 55)" className="cursor-pointer" onClick={() => handleComponentClick('PVT')}>
                <rect x="0" y="0" width="80" height="50" fill="#fef3c7" stroke="#f59e0b" strokeWidth="2"/>
                <line x1="15" y1="0" x2="15" y2="50" stroke="#d97706" strokeWidth="1"/>
                <line x1="30" y1="0" x2="30" y2="50" stroke="#d97706" strokeWidth="1"/>
                <line x1="45" y1="0" x2="45" y2="50" stroke="#d97706" strokeWidth="1"/>
                <line x1="60" y1="0" x2="60" y2="50" stroke="#d97706" strokeWidth="1"/>
                <text x="40" y="65" textAnchor="middle" fill="#fbbf24" fontSize="9">th. Leistung: 6,2kW</text>
              </g>
            </g>

            {/* ============================================
                 ABLUFT-WÄRMEPUMPE (OBEN MITTE)
                 ============================================ */}
            <g transform="translate(400, 30)">
              <text x="60" y="15" textAnchor="middle" fill="#94a3b8" fontSize="10">Abluft-Wärmepumpe</text>
              <text x="60" y="28" textAnchor="middle" fill="#94a3b8" fontSize="10">auf Dach</text>
              
              {/* WP Symbol */}
              <g transform="translate(35, 40)" className="cursor-pointer" onClick={() => handleComponentClick('ABWP')}>
                <circle cx="25" cy="25" r="25" fill="#0891b2" stroke="#06b6d4" strokeWidth="2"/>
                <circle cx="25" cy="25" r="15" fill="none" stroke="#22d3ee" strokeWidth="1" strokeDasharray="3,3"/>
                <text x="60" y="-5" fill="#22d3ee" fontSize="9">Rohrbegl.heizung</text>
              </g>
              
              {/* Temperaturen */}
              <text x="85" y="85" fill="#f97316" fontSize="10">40°C</text>
              <text x="35" y="85" fill="#06b6d4" fontSize="10">35°C</text>
            </g>

            {/* ============================================
                 PUFFERSPEICHER PVT (LINKS)
                 ============================================ */}
            <g transform="translate(200, 200)" className="cursor-pointer" onClick={() => handleComponentClick('PS1')}>
              <text x="60" y="-15" textAnchor="middle" fill="#94a3b8" fontSize="10">Pufferspeicher</text>
              <text x="60" y="-2" textAnchor="middle" fill="#94a3b8" fontSize="10">hydr. Trennung/PVT</text>
              <text x="60" y="155" textAnchor="middle" fill="#94a3b8" fontSize="10">2000 Liter</text>
              
              {/* Behälter */}
              <rect x="0" y="10" width="120" height="130" rx="8" fill="#1e3a8a" stroke="#3b82f6" strokeWidth="2"/>
              
              {/* Temperatur-Schichten */}
              <rect x="10" y="20" width="100" height="35" rx="4" fill="#dc2626" opacity="0.8"/>
              <text x="60" y="42" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold">{data?.puffer_oben.toFixed(0) || '--'}°C</text>
              
              <rect x="10" y="58" width="100" height="35" rx="4" fill="#ea580c" opacity="0.7"/>
              <text x="60" y="80" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold">{data?.puffer_mitte.toFixed(0) || '--'}°C</text>
              
              <rect x="10" y="96" width="100" height="35" rx="4" fill="#0891b2" opacity="0.7"/>
              <text x="60" y="118" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold">{data?.puffer_unten.toFixed(0) || '--'}°C</text>
              
              {/* Temperaturfühler */}
              <circle cx="60" cy="5" r="6" fill="#475569" stroke="#fff" strokeWidth="1"/>
              <text x="60" y="8" textAnchor="middle" fill="#fff" fontSize="7">T</text>
              
              <circle cx="60" cy="55" r="6" fill="#475569" stroke="#fff" strokeWidth="1"/>
              <text x="60" y="58" textAnchor="middle" fill="#fff" fontSize="7">T</text>
              
              <circle cx="60" cy="145" r="6" fill="#475569" stroke="#fff" strokeWidth="1"/>
              <text x="60" y="148" textAnchor="middle" fill="#fff" fontSize="7">T</text>
            </g>

            {/* ============================================
                 ERWÄRMEFELD / P01 (LINKS AUSSEN)
                 ============================================ */}
            <g transform="translate(30, 250)">
              <text x="0" y="0" fill="#94a3b8" fontSize="9">Zuleitung FVU</text>
              <text x="0" y="13" fill="#94a3b8" fontSize="9">Nahwärme aus</text>
              <text x="0" y="26" fill="#94a3b8" fontSize="9">Erdwärmefeld</text>
              
              {/* Pumpe P01 */}
              <g transform="translate(80, 40)" className="cursor-pointer" onClick={() => handleComponentClick('P01')}>
                <circle cx="20" cy="20" r="18" fill={isHeating ? '#dc2626' : '#475569'} stroke="#fff" strokeWidth="2"/>
                <polygon points="20,8 28,26 12,26" fill="#fff"/>
                <text x="20" y="50" textAnchor="middle" fill={isHeating ? '#f87171' : '#94a3b8'} fontSize="9" fontWeight="bold">P01</text>
                <text x="20" y="62" textAnchor="middle" fill="#94a3b8" fontSize="8">0-10V</text>
              </g>
              
              {/* Temperaturfühler */}
              <circle cx="50" cy="20" r="6" fill="#475569" stroke="#fff" strokeWidth="1"/>
              <text x="50" y="23" textAnchor="middle" fill="#fff" fontSize="7">T</text>
              
              {/* Wärmezähler */}
              <rect x="20" y="80" width="28" height="16" rx="3" fill="#475569" stroke="#fff" strokeWidth="1"/>
              <text x="34" y="91" textAnchor="middle" fill="#fff" fontSize="6">WMZ</text>
              
              {/* Passstück */}
              <text x="20" y="110" fill="#94a3b8" fontSize="8">Passstück</text>
              
              {/* DN Labels */}
              <text x="120" y="55" fill="#94a3b8" fontSize="9">DN 80</text>
            </g>

            {/* ============================================
                 WÄRMETAUSCHER (UNTEN LINKS)
                 ============================================ */}
            <g transform="translate(200, 420)" className="cursor-pointer" onClick={() => handleComponentClick('WT1')}>
              {/* Rechteck mit Farbverlauf */}
              <rect x="0" y="0" width="80" height="100" fill="url(#wtGradient)" stroke="#8b5cf6" strokeWidth="2"/>
              
              {/* Platten-Linien */}
              <line x1="10" y1="15" x2="70" y2="15" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
              <line x1="10" y1="30" x2="70" y2="30" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
              <line x1="10" y1="45" x2="70" y2="45" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
              <line x1="10" y1="60" x2="70" y2="60" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
              <line x1="10" y1="75" x2="70" y2="75" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
              
              <text x="40" y="115" textAnchor="middle" fill="#94a3b8" fontSize="9">Wärmetauscher</text>
              <text x="40" y="128" textAnchor="middle" fill="#94a3b8" fontSize="9">Leistung:</text>
              <text x="40" y="141" textAnchor="middle" fill="#a78bfa" fontSize="10" fontWeight="bold">47 kW</text>
              
              {/* Temperaturfühler */}
              <circle cx="-10" cy="20" r="6" fill="#475569" stroke="#fff" strokeWidth="1"/>
              <text x="-10" y="23" textAnchor="middle" fill="#fff" fontSize="7">T</text>
              
              <circle cx="90" cy="80" r="6" fill="#475569" stroke="#fff" strokeWidth="1"/>
              <text x="90" y="83" textAnchor="middle" fill="#fff" fontSize="7">T</text>
              
              {/* DN Labels */}
              <text x="-40" y="105" fill="#94a3b8" fontSize="9">DN 80</text>
              <text x="90" y="105" fill="#94a3b8" fontSize="9">DN 80</text>
            </g>

            {/* ============================================
                 PUMPE P02 (OBEN MITTE)
                 ============================================ */}
            <g transform="translate(380, 180)" className="cursor-pointer" onClick={() => handleComponentClick('P02')}>
              <circle cx="20" cy="20" r="18" fill={isHeating ? '#dc2626' : '#475569'} stroke="#fff" strokeWidth="2"/>
              <polygon points="20,8 28,26 12,26" fill="#fff"/>
              <text x="20" y="50" textAnchor="middle" fill={isHeating ? '#f87171' : '#94a3b8'} fontSize="9" fontWeight="bold">P02</text>
              
              {/* Temperaturfühler */}
              <circle cx="-10" cy="5" r="6" fill="#475569" stroke="#fff" strokeWidth="1"/>
              <text x="-10" y="8" textAnchor="middle" fill="#fff" fontSize="7">T</text>
              
              <circle cx="-10" y="35" r="6" fill="#475569" stroke="#fff" strokeWidth="1"/>
              <text x="-10" y="38" textAnchor="middle" fill="#fff" fontSize="7">T</text>
              
              {/* DN Labels */}
              <text x="50" y="15" fill="#94a3b8" fontSize="9">DN 65</text>
              <text x="50" y="45" fill="#94a3b8" fontSize="9">DN 65</text>
            </g>

            {/* ============================================
                 PUMPE P03 (RECHTS VOM PUFFER)
                 ============================================ */}
            <g transform="translate(380, 280)" className="cursor-pointer" onClick={() => handleComponentClick('P03')}>
              <circle cx="20" cy="20" r="18" fill={isHeating ? '#dc2626' : '#475569'} stroke="#fff" strokeWidth="2"/>
              <polygon points="20,8 28,26 12,26" fill="#fff"/>
              <text x="20" y="50" textAnchor="middle" fill={isHeating ? '#f87171' : '#94a3b8'} fontSize="9" fontWeight="bold">P03</text>
              
              {/* Temperaturfühler */}
              <circle cx="50" cy="5" r="6" fill="#475569" stroke="#fff" strokeWidth="1"/>
              <text x="50" y="8" textAnchor="middle" fill="#fff" fontSize="7">T</text>
              
              {/* Auslegungsdaten */}
              <text x="60" y="-10" fill="#94a3b8" fontSize="8">Auslegung:</text>
              <text x="60" y="2" fill="#94a3b8" fontSize="8">DeltaT: 3K</text>
              <text x="60" y="14" fill="#94a3b8" fontSize="8">Glycol: 30%</text>
              <text x="60" y="26" fill="#94a3b8" fontSize="8">Massenstrom: 42,1 m³/h</text>
              
              {/* DN Labels */}
              <text x="50" y="65" fill="#94a3b8" fontSize="9">DN 100</text>
            </g>

            {/* ============================================
                 WÄRMEPUMPE (MITTE)
                 ============================================ */}
            <g transform="translate(500, 350)" className="cursor-pointer" onClick={() => handleComponentClick('WP1')}>
              <text x="60" y="-5" textAnchor="middle" fill="#94a3b8" fontSize="10">Wärmepumpe</text>
              
              {/* WP Kasten */}
              <rect x="0" y="10" width="120" height="100" rx="4" fill={isHeating ? '#c2410c' : '#475569'} stroke="#f97316" strokeWidth="2"/>
              
              <text x="60" y="35" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="bold">Wärmepumpe</text>
              <text x="60" y="52" textAnchor="middle" fill="#fdba74" fontSize="9">Nenn-Wärmeleistung:</text>
              <text x="60" y="67" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="bold">175 kW</text>
              <text x="60" y="82" textAnchor="middle" fill="#fdba74" fontSize="8">Elektrische</text>
              <text x="60" y="95" textAnchor="middle" fill="#fdba74" fontSize="8">Leistungsaufnahme: 38,9 kW</text>
              
              {/* Temperaturfühler */}
              <circle cx="60" cy="5" r="6" fill="#475569" stroke="#fff" strokeWidth="1"/>
              <text x="60" y="8" textAnchor="middle" fill="#fff" fontSize="7">T</text>
              
              {/* Ansprechdruck */}
              <text x="130" y="40" fill="#94a3b8" fontSize="9">Ansprechdruck</text>
              <text x="130" y="53" fill="#94a3b8" fontSize="9">SV: 3,5</text>
              <text x="130" y="66" fill="#94a3b8" fontSize="9">bar</text>
              
              {/* 400V */}
              <text x="60" y="125" textAnchor="middle" fill="#94a3b8" fontSize="9">400 V</text>
              
              {/* DN Labels */}
              <text x="130" y="100" fill="#94a3b8" fontSize="9">DN 100</text>
            </g>

            {/* ============================================
                 PUMPE P04 (RECHTS VON WP)
                 ============================================ */}
            <g transform="translate(680, 420)" className="cursor-pointer" onClick={() => handleComponentClick('P04')}>
              <circle cx="20" cy="20" r="18" fill={isHeating ? '#dc2626' : '#475569'} stroke="#fff" strokeWidth="2"/>
              <polygon points="20,8 28,26 12,26" fill="#fff"/>
              <text x="20" y="50" textAnchor="middle" fill={isHeating ? '#f87171' : '#94a3b8'} fontSize="9" fontWeight="bold">P04</text>
              
              {/* Anschlusstutzen */}
              <text x="50" y="-10" fill="#94a3b8" fontSize="8">Anschlusstutzen mit</text>
              <text x="50" y="2" fill="#94a3b8" fontSize="8">Absperrorgan und</text>
              <text x="50" y="14" fill="#94a3b8" fontSize="8">Storz-C Kupplung</text>
              
              {/* Temperaturfühler */}
              <circle cx="-10" cy="5" r="6" fill="#475569" stroke="#fff" strokeWidth="1"/>
              <text x="-10" y="8" textAnchor="middle" fill="#fff" fontSize="7">T</text>
              
              {/* Wärmezähler */}
              <rect x="-35" y="80" width="28" height="16" rx="3" fill="#475569" stroke="#fff" strokeWidth="1"/>
              <text x="-21" y="91" textAnchor="middle" fill="#fff" fontSize="6">WMZ</text>
              
              {/* Passstück */}
              <text x="-35" y="110" fill="#94a3b8" fontSize="8">Passstück</text>
              
              {/* Temperaturen */}
              <text x="50" y="65" fill="#f97316" fontSize="10">43°C</text>
              <text x="50" y="95" fill="#06b6d4" fontSize="10">38°C</text>
              
              {/* DN Labels */}
              <text x="50" y="115" fill="#94a3b8" fontSize="9">DN 100</text>
            </g>

            {/* ============================================
                 PUFFERSPEICHER HEIZUNG (RECHTS)
                 ============================================ */}
            <g transform="translate(850, 250)" className="cursor-pointer" onClick={() => handleComponentClick('PS2')}>
              <text x="60" y="-15" textAnchor="middle" fill="#94a3b8" fontSize="10">Pufferspeicher</text>
              <text x="60" y="-2" textAnchor="middle" fill="#94a3b8" fontSize="10">Heizung</text>
              <text x="60" y="155" textAnchor="middle" fill="#94a3b8" fontSize="10">1500 Liter</text>
              
              {/* Behälter */}
              <rect x="0" y="10" width="120" height="130" rx="8" fill="#9a3412" stroke="#f97316" strokeWidth="2"/>
              
              {/* Temperatur-Schichten */}
              <rect x="10" y="20" width="100" height="50" rx="4" fill="#dc2626" opacity="0.8"/>
              <text x="60" y="50" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="bold">{data?.vorlauftemperatur.toFixed(0) || '--'}°C</text>
              
              <rect x="10" y="75" width="100" height="55" rx="4" fill="#0891b2" opacity="0.7"/>
              <text x="60" y="108" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="bold">{data?.ruecklauftemperatur.toFixed(0) || '--'}°C</text>
              
              {/* Temperaturfühler */}
              <circle cx="60" cy="5" r="6" fill="#475569" stroke="#fff" strokeWidth="1"/>
              <text x="60" y="8" textAnchor="middle" fill="#fff" fontSize="7">T</text>
              
              <circle cx="60" y="55" r="6" fill="#475569" stroke="#fff" strokeWidth="1"/>
              <text x="60" y="58" textAnchor="middle" fill="#fff" fontSize="7">T</text>
              
              <circle cx="60" y="80" r="6" fill="#475569" stroke="#fff" strokeWidth="1"/>
              <text x="60" y="83" textAnchor="middle" fill="#fff" fontSize="7">T</text>
              
              <circle cx="60" y="145" r="6" fill="#475569" stroke="#fff" strokeWidth="1"/>
              <text x="60" y="148" textAnchor="middle" fill="#fff" fontSize="7">T</text>
            </g>

            {/* ============================================
                 PUMPE P05 (RECHTS VON PUFFER HZ)
                 ============================================ */}
            <g transform="translate(1020, 320)" className="cursor-pointer" onClick={() => handleComponentClick('P05')}>
              <circle cx="20" cy="20" r="18" fill={isHeating ? '#dc2626' : '#475569'} stroke="#fff" strokeWidth="2"/>
              <polygon points="20,8 28,26 12,26" fill="#fff"/>
              <text x="20" y="50" textAnchor="middle" fill={isHeating ? '#f87171' : '#94a3b8'} fontSize="9" fontWeight="bold">P05</text>
              
              {/* 0-10V */}
              <text x="20" y="62" textAnchor="middle" fill="#94a3b8" fontSize="8">0-10V</text>
              
              {/* Temperaturfühler */}
              <circle cx="50" cy="5" r="6" fill="#475569" stroke="#fff" strokeWidth="1"/>
              <text x="50" y="8" textAnchor="middle" fill="#fff" fontSize="7">T</text>
              
              {/* Magnetventil */}
              <g transform="translate(50, 70)" className="cursor-pointer" onClick={(e) => { e.stopPropagation(); handleComponentClick('MAG'); }}>
                <rect x="0" y="0" width="20" height="20" rx="4" fill="#475569" stroke="#fff" strokeWidth="1"/>
                <text x="10" y="13" textAnchor="middle" fill="#fff" fontSize="7">MAG</text>
                <text x="10" y="32" textAnchor="middle" fill="#94a3b8" fontSize="8">50l</text>
              </g>
              
              {/* DN Labels */}
              <text x="50" y="-10" fill="#94a3b8" fontSize="9">DN 80</text>
            </g>

            {/* ============================================
                 VERTEILER HEIZUNG (RECHTS)
                 ============================================ */}
            <g transform="translate(1100, 350)" className="cursor-pointer" onClick={() => handleComponentClick('VH')}>
              <rect x="0" y="0" width="160" height="60" rx="4" fill="#7c2d12" stroke="#f97316" strokeWidth="2"/>
              
              {/* Verteiler-Linien */}
              <line x1="20" y1="15" x2="140" y2="15" stroke="#fdba74" strokeWidth="2"/>
              <line x1="20" y1="30" x2="140" y2="30" stroke="#fdba74" strokeWidth="2"/>
              <line x1="20" y1="45" x2="140" y2="45" stroke="#fdba74" strokeWidth="2"/>
              
              {/* Abgänge */}
              <line x1="40" y1="15" x2="40" y2="0" stroke="#fdba74" strokeWidth="1.5"/>
              <line x1="80" y1="30" x2="80" y2="0" stroke="#fdba74" strokeWidth="1.5"/>
              <line x1="120" y1="45" x2="120" y2="0" stroke="#fdba74" strokeWidth="1.5"/>
              
              <text x="80" y="-10" textAnchor="middle" fill="#fb923c" fontSize="11" fontWeight="bold">VERTEILER HEIZUNG</text>
              
              {/* Temperaturfühler */}
              <circle cx="140" cy="5" r="6" fill="#475569" stroke="#fff" strokeWidth="1"/>
              <text x="140" y="8" textAnchor="middle" fill="#fff" fontSize="7">T</text>
              
              {/* DN Labels */}
              <text x="170" y="20" fill="#94a3b8" fontSize="9">DN 80</text>
              <text x="170" y="50" fill="#94a3b8" fontSize="9">DN 50</text>
            </g>

            {/* ============================================
                 DRUCKHALTESTATION (UNTER VERTEILER)
                 ============================================ */}
            <g transform="translate(1100, 450)">
              <text x="80" y="0" textAnchor="middle" fill="#94a3b8" fontSize="9">Druckhalte-,</text>
              <text x="80" y="13" textAnchor="middle" fill="#94a3b8" fontSize="9">Entgasungs- und</text>
              <text x="80" y="26" textAnchor="middle" fill="#94a3b8" fontSize="9">Nachspeisestation</text>
              
              {/* Station Symbol */}
              <rect x="20" y="35" width="30" height="30" rx="4" fill="#475569" stroke="#94a3b8" strokeWidth="1"/>
              <rect x="55" y="35" width="30" height="30" rx="4" fill="#475569" stroke="#94a3b8" strokeWidth="1"/>
              <rect x="90" y="35" width="30" height="30" rx="4" fill="#475569" stroke="#94a3b8" strokeWidth="1"/>
              
              {/* Anschlüsse */}
              <text x="140" y="45" fill="#94a3b8" fontSize="9">Anschluss TW</text>
              <text x="140" y="58" fill="#94a3b8" fontSize="9">Aufbereitung</text>
              <text x="140" y="71" fill="#94a3b8" fontSize="9">Systemtrenner BA</text>
            </g>

            {/* ============================================
                 ANSCHLUSS WEITERE STOCKWERKE (OBEN RECHTS)
                 ============================================ */}
            <g transform="translate(1100, 150)">
              <text x="0" y="0" fill="#94a3b8" fontSize="9">Anschluss</text>
              <text x="0" y="13" fill="#94a3b8" fontSize="9">weitere</text>
              <text x="0" y="26" fill="#94a3b8" fontSize="9">Stockwerke</text>
              
              {/* Wellenlinie */}
              <path d="M 80,20 Q 90,10 100,20 Q 110,30 120,20 Q 130,10 140,20" 
                    fill="none" stroke="#94a3b8" strokeWidth="1.5"/>
              
              {/* DN Labels */}
              <text x="80" y="50" fill="#94a3b8" fontSize="9">DN 65</text>
            </g>

            {/* ============================================
                 ZULEITUNG HEIZUNG ZU SATELLITENHAUS
                 ============================================ */}
            <g transform="translate(1000, 180)">
              <text x="0" y="0" fill="#94a3b8" fontSize="9">Zuleitung Heizung</text>
              <text x="0" y="13" fill="#94a3b8" fontSize="9">zu Satellitenhaus</text>
              <text x="0" y="26" fill="#94a3b8" fontSize="9">E</text>
              
              {/* DN Labels */}
              <text x="0" y="50" fill="#94a3b8" fontSize="9">DN 65</text>
            </g>

            {/* ============================================
                 PUFFERSPEICHER KÄLTE (RECHTS)
                 ============================================ */}
            <g transform="translate(1350, 280)" className="cursor-pointer" onClick={() => handleComponentClick('PS3')}>
              <text x="60" y="-15" textAnchor="middle" fill="#94a3b8" fontSize="10">Pufferspeicher</text>
              <text x="60" y="-2" textAnchor="middle" fill="#94a3b8" fontSize="10">Kälte</text>
              <text x="60" y="155" textAnchor="middle" fill="#94a3b8" fontSize="10">1000 Liter</text>
              
              {/* Behälter */}
              <rect x="0" y="10" width="120" height="130" rx="8" fill="#0e7490" stroke="#06b6d4" strokeWidth="2"/>
              
              {/* Temperatur-Schichten */}
              <rect x="10" y="20" width="100" height="50" rx="4" fill="#06b6d4" opacity="0.8"/>
              <text x="60" y="50" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="bold">22°C</text>
              
              <rect x="10" y="75" width="100" height="55" rx="4" fill="#0c4a6e" opacity="0.7"/>
              <text x="60" y="108" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="bold">18°C</text>
              
              {/* Temperaturfühler */}
              <circle cx="60" cy="5" r="6" fill="#475569" stroke="#fff" strokeWidth="1"/>
              <text x="60" y="8" textAnchor="middle" fill="#fff" fontSize="7">T</text>
              
              <circle cx="60" y="55" r="6" fill="#475569" stroke="#fff" strokeWidth="1"/>
              <text x="60" y="58" textAnchor="middle" fill="#fff" fontSize="7">T</text>
              
              <circle cx="60" y="80" r="6" fill="#475569" stroke="#fff" strokeWidth="1"/>
              <text x="60" y="83" textAnchor="middle" fill="#fff" fontSize="7">T</text>
              
              <circle cx="60" y="145" r="6" fill="#475569" stroke="#fff" strokeWidth="1"/>
              <text x="60" y="148" textAnchor="middle" fill="#fff" fontSize="7">T</text>
              
              {/* Pendelleitung */}
              <text x="-50" y="80" fill="#94a3b8" fontSize="9">Pendelleitung DN 20</text>
            </g>

            {/* ============================================
                 PUMPE P07 (RECHTS VON KÄLTEPUFFER)
                 ============================================ */}
            <g transform="translate(1520, 350)" className="cursor-pointer" onClick={() => handleComponentClick('P07')}>
              <circle cx="20" cy="20" r="18" fill={isStandby ? '#dc2626' : '#475569'} stroke="#fff" strokeWidth="2"/>
              <polygon points="20,8 28,26 12,26" fill="#fff"/>
              <text x="20" y="50" textAnchor="middle" fill={isStandby ? '#f87171' : '#94a3b8'} fontSize="9" fontWeight="bold">P07</text>
              
              {/* Temperaturfühler */}
              <circle cx="50" cy="5" r="6" fill="#475569" stroke="#fff" strokeWidth="1"/>
              <text x="50" y="8" textAnchor="middle" fill="#fff" fontSize="7">T</text>
              
              {/* Wärmezähler */}
              <rect x="50" y="70" width="28" height="16" rx="3" fill="#475569" stroke="#fff" strokeWidth="1"/>
              <text x="64" y="81" textAnchor="middle" fill="#fff" fontSize="6">WMZ</text>
              
              {/* Passstück */}
              <text x="50" y="100" fill="#94a3b8" fontSize="8">Passstück</text>
              
              {/* DN Labels */}
              <text x="50" y="-10" fill="#94a3b8" fontSize="9">DN 80</text>
            </g>

            {/* ============================================
                 VERTEILER KÜHLUNG (RECHTS)
                 ============================================ */}
            <g transform="translate(1550, 450)" className="cursor-pointer" onClick={() => handleComponentClick('VK')}>
              <rect x="0" y="0" width="160" height="60" rx="4" fill="#164e63" stroke="#06b6d4" strokeWidth="2"/>
              
              {/* Verteiler-Linien */}
              <line x1="20" y1="15" x2="140" y2="15" stroke="#67e8f9" strokeWidth="2"/>
              <line x1="20" y1="30" x2="140" y2="30" stroke="#67e8f9" strokeWidth="2"/>
              <line x1="20" y1="45" x2="140" y2="45" stroke="#67e8f9" strokeWidth="2"/>
              
              {/* Abgänge */}
              <line x1="40" y1="15" x2="40" y2="0" stroke="#67e8f9" strokeWidth="1.5"/>
              <line x1="80" y1="30" x2="80" y2="0" stroke="#67e8f9" strokeWidth="1.5"/>
              <line x1="120" y1="45" x2="120" y2="0" stroke="#67e8f9" strokeWidth="1.5"/>
              
              <text x="80" y="-10" textAnchor="middle" fill="#22d3ee" fontSize="11" fontWeight="bold">VERTEILER KÜHLUNG</text>
              
              {/* Temperaturfühler */}
              <circle cx="140" cy="5" r="6" fill="#475569" stroke="#fff" strokeWidth="1"/>
              <text x="140" y="8" textAnchor="middle" fill="#fff" fontSize="7">T</text>
              
              {/* DN Labels */}
              <text x="170" y="20" fill="#94a3b8" fontSize="9">DN 50</text>
              <text x="170" y="50" fill="#94a3b8" fontSize="9">DN 50</text>
            </g>

            {/* ============================================
                 ANSCHLUSS WEITERE STOCKWERKE KÜHLUNG
                 ============================================ */}
            <g transform="translate(1550, 150)">
              <text x="0" y="0" fill="#94a3b8" fontSize="9">Anschluss</text>
              <text x="0" y="13" fill="#94a3b8" fontSize="9">weitere</text>
              <text x="0" y="26" fill="#94a3b8" fontSize="9">Stockwerke</text>
              
              {/* Wellenlinie */}
              <path d="M 80,20 Q 90,10 100,20 Q 110,30 120,20 Q 130,10 140,20" 
                    fill="none" stroke="#94a3b8" strokeWidth="1.5"/>
              
              {/* DN Labels */}
              <text x="80" y="50" fill="#94a3b8" fontSize="9">DN 65</text>
            </g>

            {/* ============================================
                 ZULEITUNG KÜHLUNG ZU SATELLITENHAUS
                 ============================================ */}
            <g transform="translate(1700, 280)">
              <text x="0" y="0" fill="#94a3b8" fontSize="9">Zuleitung Kühlung</text>
              <text x="0" y="13" fill="#94a3b8" fontSize="9">zu Satellitenhaus</text>
              <text x="0" y="26" fill="#94a3b8" fontSize="9">E</text>
              
              {/* Temperaturen */}
              <text x="0" y="60" fill="#06b6d4" fontSize="10">22°C</text>
              <text x="0" y="80" fill="#3b82f6" fontSize="10">18°C</text>
              
              {/* DN Labels */}
              <text x="0" y="100" fill="#94a3b8" fontSize="9">DN 50</text>
            </g>

            {/* ============================================
                 PUMPE P06 (UNTEN)
                 ============================================ */}
            <g transform="translate(1100, 550)" className="cursor-pointer" onClick={() => handleComponentClick('P06')}>
              <circle cx="20" cy="20" r="18" fill={isStandby ? '#dc2626' : '#475569'} stroke="#fff" strokeWidth="2"/>
              <polygon points="20,8 28,26 12,26" fill="#fff"/>
              <text x="20" y="50" textAnchor="middle" fill={isStandby ? '#f87171' : '#94a3b8'} fontSize="9" fontWeight="bold">P06</text>
              
              {/* Temperaturfühler */}
              <circle cx="50" cy="5" r="6" fill="#475569" stroke="#fff" strokeWidth="1"/>
              <text x="50" y="8" textAnchor="middle" fill="#fff" fontSize="7">T</text>
              
              {/* Temperatur */}
              <text x="50" y="65" fill="#06b6d4" fontSize="10">18°C</text>
              
              {/* DN Labels */}
              <text x="50" y="-10" fill="#94a3b8" fontSize="9">DN 80</text>
            </g>

            {/* ============================================
                 ROHRLEITUNGEN (Verbindungen)
                 ============================================ */}
            
            {/* PVT zu Puffer */}
            <line x1="190" y1="135" x2="190" y2="200" stroke="#eab308" strokeWidth="6" strokeLinecap="round"/>
            
            {/* Abluft WP zu Puffer */}
            <line x1="450" y1="135" x2="450" y2="180" stroke="#eab308" strokeWidth="6" strokeLinecap="round"/>
            <line x1="400" y1="220" x2="450" y2="220" stroke="#eab308" strokeWidth="6" strokeLinecap="round"/>
            
            {/* Erdwärme zu Wärmetauscher */}
            <line x1="150" y1="320" x2="150" y2="420" stroke="#22c55e" strokeWidth="6" strokeLinecap="round"/>
            <line x1="150" y1="470" x2="200" y2="470" stroke="#22c55e" strokeWidth="6" strokeLinecap="round"/>
            
            {/* Wärmetauscher zu WP */}
            <line x1="280" y1="470" x2="500" y2="470" stroke="#eab308" strokeWidth="6" strokeLinecap="round"/>
            <line x1="500" y1="470" x2="500" y2="460" stroke="#eab308" strokeWidth="6" strokeLinecap="round"/>
            
            {/* Puffer PVT zu Pumpe P03 */}
            <line x1="320" y1="265" x2="380" y2="265" stroke="#f97316" strokeWidth="6" strokeLinecap="round"/>
            
            {/* Pumpe P03 zu Wärmetauscher */}
            <line x1="420" y1="300" x2="420" y2="420" stroke="#f97316" strokeWidth="6" strokeLinecap="round"/>
            <line x1="420" y1="420" x2="400" y2="470" stroke="#f97316" strokeWidth="6" strokeLinecap="round"/>
            
            {/* WP zu Pumpe P04 */}
            <line x1="620" y1="400" x2="680" y2="400" stroke="#ef4444" strokeWidth="6" strokeLinecap="round"/>
            
            {/* Pumpe P04 zu Puffer HZ */}
            <line x1="720" y1="440" x2="800" y2="350" stroke="#ef4444" strokeWidth="6" strokeLinecap="round"/>
            <line x1="800" y1="350" x2="850" y2="350" stroke="#ef4444" strokeWidth="6" strokeLinecap="round"/>
            
            {/* Puffer HZ zu Pumpe P05 */}
            <line x1="970" y1="320" x2="1020" y2="320" stroke="#ef4444" strokeWidth="6" strokeLinecap="round"/>
            
            {/* Pumpe P05 zu Verteiler */}
            <line x1="1060" y1="340" x2="1100" y2="380" stroke="#ef4444" strokeWidth="6" strokeLinecap="round"/>
            
            {/* Verteiler zu Anschluss */}
            <line x1="1180" y1="200" x2="1180" y2="350" stroke="#ef4444" strokeWidth="6" strokeLinecap="round"/>
            
            {/* Kältepuffer zu Pumpe P07 */}
            <line x1="1470" y1="350" x2="1520" y2="350" stroke="#06b6d4" strokeWidth="6" strokeLinecap="round"/>
            
            {/* Pumpe P07 zu Verteiler Kühlung */}
            <line x1="1560" y1="370" x2="1560" y2="450" stroke="#06b6d4" strokeWidth="6" strokeLinecap="round"/>
            
            {/* Verteiler Kühlung zu Anschluss */}
            <line x1="1630" y1="300" x2="1630" y2="450" stroke="#06b6d4" strokeWidth="6" strokeLinecap="round"/>
            
            {/* Pumpe P06 zu Kältepuffer */}
            <line x1="1180" y1="570" x2="1180" y2="600" stroke="#06b6d4" strokeWidth="6" strokeLinecap="round"/>
            <line x1="1180" y1="600" x2="1350" y2="600" stroke="#06b6d4" strokeWidth="6" strokeLinecap="round"/>
            <line x1="1350" y1="600" x2="1350" y2="410" stroke="#06b6d4" strokeWidth="6" strokeLinecap="round"/>

            {/* ============================================
                 STRÖMUNGSPFEILE (animiert)
                 ============================================ */}
            {showFlow && isHeating && (
              <>
                <polygon points="186,170 194,170 190,180" fill="#22c55e">
                  <animate attributeName="opacity" values="0.3;1;0.3" dur="1s" repeatCount="indefinite"/>
                </polygon>
                <polygon points="446,200 454,200 450,210" fill="#22c55e">
                  <animate attributeName="opacity" values="0.3;1;0.3" dur="1s" repeatCount="indefinite" begin="0.2s"/>
                </polygon>
                <polygon points="154,400 154,408 146,404" fill="#22c55e">
                  <animate attributeName="opacity" values="0.3;1;0.3" dur="1s" repeatCount="indefinite" begin="0.4s"/>
                </polygon>
                <polygon points="350,466 350,474 360,470" fill="#22c55e">
                  <animate attributeName="opacity" values="0.3;1;0.3" dur="1s" repeatCount="indefinite" begin="0.6s"/>
                </polygon>
                <polygon points="650,396 650,404 660,400" fill="#22c55e">
                  <animate attributeName="opacity" values="0.3;1;0.3" dur="1s" repeatCount="indefinite" begin="0.8s"/>
                </polygon>
                <polygon points="900,346 900,354 910,350" fill="#22c55e">
                  <animate attributeName="opacity" values="0.3;1;0.3" dur="1s" repeatCount="indefinite"/>
                </polygon>
              </>
            )}

            {showFlow && isStandby && (
              <>
                <polygon points="1456,360 1464,360 1460,370" fill="#22c55e">
                  <animate attributeName="opacity" values="0.3;1;0.3" dur="1s" repeatCount="indefinite"/>
                </polygon>
                <polygon points="1556,420 1556,428 1564,424" fill="#22c55e">
                  <animate attributeName="opacity" values="0.3;1;0.3" dur="1s" repeatCount="indefinite" begin="0.3s"/>
                </polygon>
              </>
            )}

          </svg>
        </div>
      </div>

      {/* Komponenten-Details Panel */}
      {selectedComponent && (
        <Card className="border-[#1e2736] bg-slate-800/90 backdrop-blur">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-emerald-400" />
                {selectedComponent.name}
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedComponent(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </Button>
            </div>
            <p className="text-xs text-slate-400">{selectedComponent.description}</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-2 rounded bg-[#1a2030]">
                <p className="text-[10px] text-slate-400 uppercase">ID</p>
                <p className="text-sm font-mono text-emerald-400">{selectedComponent.id}</p>
              </div>
              <div className="p-2 rounded bg-[#1a2030]">
                <p className="text-[10px] text-slate-400 uppercase">Status</p>
                <Badge className={
                  selectedComponent.status === 'running' 
                    ? 'bg-green-500/20 text-green-400 text-xs' 
                    : selectedComponent.status === 'standby'
                    ? 'bg-yellow-500/20 text-yellow-400 text-xs'
                    : 'bg-slate-500/20 text-slate-400 text-xs'
                }>
                  {selectedComponent.status === 'running' ? 'LAUFEND' : 
                   selectedComponent.status === 'standby' ? 'BEREIT' : 'AUS'}
                </Badge>
              </div>
              {selectedComponent.temp !== undefined && (
                <div className="p-2 rounded bg-[#1a2030]">
                  <p className="text-[10px] text-slate-400 uppercase">Temperatur</p>
                  <p className="text-sm font-semibold text-orange-400">
                    {selectedComponent.temp.toFixed(1)}°C
                    {selectedComponent.tempReturn && ` / ${selectedComponent.tempReturn.toFixed(1)}°C`}
                  </p>
                </div>
              )}
              {selectedComponent.flow !== undefined && (
                <div className="p-2 rounded bg-[#1a2030]">
                  <p className="text-[10px] text-slate-400 uppercase">Durchfluss</p>
                  <p className="text-sm font-semibold text-emerald-400">
                    {selectedComponent.flow.toFixed(1)} m³/h
                  </p>
                </div>
              )}
              {selectedComponent.dn && (
                <div className="p-2 rounded bg-[#1a2030]">
                  <p className="text-[10px] text-slate-400 uppercase">Nennweite</p>
                  <p className="text-sm font-semibold text-slate-300">{selectedComponent.dn}</p>
                </div>
              )}
              {selectedComponent.power && (
                <div className="p-2 rounded bg-[#1a2030]">
                  <p className="text-[10px] text-slate-400 uppercase">Leistung/Kapazität</p>
                  <p className="text-sm font-semibold text-yellow-400">
                    {selectedComponent.power}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legende */}
      <Card className="border-[#1e2736] bg-[#111620]/80">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-white">Legende</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-600 border-2 border-white" />
              <span className="text-slate-400">Pumpe läuft</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-slate-600 border-2 border-slate-400" />
              <span className="text-slate-400">Pumpe aus</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-2 rounded bg-gradient-to-r from-yellow-500 to-red-500" />
              <span className="text-slate-400">Heiß &gt;40°C</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-2 rounded bg-gradient-to-r from-cyan-500 to-blue-500" />
              <span className="text-slate-400">Kalt &lt;25°C</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-slate-600 border border-white flex items-center justify-center">
                <span className="text-[8px] text-white">T</span>
              </div>
              <span className="text-slate-400">Temperaturfühler</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-3 rounded bg-slate-600 border border-white flex items-center justify-center">
                <span className="text-[6px] text-white">WMZ</span>
              </div>
              <span className="text-slate-400">Wärmezähler</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

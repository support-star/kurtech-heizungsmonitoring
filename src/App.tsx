import { useSecureAuth } from '@/hooks/useSecureAuth';
import { useMQTTData } from '@/hooks/useMQTTData';
import { Login } from '@/sections/Login';
import { Header } from '@/sections/Header';
import { LiveStatus } from '@/sections/LiveStatus';
import { HistoryCharts } from '@/sections/HistoryCharts';
import { Alarms } from '@/sections/Alarms';
import { SystemSchema } from '@/sections/SystemSchema';
import { PIDDiagram } from '@/sections/PIDDiagram';
import { Settings } from '@/sections/Settings';
import { StandorteDashboard } from '@/sections/StandorteDashboard';
import { Control } from '@/sections/Control';
import { OptimizationPanel } from '@/sections/OptimizationPanel';
import { MonitoringPanel } from '@/sections/MonitoringPanel';
import { EnergyCalculator } from '@/sections/EnergyCalculator';
import { Maintenance } from '@/sections/Maintenance';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Thermometer, Zap, Clock, TrendingUp, Activity, WifiOff } from 'lucide-react';
import { BRAND, ANLAGE_CONFIG } from '@/config/runtime.config';

export type ViewType = 'dashboard' | 'standorte' | 'schema' | 'pid' | 'settings' | 'control' | 'optimization' | 'monitoring' | 'energy' | 'maintenance';

// ─── KPI Top Bar ─────────────────────────────────────────────
interface KPIBarProps {
  liveData: import('@/types/heating').HeatingData | null;
  isConnected: boolean;
  isSimulation: boolean;
}

const KPIBar = ({ liveData, isConnected, isSimulation }: KPIBarProps) => {
  const kpis = [
    {
      label: 'Vorlauftemp.',
      value: liveData ? `${liveData.vorlauftemperatur.toFixed(1)}°C` : '—',
      icon: <Thermometer className="w-4 h-4" />,
      color: 'orange',
      sub: liveData ? `RL: ${liveData.ruecklauftemperatur.toFixed(1)}°C` : 'Keine Daten',
    },
    {
      label: 'COP Leistungszahl',
      value: liveData ? liveData.cop.toFixed(2) : '—',
      icon: <TrendingUp className="w-4 h-4" />,
      color: liveData && liveData.cop >= 3.5 ? 'emerald' : 'amber',
      sub: liveData ? (liveData.cop >= 4 ? 'Exzellent' : liveData.cop >= 3.5 ? 'Sehr gut' : 'Gut') : '',
    },
    {
      label: 'Stromverbrauch',
      value: liveData ? `${liveData.stromverbrauch.toFixed(1)} kW` : '—',
      icon: <Zap className="w-4 h-4" />,
      color: 'amber',
      sub: liveData ? `~${(liveData.stromverbrauch * 0.35).toFixed(2)} €/h` : '',
    },
    {
      label: 'Betriebsstunden',
      value: liveData ? Math.floor(liveData.betriebsstunden).toLocaleString('de-DE') : '—',
      icon: <Clock className="w-4 h-4" />,
      color: 'sky',
      sub: `Anlage ${ANLAGE_CONFIG.id}`,
    },
    {
      label: 'System Status',
      value: liveData ? { heizen: 'Heizen', standby: 'Standby', stoerung: 'Störung', abtauen: 'Abtauen' }[liveData.status] || liveData.status : (isConnected || isSimulation) ? 'Verbunden' : 'Getrennt',
      icon: <Activity className="w-4 h-4" />,
      color: liveData?.status === 'heizen' ? 'orange' : liveData?.status === 'stoerung' ? 'red' : liveData?.status === 'abtauen' ? 'sky' : 'emerald',
      sub: isSimulation ? 'Demo-Modus' : isConnected ? 'MQTT Live' : 'Offline',
    },
  ];

  const colorMap: Record<string, { text: string; bg: string; border: string; dot: string }> = {
    emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500/8', border: 'border-emerald-500/15', dot: 'bg-emerald-400' },
    orange:  { text: 'text-orange-400',  bg: 'bg-orange-500/8',  border: 'border-orange-500/15',  dot: 'bg-orange-400' },
    amber:   { text: 'text-amber-400',   bg: 'bg-amber-500/8',   border: 'border-amber-500/15',   dot: 'bg-amber-400' },
    sky:     { text: 'text-sky-400',     bg: 'bg-sky-500/8',     border: 'border-sky-500/15',     dot: 'bg-sky-400' },
    red:     { text: 'text-red-400',     bg: 'bg-red-500/8',     border: 'border-red-500/15',     dot: 'bg-red-400' },
    violet:  { text: 'text-violet-400',  bg: 'bg-violet-500/8',  border: 'border-violet-500/15',  dot: 'bg-violet-400' },
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6 fade-up">
      {kpis.map((kpi) => {
        const c = colorMap[kpi.color] || colorMap.emerald;
        return (
          <div key={kpi.label}
            className={`relative rounded-xl border ${c.border} ${c.bg} p-4 overflow-hidden group`}
          >
            {/* Gradient accent top */}
            <div className={`absolute top-0 left-0 right-0 h-0.5 ${c.dot} opacity-40`} />
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-1 truncate">{kpi.label}</p>
                <p className={`text-xl font-bold font-mono ${c.text} leading-tight`}>{kpi.value}</p>
                <p className="text-[10px] text-slate-600 mt-0.5 truncate">{kpi.sub}</p>
              </div>
              <div className={`${c.text} opacity-60 mt-0.5 shrink-0`}>{kpi.icon}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const { isAuthenticated, user, login, logout } = useSecureAuth();
  const {
    liveData, historicalData, alarms, timeRange, setTimeRange,
    acknowledgeAlarm, exportData, isConnected, connectionError,
    reconnect, isSimulation,
  } = useMQTTData();

  const prevAlarmCountRef = useRef(0);

  useEffect(() => {
    const unack = alarms.filter(a => !a.acknowledged);
    if (unack.length > prevAlarmCountRef.current && prevAlarmCountRef.current > 0) {
      const latest = unack[0];
      if (latest.type === 'error') toast.error(latest.title, { description: latest.message, duration: 5000 });
      else if (latest.type === 'warning') toast.warning(latest.title, { description: latest.message, duration: 5000 });
    }
    prevAlarmCountRef.current = unack.length;
  }, [alarms]);

  const hasShownConnected = useRef(false);
  useEffect(() => {
    if (isConnected && !hasShownConnected.current) {
      hasShownConnected.current = true;
      toast.success(isSimulation ? 'Demo-Modus aktiv' : '✓ MQTT-Broker verbunden', { duration: 3000 });
    }
  }, [isConnected, isSimulation]);

  useEffect(() => {
    if (connectionError) toast.error('MQTT Verbindungsfehler', { description: connectionError, duration: 5000 });
  }, [connectionError]);

  if (!isAuthenticated) {
    return (
      <>
        <Login onLogin={login} />
        <Toaster position="top-center" toastOptions={{ style: { background: '#0d1119', color: '#f1f5f9', border: '1px solid #1a2235' } }} />
      </>
    );
  }

  const unacknowledgedAlarmCount = alarms.filter(a => !a.acknowledged).length;

  // ── Shared sidebar ──────────────────────────────────────────
  const LiveSidebar = () => (
    <div className="lg:col-span-3">
      <div className="sticky top-20">
        <LiveStatus data={liveData} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#060a10]">
      {/* Subtle grid bg */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.025]"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
      />

      {/* Connection banner */}
      {!isConnected && !isSimulation && (
        <div className="relative z-50 bg-red-500/10 border-b border-red-500/25 px-4 py-2">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-400 text-xs">
              <WifiOff className="w-3.5 h-3.5" />
              <span>{connectionError ? `Verbindung unterbrochen: ${connectionError}` : 'Verbindung zum MQTT-Broker wird hergestellt…'}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={reconnect} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-7 text-xs">
              <RefreshCw className="w-3 h-3 mr-1" /> Neu verbinden
            </Button>
          </div>
        </div>
      )}

      {isSimulation && (
        <div className="relative z-50 bg-emerald-500/6 border-b border-emerald-500/15 px-4 py-1.5">
          <div className="container mx-auto flex items-center justify-center gap-2 text-[11px] text-emerald-400/70">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
            Demo-Modus · Simulierte Daten · Kein Live-MQTT
          </div>
        </div>
      )}

      <Header
        user={user}
        onLogout={logout}
        isConnected={isConnected}
        alarmCount={unacknowledgedAlarmCount}
        currentView={currentView}
        onViewChange={setCurrentView}
        isSimulation={isSimulation}
      />

      <main className="relative container mx-auto px-3 sm:px-4 py-5">

        {/* ── DASHBOARD ──────────────────────────────────────── */}
        {currentView === 'dashboard' && (
          <>
            <KPIBar liveData={liveData} isConnected={isConnected} isSimulation={isSimulation} />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <LiveSidebar />
              <div className="lg:col-span-6 space-y-4">
                <HistoryCharts data={historicalData} timeRange={timeRange} onTimeRangeChange={setTimeRange} onExport={exportData} />
              </div>
              <div className="lg:col-span-3">
                <div className="sticky top-20">
                  <Alarms alarms={alarms} onAcknowledge={acknowledgeAlarm} />
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── SCHEMA ──────────────────────────────────────────── */}
        {currentView === 'schema' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 fade-up">
            <LiveSidebar />
            <div className="lg:col-span-9">
              <div className="card-base p-6">
                <SystemSchema data={liveData} />
              </div>
            </div>
          </div>
        )}

        {/* ── P&ID ──────────────────────────────────────────── */}
        {currentView === 'pid' && (
          <div className="fade-up">
            <PIDDiagram data={liveData} />
          </div>
        )}

        {/* ── SETTINGS ──────────────────────────────────────── */}
        {currentView === 'settings' && (
          <div className="fade-up">
            <Settings user={user} isSimulation={isSimulation} />
          </div>
        )}

        {/* ── STANDORTE ─────────────────────────────────────── */}
        {currentView === 'standorte' && (
          <div className="fade-up">
            <StandorteDashboard data={liveData} />
          </div>
        )}

        {/* ── STEUERUNG ─────────────────────────────────────── */}
        {currentView === 'control' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 fade-up">
            <LiveSidebar />
            <div className="lg:col-span-9">
              <Control currentTemp={liveData?.puffer_mitte} isHeating={liveData?.status === 'heizen'} />
            </div>
          </div>
        )}

        {/* ── ENERGIE / KOSTEN ──────────────────────────────── */}
        {currentView === 'energy' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 fade-up">
            <LiveSidebar />
            <div className="lg:col-span-9">
              <EnergyCalculator liveData={liveData} historicalData={historicalData} />
            </div>
          </div>
        )}

        {/* ── WARTUNG ───────────────────────────────────────── */}
        {currentView === 'maintenance' && (
          <div className="fade-up">
            <Maintenance />
          </div>
        )}

        {/* ── OPTIMIERUNG ───────────────────────────────────── */}
        {currentView === 'optimization' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 fade-up">
            <LiveSidebar />
            <div className="lg:col-span-9">
              <OptimizationPanel />
            </div>
          </div>
        )}

        {/* ── MONITORING ────────────────────────────────────── */}
        {currentView === 'monitoring' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 fade-up">
            <LiveSidebar />
            <div className="lg:col-span-9">
              <MonitoringPanel isMqttConnected={isConnected} lastDataTimestamp={liveData?.timestamp || null} />
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-10 pt-5 border-t border-[#1a2235]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-600">
            <div className="flex items-center gap-3">
              <span className="text-emerald-500 font-semibold">{BRAND.name}</span>
              <span>{BRAND.product} · v{BRAND.version}</span>
              <span className="hidden sm:inline">© 2026 {BRAND.fullName}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />
                {isSimulation ? 'Simulation' : isConnected ? 'MQTT verbunden · wss://' : 'MQTT getrennt'}
              </span>
              <span className="hidden sm:inline">Anlage: {ANLAGE_CONFIG.id}</span>
            </div>
          </div>
        </footer>
      </main>

      <Toaster
        position="top-right"
        toastOptions={{ style: { background: '#0d1119', color: '#f1f5f9', border: '1px solid #1a2235' } }}
      />
    </div>
  );
}

export default App;

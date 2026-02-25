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
import { RefreshCw, AlertTriangle, Activity, Zap, Clock } from 'lucide-react';
import { BRAND, ANLAGE_CONFIG } from '@/config/runtime.config';

export type ViewType = 'dashboard' | 'standorte' | 'schema' | 'pid' | 'settings' | 'control' | 'optimization' | 'monitoring' | 'energy' | 'maintenance';

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
      toast.success(isSimulation ? 'Simulationsmodus aktiv' : 'Mit MQTT-Broker verbunden', { duration: 3000 });
    }
  }, [isConnected, isSimulation]);

  useEffect(() => {
    if (connectionError) toast.error('MQTT Verbindungsfehler', { description: connectionError, duration: 5000 });
  }, [connectionError]);

  if (!isAuthenticated) {
    return (
      <>
        <Login onLogin={login} />
        <Toaster position="top-center" toastOptions={{ style: { background: 'hsl(220 20% 10%)', color: 'hsl(210 40% 98%)', border: '1px solid hsl(220 15% 20%)' } }} />
      </>
    );
  }

  const unacknowledgedAlarmCount = alarms.filter(a => !a.acknowledged).length;

  // Seitenleiste-Views (mit LiveStatus links)
  const withSidebar = (main: React.ReactNode) => (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
      <div className="xl:col-span-3">
        <div className="sticky top-24">
          <LiveStatus data={liveData} />
        </div>
      </div>
      <div className="xl:col-span-9">{main}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#080b10]">
      {/* Dot grid background */}
      <div className="fixed inset-0 opacity-[0.025] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.8) 1px, transparent 0)', backgroundSize: '28px 28px' }}
      />
      {/* Ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-500/3 rounded-full blur-[150px] pointer-events-none" />

      {/* Connection banner */}
      {!isConnected && !isSimulation && (
        <div className="relative z-50 bg-red-500/10 border-b border-red-500/30 px-4 py-2">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>{connectionError ? `MQTT unterbrochen: ${connectionError}` : 'Verbindung wird hergestellt...'}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={reconnect} className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
              <RefreshCw className="w-4 h-4 mr-1" /> Neu verbinden
            </Button>
          </div>
        </div>
      )}

      {isSimulation && (
        <div className="relative z-50 bg-emerald-500/5 border-b border-emerald-500/15 px-4 py-1.5">
          <div className="container mx-auto flex items-center justify-center gap-2 text-xs text-emerald-400/70">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
            Demo-Modus – Simulierte Daten
          </div>
        </div>
      )}

      <Header
        user={user} onLogout={logout} isConnected={isConnected}
        alarmCount={unacknowledgedAlarmCount} currentView={currentView}
        onViewChange={setCurrentView} isSimulation={isSimulation}
      />

      <main className="relative container mx-auto px-4 py-6">

        {/* ── DASHBOARD ── */}
        {currentView === 'dashboard' && (
          <div className="space-y-6">
            {/* Top KPI row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <KPICard label="Aktuelle COP" value={liveData?.cop?.toFixed(2) || '--'} color="emerald"
                sub={liveData && liveData.cop > 3.5 ? '✓ Sehr effizient' : '~ Gute Effizienz'}
                icon={<Activity className="w-4 h-4" />} />
              <KPICard label="Stromverbrauch" value={`${liveData?.stromverbrauch?.toFixed(1) || '--'}`} unit="kWh" color="amber"
                sub={`~${((liveData?.stromverbrauch || 0) * 0.35).toFixed(2)} €/h`}
                icon={<Zap className="w-4 h-4" />} />
              <KPICard label="Vorlauf" value={`${liveData?.vorlauftemperatur?.toFixed(1) || '--'}`} unit="°C" color="orange"
                sub={`Rücklauf ${liveData?.ruecklauftemperatur?.toFixed(1) || '--'}°C`}
                icon={<Activity className="w-4 h-4" />} />
              <KPICard label="Betriebsstunden" value={liveData ? Math.floor(liveData.betriebsstunden).toLocaleString('de-DE') : '--'} unit="h"
                color="sky" sub={`Anlage ${ANLAGE_CONFIG.id}`}
                icon={<Clock className="w-4 h-4" />} />
            </div>

            {/* Main 3-column layout */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              <div className="xl:col-span-3">
                <div className="sticky top-24">
                  <LiveStatus data={liveData} />
                </div>
              </div>
              <div className="xl:col-span-6">
                <HistoryCharts data={historicalData} timeRange={timeRange} onTimeRangeChange={setTimeRange} onExport={exportData} />
              </div>
              <div className="xl:col-span-3">
                <div className="sticky top-24">
                  <Alarms alarms={alarms} onAcknowledge={acknowledgeAlarm} />
                </div>
              </div>
            </div>
          </div>
        )}

        {currentView === 'schema' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <div className="xl:col-span-3"><div className="sticky top-24"><LiveStatus data={liveData} /></div></div>
            <div className="xl:col-span-9">
              <div className="p-6 rounded-2xl bg-[#111620]/80 border border-[#1e2736]">
                <SystemSchema data={liveData} />
              </div>
            </div>
          </div>
        )}

        {currentView === 'pid' && <div className="w-full"><PIDDiagram data={liveData} /></div>}

        {currentView === 'settings' && <Settings user={user} isSimulation={isSimulation} />}

        {currentView === 'standorte' && <StandorteDashboard data={liveData} />}

        {currentView === 'control' && withSidebar(
          <Control currentTemp={liveData?.puffer_mitte} isHeating={liveData?.status === 'heizen'} />
        )}

        {currentView === 'optimization' && withSidebar(<OptimizationPanel />)}

        {currentView === 'monitoring' && withSidebar(
          <MonitoringPanel isMqttConnected={isConnected} lastDataTimestamp={liveData?.timestamp || null} />
        )}

        {/* ── NEW: ENERGIE-KOSTENRECHNER ── */}
        {currentView === 'energy' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white">Energie & Kosten</h2>
              <p className="text-sm text-slate-400 mt-1">Betriebskosten berechnen und mit alternativen Heizsystemen vergleichen</p>
            </div>
            <EnergyCalculator liveData={liveData} historicalData={historicalData} />
          </div>
        )}

        {/* ── NEW: WARTUNGSPLAN ── */}
        {currentView === 'maintenance' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white">Wartungsplan & Servicelogbuch</h2>
              <p className="text-sm text-slate-400 mt-1">Fälligkeiten überwachen und Wartungshistorie dokumentieren</p>
            </div>
            <Maintenance />
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 pt-6 border-t border-[#1e2736]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-4">
              <span className="text-emerald-500 font-semibold">{BRAND.name}</span>
              <span>{BRAND.product} v{BRAND.version}</span>
              <span>© 2026 {BRAND.fullName}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />
                {isSimulation ? 'Simulation' : isConnected ? 'MQTT verbunden (wss://)' : 'MQTT getrennt'}
              </span>
              <span>{ANLAGE_CONFIG.id}</span>
            </div>
          </div>
        </footer>
      </main>

      <Toaster position="top-right" toastOptions={{ style: { background: 'hsl(220 20% 10%)', color: 'hsl(210 40% 98%)', border: '1px solid hsl(220 15% 20%)' } }} />
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────
interface KPICardProps {
  label: string; value: string; unit?: string; sub: string;
  color: 'emerald' | 'amber' | 'orange' | 'sky'; icon: React.ReactNode;
}

const colorMap = {
  emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500/8', border: 'border-emerald-500/15', icon: 'bg-emerald-500/10 text-emerald-400' },
  amber:   { text: 'text-amber-400',   bg: 'bg-amber-500/8',   border: 'border-amber-500/15',   icon: 'bg-amber-500/10 text-amber-400' },
  orange:  { text: 'text-orange-400',  bg: 'bg-orange-500/8',  border: 'border-orange-500/15',  icon: 'bg-orange-500/10 text-orange-400' },
  sky:     { text: 'text-sky-400',     bg: 'bg-sky-500/8',     border: 'border-sky-500/15',     icon: 'bg-sky-500/10 text-sky-400' },
};

function KPICard({ label, value, unit, sub, color, icon }: KPICardProps) {
  const c = colorMap[color];
  return (
    <div className={`p-4 rounded-2xl border ${c.border} ${c.bg} backdrop-blur-sm`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-slate-400">{label}</p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${c.icon}`}>{icon}</div>
      </div>
      <p className={`text-2xl font-bold ${c.text}`}>
        {value}
        {unit && <span className="text-sm font-normal text-slate-400 ml-1">{unit}</span>}
      </p>
      <p className="text-[11px] text-slate-500 mt-1">{sub}</p>
    </div>
  );
}

export default App;

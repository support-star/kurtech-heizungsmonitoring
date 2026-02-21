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
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { BRAND, ANLAGE_CONFIG } from '@/config/runtime.config';

export type ViewType = 'dashboard' | 'standorte' | 'schema' | 'pid' | 'settings';

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const { isAuthenticated, user, login, logout } = useSecureAuth();
  const {
    liveData, historicalData, alarms, timeRange, setTimeRange,
    acknowledgeAlarm, exportData, isConnected, connectionError,
    reconnect, isSimulation,
  } = useMQTTData();

  // Track previous alarm count to only toast NEW alarms
  const prevAlarmCountRef = useRef(0);

  useEffect(() => {
    const unack = alarms.filter(a => !a.acknowledged);
    if (unack.length > prevAlarmCountRef.current && prevAlarmCountRef.current > 0) {
      const latest = unack[0];
      if (latest.type === 'error') {
        toast.error(latest.title, { description: latest.message, duration: 5000 });
      } else if (latest.type === 'warning') {
        toast.warning(latest.title, { description: latest.message, duration: 5000 });
      }
    }
    prevAlarmCountRef.current = unack.length;
  }, [alarms]);

  // Connection status toast – nur einmal
  const hasShownConnected = useRef(false);
  useEffect(() => {
    if (isConnected && !hasShownConnected.current) {
      hasShownConnected.current = true;
      toast.success(isSimulation ? 'Simulationsmodus aktiv' : 'Mit MQTT-Broker verbunden', {
        duration: 3000,
      });
    }
  }, [isConnected, isSimulation]);

  useEffect(() => {
    if (connectionError) {
      toast.error('MQTT Verbindungsfehler', { description: connectionError, duration: 5000 });
    }
  }, [connectionError]);

  if (!isAuthenticated) {
    return (
      <>
        <Login onLogin={login} />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: 'hsl(220 20% 10%)',
              color: 'hsl(210 40% 98%)',
              border: '1px solid hsl(220 15% 20%)',
            },
          }}
        />
      </>
    );
  }

  const unacknowledgedAlarmCount = alarms.filter(a => !a.acknowledged).length;

  return (
    <div className="min-h-screen bg-[#0a0e14]">
      {/* Subtile Hintergrund-Textur */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}
      />

      {/* Verbindungsstatus Banner */}
      {!isConnected && !isSimulation && (
        <div className="relative z-50 bg-red-500/10 border-b border-red-500/30 px-4 py-2">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>
                {connectionError
                  ? `MQTT-Verbindung unterbrochen: ${connectionError}`
                  : 'Verbindung zum MQTT-Broker wird hergestellt...'}
              </span>
            </div>
            <Button
              variant="ghost" size="sm" onClick={reconnect}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              <RefreshCw className="w-4 h-4 mr-1" /> Neu verbinden
            </Button>
          </div>
        </div>
      )}

      {/* Simulation-Badge */}
      {isSimulation && (
        <div className="relative z-50 bg-emerald-500/8 border-b border-emerald-500/20 px-4 py-1.5">
          <div className="container mx-auto flex items-center justify-center gap-2 text-xs text-emerald-400/80">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Demo-Modus – Simulierte Daten
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

      <main className="relative container mx-auto px-4 py-6">
        {currentView === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Live-Status */}
            <div className="lg:col-span-3">
              <div className="sticky top-24">
                <LiveStatus data={liveData} />
              </div>
            </div>

            {/* Charts & KPIs */}
            <div className="lg:col-span-6">
              <HistoryCharts
                data={historicalData}
                timeRange={timeRange}
                onTimeRangeChange={setTimeRange}
                onExport={exportData}
              />

              {/* KPI-Karten */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                <KPICard
                  label="Aktuelle COP"
                  value={liveData?.cop?.toFixed(1) || '--'}
                  sub={liveData && liveData.cop > 3.5 ? 'Sehr effizient' : 'Gute Effizienz'}
                  color="emerald"
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  }
                />
                <KPICard
                  label="Stromverbrauch"
                  value={`${liveData?.stromverbrauch?.toFixed(1) || '--'}`}
                  unit="kWh"
                  sub={`~${((liveData?.stromverbrauch || 0) * 0.35).toFixed(2)} €/h`}
                  color="amber"
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  }
                />
                <KPICard
                  label="Betriebsstunden"
                  value={liveData ? Math.floor(liveData.betriebsstunden).toLocaleString('de-DE') : '--'}
                  unit="h"
                  sub={`Anlage ${ANLAGE_CONFIG.id}`}
                  color="sky"
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                />
              </div>
            </div>

            {/* Alarme */}
            <div className="lg:col-span-3">
              <div className="sticky top-24">
                <Alarms alarms={alarms} onAcknowledge={acknowledgeAlarm} />
              </div>
            </div>
          </div>
        )}

        {currentView === 'schema' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-3">
              <div className="sticky top-24">
                <LiveStatus data={liveData} />
              </div>
            </div>
            <div className="lg:col-span-9">
              <div className="p-6 rounded-2xl bg-[#111620]/80 border border-[#1e2736]">
                <SystemSchema data={liveData} />
              </div>
            </div>
          </div>
        )}

        {currentView === 'pid' && (
          <div className="w-full">
            <PIDDiagram data={liveData} />
          </div>
        )}

        {currentView === 'settings' && (
          <Settings user={user} isSimulation={isSimulation} />
        )}

        {currentView === 'standorte' && (
          <StandorteDashboard data={liveData} />
        )}

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-[#1e2736]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="text-emerald-500 font-semibold">{BRAND.name}</span>
                <span>{BRAND.product} v{BRAND.version}</span>
              </span>
              <span>© 2026 {BRAND.fullName}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />
                {isSimulation ? 'Simulation' : isConnected ? 'MQTT verbunden' : 'MQTT getrennt'}
              </span>
              <span>Anlage: {ANLAGE_CONFIG.id}</span>
            </div>
          </div>
        </footer>
      </main>

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'hsl(220 20% 10%)',
            color: 'hsl(210 40% 98%)',
            border: '1px solid hsl(220 15% 20%)',
          },
        }}
      />
    </div>
  );
}

// ─── KPI Card Komponente ──────────────────────────────────────
interface KPICardProps {
  label: string;
  value: string;
  unit?: string;
  sub: string;
  color: 'emerald' | 'amber' | 'sky' | 'rose';
  icon: React.ReactNode;
}

const colorMap = {
  emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  amber:   { text: 'text-amber-400',   bg: 'bg-amber-500/10' },
  sky:     { text: 'text-sky-400',     bg: 'bg-sky-500/10' },
  rose:    { text: 'text-rose-400',    bg: 'bg-rose-500/10' },
};

function KPICard({ label, value, unit, sub, color, icon }: KPICardProps) {
  const c = colorMap[color];
  return (
    <div className="p-4 rounded-xl bg-[#111620]/80 border border-[#1e2736] hover:border-[#2a3548] transition-colors">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400 mb-1">{label}</p>
          <p className={`text-2xl font-bold ${c.text}`}>
            {value}
            {unit && <span className="text-sm font-normal text-slate-400 ml-1">{unit}</span>}
          </p>
        </div>
        <div className={`w-11 h-11 rounded-xl ${c.bg} flex items-center justify-center ${c.text}`}>
          {icon}
        </div>
      </div>
      <p className="text-xs text-slate-500 mt-2">{sub}</p>
    </div>
  );
}

export default App;

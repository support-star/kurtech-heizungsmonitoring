import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Wifi, 
  Server, 
  Database, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Clock,
  ShieldAlert,
  Activity
} from 'lucide-react';
import { useMonitoring } from '@/hooks/useMonitoring';

interface MonitoringPanelProps {
  isMqttConnected: boolean;
  lastDataTimestamp: Date | null;
}

export function MonitoringPanel({ isMqttConnected, lastDataTimestamp }: MonitoringPanelProps) {
  const { state, checkNow, isChecking, hasEscalation, escalationHours } = useMonitoring({
    isMqttConnected,
    lastDataTimestamp,
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Activity className="w-5 h-5 text-slate-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
      case 'warning':
        return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
      case 'error':
        return 'bg-red-500/10 border-red-500/30 text-red-400';
      default:
        return 'bg-slate-700/30 border-slate-600 text-slate-500';
    }
  };

  const checks = [
    { ...state.internet, icon: <Wifi className="w-4 h-4" /> },
    { ...state.mqtt, icon: <Server className="w-4 h-4" /> },
    { ...state.dataFreshness, icon: <Database className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Gesamt-Status */}
      <Card className={`${getStatusColor(state.overall)}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(state.overall)}
              System-Status
            </CardTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={checkNow} 
              disabled={isChecking}
              className="h-8 w-8"
            >
              <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
              state.overall === 'healthy' ? 'bg-emerald-500/20' :
              state.overall === 'warning' ? 'bg-amber-500/20' :
              state.overall === 'error' ? 'bg-red-500/20' :
              'bg-slate-700/30'
            }`}>
              {getStatusIcon(state.overall)}
            </div>
            <div>
              <p className="text-lg font-medium">
                {state.overall === 'healthy' ? 'Alle Systeme funktionieren' :
                 state.overall === 'warning' ? 'Warnung vorhanden' :
                 state.overall === 'error' ? 'Fehler erkannt' :
                 'Status unbekannt'}
              </p>
              <p className="text-sm opacity-70">
                Letzte Prüfung: {state.internet.lastCheck.toLocaleTimeString('de-DE')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Einzelne Checks */}
      <Card className="bg-[#111620]/80 border-[#1e2736]">
        <CardHeader>
          <CardTitle className="text-slate-100 flex items-center gap-2">
            <Activity className="w-5 h-5 text-sky-400" />
            System-Checks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {checks.map((check) => (
              <div
                key={check.name}
                className={`p-4 rounded-lg border ${getStatusColor(check.status)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {check.icon}
                    <div>
                      <p className="font-medium">{check.name}</p>
                      <p className="text-sm opacity-70">{check.message}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={getStatusColor(check.status)}>
                    {check.status === 'healthy' ? 'OK' :
                     check.status === 'warning' ? 'Warnung' :
                     check.status === 'error' ? 'Fehler' :
                     'Unbekannt'}
                  </Badge>
                </div>              
              </div>
            ))}
          </div>        
        </CardContent>
      </Card>

      {/* Eskalation */}
      {hasEscalation && (
        <Card className="bg-red-500/10 border-red-500/30">
          <CardHeader>
            <CardTitle className="text-red-400 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5" />
              Eskalation aktiv
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-slate-200">
                Das Problem besteht seit <strong>{escalationHours} Stunden</strong>.
              </p>
              <p className="text-sm text-slate-400">
                Nach 13 Stunden wird automatisch eine Eskalation ausgelöst.
                Bitte kontaktieren Sie den Support.
              </p>
              <div className="mt-4 p-3 rounded bg-red-500/20 border border-red-500/30">
                <p className="text-sm text-red-300">
                  🔴 Kritisch: System nicht erreichbar seit {escalationHours}h
                </p>
              </div>
            </div>          
          </CardContent>
        </Card>
      )}

      {/* Nächste Prüfung */}
      <Card className="bg-[#111620]/80 border-[#1e2736]">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-slate-400">
            <Clock className="w-4 h-4" />
            <span className="text-sm">
              Nächste Prüfung: {state.internet.nextCheck.toLocaleTimeString('de-DE')}
            </span>
          </div>        
        </CardContent>
      </Card>
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Thermometer, 
  Wind, 
  Zap, 
  Gauge, 
  Clock,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import type { HeatingData } from '@/types/heating';

interface LiveStatusProps {
  data: HeatingData | null;
}

interface StatusItemProps {
  label: string;
  value: string | number;
  unit: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'stable';
  color?: string;
}

function StatusItem({ label, value, unit, icon, trend, color = 'cyan' }: StatusItemProps) {
  const colorClasses: Record<string, string> = {
    cyan: 'text-emerald-400 bg-emerald-500/10',
    orange: 'text-orange-400 bg-orange-500/10',
    green: 'text-green-400 bg-green-500/10',
    red: 'text-red-400 bg-red-500/10',
    blue: 'text-blue-400 bg-blue-500/10',
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-[#111620]/60 border border-[#1e2736]">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          {icon}
        </div>
        <div>
          <p className="text-xs text-slate-400">{label}</p>
          <p className="text-lg font-semibold text-white">
            {value}
            <span className="text-sm font-normal text-slate-400 ml-1">{unit}</span>
          </p>
        </div>
      </div>
      {trend && (
        <div className="text-slate-500">
          {trend === 'up' && <TrendingUp className="w-4 h-4" />}
          {trend === 'down' && <TrendingDown className="w-4 h-4" />}
          {trend === 'stable' && <Minus className="w-4 h-4" />}
        </div>
      )}
    </div>
  );
}

export function LiveStatus({ data }: LiveStatusProps) {
  if (!data) {
    return (
      <Card className="border-[#1e2736] bg-[#111620]/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white text-lg">Live-Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40">
            <div className="animate-pulse text-slate-500">Lade Daten...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'heizen':
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/50">Heizen</Badge>;
      case 'standby':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">Standby</Badge>;
      case 'stoerung':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/50">Störung</Badge>;
      case 'abtauen':
        return <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/40">Abtauen</Badge>;
      default:
        return <Badge className="bg-slate-500/20 text-slate-400">{status}</Badge>;
    }
  };

  return (
    <Card className="border-[#1e2736] bg-[#111620]/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-lg">Live-Status</CardTitle>
          {getStatusBadge(data.status)}
        </div>
        <p className="text-xs text-slate-500">
          Letzte Aktualisierung: {data.timestamp.toLocaleTimeString('de-DE')}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Temperaturen */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Temperaturen</p>
          <StatusItem
            label="Außentemperatur"
            value={data.aussentemperatur.toFixed(1)}
            unit="°C"
            icon={<Thermometer className="w-5 h-5" />}
            color={data.aussentemperatur < 0 ? 'blue' : 'cyan'}
          />
          <StatusItem
            label="Vorlauftemperatur"
            value={data.vorlauftemperatur.toFixed(1)}
            unit="°C"
            icon={<Thermometer className="w-5 h-5" />}
            color="orange"
          />
          <StatusItem
            label="Rücklauftemperatur"
            value={data.ruecklauftemperatur.toFixed(1)}
            unit="°C"
            icon={<Thermometer className="w-5 h-5" />}
            color="cyan"
          />
        </div>

        {/* Puffer */}
        <div className="space-y-2 pt-2">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Puffer</p>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 rounded-lg bg-[#111620]/60 border border-[#1e2736]">
              <p className="text-xs text-slate-400">Oben</p>
              <p className="text-lg font-semibold text-orange-400">{data.puffer_oben.toFixed(0)}°</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-[#111620]/60 border border-[#1e2736]">
              <p className="text-xs text-slate-400">Mitte</p>
              <p className="text-lg font-semibold text-emerald-400">{data.puffer_mitte.toFixed(0)}°</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-[#111620]/60 border border-[#1e2736]">
              <p className="text-xs text-slate-400">Unten</p>
              <p className="text-lg font-semibold text-blue-400">{data.puffer_unten.toFixed(0)}°</p>
            </div>
          </div>
        </div>

        {/* System */}
        <div className="space-y-2 pt-2">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">System</p>
          <StatusItem
            label="Drehzahl Pumpe"
            value={data.drehzahl_pumpe}
            unit="U/min"
            icon={<Wind className="w-5 h-5" />}
            color="cyan"
          />
          <StatusItem
            label="Stromverbrauch"
            value={data.stromverbrauch.toFixed(1)}
            unit="kWh"
            icon={<Zap className="w-5 h-5" />}
            color="orange"
          />
          <StatusItem
            label="COP (Leistungszahl)"
            value={data.cop.toFixed(1)}
            unit=""
            icon={<Gauge className="w-5 h-5" />}
            color={data.cop > 3.5 ? 'green' : 'cyan'}
          />
          <StatusItem
            label="Betriebsstunden"
            value={Math.floor(data.betriebsstunden).toLocaleString('de-DE')}
            unit="h"
            icon={<Clock className="w-5 h-5" />}
            color="blue"
          />
        </div>
      </CardContent>
    </Card>
  );
}

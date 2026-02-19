import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Sun, 
  Wind, 
  Flame, 
  Droplets, 
  Thermometer, 
  Activity,
  ArrowDown,
  Zap,
  Gauge
} from 'lucide-react';
import type { HeatingData } from '@/types/heating';

interface SystemSchemaProps {
  data: HeatingData | null;
}

interface ComponentBoxProps {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  temp?: number;
  tempLabel?: string;
  status?: 'active' | 'standby' | 'off';
  power?: string;
  capacity?: string;
  children?: React.ReactNode;
  className?: string;
}

function ComponentBox({ 
  title, 
  subtitle, 
  icon, 
  temp, 
  tempLabel,
  status = 'standby',
  power,
  capacity,
  children,
  className = ''
}: ComponentBoxProps) {
  const statusColors = {
    active: 'border-green-500/50 bg-green-500/10 shadow-[0_0_15px_rgba(34,197,94,0.3)]',
    standby: 'border-yellow-500/30 bg-yellow-500/5',
    off: 'border-[#1e2736] bg-[#111620]/60'
  };

  const statusBadge = {
    active: <Badge className="bg-green-500/20 text-green-400 border-green-500/50 text-[10px]">Aktiv</Badge>,
    standby: <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50 text-[10px]">Standby</Badge>,
    off: <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/50 text-[10px]">Aus</Badge>
  };

  return (
    <div className={`relative p-3 rounded-xl border-2 ${statusColors[status]} ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
            {icon}
          </div>
          <div>
            <p className="text-sm font-semibold text-white leading-tight">{title}</p>
            {subtitle && <p className="text-[10px] text-slate-400">{subtitle}</p>}
          </div>
        </div>
        {statusBadge[status]}
      </div>
      
      {(temp !== undefined || power || capacity) && (
        <div className="mt-2 flex items-center gap-3">
          {temp !== undefined && (
            <div className="flex items-center gap-1">
              <Thermometer className="w-3 h-3 text-orange-400" />
              <span className="text-xs text-orange-400 font-medium">{temp.toFixed(1)}°C</span>
              {tempLabel && <span className="text-[10px] text-slate-500">{tempLabel}</span>}
            </div>
          )}
          {power && (
            <div className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-yellow-400" />
              <span className="text-xs text-yellow-400">{power}</span>
            </div>
          )}
          {capacity && (
            <div className="flex items-center gap-1">
              <Gauge className="w-3 h-3 text-emerald-400" />
              <span className="text-xs text-emerald-400">{capacity}</span>
            </div>
          )}
        </div>
      )}
      
      {children}
    </div>
  );
}

export function SystemSchema({ data }: SystemSchemaProps) {
  const isHeating = data?.status === 'heizen';
  const isStandby = data?.status === 'standby';

  return (
    <div className="space-y-6">
      {/* Header mit System-Status */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">System-Schema</h2>
          <p className="text-sm text-slate-400">Interaktive Darstellung der Heizungsanlage</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/40">
            <Activity className="w-3 h-3 mr-1" />
            Live
          </Badge>
          <div className="text-right">
            <p className="text-xs text-slate-400">Gesamtleistung</p>
            <p className="text-lg font-bold text-white">175 kW</p>
          </div>
        </div>
      </div>

      {/* Haupt-Schema */}
      <div className="relative">
        {/* Obere Reihe: Erzeugung */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* PVT Solarkollektoren */}
          <ComponentBox
            title="PVT-Solarkollektoren"
            subtitle="auf Dach"
            icon={<Sun className="w-4 h-4 text-yellow-400" />}
            temp={data?.aussentemperatur}
            tempLabel="Außen"
            status={isHeating ? 'active' : 'standby'}
            power="6,2 kW"
          />

          {/* Abluft-Wärmepumpe */}
          <ComponentBox
            title="Abluft-Wärmepumpe"
            subtitle="auf Dach"
            icon={<Wind className="w-4 h-4 text-emerald-400" />}
            temp={35}
            tempLabel="Vorlauf"
            status={isHeating ? 'active' : 'standby'}
            power="th. Leistung"
          />

          {/* Erdwärmefeld */}
          <ComponentBox
            title="Erdwärmefeld"
            subtitle="Nahwärme"
            icon={<Gauge className="w-4 h-4 text-green-400" />}
            temp={18}
            tempLabel="Rücklauf"
            status={isHeating ? 'active' : 'standby'}
          />
        </div>

        {/* Verbindungsleitungen - Oben */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="h-0.5 flex-1 bg-gradient-to-r from-yellow-500/50 via-cyan-500/50 to-green-500/50 rounded-full" />
          <ArrowDown className="w-4 h-4 text-emerald-400" />
          <div className="h-0.5 flex-1 bg-gradient-to-r from-green-500/50 via-cyan-500/50 to-yellow-500/50 rounded-full" />
        </div>

        {/* Mittlere Reihe: Speicher & Wärmetauscher */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* Pufferspeicher PVT */}
          <ComponentBox
            title="Pufferspeicher PVT"
            subtitle="hydr. Trennung"
            icon={<Droplets className="w-4 h-4 text-blue-400" />}
            temp={data?.puffer_oben}
            tempLabel="Oben"
            status={isHeating ? 'active' : 'standby'}
            capacity="2000 L"
          />

          {/* Wärmetauscher */}
          <ComponentBox
            title="Wärmetauscher"
            subtitle="Systemtrennung"
            icon={<Activity className="w-4 h-4 text-purple-400" />}
            temp={42}
            tempLabel="ΔT: 3K"
            status={isHeating ? 'active' : 'standby'}
            power="47 kW"
          />

          {/* Haupt-Wärmepumpe */}
          <ComponentBox
            title="Wärmepumpe"
            subtitle="Hauptsystem"
            icon={<Flame className="w-4 h-4 text-orange-400" />}
            temp={data?.vorlauftemperatur}
            tempLabel="Vorlauf"
            status={isHeating ? 'active' : 'standby'}
            power="175 kW"
            className="md:col-span-1"
          >
            <div className="mt-2 pt-2 border-t border-[#1e2736]">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-400">Elektrisch:</span>
                <span className="text-yellow-400">38,9 kW</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-400">COP:</span>
                <span className="text-green-400">{data?.cop.toFixed(1) || '--'}</span>
              </div>
            </div>
          </ComponentBox>

          {/* Pufferspeicher Heizung */}
          <ComponentBox
            title="Pufferspeicher HZ"
            subtitle="Heizung"
            icon={<Droplets className="w-4 h-4 text-orange-400" />}
            temp={data?.puffer_mitte}
            tempLabel="Mitte"
            status={isHeating ? 'active' : 'standby'}
            capacity="1500 L"
          />
        </div>

        {/* Verbindungsleitungen - Mitte */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="h-0.5 flex-1 bg-gradient-to-r from-blue-500/50 via-purple-500/50 to-orange-500/50 rounded-full" />
          <ArrowDown className="w-4 h-4 text-orange-400" />
          <div className="h-0.5 flex-1 bg-gradient-to-r from-orange-500/50 via-purple-500/50 to-blue-500/50 rounded-full" />
        </div>

        {/* Untere Reihe: Verteiler & Kühlung */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Verteiler Heizung */}
          <ComponentBox
            title="Verteiler Heizung"
            subtitle="Rohrheizung"
            icon={<Gauge className="w-4 h-4 text-orange-400" />}
            temp={data?.vorlauftemperatur}
            tempLabel="Vorlauf"
            status={isHeating ? 'active' : 'standby'}
          >
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                <span className="text-[10px] text-slate-400">40°C → Satellitenhaus</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-500" />
                <span className="text-[10px] text-slate-400">35°C ← Rücklauf</span>
              </div>
            </div>
          </ComponentBox>

          {/* Pufferspeicher Kälte */}
          <ComponentBox
            title="Pufferspeicher Kälte"
            subtitle="Kühlung"
            icon={<Droplets className="w-4 h-4 text-emerald-400" />}
            temp={22}
            tempLabel="Oben"
            status={isStandby ? 'active' : 'off'}
            capacity="1000 L"
          />

          {/* Verteiler Kühlung */}
          <ComponentBox
            title="Verteiler Kühlung"
            subtitle="Kühldecken"
            icon={<Gauge className="w-4 h-4 text-emerald-400" />}
            temp={18}
            tempLabel="Rücklauf"
            status={isStandby ? 'active' : 'off'}
          >
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-500" />
                <span className="text-[10px] text-slate-400">22°C → Kühlung</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-[10px] text-slate-400">18°C ← Rücklauf</span>
              </div>
            </div>
          </ComponentBox>
        </div>

        {/* System-Parameter */}
        <Card className="border-[#1e2736] bg-[#111620]/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white">System-Parameter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <p className="text-slate-400">Auslegung ΔT</p>
                <p className="text-emerald-400 font-medium">3 K</p>
              </div>
              <div>
                <p className="text-slate-400">Glycol-Anteil</p>
                <p className="text-emerald-400 font-medium">30%</p>
              </div>
              <div>
                <p className="text-slate-400">Massenstrom</p>
                <p className="text-emerald-400 font-medium">42,1 m³/h</p>
              </div>
              <div>
                <p className="text-slate-400">Ansprechdruck SV</p>
                <p className="text-emerald-400 font-medium">3,5 bar</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Legende */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500/50 border border-green-500" />
            <span className="text-slate-400">Aktiv</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500/30 border border-yellow-500/50" />
            <span className="text-slate-400">Standby</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#1a2030] border border-slate-600" />
            <span className="text-slate-400">Aus</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full" />
            <span className="text-slate-400">Heiß &gt; 40°C</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" />
            <span className="text-slate-400">Kalt &lt; 30°C</span>
          </div>
        </div>
      </div>
    </div>
  );
}

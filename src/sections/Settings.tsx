import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Settings2,
  Server,
  User,
  Info,
  Radio,
  Wifi,
  Database,
  Thermometer,
} from 'lucide-react';
import type { User as UserType } from '@/types/heating';
import { MQTT_CONFIG, ANLAGE_CONFIG, BRAND, SIM_CONFIG } from '@/config/mqtt.config';

interface SettingsProps {
  user: UserType | null;
  isSimulation: boolean;
}

interface InfoRowProps {
  label: string;
  value: string;
  mono?: boolean;
}

function InfoRow({ label, value, mono }: InfoRowProps) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[#1e2736] last:border-0">
      <span className="text-sm text-slate-400">{label}</span>
      <span className={`text-sm text-white ${mono ? 'font-mono text-xs bg-[#0a0e14] px-2 py-0.5 rounded' : ''}`}>
        {value}
      </span>
    </div>
  );
}

const roleLabels: Record<string, string> = {
  customer: 'Kunde',
  installer: 'Installateur',
  technician: 'Techniker',
  admin: 'Administrator',
};

export function Settings({ user, isSimulation }: SettingsProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
          <Settings2 className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Einstellungen</h2>
          <p className="text-sm text-slate-400">System-Konfiguration & Informationen</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* ── Benutzer ── */}
        <Card className="border-[#1e2736] bg-[#111620]/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-400" />
              Benutzer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <InfoRow label="Benutzername" value={user?.username || '--'} />
            <InfoRow label="Rolle" value={user ? (roleLabels[user.role] || user.role) : '--'} />
            <InfoRow label="Anlage" value={user?.anlageId || '--'} />
            <InfoRow
              label="Zugriff"
              value={
                user?.role === 'admin' ? 'Vollzugriff'
                : user?.role === 'technician' ? 'Erweitert'
                : user?.role === 'installer' ? 'Erweitert'
                : 'Nur Lesen'
              }
            />
          </CardContent>
        </Card>

        {/* ── Verbindung ── */}
        <Card className="border-[#1e2736] bg-[#111620]/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base flex items-center gap-2">
              {isSimulation ? <Radio className="w-4 h-4 text-emerald-400" /> : <Wifi className="w-4 h-4 text-emerald-400" />}
              Datenquelle
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <div className="flex items-center justify-between py-2.5 border-b border-[#1e2736]">
              <span className="text-sm text-slate-400">Modus</span>
              <Badge className={isSimulation
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : 'bg-sky-500/15 text-sky-400 border-sky-500/30'
              }>
                {isSimulation ? 'Simulation' : 'MQTT Live'}
              </Badge>
            </div>
            {!isSimulation && (
              <>
                <InfoRow label="Broker" value={MQTT_CONFIG.broker} mono />
                <InfoRow label="Benutzer" value={MQTT_CONFIG.username} />
                <InfoRow label="Reconnect" value={`${MQTT_CONFIG.reconnectPeriod / 1000}s`} />
              </>
            )}
            {isSimulation && (
              <>
                <InfoRow label="Update-Intervall" value={`${SIM_CONFIG.updateIntervalMs / 1000}s`} />
                <InfoRow label="History-Auflösung" value={`${SIM_CONFIG.historyResolutionMinutes} Min`} />
                <InfoRow label="Alarm-Prüfung" value={`${SIM_CONFIG.alarmCheckIntervalMs / 1000}s`} />
              </>
            )}
          </CardContent>
        </Card>

        {/* ── Anlage ── */}
        <Card className="border-[#1e2736] bg-[#111620]/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-emerald-400" />
              Anlage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <InfoRow label="Anlage-ID" value={ANLAGE_CONFIG.id} />
            <InfoRow label="Name" value={ANLAGE_CONFIG.name} />
            <InfoRow label="Standort" value={ANLAGE_CONFIG.address} />
            <InfoRow label="Gesamtleistung" value={ANLAGE_CONFIG.gesamtleistung} />
            <InfoRow label="WP elektrisch" value={ANLAGE_CONFIG.waermepumpeElektrisch} />
            <InfoRow label="Puffer Heizung" value={ANLAGE_CONFIG.pufferHeizung} />
            <InfoRow label="Puffer PVT" value={ANLAGE_CONFIG.pufferPVT} />
            <InfoRow label="Puffer Kälte" value={ANLAGE_CONFIG.pufferKaelte} />
          </CardContent>
        </Card>

        {/* ── System-Parameter ── */}
        <Card className="border-[#1e2736] bg-[#111620]/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              Hydraulische Parameter
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <InfoRow label="Auslegung ΔT" value={ANLAGE_CONFIG.auslegungDeltaT} />
            <InfoRow label="Glycol-Anteil" value={ANLAGE_CONFIG.glycolAnteil} />
            <InfoRow label="Massenstrom" value={ANLAGE_CONFIG.massenstrom} />
            <InfoRow label="Ansprechdruck SV" value={ANLAGE_CONFIG.ansprechdruckSV} />
          </CardContent>
        </Card>

        {/* ── MQTT Topics ── */}
        <Card className="border-[#1e2736] bg-[#111620]/80 md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-400" />
              MQTT Topics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0">
              {Object.entries(MQTT_CONFIG.topics).map(([key, topic]) => (
                <InfoRow key={key} label={key.replace(/_/g, ' ')} value={topic} mono />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── Software ── */}
        <Card className="border-[#1e2736] bg-[#111620]/80 md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Info className="w-4 h-4 text-emerald-400" />
              Software
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Produkt', value: `${BRAND.name} ${BRAND.product}` },
                { label: 'Version', value: `v${BRAND.version}` },
                { label: 'Hersteller', value: BRAND.fullName },
                { label: 'Lizenz', value: 'Proprietär' },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-xs text-slate-500">{item.label}</p>
                  <p className="text-sm text-white font-medium">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-[#1e2736]">
              <p className="text-xs text-slate-500">
                Um zwischen Simulation und MQTT-Live-Modus zu wechseln, ändern Sie{' '}
                <code className="bg-[#0a0e14] px-1.5 py-0.5 rounded text-emerald-400">useSimulation</code>{' '}
                in <code className="bg-[#0a0e14] px-1.5 py-0.5 rounded text-slate-300">src/config/mqtt.config.ts</code>.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

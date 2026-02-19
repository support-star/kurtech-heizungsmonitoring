import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  CheckCircle2
} from 'lucide-react';
import type { Alarm } from '@/types/heating';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AlarmsProps {
  alarms: Alarm[];
  onAcknowledge: (id: string) => void;
}

export function Alarms({ alarms, onAcknowledge }: AlarmsProps) {
  const getAlarmIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-orange-400" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-400" />;
      default:
        return <Bell className="w-5 h-5 text-slate-400" />;
    }
  };

  const getAlarmBadge = (type: string) => {
    switch (type) {
      case 'error':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/50">Fehler</Badge>;
      case 'warning':
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/50">Warnung</Badge>;
      case 'info':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">Info</Badge>;
      default:
        return <Badge className="bg-slate-500/20 text-slate-400">Info</Badge>;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) {
      return 'Gerade eben';
    } else if (hours < 24) {
      return `Vor ${hours} Std.`;
    } else if (days < 7) {
      return `Vor ${days} Tagen`;
    } else {
      return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
    }
  };

  const unacknowledgedAlarms = alarms.filter(a => !a.acknowledged);
  const acknowledgedAlarms = alarms.filter(a => a.acknowledged);

  return (
    <Card className="border-[#1e2736] bg-[#111620]/80 backdrop-blur-sm h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <CardTitle className="text-white text-lg">Alarme & Meldungen</CardTitle>
              <p className="text-xs text-slate-400">
                {unacknowledgedAlarms.length > 0 ? (
                  <span className="text-orange-400">{unacknowledgedAlarms.length} unbestätigt</span>
                ) : (
                  'Keine neuen Alarme'
                )}
              </p>
            </div>
          </div>
          {unacknowledgedAlarms.length > 0 && (
            <Badge className="bg-orange-500 text-white">
              {unacknowledgedAlarms.length}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {/* Unbestätigte Alarme */}
            {unacknowledgedAlarms.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-orange-400 uppercase tracking-wider">
                  Neue Alarme
                </p>
                {unacknowledgedAlarms.map((alarm) => (
                  <div
                    key={alarm.id}
                    className="p-3 rounded-lg bg-[#1a2030] border border-orange-500/30 hover:bg-slate-700/70 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">{getAlarmIcon(alarm.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {getAlarmBadge(alarm.type)}
                          <span className="text-xs text-slate-500">{formatTime(alarm.timestamp)}</span>
                        </div>
                        <p className="text-sm font-medium text-white mt-1">{alarm.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{alarm.message}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onAcknowledge(alarm.id)}
                        className="shrink-0 text-slate-400 hover:text-green-400 hover:bg-green-500/10"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Bestätigte Alarme */}
            {acknowledgedAlarms.length > 0 && (
              <div className="space-y-2">
                {unacknowledgedAlarms.length > 0 && (
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider pt-2">
                    Archiviert
                  </p>
                )}
                {acknowledgedAlarms.map((alarm) => (
                  <div
                    key={alarm.id}
                    className="p-3 rounded-lg bg-[#111620]/60 border border-[#1e2736] opacity-60"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">{getAlarmIcon(alarm.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {getAlarmBadge(alarm.type)}
                          <span className="text-xs text-slate-500">{formatTime(alarm.timestamp)}</span>
                        </div>
                        <p className="text-sm font-medium text-slate-300 mt-1">{alarm.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{alarm.message}</p>
                      </div>
                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Keine Alarme */}
            {alarms.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-6 h-6 text-green-400" />
                </div>
                <p className="text-sm font-medium text-white">Alles in Ordnung</p>
                <p className="text-xs text-slate-400 mt-1">Keine Alarme oder Meldungen</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

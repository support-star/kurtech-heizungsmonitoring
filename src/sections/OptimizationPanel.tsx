import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Zap, 
  Thermometer, 
  TrendingDown, 
  TrendingUp, 
  AlertCircle,
  RefreshCw,
  Clock,
  Euro,
  Home
} from 'lucide-react';
import { useOptimization } from '@/hooks/useOptimization';

export function OptimizationPanel() {
  const { result, loading, error, refresh, shouldHeatNow } = useOptimization();

  if (loading) {
    return (
      <Card className="bg-[#111620]/80 border-[#1e2736]">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-[#111620]/80 border-red-500/30">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span>Fehler beim Laden der Optimierung</span>
          </div>
          <Button variant="ghost" onClick={refresh} className="mt-4">
            <RefreshCw className="w-4 h-4 mr-2" /> Erneut versuchen
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!result) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Status-Karte */}
      <Card className={`${
        shouldHeatNow 
          ? 'bg-emerald-500/10 border-emerald-500/30' 
          : 'bg-[#111620]/80 border-[#1e2736]'
      }`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-slate-100 flex items-center gap-2">
              <Zap className={`w-5 h-5 ${shouldHeatNow ? 'text-emerald-400' : 'text-amber-400'}`} />
              Optimierungs-Status
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={refresh} className="h-8 w-8">
              <RefreshCw className="w-4 h-4 text-slate-400" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
              shouldHeatNow ? 'bg-emerald-500/20' : 'bg-amber-500/20'
            }`}>
              {shouldHeatNow ? (
                <TrendingUp className="w-8 h-8 text-emerald-400" />
              ) : (
                <TrendingDown className="w-8 h-8 text-amber-400" />
              )}
            </div>
            <div>
              <p className="text-lg font-medium text-slate-100">
                {shouldHeatNow ? 'Jetzt heizen empfohlen' : 'Warten oder normal heizen'}
              </p>
              <p className="text-sm text-slate-400">
                {result.summary.heatingHoursRecommended} Stunden Heizung empfohlen
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Empfehlungen */}
      <Card className="bg-[#111620]/80 border-[#1e2736]">
        <CardHeader>
          <CardTitle className="text-slate-100 flex items-center gap-2">
            <Home className="w-5 h-5 text-sky-400" />
            Empfehlungen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {result.recommendations.length === 0 ? (
              <p className="text-slate-500 text-center py-4">
                Keine besonderen Empfehlungen
              </p>
            ) : (
              result.recommendations.map((rec, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-lg border ${
                    rec.type === 'heat_now'
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : rec.type === 'wait'
                      ? 'bg-amber-500/10 border-amber-500/30'
                      : 'bg-[#0a0e14] border-[#1e2736]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-slate-200">{rec.title}</h4>
                        <Badge 
                          variant="outline" 
                          className={`
                            ${rec.priority === 'high' ? 'bg-red-500/20 text-red-400 border-red-500/30' : ''}
                            ${rec.priority === 'medium' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : ''}
                            ${rec.priority === 'low' ? 'bg-slate-500/20 text-slate-400 border-slate-500/30' : ''}
                          `}
                        >
                          {rec.priority === 'high' ? 'Wichtig' : rec.priority === 'medium' ? 'Mittel' : 'Info'}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-400 mt-1">{rec.description}</p>
                      <p className="text-xs text-slate-500 mt-1">Grund: {rec.reason}</p>
                    </div>
                    {rec.potentialSavings > 0 && (
                      <div className="text-right">
                        <span className="text-emerald-400 font-medium">+{rec.potentialSavings.toFixed(1)}€</span>
                        <p className="text-xs text-slate-500">Ersparnis</p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>        
        </CardContent>
      </Card>

      {/* 24h-Übersicht */}
      <Card className="bg-[#111620]/80 border-[#1e2736]">
        <CardHeader>
          <CardTitle className="text-slate-100 flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-400" />
            24-Stunden-Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-12 gap-1">
            {result.schedule.slice(0, 24).map((slot) => (
              <div
                key={slot.hour}
                className={`aspect-square rounded flex items-center justify-center text-xs font-medium ${
                  slot.shouldHeat
                    ? 'bg-emerald-500/30 text-emerald-400'
                    : 'bg-slate-700/30 text-slate-500'
                }`}
                title={`${String(slot.hour).padStart(2, '0')}:00 - ${slot.reason}`}
              >
                {slot.hour}
              </div>
            ))}
          </div>          
          <div className="flex items-center gap-4 mt-4 text-xs text-slate-400">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-emerald-500/30" />
              <span>Heizen empfohlen</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-slate-700/30" />
              <span>Absenken</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Zusammenfassung */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-[#111620]/80 border-[#1e2736]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs">Heizstunden</span>
            </div>
            <p className="text-2xl font-bold text-slate-100">
              {result.summary.heatingHoursRecommended}h
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#111620]/80 border-[#1e2736]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <Euro className="w-4 h-4" />
              <span className="text-xs">Ersparnis</span>
            </div>
            <p className="text-2xl font-bold text-emerald-400">
              ~{result.summary.estimatedSavings.toFixed(1)}€
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#111620]/80 border-[#1e2736]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <Thermometer className="w-4 h-4" />
              <span className="text-xs">Komfort</span>
            </div>
            <p className="text-2xl font-bold text-slate-100">
              {result.summary.comfortScore}%
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Thermometer, 
  Home, 
  Leaf, 
  LogOut, 
  Plane, 
  Clock, 
  Plus,
  Trash2,
  Edit2,
  Check,
  X
} from 'lucide-react';
import { useHeatingControl } from '@/hooks/useHeatingControl';
import { 
  MODE_LABELS, 
  MODE_TEMPERATURES,
  type HeatingMode,
  type HeatingSchedule 
} from '@/services/heatingControl';

interface ControlProps {
  currentTemp?: number;
  isHeating?: boolean;
}

const modeIcons: Record<HeatingMode, React.ReactNode> = {
  comfort: <Home className="w-5 h-5" />,
  eco: <Leaf className="w-5 h-5" />,
  away: <LogOut className="w-5 h-5" />,
  vacation: <Plane className="w-5 h-5" />,
};

const modeColors: Record<HeatingMode, string> = {
  comfort: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  eco: 'bg-lime-500/20 text-lime-400 border-lime-500/30',
  away: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  vacation: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
};

export function Control({ currentTemp = 20, isHeating = false }: ControlProps) {
  const {
    state,
    setMode,
    setTargetTemp,
    toggleSchedule,
    activeSchedule,
    isLoading,
    error,
  } = useHeatingControl(currentTemp, isHeating);

  const [editingSchedule, setEditingSchedule] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const modes: HeatingMode[] = ['comfort', 'eco', 'away', 'vacation'];

  const handleTempChange = async (value: number[]) => {
    await setTargetTemp(value[0]);
  };

  return (
    <div className="space-y-6">
      {/* Modus-Auswahl */}
      <Card className="bg-[#111620]/80 border-[#1e2736]">
        <CardHeader>
          <CardTitle className="text-slate-100 flex items-center gap-2">
            <Thermometer className="w-5 h-5 text-emerald-400" />
            Heizungs-Modus
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {modes.map((mode) => (
              <Button
                key={mode}
                variant={state.mode === mode ? 'default' : 'outline'}
                onClick={() => setMode(mode)}
                disabled={isLoading}
                className={`h-auto py-4 flex flex-col items-center gap-2 ${
                  state.mode === mode 
                    ? modeColors[mode] 
                    : 'bg-[#0a0e14] border-[#1e2736] text-slate-400 hover:text-slate-200'
                }`}
              >
                {modeIcons[mode]}
                <span className="font-medium">{MODE_LABELS[mode]}</span>
                <span className="text-xs opacity-70">{MODE_TEMPERATURES[mode]}°C</span>
              </Button>
            ))}
          </div>

          {activeSchedule && (
            <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-sm text-emerald-400 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Aktiver Zeitplan: <strong>{activeSchedule.name}</strong>
                <span className="text-emerald-400/70">({activeSchedule.targetTemp}°C)</span>
              </p>
            </div>
          )}

          {error && (
            <p className="mt-3 text-sm text-red-400">{error}</p>
          )}
        </CardContent>
      </Card>

      {/* Sollwert-Slider */}
      <Card className="bg-[#111620]/80 border-[#1e2736]">
        <CardHeader>
          <CardTitle className="text-slate-100 flex items-center gap-2">
            <Thermometer className="w-5 h-5 text-amber-400" />
            Sollwert
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Aktuell</span>
              <span className="text-2xl font-bold text-slate-100">
                {state.targetTemp.toFixed(1)}°C
              </span>
            </div>

            <Slider
              value={[state.targetTemp]}
              onValueChange={handleTempChange}
              min={10}
              max={25}
              step={0.5}
              disabled={isLoading}
              className="w-full"
            />

            <div className="flex justify-between text-xs text-slate-500">
              <span>10°C</span>
              <span>Frostschutz</span>
              <span>Komfort</span>
              <span>25°C</span>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <div className={`w-2 h-2 rounded-full ${isHeating ? 'bg-amber-400 animate-pulse' : 'bg-slate-600'}`} />
              <span className="text-sm text-slate-400">
                {isHeating ? 'Heizt aktuell' : 'Nicht am Heizen'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Zeitplan-Editor */}
      <Card className="bg-[#111620]/80 border-[#1e2736]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-slate-100 flex items-center gap-2">
              <Clock className="w-5 h-5 text-sky-400" />
              Zeitplan
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAddForm(!showAddForm)}
              className="text-sky-400 hover:text-sky-300"
            >
              <Plus className="w-4 h-4 mr-1" />
              Neu
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {state.schedule.map((schedule) => (
              <ScheduleItem
                key={schedule.id}
                schedule={schedule}
                isActive={activeSchedule?.id === schedule.id}
                isEditing={editingSchedule === schedule.id}
                onToggle={() => toggleSchedule(schedule.id)}
                onEdit={() => setEditingSchedule(schedule.id)}
                onCancel={() => setEditingSchedule(null)}
              />
            ))}

            {state.schedule.length === 0 && (
              <p className="text-center text-slate-500 py-4">
                Keine Zeitpläne vorhanden
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Hilfskomponenten ─────────────────────────────────────────

interface ScheduleItemProps {
  schedule: HeatingSchedule;
  isActive: boolean;
  isEditing: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onCancel: () => void;
}

function ScheduleItem({ schedule, isActive, isEditing, onToggle, onEdit, onCancel }: ScheduleItemProps) {
  const dayNames = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

  if (isEditing) {
    return (
      <div className="p-3 rounded-lg bg-[#0a0e14] border border-sky-500/30">
        <div className="flex items-center justify-between mb-2">
          <input
            type="text"
            value={schedule.name}
            className="bg-transparent text-slate-200 font-medium border-b border-slate-600 focus:border-sky-400 outline-none"
            readOnly
          />
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-400" onClick={onCancel}>
              <Check className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400" onClick={onCancel}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-3 rounded-lg border ${
      isActive 
        ? 'bg-emerald-500/10 border-emerald-500/30' 
        : 'bg-[#0a0e14] border-[#1e2736]'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Switch
            checked={schedule.enabled}
            onCheckedChange={onToggle}
          />
          <div>
            <p className={`font-medium ${schedule.enabled ? 'text-slate-200' : 'text-slate-500'}`}>
              {schedule.name}
              {isActive && <Badge variant="outline" className="ml-2 text-xs bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Aktiv</Badge>}
            </p>
            <p className="text-sm text-slate-500">
              {schedule.startTime} - {schedule.endTime} · {schedule.targetTemp}°C
            </p>
            <div className="flex gap-1 mt-1">
              {dayNames.map((day, i) => (
                <span
                  key={day}
                  className={`text-xs w-5 h-5 flex items-center justify-center rounded ${
                    schedule.days.includes(i)
                      ? 'bg-sky-500/20 text-sky-400'
                      : 'text-slate-600'
                  }`}
                >
                  {day}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-200" onClick={onEdit}>
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-400">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

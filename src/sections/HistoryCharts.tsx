import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, TrendingUp, Zap, Activity } from 'lucide-react';
import type { HeatingData, TimeRange } from '@/types/heating';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface HistoryChartsProps {
  data: HeatingData[];
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  onExport: () => string;
}

type ChartTab = 'temp' | 'cop' | 'power';

const CHART_GRID_COLOR = 'rgba(30,39,54,0.8)';
const CHART_TICK_COLOR = 'rgba(100,116,139,0.8)';
const BASE_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index' as const, intersect: false },
  plugins: {
    legend: { labels: { color: CHART_TICK_COLOR, boxWidth: 12, font: { size: 11 } } },
    tooltip: {
      backgroundColor: 'rgba(13,17,23,0.95)',
      borderColor: 'rgba(30,39,54,1)',
      borderWidth: 1,
      titleColor: '#f8fafc',
      bodyColor: '#94a3b8',
      padding: 10,
    },
  },
  scales: {
    x: {
      grid: { color: CHART_GRID_COLOR },
      ticks: { color: CHART_TICK_COLOR, maxTicksLimit: 8, font: { size: 10 } },
    },
  },
};

export function HistoryCharts({ data, timeRange, onTimeRangeChange, onExport }: HistoryChartsProps) {
  const [activeTab, setActiveTab] = useState<ChartTab>('temp');
  const chartRef = useRef<ChartJS<'line'>>(null);

  const formatLabel = (date: Date) =>
    timeRange === '24h'
      ? date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
      : date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });

  const labels = data.map(d => formatLabel(d.timestamp));

  const chartsByTab: Record<ChartTab, { label: string; data: { labels: string[]; datasets: object[] }; yLabel: string }> = {
    temp: {
      label: 'Temperaturen',
      yLabel: '°C',
      data: {
        labels,
        datasets: [
          { label: 'Außen',    data: data.map(d => d.aussentemperatur),    borderColor: '#38bdf8', backgroundColor: 'rgba(56,189,248,0.08)', fill: false, tension: 0.4, pointRadius: 0, pointHoverRadius: 4 },
          { label: 'Vorlauf',  data: data.map(d => d.vorlauftemperatur),   borderColor: '#f97316', backgroundColor: 'rgba(249,115,22,0.08)', fill: false, tension: 0.4, pointRadius: 0, pointHoverRadius: 4 },
          { label: 'Rücklauf', data: data.map(d => d.ruecklauftemperatur), borderColor: '#34d399', backgroundColor: 'rgba(52,211,153,0.08)', fill: false, tension: 0.4, pointRadius: 0, pointHoverRadius: 4 },
          { label: 'Puffer oben', data: data.map(d => d.puffer_oben), borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.05)', fill: true, tension: 0.4, pointRadius: 0, pointHoverRadius: 4, borderDash: [4,2] },
        ],
      },
    },
    cop: {
      label: 'COP Verlauf',
      yLabel: 'COP',
      data: {
        labels,
        datasets: [
          {
            label: 'COP (Leistungszahl)',
            data: data.map(d => d.cop),
            borderColor: '#a78bfa',
            backgroundColor: 'rgba(167,139,250,0.12)',
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 4,
          },
          {
            label: 'Ziel COP 3.5',
            data: data.map(() => 3.5),
            borderColor: 'rgba(34,197,94,0.4)',
            borderDash: [6, 3],
            fill: false,
            pointRadius: 0,
            tension: 0,
          },
        ],
      },
    },
    power: {
      label: 'Stromverbrauch',
      yLabel: 'kWh',
      data: {
        labels,
        datasets: [
          {
            label: 'Stromverbrauch (kWh)',
            data: data.map(d => d.stromverbrauch),
            borderColor: '#fbbf24',
            backgroundColor: 'rgba(251,191,36,0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 4,
          },
        ],
      },
    },
  };

  const current = chartsByTab[activeTab];

  const options = {
    ...BASE_OPTIONS,
    scales: {
      ...BASE_OPTIONS.scales,
      y: {
        grid: { color: CHART_GRID_COLOR },
        ticks: { color: CHART_TICK_COLOR, font: { size: 10 } },
        title: { display: true, text: current.yLabel, color: CHART_TICK_COLOR, font: { size: 10 } },
      },
    },
  };

  const tabDefs: { id: ChartTab; label: string; icon: React.ReactNode }[] = [
    { id: 'temp',  label: 'Temperaturen', icon: <TrendingUp className="w-3.5 h-3.5" /> },
    { id: 'cop',   label: 'COP',          icon: <Activity className="w-3.5 h-3.5" /> },
    { id: 'power', label: 'Strom',        icon: <Zap className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="rounded-2xl border border-[#1e2736] bg-[#111620]/80 backdrop-blur-sm overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-[#1e2736]">
        {/* Chart tabs */}
        <div className="flex items-center gap-1 bg-[#0d1117] rounded-lg p-1 border border-[#1e2736]">
          {tabDefs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition-all ${
                activeTab === t.id ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Time range + export */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-[#0d1117] rounded-lg p-1 border border-[#1e2736]">
            {(['24h', '7d', '30d'] as TimeRange[]).map(r => (
              <button
                key={r}
                onClick={() => onTimeRangeChange(r)}
                className={`text-xs px-2.5 py-1 rounded-md transition-all font-medium ${
                  timeRange === r ? 'bg-[#1e2736] text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <Button variant="ghost" size="sm" onClick={onExport} className="text-slate-400 hover:text-white hover:bg-[#1a2030] h-8 px-2.5">
            <Download className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Chart */}
      <div className="p-5">
        <p className="text-xs text-slate-500 mb-3">{current.label} · letzte {timeRange}</p>
        <div className="h-64">
          {data.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-pulse text-slate-600 text-sm">Lade Verlaufsdaten...</div>
            </div>
          ) : (
            <Line ref={chartRef} data={current.data as any} options={options as any} />
          )}
        </div>
      </div>

      {/* Stats below chart */}
      {data.length > 0 && activeTab === 'temp' && (
        <div className="grid grid-cols-3 border-t border-[#1e2736]">
          {[
            { label: 'Ø Vorlauf',   val: (data.reduce((a, d) => a + d.vorlauftemperatur, 0) / data.length).toFixed(1), unit: '°C', color: 'text-orange-400' },
            { label: 'Ø Außen',     val: (data.reduce((a, d) => a + d.aussentemperatur, 0) / data.length).toFixed(1),  unit: '°C', color: 'text-sky-400' },
            { label: 'Ø Rücklauf', val: (data.reduce((a, d) => a + d.ruecklauftemperatur, 0) / data.length).toFixed(1), unit: '°C', color: 'text-emerald-400' },
          ].map(({ label, val, unit, color }) => (
            <div key={label} className="text-center py-3 border-r border-[#1e2736] last:border-r-0">
              <p className="text-[10px] text-slate-500">{label}</p>
              <p className={`text-base font-bold ${color}`}>{val}<span className="text-xs font-normal text-slate-500 ml-1">{unit}</span></p>
            </div>
          ))}
        </div>
      )}
      {data.length > 0 && activeTab === 'cop' && (
        <div className="grid grid-cols-3 border-t border-[#1e2736]">
          {[
            { label: 'Ø COP',   val: (data.reduce((a, d) => a + d.cop, 0) / data.length).toFixed(2) },
            { label: 'Max COP', val: Math.max(...data.map(d => d.cop)).toFixed(2) },
            { label: 'Min COP', val: Math.min(...data.map(d => d.cop)).toFixed(2) },
          ].map(({ label, val }) => (
            <div key={label} className="text-center py-3 border-r border-[#1e2736] last:border-r-0">
              <p className="text-[10px] text-slate-500">{label}</p>
              <p className="text-base font-bold text-violet-400">{val}</p>
            </div>
          ))}
        </div>
      )}
      {data.length > 0 && activeTab === 'power' && (
        <div className="grid grid-cols-3 border-t border-[#1e2736]">
          {[
            { label: 'Ø Verbrauch', val: (data.reduce((a, d) => a + d.stromverbrauch, 0) / data.length).toFixed(1), unit: 'kWh' },
            { label: 'Gesamt',      val: data.reduce((a, d) => a + d.stromverbrauch, 0).toFixed(0), unit: 'kWh' },
            { label: 'Ø Kosten',    val: ((data.reduce((a, d) => a + d.stromverbrauch, 0) / data.length) * 0.35).toFixed(2), unit: '€/h' },
          ].map(({ label, val, unit }) => (
            <div key={label} className="text-center py-3 border-r border-[#1e2736] last:border-r-0">
              <p className="text-[10px] text-slate-500">{label}</p>
              <p className="text-base font-bold text-amber-400">{val}<span className="text-xs font-normal text-slate-500 ml-1">{unit}</span></p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

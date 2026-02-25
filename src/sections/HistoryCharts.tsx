import { useState, useCallback } from 'react';
import { Download, TrendingUp, Zap, Activity, Thermometer, BarChart3 } from 'lucide-react';
import type { HeatingData, TimeRange } from '@/types/heating';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, Filler, BarElement,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

interface HistoryChartsProps {
  data: HeatingData[];
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  onExport: () => string;
}

type ChartTab = 'temp' | 'cop' | 'power' | 'puffer' | 'efficiency';

const GRID = 'rgba(21,30,48,0.9)';
const TICK = 'rgba(100,116,139,0.65)';

const BASE_TOOLTIP = {
  backgroundColor: 'rgba(7,11,20,0.97)',
  borderColor: 'rgba(21,30,48,1)',
  borderWidth: 1,
  titleColor: '#f1f5f9',
  bodyColor: '#94a3b8',
  padding: 12,
  cornerRadius: 10,
  boxPadding: 4,
  titleFont: { size: 11, weight: 'bold' as const },
  bodyFont: { size: 11 },
};

const BASE_SCALE = {
  grid: { color: GRID, drawBorder: false },
  ticks: { color: TICK, font: { size: 10, family: 'JetBrains Mono' }, maxTicksLimit: 7 },
  border: { color: 'transparent' },
};

export function HistoryCharts({ data, timeRange, onTimeRangeChange, onExport }: HistoryChartsProps) {
  const [activeTab, setActiveTab] = useState<ChartTab>('temp');

  const formatLabel = (date: Date) =>
    timeRange === '24h'
      ? date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
      : date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });

  const sample = useCallback((arr: number[], max = 80) => {
    if (arr.length <= max) return arr;
    const step = Math.ceil(arr.length / max);
    return arr.filter((_, i) => i % step === 0);
  }, []);

  const sampledData = data.length > 80
    ? data.filter((_, i) => i % Math.ceil(data.length / 80) === 0)
    : data;
  const sampledLabels = sampledData.map(d => formatLabel(d.timestamp));

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
    animation: { duration: 400 },
    plugins: {
      legend: { labels: { color: TICK, boxWidth: 10, boxHeight: 2, font: { size: 11 }, padding: 16, usePointStyle: true } },
      tooltip: BASE_TOOLTIP,
    },
  };

  const charts: Record<ChartTab, { label: string; icon: React.ReactNode; chart: React.ReactNode }> = {
    temp: {
      label: 'Temperaturen',
      icon: <Thermometer className="w-3.5 h-3.5" />,
      chart: (
        <Line data={{
          labels: sampledLabels,
          datasets: [
            {
              label: 'Außen °C',
              data: sample(data.map(d => d.aussentemperatur)),
              borderColor: '#38bdf8', backgroundColor: 'rgba(56,189,248,0.07)',
              fill: false, tension: 0.4, pointRadius: 0, pointHoverRadius: 5, borderWidth: 2,
            },
            {
              label: 'Vorlauf °C',
              data: sample(data.map(d => d.vorlauftemperatur)),
              borderColor: '#fb923c', backgroundColor: 'rgba(251,146,60,0.1)',
              fill: true, tension: 0.4, pointRadius: 0, pointHoverRadius: 5, borderWidth: 2,
            },
            {
              label: 'Rücklauf °C',
              data: sample(data.map(d => d.ruecklauftemperatur)),
              borderColor: '#34d399', backgroundColor: 'rgba(52,211,153,0.06)',
              fill: false, tension: 0.4, pointRadius: 0, pointHoverRadius: 5, borderWidth: 2,
            },
          ],
        }} options={{
          ...commonOptions,
          scales: {
            x: { ...BASE_SCALE, ticks: { ...BASE_SCALE.ticks, maxTicksLimit: 8 } },
            y: { ...BASE_SCALE, title: { display: true, text: '°C', color: TICK, font: { size: 10 } } },
          },
        }} />
      ),
    },
    cop: {
      label: 'COP',
      icon: <TrendingUp className="w-3.5 h-3.5" />,
      chart: (
        <Line data={{
          labels: sampledLabels,
          datasets: [
            {
              label: 'COP',
              data: sample(data.map(d => d.cop)),
              borderColor: '#a78bfa', backgroundColor: 'rgba(167,139,250,0.12)',
              fill: true, tension: 0.4, pointRadius: 0, pointHoverRadius: 5, borderWidth: 2.5,
            },
            {
              label: 'Ziel 3.5',
              data: sample(data.map(() => 3.5)),
              borderColor: 'rgba(52,211,153,0.4)', borderDash: [6, 4],
              fill: false, pointRadius: 0, tension: 0, borderWidth: 1.5,
              pointHoverRadius: 0,
            },
            {
              label: 'Ziel 4.5',
              data: sample(data.map(() => 4.5)),
              borderColor: 'rgba(251,146,60,0.3)', borderDash: [3, 6],
              fill: false, pointRadius: 0, tension: 0, borderWidth: 1,
              pointHoverRadius: 0,
            },
          ],
        }} options={{
          ...commonOptions,
          scales: {
            x: BASE_SCALE,
            y: { ...BASE_SCALE, min: 0, max: 7, title: { display: true, text: 'COP', color: TICK, font: { size: 10 } } },
          },
        }} />
      ),
    },
    power: {
      label: 'Strom',
      icon: <Zap className="w-3.5 h-3.5" />,
      chart: (
        <Bar data={{
          labels: sampledLabels,
          datasets: [
            {
              label: 'Strom kW',
              data: sample(data.map(d => d.stromverbrauch)),
              backgroundColor: 'rgba(251,191,36,0.45)',
              borderColor: '#fbbf24',
              borderWidth: 1,
              borderRadius: 3,
              borderSkipped: false,
            },
          ],
        }} options={{
          ...commonOptions,
          scales: {
            x: BASE_SCALE,
            y: { ...BASE_SCALE, title: { display: true, text: 'kW', color: TICK, font: { size: 10 } } },
          },
        }} />
      ),
    },
    puffer: {
      label: 'Puffer',
      icon: <Activity className="w-3.5 h-3.5" />,
      chart: (
        <Line data={{
          labels: sampledLabels,
          datasets: [
            {
              label: 'Oben °C',
              data: sample(data.map(d => d.puffer_oben)),
              borderColor: '#fb923c', backgroundColor: 'rgba(251,146,60,0.1)',
              fill: false, tension: 0.4, pointRadius: 0, pointHoverRadius: 5, borderWidth: 2,
            },
            {
              label: 'Mitte °C',
              data: sample(data.map(d => d.puffer_mitte)),
              borderColor: '#34d399', backgroundColor: 'rgba(52,211,153,0.09)',
              fill: true, tension: 0.4, pointRadius: 0, pointHoverRadius: 5, borderWidth: 2,
            },
            {
              label: 'Unten °C',
              data: sample(data.map(d => d.puffer_unten)),
              borderColor: '#38bdf8', backgroundColor: 'rgba(56,189,248,0.06)',
              fill: false, tension: 0.4, pointRadius: 0, pointHoverRadius: 5, borderWidth: 2,
            },
          ],
        }} options={{
          ...commonOptions,
          scales: {
            x: BASE_SCALE,
            y: { ...BASE_SCALE, title: { display: true, text: '°C', color: TICK, font: { size: 10 } } },
          },
        }} />
      ),
    },
    efficiency: {
      label: 'Effizienz',
      icon: <BarChart3 className="w-3.5 h-3.5" />,
      chart: (
        <Line data={{
          labels: sampledLabels,
          datasets: [
            {
              label: 'COP',
              data: sample(data.map(d => d.cop)),
              borderColor: '#a78bfa', backgroundColor: 'transparent',
              fill: false, tension: 0.4, pointRadius: 0, pointHoverRadius: 5, borderWidth: 2,
              yAxisID: 'yCOP',
            },
            {
              label: 'Strom kW',
              data: sample(data.map(d => d.stromverbrauch)),
              borderColor: '#fbbf24', backgroundColor: 'rgba(251,191,36,0.06)',
              fill: true, tension: 0.4, pointRadius: 0, pointHoverRadius: 5, borderWidth: 2,
              yAxisID: 'yPower',
            },
            {
              label: 'Vorlauf °C',
              data: sample(data.map(d => d.vorlauftemperatur)),
              borderColor: '#fb923c', backgroundColor: 'transparent',
              fill: false, tension: 0.4, pointRadius: 0, pointHoverRadius: 5, borderWidth: 1.5,
              borderDash: [4, 3],
              yAxisID: 'yTemp',
            },
          ],
        }} options={{
          ...commonOptions,
          scales: {
            x: BASE_SCALE,
            yCOP:   { ...BASE_SCALE, position: 'left' as const, min: 0, max: 7, title: { display: true, text: 'COP', color: '#a78bfa', font: { size: 9 } } },
            yPower: { ...BASE_SCALE, position: 'right' as const, title: { display: true, text: 'kW', color: '#fbbf24', font: { size: 9 } }, grid: { display: false } },
            yTemp:  { display: false },
          },
        }} />
      ),
    },
  };

  const handleExport = () => {
    const csv = onExport();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `heizung-${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  // Summary stats
  const avg = (arr: number[]) => arr.length ? arr.reduce((a,b) => a+b, 0) / arr.length : 0;
  const totalKwh = avg(data.map(d => d.stromverbrauch)) * (timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720);

  const summaryStats = [
    { label: 'Ø Außentemp', value: avg(data.map(d => d.aussentemperatur)).toFixed(1), unit: '°C', color: 'text-sky-400' },
    { label: 'Ø Vorlauf',   value: avg(data.map(d => d.vorlauftemperatur)).toFixed(1), unit: '°C', color: 'text-orange-400' },
    { label: 'Ø COP',       value: avg(data.map(d => d.cop)).toFixed(2), unit: '',    color: 'text-violet-400' },
    { label: 'Σ Strom',     value: totalKwh.toFixed(0), unit: 'kWh', color: 'text-amber-400' },
  ];

  const tabs: ChartTab[] = ['temp', 'cop', 'power', 'puffer', 'efficiency'];
  const timeRanges: { key: TimeRange; label: string }[] = [
    { key: '24h', label: '24h' }, { key: '7d', label: '7T' }, { key: '30d', label: '30T' },
  ];

  return (
    <div className="rounded-2xl border border-[#151e30] bg-[#070b14] overflow-hidden">
      {/* Tab bar */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#151e30]"
        style={{ background: 'linear-gradient(90deg, #080c15 0%, #0a0f1c 100%)' }}>
        <div className="flex items-center gap-0.5">
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                activeTab === tab
                  ? 'bg-emerald-500/12 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-[#0f1522] border border-transparent'
              }`}>
              {charts[tab].icon}
              <span className="hidden sm:inline">{charts[tab].label}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          {timeRanges.map(({ key, label }) => (
            <button key={key} onClick={() => onTimeRangeChange(key)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                timeRange === key
                  ? 'bg-[#151e30] text-white'
                  : 'text-slate-600 hover:text-slate-400 hover:bg-[#0f1522]'
              }`}>{label}</button>
          ))}
          <button onClick={handleExport}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-300 hover:bg-[#0f1522] transition-all ml-1"
            title="CSV exportieren">
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="p-4">
        {data.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-600 text-sm gap-2">
            <BarChart3 className="w-8 h-8 opacity-30" />
            <span>Keine Verlaufsdaten verfügbar</span>
          </div>
        ) : (
          <div className="chart-container" style={{ height: '260px' }}>
            {charts[activeTab].chart}
          </div>
        )}
      </div>

      {/* Summary bar */}
      {data.length > 0 && (
        <div className="grid grid-cols-4 gap-px bg-[#151e30] border-t border-[#151e30]">
          {summaryStats.map(s => (
            <div key={s.label} className="bg-[#070b14] px-4 py-2.5">
              <p className="text-[9px] text-slate-600 uppercase tracking-wider mb-0.5">{s.label}</p>
              <p className={`font-mono text-sm font-bold ${s.color}`}>
                {s.value}
                {s.unit && <span className="text-[10px] text-slate-600 ml-1">{s.unit}</span>}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, TrendingUp } from 'lucide-react';
import type { HeatingData, TimeRange } from '@/types/heating';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface HistoryChartsProps {
  data: HeatingData[];
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  onExport: () => string;
}

export function HistoryCharts({ data, timeRange, onTimeRangeChange, onExport }: HistoryChartsProps) {
  const chartRef = useRef<ChartJS<'line'>>(null);

  const formatTimeLabel = (date: Date) => {
    if (timeRange === '24h') {
      return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit' });
  };

  const labels = data.map(d => formatTimeLabel(d.timestamp));

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Außentemperatur',
        data: data.map(d => d.aussentemperatur),
        borderColor: '#34d399',
        backgroundColor: 'rgba(52, 211, 153, 0.1)',
        fill: false,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
        yAxisID: 'y-temp',
      },
      {
        label: 'Vorlauftemperatur',
        data: data.map(d => d.vorlauftemperatur),
        borderColor: '#f97316',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        fill: false,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
        yAxisID: 'y-temp',
      },
      {
        label: 'Rücklauftemperatur',
        data: data.map(d => d.ruecklauftemperatur),
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: false,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
        yAxisID: 'y-temp',
      },
      {
        label: 'Puffer oben',
        data: data.map(d => d.puffer_oben),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
        yAxisID: 'y-temp',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#94a3b8',
          usePointStyle: true,
          boxWidth: 8,
          padding: 15,
          font: {
            size: 11,
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(52, 211, 153, 0.3)',
        borderWidth: 1,
        padding: 10,
        displayColors: true,
        callbacks: {
          label: (context: { dataset: { label?: string }; parsed: { y: number | null } }) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y ?? 0;
            return `${label}: ${Number(value).toFixed(1)}°C`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(71, 85, 105, 0.3)',
          drawBorder: false,
        },
        ticks: {
          color: '#64748b',
          maxTicksLimit: 8,
          font: {
            size: 10,
          },
        },
      },
      'y-temp': {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        grid: {
          color: 'rgba(71, 85, 105, 0.3)',
          drawBorder: false,
        },
        ticks: {
          color: '#64748b',
          callback: function(tickValue: string | number) {
            return `${tickValue}°C`;
          },
          font: {
            size: 10,
          },
        },
        title: {
          display: true,
          text: 'Temperatur (°C)',
          color: '#64748b',
          font: {
            size: 10,
          },
        },
      },
    },
  };

  const handleExport = () => {
    const csv = onExport();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `heizungsdaten_${timeRange}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const timeRangeOptions: { value: TimeRange; label: string }[] = [
    { value: '24h', label: '24 Stunden' },
    { value: '7d', label: '7 Tage' },
    { value: '30d', label: '30 Tage' },
  ];

  return (
    <Card className="border-[#1e2736] bg-[#111620]/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <CardTitle className="text-white text-lg">Verlaufs-Daten</CardTitle>
              <p className="text-xs text-slate-400">
                {data.length > 0 ? `${data.length} Datenpunkte` : 'Keine Daten'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            {/* Zeitbereich-Auswahl */}
            <div className="flex items-center gap-1 bg-[#0a0e14]/50 rounded-lg p-1">
              {timeRangeOptions.map((option) => (
                <Button
                  key={option.value}
                  variant="ghost"
                  size="sm"
                  onClick={() => onTimeRangeChange(option.value)}
                  className={`text-xs ${
                    timeRange === option.value
                      ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  {option.label}
                </Button>
              ))}
            </div>

            {/* Export-Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={data.length === 0}
              className="border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700"
            >
              <Download className="w-4 h-4 mr-1" />
              CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          {data.length > 0 ? (
            <Line ref={chartRef} data={chartData} options={chartOptions} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-slate-500">Keine Daten verfügbar</p>
            </div>
          )}
        </div>

        {/* Statistiken */}
        {data.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-[#1e2736]">
            <div className="text-center">
              <p className="text-xs text-slate-400">Ø Außentemp</p>
              <p className="text-lg font-semibold text-emerald-400">
                {(data.reduce((a, b) => a + b.aussentemperatur, 0) / data.length).toFixed(1)}°C
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-400">Ø Vorlauf</p>
              <p className="text-lg font-semibold text-orange-400">
                {(data.reduce((a, b) => a + b.vorlauftemperatur, 0) / data.length).toFixed(1)}°C
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-400">Ø COP</p>
              <p className="text-lg font-semibold text-green-400">
                {(data.reduce((a, b) => a + b.cop, 0) / data.length).toFixed(1)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-400">Ø Strom</p>
              <p className="text-lg font-semibold text-yellow-400">
                {(data.reduce((a, b) => a + b.stromverbrauch, 0) / data.length).toFixed(1)} kWh
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

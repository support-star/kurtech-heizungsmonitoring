import { useState } from 'react';
import { AlertCircle, Wifi, BarChart3, Shield } from 'lucide-react';
import { BRAND, CUSTOMER } from '@/config/runtime.config';

interface LoginProps {
  onLogin: (username: string, password: string) => boolean;
}

export function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    setTimeout(() => {
      const ok = onLogin(username, password);
      if (!ok) setError('Ungültiger Benutzername oder Passwort');
      setIsLoading(false);
    }, 450);
  };

  return (
    <div className="min-h-screen flex bg-[#060a10] overflow-hidden">
      {/* Left panel - hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 flex-col justify-between p-10 relative">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent pointer-events-none" />

        {/* Animated mock dashboard */}
        <div className="relative z-10 mt-16">
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: 'COP Aktuell', value: '4.21', color: 'text-emerald-400', bg: 'border-emerald-500/20' },
              { label: 'Vorlauftemp.', value: '48.3°C', color: 'text-orange-400', bg: 'border-orange-500/20' },
              { label: 'Stromverbrauch', value: '5.8 kW', color: 'text-amber-400', bg: 'border-amber-500/20' },
            ].map(c => (
              <div key={c.label} className={`rounded-xl bg-[#0d1220] border ${c.bg} p-3`}>
                <p className="text-[10px] text-slate-600 mb-1">{c.label}</p>
                <p className={`font-mono text-lg font-bold ${c.color}`}>{c.value}</p>
              </div>
            ))}
          </div>

          {/* Mock chart bars */}
          <div className="rounded-2xl bg-[#0d1220] border border-[#1a2235] p-4 mb-3">
            <p className="text-xs text-slate-500 mb-3">Temperaturverlauf 24h</p>
            <div className="flex items-end gap-1 h-24">
              {[42,45,46,43,41,44,47,48,45,46,44,43,45,48,49,47,46,45,44,46,48,47,46,45].map((v, i) => (
                <div key={i} className="flex-1 rounded-sm transition-all"
                  style={{ height: `${((v - 38) / 15) * 100}%`, background: `rgba(251,146,60,${0.3 + (i % 3) * 0.15})` }}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-[#0d1220] border border-[#1a2235] p-3">
              <p className="text-[10px] text-slate-600 mb-2">Pufferspeicher</p>
              <div className="space-y-1.5">
                {[{l:'Oben',v:52,c:'bg-orange-400'},{l:'Mitte',v:45,c:'bg-emerald-400'},{l:'Unten',v:38,c:'bg-sky-400'}].map(p => (
                  <div key={p.l} className="flex items-center gap-2">
                    <span className="text-[9px] text-slate-600 w-8">{p.l}</span>
                    <div className="flex-1 h-1.5 bg-[#1a2235] rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${p.c} opacity-60`} style={{width:`${(p.v/65)*100}%`}} />
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono w-8 text-right">{p.v}°</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl bg-[#0d1220] border border-[#1a2235] p-3">
              <p className="text-[10px] text-slate-600 mb-2">System-Status</p>
              <div className="space-y-1.5">
                {[{l:'MQTT',v:'Verbunden',c:'text-emerald-400'},{l:'Anlage',v:'Heizen',c:'text-orange-400'},{l:'Fehler',v:'Keine',c:'text-slate-500'}].map(s => (
                  <div key={s.l} className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-600">{s.l}</span>
                    <span className={`text-[10px] font-medium ${s.c}`}>{s.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-slate-700 text-xs">Echtzeit-Monitoring · Wärmepumpenanlage Darmstadt</p>
        </div>
      </div>

      {/* Right panel - login form */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-6 sm:p-10 relative">
        <div className="absolute inset-0 lg:border-l lg:border-[#1a2235]" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/4 rounded-full blur-[80px] pointer-events-none" />

        <div className="w-full max-w-sm relative z-10">
          {/* Logo */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <span className="text-white font-black text-sm">KT</span>
              </div>
              <div>
                <p className="text-sm font-bold text-white">{BRAND.name}</p>
                <p className="text-xs text-slate-600">Heizungs-Monitoring</p>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Willkommen zurück</h1>
            <p className="text-sm text-slate-500">{CUSTOMER.name} · {CUSTOMER.address.split(',')[0]}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Benutzername</label>
              <input
                type="text" value={username} onChange={e => setUsername(e.target.value)}
                placeholder="Dein Name"
                className="w-full px-4 py-3 rounded-xl bg-[#0d1220] border border-[#1a2235] text-white placeholder:text-slate-700 text-sm focus:outline-none focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/10 transition-all"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Passwort</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-[#0d1220] border border-[#1a2235] text-white placeholder:text-slate-700 text-sm focus:outline-none focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/10 transition-all"
                required
              />
            </div>

            <button
              type="submit" disabled={isLoading}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Anmeldung…
                </>
              ) : 'Anmelden'}
            </button>
          </form>

          {/* Feature pills */}
          <div className="flex items-center justify-center gap-3 mt-8">
            {[
              { icon: <Wifi className="w-3.5 h-3.5" />, label: 'Echtzeit' },
              { icon: <BarChart3 className="w-3.5 h-3.5" />, label: 'Analysen' },
              { icon: <Shield className="w-3.5 h-3.5" />, label: 'DSGVO' },
            ].map(f => (
              <div key={f.label} className="flex items-center gap-1.5 text-slate-600 text-xs">
                {f.icon} {f.label}
              </div>
            ))}
          </div>

          <p className="text-center text-[11px] text-slate-700 mt-4">
            © 2026 {BRAND.fullName} · {BRAND.version}
          </p>
        </div>
      </div>
    </div>
  );
}

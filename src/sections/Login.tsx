import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Wifi, Shield, BarChart3 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BRAND } from '@/config/mqtt.config';

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
      const success = onLogin(username, password);
      if (!success) setError('Ungültiger Benutzername oder Passwort');
      setIsLoading(false);
    }, 400);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0e14] p-4 relative overflow-hidden">
      {/* Hintergrund-Effekte */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}
      />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 mb-5 shadow-xl shadow-emerald-500/20">
            <span className="text-white font-black text-xl tracking-tighter">KT</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1 tracking-tight">
            {BRAND.name}{' '}
            <span className="text-emerald-400 font-normal">{BRAND.product}</span>
          </h1>
          <p className="text-sm text-slate-500">
            Professionelle Wärmepumpen-Überwachung
          </p>
        </div>

        <Card className="border-[#1e2736] bg-[#111620]/80 backdrop-blur-xl shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-lg">Anmelden</CardTitle>
            <CardDescription className="text-slate-400">
              Geben Sie Ihre Zugangsdaten ein
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="bg-red-500/10 border-red-500/40">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="username" className="text-slate-300 text-sm">
                  Benutzername
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Dein Name"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-[#0a0e14] border-[#1e2736] text-white placeholder:text-slate-600 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300 text-sm">
                  Passwort
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-[#0a0e14] border-[#1e2736] text-white placeholder:text-slate-600 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-medium shadow-lg shadow-emerald-500/20"
                disabled={isLoading}
              >
                {isLoading ? 'Anmeldung...' : 'Anmelden'}
              </Button>
            </form>

            {/* Zugangs-Hinweis */}
            <div className="mt-5 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
              <p className="text-xs text-slate-400 text-center leading-relaxed">
                <span className="font-semibold text-emerald-400">Zugang:</span> Gib deinen Namen und das Projekt-Passwort ein.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 mt-8">
          {[
            { icon: <Wifi className="w-5 h-5" />, label: 'Echtzeit-Daten' },
            { icon: <BarChart3 className="w-5 h-5" />, label: '24/7 Monitoring' },
            { icon: <Shield className="w-5 h-5" />, label: 'DSGVO konform' },
          ].map((f) => (
            <div key={f.label} className="text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/8 text-emerald-400/60 mb-2">
                {f.icon}
              </div>
              <p className="text-[11px] text-slate-500">{f.label}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-[11px] text-slate-600 mt-6">
          © 2026 {BRAND.fullName} · v{BRAND.version}
        </p>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  LogOut, Bell, User, Wifi, WifiOff, LayoutDashboard, Activity, GitBranch,
  Settings2, Radio, MapPin, Thermometer, Zap, Shield, Euro, Wrench, Menu, X,
} from 'lucide-react';
import type { User as UserType } from '@/types/heating';
import type { ViewType } from '@/App';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BRAND } from '@/config/mqtt.config';

interface HeaderProps {
  user: UserType | null;
  onLogout: () => void;
  isConnected: boolean;
  alarmCount: number;
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  isSimulation: boolean;
}

const roleLabels: Record<string, string> = {
  customer: 'Kunde', installer: 'Installateur', technician: 'Techniker', admin: 'Administrator',
};

const navItems: { view: ViewType; label: string; icon: React.ReactNode }[] = [
  { view: 'dashboard',    label: 'Dashboard',     icon: <LayoutDashboard className="w-4 h-4" /> },
  { view: 'standorte',   label: 'Standorte',     icon: <MapPin className="w-4 h-4" /> },
  { view: 'schema',      label: 'Schema',        icon: <Activity className="w-4 h-4" /> },
  { view: 'pid',         label: 'P&ID',          icon: <GitBranch className="w-4 h-4" /> },
  { view: 'control',     label: 'Steuerung',     icon: <Thermometer className="w-4 h-4" /> },
  { view: 'energy',      label: 'Kosten',        icon: <Euro className="w-4 h-4" /> },
  { view: 'maintenance', label: 'Wartung',       icon: <Wrench className="w-4 h-4" /> },
  { view: 'optimization',label: 'Optimierung',   icon: <Zap className="w-4 h-4" /> },
  { view: 'monitoring',  label: 'Monitoring',    icon: <Shield className="w-4 h-4" /> },
  { view: 'settings',    label: 'Einstellungen', icon: <Settings2 className="w-4 h-4" /> },
];

export function Header({ user, onLogout, isConnected, alarmCount, currentView, onViewChange, isSimulation }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const handleNav = (view: ViewType) => { onViewChange(view); setMobileOpen(false); };

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-[#0a0e14]/95 backdrop-blur-xl border-b border-[#1e2736]">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3 select-none shrink-0">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/20">
              <span className="text-white font-black text-xs tracking-tight">KT</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold text-white leading-tight tracking-tight">
                {BRAND.name} <span className="text-emerald-400 font-normal">{BRAND.product}</span>
              </h1>
              <p className="text-[10px] text-slate-500 leading-tight">Wärmepumpen-Überwachung · Darmstadt</p>
            </div>
          </div>

          {/* Desktop Nav - horizontal scrollable */}
          <nav className="hidden lg:flex items-center gap-1 bg-[#111620] rounded-xl p-1 border border-[#1e2736] overflow-x-auto max-w-[700px]">
            {navItems.map((item) => (
              <button
                key={item.view}
                onClick={() => handleNav(item.view)}
                className={`flex items-center gap-1.5 text-xs font-medium rounded-lg px-3 py-1.5 transition-all whitespace-nowrap ${
                  currentView === item.view
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'text-slate-400 hover:text-white hover:bg-[#1a2030]'
                }`}
              >
                {item.icon}
                <span className="hidden xl:inline">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Connection pill */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs ${
              isSimulation ? 'bg-emerald-500/8 border-emerald-500/20 text-emerald-400'
              : isConnected ? 'bg-emerald-500/8 border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/8 border-red-500/20 text-red-400'
            }`}>
              {isSimulation ? <Radio className="w-3 h-3 animate-pulse" />
               : isConnected ? <Wifi className="w-3 h-3" />
               : <WifiOff className="w-3 h-3" />}
              <span className="hidden sm:inline">
                {isSimulation ? 'Demo' : isConnected ? 'Live' : 'Getrennt'}
              </span>
            </div>

            {/* Alarm badge */}
            {alarmCount > 0 && (
              <button onClick={() => handleNav('dashboard')}>
                <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/40 hover:bg-amber-500/25 cursor-pointer">
                  <Bell className="w-3 h-3 mr-1" />{alarmCount}
                </Badge>
              </button>
            )}

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-2 text-slate-300 hover:text-white hover:bg-[#1a2030] px-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="hidden sm:inline text-xs">{user?.username}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 bg-[#111620] border-[#1e2736]">
                <DropdownMenuLabel className="text-white">
                  <span>{user?.username}</span>
                  <p className="text-xs text-slate-400 font-normal">{user && (roleLabels[user.role] || user.role)}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-[#1e2736]" />
                <DropdownMenuItem onClick={() => handleNav('settings')} className="text-slate-300 cursor-pointer">
                  <Settings2 className="w-4 h-4 mr-2" /> Einstellungen
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[#1e2736]" />
                <DropdownMenuItem onClick={onLogout} className="text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer">
                  <LogOut className="w-4 h-4 mr-2" /> Abmelden
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Hamburger */}
            <Button variant="ghost" size="sm" className="lg:hidden text-slate-400 hover:text-white" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile flyout */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute top-14 left-0 right-0 bg-[#0d1117] border-b border-[#1e2736] shadow-2xl">
            <div className="container mx-auto px-4 py-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {navItems.map((item) => (
                <button
                  key={item.view}
                  onClick={() => handleNav(item.view)}
                  className={`flex items-center gap-3 p-3 rounded-xl text-sm font-medium transition-all border ${
                    currentView === item.view
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : 'bg-[#111620] text-slate-300 border-[#1e2736] hover:border-[#2a3548]'
                  }`}
                >
                  {item.icon} {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

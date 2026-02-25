import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  LogOut, Bell, User, Wifi, WifiOff, LayoutDashboard, Activity, GitBranch,
  Settings2, Radio, MapPin, Thermometer, Zap, Shield, Euro, Wrench, Menu, X,
  TrendingUp,
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

const navItems: { view: ViewType; label: string; icon: React.ReactNode; group: string }[] = [
  { view: 'dashboard',    label: 'Dashboard',     icon: <LayoutDashboard className="w-3.5 h-3.5" />, group: 'main' },
  { view: 'standorte',   label: 'Standorte',     icon: <MapPin className="w-3.5 h-3.5" />,          group: 'main' },
  { view: 'schema',      label: 'Schema',        icon: <Activity className="w-3.5 h-3.5" />,         group: 'main' },
  { view: 'pid',         label: 'P&ID',          icon: <GitBranch className="w-3.5 h-3.5" />,        group: 'main' },
  { view: 'control',     label: 'Steuerung',     icon: <Thermometer className="w-3.5 h-3.5" />,      group: 'ops' },
  { view: 'energy',      label: 'Energie',       icon: <Euro className="w-3.5 h-3.5" />,             group: 'ops' },
  { view: 'maintenance', label: 'Wartung',       icon: <Wrench className="w-3.5 h-3.5" />,           group: 'ops' },
  { view: 'optimization',label: 'Optimierung',   icon: <TrendingUp className="w-3.5 h-3.5" />,       group: 'ops' },
  { view: 'monitoring',  label: 'Monitoring',    icon: <Shield className="w-3.5 h-3.5" />,           group: 'ops' },
  { view: 'settings',    label: 'Einstellungen', icon: <Settings2 className="w-3.5 h-3.5" />,        group: 'ops' },
];

const mobileBottomNav: { view: ViewType; label: string; icon: React.ReactNode }[] = [
  { view: 'dashboard',   label: 'Home',    icon: <LayoutDashboard className="w-5 h-5" /> },
  { view: 'schema',      label: 'Schema',  icon: <Activity className="w-5 h-5" /> },
  { view: 'energy',      label: 'Energie', icon: <Zap className="w-5 h-5" /> },
  { view: 'maintenance', label: 'Wartung', icon: <Wrench className="w-5 h-5" /> },
  { view: 'settings',    label: 'Mehr',    icon: <Settings2 className="w-5 h-5" /> },
];

export function Header({ user, onLogout, isConnected, alarmCount, currentView, onViewChange, isSimulation }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const handleNav = (view: ViewType) => { onViewChange(view); setMobileOpen(false); };

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-[#050810]/95 backdrop-blur-xl border-b border-[#151e30]">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-emerald-500/35 to-transparent" />
        <div className="container mx-auto px-3 sm:px-4 flex items-center justify-between gap-3" style={{ height: '52px' }}>
          {/* Logo */}
          <div className="flex items-center gap-2.5 select-none shrink-0">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-lg overflow-hidden shrink-0"
              style={{ background: 'linear-gradient(135deg, #059669 0%, #0891b2 100%)' }}>
              <span className="text-white font-black text-[10px] tracking-tighter z-10">KT</span>
              <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent" />
            </div>
            <div className="hidden sm:block leading-none">
              <p className="text-[13px] font-bold text-white tracking-tight">
                {BRAND.name} <span className="text-emerald-400 font-medium">Monitoring</span>
              </p>
              <p className="text-[9px] text-slate-600 tracking-wide">Wärmepumpe · Darmstadt 2026</p>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-0.5 bg-[#080c15] rounded-xl px-1.5 py-1 border border-[#151e30]">
            {navItems.map((item, i) => (
              <div key={item.view} className="flex items-center">
                {i > 0 && navItems[i-1].group !== item.group && (
                  <div className="w-px h-3.5 bg-[#1a2235] mx-1" />
                )}
                <button
                  onClick={() => handleNav(item.view)}
                  className={`relative flex items-center gap-1.5 text-[11px] font-medium rounded-lg px-2.5 py-1.5 transition-all duration-150 whitespace-nowrap ${
                    currentView === item.view
                      ? 'text-emerald-300'
                      : 'text-slate-500 hover:text-slate-200 hover:bg-[#0f1522]'
                  }`}
                >
                  {currentView === item.view && (
                    <span className="absolute inset-0 rounded-lg bg-emerald-500/12 border border-emerald-500/20" />
                  )}
                  <span className="relative">{item.icon}</span>
                  <span className="relative hidden xl:inline">{item.label}</span>
                </button>
              </div>
            ))}
          </nav>

          {/* Right */}
          <div className="flex items-center gap-2 shrink-0">
            <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium ${
              isSimulation
                ? 'bg-blue-500/8 border-blue-500/20 text-blue-400'
                : isConnected
                  ? 'bg-emerald-500/8 border-emerald-500/20 text-emerald-400'
                  : 'bg-red-500/8 border-red-500/20 text-red-400'
            }`}>
              {isSimulation ? <Radio className="w-3 h-3" /> : isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {isSimulation ? 'Demo' : isConnected ? 'Live · wss' : 'Offline'}
            </div>

            {alarmCount > 0 && (
              <button onClick={() => handleNav('dashboard')}
                className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/12 border border-red-500/30 text-red-400 text-[11px] font-medium hover:bg-red-500/20 transition-all">
                <Bell className="w-3 h-3" />
                <span>{alarmCount}</span>
              </button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm"
                  className="flex items-center gap-2 text-slate-400 hover:text-white hover:bg-[#0f1522] px-2 h-8 rounded-lg">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                    style={{ background: 'linear-gradient(135deg, #059669, #0891b2)' }}>
                    {user?.username?.charAt(0).toUpperCase() || <User className="w-3 h-3" />}
                  </div>
                  <span className="hidden sm:inline text-xs">{user?.username}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 bg-[#080c15] border-[#1a2235] shadow-2xl shadow-black/60">
                <DropdownMenuLabel className="text-white text-sm">
                  {user?.username}
                  <p className="text-xs text-slate-500 font-normal mt-0.5">{user && (roleLabels[user.role] || user.role)}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-[#1a2235]" />
                <DropdownMenuItem onClick={() => handleNav('settings')} className="text-slate-300 cursor-pointer text-sm">
                  <Settings2 className="w-3.5 h-3.5 mr-2" /> Einstellungen
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[#1a2235]" />
                <DropdownMenuItem onClick={onLogout} className="text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer text-sm">
                  <LogOut className="w-3.5 h-3.5 mr-2" /> Abmelden
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Tablet hamburger */}
            <Button variant="ghost" size="sm"
              className="hidden sm:flex lg:hidden text-slate-400 hover:text-white hover:bg-[#0f1522] h-8 w-8 p-0 rounded-lg"
              onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Tablet slide menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 hidden sm:block lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute top-[52px] left-0 right-0 bg-[#070b14] border-b border-[#151e30] shadow-2xl">
            <div className="container mx-auto px-4 py-4">
              <p className="text-[9px] text-slate-600 uppercase tracking-widest font-semibold mb-2">Übersicht</p>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {navItems.filter(n => n.group === 'main').map(item => (
                  <TabletNavBtn key={item.view} item={item} active={currentView === item.view} onNav={handleNav} />
                ))}
              </div>
              <p className="text-[9px] text-slate-600 uppercase tracking-widest font-semibold mb-2">Betrieb</p>
              <div className="grid grid-cols-3 gap-2">
                {navItems.filter(n => n.group === 'ops').map(item => (
                  <TabletNavBtn key={item.view} item={item} active={currentView === item.view} onNav={handleNav} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Nav (phones only) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#060910]/95 backdrop-blur-xl border-t border-[#151e30]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="h-px w-full bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
        <div className="flex items-stretch">
          {mobileBottomNav.map((item) => {
            const active = currentView === item.view;
            return (
              <button key={item.view} onClick={() => handleNav(item.view)}
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-all relative ${
                  active ? 'text-emerald-400' : 'text-slate-600 active:text-slate-300'
                }`}>
                {active && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-emerald-400" />}
                <span className={`transition-transform duration-150 ${active ? 'scale-110' : ''}`}>{item.icon}</span>
                <span className="text-[9px] font-medium">{item.label}</span>
                {item.view === 'dashboard' && alarmCount > 0 && (
                  <span className="absolute top-1.5 right-[calc(50%-14px)] w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {alarmCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}

function TabletNavBtn({ item, active, onNav }: {
  item: { view: ViewType; label: string; icon: React.ReactNode };
  active: boolean;
  onNav: (v: ViewType) => void;
}) {
  return (
    <button onClick={() => onNav(item.view)}
      className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-medium transition-all border ${
        active
          ? 'bg-emerald-500/12 text-emerald-400 border-emerald-500/25'
          : 'bg-[#080c15] text-slate-500 border-[#151e30] hover:text-white hover:border-[#222d42]'
      }`}>
      {item.icon}
      <span className="truncate">{item.label}</span>
    </button>
  );
}

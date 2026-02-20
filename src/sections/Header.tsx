import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  LogOut,
  Bell,
  User,
  Wifi,
  WifiOff,
  LayoutDashboard,
  Activity,
  GitBranch,
  Settings2,
  Radio,
  MapPin,
} from 'lucide-react';
import type { User as UserType } from '@/types/heating';
import type { ViewType } from '@/App';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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
  customer: 'Kunde',
  installer: 'Installateur',
  technician: 'Techniker',
  admin: 'Administrator',
};

const navItems: { view: ViewType; label: string; icon: React.ReactNode }[] = [
  { view: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { view: 'standorte', label: 'Standorte', icon: <MapPin className="w-4 h-4" /> },
  { view: 'schema', label: 'Schema', icon: <Activity className="w-4 h-4" /> },
  { view: 'pid', label: 'P&ID', icon: <GitBranch className="w-4 h-4" /> },
  { view: 'settings', label: 'Einstellungen', icon: <Settings2 className="w-4 h-4" /> },
];

export function Header({
  user, onLogout, isConnected, alarmCount, currentView, onViewChange, isSimulation,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#1e2736] bg-[#0a0e14]/90 backdrop-blur-xl">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">

        {/* ── Logo ── */}
        <div className="flex items-center gap-3 select-none">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/20">
            <span className="text-white font-black text-sm tracking-tight">KT</span>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-base font-bold text-white leading-tight tracking-tight">
              {BRAND.name}{' '}
              <span className="text-emerald-400 font-normal">{BRAND.product}</span>
            </h1>
            <p className="text-[10px] text-slate-500 leading-tight -mt-0.5">
              Wärmepumpen-Überwachung
            </p>
          </div>
        </div>

        {/* ── Navigation ── */}
        <nav className="hidden md:flex items-center gap-0.5 bg-[#111620] rounded-lg p-1 border border-[#1e2736]">
          {navItems.map((item) => (
            <Button
              key={item.view}
              variant="ghost"
              size="sm"
              onClick={() => onViewChange(item.view)}
              className={`flex items-center gap-2 text-xs font-medium rounded-md px-3 py-1.5 transition-all ${
                currentView === item.view
                  ? 'bg-emerald-500/15 text-emerald-400 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-[#1a2030]'
              }`}
            >
              {item.icon}
              {item.label}
            </Button>
          ))}
        </nav>

        {/* ── Rechte Seite ── */}
        <div className="flex items-center gap-2 sm:gap-3">

          {/* Verbindungsstatus */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-[#111620] border border-[#1e2736] text-xs">
            {isSimulation ? (
              <>
                <Radio className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline text-emerald-400/80">Demo</span>
              </>
            ) : isConnected ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline text-slate-300">Live</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-red-400" />
                <span className="hidden sm:inline text-slate-300">Getrennt</span>
              </>
            )}
          </div>

          {/* Alarm-Badge */}
          {alarmCount > 0 && (
            <button
              onClick={() => onViewChange('dashboard')}
              className="relative flex items-center"
            >
              <Badge
                variant="destructive"
                className="bg-amber-500/15 text-amber-400 border-amber-500/40 hover:bg-amber-500/25 cursor-pointer"
              >
                <Bell className="w-3 h-3 mr-1" />
                {alarmCount}
              </Badge>
            </button>
          )}

          {/* Mobile Nav */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                  <LayoutDashboard className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-[#111620] border-[#1e2736]">
                {navItems.map((item) => (
                  <DropdownMenuItem
                    key={item.view}
                    onClick={() => onViewChange(item.view)}
                    className={`cursor-pointer ${
                      currentView === item.view ? 'text-emerald-400' : 'text-slate-300'
                    }`}
                  >
                    {item.icon}
                    <span className="ml-2">{item.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Benutzer-Menü */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 text-slate-300 hover:text-white hover:bg-[#1a2030] px-2"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="hidden sm:inline text-sm">{user?.username}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-[#111620] border-[#1e2736]">
              <DropdownMenuLabel className="text-white">
                <div className="flex flex-col">
                  <span>{user?.username}</span>
                  <span className="text-xs text-slate-400 font-normal">
                    {user && (roleLabels[user.role] || user.role)}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-[#1e2736]" />
              <DropdownMenuItem
                onClick={() => onViewChange('settings')}
                className="text-slate-300 cursor-pointer"
              >
                <Settings2 className="w-4 h-4 mr-2" />
                Einstellungen
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#1e2736]" />
              <DropdownMenuItem
                onClick={onLogout}
                className="text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Abmelden
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

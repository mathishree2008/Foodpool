import React from 'react';
import { UserRole } from '../types';
import { 
  Utensils, 
  Car, 
  HeartHandshake, 
  ShieldCheck, 
  Radio, 
  Lock, 
  RotateCcw,
  Sparkles,
  Layers,
  LayoutDashboard
} from 'lucide-react';

interface NavbarProps {
  currentRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  onOpenPrivacyModal: () => void;
  onResetData: () => void;
  onOpenQrModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onSelectRole,
  onOpenPrivacyModal,
  onResetData,
  onOpenQrModal
}) => {
  return (
    <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-xl border-b border-[#27272a] px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand and Tamil Nadu indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-[#d4af37] via-[#f3e5ab] to-[#aa820a] text-black font-black shadow-lg shadow-[#d4af37]/20 border border-[#d4af37]">
            FP
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white">FOODPOOL</span>
              <span className="text-[10px] font-mono font-semibold bg-black text-[#d4af37] border border-[#d4af37]/60 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] animate-pulse" />
                TAMIL NADU NETWORK
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 hidden sm:block">
              Intelligent Surplus Redistribution · Route Pooling & Spoilage Sentinel
            </p>
          </div>
        </div>

        {/* Role Switcher Segmented Control */}
        <div className="flex items-center p-1 bg-black/80 border border-zinc-800 rounded-xl text-xs overflow-x-auto max-w-full">
          <button
            onClick={() => onSelectRole('overview')}
            className={`px-3 py-1.5 rounded-lg transition-all font-medium flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              currentRole === 'overview'
                ? 'bg-zinc-900 text-[#d4af37] shadow-sm border border-[#d4af37]/40 font-semibold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Home</span>
          </button>

          <button
            onClick={() => onSelectRole('dashboard')}
            className={`px-3 py-1.5 rounded-lg transition-all font-medium flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              currentRole === 'dashboard'
                ? 'bg-zinc-900 text-[#d4af37] shadow-sm border border-[#d4af37]/40 font-semibold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Live Dashboard</span>
          </button>

          <button
            onClick={() => onSelectRole('express_post')}
            className={`px-3 py-1.5 rounded-lg transition-all font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              currentRole === 'express_post'
                ? 'bg-[#d4af37] text-black shadow-md font-extrabold'
                : 'text-[#d4af37] hover:bg-zinc-900 border border-[#d4af37]/40'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>⚡ 30s Post (No Login)</span>
          </button>

          <button
            onClick={() => onSelectRole('clusters_routing')}
            className={`px-3 py-1.5 rounded-lg transition-all font-medium flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              currentRole === 'clusters_routing'
                ? 'bg-zinc-900 text-[#d4af37] shadow-sm border border-[#d4af37]/40 font-semibold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Micro-Clusters (≥20 Meals)</span>
          </button>

          <button
            onClick={() => onSelectRole('surplus_map')}
            className={`px-3 py-1.5 rounded-lg transition-all font-medium flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              currentRole === 'surplus_map'
                ? 'bg-zinc-900 text-white shadow-sm border border-zinc-700 font-semibold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
            </span>
            <span>Surplus Food Map</span>
          </button>

          <button
            onClick={() => onSelectRole('volunteer_tracking')}
            className={`px-3 py-1.5 rounded-lg transition-all font-medium flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              currentRole === 'volunteer_tracking'
                ? 'bg-zinc-900 text-[#d4af37] shadow-sm border border-[#d4af37]/40 font-semibold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Car className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>NGO Coordinator Tracking</span>
          </button>

          <button
            onClick={() => onSelectRole('donor')}
            className={`px-3 py-1.5 rounded-lg transition-all font-medium flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              currentRole === 'donor'
                ? 'bg-zinc-900 text-white shadow-sm border border-[#d4af37]/50 font-semibold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Donor Hub</span>
          </button>

          <button
            onClick={() => onSelectRole('ngo')}
            className={`px-3 py-1.5 rounded-lg transition-all font-medium flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              currentRole === 'ngo'
                ? 'bg-zinc-900 text-white shadow-sm border border-[#d4af37]/50 font-semibold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>Receiver NGO</span>
          </button>

          <button
            onClick={() => onSelectRole('transporter')}
            className={`px-3 py-1.5 rounded-lg transition-all font-medium flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              currentRole === 'transporter'
                ? 'bg-zinc-900 text-white shadow-sm border border-[#d4af37]/50 font-semibold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>Coordinator Hub</span>
          </button>

          <button
            onClick={() => onSelectRole('login_gateway')}
            className={`px-3 py-1.5 rounded-lg transition-all font-medium flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              currentRole === 'login_gateway'
                ? 'bg-[#d4af37] text-black font-bold shadow-sm'
                : 'text-[#d4af37] hover:bg-zinc-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Identify Role / Login</span>
          </button>

          <button
            onClick={() => onSelectRole('problems_matrix')}
            className={`px-3 py-1.5 rounded-lg transition-all font-medium flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              currentRole === 'problems_matrix'
                ? 'bg-zinc-900 text-[#d4af37] border border-[#d4af37]/40 font-bold shadow-sm'
                : 'text-zinc-400 hover:text-[#d4af37]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>10 Solutions Matrix</span>
          </button>
        </div>

        {/* Actions & Tools */}
        <div className="flex items-center gap-2">
          {onOpenQrModal && (
            <button
              onClick={onOpenQrModal}
              className="px-2.5 py-1.5 rounded-xl bg-black border border-[#d4af37]/60 text-[#d4af37] hover:bg-zinc-900 text-xs flex items-center gap-1.5 font-semibold transition-colors cursor-pointer shadow-sm"
              title="Open Kitchen & Pickup QR Code Generator"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="text-[11px]">QR Code Generator</span>
            </button>
          )}

          <button
            onClick={onOpenPrivacyModal}
            className="p-2 rounded-xl bg-black border border-zinc-800 text-zinc-400 hover:text-[#d4af37] text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Privacy, Encryption & 48hr Retention"
          >
            <Lock className="w-3.5 h-3.5 text-[#d4af37]" />
            <span className="hidden xl:inline text-[11px]">E2E Privacy</span>
          </button>

          <button
            onClick={onResetData}
            className="p-2 rounded-xl bg-black border border-zinc-800 text-zinc-400 hover:text-[#d4af37] text-xs flex items-center gap-1 transition-colors cursor-pointer"
            title="Reset system to default demo state"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden xl:inline text-[11px]">Reset</span>
          </button>
        </div>
      </div>
    </header>
  );
};

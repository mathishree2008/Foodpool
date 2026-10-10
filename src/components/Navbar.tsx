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
  Sparkles
} from 'lucide-react';

interface NavbarProps {
  currentRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  onOpenPrivacyModal: () => void;
  onResetData: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onSelectRole,
  onOpenPrivacyModal,
  onResetData
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand and Tamil Nadu indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-black shadow-lg shadow-emerald-500/20">
            FP
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white">FOODPOOL</span>
              <span className="text-[10px] font-mono font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                TAMIL NADU NETWORK
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Intelligent Surplus Redistribution · Route Pooling & Spoilage Sentinel
            </p>
          </div>
        </div>

        {/* Role Switcher Segmented Control */}
        <div className="flex items-center p-1 bg-slate-900/90 border border-slate-800 rounded-xl text-xs overflow-x-auto max-w-full">
          <button
            onClick={() => onSelectRole('overview')}
            className={`px-3 py-1.5 rounded-lg transition-all font-medium flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              currentRole === 'overview'
                ? 'bg-slate-800 text-emerald-300 shadow-sm border border-slate-700/80 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Live Radar</span>
          </button>

          <button
            onClick={() => onSelectRole('donor')}
            className={`px-3 py-1.5 rounded-lg transition-all font-medium flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              currentRole === 'donor'
                ? 'bg-slate-800 text-amber-300 shadow-sm border border-slate-700/80 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Donor Hub</span>
          </button>

          <button
            onClick={() => onSelectRole('transporter')}
            className={`px-3 py-1.5 rounded-lg transition-all font-medium flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              currentRole === 'transporter'
                ? 'bg-slate-800 text-blue-300 shadow-sm border border-slate-700/80 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>Transporter Pool</span>
          </button>

          <button
            onClick={() => onSelectRole('ngo')}
            className={`px-3 py-1.5 rounded-lg transition-all font-medium flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              currentRole === 'ngo'
                ? 'bg-slate-800 text-teal-300 shadow-sm border border-slate-700/80 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>Recipient NGO</span>
          </button>

          <button
            onClick={() => onSelectRole('problems_matrix')}
            className={`px-3 py-1.5 rounded-lg transition-all font-medium flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              currentRole === 'problems_matrix'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-emerald-400 hover:text-emerald-300'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>10 Solutions Matrix</span>
          </button>
        </div>

        {/* Privacy & Reset Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenPrivacyModal}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-emerald-300 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Privacy, Encryption & 48hr Retention"
          >
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden xl:inline text-[11px]">E2E Privacy</span>
          </button>

          <button
            onClick={onResetData}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-amber-300 text-xs flex items-center gap-1 transition-colors cursor-pointer"
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

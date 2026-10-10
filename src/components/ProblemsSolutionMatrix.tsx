import React, { useState } from 'react';
import { PROBLEMS_SOLUTION_MATRIX } from '../data/problemsMatrix';
import { 
  ShieldCheck, 
  CheckCircle2, 
  ExternalLink, 
  Zap, 
  HelpCircle,
  Sparkles,
  Activity
} from 'lucide-react';

interface ProblemsSolutionMatrixProps {
  onNavigateTab: (tab: 'donor' | 'transporter' | 'ngo' | 'overview') => void;
  onOpenPrivacyModal: () => void;
}

export const ProblemsSolutionMatrix: React.FC<ProblemsSolutionMatrixProps> = ({
  onNavigateTab,
  onOpenPrivacyModal
}) => {
  const [activeItem, setActiveItem] = useState<number | null>(null);

  const getTargetTab = (id: number): 'donor' | 'transporter' | 'ngo' | 'overview' => {
    switch (id) {
      case 1:
        return 'donor'; // Spoilage countdown & FSSAI
      case 2:
        return 'transporter'; // Route matching & detour
      case 3:
        return 'transporter'; // Transporter backup dispatch
      case 4:
        return 'transporter'; // 2-stage OTP & verification
      case 5:
        return 'ngo'; // Donor-NGO quantity sync
      case 6:
        return 'transporter'; // Traffic delay simulation
      case 7:
        return 'overview'; // Community pooling network
      case 8:
        return 'transporter'; // Fuel reimbursement ledger
      case 9:
        return 'donor'; // Food safety checklist
      case 10:
        return 'overview'; // Privacy & ephemeral retention
      default:
        return 'overview';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-900/40 rounded-2xl p-5 md:p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-slate-100">
              10 Major Problems & Technical Solutions Verification Engine
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Every operational hurdle identified in community food redistribution is systematically solved in FOODPOOL.
            Click any problem to inspect its operational metrics, algorithmic solution, and test it live in the system.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-800/80 px-3 py-1.5 rounded-xl text-xs font-mono text-emerald-300">
          <Activity className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
          <span>10 / 10 Active & Operational</span>
        </div>
      </div>

      {/* Grid of 10 Problems */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PROBLEMS_SOLUTION_MATRIX.map((item) => {
          const isSelected = activeItem === item.id;

          return (
            <div
              key={item.id}
              onClick={() => setActiveItem(isSelected ? null : item.id)}
              className={`rounded-2xl border p-5 transition-all cursor-pointer backdrop-blur-md flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-900 border-emerald-500/60 shadow-xl shadow-emerald-500/5 ring-1 ring-emerald-500/30'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-3">
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-emerald-400 font-mono font-bold text-xs border border-slate-700">
                      {item.id}
                    </span>
                    <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-emerald-400">
                      {item.badge}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold">
                    {item.liveStatus}
                  </span>
                </div>

                {/* Problem Statement */}
                <div>
                  <h3 className="text-xs font-bold text-rose-300/90 leading-snug">
                    {item.problem}
                  </h3>
                  <div className="mt-2 pl-3 border-l-2 border-emerald-500/60">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
                      Implemented Technical Solution:
                    </span>
                    <p className="text-xs text-slate-300 mt-0.5 leading-relaxed font-medium">
                      {item.proposedSolution}
                    </p>
                  </div>
                </div>

                {/* Live System Metric */}
                <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800 space-y-1">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400">{item.metricTitle}:</span>
                    <span className="font-mono text-emerald-300 font-semibold">{item.metricValue}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed italic">
                    Action: {item.demonstrationAction}
                  </p>
                </div>
              </div>

              {/* Action Trigger Link */}
              <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500">Live Simulation Ready</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (item.id === 10) {
                      onOpenPrivacyModal();
                    } else {
                      onNavigateTab(getTargetTab(item.id));
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-semibold text-[11px] flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <span>Test in {getTargetTab(item.id).toUpperCase()}</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

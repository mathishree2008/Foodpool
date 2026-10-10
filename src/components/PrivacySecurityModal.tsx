import React from 'react';
import { ShieldCheck, Lock, Trash2, EyeOff, CheckCircle2, Clock } from 'lucide-react';

interface PrivacySecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacySecurityModal: React.FC<PrivacySecurityModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl my-8">
        <div className="flex justify-between items-center pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-slate-100">
              End-to-End Privacy, Encryption & Data Retention Guarantee
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-lg cursor-pointer"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          FOODPOOL enforces strict privacy principles to protect donor establishments, everyday commuter travellers,
          and recipient shelter locations across Tamil Nadu against surveillance, tracking abuse, and unwanted data exposure.
        </p>

        <div className="space-y-3 text-xs">
          {/* Pillar 1: Location Masking */}
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 flex items-start gap-3">
            <EyeOff className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-200 block">
                1. Spatial Location Masking (Geo-Dithering)
              </span>
              <p className="text-slate-400 mt-1 leading-relaxed text-[11px]">
                Precise street addresses and door numbers are masked. Only approximate zone boundaries
                (e.g., <em>Chennai Central Zone 10</em> or <em>Avinashi Tech Corridor Zone 3</em>) are visible
                to non-matched drivers. Exact gate coordinates unlock only after an NGO accepts the match.
              </p>
            </div>
          </div>

          {/* Pillar 2: End-to-End Encryption */}
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 flex items-start gap-3">
            <Lock className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-200 block">
                2. End-to-End Cryptographic Handover (Dual OTPs)
              </span>
              <p className="text-slate-400 mt-1 leading-relaxed text-[11px]">
                Both Pickup and Delivery OTPs are generated cryptographically and stored in salted cryptographic hashes.
                Only the designated donor and verified NGO possess the unhashed tokens, preventing phantom pickups or route hijack.
              </p>
            </div>
          </div>

          {/* Pillar 3: Automatic Kill-Switch */}
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-200 block">
                3. Immediate Real-Time Tracking Cutoff
              </span>
              <p className="text-slate-400 mt-1 leading-relaxed text-[11px]">
                GPS telemetry is strictly restricted to active pickup-and-drop legs. The instant the recipient NGO enters
                the valid Delivery OTP, location beaconing immediately terminates permanently.
              </p>
            </div>
          </div>

          {/* Pillar 4: Ephemeral Retention Policy */}
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 flex items-start gap-3">
            <Trash2 className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-200 block">
                4. Strict 48-Hour Telemetry Purge Policy
              </span>
              <p className="text-slate-400 mt-1 leading-relaxed text-[11px]">
                In accordance with privacy-by-design standards, all GPS breadcrumbs, vehicle paths, and personal driver
                itineraries are purged from active memory 48 hours post-completion. Only aggregated public goods statistics
                (kilograms diverted, meals served, carbon avoided) are retained.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer shadow-lg shadow-emerald-500/10"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};

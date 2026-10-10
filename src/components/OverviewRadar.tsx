import React, { useState } from 'react';
import { FoodDonation, RecipientNGO, TransporterTrip, TNRegion } from '../types';
import { TamilNaduMap } from './TamilNaduMap';
import { 
  Utensils, 
  Car, 
  HeartHandshake, 
  Clock, 
  ShieldCheck, 
  Sparkles, 
  Fuel, 
  Trees, 
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  MapPin,
  CheckCircle2
} from 'lucide-react';

interface OverviewRadarProps {
  donations: FoodDonation[];
  ngos: RecipientNGO[];
  trips: TransporterTrip[];
  onSelectRole: (role: any) => void;
  onOpenPrivacyModal: () => void;
}

export const OverviewRadar: React.FC<OverviewRadarProps> = ({
  donations,
  ngos,
  trips,
  onSelectRole,
  onOpenPrivacyModal
}) => {
  const [selectedCity, setSelectedCity] = useState<TNRegion | 'All'>('All');

  // Filter entities by selected city safely
  const filteredDonations = selectedCity === 'All' 
    ? donations 
    : donations.filter((d) => (d.location?.city || (d as any).city) === selectedCity);

  const filteredNgos = selectedCity === 'All'
    ? ngos
    : ngos.filter((n) => (n.location?.city || (n as any).city) === selectedCity);

  const filteredTrips = selectedCity === 'All'
    ? trips
    : trips.filter((t) => {
        const oCity = t.origin?.city || (t as any).originCity;
        const dCity = t.destination?.city || (t as any).destinationCity;
        return oCity === selectedCity || dCity === selectedCity;
      });

  // Compute live impact statistics safely without NaN
  const totalMealsDeliveredOrReserved = donations
    .filter((d) => d.status !== 'EXPIRED_REJECTED')
    .reduce((acc, d) => acc + (Number(d.totalServings ?? (d as any).servings) || 0), 0);

  const totalKgDiverted = donations
    .filter((d) => d.status !== 'EXPIRED_REJECTED')
    .reduce((acc, d) => acc + (Number(d.totalWeightKg ?? (d as any).weightKg) || 0), 0);

  const totalFuelReimbursed = trips.reduce(
    (acc, t) => acc + (Number(t.fuelReimbursementEarned) || 0),
    0
  );
  const totalCo2Saved = Math.round(totalKgDiverted * 2.3) || 0;

  // Urgent Spoilage Watchlist: items with < 3 hours remaining
  const now = Date.now();
  const urgentDonations = donations.filter((d) => {
    if (d.status === 'DELIVERED' || d.status === 'EXPIRED_REJECTED') return false;
    const deadline = new Date(d.safeConsumptionDeadline).getTime();
    const diffMins = (deadline - now) / (1000 * 60);
    return diffMins > 0 && diffMins < 180;
  });

  return (
    <div className="space-y-6">
      {/* Dashboard Header Bar */}
      <div className="bg-zinc-950 border border-[#d4af37]/40 rounded-3xl p-5 md:p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#d4af37] animate-ping" />
            <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
              <span>FoodPool Live Operational Dashboard & Impact Radar</span>
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
            Real-time surplus food telemetry across Tamil Nadu. Every dispatch and custody transfer is officially assigned to an authorized NGO Coordinator.
          </p>
        </div>

        {/* Quick Hub Navigation Links */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelectRole('surplus_map')}
            className="px-3 py-2 rounded-xl bg-black border border-zinc-700 hover:border-[#d4af37] text-xs font-semibold text-zinc-200 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <MapPin className="w-3.5 h-3.5 text-[#d4af37]" />
            Surplus Map
          </button>
          <button
            onClick={() => onSelectRole('volunteer_tracking')}
            className="px-3 py-2 rounded-xl bg-[#d4af37] text-black text-xs font-bold transition-all cursor-pointer hover:bg-[#b89528] flex items-center gap-1.5 shadow-md shadow-[#d4af37]/20"
          >
            <Car className="w-3.5 h-3.5" />
            Coordinator Tracking
          </button>
        </div>
      </div>

      {/* Top Impact Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Meals Redistributed
            </span>
            <Utensils className="w-4 h-4 text-[#d4af37]" />
          </div>
          <p className="text-2xl font-mono font-extrabold text-white mt-2">
            {totalMealsDeliveredOrReserved}
          </p>
          <span className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1 font-medium">
            <TrendingUp className="w-3 h-3" />
            From bakeries & hostel messes
          </span>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Food Rescued (Kg)
            </span>
            <Sparkles className="w-4 h-4 text-[#d4af37]" />
          </div>
          <p className="text-2xl font-mono font-extrabold text-white mt-2">
            {totalKgDiverted} kg
          </p>
          <span className="text-[11px] text-[#d4af37] flex items-center gap-1 mt-1 font-medium">
            Across Tamil Nadu corridors
          </span>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              CO₂ Avoided
            </span>
            <Trees className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-mono font-extrabold text-white mt-2">
            {totalCo2Saved} kg CO₂
          </p>
          <span className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1 font-medium">
            Zero extra delivery vans deployed
          </span>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              NGO Fuel Allowance
            </span>
            <Fuel className="w-4 h-4 text-[#d4af37]" />
          </div>
          <p className="text-2xl font-mono font-extrabold text-white mt-2">
            ₹{totalFuelReimbursed}
          </p>
          <span className="text-[11px] text-zinc-400 flex items-center gap-1 mt-1 font-medium">
            @ ₹18/km detour micro-fund
          </span>
        </div>
      </div>

      {/* Main Interactive Tamil Nadu Map */}
      <TamilNaduMap
        donations={filteredDonations}
        ngos={filteredNgos}
        trips={filteredTrips}
        selectedCity={selectedCity}
        onCitySelect={setSelectedCity}
      />

      {/* Two Column Grid: Urgent Spoilage Watchlist & Rapid Walkthrough */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Urgent Spoilage Radar */}
        <div className="lg:col-span-6 bg-zinc-950 border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#d4af37] animate-pulse" />
              <h3 className="font-bold text-white text-sm">
                Real-Time Spoilage Sentinel Watchlist
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black border border-[#d4af37]/40 text-[#d4af37]">
              {urgentDonations.length} Urgent Batches
            </span>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed">
            Prioritizing surplus with shortest remaining safe-consumption windows. Automated scheduler cancels stale batches and notifies the appointed NGO Coordinator if limits are exceeded.
          </p>

          <div className="space-y-3">
            {urgentDonations.map((d) => {
              const deadline = new Date(d.safeConsumptionDeadline).getTime();
              const mins = isNaN(deadline) ? 0 : Math.max(0, Math.round((deadline - now) / (1000 * 60)));
              const hours = isNaN(mins) ? '0.0' : (mins / 60).toFixed(1);

              return (
                <div
                  key={d.id}
                  className="bg-black rounded-xl p-3.5 border border-[#d4af37]/40 flex items-center justify-between text-xs"
                >
                  <div>
                    <h4 className="font-semibold text-white">{d.donorName || 'Food Donor'}</h4>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      {Number(d.totalServings ?? (d as any).servings) || 0} servings ({d.items?.[0]?.name || (d as any).foodName || 'Prepared Food'}) · {d.location?.city || (d as any).city || 'Tamil Nadu'}
                    </p>
                    <span className="text-[10px] text-[#d4af37] font-mono mt-1 block">
                      Storage: {d.storageRequirement || 'Hot (> 60°C)'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-rose-400 text-sm block">
                      {hours} hrs left
                    </span>
                    <button
                      onClick={() => onSelectRole('volunteer_tracking')}
                      className="text-[11px] text-[#d4af37] hover:underline mt-1 block cursor-pointer font-medium"
                    >
                      View Coordinator Track →
                    </button>
                  </div>
                </div>
              );
            })}

            {urgentDonations.length === 0 && (
              <p className="text-xs text-zinc-500 italic text-center py-4">
                No immediate spoilage risks. All active food batches safely within freshness margins.
              </p>
            )}
          </div>
        </div>

        {/* Guided Demonstration Flow */}
        <div className="lg:col-span-6 bg-zinc-950 border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#d4af37]" />
              Official NGO Coordinator Redistribution Protocol
            </h3>
            <span className="text-[10px] font-mono text-[#d4af37]">4 Core Steps</span>
          </div>

          <div className="space-y-3 text-xs">
            {/* Step 1 */}
            <div className="p-3 bg-black rounded-xl border border-zinc-800 flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-[#d4af37] text-black font-bold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                1
              </span>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-white">Surplus Food Registration</span>
                  <button
                    onClick={() => onSelectRole('donor')}
                    className="text-[#d4af37] hover:underline text-[11px] font-medium cursor-pointer"
                  >
                    Open Donor Hub →
                  </button>
                </div>
                <p className="text-zinc-400 text-[11px] mt-0.5">
                  Bakery/mess inputs prep time, shelf-life countdown, hygiene checklist, and gets a secret Pickup OTP.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-3 bg-black rounded-xl border border-zinc-800 flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-[#d4af37] text-black font-bold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                2
              </span>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-white">NGO Demand Match & Pre-Dispatch</span>
                  <button
                    onClick={() => onSelectRole('ngo')}
                    className="text-[#d4af37] hover:underline text-[11px] font-medium cursor-pointer"
                  >
                    Open NGO Portal →
                  </button>
                </div>
                <p className="text-zinc-400 text-[11px] mt-0.5">
                  Verified Darpan shelter reviews portions & dietary specs, accepts meals, and generates Delivery OTP.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-3 bg-black rounded-xl border border-zinc-800 flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-[#d4af37] text-black font-bold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                3
              </span>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-white">Appointed NGO Coordinator Logistics Dispatch</span>
                  <button
                    onClick={() => onSelectRole('volunteer_tracking')}
                    className="text-[#d4af37] hover:underline text-[11px] font-medium cursor-pointer"
                  >
                    Open Coordinator Tracking →
                  </button>
                </div>
                <p className="text-zinc-400 text-[11px] mt-0.5">
                  Appointed NGO Coordinator assigned to every pickup and delivery. Verified route corridor with live GPS custody and spoilage window tracking.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="p-3 bg-black rounded-xl border border-zinc-800 flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-[#d4af37] text-black font-bold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                4
              </span>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-white">Dual-OTP Handover & Custody Verification</span>
                  <button
                    onClick={() => onSelectRole('problems_matrix')}
                    className="text-[#d4af37] hover:underline text-[11px] font-medium cursor-pointer"
                  >
                    View 10 Solutions Matrix →
                  </button>
                </div>
                <p className="text-zinc-400 text-[11px] mt-0.5">
                  Donor verifies Pickup OTP with the appointed coordinator; Shelter verifies Delivery OTP upon meal arrival.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

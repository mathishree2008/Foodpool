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
  MapPin
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

  // Filter entities by selected city
  const filteredDonations = selectedCity === 'All' 
    ? donations 
    : donations.filter((d) => d.location.city === selectedCity);

  const filteredNgos = selectedCity === 'All'
    ? ngos
    : ngos.filter((n) => n.location.city === selectedCity);

  const filteredTrips = selectedCity === 'All'
    ? trips
    : trips.filter((t) => t.origin.city === selectedCity || t.destination.city === selectedCity);

  // Compute live impact statistics
  const totalMealsDeliveredOrReserved = donations
    .filter((d) => d.status !== 'EXPIRED_REJECTED')
    .reduce((acc, d) => acc + d.totalServings, 0);

  const totalKgDiverted = donations
    .filter((d) => d.status !== 'EXPIRED_REJECTED')
    .reduce((acc, d) => acc + d.totalWeightKg, 0);

  const totalFuelReimbursed = trips.reduce((acc, t) => acc + t.fuelReimbursementEarned, 0);
  const totalCo2Saved = Math.round(totalKgDiverted * 2.3);

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
      {/* Top Impact Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Meals Redistributed
            </span>
            <Utensils className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-mono font-extrabold text-slate-100 mt-2">
            {totalMealsDeliveredOrReserved}
          </p>
          <span className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1 font-medium">
            <TrendingUp className="w-3 h-3" />
            From bakeries & hostel messes
          </span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Food Rescued (Kg)
            </span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-mono font-extrabold text-slate-100 mt-2">
            {totalKgDiverted} kg
          </p>
          <span className="text-[11px] text-amber-400 flex items-center gap-1 mt-1 font-medium">
            Across Tamil Nadu corridors
          </span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              CO₂ Avoided
            </span>
            <Trees className="w-4 h-4 text-teal-400" />
          </div>
          <p className="text-2xl font-mono font-extrabold text-slate-100 mt-2">
            {totalCo2Saved} kg CO₂
          </p>
          <span className="text-[11px] text-teal-400 flex items-center gap-1 mt-1 font-medium">
            Zero extra delivery vans deployed
          </span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              CSR Fuel Reimbursement
            </span>
            <Fuel className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-mono font-extrabold text-slate-100 mt-2">
            ₹{totalFuelReimbursed}
          </p>
          <span className="text-[11px] text-blue-400 flex items-center gap-1 mt-1 font-medium">
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
        {/* Urgent Spoilage Radar (Problem 1) */}
        <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 backdrop-blur-md">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
              <h3 className="font-bold text-slate-100 text-sm">
                Real-Time Spoilage Sentinel Watchlist (Problem 1)
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 border border-amber-800 text-amber-300">
              {urgentDonations.length} Urgent Batches
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Prioritizing surplus with shortest remaining safe-consumption windows. Automated matching routes
            closest commuters to prevent spoilage.
          </p>

          <div className="space-y-3">
            {urgentDonations.map((d) => {
              const deadline = new Date(d.safeConsumptionDeadline).getTime();
              const mins = Math.max(0, Math.round((deadline - now) / (1000 * 60)));
              const hours = (mins / 60).toFixed(1);

              return (
                <div
                  key={d.id}
                  className="bg-slate-950/80 rounded-xl p-3.5 border border-amber-500/30 flex items-center justify-between text-xs"
                >
                  <div>
                    <h4 className="font-semibold text-slate-200">{d.donorName}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {d.totalServings} servings ({d.items[0]?.name}) · {d.location.city}
                    </p>
                    <span className="text-[10px] text-amber-400 font-mono mt-1 block">
                      Storage: {d.storageRequirement}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-amber-400 text-sm block">
                      {hours} hrs left
                    </span>
                    <button
                      onClick={() => onSelectRole('transporter')}
                      className="text-[11px] text-emerald-400 hover:underline mt-1 block cursor-pointer"
                    >
                      Route Commuter →
                    </button>
                  </div>
                </div>
              );
            })}

            {urgentDonations.length === 0 && (
              <p className="text-xs text-slate-500 italic text-center py-4">
                No immediate spoilage risks. All active food batches safely within freshness margins.
              </p>
            )}
          </div>
        </div>

        {/* Guided Demonstration Flow */}
        <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 backdrop-blur-md">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Complete System Redistribution Workflow
            </h3>
            <span className="text-[10px] font-mono text-emerald-400">4 Core Steps</span>
          </div>

          <div className="space-y-3 text-xs">
            {/* Step 1 */}
            <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                1
              </span>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-200">Surplus Food Registration</span>
                  <button
                    onClick={() => onSelectRole('donor')}
                    className="text-amber-400 hover:underline text-[11px] font-medium"
                  >
                    Open Donor Hub →
                  </button>
                </div>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Bakery/mess inputs prep time, shelf-life countdown, hygiene checklist, and gets a secret Pickup OTP.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-teal-500 text-slate-950 font-bold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                2
              </span>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-200">NGO Demand Match & Pre-Dispatch</span>
                  <button
                    onClick={() => onSelectRole('ngo')}
                    className="text-teal-400 hover:underline text-[11px] font-medium"
                  >
                    Open NGO Portal →
                  </button>
                </div>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Verified Darpan shelter reviews portions & dietary specs, accepts meals, and generates Delivery OTP.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-blue-500 text-white font-bold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                3
              </span>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-200">Commuter Route Detour Optimization</span>
                  <button
                    onClick={() => onSelectRole('transporter')}
                    className="text-blue-400 hover:underline text-[11px] font-medium"
                  >
                    Open Transporter Pool →
                  </button>
                </div>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Algorithm calculates minimal detour along planned commute (+2.3km) with ₹18/km fuel reimbursement.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 font-bold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                4
              </span>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-200">Dual-OTP Handover & Tracking Kill</span>
                  <button
                    onClick={() => onSelectRole('problems_matrix')}
                    className="text-emerald-400 hover:underline text-[11px] font-medium"
                  >
                    View 10 Solutions Matrix →
                  </button>
                </div>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Donor verifies Pickup OTP; NGO verifies Delivery OTP. GPS stops immediately upon successful handover.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

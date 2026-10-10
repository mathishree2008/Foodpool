import React, { useState } from 'react';
import { RecipientNGO, FoodDonation, TransporterTrip } from '../types';
import { reserveDonationByNgo } from '../services/store';
import { api } from '../services/api';
import { 
  HeartHandshake, 
  ShieldCheck, 
  Clock, 
  CheckCircle, 
  Key, 
  Users, 
  AlertCircle, 
  Truck,
  Sparkles,
  MapPin,
  Utensils
} from 'lucide-react';

interface NgoPortalProps {
  ngos: RecipientNGO[];
  donations: FoodDonation[];
  trips: TransporterTrip[];
  onOpenPrivacyModal: () => void;
}

export const NgoPortal: React.FC<NgoPortalProps> = ({
  ngos,
  donations,
  trips,
  onOpenPrivacyModal
}) => {
  const [selectedNgoId, setSelectedNgoId] = useState<string>(ngos[0]?.id || '');
  const activeNgo = ngos.find((n) => n.id === selectedNgoId) || ngos[0];

  // Donations matching this NGO's city and dietary requirements
  const candidateDonations = donations.filter((d) => {
    if (d.location.city !== activeNgo.location.city) return false;
    if (activeNgo.dietaryPreference === 'Pure Veg Only' && d.items[0]?.dietary !== 'Pure Veg') return false;
    return true;
  });

  // Check if this NGO has any active incoming or reserved donation
  const activeReservedDonations = donations.filter(
    (d) => d.reservedNgoId === activeNgo.id && d.status !== 'DELIVERED' && d.status !== 'EXPIRED_REJECTED'
  );

  const completedDeliveries = donations.filter(
    (d) => d.reservedNgoId === activeNgo.id && d.status === 'DELIVERED'
  );

  return (
    <div className="space-y-6">
      {/* NGO Hub Banner */}
      <div className="bg-gradient-to-r from-teal-950/40 via-slate-900 to-slate-900 border border-teal-900/40 rounded-2xl p-5 md:p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <HeartHandshake className="w-5 h-5 text-teal-400" />
            <h2 className="text-lg font-bold text-slate-100">Recipient NGO & Shelter Food Terminal</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Registered shelter homes and community kitchens in Tamil Nadu sync demand directly with donors.
            Mandatory pre-dispatch acceptance ensures zero quantity mismatch, while secure OTPs verify every meal.
          </p>
        </div>

        {/* Shelter Switcher */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400">Active Shelter:</label>
          <select
            value={selectedNgoId}
            onChange={(e) => setSelectedNgoId(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
          >
            {ngos.map((ngo) => (
              <option key={ngo.id} value={ngo.id}>
                {ngo.name} ({ngo.location.city})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Shelter Profile & Demand Summary */}
      {activeNgo && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-4 gap-4 backdrop-blur-md">
          <div className="md:col-span-2 space-y-1">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              {activeNgo.name}
              <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                Darpan Verified
              </span>
            </h3>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              {activeNgo.location.name}, {activeNgo.location.city}
            </p>
            <p className="text-[11px] text-slate-500 font-mono">
              Darpan Reg: {activeNgo.darpanId} · Coordinator: {activeNgo.contactPerson} ({activeNgo.phone})
            </p>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Shelter Beneficiaries</span>
            <div className="flex items-center justify-between">
              <span className="font-mono text-base font-bold text-slate-200">{activeNgo.beneficiaryCount} Residents</span>
              <Users className="w-4 h-4 text-teal-400" />
            </div>
            <p className="text-[10px] text-amber-400 font-medium">
              Urgent evening demand: ~{activeNgo.urgentMealDemand} meals
            </p>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Diet & Handling</span>
            <span className="text-xs font-semibold text-slate-200 block">{activeNgo.dietaryPreference}</span>
            <p className="text-[10px] text-slate-400 truncate">
              {activeNgo.facilities.join(' · ')}
            </p>
          </div>
        </div>
      )}

      {/* Active Inbound Transits & Delivery OTP Card (Problem 4 & 5) */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Truck className="w-4 h-4 text-teal-400" />
          Active Inbound Deliveries & Handover OTP Terminal (Problem 4)
        </h3>

        {activeReservedDonations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeReservedDonations.map((don) => {
              const assignedTrip = trips.find((t) => t.id === don.assignedTransporterId);

              return (
                <div
                  key={don.id}
                  className="bg-slate-900/90 border border-teal-500/40 rounded-2xl p-5 space-y-4 shadow-xl backdrop-blur-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-slate-100 text-sm">{don.donorName}</h4>
                      <p className="text-xs text-teal-400 mt-0.5">
                        {don.totalServings} Servings ({don.totalWeightKg} kg) · {don.items[0]?.name}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono font-semibold px-2.5 py-1 rounded-lg bg-teal-950 border border-teal-800 text-teal-300">
                      {don.status}
                    </span>
                  </div>

                  {/* Transporter Details & Live ETA */}
                  {assignedTrip ? (
                    <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Assigned Pooled Transporter:</span>
                        <span className="font-medium text-slate-200">{assignedTrip.transporterName}</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400">Vehicle / Contact:</span>
                        <span className="font-mono text-slate-300">
                          {assignedTrip.vehicleNumber} ({assignedTrip.phone})
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-800">
                        <span className="text-slate-400">Live Delivery Status:</span>
                        <span className="text-emerald-400 font-medium">
                          {assignedTrip.status === 'PICKED_UP'
                            ? 'Food in Transit towards Shelter'
                            : 'Heading to Donor for Pickup'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-950/60 p-3 rounded-xl text-xs text-amber-400 border border-amber-900/40">
                      Meals reserved! Matching compatible commuter along route corridor...
                    </div>
                  )}

                  {/* 6-Digit Delivery OTP Display for Handover Verification (Problem 4) */}
                  <div className="p-3 bg-gradient-to-r from-teal-950/60 to-slate-950 rounded-xl border border-teal-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-teal-400 uppercase tracking-wider block font-semibold">
                        Your Shelter Handover Delivery OTP:
                      </span>
                      <span className="font-mono text-xl font-extrabold text-teal-300 tracking-widest">
                        {don.deliveryOtp}
                      </span>
                    </div>
                    <div className="text-right max-w-[190px]">
                      <p className="text-[10px] text-slate-400 leading-snug">
                        Inspect food quality upon arrival, then share this 6-digit code with the transporter to complete handover.
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-xs text-slate-400 text-center">
            No pending incoming deliveries currently in transit for {activeNgo.name}.
          </div>
        )}
      </div>

      {/* Available Surplus in This City Requiring NGO Pre-Dispatch Acceptance (Problem 5) */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Utensils className="w-4 h-4 text-amber-400" />
            Nearby Available Surplus Requiring Pre-Dispatch Acceptance (Problem 5)
          </h3>
          <span className="text-xs text-slate-400">
            {candidateDonations.filter((d) => d.status === 'AVAILABLE').length} Available in {activeNgo.location.city}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {candidateDonations
            .filter((d) => d.status === 'AVAILABLE')
            .map((don) => (
              <div
                key={don.id}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-slate-200 text-xs">{don.donorName}</h4>
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-950 px-1.5 py-0.5 rounded border border-amber-800">
                      {don.donorType}
                    </span>
                  </div>

                  <p className="text-xs text-emerald-400 font-medium mt-1">
                    {don.totalServings} Servings ({don.totalWeightKg} kg)
                  </p>

                  <div className="text-[11px] text-slate-400 mt-2 space-y-1">
                    <p className="truncate">Items: {don.items.map((i) => i.name).join(', ')}</p>
                    <p>Storage: {don.storageRequirement}</p>
                    <p>Packaging: {don.packagingType}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    {don.location.privacyZone.split('(')[0]}
                  </span>
                  <button
                    onClick={() => {
                      reserveDonationByNgo(don.id, activeNgo.id);
                      api.ngos.acceptDonation(don.id, activeNgo.id).catch((e) => console.warn(e));
                    }}
                    className="px-3 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-teal-500/10"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Accept & Reserve Meals
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

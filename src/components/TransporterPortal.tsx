import React, { useState } from 'react';
import { 
  FoodDonation, 
  RecipientNGO, 
  TransporterTrip, 
  VehicleType, 
  TransporterType,
  RouteMatchRecommendation
} from '../types';
import { TAMIL_NADU_LOCATIONS } from '../data/tamilNaduLocations';
import { 
  findBestMatchesForTrip 
} from '../services/routeMatching';
import { 
  addTrip, 
  assignTripMatch, 
  confirmTransporterTrip, 
  triggerBackupTransporter, 
  simulateTrafficDelay,
  verifyPickupOtp,
  verifyDeliveryOtp
} from '../services/store';
import { api } from '../services/api';
import { 
  Car, 
  Bike, 
  Navigation, 
  PlusCircle, 
  ShieldCheck, 
  Clock, 
  Coins, 
  Fuel, 
  CheckCircle, 
  AlertTriangle, 
  Key, 
  ArrowRight,
  Sparkles,
  Users
} from 'lucide-react';

interface TransporterPortalProps {
  trips: TransporterTrip[];
  donations: FoodDonation[];
  ngos: RecipientNGO[];
  onOpenPrivacyModal: () => void;
}

export const TransporterPortal: React.FC<TransporterPortalProps> = ({
  trips,
  donations,
  ngos,
  onOpenPrivacyModal
}) => {
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState<string>(trips[0]?.id || '');
  
  // New Trip form state
  const [name, setName] = useState('Anitha Sridhar');
  const [transporterType, setTransporterType] = useState<TransporterType>('Daily Commuter');
  const [vehicleType, setVehicleType] = useState<VehicleType>('Four Wheeler (Sedan / Hatchback)');
  const [vehicleNumber, setVehicleNumber] = useState('TN 09 BX 2931');
  const [licenseNumber, setLicenseNumber] = useState('TN-09-2021-0081942');
  const [originId, setOriginId] = useState(TAMIL_NADU_LOCATIONS[0].id);
  const [destinationId, setDestinationId] = useState(TAMIL_NADU_LOCATIONS[1].id);
  const [capacityKg, setCapacityKg] = useState(25);
  const [capacityServings, setCapacityServings] = useState(70);
  const [maxDetourKm, setMaxDetourKm] = useState(4.5);
  const [maxDetourMinutes, setMaxDetourMinutes] = useState(20);

  // OTP inputs
  const [pickupOtpInput, setPickupOtpInput] = useState('');
  const [deliveryOtpInput, setDeliveryOtpInput] = useState('');
  const [otpFeedback, setOtpFeedback] = useState<{ success?: boolean; message?: string } | null>(null);

  const activeTrip = trips.find((t) => t.id === selectedTripId) || trips[0];
  const assignedDonation = activeTrip?.assignedDonationId
    ? donations.find((d) => d.id === activeTrip.assignedDonationId)
    : undefined;
  const assignedNgo = activeTrip?.assignedNgoId
    ? ngos.find((n) => n.id === activeTrip.assignedNgoId)
    : undefined;

  // Compute smart route matches for the currently inspected trip
  const smartMatches: RouteMatchRecommendation[] = activeTrip
    ? findBestMatchesForTrip(activeTrip, donations, ngos)
    : [];

  const handleRegisterTrip = (e: React.FormEvent) => {
    e.preventDefault();
    const origin = TAMIL_NADU_LOCATIONS.find((l) => l.id === originId) || TAMIL_NADU_LOCATIONS[0];
    const destination = TAMIL_NADU_LOCATIONS.find((l) => l.id === destinationId) || TAMIL_NADU_LOCATIONS[1];

    const newTrip: TransporterTrip = {
      id: `trip-${Date.now().toString().slice(-4)}`,
      transporterName: name,
      transporterType,
      phone: '+91 98840 ' + Math.floor(10000 + Math.random() * 90000),
      licenseNumber,
      isLicenseVerified: true,
      vehicleType,
      vehicleNumber,
      origin,
      destination,
      departureTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      availableCapacityKg: capacityKg,
      availableCapacityServings: capacityServings,
      maxDetourKm,
      maxDetourMinutes,
      status: 'PLANNED',
      detourDistanceKm: 0,
      detourTimeMinutes: 0,
      fuelReimbursementEarned: 0,
      greenCreditsEarned: 0,
      trafficDelayMinutes: 0,
      isBackupDispatched: false,
      locationPrivacyActive: true,
      tripConfirmationConfirmed: true,
      transitStepProgress: 0
    };

    addTrip(newTrip);

    // Sync with backend API
    api.trips
      .create({
        originCity: origin.city,
        originName: origin.name,
        originLat: origin.lat,
        originLng: origin.lng,
        destinationCity: destination.city,
        destinationName: destination.name,
        destinationLat: destination.lat,
        destinationLng: destination.lng,
        vehicleType,
        vehicleNumber,
        capacityKg,
        capacityServings,
        maxDetourKm,
        maxDetourMinutes
      })
      .catch((err) => console.warn('Backend API trip sync:', err));

    setSelectedTripId(newTrip.id);
    setIsRegisterOpen(false);
  };

  const handleVerifyPickup = () => {
    if (!activeTrip) return;
    const res = verifyPickupOtp(activeTrip.id, pickupOtpInput);
    setOtpFeedback(res);
    if (res.success) {
      api.trips.verifyPickup(activeTrip.id, pickupOtpInput).catch((e) => console.warn(e));
      setPickupOtpInput('');
    }
  };

  const handleVerifyDelivery = () => {
    if (!activeTrip) return;
    const res = verifyDeliveryOtp(activeTrip.id, deliveryOtpInput);
    setOtpFeedback(res);
    if (res.success) {
      api.trips.verifyDelivery(activeTrip.id, deliveryOtpInput).catch((e) => console.warn(e));
      setDeliveryOtpInput('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Transporter Header & Journey Action */}
      <div className="bg-gradient-to-r from-blue-950/40 via-slate-900 to-slate-900 border border-blue-900/40 rounded-2xl p-5 md:p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Car className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-slate-100">Transporter & Commuter Route Pooling</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Turn your daily Tamil Nadu travel into food rescue missions. Deliver surplus food within your planned
            route corridor with minimal detours, full fuel reimbursements, and automated backup support.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsRegisterOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-blue-500/10 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            Register Planned Journey
          </button>
        </div>
      </div>

      {/* Active Trip Telemetry Control & Match Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Active Commute Dashboard */}
        <div className="lg:col-span-7 space-y-5">
          {/* Journey Selector Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            {trips.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setSelectedTripId(t.id);
                  setOtpFeedback(null);
                }}
                className={`px-3 py-2 rounded-xl whitespace-nowrap transition-all flex items-center gap-2 font-medium cursor-pointer ${
                  selectedTripId === t.id
                    ? 'bg-blue-600/30 border border-blue-500/60 text-blue-200'
                    : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{t.transporterName}</span>
                <span className="text-[10px] bg-slate-950 px-1.5 py-0.5 rounded text-slate-400 font-mono">
                  {t.origin.city}
                </span>
              </button>
            ))}
          </div>

          {activeTrip && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 backdrop-blur-md">
              {/* Driver & Vehicle Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="font-semibold text-slate-100 text-sm flex items-center gap-2">
                    {activeTrip.transporterName}
                    <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      DL Verified
                    </span>
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                    <span className="text-blue-300 font-medium">{activeTrip.transporterType}</span>
                    <span>·</span>
                    <span>{activeTrip.vehicleNumber}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[11px] font-mono font-semibold px-2.5 py-1 rounded-lg ${
                      activeTrip.status === 'COMPLETED'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : activeTrip.status === 'PICKED_UP'
                        ? 'bg-blue-950 text-blue-300 border border-blue-800'
                        : activeTrip.status === 'MATCHED'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {activeTrip.status}
                  </span>
                </div>
              </div>

              {/* Commute Route Path */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">From Origin:</span>
                  <span className="font-medium text-slate-200">{activeTrip.origin.name}</span>
                  <p className="text-[10px] text-slate-400 mt-0.5">{activeTrip.origin.city}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">To Destination:</span>
                  <span className="font-medium text-slate-200">{activeTrip.destination.name}</span>
                  <p className="text-[10px] text-slate-400 mt-0.5">{activeTrip.destination.city}</p>
                </div>
              </div>

              {/* Detour Constraints & Fuel Earnings (Problems 2 & 8) */}
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Detour Added</span>
                  <span className="font-mono text-emerald-400 font-bold text-sm">
                    +{activeTrip.detourDistanceKm} km
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    (Max {activeTrip.maxDetourKm} km)
                  </span>
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Fuel Reimbursement</span>
                  <span className="font-mono text-amber-400 font-bold text-sm">
                    ₹{activeTrip.fuelReimbursementEarned}
                  </span>
                  <span className="text-[10px] text-slate-500 block">@ ₹18/km detour</span>
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Trunk Capacity</span>
                  <span className="font-mono text-blue-300 font-bold text-sm">
                    {activeTrip.availableCapacityKg} kg
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {activeTrip.availableCapacityServings} meals
                  </span>
                </div>
              </div>

              {/* Fail-Safe Dispatch Actions (Problems 3 & 6) */}
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    Trip Resilience & Transit Delay Controls (Problems 3 & 6)
                  </span>
                  {activeTrip.trafficDelayMinutes > 0 && (
                    <span className="text-[10px] font-mono text-rose-400 bg-rose-950/60 border border-rose-800 px-2 py-0.5 rounded">
                      +{activeTrip.trafficDelayMinutes}m Traffic Delay
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => confirmTransporterTrip(activeTrip.id)}
                    disabled={activeTrip.tripConfirmationConfirmed}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200 disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    {activeTrip.tripConfirmationConfirmed ? 'Trip Confirmed' : 'Confirm Travel Availability'}
                  </button>

                  <button
                    onClick={() => simulateTrafficDelay(activeTrip.id, 15)}
                    className="px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/80 text-[11px] text-rose-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    Simulate +15m Traffic Snarl
                  </button>

                  <button
                    onClick={() => triggerBackupTransporter(activeTrip.id)}
                    className="px-3 py-1.5 rounded-lg bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/80 text-[11px] text-amber-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5" />
                    Dispatch Backup Emergency Transporter
                  </button>
                </div>

                {activeTrip.isBackupDispatched && (
                  <p className="text-[11px] text-emerald-400 font-medium">
                    ✓ Emergency backup volunteer partner dispatched to prevent handover delay.
                  </p>
                )}
              </div>

              {/* 2-Stage OTP Handover Verification Terminal (Problems 4 & 10) */}
              {activeTrip.assignedDonationId && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-amber-400" />
                      Two-Stage Cryptographic Handover Terminal (Problem 4)
                    </span>
                    <button
                      onClick={onOpenPrivacyModal}
                      className="text-[11px] text-emerald-400 hover:underline"
                    >
                      Privacy & Ephemeral Retention
                    </button>
                  </div>

                  {/* Stage 1: Pickup OTP from Donor */}
                  <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-300 font-medium">1. Donor Pickup Handover</span>
                      <span className="text-[11px] font-mono text-amber-400">
                        {activeTrip.status === 'PICKED_UP' || activeTrip.status === 'COMPLETED'
                          ? '✓ CUSTODY ACQUIRED'
                          : 'PENDING OTP'}
                      </span>
                    </div>
                    {activeTrip.status !== 'PICKED_UP' && activeTrip.status !== 'COMPLETED' ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="Enter 6-digit Donor OTP (e.g. 482910)"
                          value={pickupOtpInput}
                          onChange={(e) => setPickupOtpInput(e.target.value)}
                          className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono tracking-widest flex-1 focus:outline-none focus:border-amber-500"
                        />
                        <button
                          onClick={handleVerifyPickup}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs cursor-pointer"
                        >
                          Verify Pickup
                        </button>
                      </div>
                    ) : (
                      <p className="text-[11px] text-emerald-400">
                        Pickup verified from {assignedDonation?.donorName}. Food in transit.
                      </p>
                    )}
                  </div>

                  {/* Stage 2: Delivery OTP from NGO */}
                  <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-300 font-medium">2. Recipient NGO Delivery Handover</span>
                      <span className="text-[11px] font-mono text-cyan-400">
                        {activeTrip.status === 'COMPLETED' ? '✓ DELIVERED & AUDITED' : 'PENDING NGO OTP'}
                      </span>
                    </div>
                    {activeTrip.status === 'PICKED_UP' && (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="Enter 6-digit NGO OTP (e.g. 716394)"
                          value={deliveryOtpInput}
                          onChange={(e) => setDeliveryOtpInput(e.target.value)}
                          className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono tracking-widest flex-1 focus:outline-none focus:border-cyan-500"
                        />
                        <button
                          onClick={handleVerifyDelivery}
                          className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-xs cursor-pointer"
                        >
                          Complete Delivery
                        </button>
                      </div>
                    )}
                    {activeTrip.status === 'COMPLETED' && (
                      <p className="text-[11px] text-emerald-400">
                        ✓ Meals successfully delivered to {assignedNgo?.name}. Live GPS tracking stopped.
                      </p>
                    )}
                  </div>

                  {/* Feedback feedback */}
                  {otpFeedback && (
                    <div
                      className={`p-2.5 rounded-lg text-xs font-medium ${
                        otpFeedback.success
                          ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                          : 'bg-rose-950/60 text-rose-300 border border-rose-800'
                      }`}
                    >
                      {otpFeedback.message}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Algorithmic Route Match Engine Recommendations (Problem 2) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-100 text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Compatible Route Match Engine
              </h3>
              <span className="text-[11px] font-mono text-slate-400">
                {smartMatches.length} Matches Found
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Our spatial algorithm calculates pickup & dropoff waypoints along your travel corridor,
              minimizing detour distance and ensuring food arrives before safe-consumption deadlines.
            </p>

            <div className="space-y-3 pt-2">
              {smartMatches.map((match) => {
                const don = donations.find((d) => d.id === match.donationId);
                const ngo = ngos.find((n) => n.id === match.ngoId);
                if (!don || !ngo) return null;

                const isAlreadyMatched = activeTrip?.assignedDonationId === don.id;

                return (
                  <div
                    key={`${match.tripId}-${match.donationId}`}
                    className={`p-4 rounded-xl border transition-all text-xs space-y-2.5 ${
                      isAlreadyMatched
                        ? 'bg-emerald-950/20 border-emerald-500/50 shadow-md'
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-semibold text-slate-200">{don.donorName}</h4>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <span>Dropoff: {ngo.name}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/80">
                          {match.score}% MATCH
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-900 p-2 rounded-lg">
                      <div>
                        <span className="text-slate-400">Detour Added:</span>
                        <span className="text-amber-300 font-mono font-semibold ml-1">
                          +{match.detourKm} km ({match.detourMinutes} min)
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">Fuel Grant:</span>
                        <span className="text-emerald-300 font-mono font-semibold ml-1">
                          ₹{match.fuelReimbursement}
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed italic">
                      "{match.reason}"
                    </p>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-slate-400">
                        {don.totalServings} Meals ({don.totalWeightKg} kg)
                      </span>
                      <button
                        onClick={() => assignTripMatch(activeTrip.id, don.id, ngo.id)}
                        disabled={isAlreadyMatched}
                        className={`px-3 py-1.5 rounded-lg font-medium text-xs flex items-center gap-1.5 cursor-pointer transition-all ${
                          isAlreadyMatched
                            ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700'
                            : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold'
                        }`}
                      >
                        {isAlreadyMatched ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5" />
                            Active Pooled Route
                          </>
                        ) : (
                          <>
                            Accept Route & Pool
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}

              {smartMatches.length === 0 && (
                <div className="p-4 bg-slate-950/60 rounded-xl text-center text-xs text-slate-400 border border-slate-800">
                  No active surplus matches exceed this journey's detour parameters.
                  Register a journey along Chennai, Coimbatore, or Madurai corridors to pool!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Register Journey Modal */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl my-8">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Car className="w-4 h-4 text-blue-400" />
                Register Planned Travel Route (Tamil Nadu)
              </h3>
              <button
                onClick={() => setIsRegisterOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterTrip} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Traveller / Driver Name:</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Commuter Type:</label>
                  <select
                    value={transporterType}
                    onChange={(e) => setTransporterType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                  >
                    <option value="Daily Commuter">Daily Office Commuter</option>
                    <option value="College Student / NSS Volunteer">College Student / NSS Volunteer</option>
                    <option value="Corporate Carpooler">Corporate Carpooler</option>
                    <option value="Partner Delivery Partner (Dunzo/Porter Volunteer)">
                      Partner Delivery Volunteer
                    </option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Vehicle Type:</label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                  >
                    <option value="Four Wheeler (Sedan / Hatchback)">Car (Sedan / Hatchback)</option>
                    <option value="Two Wheeler (Motorcycle / Scooter)">Two Wheeler (Bike / Scooter)</option>
                    <option value="Electric Vehicle (Ather / Ola)">Electric Scooter / EV</option>
                    <option value="Commercial Mini Van (Tata Ace / Auto)">Auto / Mini Cargo</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Vehicle Registration No:</label>
                  <input
                    type="text"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono"
                  />
                </div>
              </div>

              {/* Origin and Destination in Tamil Nadu */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Origin Hub:</label>
                  <select
                    value={originId}
                    onChange={(e) => setOriginId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                  >
                    {TAMIL_NADU_LOCATIONS.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.city} — {loc.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Destination Hub:</label>
                  <select
                    value={destinationId}
                    onChange={(e) => setDestinationId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                  >
                    {TAMIL_NADU_LOCATIONS.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.city} — {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Detour Limits and Capacity */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Max Detour (Km):</label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="15"
                    value={maxDetourKm}
                    onChange={(e) => setMaxDetourKm(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Max Detour (Mins):</label>
                  <input
                    type="number"
                    min="5"
                    max="60"
                    value={maxDetourMinutes}
                    onChange={(e) => setMaxDetourMinutes(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Spare Trunk (Kg):</label>
                  <input
                    type="number"
                    min="5"
                    max="100"
                    value={capacityKg}
                    onChange={(e) => setCapacityKg(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold cursor-pointer"
                >
                  Find Route Pool Matches
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

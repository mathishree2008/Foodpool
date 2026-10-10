import React, { useState } from 'react';
import { 
  QrCode, 
  Sparkles, 
  Clock, 
  MapPin, 
  Phone, 
  Utensils, 
  CheckCircle2, 
  Key, 
  AlertTriangle,
  ArrowRight,
  Flame,
  ShieldCheck,
  Building,
  RotateCcw
} from 'lucide-react';
import { TAMIL_NADU_LOCATIONS } from '../data/tamilNaduLocations';
import { FoodDonation, DietaryType, StorageRequirement } from '../types';
import { addDonation } from '../services/store';
import { api } from '../services/api';

interface ExpressZeroLoginPostProps {
  onSuccess?: (donation: FoodDonation) => void;
  onViewClusters?: () => void;
}

export const ExpressZeroLoginPost: React.FC<ExpressZeroLoginPostProps> = ({
  onSuccess,
  onViewClusters
}) => {
  // Quick 4-field state
  const [establishmentCategory, setEstablishmentCategory] = useState<'Bakery' | 'Hostel Mess' | 'Restaurant'>('Bakery');
  const [establishmentName, setEstablishmentName] = useState('Iyengar Bakery & Sweets');
  const [foodItemPreset, setFoodItemPreset] = useState('Fresh Sandwich Bread & Veg Puffs');
  const [servings, setServings] = useState(8); // Small micro-quantity
  const [weightKg, setWeightKg] = useState(3.5);
  const [safeHoursRemaining, setSafeHoursRemaining] = useState(3.5); // Safe window before spoiling
  const [phone, setPhone] = useState('+91 98401 55219');
  const [selectedLocationId, setSelectedLocationId] = useState(TAMIL_NADU_LOCATIONS[0].id);

  const [submittedPass, setSubmittedPass] = useState<{
    donationId: string;
    pickupOtp: string;
    foodName: string;
    servings: number;
    spoilTimeStr: string;
    establishmentName: string;
  } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick preset food selections
  const handleSelectPreset = (category: 'Bakery' | 'Hostel Mess' | 'Restaurant', presetName: string, defaultServings: number, defaultKg: number, defaultHours: number) => {
    setEstablishmentCategory(category);
    setFoodItemPreset(presetName);
    setServings(defaultServings);
    setWeightKg(defaultKg);
    setSafeHoursRemaining(defaultHours);
    if (category === 'Bakery') setEstablishmentName('Iyengar Bakery & Sweets');
    else if (category === 'Hostel Mess') setEstablishmentName('Anna Univ CEG Hostel Mess 4');
    else setEstablishmentName('Amma Unavagam / Small Tiffin Center');
  };

  const handleSubmitExpress = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const location = TAMIL_NADU_LOCATIONS.find((l) => l.id === selectedLocationId) || TAMIL_NADU_LOCATIONS[0];
    const prepTime = new Date();
    const spoilTime = new Date(Date.now() + safeHoursRemaining * 3600 * 1000);
    const pickupOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const deliveryOtp = Math.floor(100000 + Math.random() * 900000).toString();

    const newDonation: FoodDonation = {
      id: `micro-${Date.now().toString().slice(-5)}`,
      donorId: `donor-express-${Date.now().toString().slice(-4)}`,
      donorName: establishmentName,
      donorType: establishmentCategory,
      fssaiNumber: 'TN-FSSAI-EXPRESS-VERIFIED',
      isFssaiVerified: true,
      contactPerson: 'Counter Supervisor',
      phone,
      location,
      items: [
        {
          name: foodItemPreset,
          quantityKg: weightKg,
          servings,
          category: establishmentCategory === 'Bakery' ? 'Bakery & Bread (Breads/Pastries)' : 'Cooked Meals (Rice/Sambar/Curry)',
          dietary: 'Pure Veg'
        }
      ],
      totalServings: servings,
      totalWeightKg: weightKg,
      preparationTime: prepTime.toISOString(),
      safeConsumptionDeadline: spoilTime.toISOString(),
      storageRequirement: establishmentCategory === 'Bakery' ? 'Ambient (Dry/Cool < 25°C)' : 'Hot (Maintain > 60°C)',
      packagingType: 'Sealed Stainless Steel Casseroles',
      status: 'AVAILABLE',
      pickupOtp,
      deliveryOtp,
      safetyChecklist: {
        temperatureChecked: true,
        cleanContainersSealed: true,
        hygienicHandlingVerified: true,
        odourTextureChecked: true
      },
      privacyConsent: true,
      createdAt: new Date().toISOString()
    };

    // Add to local store
    addDonation(newDonation);

    // Sync with backend API
    api.donations
      .create({
        foodName: foodItemPreset,
        category: 'Cooked Meals (Rice/Sambar/Curry)',
        servings,
        weightKg,
        dietary: 'Pure Veg',
        safeConsumptionHours: safeHoursRemaining,
        storageRequirement: establishmentCategory === 'Bakery' ? 'Ambient (Dry/Cool < 25°C)' : 'Hot (Maintain > 60°C)',
        packagingType: 'Sealed Containers',
        locationName: location.name,
        address: location.fullAddress,
        lat: location.lat,
        lng: location.lng,
        city: location.city
      })
      .catch((err) => console.warn('API express sync:', err));

    setSubmittedPass({
      donationId: newDonation.id,
      pickupOtp,
      foodName: foodItemPreset,
      servings,
      spoilTimeStr: spoilTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      establishmentName
    });

    setIsSubmitting(false);
    if (onSuccess) onSuccess(newDonation);
  };

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
      {/* Banner: Emulating QR Sticker or SMS tap */}
      <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-900 border border-amber-900/40 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500 text-slate-950 font-bold">
              <QrCode className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-slate-100">
                  QR Scanner & SMS Instant Upload (Zero-Install, No-Login)
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-700 text-emerald-400 font-mono text-[10px] font-bold">
                  &lt; 30 SECONDS
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                For small bakeries, hostel messes & tea stalls. Post small surplus without downloading any app or creating passwords.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onViewClusters}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
        >
          <span>View NGO Cluster Queue</span>
          <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
        </button>
      </div>

      {/* Confirmation Digital Pass (If already posted) */}
      {submittedPass ? (
        <div className="bg-slate-900 border-2 border-emerald-500/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-bold text-slate-100">
              Surplus Uploaded to Local Cluster!
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Your contribution from <b>{submittedPass.establishmentName}</b> is now grouped with nearby bakeries & messes. An NGO coordinator will arrive on their collection circuit.
            </p>
          </div>

          {/* Bold 6-Digit Pickup OTP Card */}
          <div className="max-w-sm mx-auto bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block flex items-center justify-center gap-1">
              <Key className="w-3.5 h-3.5 text-amber-400" /> Handover Pickup OTP:
            </span>
            <span className="font-mono text-3xl font-extrabold text-amber-400 tracking-widest block">
              {submittedPass.pickupOtp}
            </span>
            <p className="text-[11px] text-slate-500">
              Share this 6-digit code with the coordinator when they arrive.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto text-xs">
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-left">
              <span className="text-[10px] text-slate-500 block uppercase">Food Item:</span>
              <span className="font-semibold text-slate-200 block truncate">{submittedPass.foodName}</span>
              <span className="text-emerald-400 font-mono text-[11px] font-bold">{submittedPass.servings} Meals</span>
            </div>
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-left">
              <span className="text-[10px] text-slate-500 block uppercase">Must Reach Before:</span>
              <span className="font-bold text-rose-400 font-mono text-sm">{submittedPass.spoilTimeStr}</span>
              <span className="text-[10px] text-slate-400">Safe consumption window</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setSubmittedPass(null)}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Upload Another Surplus Batch
            </button>
            <button
              onClick={onViewClusters}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold cursor-pointer shadow-lg shadow-emerald-500/10"
            >
              Track Multi-Stop Coordinator Route →
            </button>
          </div>
        </div>
      ) : (
        /* The 30-Second Fast Form */
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
          {/* Quick One-Tap Food Presets */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
              1-Tap Quick Category Presets:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <button
                type="button"
                onClick={() => handleSelectPreset('Bakery', 'Fresh Bread Loaves & Puffs', 8, 3.0, 5.0)}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  establishmentCategory === 'Bakery'
                    ? 'bg-amber-950/50 border-amber-500 text-amber-200 shadow-md ring-1 ring-amber-500/40'
                    : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="text-lg block mb-1">🥖</span>
                <span className="font-bold block text-slate-100">Bakery & Pastries</span>
                <span className="text-[10px] text-slate-400 block">Bread, buns, rolls (6-10 meals)</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset('Hostel Mess', 'Cooked Student Dinner Meals', 12, 5.5, 3.0)}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  establishmentCategory === 'Hostel Mess'
                    ? 'bg-cyan-950/50 border-cyan-500 text-cyan-200 shadow-md ring-1 ring-cyan-500/40'
                    : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="text-lg block mb-1">🏢</span>
                <span className="font-bold block text-slate-100">Hostel Mess Surplus</span>
                <span className="text-[10px] text-slate-400 block">Rice, dal, chapatis (10-15 meals)</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset('Restaurant', 'Sambar Rice & Curd Rice Packs', 6, 2.5, 2.5)}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  establishmentCategory === 'Restaurant'
                    ? 'bg-emerald-950/50 border-emerald-500 text-emerald-200 shadow-md ring-1 ring-emerald-500/40'
                    : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="text-lg block mb-1">🍽️</span>
                <span className="font-bold block text-slate-100">Small Restaurant / Hotel</span>
                <span className="text-[10px] text-slate-400 block">Lunch / evening leftovers (5-8 meals)</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmitExpress} className="space-y-4 text-xs">
            {/* Field 1: What Food & Establishment */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Establishment Name:</label>
                <input
                  type="text"
                  required
                  value={establishmentName}
                  onChange={(e) => setEstablishmentName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">What Food is Supplied:</label>
                <input
                  type="text"
                  required
                  value={foodItemPreset}
                  onChange={(e) => setFoodItemPreset(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Field 2: What Quantity & Portions */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Portions (Servings):</label>
                <input
                  type="number"
                  min="2"
                  max="50"
                  value={servings}
                  onChange={(e) => setServings(Number(e.target.value))}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono font-bold text-sm"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Weight (Kg):</label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="30"
                  value={weightKg}
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono font-bold text-sm"
                />
              </div>

              {/* Field 3: Spoil Time / Safe Consumption Window */}
              <div className="sm:col-span-2">
                <label className="text-slate-300 font-medium block mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>When will it spoil? (Safe Window):</span>
                </label>
                <select
                  value={safeHoursRemaining}
                  onChange={(e) => setSafeHoursRemaining(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-semibold"
                >
                  <option value={1.5}>Spoils in 1.5 Hours (High Spoil Risk)</option>
                  <option value={2.5}>Spoils in 2.5 Hours (Standard Cooked Food)</option>
                  <option value={4.0}>Spoils in 4 Hours (Hot Insulated Casseroles)</option>
                  <option value={6.0}>Spoils in 6+ Hours (Dry Breads & Buns)</option>
                </select>
              </div>
            </div>

            {/* Field 4: Location & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 font-medium block mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Location Station:
                </label>
                <select
                  value={selectedLocationId}
                  onChange={(e) => setSelectedLocationId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                >
                  {TAMIL_NADU_LOCATIONS.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.city} — {loc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-blue-400" /> Contributor Mobile (for OTP SMS):
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono"
                />
              </div>
            </div>

            {/* 30-Second Fast Submission Action */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-2xl bg-[#a3e635] hover:bg-[#8ed028] text-slate-950 font-extrabold text-sm transition-all shadow-xl shadow-lime-500/20 cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Upload to Local Micro-Cluster in 15s (No Login)</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

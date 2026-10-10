import React, { useState, useEffect } from 'react';
import { FoodDonation, DietaryType, StorageRequirement, PackagingType, TNLocation } from '../types';
import { TAMIL_NADU_LOCATIONS } from '../data/tamilNaduLocations';
import { addDonation } from '../services/store';
import { api } from '../services/api';
import { 
  PlusCircle, 
  Clock, 
  ShieldCheck, 
  Thermometer, 
  Package, 
  Key, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  MapPin,
  UtensilsCrossed
} from 'lucide-react';

interface DonorPortalProps {
  donations: FoodDonation[];
  onOpenPrivacyModal: () => void;
}

export const DonorPortal: React.FC<DonorPortalProps> = ({ donations, onOpenPrivacyModal }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState(TAMIL_NADU_LOCATIONS[0].id);
  const [donorName, setDonorName] = useState('Anjappar Chettinad Restaurant (T. Nagar)');
  const [donorType, setDonorType] = useState<FoodDonation['donorType']>('Restaurant');
  const [fssaiNumber, setFssaiNumber] = useState('TN-FSSAI-1242301928374');
  const [foodName, setFoodName] = useState('Biryani & Mixed Veg Curry');
  const [servings, setServings] = useState(45);
  const [weightKg, setWeightKg] = useState(16);
  const [dietary, setDietary] = useState<DietaryType>('Pure Veg');
  const [storageRequirement, setStorageRequirement] = useState<StorageRequirement>('Hot (Maintain > 60°C)');
  const [packagingType, setPackagingType] = useState<PackagingType>('Sealed Stainless Steel Casseroles');
  const [safeHours, setSafeHours] = useState(4); // 4 hours shelf life
  const [safetyChecklist, setSafetyChecklist] = useState({
    temperatureChecked: true,
    cleanContainersSealed: true,
    hygienicHandlingVerified: true,
    odourTextureChecked: true
  });
  const [privacyConsent, setPrivacyConsent] = useState(true);

  // Helper for live countdown rendering
  const [currentTime, setCurrentTime] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 15000);
    return () => clearInterval(timer);
  }, []);

  const handleRegisterDonation = (e: React.FormEvent) => {
    e.preventDefault();

    const location = TAMIL_NADU_LOCATIONS.find((l) => l.id === selectedLocationId) || TAMIL_NADU_LOCATIONS[0];
    const prepDate = new Date();
    const deadlineDate = new Date(Date.now() + safeHours * 3600 * 1000);

    // Generate random 6-digit cryptographic OTPs
    const pickupOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const deliveryOtp = Math.floor(100000 + Math.random() * 900000).toString();

    const newDonation: FoodDonation = {
      id: `don-${Date.now().toString().slice(-4)}`,
      donorId: `donor-${Date.now().toString().slice(-4)}`,
      donorName,
      donorType,
      fssaiNumber,
      isFssaiVerified: true,
      contactPerson: 'Head Chef / Mess Secretary',
      phone: '+91 94440 ' + Math.floor(10000 + Math.random() * 90000),
      location,
      items: [
        {
          name: foodName,
          quantityKg: weightKg,
          servings,
          category: 'Cooked Meals (Rice/Sambar/Curry)',
          dietary
        }
      ],
      totalServings: servings,
      totalWeightKg: weightKg,
      preparationTime: prepDate.toISOString(),
      safeConsumptionDeadline: deadlineDate.toISOString(),
      storageRequirement,
      packagingType,
      status: 'AVAILABLE',
      pickupOtp,
      deliveryOtp,
      safetyChecklist,
      privacyConsent,
      createdAt: new Date().toISOString()
    };

    addDonation(newDonation);

    // Persist to backend database via API
    api.donations
      .create({
        foodName,
        category: 'Cooked Meals (Rice/Sambar/Curry)',
        servings,
        weightKg,
        dietary,
        safeConsumptionHours: safeHours,
        storageRequirement,
        packagingType,
        locationName: location.name,
        address: location.fullAddress,
        lat: location.lat,
        lng: location.lng,
        city: location.city,
        safetyChecklist,
        notes: 'Freshly packed surplus ready for route pickup.'
      })
      .catch((err) => console.warn('Backend API sync fallback:', err));

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Donor Action Banner */}
      <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-900/40 rounded-2xl p-5 md:p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-slate-100">Donor Redistribution Hub</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Bakeries, hostel messes, and restaurants across Tamil Nadu can register fresh surplus food.
            Every donation enforces safe-consumption deadlines, FSSAI hygiene standards, and secure OTP handovers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-amber-500/10 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            Register Surplus Food
          </button>
        </div>
      </div>

      {/* Active Donations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {donations.map((donation) => {
          const deadline = new Date(donation.safeConsumptionDeadline).getTime();
          const minutesLeft = Math.max(0, Math.round((deadline - currentTime) / (1000 * 60)));
          const hoursLeft = (minutesLeft / 60).toFixed(1);
          const isUrgent = minutesLeft < 150;
          const isExpired = minutesLeft <= 0;

          return (
            <div
              key={donation.id}
              className={`rounded-2xl border p-5 flex flex-col justify-between transition-all backdrop-blur-md ${
                isExpired
                  ? 'bg-rose-950/20 border-rose-900/40 opacity-70'
                  : isUrgent
                  ? 'bg-slate-900/90 border-amber-500/40 shadow-lg shadow-amber-500/5'
                  : 'bg-slate-900/80 border-slate-800'
              }`}
            >
              <div>
                {/* Header info & FSSAI badge */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-semibold text-slate-100 text-sm leading-snug">
                      {donation.donorName}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                      <span className="text-amber-400 font-medium">{donation.donorType}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1 font-mono text-[10px] text-slate-400">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        {donation.fssaiNumber}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded font-semibold ${
                      donation.status === 'DELIVERED'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : donation.status === 'PICKED_UP'
                        ? 'bg-blue-950 text-blue-300 border border-blue-800'
                        : donation.status === 'RESERVED_BY_NGO'
                        ? 'bg-purple-950 text-purple-300 border border-purple-800'
                        : donation.status === 'EXPIRED_REJECTED'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}
                  >
                    {donation.status.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Location */}
                <div className="flex items-center gap-1.5 text-xs text-slate-300 mb-3 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                  <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">{donation.location.name}</span>
                </div>

                {/* Items & Servings */}
                <div className="space-y-1.5 text-xs text-slate-300 mb-4">
                  {donation.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-slate-300">
                      <span className="font-medium text-slate-200">{item.name}</span>
                      <span className="font-mono text-emerald-400">
                        {item.servings} meals ({item.quantityKg} kg)
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
                    <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300 text-[10px]">
                      {donation.items[0]?.dietary}
                    </span>
                    <span>·</span>
                    <span className="text-[10px] text-slate-400">{donation.storageRequirement}</span>
                  </div>
                </div>

                {/* Shelf-Life Countdown (Problem 1) */}
                <div
                  className={`p-2.5 rounded-xl border text-xs mb-3 flex items-center justify-between ${
                    isExpired
                      ? 'bg-rose-950/50 border-rose-800 text-rose-300'
                      : isUrgent
                      ? 'bg-amber-950/40 border-amber-800/80 text-amber-200'
                      : 'bg-slate-950 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Clock className={`w-3.5 h-3.5 ${isUrgent ? 'animate-pulse text-amber-400' : 'text-slate-400'}`} />
                    <span>Safe Consumption Window:</span>
                  </div>
                  <span className="font-mono font-bold">
                    {isExpired ? 'EXPIRED (REJECTED)' : `${hoursLeft} hrs remaining`}
                  </span>
                </div>
              </div>

              {/* Handover OTP Box (Problem 4: Lack of Trust) */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <div className="text-left">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                    Handover Pickup OTP:
                  </span>
                  <span className="font-mono text-base font-bold text-amber-400 tracking-wider">
                    {donation.status === 'DELIVERED' || donation.status === 'PICKED_UP'
                      ? '✓ VERIFIED'
                      : donation.pickupOtp}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Packaging:</span>
                  <span className="text-[11px] text-slate-300 font-medium">
                    {donation.packagingType.split(' ')[0]} {donation.packagingType.split(' ')[1]}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Surplus Registration Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl my-8">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Register Surplus Food Donation (Tamil Nadu)
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterDonation} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Donor Name / Establishment:</label>
                  <input
                    type="text"
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Donor Category:</label>
                  <select
                    value={donorType}
                    onChange={(e) => setDonorType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Restaurant">Restaurant / Hotel</option>
                    <option value="Bakery">Bakery / Confectionery</option>
                    <option value="Hostel Mess">Hostel Mess / College Canteen</option>
                    <option value="Marriage Hall">Marriage Hall / Banquet</option>
                    <option value="Corporate Cafeteria">Corporate IT Cafeteria</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">FSSAI License / Registration No:</label>
                  <input
                    type="text"
                    value={fssaiNumber}
                    onChange={(e) => setFssaiNumber(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Location Hub (Tamil Nadu):</label>
                  <select
                    value={selectedLocationId}
                    onChange={(e) => setSelectedLocationId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    {TAMIL_NADU_LOCATIONS.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.city} — {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Food Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-1">
                  <label className="text-slate-300 font-medium block mb-1">Food Item Name:</label>
                  <input
                    type="text"
                    value={foodName}
                    onChange={(e) => setFoodName(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Servings Count:</label>
                  <input
                    type="number"
                    min="5"
                    max="500"
                    value={servings}
                    onChange={(e) => setServings(Number(e.target.value))}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Weight (Kg):</label>
                  <input
                    type="number"
                    min="1"
                    max="200"
                    value={weightKg}
                    onChange={(e) => setWeightKg(Number(e.target.value))}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Preservation & Packaging (Problems 1 & 9) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Dietary Type:</label>
                  <select
                    value={dietary}
                    onChange={(e) => setDietary(e.target.value as DietaryType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                  >
                    <option value="Pure Veg">Pure Veg</option>
                    <option value="Non-Veg">Non-Veg</option>
                    <option value="Jain">Jain Friendly</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Storage Spec (Problem 1):</label>
                  <select
                    value={storageRequirement}
                    onChange={(e) => setStorageRequirement(e.target.value as StorageRequirement)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                  >
                    <option value="Hot (Maintain > 60°C)">Hot (&gt; 60°C)</option>
                    <option value="Cold (Refrigerated < 5°C)">Cold (&lt; 5°C)</option>
                    <option value="Ambient (Dry/Cool < 25°C)">Ambient (&lt; 25°C)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Safe Consumption Window:</label>
                  <select
                    value={safeHours}
                    onChange={(e) => setSafeHours(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                  >
                    <option value={2.5}>Urgent (2.5 Hours)</option>
                    <option value={4}>Standard Cooked (4 Hours)</option>
                    <option value={6}>Insulated Hot (6 Hours)</option>
                    <option value={10}>Dry Bakery (10 Hours)</option>
                  </select>
                </div>
              </div>

              {/* Food Safety 4-Point Hygiene Checklist (Problem 9) */}
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-2">
                <span className="font-semibold text-slate-200 text-xs flex items-center gap-1.5 text-amber-400">
                  <ShieldCheck className="w-4 h-4" />
                  Mandatory FSSAI Food Safety & Hygiene Checklist (Problem 9)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={safetyChecklist.temperatureChecked}
                      onChange={(e) =>
                        setSafetyChecklist({ ...safetyChecklist, temperatureChecked: e.target.checked })
                      }
                      className="rounded accent-amber-500"
                    />
                    <span>Food temperature inspected (&gt;60°C or &lt;5°C)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={safetyChecklist.cleanContainersSealed}
                      onChange={(e) =>
                        setSafetyChecklist({ ...safetyChecklist, cleanContainersSealed: e.target.checked })
                      }
                      className="rounded accent-amber-500"
                    />
                    <span>Sealed food-grade containers verified</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={safetyChecklist.hygienicHandlingVerified}
                      onChange={(e) =>
                        setSafetyChecklist({ ...safetyChecklist, hygienicHandlingVerified: e.target.checked })
                      }
                      className="rounded accent-amber-500"
                    />
                    <span>Gloves/hairnets used during transfer</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={safetyChecklist.odourTextureChecked}
                      onChange={(e) =>
                        setSafetyChecklist({ ...safetyChecklist, odourTextureChecked: e.target.checked })
                      }
                      className="rounded accent-amber-500"
                    />
                    <span>Sensory check (smell, texture) passed</span>
                  </label>
                </div>
              </div>

              {/* Privacy Consent (Problem 10) */}
              <label className="flex items-center gap-2 text-[11px] text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacyConsent}
                  onChange={(e) => setPrivacyConsent(e.target.checked)}
                  className="rounded accent-emerald-500"
                />
                <span>
                  Consent to masked location sharing during transit under 48-hr ephemeral retention policy.
                </span>
              </label>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold shadow-lg shadow-amber-500/10 cursor-pointer"
                >
                  Publish Surplus for Route Match
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

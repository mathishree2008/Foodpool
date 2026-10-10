import React, { useState } from 'react';
import { api, AuthUser } from '../services/api';
import { TAMIL_NADU_LOCATIONS } from '../data/tamilNaduLocations';
import { 
  Utensils, 
  HeartHandshake, 
  Car, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  MapPin, 
  Phone, 
  User, 
  Building, 
  Clock, 
  Key, 
  CheckCircle2,
  Users
} from 'lucide-react';

interface RoleLoginGatewayProps {
  onSuccess: (user: AuthUser) => void;
  onExploreGuest: () => void;
}

export const RoleLoginGateway: React.FC<RoleLoginGatewayProps> = ({
  onSuccess,
  onExploreGuest
}) => {
  const [activeTab, setActiveTab] = useState<'donor' | 'ngo' | 'transporter'>('donor');
  const [authMode, setAuthMode] = useState<'register' | 'login'>('register');

  // Common fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+91 94440 88219');
  const [selectedLocationId, setSelectedLocationId] = useState(TAMIL_NADU_LOCATIONS[0].id);

  // DONOR SPECIFIC FIELDS
  const [establishmentName, setEstablishmentName] = useState('Annapoorna Gowrishankar');
  const [donorCategory, setDonorCategory] = useState<'Restaurant' | 'Hostel Mess' | 'Bakery' | 'Marriage Hall'>('Restaurant');
  const [fssaiNumber, setFssaiNumber] = useState('TN-FSSAI-1242300900142');
  const [operatingHours, setOperatingHours] = useState('11:00 AM - 11:00 PM');

  // RECEIVER / NGO SPECIFIC FIELDS
  const [shelterName, setShelterName] = useState('Udhavum Karangal Community Shelter');
  const [darpanId, setDarpanId] = useState('TN/2021/0284918');
  const [beneficiaryCount, setBeneficiaryCount] = useState(75);
  const [urgentMealDemand, setUrgentMealDemand] = useState(60);
  const [dietaryPreference, setDietaryPreference] = useState<'Pure Veg Only' | 'Non-Veg Accepted' | 'Any'>('Pure Veg Only');

  // VOLUNTEER / TRANSPORTER SPECIFIC FIELDS
  const [volunteerType, setVolunteerType] = useState<'Daily Commuter' | 'College Student / NSS Volunteer' | 'Partner Delivery Rider' | 'Citizen Volunteer'>('Daily Commuter');
  const [vehicleType, setVehicleType] = useState('Two Wheeler (Motorcycle / Scooter)');
  const [vehicleNumber, setVehicleNumber] = useState('TN 09 BK 4421');
  const [licenseNumber, setLicenseNumber] = useState('TN-09-2021-0081942');
  const [capacityKg, setCapacityKg] = useState(25);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Quick 1-Click Demo Login
  const handleQuickDemo = async (role: 'donor' | 'ngo' | 'transporter') => {
    setLoading(true);
    setErrorMessage(null);
    try {
      let demoEmail = 'saravana@foodpool.tn';
      if (role === 'ngo') demoEmail = 'udhavum@foodpool.tn';
      if (role === 'transporter') demoEmail = 'karthik@foodpool.tn';

      const res = await api.auth.login(demoEmail, 'password123');
      onSuccess(res.user);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    const loc = TAMIL_NADU_LOCATIONS.find((l) => l.id === selectedLocationId) || TAMIL_NADU_LOCATIONS[0];

    try {
      if (authMode === 'login') {
        const res = await api.auth.login(email, password);
        onSuccess(res.user);
      } else {
        // Register role-specific user
        let orgName = name;
        if (activeTab === 'donor') orgName = establishmentName;
        if (activeTab === 'ngo') orgName = shelterName;

        const res = await api.auth.register({
          email,
          password,
          name,
          role: activeTab,
          phone,
          organizationName: orgName,
          fssaiNumber: activeTab === 'donor' ? fssaiNumber : undefined,
          darpanId: activeTab === 'ngo' ? darpanId : undefined,
          vehicleType: activeTab === 'transporter' ? vehicleType : undefined,
          vehicleNumber: activeTab === 'transporter' ? vehicleNumber : undefined,
          licenseNumber: activeTab === 'transporter' ? licenseNumber : undefined,
          city: loc.city,
          district: loc.district,
          address: loc.fullAddress,
          lat: loc.lat,
          lng: loc.lng
        });
        onSuccess(res.user);
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center py-8 px-4">
      {/* Top Welcome Title */}
      <div className="max-w-3xl w-full text-center space-y-3 mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-400 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-[#a3e635] animate-ping" />
          <span>TAMIL NADU SURPLUS FOOD POOLING SYSTEM</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-white tracking-tight">
          Welcome to <span className="text-[#a3e635] font-serif italic">FOODPOOL</span>
        </h1>
        <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
          Select your role to connect small restaurants, hostel messes, bakeries, recipient shelters, and community delivery volunteers.
        </p>

        {/* 1-Click Demo Quick Testing Bar */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Test Instantly with 1-Click:</span>
          <button
            onClick={() => handleQuickDemo('donor')}
            className="px-3 py-1.5 rounded-xl bg-amber-950/60 hover:bg-amber-900 border border-amber-800 text-amber-200 text-xs font-semibold cursor-pointer transition-all"
          >
            🏨 Login as Donor
          </button>
          <button
            onClick={() => handleQuickDemo('ngo')}
            className="px-3 py-1.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-800 text-cyan-200 text-xs font-semibold cursor-pointer transition-all"
          >
            🤝 Login as Receiver
          </button>
          <button
            onClick={() => handleQuickDemo('transporter')}
            className="px-3 py-1.5 rounded-xl bg-blue-950/60 hover:bg-blue-900 border border-blue-800 text-blue-200 text-xs font-semibold cursor-pointer transition-all"
          >
            🚴 Login as Volunteer
          </button>
          <button
            onClick={onExploreGuest}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
          >
            Explore as Guest →
          </button>
        </div>
      </div>

      {/* Main Role Selection & Entry Card */}
      <div className="max-w-2xl w-full bg-slate-900/95 border border-emerald-950/80 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
        {/* 3 Role Switcher Cards */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2.5">
            Identify Who You Are & Your Role:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Donor */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('donor');
                setErrorMessage(null);
              }}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                activeTab === 'donor'
                  ? 'bg-amber-950/50 border-amber-500 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/40'
                  : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-1">
                <Utensils className={`w-6 h-6 ${activeTab === 'donor' ? 'text-amber-400' : 'text-slate-400'}`} />
                <h3 className="font-bold text-sm text-slate-100">DONOR</h3>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Small Restaurant, Hostel Mess, Bakery, Marriage Hall
                </p>
              </div>
              <span className={`text-[10px] font-mono mt-2 font-semibold ${activeTab === 'donor' ? 'text-amber-300' : 'text-slate-500'}`}>
                {activeTab === 'donor' ? '✓ Selected' : 'Choose Donor'}
              </span>
            </button>

            {/* Receiver / NGO */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('ngo');
                setErrorMessage(null);
              }}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                activeTab === 'ngo'
                  ? 'bg-cyan-950/50 border-cyan-500 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/40'
                  : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-1">
                <HeartHandshake className={`w-6 h-6 ${activeTab === 'ngo' ? 'text-cyan-400' : 'text-slate-400'}`} />
                <h3 className="font-bold text-sm text-slate-100">RECEIVER</h3>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Shelter Home, Orphanage, Community Kitchen
                </p>
              </div>
              <span className={`text-[10px] font-mono mt-2 font-semibold ${activeTab === 'ngo' ? 'text-cyan-300' : 'text-slate-500'}`}>
                {activeTab === 'ngo' ? '✓ Selected' : 'Choose Receiver'}
              </span>
            </button>

            {/* Volunteer / Transporter */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('transporter');
                setErrorMessage(null);
              }}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                activeTab === 'transporter'
                  ? 'bg-blue-950/50 border-blue-500 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/40'
                  : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-1">
                <Car className={`w-6 h-6 ${activeTab === 'transporter' ? 'text-blue-400' : 'text-slate-400'}`} />
                <h3 className="font-bold text-sm text-slate-100">VOLUNTEER</h3>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Commuter, NSS Volunteer, Delivery Partner
                </p>
              </div>
              <span className={`text-[10px] font-mono mt-2 font-semibold ${activeTab === 'transporter' ? 'text-blue-300' : 'text-slate-500'}`}>
                {activeTab === 'transporter' ? '✓ Selected' : 'Choose Volunteer'}
              </span>
            </button>
          </div>
        </div>

        {/* Switch between Register and Login */}
        <div className="flex bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setAuthMode('register')}
            className={`flex-1 py-2 rounded-lg font-bold transition-all cursor-pointer ${
              authMode === 'register'
                ? 'bg-[#a3e635] text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Register as {activeTab.toUpperCase()}
          </button>
          <button
            type="button"
            onClick={() => setAuthMode('login')}
            className={`flex-1 py-2 rounded-lg font-bold transition-all cursor-pointer ${
              authMode === 'login'
                ? 'bg-[#a3e635] text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In with Existing Account
          </button>
        </div>

        {/* Error message banner */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
            {errorMessage}
          </div>
        )}

        {/* Registration & Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {authMode === 'register' && (
            <>
              {/* --- 1. DONOR SPECIFIC DETAILS --- */}
              {activeTab === 'donor' && (
                <div className="space-y-3 p-4 bg-slate-950/70 rounded-2xl border border-amber-900/40">
                  <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                    Donor Establishment Details:
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-300 block mb-1">Establishment Name:</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Sree Annapoorna / CEG Mess"
                        value={establishmentName}
                        onChange={(e) => setEstablishmentName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200"
                      />
                    </div>

                    <div>
                      <label className="text-slate-300 block mb-1">Establishment Category:</label>
                      <select
                        value={donorCategory}
                        onChange={(e) => setDonorCategory(e.target.value as any)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200"
                      >
                        <option value="Restaurant">Small Restaurant / Hotel</option>
                        <option value="Hostel Mess">College Hostel Mess</option>
                        <option value="Bakery">Bakery & Confectionery</option>
                        <option value="Marriage Hall">Marriage Hall / Banquet</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-300 block mb-1">FSSAI License / Registration No:</label>
                      <input
                        type="text"
                        required
                        placeholder="TN-FSSAI-1242300900142"
                        value={fssaiNumber}
                        onChange={(e) => setFssaiNumber(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-slate-300 block mb-1">Operating Hours:</label>
                      <input
                        type="text"
                        placeholder="e.g. 7:00 AM - 10:30 PM"
                        value={operatingHours}
                        onChange={(e) => setOperatingHours(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* --- 2. RECEIVER / NGO SPECIFIC DETAILS --- */}
              {activeTab === 'ngo' && (
                <div className="space-y-3 p-4 bg-slate-950/70 rounded-2xl border border-cyan-900/40">
                  <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider block">
                    Shelter & Needy Beneficiary Details:
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-300 block mb-1">Shelter / Organization Name:</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Udhavum Karangal Community Shelter"
                        value={shelterName}
                        onChange={(e) => setShelterName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200"
                      />
                    </div>

                    <div>
                      <label className="text-slate-300 block mb-1">NITI Aayog Darpan ID / 80G No:</label>
                      <input
                        type="text"
                        required
                        placeholder="TN/2021/0284918"
                        value={darpanId}
                        onChange={(e) => setDarpanId(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-slate-300 block mb-1">Needy People Fed Daily:</label>
                      <input
                        type="number"
                        min="5"
                        max="1000"
                        value={beneficiaryCount}
                        onChange={(e) => setBeneficiaryCount(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-slate-300 block mb-1">Urgent Hungry People Demand:</label>
                      <input
                        type="number"
                        min="5"
                        max="500"
                        value={urgentMealDemand}
                        onChange={(e) => setUrgentMealDemand(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-slate-300 block mb-1">Dietary Preference:</label>
                      <select
                        value={dietaryPreference}
                        onChange={(e) => setDietaryPreference(e.target.value as any)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200"
                      >
                        <option value="Pure Veg Only">Pure Veg Only</option>
                        <option value="Non-Veg Accepted">Non-Veg Accepted</option>
                        <option value="Any">Any Prepared Food</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* --- 3. VOLUNTEER SPECIFIC DETAILS --- */}
              {activeTab === 'transporter' && (
                <div className="space-y-3 p-4 bg-slate-950/70 rounded-2xl border border-blue-900/40">
                  <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider block">
                    Volunteer & Vehicle Details:
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-300 block mb-1">Volunteer Category:</label>
                      <select
                        value={volunteerType}
                        onChange={(e) => setVolunteerType(e.target.value as any)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200"
                      >
                        <option value="Daily Commuter">Daily Office Commuter</option>
                        <option value="College Student / NSS Volunteer">College Student / NSS Volunteer</option>
                        <option value="Partner Delivery Rider">Partner Delivery Rider (Dunzo/Porter)</option>
                        <option value="Citizen Volunteer">Citizen Volunteer Driver</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-300 block mb-1">Vehicle Type:</label>
                      <select
                        value={vehicleType}
                        onChange={(e) => setVehicleType(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200"
                      >
                        <option value="Two Wheeler (Motorcycle / Scooter)">Two Wheeler (Bike / Scooter)</option>
                        <option value="Four Wheeler (Sedan / Hatchback)">Car (Sedan / Hatchback)</option>
                        <option value="Commercial Mini Van (Tata Ace / Auto)">Auto / Mini Cargo</option>
                        <option value="Electric Vehicle (Ather / Ola)">EV Scooter</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-slate-300 block mb-1">Vehicle Number:</label>
                      <input
                        type="text"
                        required
                        placeholder="TN 09 BK 4421"
                        value={vehicleNumber}
                        onChange={(e) => setVehicleNumber(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-slate-300 block mb-1">Driving License / ID:</label>
                      <input
                        type="text"
                        required
                        placeholder="TN-09-2021-0081942"
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-slate-300 block mb-1">Spare Carrying Space (kg):</label>
                      <input
                        type="number"
                        min="5"
                        max="100"
                        value={capacityKg}
                        onChange={(e) => setCapacityKg(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200 font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Common Contact & Location Hub */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1">Full Name / Primary Contact:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Karthik Ramanathan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1">Phone Number:</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 94440 12345"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Tamil Nadu City / Hub Location:</label>
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
            </>
          )}

          {/* Account Credentials */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-800">
            <div>
              <label className="text-slate-300 block mb-1">Account Email:</label>
              <input
                type="email"
                required
                placeholder="user@foodpool.tn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1">Password:</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-[#a3e635] hover:bg-[#8ed028] text-slate-950 font-bold text-sm transition-all shadow-xl shadow-lime-500/20 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>
                {loading
                  ? 'Connecting to FOODPOOL...'
                  : authMode === 'register'
                  ? `Register & Open ${activeTab.toUpperCase()} Dashboard`
                  : `Sign In to ${activeTab.toUpperCase()} Portal`}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

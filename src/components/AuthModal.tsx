import React, { useState } from 'react';
import { api, AuthUser } from '../services/api';
import { TAMIL_NADU_LOCATIONS } from '../data/tamilNaduLocations';
import { 
  ShieldCheck, 
  User, 
  Mail, 
  Lock, 
  Building, 
  Car, 
  HeartHandshake, 
  CheckCircle, 
  Sparkles,
  MapPin
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: AuthUser) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<'donor' | 'ngo' | 'transporter'>('donor');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [name, setName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [phone, setPhone] = useState('+91 94440 12345');
  const [fssaiNumber, setFssaiNumber] = useState('TN-FSSAI-1242300900142');
  const [darpanId, setDarpanId] = useState('TN/2021/0284918');
  const [vehicleType, setVehicleType] = useState('Four Wheeler (Sedan / Hatchback)');
  const [vehicleNumber, setVehicleNumber] = useState('TN 09 BK 4421');
  const [licenseNumber, setLicenseNumber] = useState('TN-09-2019-0048192');
  const [selectedLocationId, setSelectedLocationId] = useState(TAMIL_NADU_LOCATIONS[0].id);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleQuickDemoLogin = async (demoRole: 'donor' | 'ngo' | 'transporter') => {
    setLoading(true);
    setErrorMessage(null);
    try {
      let demoEmail = 'saravana@foodpool.tn';
      if (demoRole === 'ngo') demoEmail = 'udhavum@foodpool.tn';
      if (demoRole === 'transporter') demoEmail = 'karthik@foodpool.tn';

      const res = await api.auth.login(demoEmail, 'password123');
      onSuccess(res.user);
      onClose();
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

    try {
      if (mode === 'login') {
        const res = await api.auth.login(email, password);
        onSuccess(res.user);
        onClose();
      } else {
        const loc = TAMIL_NADU_LOCATIONS.find((l) => l.id === selectedLocationId) || TAMIL_NADU_LOCATIONS[0];
        const res = await api.auth.register({
          email,
          password,
          name,
          role,
          phone,
          organizationName: organizationName || name,
          fssaiNumber,
          darpanId,
          vehicleType,
          vehicleNumber,
          licenseNumber,
          city: loc.city,
          district: loc.district,
          address: loc.fullAddress,
          lat: loc.lat,
          lng: loc.lng
        });
        onSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl my-8">
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-800">
          <div>
            <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-[#a3e635] text-slate-950 font-black text-xs flex items-center justify-center">
                FP
              </span>
              <span>{mode === 'login' ? 'Sign In to FOODPOOL' : 'Create FOODPOOL Account'}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Tamil Nadu Surplus Food Redistribution & Route Pooling
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-lg cursor-pointer">
            ✕
          </button>
        </div>

        {/* Demo One-Click Sign In Shortcuts */}
        <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> One-Click Demo Role Accounts:
          </span>
          <div className="grid grid-cols-3 gap-1.5 text-[11px]">
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('donor')}
              className="p-1.5 rounded-lg bg-amber-950/60 hover:bg-amber-900 border border-amber-800/80 text-amber-200 font-medium cursor-pointer"
            >
              🏨 Donor
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('ngo')}
              className="p-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-800/80 text-cyan-200 font-medium cursor-pointer"
            >
              🤝 NGO
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('transporter')}
              className="p-1.5 rounded-lg bg-blue-950/60 hover:bg-blue-900 border border-blue-800/80 text-blue-200 font-medium cursor-pointer"
            >
              🚗 Commuter
            </button>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              mode === 'login' ? 'bg-[#a3e635] text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`flex-1 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              mode === 'register' ? 'bg-[#a3e635] text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Register Account
          </button>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
            {errorMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {mode === 'register' && (
            <>
              {/* Role Selector */}
              <div>
                <label className="text-slate-300 font-medium block mb-1">Select Your Community Role:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('donor')}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      role === 'donor'
                        ? 'bg-amber-950/50 border-amber-500 text-amber-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    Food Donor
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('ngo')}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      role === 'ngo'
                        ? 'bg-cyan-950/50 border-cyan-500 text-cyan-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    Recipient NGO
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('transporter')}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      role === 'transporter'
                        ? 'bg-blue-950/50 border-blue-500 text-blue-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    Commuter
                  </button>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Your Full Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Karthik Ramanathan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {role === 'donor' && (
                <div>
                  <label className="text-slate-300 font-medium block mb-1">FSSAI License / Registration No:</label>
                  <input
                    type="text"
                    required
                    placeholder="TN-FSSAI-1242300900142"
                    value={fssaiNumber}
                    onChange={(e) => setFssaiNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono"
                  />
                </div>
              )}

              {role === 'ngo' && (
                <div>
                  <label className="text-slate-300 font-medium block mb-1">NITI Aayog NGO Darpan ID:</label>
                  <input
                    type="text"
                    required
                    placeholder="TN/2021/0284918"
                    value={darpanId}
                    onChange={(e) => setDarpanId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono"
                  />
                </div>
              )}

              {role === 'transporter' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-300 font-medium block mb-1">Vehicle Reg No:</label>
                    <input
                      type="text"
                      required
                      placeholder="TN 09 BK 4421"
                      value={vehicleNumber}
                      onChange={(e) => setVehicleNumber(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 font-medium block mb-1">Driving License:</label>
                    <input
                      type="text"
                      required
                      placeholder="TN-09-2019-0048192"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-slate-300 font-medium block mb-1">Tamil Nadu Location Hub:</label>
                <select
                  value={selectedLocationId}
                  onChange={(e) => setSelectedLocationId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
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

          <div>
            <label className="text-slate-300 font-medium block mb-1">Email Address:</label>
            <input
              type="email"
              required
              placeholder="user@foodpool.tn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-slate-300 font-medium block mb-1">Password:</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#a3e635] hover:bg-[#8fd029] text-slate-950 font-bold text-xs transition-all shadow-lg shadow-lime-500/20 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Processing...' : mode === 'login' ? 'Sign In to Account' : 'Register & Enter FoodPool'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

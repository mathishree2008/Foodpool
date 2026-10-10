import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Car, 
  Bike, 
  MapPin, 
  Clock, 
  Users, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Navigation, 
  Phone, 
  Key, 
  Package, 
  Flame, 
  ArrowRight,
  Eye,
  EyeOff
} from 'lucide-react';
import { TransporterTrip, FoodDonation, RecipientNGO } from '../types';
import { api } from '../services/api';

interface VolunteerLiveTrackingProps {
  trips: TransporterTrip[];
  donations: FoodDonation[];
  ngos: RecipientNGO[];
  onRefresh?: () => void;
}

export const VolunteerLiveTracking: React.FC<VolunteerLiveTrackingProps> = ({
  trips,
  donations,
  ngos,
  onRefresh
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const volunteerMarkerRef = useRef<L.Marker | null>(null);

  const [selectedTripId, setSelectedTripId] = useState<string>(trips[0]?.id || '');
  const [pickupOtpInput, setPickupOtpInput] = useState('');
  const [deliveryOtpInput, setDeliveryOtpInput] = useState('');
  const [otpMessage, setOtpMessage] = useState<{ text: string; success: boolean } | null>(null);
  const [isLiveSimulating, setIsLiveSimulating] = useState(false);

  const activeTrip = trips.find((t) => t.id === selectedTripId) || trips[0];
  const assignedDonation = activeTrip?.assignedDonationId
    ? donations.find((d) => d.id === activeTrip.assignedDonationId)
    : undefined;
  const assignedNgo = activeTrip?.assignedNgoId
    ? ngos.find((n) => n.id === activeTrip.assignedNgoId)
    : undefined;

  // Compute stage from trip status
  const getStageIndex = () => {
    if (!activeTrip) return 1;
    if (activeTrip.status === 'COMPLETED') return 4;
    if (activeTrip.status === 'PICKED_UP' || activeTrip.status === 'EN_ROUTE_DELIVERY') return 3;
    if (activeTrip.status === 'EN_ROUTE_PICKUP') return 2;
    if (activeTrip.status === 'MATCHED') return 1;
    return 1;
  };

  const currentStage = getStageIndex();

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [13.0418, 80.2341],
      zoom: 13,
      zoomControl: false
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Plot Volunteer and Delivery Waypoints
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !activeTrip) return;

    // Clear previous line
    if (routePolylineRef.current) {
      map.removeLayer(routePolylineRef.current);
    }

    const points: L.LatLngTuple[] = [];

    // Origin
    if (activeTrip.origin?.lat && activeTrip.origin?.lng) {
      points.push([activeTrip.origin.lat, activeTrip.origin.lng]);
    }

    // Donor
    if (assignedDonation?.location?.lat && assignedDonation?.location?.lng) {
      points.push([assignedDonation.location.lat, assignedDonation.location.lng]);

      const donorPin = L.divIcon({
        className: 'donor-pin',
        html: `
          <div style="background: #f59e0b; border: 2px solid white; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #020617; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">
            🏨
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      L.marker([assignedDonation.location.lat, assignedDonation.location.lng], { icon: donorPin })
        .addTo(map)
        .bindPopup(`<b>Pickup: ${assignedDonation.donorName}</b><br/>${assignedDonation.items[0]?.name}`);
    }

    // Receiver NGO
    if (assignedNgo?.location?.lat && assignedNgo?.location?.lng) {
      points.push([assignedNgo.location.lat, assignedNgo.location.lng]);

      const ngoPin = L.divIcon({
        className: 'ngo-pin',
        html: `
          <div style="background: #06b6d4; border: 2px solid white; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #020617; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">
            🤝
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      L.marker([assignedNgo.location.lat, assignedNgo.location.lng], { icon: ngoPin })
        .addTo(map)
        .bindPopup(`<b>Destination: ${assignedNgo.name}</b><br/>${assignedNgo.beneficiaryCount} Beneficiaries`);
    }

    // Destination
    if (activeTrip.destination?.lat && activeTrip.destination?.lng) {
      points.push([activeTrip.destination.lat, activeTrip.destination.lng]);
    }

    // Draw route polyline
    if (points.length >= 2) {
      const poly = L.polyline(points, {
        color: '#10b981',
        weight: 4,
        dashArray: activeTrip.status === 'COMPLETED' ? undefined : '8, 8',
        opacity: 0.85
      }).addTo(map);

      routePolylineRef.current = poly;
      map.fitBounds(poly.getBounds(), { padding: [50, 50] });
    }

    // Volunteer Moving Pin
    let currentLat = activeTrip.origin?.lat || 13.0418;
    let currentLng = activeTrip.origin?.lng || 80.2341;

    if (currentStage === 2 && assignedDonation?.location) {
      currentLat = assignedDonation.location.lat;
      currentLng = assignedDonation.location.lng;
    } else if (currentStage === 3 && assignedDonation?.location && assignedNgo?.location) {
      // Halfway between donor and receiver
      currentLat = (assignedDonation.location.lat + assignedNgo.location.lat) / 2;
      currentLng = (assignedDonation.location.lng + assignedNgo.location.lng) / 2;
    } else if (currentStage === 4 && assignedNgo?.location) {
      currentLat = assignedNgo.location.lat;
      currentLng = assignedNgo.location.lng;
    }

    const volunteerIcon = L.divIcon({
      className: 'volunteer-live-icon',
      html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 36px; height: 36px; background: rgba(16, 185, 129, 0.4); border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="background: #10b981; border: 3px solid #ffffff; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; color: #020617; box-shadow: 0 0 16px #10b981; z-index: 2;">
            🛵
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    if (volunteerMarkerRef.current) {
      volunteerMarkerRef.current.setLatLng([currentLat, currentLng]);
    } else {
      const marker = L.marker([currentLat, currentLng], { icon: volunteerIcon })
        .addTo(map)
        .bindPopup(`<b>Volunteer: ${activeTrip.transporterName}</b><br/>Live delivery in progress`);
      volunteerMarkerRef.current = marker;
    }
  }, [activeTrip, assignedDonation, assignedNgo, currentStage]);

  // Handle Pickup OTP verification
  const handleVerifyPickup = async () => {
    if (!activeTrip) return;
    try {
      const res = await api.trips.verifyPickup(activeTrip.id, pickupOtpInput);
      setOtpMessage({ text: res.message || 'Pickup verified! Food is now in transit.', success: true });
      setPickupOtpInput('');
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setOtpMessage({ text: err.message || 'Incorrect Pickup OTP', success: false });
    }
  };

  // Handle Delivery OTP verification
  const handleVerifyDelivery = async () => {
    if (!activeTrip) return;
    try {
      const res = await api.trips.verifyDelivery(activeTrip.id, deliveryOtpInput);
      setOtpMessage({ text: res.message || 'Delivery confirmed! Tracking ended.', success: true });
      setDeliveryOtpInput('');
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setOtpMessage({ text: err.message || 'Incorrect Delivery OTP', success: false });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-blue-950/60 via-slate-900 to-slate-900 border border-blue-900/40 rounded-3xl p-5 md:p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-400 animate-ping" />
            <h2 className="text-lg md:text-xl font-bold text-slate-100 flex items-center gap-2">
              <span>Volunteer Live Order Tracking Terminal</span>
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Monitor the volunteer from the moment the order is accepted through pickup and until final handover at the shelter.
          </p>
        </div>

        {/* Order Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 font-medium">Select Active Order:</label>
          <select
            value={selectedTripId}
            onChange={(e) => {
              setSelectedTripId(e.target.value);
              setOtpMessage(null);
            }}
            className="bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-blue-500"
          >
            {trips.map((t) => (
              <option key={t.id} value={t.id}>
                Volunteer: {t.transporterName} ({t.origin?.name} → {t.destination?.name})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4-Stage Live Progress Stepper (From Beginning to Delivery) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-md">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-4">
          Live Delivery Progression Stages:
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
          {/* Stage 1 */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              currentStage >= 1
                ? 'bg-emerald-950/40 border-emerald-500/80 shadow-lg shadow-emerald-500/5'
                : 'bg-slate-950/80 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center">
                1
              </span>
              <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                {currentStage >= 1 ? '✓ COMPLETED' : 'PENDING'}
              </span>
            </div>
            <h4 className="font-bold text-xs text-slate-100">Order Accepted</h4>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
              Volunteer routed along corridor.
            </p>
          </div>

          {/* Stage 2 */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              currentStage >= 2
                ? 'bg-emerald-950/40 border-emerald-500/80 shadow-lg shadow-emerald-500/5'
                : currentStage === 1
                ? 'bg-blue-950/30 border-blue-500/60 ring-1 ring-blue-500/30'
                : 'bg-slate-950/80 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`w-6 h-6 rounded-full font-bold text-xs flex items-center justify-center ${
                currentStage >= 2 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'
              }`}>
                2
              </span>
              <span className="text-[10px] font-mono text-amber-400 font-semibold">
                {currentStage >= 2 ? '✓ VERIFIED' : 'AT DONOR'}
              </span>
            </div>
            <h4 className="font-bold text-xs text-slate-100">Donor Pickup & OTP</h4>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
              Arrived at mess/restaurant; Pickup OTP checked.
            </p>
          </div>

          {/* Stage 3 */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              currentStage >= 3
                ? 'bg-emerald-950/40 border-emerald-500/80 shadow-lg shadow-emerald-500/5'
                : currentStage === 2
                ? 'bg-blue-950/30 border-blue-500/60 ring-1 ring-blue-500/30'
                : 'bg-slate-950/80 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`w-6 h-6 rounded-full font-bold text-xs flex items-center justify-center ${
                currentStage >= 3 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'
              }`}>
                3
              </span>
              <span className="text-[10px] font-mono text-cyan-400 font-semibold">
                {currentStage >= 3 ? '✓ EN ROUTE' : 'IN TRANSIT'}
              </span>
            </div>
            <h4 className="font-bold text-xs text-slate-100">In Transit to Shelter</h4>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
              Food held in thermal containers; Live GPS beacon.
            </p>
          </div>

          {/* Stage 4 */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              currentStage >= 4
                ? 'bg-emerald-950/60 border-emerald-400 shadow-xl shadow-emerald-500/10'
                : 'bg-slate-950/80 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`w-6 h-6 rounded-full font-bold text-xs flex items-center justify-center ${
                currentStage >= 4 ? 'bg-emerald-400 text-slate-950' : 'bg-slate-800 text-slate-300'
              }`}>
                4
              </span>
              <span className="text-[10px] font-mono text-emerald-300 font-semibold">
                {currentStage >= 4 ? '✓ DELIVERED' : 'FINAL DROP'}
              </span>
            </div>
            <h4 className="font-bold text-xs text-slate-100">Shelter Delivery & OTP</h4>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
              Handover verified via NGO OTP; meals fed to needy.
            </p>
          </div>
        </div>
      </div>

      {/* Main Map & Detailed Information Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Leaflet Live Map Tracking Element */}
        <div className="lg:col-span-7 bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl relative">
          <div ref={mapContainerRef} className="w-full h-[480px] z-10" />

          {/* Real-time telemetry banner overlay */}
          <div className="absolute top-3 left-3 z-20 bg-slate-900/90 backdrop-blur-md border border-slate-700 px-3.5 py-2 rounded-2xl text-xs text-slate-200 shadow-xl flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <div>
              <span className="font-bold text-slate-100 block">
                Tracking Volunteer: {activeTrip?.transporterName}
              </span>
              <span className="text-[10px] text-slate-400">
                Vehicle: {activeTrip?.vehicleNumber} ({activeTrip?.vehicleType.split(' ')[0]})
              </span>
            </div>
          </div>

          {/* Telemetry bottom bar */}
          <div className="absolute bottom-3 left-3 right-3 z-20 bg-slate-950/90 backdrop-blur-md border border-slate-800 p-3 rounded-2xl flex items-center justify-between text-xs text-slate-300">
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Current Stage:</span>
              <span className="font-mono font-bold text-emerald-400">
                {activeTrip?.status === 'COMPLETED'
                  ? 'DELIVERED AT SHELTER'
                  : activeTrip?.status === 'PICKED_UP'
                  ? 'IN TRANSIT TO SHELTER'
                  : 'PROCEEDING TO DONOR PICKUP'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase block">Added Detour:</span>
              <span className="font-mono font-bold text-amber-400">+{activeTrip?.detourDistanceKm} km (~{activeTrip?.detourTimeMinutes} min)</span>
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Food Supply, Prep Time, Reach Time, and Needy Count */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-emerald-400" />
                Live Order & Food Specification Details
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded">
                ORDER #TN-{activeTrip?.id.slice(-4)}
              </span>
            </div>

            {/* Food Supply Spec Cards */}
            <div className="space-y-3 text-xs">
              {/* 1. What food is supplied */}
              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                  What Food is Supplied:
                </span>
                <p className="font-bold text-slate-100 text-sm">
                  {assignedDonation?.items[0]?.name || 'Cooked Sambar Rice & Poriyal'}
                </p>
                <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
                  <span className="bg-slate-800 px-2 py-0.5 rounded text-emerald-300 font-semibold text-[10px]">
                    {assignedDonation?.items[0]?.dietary || 'Pure Veg'}
                  </span>
                  <span>·</span>
                  <span>{assignedDonation?.storageRequirement || 'Hot (>60°C)'}</span>
                </div>
              </div>

              {/* 2. No. of food supplements / portions */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase block font-semibold">
                    Food Supplement Servings:
                  </span>
                  <span className="font-mono text-xl font-black text-emerald-400 block mt-1">
                    {assignedDonation?.totalServings || 45} Meals
                  </span>
                </div>
                <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase block font-semibold">
                    Net Package Weight:
                  </span>
                  <span className="font-mono text-xl font-black text-amber-400 block mt-1">
                    {assignedDonation?.totalWeightKg || 16} Kg
                  </span>
                </div>
              </div>

              {/* 3. When it is prepared & When it should be reached */}
              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-400" /> When Prepared:
                  </span>
                  <span className="font-mono text-slate-200 font-semibold">
                    {assignedDonation ? new Date(assignedDonation.preparationTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '12:30 PM'}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-1.5 border-t border-slate-800/80">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> When Should Reach (Safe Deadline):
                  </span>
                  <span className="font-mono text-rose-400 font-bold">
                    {assignedDonation ? new Date(assignedDonation.safeConsumptionDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '04:30 PM'}
                  </span>
                </div>
              </div>

              {/* 4. How many needy people need the food */}
              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-cyan-400" /> Needy People Demand Count:
                </span>
                <p className="font-bold text-cyan-300">
                  {assignedNgo?.name || 'Udhavum Karangal Community Shelter'}
                </p>
                <div className="flex items-center justify-between text-[11px] text-slate-300 pt-0.5">
                  <span>Shelter Beneficiary Count:</span>
                  <span className="font-mono font-bold text-slate-100">
                    {assignedNgo?.beneficiaryCount || 75} Residents
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-amber-300 font-semibold">
                  <span>Urgent Meals Needed Tonight:</span>
                  <span className="font-mono">
                    {assignedNgo?.urgentMealDemand || 60} Portions
                  </span>
                </div>
              </div>

              {/* 5. Volunteer Contact Card */}
              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block font-semibold">
                    Volunteer in Transit:
                  </span>
                  <span className="font-bold text-slate-200 block text-xs mt-0.5">
                    {activeTrip?.transporterName}
                  </span>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3 text-emerald-400" />
                    {activeTrip?.phone}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Fuel Grant:</span>
                  <span className="font-mono font-bold text-amber-400">
                    ₹{activeTrip?.fuelReimbursementEarned}
                  </span>
                </div>
              </div>
            </div>

            {/* OTP Handover Verification Controls */}
            {activeTrip && (
              <div className="pt-2 border-t border-slate-800 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  Delivery Handover Verification:
                </span>

                {/* Pickup OTP Input if stage is before pickup */}
                {activeTrip.status !== 'PICKED_UP' && activeTrip.status !== 'COMPLETED' && (
                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2 text-xs">
                    <span className="font-semibold text-amber-400 block">
                      1. Verify Donor Pickup (Code: {assignedDonation?.pickupOtp || '482910'})
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="Enter 6-digit Donor OTP"
                        value={pickupOtpInput}
                        onChange={(e) => setPickupOtpInput(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-mono tracking-widest flex-1 focus:outline-none focus:border-amber-500"
                      />
                      <button
                        onClick={handleVerifyPickup}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs cursor-pointer"
                      >
                        Verify Pickup
                      </button>
                    </div>
                  </div>
                )}

                {/* Delivery OTP Input if picked up */}
                {activeTrip.status === 'PICKED_UP' && (
                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2 text-xs">
                    <span className="font-semibold text-cyan-400 block">
                      2. Verify Shelter Delivery (NGO Code: {assignedDonation?.deliveryOtp || '716394'})
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="Enter 6-digit NGO OTP"
                        value={deliveryOtpInput}
                        onChange={(e) => setDeliveryOtpInput(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-mono tracking-widest flex-1 focus:outline-none focus:border-cyan-500"
                      />
                      <button
                        onClick={handleVerifyDelivery}
                        className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs cursor-pointer"
                      >
                        Confirm Delivery
                      </button>
                    </div>
                  </div>
                )}

                {/* Completed Message */}
                {activeTrip.status === 'COMPLETED' && (
                  <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded-2xl text-xs text-emerald-300 font-medium text-center">
                    ✓ Delivery successfully completed! All portions reached the shelter on time. Live GPS tracking has ended.
                  </div>
                )}

                {otpMessage && (
                  <div
                    className={`p-2.5 rounded-xl text-xs font-medium ${
                      otpMessage.success
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-rose-950 text-rose-300 border border-rose-800'
                    }`}
                  >
                    {otpMessage.text}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

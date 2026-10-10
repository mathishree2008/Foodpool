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

    const tripOriginLat = Number(activeTrip.origin?.lat ?? (activeTrip as any).originLat);
    const tripOriginLng = Number(activeTrip.origin?.lng ?? (activeTrip as any).originLng);
    const hasValidOrigin = !isNaN(tripOriginLat) && !isNaN(tripOriginLng) && tripOriginLat > 0;

    const tripDestLat = Number(activeTrip.destination?.lat ?? (activeTrip as any).destinationLat);
    const tripDestLng = Number(activeTrip.destination?.lng ?? (activeTrip as any).destinationLng);
    const hasValidDest = !isNaN(tripDestLat) && !isNaN(tripDestLng) && tripDestLat > 0;

    const donLat = Number(assignedDonation?.location?.lat ?? (assignedDonation as any)?.lat);
    const donLng = Number(assignedDonation?.location?.lng ?? (assignedDonation as any)?.lng);
    const hasValidDonLoc = !isNaN(donLat) && !isNaN(donLng) && donLat > 0;

    const ngoLat = Number(assignedNgo?.location?.lat ?? (assignedNgo as any)?.lat);
    const ngoLng = Number(assignedNgo?.location?.lng ?? (assignedNgo as any)?.lng);
    const hasValidNgoLoc = !isNaN(ngoLat) && !isNaN(ngoLng) && ngoLat > 0;

    // Origin
    if (hasValidOrigin) {
      points.push([tripOriginLat, tripOriginLng]);
    }

    // Donor
    if (hasValidDonLoc) {
      points.push([donLat, donLng]);

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

      L.marker([donLat, donLng], { icon: donorPin })
        .addTo(map)
        .bindPopup(`<b>Pickup: ${assignedDonation?.donorName || 'Food Donor'}</b><br/>${assignedDonation?.items?.[0]?.name || (assignedDonation as any)?.foodName || 'Prepared Meals'}`);
    }

    // Receiver NGO
    if (hasValidNgoLoc) {
      points.push([ngoLat, ngoLng]);

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

      L.marker([ngoLat, ngoLng], { icon: ngoPin })
        .addTo(map)
        .bindPopup(`<b>Destination: ${assignedNgo?.name || 'NGO Shelter'}</b><br/>${assignedNgo?.beneficiaryCount || 50} Beneficiaries`);
    }

    // Destination
    if (hasValidDest) {
      points.push([tripDestLat, tripDestLng]);
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
    let currentLat = hasValidOrigin ? tripOriginLat : 13.0418;
    let currentLng = hasValidOrigin ? tripOriginLng : 80.2341;

    if (currentStage === 2 && hasValidDonLoc) {
      currentLat = donLat;
      currentLng = donLng;
    } else if (currentStage === 3 && hasValidDonLoc && hasValidNgoLoc) {
      // Halfway between donor and receiver
      currentLat = (donLat + ngoLat) / 2;
      currentLng = (donLng + ngoLng) / 2;
    } else if (currentStage === 4 && hasValidNgoLoc) {
      currentLat = ngoLat;
      currentLng = ngoLng;
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
        .bindPopup(`<b>Appointed NGO Coordinator: ${activeTrip.transporterName}</b><br/>Official NGO delivery in progress`);
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
      {/* Real-time NGO Coordinator Notification: Expired / Stale Listing Alert */}
      {activeTrip?.activeAlert && (
        <div className="bg-red-950/80 border-2 border-red-500 rounded-3xl p-5 shadow-2xl animate-pulse">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-red-600 text-white rounded-2xl flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500 text-black uppercase">
                  Automated NGO Coordinator Alert
                </span>
                <span className="text-xs text-red-300 font-mono">
                  {new Date(activeTrip.activeAlert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
              <h3 className="text-sm md:text-base font-bold text-white">
                {activeTrip.activeAlert.message}
              </h3>
              <p className="text-xs text-red-200">
                Backend cron calculation confirmed the duration between preparation and current time exceeded safe consumption limits. Appointed NGO Coordinator notified to halt pickup and discard the batch safely.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-zinc-950 border border-[#d4af37]/40 rounded-3xl p-5 md:p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#d4af37] animate-ping" />
            <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
              <span>Appointed NGO Coordinator Live Delivery Terminal</span>
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
            Every pickup and delivery is officially assigned to an authorized NGO Coordinator. Monitor active custody from dispatch through pickup and shelter handover.
          </p>
        </div>

        {/* Order Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-zinc-400 font-medium">Select Active Order:</label>
          <select
            value={selectedTripId}
            onChange={(e) => {
              setSelectedTripId(e.target.value);
              setOtpMessage(null);
            }}
            className="bg-black border border-zinc-700 text-zinc-200 px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-[#d4af37]"
          >
            {trips.map((t) => (
              <option key={t.id} value={t.id}>
                Coordinator: {t.transporterName} ({t.origin?.name || (t as any).originCity || 'Route'} → {t.destination?.name || (t as any).destinationCity || 'Destination'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4-Stage Live Progress Stepper (From Beginning to Delivery) */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-xl">
        <span className="text-xs font-bold uppercase tracking-wider text-[#d4af37] block mb-4">
          Live Delivery Progression Stages:
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
          {/* Stage 1 */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              currentStage >= 1
                ? 'bg-zinc-900 border-[#d4af37] shadow-lg shadow-[#d4af37]/5'
                : 'bg-black border-zinc-800'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="w-6 h-6 rounded-full bg-[#d4af37] text-black font-bold text-xs flex items-center justify-center">
                1
              </span>
              <span className="text-[10px] font-mono text-[#d4af37] font-semibold">
                {currentStage >= 1 ? '✓ COMPLETED' : 'PENDING'}
              </span>
            </div>
            <h4 className="font-bold text-xs text-white">Order Accepted</h4>
            <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
              Appointed NGO Coordinator en route along corridor.
            </p>
          </div>

          {/* Stage 2 */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              currentStage >= 2
                ? 'bg-zinc-900 border-[#d4af37] shadow-lg shadow-[#d4af37]/5'
                : currentStage === 1
                ? 'bg-zinc-900/60 border-zinc-700 ring-1 ring-[#d4af37]/30'
                : 'bg-black border-zinc-800'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`w-6 h-6 rounded-full font-bold text-xs flex items-center justify-center ${
                currentStage >= 2 ? 'bg-[#d4af37] text-black' : 'bg-zinc-800 text-zinc-300'
              }`}>
                2
              </span>
              <span className="text-[10px] font-mono text-[#d4af37] font-semibold">
                {currentStage >= 2 ? '✓ VERIFIED' : 'AT DONOR'}
              </span>
            </div>
            <h4 className="font-bold text-xs text-white">Donor Pickup & OTP</h4>
            <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
              Arrived at mess/restaurant; Pickup OTP checked.
            </p>
          </div>

          {/* Stage 3 */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              currentStage >= 3
                ? 'bg-zinc-900 border-[#d4af37] shadow-lg shadow-[#d4af37]/5'
                : currentStage === 2
                ? 'bg-zinc-900/60 border-zinc-700 ring-1 ring-[#d4af37]/30'
                : 'bg-black border-zinc-800'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`w-6 h-6 rounded-full font-bold text-xs flex items-center justify-center ${
                currentStage >= 3 ? 'bg-[#d4af37] text-black' : 'bg-zinc-800 text-zinc-300'
              }`}>
                3
              </span>
              <span className="text-[10px] font-mono text-zinc-300 font-semibold">
                {currentStage >= 3 ? '✓ EN ROUTE' : 'IN TRANSIT'}
              </span>
            </div>
            <h4 className="font-bold text-xs text-white">In Transit to Shelter</h4>
            <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
              Food held in thermal containers; Live GPS beacon.
            </p>
          </div>

          {/* Stage 4 */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              currentStage >= 4
                ? 'bg-zinc-900 border-[#d4af37] shadow-xl shadow-[#d4af37]/10'
                : 'bg-black border-zinc-800'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`w-6 h-6 rounded-full font-bold text-xs flex items-center justify-center ${
                currentStage >= 4 ? 'bg-[#d4af37] text-black' : 'bg-zinc-800 text-zinc-300'
              }`}>
                4
              </span>
              <span className="text-[10px] font-mono text-[#d4af37] font-semibold">
                {currentStage >= 4 ? '✓ DELIVERED' : 'FINAL DROP'}
              </span>
            </div>
            <h4 className="font-bold text-xs text-white">Shelter Delivery & OTP</h4>
            <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
              Handover verified via NGO OTP; meals fed to needy.
            </p>
          </div>
        </div>
      </div>

      {/* Main Map & Detailed Information Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Leaflet Live Map Tracking Element */}
        <div className="lg:col-span-7 bg-black rounded-3xl border border-zinc-800 overflow-hidden shadow-2xl relative">
          <div ref={mapContainerRef} className="w-full h-[480px] z-10" />

          {/* Real-time telemetry banner overlay */}
          <div className="absolute top-3 left-3 z-20 bg-black/90 backdrop-blur-md border border-[#d4af37]/50 px-3.5 py-2 rounded-2xl text-xs text-zinc-200 shadow-xl flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#d4af37] animate-ping" />
            <div>
              <span className="font-bold text-white block">
                Appointed NGO Coordinator: {activeTrip?.transporterName}
              </span>
              <span className="text-[10px] text-[#d4af37] font-medium block">
                {activeTrip?.ngoOrganization || 'Udhavum Karangal Central Logistics'} · Badge #{activeTrip?.coordinatorBadgeId || 'NGO-COORD-TN-842'}
              </span>
              <span className="text-[10px] text-zinc-400">
                Logistics Carrier: {activeTrip?.vehicleNumber} ({activeTrip?.vehicleType?.split(' ')[0] || 'Vehicle'})
              </span>
            </div>
          </div>

          {/* Telemetry bottom bar */}
          <div className="absolute bottom-3 left-3 right-3 z-20 bg-black/90 backdrop-blur-md border border-zinc-800 p-3 rounded-2xl flex items-center justify-between text-xs text-zinc-300">
            <div>
              <span className="text-[10px] text-zinc-400 uppercase block">Current Stage:</span>
              <span className="font-mono font-bold text-[#d4af37]">
                {activeTrip?.status === 'COMPLETED'
                  ? 'DELIVERED AT SHELTER'
                  : activeTrip?.status === 'PICKED_UP'
                  ? 'IN TRANSIT TO SHELTER'
                  : 'PROCEEDING TO DONOR PICKUP'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-zinc-400 uppercase block">Added Detour:</span>
              <span className="font-mono font-bold text-zinc-200">+{activeTrip?.detourDistanceKm || 0} km (~{activeTrip?.detourTimeMinutes || 0} min)</span>
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Food Supply, Prep Time, Reach Time, and Needy Count */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <span className="text-xs font-bold uppercase tracking-wider text-[#d4af37] flex items-center gap-1.5">
                <Package className="w-4 h-4 text-[#d4af37]" />
                Live Order & Food Specification Details
              </span>
              <span className="text-[10px] font-mono text-[#d4af37] bg-black border border-[#d4af37]/40 px-2 py-0.5 rounded">
                ORDER #TN-{activeTrip?.id?.slice(-4) || 'LIVE'}
              </span>
            </div>

            {/* Food Supply Spec Cards */}
            <div className="space-y-3 text-xs">
              {/* 1. What food is supplied */}
              <div className="bg-black p-3.5 rounded-2xl border border-zinc-800 space-y-1">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-semibold">
                  What Food is Supplied:
                </span>
                <p className="font-bold text-white text-sm">
                  {assignedDonation?.items?.[0]?.name || (assignedDonation as any)?.foodName || 'South Indian Meals & Sambar Rice'}
                </p>
                <div className="flex items-center gap-2 pt-1 text-[11px] text-zinc-400">
                  <span className="bg-zinc-800 px-2 py-0.5 rounded text-[#d4af37] font-semibold text-[10px]">
                    {assignedDonation?.items?.[0]?.dietary || (assignedDonation as any)?.dietary || 'Pure Veg'}
                  </span>
                  <span>·</span>
                  <span>{assignedDonation?.storageRequirement || 'Hot (>60°C)'}</span>
                </div>
              </div>

              {/* 2. No. of food supplements / portions */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-black p-3 rounded-2xl border border-zinc-800">
                  <span className="text-[10px] text-zinc-400 uppercase block font-semibold">
                    Food Supplement Servings:
                  </span>
                  <span className="font-mono text-xl font-black text-[#d4af37] block mt-1">
                    {assignedDonation?.totalServings || (assignedDonation as any)?.servings || 45} Meals
                  </span>
                </div>
                <div className="bg-black p-3 rounded-2xl border border-zinc-800">
                  <span className="text-[10px] text-zinc-400 uppercase block font-semibold">
                    Net Package Weight:
                  </span>
                  <span className="font-mono text-xl font-black text-white block mt-1">
                    {assignedDonation?.totalWeightKg || (assignedDonation as any)?.weightKg || 16} Kg
                  </span>
                </div>
              </div>

              {/* 3. When it is prepared & When it should be reached */}
              <div className="bg-black p-3.5 rounded-2xl border border-zinc-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#d4af37]" /> When Prepared:
                  </span>
                  <span className="font-mono text-white font-semibold">
                    {assignedDonation?.preparationTime ? new Date(assignedDonation.preparationTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '12:30 PM'}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-1.5 border-t border-zinc-800">
                  <span className="text-zinc-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> When Should Reach (Safe Window):
                  </span>
                  <span className="font-mono text-rose-400 font-bold">
                    {assignedDonation?.safeConsumptionDeadline ? new Date(assignedDonation.safeConsumptionDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '04:30 PM'}
                  </span>
                </div>
              </div>

              {/* 4. How many needy people need the food */}
              <div className="bg-black p-3.5 rounded-2xl border border-zinc-800 space-y-1.5">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-semibold flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-[#d4af37]" /> Needy People Demand Count:
                </span>
                <p className="font-bold text-white">
                  {assignedNgo?.name || 'Udhavum Karangal Community Shelter'}
                </p>
                <div className="flex items-center justify-between text-[11px] text-zinc-300 pt-0.5">
                  <span>Shelter Beneficiary Count:</span>
                  <span className="font-mono font-bold text-white">
                    {assignedNgo?.beneficiaryCount || 75} Residents
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#d4af37] font-semibold">
                  <span>Urgent Meals Needed Tonight:</span>
                  <span className="font-mono">
                    {assignedNgo?.urgentMealDemand || 60} Portions
                  </span>
                </div>
              </div>

              {/* 5. Appointed NGO Coordinator Official Custody Card */}
              <div className="bg-black p-3.5 rounded-2xl border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase block font-semibold">
                      Appointed NGO Coordinator:
                    </span>
                    <span className="font-bold text-white block text-xs mt-0.5">
                      {activeTrip?.transporterName}
                    </span>
                    <span className="text-[10px] text-[#d4af37] font-mono block">
                      Badge: {activeTrip?.coordinatorBadgeId || 'NGO-COORD-TN-842'} · {activeTrip?.transporterType || 'Appointed NGO Field Coordinator'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-zinc-400 block">Organization:</span>
                    <span className="font-bold text-zinc-200 text-xs block">
                      {activeTrip?.ngoOrganization || 'Udhavum Karangal Central'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-0.5">
                  <span className="flex items-center gap-1 text-zinc-300">
                    <Phone className="w-3 h-3 text-[#d4af37]" />
                    {activeTrip?.phone}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    Verified Custody
                  </span>
                </div>
              </div>
            </div>
            {/* OTP Handover Verification Controls */}
            {activeTrip && (
              <div className="pt-2 border-t border-zinc-800 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#d4af37] block">
                  Delivery Handover Verification:
                </span>

                {/* Pickup OTP Input if stage is before pickup */}
                {activeTrip.status !== 'PICKED_UP' && activeTrip.status !== 'COMPLETED' && (
                  <div className="bg-black p-3 rounded-2xl border border-zinc-800 space-y-2 text-xs">
                    <span className="font-semibold text-[#d4af37] block">
                      1. Verify Donor Pickup (Code: {assignedDonation?.pickupOtp || (assignedDonation as any)?.pickupOtp || '482910'})
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="Enter 6-digit Donor OTP"
                        value={pickupOtpInput}
                        onChange={(e) => setPickupOtpInput(e.target.value)}
                        className="bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono tracking-widest flex-1 focus:outline-none focus:border-[#d4af37]"
                      />
                      <button
                        onClick={handleVerifyPickup}
                        className="px-3 py-1.5 bg-[#d4af37] hover:bg-[#c29d2b] text-black font-bold rounded-xl text-xs cursor-pointer"
                      >
                        Verify Pickup
                      </button>
                    </div>
                  </div>
                )}

                {/* Delivery OTP Input if picked up */}
                {activeTrip.status === 'PICKED_UP' && (
                  <div className="bg-black p-3 rounded-2xl border border-zinc-800 space-y-2 text-xs">
                    <span className="font-semibold text-white block">
                      2. Verify Shelter Delivery (NGO Code: {assignedDonation?.deliveryOtp || (assignedDonation as any)?.deliveryOtp || '716394'})
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="Enter 6-digit NGO OTP"
                        value={deliveryOtpInput}
                        onChange={(e) => setDeliveryOtpInput(e.target.value)}
                        className="bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono tracking-widest flex-1 focus:outline-none focus:border-[#d4af37]"
                      />
                      <button
                        onClick={handleVerifyDelivery}
                        className="px-3 py-1.5 bg-[#d4af37] hover:bg-[#c29d2b] text-black font-bold rounded-xl text-xs cursor-pointer"
                      >
                        Confirm Delivery
                      </button>
                    </div>
                  </div>
                )}

                {/* Completed Message */}
                {activeTrip.status === 'COMPLETED' && (
                  <div className="p-3 bg-zinc-900 border border-[#d4af37] rounded-2xl text-xs text-[#d4af37] font-medium text-center">
                    ✓ Delivery successfully completed! All portions reached the shelter on time. Live GPS tracking has ended.
                  </div>
                )}

                {otpMessage && (
                  <div
                    className={`p-2.5 rounded-xl text-xs font-medium ${
                      otpMessage.success
                        ? 'bg-zinc-900 text-[#d4af37] border border-[#d4af37]'
                        : 'bg-red-950 text-red-200 border border-red-800'
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

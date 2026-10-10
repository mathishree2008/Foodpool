import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Utensils, 
  Building, 
  Cake, 
  MapPin, 
  Clock, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Filter, 
  ShieldCheck,
  ChevronRight,
  Package
} from 'lucide-react';
import { FoodDonation, RecipientNGO, TransporterTrip, TNRegion } from '../types';

interface SurplusMapRadarProps {
  donations: FoodDonation[];
  ngos: RecipientNGO[];
  trips: TransporterTrip[];
  onReserveDonation?: (donationId: string) => void;
  onDeliverDonation?: (donationId: string) => void;
}

export const SurplusMapRadar: React.FC<SurplusMapRadarProps> = ({
  donations,
  ngos,
  trips,
  onReserveDonation,
  onDeliverDonation
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const [selectedEstablishmentType, setSelectedEstablishmentType] = useState<string>('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'All' | 'AVAILABLE' | 'OCCUPIED'>('All');
  const [selectedCity, setSelectedCity] = useState<string>('All');
  const [selectedDonationId, setSelectedDonationId] = useState<string | null>(donations[0]?.id || null);

  // Filter donations based on user selection
  const filteredDonations = donations.filter((d) => {
    // Type filter
    if (selectedEstablishmentType !== 'All') {
      if (selectedEstablishmentType === 'Restaurant' && d.donorType !== 'Restaurant') return false;
      if (selectedEstablishmentType === 'Hostel Mess' && d.donorType !== 'Hostel Mess') return false;
      if (selectedEstablishmentType === 'Bakery' && d.donorType !== 'Bakery') return false;
    }

    // Status filter (GREEN: AVAILABLE, RED: OCCUPIED/RESERVED/IN TRANSIT)
    const isOccupied = d.status !== 'AVAILABLE';
    if (selectedStatusFilter === 'AVAILABLE' && isOccupied) return false;
    if (selectedStatusFilter === 'OCCUPIED' && !isOccupied) return false;

    // City filter
    if (selectedCity !== 'All' && d.location?.city !== selectedCity) return false;

    return true;
  });

  const activeDonation = donations.find((d) => d.id === selectedDonationId) || filteredDonations[0];
  const matchedNgo = activeDonation?.reservedNgoId
    ? ngos.find((n) => n.id === activeDonation.reservedNgoId)
    : undefined;

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [13.0418, 80.2341],
      zoom: 12,
      zoomControl: false
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = layerGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers when filter changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = markersLayerRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    const bounds: L.LatLngTuple[] = [];

    filteredDonations.forEach((d) => {
      if (!d.location?.lat || !d.location?.lng) return;

      const isAvailable = d.status === 'AVAILABLE';
      // Green if available, Red if occupied/reserved/picked up
      const markerColor = isAvailable ? '#22c55e' : '#ef4444';
      const statusText = isAvailable ? 'AVAILABLE (GREEN)' : 'OCCUPIED (RED)';
      const isSelected = d.id === selectedDonationId;

      const customPinIcon = L.divIcon({
        className: 'custom-food-marker',
        html: `
          <div style="
            background-color: ${markerColor};
            border: 3px solid ${isSelected ? '#ffffff' : '#020617'};
            width: ${isSelected ? '32px' : '26px'};
            height: ${isSelected ? '32px' : '26px'};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-weight: 800;
            font-size: 11px;
            box-shadow: 0 0 14px ${markerColor};
            cursor: pointer;
            transition: transform 0.2s;
          ">
            ${d.donorType === 'Bakery' ? '🥖' : d.donorType === 'Hostel Mess' ? '🏢' : '🍽️'}
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      const marker = L.marker([d.location.lat, d.location.lng], { icon: customPinIcon });

      const prepTimeStr = new Date(d.preparationTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const deadlineStr = new Date(d.safeConsumptionDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      marker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; min-width: 200px; color: #0f172a;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <b style="font-size: 13px; color: ${isAvailable ? '#15803d' : '#b91c1c'};">${d.donorName}</b>
            <span style="font-size: 10px; font-weight: bold; background: ${isAvailable ? '#dcfce7' : '#fee2e2'}; color: ${isAvailable ? '#166534' : '#991b1b'}; padding: 2px 6px; border-radius: 4px;">
              ${statusText}
            </span>
          </div>
          <div><b>Category:</b> ${d.donorType}</div>
          <div><b>Food Supplied:</b> ${d.items[0]?.name || 'Surplus Meals'}</div>
          <div><b>Portions:</b> ${d.totalServings} servings (${d.totalWeightKg} kg)</div>
          <div><b>Prepared At:</b> ${prepTimeStr}</div>
          <div><b>Reach Before:</b> <b style="color: #b91c1c;">${deadlineStr}</b></div>
          <small style="color: #64748b; display: block; margin-top: 4px;">${d.location.fullAddress || d.location.name}</small>
        </div>
      `);

      marker.on('click', () => {
        setSelectedDonationId(d.id);
      });

      layerGroup.addLayer(marker);
      bounds.push([d.location.lat, d.location.lng]);
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [filteredDonations, selectedDonationId]);

  return (
    <div className="space-y-5">
      {/* Top Banner Bar */}
      <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-900/40 rounded-3xl p-5 md:p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
            <h2 className="text-lg md:text-xl font-bold text-slate-100 flex items-center gap-2">
              <span>Surplus Food Map: Small Restaurants, Hostel Messes & Bakeries</span>
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Live geographic radar across Tamil Nadu. Places with available food glow <b className="text-emerald-400">GREEN</b>;
            occupied / reserved places automatically turn <b className="text-rose-400">RED</b>.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 bg-slate-950/80 px-4 py-2 rounded-2xl border border-slate-800 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
            <span className="font-semibold text-emerald-300">GREEN: Available Food</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" />
            <span className="font-semibold text-rose-300">RED: Occupied / In Transit</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Establishment Category Filter */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Establishment:</span>
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {['All', 'Restaurant', 'Hostel Mess', 'Bakery'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedEstablishmentType(cat)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  selectedEstablishmentType === cat
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat === 'All' ? 'All Types' : cat === 'Restaurant' ? '🍽️ Small Restaurants' : cat === 'Hostel Mess' ? '🏢 Hostel Messes' : '🥖 Bakeries'}
              </button>
            ))}
          </div>
        </div>

        {/* Status Filter: Green vs Red */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Status:</span>
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setSelectedStatusFilter('All')}
              className={`px-2.5 py-1.5 rounded-lg font-medium cursor-pointer ${
                selectedStatusFilter === 'All' ? 'bg-slate-800 text-slate-100 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({donations.length})
            </button>
            <button
              onClick={() => setSelectedStatusFilter('AVAILABLE')}
              className={`px-2.5 py-1.5 rounded-lg font-medium cursor-pointer ${
                selectedStatusFilter === 'AVAILABLE' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-emerald-400 hover:bg-emerald-950/40'
              }`}
            >
              🟢 Available ({donations.filter((d) => d.status === 'AVAILABLE').length})
            </button>
            <button
              onClick={() => setSelectedStatusFilter('OCCUPIED')}
              className={`px-2.5 py-1.5 rounded-lg font-medium cursor-pointer ${
                selectedStatusFilter === 'OCCUPIED' ? 'bg-rose-500 text-slate-950 font-bold' : 'text-rose-400 hover:bg-rose-950/40'
              }`}
            >
              🔴 Occupied ({donations.filter((d) => d.status !== 'AVAILABLE').length})
            </button>
          </div>
        </div>

        {/* City Filter */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">City:</span>
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 px-3 py-1.5 rounded-xl focus:outline-none focus:border-emerald-500"
          >
            <option value="All">All Tamil Nadu Cities</option>
            <option value="Chennai">Chennai</option>
            <option value="Coimbatore">Coimbatore</option>
            <option value="Madurai">Madurai</option>
            <option value="Tiruchirappalli">Tiruchirappalli (Trichy)</option>
            <option value="Salem">Salem</option>
            <option value="Tirunelveli">Tirunelveli</option>
          </select>
        </div>
      </div>

      {/* Map Canvas and Side Inspection Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Leaflet Map */}
        <div className="lg:col-span-8 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden relative shadow-2xl">
          <div ref={mapContainerRef} className="w-full h-[520px] z-10" />

          {/* Floating badge over map */}
          <div className="absolute top-3 left-3 z-20 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-3 py-1.5 rounded-xl text-xs text-slate-300 shadow-xl flex items-center gap-2">
            <span className="font-mono text-emerald-400 font-bold">{filteredDonations.length}</span>
            <span>Establishments Monitored</span>
          </div>
        </div>

        {/* Right Detail Card: Information of food supplied, prep time, reach deadline, and needy people */}
        <div className="lg:col-span-4 space-y-4">
          {activeDonation ? (
            <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl backdrop-blur-md">
              {/* Header with Color status */}
              <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="font-bold text-base text-slate-100">{activeDonation.donorName}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <span className="font-medium text-emerald-400">{activeDonation.donorType}</span>
                    <span>·</span>
                    <span className="font-mono text-[11px] text-slate-400">{activeDonation.fssaiNumber}</span>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold uppercase tracking-wider ${
                    activeDonation.status === 'AVAILABLE'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                      : 'bg-rose-950 text-rose-300 border border-rose-700'
                  }`}
                >
                  {activeDonation.status === 'AVAILABLE' ? '🟢 AVAILABLE' : '🔴 OCCUPIED'}
                </span>
              </div>

              {/* Exact Details Requested by the User */}
              <div className="space-y-3 text-xs">
                {/* 1. What food is supplied */}
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold flex items-center gap-1">
                    <Package className="w-3.5 h-3.5 text-emerald-400" /> What Food is Supplied:
                  </span>
                  <p className="font-semibold text-slate-200 text-sm">
                    {activeDonation.items[0]?.name || 'Cooked South Indian Meals'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Category: {activeDonation.items[0]?.category} · {activeDonation.items[0]?.dietary}
                  </p>
                </div>

                {/* 2. No. of food supplement portions */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                      Total Servings:
                    </span>
                    <span className="font-mono text-lg font-bold text-emerald-400">
                      {activeDonation.totalServings} Meals
                    </span>
                  </div>
                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                      Net Weight:
                    </span>
                    <span className="font-mono text-lg font-bold text-amber-400">
                      {activeDonation.totalWeightKg} Kg
                    </span>
                  </div>
                </div>

                {/* 3. When it is prepared & When it should be reached */}
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-blue-400" /> When Prepared:
                    </span>
                    <span className="font-mono text-slate-200 font-semibold">
                      {new Date(activeDonation.preparationTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-1 border-t border-slate-800/80">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400" /> When Should Reach (Safe Deadline):
                    </span>
                    <span className="font-mono text-rose-400 font-bold">
                      {new Date(activeDonation.safeConsumptionDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="text-[11px] text-amber-300 font-mono bg-slate-900 p-2 rounded-lg">
                    Storage: {activeDonation.storageRequirement} · {activeDonation.packagingType}
                  </div>
                </div>

                {/* 4. How many needy people need the food */}
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-cyan-400" /> Needy People Demand:
                  </span>
                  {matchedNgo ? (
                    <div>
                      <p className="font-semibold text-cyan-300">{matchedNgo.name}</p>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        <b>{matchedNgo.urgentMealDemand} hungry residents</b> currently waiting for dinner.
                      </p>
                    </div>
                  ) : (
                    <p className="text-slate-300">
                      Nearby shelters in {activeDonation.location?.city} need ~<b>{activeDonation.totalServings} portions</b> for tonight.
                    </p>
                  )}
                </div>

                {/* Location address */}
                <div className="text-[11px] text-slate-400 flex items-start gap-1.5 p-2 bg-slate-950 rounded-lg">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{activeDonation.location?.fullAddress || activeDonation.location?.name}</span>
                </div>
              </div>

              {/* Action */}
              <div className="pt-2 border-t border-slate-800">
                {activeDonation.status === 'AVAILABLE' ? (
                  <button
                    onClick={() => onReserveDonation && onReserveDonation(activeDonation.id)}
                    className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-emerald-500/10 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Reserve Surplus for Shelter / Pickup</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs text-center font-medium">
                    This batch is already occupied & assigned for delivery.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-xs text-slate-400">
              Select an establishment pin on the map to inspect food supply details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { FoodDonation, RecipientNGO, TransporterTrip, TNRegion } from '../types';
import { TAMIL_NADU_LOCATIONS } from '../data/tamilNaduLocations';
import { Utensils, HeartHandshake, Car, AlertTriangle, ShieldCheck, Navigation } from 'lucide-react';

interface TamilNaduMapProps {
  donations: FoodDonation[];
  ngos: RecipientNGO[];
  trips: TransporterTrip[];
  selectedCity: TNRegion | 'All';
  onCitySelect: (city: TNRegion | 'All') => void;
  onSelectTrip?: (trip: TransporterTrip) => void;
}

// Convert TN coordinates to SVG canvas space (width 820, height 700)
// Tamil Nadu spans roughly lat: 8.1 to 13.5, lng: 76.2 to 80.4
function projectCoordinates(lat?: number, lng?: number): { x: number; y: number } {
  const minLat = 8.1;
  const maxLat = 13.5;
  const minLng = 76.2;
  const maxLng = 80.4;

  const width = 820;
  const height = 700;
  const padding = 50;

  const validLat = typeof lat === 'number' && !isNaN(lat) ? lat : 13.0418;
  const validLng = typeof lng === 'number' && !isNaN(lng) ? lng : 80.2341;

  const xNorm = (validLng - minLng) / (maxLng - minLng);
  // Invert Y because higher latitude is further North (top of map)
  const yNorm = (maxLat - validLat) / (maxLat - minLat);

  const x = padding + xNorm * (width - 2 * padding);
  const y = padding + yNorm * (height - 2 * padding);

  return {
    x: isNaN(x) ? padding : Math.round(x),
    y: isNaN(y) ? padding : Math.round(y)
  };
}

export const TamilNaduMap: React.FC<TamilNaduMapProps> = ({
  donations,
  ngos,
  trips,
  selectedCity,
  onCitySelect,
  onSelectTrip
}) => {
  const [activeHoverId, setActiveHoverId] = useState<string | null>(null);
  const [activeTripId, setActiveTripId] = useState<string>(trips[0]?.id || 'trip-001');

  const currentTrip = trips.find((t) => t.id === activeTripId) || trips[0];
  const activeDonation = currentTrip?.assignedDonationId
    ? donations.find((d) => d.id === currentTrip.assignedDonationId)
    : undefined;
  const activeNgo = currentTrip?.assignedNgoId
    ? ngos.find((n) => n.id === currentTrip.assignedNgoId)
    : undefined;

  // Safe coordinate fallbacks
  const originLat = currentTrip ? Number(currentTrip.origin?.lat ?? (currentTrip as any).originLat ?? 13.0418) : 13.0418;
  const originLng = currentTrip ? Number(currentTrip.origin?.lng ?? (currentTrip as any).originLng ?? 80.2341) : 80.2341;
  const destLat = currentTrip ? Number(currentTrip.destination?.lat ?? (currentTrip as any).destinationLat ?? 13.0067) : 13.0067;
  const destLng = currentTrip ? Number(currentTrip.destination?.lng ?? (currentTrip as any).destinationLng ?? 80.2025) : 80.2025;

  const donorLat = activeDonation ? Number(activeDonation.location?.lat ?? (activeDonation as any).lat ?? 13.0418) : null;
  const donorLng = activeDonation ? Number(activeDonation.location?.lng ?? (activeDonation as any).lng ?? 80.2341) : null;

  const ngoLat = activeNgo ? Number(activeNgo.location?.lat ?? (activeNgo as any).lat ?? 12.9815) : null;
  const ngoLng = activeNgo ? Number(activeNgo.location?.lng ?? (activeNgo as any).lng ?? 80.2180) : null;

  // Compute SVG projection points for the active trip
  const pOrigin = currentTrip ? projectCoordinates(originLat, originLng) : null;
  const pDest = currentTrip ? projectCoordinates(destLat, destLng) : null;
  const pDonor = (donorLat !== null && donorLng !== null) ? projectCoordinates(donorLat, donorLng) : null;
  const pNgo = (ngoLat !== null && ngoLng !== null) ? projectCoordinates(ngoLat, ngoLng) : null;

  // Major Tamil Nadu city hubs for background anchor circles
  const cityAnchors = [
    { name: 'Chennai', lat: 13.0418, lng: 80.2341, label: 'Chennai Metropolitan' },
    { name: 'Coimbatore', lat: 11.0168, lng: 76.9688, label: 'Coimbatore Hub' },
    { name: 'Madurai', lat: 9.9295, lng: 78.1328, label: 'Madurai Vaigai Hub' },
    { name: 'Tiruchirappalli', lat: 10.8285, lng: 78.6874, label: 'Tiruchirappalli (Trichy)' },
    { name: 'Salem', lat: 11.6643, lng: 78.1289, label: 'Salem Corridor' },
    { name: 'Tirunelveli', lat: 8.7139, lng: 77.7428, label: 'Tirunelveli South' }
  ];

  return (
    <div className="relative rounded-2xl bg-slate-900/90 border border-slate-800 p-4 md:p-6 shadow-2xl backdrop-blur-md overflow-hidden">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <span>Tamil Nadu Live Route & Redistribution Radar</span>
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time pooling across NH45, NH544, and urban corridors with detour tracking & privacy masking.
          </p>
        </div>

        {/* City Filter Pills / Selectors */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/70 rounded-xl border border-slate-800/80 text-xs">
          {(['All', 'Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli'] as const).map((city) => (
            <button
              key={city}
              onClick={() => onCitySelect(city)}
              className={`px-2.5 py-1 rounded-lg transition-all font-medium ${
                selectedCity === city
                  ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      {/* Map Canvas and Legend Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SVG Interactive Map Area */}
        <div className="lg:col-span-8 relative bg-slate-950 rounded-xl border border-slate-800/80 p-2 overflow-hidden flex items-center justify-center min-h-[460px]">
          {/* Subtle Grid Background */}
          <div
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, #10b981 1px, transparent 0)',
              backgroundSize: '24px 24px'
            }}
          />

          <svg
            viewBox="0 0 820 700"
            className="w-full h-auto max-h-[520px] select-none"
            style={{ filter: 'drop-shadow(0 0 20px rgba(16, 185, 129, 0.03))' }}
          >
            <defs>
              <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="50%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
              <linearGradient id="detourGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.9" />
              </linearGradient>
            </defs>

            {/* Stylized Tamil Nadu Coastline & Boundary Contour */}
            <path
              d="M 680,60 
                 C 740,110 770,160 760,220
                 C 740,280 720,330 730,390
                 C 740,430 750,460 740,490
                 C 710,540 680,590 610,640
                 C 560,660 520,670 480,680
                 C 420,660 380,620 340,580
                 C 300,530 240,480 200,430
                 C 170,380 150,330 140,270
                 C 140,210 180,160 220,120
                 C 280,70 360,50 440,55
                 C 530,60 610,50 680,60 Z"
              fill="#020617"
              stroke="#1e293b"
              strokeWidth="2"
              strokeDasharray="4 4"
            />

            {/* Major Arterial Corridors in Tamil Nadu */}
            {/* NH45 / GST Road: Chennai -> Trichy -> Madurai -> Tirunelveli */}
            <path
              d={`M ${projectCoordinates(13.04, 80.23).x},${projectCoordinates(13.04, 80.23).y}
                  Q ${projectCoordinates(11.9, 79.5).x},${projectCoordinates(11.9, 79.5).y}
                    ${projectCoordinates(10.82, 78.68).x},${projectCoordinates(10.82, 78.68).y}
                  T ${projectCoordinates(9.92, 78.13).x},${projectCoordinates(9.92, 78.13).y}
                  T ${projectCoordinates(8.71, 77.74).x},${projectCoordinates(8.71, 77.74).y}`}
              fill="none"
              stroke="#334155"
              strokeWidth="2"
              opacity="0.5"
            />
            {/* NH544: Salem -> Coimbatore */}
            <path
              d={`M ${projectCoordinates(11.66, 78.12).x},${projectCoordinates(11.66, 78.12).y}
                  L ${projectCoordinates(11.01, 76.96).x},${projectCoordinates(11.01, 76.96).y}`}
              fill="none"
              stroke="#334155"
              strokeWidth="2"
              opacity="0.5"
            />

            {/* City Hub Anchors */}
            {cityAnchors.map((city) => {
              const p = projectCoordinates(city.lat, city.lng);
              const isSelected = selectedCity === city.name;
              return (
                <g
                  key={city.name}
                  className="cursor-pointer transition-transform hover:scale-105"
                  onClick={() => onCitySelect(city.name as TNRegion)}
                >
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isSelected ? '28' : '18'}
                    fill="#0f172a"
                    stroke={isSelected ? '#10b981' : '#334155'}
                    strokeWidth={isSelected ? '2.5' : '1.5'}
                    className="transition-all"
                  />
                  <circle cx={p.x} cy={p.y} r="3" fill="#10b981" />
                  <text
                    x={p.x}
                    y={p.y - (isSelected ? 32 : 22)}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize={isSelected ? '12' : '10'}
                    fontWeight="600"
                    className="pointer-events-none font-mono"
                  >
                    {city.name.toUpperCase()}
                  </text>
                </g>
              );
            })}

            {/* ACTIVE TRIP ROUTE DRAWING */}
            {currentTrip && pOrigin && pDest && (
              <g>
                {/* 1. Direct Original Route (Dotted Line) */}
                <path
                  d={`M ${pOrigin.x},${pOrigin.y} L ${pDest.x},${pDest.y}`}
                  fill="none"
                  stroke="#475569"
                  strokeWidth="2"
                  strokeDasharray="6 6"
                  opacity="0.6"
                />

                {/* 2. Optimized Pooled Detour Route (Origin -> Donor -> NGO -> Destination) */}
                {pDonor && pNgo && (
                  <path
                    d={`M ${pOrigin.x},${pOrigin.y} 
                        L ${pDonor.x},${pDonor.y} 
                        L ${pNgo.x},${pNgo.y} 
                        L ${pDest.x},${pDest.y}`}
                    fill="none"
                    stroke="url(#routeGradient)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="animate-pulse"
                  />
                )}

                {/* Moving Transporter Vehicle Marker */}
                {(() => {
                  // Interpolate vehicle position based on transitStepProgress
                  let vx = pOrigin.x;
                  let vy = pOrigin.y;
                  const rawProgress = Number(currentTrip.transitStepProgress);
                  const progress = (isNaN(rawProgress) ? 35 : rawProgress) / 100;

                  if (pDonor && pNgo) {
                    if (progress <= 0.35) {
                      // Origin -> Donor
                      const sub = progress / 0.35;
                      vx = pOrigin.x + (pDonor.x - pOrigin.x) * sub;
                      vy = pOrigin.y + (pDonor.y - pOrigin.y) * sub;
                    } else if (progress <= 0.75) {
                      // Donor -> NGO
                      const sub = (progress - 0.35) / 0.4;
                      vx = pDonor.x + (pNgo.x - pDonor.x) * sub;
                      vy = pDonor.y + (pNgo.y - pDonor.y) * sub;
                    } else {
                      // NGO -> Destination
                      const sub = (progress - 0.75) / 0.25;
                      vx = pNgo.x + (pDest.x - pNgo.x) * sub;
                      vy = pNgo.y + (pDest.y - pNgo.y) * sub;
                    }
                  } else {
                    vx = pOrigin.x + (pDest.x - pOrigin.x) * progress;
                    vy = pOrigin.y + (pDest.y - pDest.y) * progress;
                  }

                  const safeVx = isNaN(vx) ? pOrigin.x : Math.round(vx);
                  const safeVy = isNaN(vy) ? pOrigin.y : Math.round(vy);

                  return (
                    <g transform={`translate(${safeVx}, ${safeVy})`}>
                      <circle r="16" fill="#10b981" opacity="0.25" className="animate-ping" />
                      <circle r="10" fill="#0f172a" stroke="#10b981" strokeWidth="2.5" />
                      <circle r="4" fill="#34d399" />
                      <text
                        x="0"
                        y="-14"
                        textAnchor="middle"
                        fill="#34d399"
                        fontSize="9"
                        fontWeight="700"
                        fontFamily="monospace"
                      >
                        {((currentTrip.vehicleNumber || 'TN 09').split(' ')[0])}
                      </text>
                    </g>
                  );
                })()}
              </g>
            )}

            {/* Donor Nodes */}
            {donations.filter(Boolean).map((d) => {
              const dLat = Number(d.location?.lat ?? (d as any).lat ?? 13.0418);
              const dLng = Number(d.location?.lng ?? (d as any).lng ?? 80.2341);
              const p = projectCoordinates(dLat, dLng);
              const isAssigned = d.id === currentTrip?.assignedDonationId;
              const isHovered = activeHoverId === d.id;

              return (
                <g
                  key={d.id}
                  className="cursor-pointer"
                  onMouseEnter={() => setActiveHoverId(d.id)}
                  onMouseLeave={() => setActiveHoverId(null)}
                >
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isAssigned ? '12' : '9'}
                    fill="#f59e0b"
                    stroke="#ffffff"
                    strokeWidth={isAssigned ? '2.5' : '1.5'}
                    className="transition-all"
                  />
                  <text
                    x={p.x}
                    y={p.y + 3.5}
                    textAnchor="middle"
                    fill="#0f172a"
                    fontSize="8"
                    fontWeight="800"
                  >
                    D
                  </text>
                  {(isHovered || isAssigned) && (
                    <g transform={`translate(${p.x}, ${p.y - 20})`}>
                      <rect
                        x="-70"
                        y="-30"
                        width="140"
                        height="26"
                        rx="6"
                        fill="#0f172a"
                        stroke="#f59e0b"
                        strokeWidth="1"
                      />
                      <text
                        x="0"
                        y="-13"
                        textAnchor="middle"
                        fill="#fef3c7"
                        fontSize="9"
                        fontWeight="600"
                      >
                        {(d.donorName || 'Food Donor').slice(0, 20)}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Recipient NGO Nodes */}
            {ngos.filter(Boolean).map((n) => {
              const nLat = Number(n.location?.lat ?? (n as any).lat ?? 12.9815);
              const nLng = Number(n.location?.lng ?? (n as any).lng ?? 80.2180);
              const p = projectCoordinates(nLat, nLng);
              const isAssigned = n.id === currentTrip?.assignedNgoId;
              const isHovered = activeHoverId === n.id;

              return (
                <g
                  key={n.id}
                  className="cursor-pointer"
                  onMouseEnter={() => setActiveHoverId(n.id)}
                  onMouseLeave={() => setActiveHoverId(null)}
                >
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isAssigned ? '12' : '9'}
                    fill="#06b6d4"
                    stroke="#ffffff"
                    strokeWidth={isAssigned ? '2.5' : '1.5'}
                    className="transition-all"
                  />
                  <text
                    x={p.x}
                    y={p.y + 3.5}
                    textAnchor="middle"
                    fill="#0f172a"
                    fontSize="8"
                    fontWeight="800"
                  >
                    N
                  </text>
                  {(isHovered || isAssigned) && (
                    <g transform={`translate(${p.x}, ${p.y - 20})`}>
                      <rect
                        x="-75"
                        y="-30"
                        width="150"
                        height="26"
                        rx="6"
                        fill="#0f172a"
                        stroke="#06b6d4"
                        strokeWidth="1"
                      />
                      <text
                        x="0"
                        y="-13"
                        textAnchor="middle"
                        fill="#cffafe"
                        fontSize="9"
                        fontWeight="600"
                      >
                        {(n.name || 'Recipient NGO').slice(0, 22)}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Interactive Map Legend Pill */}
          <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-800 text-[11px] text-slate-300 flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
              <span>Food Donor (FSSAI)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block" />
              <span>Recipient NGO (Darpan)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-ping" />
              <span>Active Pooled Vehicle</span>
            </div>
          </div>
        </div>

        {/* Live Trip Telemetry & Route Detour Card */}
        <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
          <div className="bg-slate-950/80 rounded-xl border border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1">
                <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                Active Route Telemetry
              </span>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded">
                {currentTrip?.status}
              </span>
            </div>

            {/* Trip Selector Dropdown */}
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Select Monitored Journey:</label>
              <select
                value={activeTripId}
                onChange={(e) => {
                  setActiveTripId(e.target.value);
                  const selected = trips.find((t) => t.id === e.target.value);
                  if (selected && onSelectTrip) onSelectTrip(selected);
                }}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                {trips.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.transporterName} ({t.origin?.city || (t as any).originCity || 'Tamil Nadu'} - {((t.vehicleType || 'Vehicle').split(' ')[0])})
                  </option>
                ))}
              </select>
            </div>

            {/* Route Waypoints */}
            {currentTrip && (
              <div className="space-y-2 pt-1 border-t border-slate-800/80 text-xs">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-slate-400 mt-1 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Commuter Origin</span>
                    <span className="text-slate-200 font-medium">
                      {currentTrip.origin?.name || currentTrip.origin?.city || (currentTrip as any).originCity || 'Origin Location'}
                    </span>
                  </div>
                </div>

                {activeDonation && (
                  <div className="flex items-start gap-2 pl-2 border-l border-amber-500/40">
                    <div className="w-2 h-2 rounded-full bg-amber-400 mt-1 shrink-0" />
                    <div>
                      <span className="text-[10px] text-amber-400 uppercase block">Way-Point 1: Donor Pickup</span>
                      <span className="text-slate-200 font-medium">{activeDonation.donorName}</span>
                      <p className="text-[11px] text-slate-400">
                        {Number(activeDonation.totalServings ?? (activeDonation as any).servings) || 0} servings ({Number(activeDonation.totalWeightKg ?? (activeDonation as any).weightKg) || 0} kg)
                      </p>
                    </div>
                  </div>
                )}

                {activeNgo && (
                  <div className="flex items-start gap-2 pl-2 border-l border-cyan-500/40">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 mt-1 shrink-0" />
                    <div>
                      <span className="text-[10px] text-cyan-400 uppercase block">Way-Point 2: NGO Dropoff</span>
                      <span className="text-slate-200 font-medium">{activeNgo.name}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-slate-400 mt-1 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Commuter Final Destination</span>
                    <span className="text-slate-200 font-medium">
                      {currentTrip.destination?.name || currentTrip.destination?.city || (currentTrip as any).destinationCity || 'Final Destination'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Detour Math & CSR Reimbursement Metric (Problem 2 & 8) */}
            {currentTrip && (
              <div className="bg-slate-900 rounded-lg p-3 border border-slate-800 space-y-2 mt-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Added Detour Distance:</span>
                  <span className="font-mono text-emerald-400 font-semibold">
                    +{Number(currentTrip.detourDistanceKm) || 0} km (~{Number(currentTrip.detourTimeMinutes) || 0} min)
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">CSR Fuel Reimbursement:</span>
                  <span className="font-mono text-amber-400 font-semibold">
                    ₹{Number(currentTrip.fuelReimbursementEarned) || 0} (@ ₹18/km)
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">CO₂ Avoided / Green Credit:</span>
                  <span className="font-mono text-teal-300 font-semibold">
                    +{Number(currentTrip.greenCreditsEarned) || 0} kg CO₂ eq
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Privacy & Location Security Banner (Problem 10) */}
          <div className="bg-slate-950/60 rounded-xl border border-slate-800 p-3 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-semibold text-slate-200 block">End-to-End Privacy Protection</span>
              <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                Exact address coordinates are masked with city zone obfuscation until pickup. GPS tracking
                terminates irreversibly once NGO verifies the delivery OTP.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

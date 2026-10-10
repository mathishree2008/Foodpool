import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  FoodCluster, 
  ClusterItem, 
  FoodDonation, 
  RecipientNGO, 
  TransporterTrip 
} from '../types';
import { buildClustersFromDonations } from '../services/clusteringEngine';
import { 
  Layers, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Fuel, 
  MapPin, 
  Navigation, 
  Key, 
  Phone, 
  ShieldCheck, 
  Users, 
  ArrowRight,
  Flame,
  Truck
} from 'lucide-react';
import { api } from '../services/api';

interface ClusterRouteViewProps {
  donations: FoodDonation[];
  ngos: RecipientNGO[];
  trips: TransporterTrip[];
  onRefresh?: () => void;
  onOpenExpressPost?: () => void;
}

export const ClusterRouteView: React.FC<ClusterRouteViewProps> = ({
  donations,
  ngos,
  trips,
  onRefresh,
  onOpenExpressPost
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);

  // Compute live clusters
  const clusters: FoodCluster[] = buildClustersFromDonations(donations, ngos, trips);
  const [selectedClusterId, setSelectedClusterId] = useState<string>(clusters[0]?.id || '');
  const [stationOtpInputs, setStationOtpInputs] = useState<{ [donationId: string]: string }>({});
  const [verifiedStations, setVerifiedStations] = useState<{ [donationId: string]: boolean }>({});
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const activeCluster = clusters.find((c) => c.id === selectedClusterId) || clusters[0];

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
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Draw Multi-Stop Cluster Circuit on Leaflet Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !activeCluster) return;

    // Clear previous line
    if (routePolylineRef.current) {
      map.removeLayer(routePolylineRef.current);
    }

    const routeCoords: L.LatLngTuple[] = [];

    // Coordinator Start
    if (activeCluster.assignedTransporter?.origin) {
      const { lat, lng } = activeCluster.assignedTransporter.origin;
      routeCoords.push([lat, lng]);

      const coordPin = L.divIcon({
        className: 'coord-pin',
        html: `<div style="background: #3b82f6; border: 2px solid white; border-radius: 50%; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: white; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">🏁</div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      });

      L.marker([lat, lng], { icon: coordPin })
        .addTo(map)
        .bindPopup(`<b>Coordinator Start:</b> ${activeCluster.assignedTransporter.transporterName}`);
    }

    // Sequence of Cluster Stops (Only included valid items)
    activeCluster.items.forEach((item, idx) => {
      if (!item.donation.location) return;
      const { lat, lng } = item.donation.location;

      if (item.isIncluded) {
        routeCoords.push([lat, lng]);

        const stopPin = L.divIcon({
          className: 'stop-pin',
          html: `<div style="background: #10b981; border: 2px solid white; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #020617; box-shadow: 0 0 12px #10b981;">#${idx + 1}</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        L.marker([lat, lng], { icon: stopPin })
          .addTo(map)
          .bindPopup(`<b>Stop #${idx + 1}: ${item.donation.donorName}</b><br/>Food: ${item.donation.items[0]?.name}<br/>Portions: ${item.donation.totalServings} Meals`);
      } else {
        // Excluded Stop Marker (Red X)
        const excludedPin = L.divIcon({
          className: 'excluded-pin',
          html: `<div style="background: #ef4444; border: 2px solid white; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: white; box-shadow: 0 0 12px #ef4444;">⚠️</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        L.marker([lat, lng], { icon: excludedPin })
          .addTo(map)
          .bindPopup(`<b style="color: #ef4444;">ELIMINATED FROM ROUTE:</b> ${item.donation.donorName}<br/>Reason: ${item.exclusionReason}`);
      }
    });

    // Final Dropoff Shelter
    if (activeCluster.targetNgo?.location) {
      const { lat, lng } = activeCluster.targetNgo.location;
      routeCoords.push([lat, lng]);

      const shelterPin = L.divIcon({
        className: 'shelter-pin',
        html: `<div style="background: #06b6d4; border: 2px solid white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #020617; box-shadow: 0 4px 12px rgba(6,182,212,0.6);">🤝</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      L.marker([lat, lng], { icon: shelterPin })
        .addTo(map)
        .bindPopup(`<b>Shelter Dropoff: ${activeCluster.targetNgo.name}</b><br/>Feeds ${activeCluster.targetNgo.beneficiaryCount} Residents`);
    }

    // Connect sequential route polyline
    if (routeCoords.length >= 2) {
      const poly = L.polyline(routeCoords, {
        color: '#10b981',
        weight: 4,
        opacity: 0.85,
        lineJoin: 'round'
      }).addTo(map);

      routePolylineRef.current = poly;
      map.fitBounds(poly.getBounds(), { padding: [50, 50] });
    }
  }, [activeCluster]);

  const handleVerifyStationOtp = (donationId: string, expectedOtp: string) => {
    const input = stationOtpInputs[donationId];
    if (input && input.trim() === expectedOtp.trim()) {
      setVerifiedStations({ ...verifiedStations, [donationId]: true });
      setFeedbackMsg(`✓ Pickup verified for Station! Custody acquired.`);
      setTimeout(() => setFeedbackMsg(null), 3000);
    } else {
      setFeedbackMsg(`Incorrect OTP! Check donor receipt pass.`);
      setTimeout(() => setFeedbackMsg(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Bar */}
      <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-900/40 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500 text-slate-950 font-bold">
              <Layers className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-100 flex items-center gap-2">
                <span>Multi-Contributor Micro-Clustering & Route Dispatch</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 max-w-2xl leading-relaxed">
                Grouping small bakeries, hostel messes, and restaurants into unified multi-stop trips.
                Trips dispatch only when viable (≥ 20 meals), while expiring items are automatically eliminated.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenExpressPost}
            className="px-4 py-2 rounded-xl bg-[#a3e635] hover:bg-[#8fd029] text-slate-950 text-xs font-bold cursor-pointer transition-all shadow-md shadow-lime-500/10 flex items-center gap-1.5"
          >
            <span>+ Add Small Surplus (30s)</span>
          </button>
        </div>
      </div>

      {/* Cluster Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {clusters.map((cluster) => {
          const isSelected = cluster.id === activeCluster?.id;
          return (
            <button
              key={cluster.id}
              onClick={() => setSelectedClusterId(cluster.id)}
              className={`px-4 py-2.5 rounded-2xl whitespace-nowrap transition-all font-semibold flex items-center gap-2 cursor-pointer ${
                isSelected
                  ? 'bg-emerald-950/80 border-2 border-emerald-500 text-emerald-200 shadow-lg'
                  : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{cluster.clusterZoneName}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                cluster.isViable
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}>
                {cluster.totalValidMeals} / {cluster.viableMealThreshold} Meals
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Cluster Status & Viability Gatekeeper */}
      {activeCluster && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-md space-y-5">
          {/* Top Gauge Row */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-100">{activeCluster.clusterZoneName}</h3>
                <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full ${
                  activeCluster.isViable
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                    : 'bg-amber-950 text-amber-300 border border-amber-700'
                }`}>
                  {activeCluster.isViable ? '🟢 VIABLE BATCH (DISPATCH READY)' : '🟡 GATHERING (NEED MORE MEALS)'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Dropoff Destination: <b>{activeCluster.targetNgo.name}</b> (Shelter demand: {activeCluster.targetNgo.beneficiaryCount} residents)
              </p>
            </div>

            {/* Fuel Justification Economics */}
            <div className="flex items-center gap-3 bg-slate-950/80 p-3 rounded-2xl border border-slate-800 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Separate Pickups:</span>
                <span className="font-mono text-slate-300 font-semibold">{activeCluster.directIndividualKm} km</span>
              </div>
              <span className="text-slate-600">➔</span>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Clustered Loop:</span>
                <span className="font-mono text-emerald-400 font-bold">{activeCluster.clusteredMultiStopKm} km</span>
              </div>
              <div className="border-l border-slate-800 pl-3">
                <span className="text-[10px] text-slate-400 uppercase block">Fuel Saved:</span>
                <span className="font-mono text-amber-300 font-extrabold text-sm">+{activeCluster.fuelSavedPercent}%</span>
              </div>
            </div>
          </div>

          {/* 20-Meal Viability Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Cluster Viability Gatekeeper:
              </span>
              <span className="font-mono font-bold text-slate-200">
                {activeCluster.totalValidMeals} / {activeCluster.viableMealThreshold} Valid Meals ({Math.min(100, Math.round((activeCluster.totalValidMeals / activeCluster.viableMealThreshold) * 100))}%)
              </span>
            </div>

            <div className="w-full h-3 rounded-full bg-slate-950 overflow-hidden border border-slate-800 relative">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  activeCluster.isViable ? 'bg-[#a3e635]' : 'bg-amber-400'
                }`}
                style={{ width: `${Math.min(100, (activeCluster.totalValidMeals / activeCluster.viableMealThreshold) * 100)}%` }}
              />
            </div>

            {!activeCluster.isViable && (
              <p className="text-[11px] text-amber-300 italic pt-0.5">
                Trip held in gathering queue. Requires {activeCluster.viableMealThreshold - activeCluster.totalValidMeals} more meals from nearby small contributors before fuel dispatch is justified.
              </p>
            )}
          </div>

          {/* Sieve Filter: Automatically Eliminated Items Section */}
          {activeCluster.items.some((i) => !i.isIncluded) && (
            <div className="bg-rose-950/30 border border-rose-900/60 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span className="font-bold text-xs text-rose-300 uppercase tracking-wide">
                  Automatic Spoilage Timeline Filter — Eliminated Items:
                </span>
              </div>

              <div className="space-y-2">
                {activeCluster.items
                  .filter((i) => !i.isIncluded)
                  .map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-950/80 p-3 rounded-xl border border-rose-800/80 flex flex-wrap items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-200">{item.donation.donorName}</span>
                          <span className="text-[10px] text-rose-400 bg-rose-950 px-2 py-0.5 rounded border border-rose-800 font-mono font-bold">
                            ELIMINATED FROM CIRCUIT
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                          <b>Reason:</b> {item.exclusionReason}
                        </p>
                      </div>

                      <button
                        onClick={() => alert(`Triggered immediate 500m walk-in local alert for ${item.donation.donorName} (${item.donation.totalServings} meals). Appointed NGO field coordinator notified.`)}
                        className="px-3 py-1.5 rounded-lg bg-rose-900/40 hover:bg-rose-900 text-rose-200 text-[11px] font-semibold border border-rose-700 cursor-pointer"
                      >
                        Trigger 500m Walk-In Rescue →
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Main Grid: Leaflet Multi-Stop Circuit Map & Station Checklist */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-2">
            {/* Multi-Stop Leaflet Map */}
            <div className="lg:col-span-7 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden relative shadow-2xl">
              <div ref={mapContainerRef} className="w-full h-[450px] z-10" />

              <div className="absolute top-3 left-3 z-20 bg-slate-900/90 backdrop-blur-md border border-slate-700 px-3 py-1.5 rounded-xl text-xs text-slate-200 shadow-xl flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-400" />
                <span>Multi-Stop Collection Loop: <b>{activeCluster.items.filter((i) => i.isIncluded).length} Pickups</b></span>
              </div>
            </div>

            {/* Right Column: Station Sequence & OTP Verification Checklist */}
            <div className="lg:col-span-5 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Coordinator Multi-Stop Collection Sequence:
              </span>

              {feedbackMsg && (
                <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-300 text-xs font-medium">
                  {feedbackMsg}
                </div>
              )}

              <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
                {activeCluster.items
                  .filter((i) => i.isIncluded)
                  .map((item, idx) => {
                    const isVerified = verifiedStations[item.donation.id];

                    return (
                      <div
                        key={item.donation.id}
                        className={`p-3.5 rounded-2xl border transition-all text-xs space-y-2 ${
                          isVerified
                            ? 'bg-emerald-950/30 border-emerald-600/60'
                            : 'bg-slate-950/80 border-slate-800'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 font-bold flex items-center justify-center text-[10px]">
                                #{idx + 1}
                              </span>
                              <h4 className="font-bold text-slate-100">{item.donation.donorName}</h4>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {item.donation.items[0]?.name} · <b className="text-emerald-400">{item.donation.totalServings} Meals</b>
                            </p>
                          </div>

                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                            isVerified ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-slate-800 text-slate-300'
                          }`}>
                            {isVerified ? '✓ COLLECTED' : 'PENDING PICKUP'}
                          </span>
                        </div>

                        {/* Timing Safe Window */}
                        <div className="flex justify-between items-center text-[11px] text-slate-400 bg-slate-900 p-2 rounded-xl">
                          <span>Safe Consumption Window:</span>
                          <span className="font-mono text-amber-300 font-bold">
                            {item.safeWindowRemainingMinutes}m left
                          </span>
                        </div>

                        {/* Step-by-Step OTP Input */}
                        {!isVerified && (
                          <div className="flex items-center gap-2 pt-1">
                            <input
                              type="text"
                              maxLength={6}
                              placeholder="Enter 6-digit OTP"
                              value={stationOtpInputs[item.donation.id] || ''}
                              onChange={(e) =>
                                setStationOtpInputs({
                                  ...stationOtpInputs,
                                  [item.donation.id]: e.target.value
                                })
                              }
                              className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 font-mono tracking-wider flex-1 focus:outline-none focus:border-emerald-500"
                            />
                            <button
                              onClick={() => handleVerifyStationOtp(item.donation.id, item.donation.pickupOtp)}
                              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer"
                            >
                              Verify Stop #{idx + 1}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

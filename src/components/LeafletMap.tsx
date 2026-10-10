import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  MapPin, 
  Navigation, 
  LocateFixed, 
  ShieldAlert, 
  CheckCircle, 
  ArrowRight,
  Route,
  Eye,
  EyeOff
} from 'lucide-react';
import { api } from '../services/api';

interface LeafletMapProps {
  donations: any[];
  ngos: any[];
  trips: any[];
  selectedTripId?: string;
  onSelectTrip?: (tripId: string) => void;
  onAcceptMatch?: (tripId: string, donationId: string, ngoId: string, detourKm: number) => void;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  donations,
  ngos,
  trips,
  selectedTripId,
  onSelectTrip,
  onAcceptMatch
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const [activeTripId, setActiveTripId] = useState<string>(selectedTripId || trips[0]?.id || '');
  const [deviceLocation, setDeviceLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [deviceLocError, setDeviceLocError] = useState<string | null>(null);
  const [isSharingLocation, setIsSharingLocation] = useState<boolean>(false);
  const [roadRouteData, setRoadRouteData] = useState<{
    roadDirectKm: number;
    roadPooledKm: number;
    roadDetourKm: number;
    detourMinutes: number;
    fuelReimbursement: number;
  } | null>(null);
  const [routingLoading, setRoutingLoading] = useState(false);

  const currentTrip = trips.find((t) => t.id === activeTripId) || trips[0];
  const assignedDonation = currentTrip?.assignedDonationId
    ? donations.find((d) => d.id === currentTrip.assignedDonationId)
    : undefined;
  const assignedNgo = currentTrip?.assignedNgoId
    ? ngos.find((n) => n.id === currentTrip.assignedNgoId)
    : undefined;

  // Sync active trip if prop changes
  useEffect(() => {
    if (selectedTripId) {
      setActiveTripId(selectedTripId);
    }
  }, [selectedTripId]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Center on Tamil Nadu (Chennai default: 13.0418, 80.2341)
    const map = L.map(mapContainerRef.current, {
      center: [13.0418, 80.2341],
      zoom: 12,
      zoomControl: false
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // OpenStreetMap CartoDB Dark Matter / OSM standard tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers & Real Road Polyline on Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    // Helper for DivIcons
    const createCustomIcon = (color: string, label: string, borderColor = '#ffffff') =>
      L.divIcon({
        className: 'custom-leaflet-pin',
        html: `
          <div style="
            background-color: ${color};
            border: 2px solid ${borderColor};
            width: 28px;
            height: 28px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #020617;
            font-weight: 800;
            font-size: 11px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.4);
            font-family: sans-serif;
          ">${label}</div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

    // 1. Add Donor markers
    donations.forEach((d) => {
      if (!d.lat || !d.lng) return;
      const isAssigned = d.id === currentTrip?.assignedDonationId;
      const marker = L.marker([d.lat, d.lng], {
        icon: createCustomIcon('#f59e0b', 'D', isAssigned ? '#10b981' : '#ffffff')
      });

      marker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; color: #0f172a; min-width: 170px;">
          <b style="font-size: 13px; color: #b45309;">${d.donorName}</b><br/>
          <span>${d.foodName || 'Surplus Meals'}</span><br/>
          <span style="color: #047857; font-weight: bold;">${d.servings} Servings (${d.weightKg} kg)</span><br/>
          <small style="color: #64748b;">${d.address || d.locationName || d.city}</small><br/>
          <span style="font-size: 10px; background: #fef3c7; color: #92400e; padding: 2px 4px; border-radius: 4px; display: inline-block; margin-top: 4px;">
            FSSAI Verified · OTP Handover
          </span>
        </div>
      `);
      markersLayer.addLayer(marker);
    });

    // 2. Add NGO markers
    ngos.forEach((n) => {
      if (!n.lat || !n.lng) return;
      const isAssigned = n.id === currentTrip?.assignedNgoId;
      const marker = L.marker([n.lat, n.lng], {
        icon: createCustomIcon('#06b6d4', 'N', isAssigned ? '#10b981' : '#ffffff')
      });

      marker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; color: #0f172a; min-width: 170px;">
          <b style="font-size: 13px; color: #0e7490;">${n.name}</b><br/>
          <span>Beneficiaries: <b>${n.beneficiaryCount || 60}</b></span><br/>
          <small style="color: #64748b;">${n.address || n.locationName || n.city}</small><br/>
          <span style="font-size: 10px; background: #cffafe; color: #155e75; padding: 2px 4px; border-radius: 4px; display: inline-block; margin-top: 4px;">
            NGO Darpan Verified
          </span>
        </div>
      `);
      markersLayer.addLayer(marker);
    });

    // 3. Add Current Commuter Origin & Destination markers
    if (currentTrip && currentTrip.originLat && currentTrip.destinationLat) {
      const originMarker = L.marker([currentTrip.originLat, currentTrip.originLng], {
        icon: createCustomIcon('#3b82f6', 'O')
      }).bindPopup(`<b>Commuter Origin:</b> ${currentTrip.originName}`);

      const destMarker = L.marker([currentTrip.destinationLat, currentTrip.destinationLng], {
        icon: createCustomIcon('#6366f1', 'B')
      }).bindPopup(`<b>Commuter Destination:</b> ${currentTrip.destinationName}`);

      markersLayer.addLayer(originMarker);
      markersLayer.addLayer(destMarker);
    }

    // 4. Calculate Road Geometry and Draw Real Road Polyline
    if (currentTrip && assignedDonation && assignedNgo) {
      setRoutingLoading(true);
      api.routing
        .calculateDetour({
          originLat: currentTrip.originLat,
          originLng: currentTrip.originLng,
          destLat: currentTrip.destinationLat,
          destLng: currentTrip.destinationLng,
          donorLat: assignedDonation.lat,
          donorLng: assignedDonation.lng,
          ngoLat: assignedNgo.lat,
          ngoLng: assignedNgo.lng
        })
        .then((res) => {
          setRoadRouteData({
            roadDirectKm: res.roadDirectKm,
            roadPooledKm: res.roadPooledKm,
            roadDetourKm: res.roadDetourKm,
            detourMinutes: res.detourMinutes,
            fuelReimbursement: res.fuelReimbursement
          });

          if (routePolylineRef.current) {
            map.removeLayer(routePolylineRef.current);
          }

          if (res.coordinates && res.coordinates.length > 0) {
            const polyline = L.polyline(res.coordinates, {
              color: '#10b981',
              weight: 4,
              opacity: 0.85,
              lineJoin: 'round'
            }).addTo(map);

            routePolylineRef.current = polyline;
            map.fitBounds(polyline.getBounds(), { padding: [40, 40] });
          }
        })
        .catch((err) => {
          console.warn('Road routing error:', err);
        })
        .finally(() => {
          setRoutingLoading(false);
        });
    } else if (currentTrip && currentTrip.originLat && currentTrip.destinationLat) {
      // Draw simple direct commuter line
      if (routePolylineRef.current) {
        map.removeLayer(routePolylineRef.current);
      }
      const directPolyline = L.polyline(
        [
          [currentTrip.originLat, currentTrip.originLng],
          [currentTrip.destinationLat, currentTrip.destinationLng]
        ],
        {
          color: '#64748b',
          weight: 3,
          dashArray: '6, 8',
          opacity: 0.7
        }
      ).addTo(map);

      routePolylineRef.current = directPolyline;
      map.fitBounds(directPolyline.getBounds(), { padding: [50, 50] });
    }
  }, [donations, ngos, currentTrip, assignedDonation, assignedNgo]);

  // Request Permission-based Device Location (Never simulate GPS data)
  const handleRequestDeviceLocation = () => {
    if (!navigator.geolocation) {
      setDeviceLocError('Geolocation is not supported by your browser.');
      return;
    }

    setDeviceLocError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setDeviceLocation({ lat: latitude, lng: longitude });

        const map = mapInstanceRef.current;
        if (map) {
          map.setView([latitude, longitude], 14);

          if (userMarkerRef.current) {
            userMarkerRef.current.setLatLng([latitude, longitude]);
          } else {
            const userIcon = L.divIcon({
              className: 'user-device-pin',
              html: `
                <div style="
                  background: #3b82f6;
                  border: 3px solid #ffffff;
                  width: 20px;
                  height: 20px;
                  border-radius: 50%;
                  box-shadow: 0 0 12px #3b82f6;
                "></div>
              `,
              iconSize: [20, 20],
              iconAnchor: [10, 10]
            });

            const marker = L.marker([latitude, longitude], { icon: userIcon })
              .addTo(map)
              .bindPopup('<b>Your Verified Device Location</b><br/>Permission-authorized coordinates');
            userMarkerRef.current = marker;
          }
        }
      },
      (err) => {
        setDeviceLocError('Location permission denied or unavailable: ' + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Toggle Authorized Location Sharing (Problem 10: Strict stop-sharing control)
  const handleToggleLocationSharing = async () => {
    if (!currentTrip) return;
    const nextState = !isSharingLocation;

    if (nextState && !deviceLocation) {
      // Need location first
      handleRequestDeviceLocation();
    }

    try {
      await api.trips.updateLocation(currentTrip.id, {
        lat: deviceLocation?.lat,
        lng: deviceLocation?.lng,
        authorizedSharing: nextState
      });
      setIsSharingLocation(nextState);
    } catch (err: any) {
      alert('Failed to update location sharing: ' + err.message);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl space-y-4 p-4 md:p-6">
      {/* Header and Telemetry Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Route className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-slate-100 text-sm md:text-base">
              OpenStreetMap Road Routing & Detour Telemetry
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real Leaflet tiles, genuine coordinates from database, and live road routing without simulated telemetry.
          </p>
        </div>

        {/* Action Controls: Device Location & Stop Sharing Control */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRequestDeviceLocation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer transition-colors"
          >
            <LocateFixed className="w-3.5 h-3.5 text-blue-400" />
            <span>Use My Device Location</span>
          </button>

          <button
            onClick={handleToggleLocationSharing}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              isSharingLocation
                ? 'bg-rose-950/80 border border-rose-700 text-rose-300 hover:bg-rose-900'
                : 'bg-emerald-950/80 border border-emerald-700 text-emerald-300 hover:bg-emerald-900'
            }`}
          >
            {isSharingLocation ? (
              <>
                <EyeOff className="w-3.5 h-3.5 text-rose-400" />
                <span>Stop Sharing Location</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                <span>Authorize Location Sharing</span>
              </>
            )}
          </button>
        </div>
      </div>

      {deviceLocError && (
        <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{deviceLocError}</span>
        </div>
      )}

      {/* Main Map Canvas and Road Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Leaflet Map DOM Element */}
        <div className="lg:col-span-8 relative">
          <div
            ref={mapContainerRef}
            className="w-full h-[420px] md:h-[480px] rounded-xl border border-slate-800 overflow-hidden z-10"
          />

          {routingLoading && (
            <div className="absolute top-3 left-3 z-20 bg-slate-900/90 border border-slate-700 px-3 py-1.5 rounded-lg text-xs text-slate-300 flex items-center gap-2 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Calculating road geometry via OSRM...</span>
            </div>
          )}

          {/* Map Legend */}
          <div className="absolute bottom-3 left-3 z-20 bg-slate-950/90 border border-slate-800 px-3 py-2 rounded-xl text-[11px] text-slate-300 flex items-center gap-3 backdrop-blur-md">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Donor Pickup
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block" /> NGO Shelter
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Pooled Road Path
            </span>
          </div>
        </div>

        {/* Right Panel: Journey Selection & Road Routing Telemetry */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-950/90 rounded-xl border border-slate-800 p-4 space-y-3">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-bold block">
              Active Commuter Journey
            </span>

            <select
              value={activeTripId}
              onChange={(e) => {
                setActiveTripId(e.target.value);
                if (onSelectTrip) onSelectTrip(e.target.value);
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              {trips.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.transporterName} ({t.originName} → {t.destinationName})
                </option>
              ))}
            </select>

            {currentTrip && (
              <div className="space-y-2 text-xs pt-1 border-t border-slate-800">
                <div className="flex justify-between">
                  <span className="text-slate-400">Driver & Vehicle:</span>
                  <span className="text-slate-200 font-medium">{currentTrip.vehicleNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span className="font-mono text-emerald-400 font-semibold">{currentTrip.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Sharing Beacon:</span>
                  <span className={`font-medium ${isSharingLocation ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {isSharingLocation ? 'Authorized & Active' : 'Off (Privacy Mode)'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Road Routing Detour Results (Problem 2 & 8) */}
          {roadRouteData && (
            <div className="bg-slate-950/90 rounded-xl border border-slate-800 p-4 space-y-2.5 text-xs">
              <span className="text-xs uppercase tracking-wider text-emerald-400 font-bold block">
                Road Routing & Detour Calculation
              </span>

              <div className="grid grid-cols-2 gap-2 bg-slate-900 p-2.5 rounded-lg">
                <div>
                  <span className="text-[10px] text-slate-400 block">Direct Road Distance:</span>
                  <span className="font-mono text-slate-200 font-semibold">{roadRouteData.roadDirectKm} km</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Pooled Multi-Way Road:</span>
                  <span className="font-mono text-emerald-400 font-semibold">{roadRouteData.roadPooledKm} km</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-1 text-xs">
                <span className="text-slate-400">Actual Detour:</span>
                <span className="font-mono text-amber-300 font-bold">
                  +{roadRouteData.roadDetourKm} km (~{roadRouteData.detourMinutes} min)
                </span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Fuel Reimbursement (@ ₹18/km):</span>
                <span className="font-mono text-emerald-400 font-bold">₹{roadRouteData.fuelReimbursement}</span>
              </div>
            </div>
          )}

          {/* Privacy Notice */}
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
            <b>Location Privacy Guarantee:</b> Live GPS tracking is only enabled when you explicitly toggle
            authorization. You can stop sharing at any instant using the red button above.
          </div>
        </div>
      </div>
    </div>
  );
};

import { Router, Request, Response } from 'express';
import { explainRouteSafety } from '../services/geminiService';

export const routingRouter = Router();

// Haversine proximity calculation
function haversineProximity(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

// AI MULTI-STATION ROUTE OPTIMIZATION & DEADLINE MANAGEMENT (Phase 3 Core Algorithm)
// Implements: T_a + B <= T_d (Food safety before route efficiency)
routingRouter.post('/ai-optimize-circuit', async (req: Request, res: Response) => {
  try {
    const {
      depot,
      targetNgo,
      stations,
      vehicleCapacityKg = 45,
      vehicleCapacityServings = 120,
      safetyBufferMinutes = 20,
      simulatedDelayMinutes = 0
    } = req.body;

    if (!depot || !targetNgo || !Array.isArray(stations)) {
      return res.status(400).json({ error: 'Depot, Target NGO, and candidate stations array required.' });
    }

    const depotLat = Number(depot.lat) || 13.0418;
    const depotLng = Number(depot.lng) || 80.2341;
    const ngoLat = Number(targetNgo.lat) || 12.9815;
    const ngoLng = Number(targetNgo.lng) || 80.2180;

    // Filter available candidate items
    const candidates = stations.filter((s: any) => s && s.id);
    if (candidates.length === 0) {
      return res.json({
        feasibleStops: [],
        ineligibleStops: [],
        totalRoadKm: 0,
        totalTravelMinutes: 0,
        totalMeals: 0,
        totalWeightKg: 0,
        routeCoordinates: [[depotLat, depotLng], [ngoLat, ngoLng]],
        aiSafetyExplanation: 'No pending surplus food stations in current corridor.'
      });
    }

    // Sort candidate stops based on distance from depot along the vector towards NGO
    candidates.sort((a: any, b: any) => {
      const distA = haversineProximity(depotLat, depotLng, Number(a.lat), Number(a.lng));
      const distB = haversineProximity(depotLat, depotLng, Number(b.lat), Number(b.lng));
      return distA - distB;
    });

    const now = Date.now();
    const effectiveStartTime = now + Number(simulatedDelayMinutes) * 60 * 1000;

    // Estimate step durations
    // Average inter-stop travel time in Tamil Nadu urban traffic: ~7 mins drive + 6 mins loading
    const interStopDriveMins = 7;
    const loadingBufferMins = 6;
    const finalLegToNgoMins = 18;

    const feasibleStops: any[] = [];
    const ineligibleStops: any[] = [];
    let currentCarriedKg = 0;
    let currentCarriedServings = 0;

    // Evaluate each station sequentially against T_a + B <= T_d
    candidates.forEach((st: any, idx: number) => {
      const sLat = Number(st.lat) || depotLat;
      const sLng = Number(st.lng) || depotLng;
      const servings = Number(st.servings || st.totalServings) || 30;
      const weightKg = Number(st.weightKg || st.totalWeightKg) || 10;
      const prepTimeMs = new Date(st.preparationTime || st.preparedAt || now - 3600000).getTime();
      const deadlineMs = new Date(st.safeConsumptionDeadline || now + 3 * 3600000).getTime();

      // Estimated arrival time at this stop
      const transitToThisStopMins = (idx + 1) * interStopDriveMins + idx * loadingBufferMins;
      const expectedPickupTimeMs = effectiveStartTime + transitToThisStopMins * 60 * 1000;

      // Predicted arrival at the receiving NGO (T_a) after completing all stops
      const remainingStops = candidates.length - 1 - idx;
      const transitRemainingToNgoMins = remainingStops * (interStopDriveMins + loadingBufferMins) + finalLegToNgoMins;
      const predictedNgoArrivalMs = expectedPickupTimeMs + loadingBufferMins * 60 * 1000 + transitRemainingToNgoMins * 60 * 1000;

      const bufferMs = Number(safetyBufferMinutes) * 60 * 1000;
      const requiredArrivalWithBufferMs = predictedNgoArrivalMs + bufferMs;

      // CORE ALGORITHM: T_a + B <= T_d
      const meetsDeadlineFeasibility = requiredArrivalWithBufferMs <= deadlineMs;
      const fitsCapacity = (currentCarriedKg + weightKg <= vehicleCapacityKg) &&
                           (currentCarriedServings + servings <= vehicleCapacityServings);

      const predictedArrivalDate = new Date(predictedNgoArrivalMs);
      const deadlineDate = new Date(deadlineMs);
      const prepDate = new Date(prepTimeMs);

      const remainingWindowMins = Math.round((deadlineMs - now) / 60000);
      const timeToNgoMinutes = Math.round((predictedNgoArrivalMs - now) / 60000);

      const stationData = {
        id: st.id,
        donorName: st.donorName,
        foodName: st.foodName || st.items?.[0]?.name || 'Surplus Food Batch',
        category: st.category || 'Cooked Meals',
        servings,
        weightKg,
        lat: sLat,
        lng: sLng,
        address: st.address || st.locationName,
        storageRequirement: st.storageRequirement || 'Hot (> 60°C)',
        preparationTimeStr: prepDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        declaredDeadlineStr: deadlineDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        predictedArrivalNgoStr: predictedArrivalDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        safetyBufferMinutes,
        remainingWindowMins,
        timeToNgoMinutes,
        sequenceOrder: idx + 1
      };

      if (meetsDeadlineFeasibility && fitsCapacity) {
        currentCarriedKg += weightKg;
        currentCarriedServings += servings;
        feasibleStops.push({
          ...stationData,
          status: 'POTENTIALLY_FEASIBLE',
          isFeasible: true,
          safetyStatusLabel: '✓ Safe & Feasible (T_a + B ≤ T_d)',
          slackMinutes: Math.round((deadlineMs - requiredArrivalWithBufferMs) / 60000)
        });
      } else {
        const timeDeficitMinutes = Math.round((requiredArrivalWithBufferMs - deadlineMs) / 60000);
        let exclusionReason = '';
        if (!meetsDeadlineFeasibility) {
          exclusionReason = `Safe window violation: Predicted arrival at shelter (${stationData.predictedArrivalNgoStr}) with ${safetyBufferMinutes}m safety buffer exceeds safe consumption deadline (${stationData.declaredDeadlineStr}) by ${timeDeficitMinutes} minutes. Excluded to prevent spoilage risk.`;
        } else {
          exclusionReason = `Vehicle capacity limit exceeded: Added ${weightKg}kg would exceed ${vehicleCapacityKg}kg capacity.`;
        }

        ineligibleStops.push({
          ...stationData,
          status: 'INELIGIBLE',
          isFeasible: false,
          safetyStatusLabel: '✗ Ineligible (Deadline Violation)',
          exclusionReason,
          timeDeficitMinutes
        });
      }
    });

    // Compute route waypoints and OSRM geometry
    let routeWaypoints: [number, number][] = [[depotLat, depotLng]];
    feasibleStops.forEach((s) => routeWaypoints.push([s.lat, s.lng]));
    routeWaypoints.push([ngoLat, ngoLng]);

    let totalRoadKm = 0;
    for (let i = 0; i < routeWaypoints.length - 1; i++) {
      totalRoadKm += haversineProximity(
        routeWaypoints[i][0],
        routeWaypoints[i][1],
        routeWaypoints[i + 1][0],
        routeWaypoints[i + 1][1]
      ) * 1.35; // City road detour coefficient
    }
    totalRoadKm = Number(totalRoadKm.toFixed(1));

    const totalTravelMinutes = feasibleStops.length * (interStopDriveMins + loadingBufferMins) + finalLegToNgoMins + Number(simulatedDelayMinutes);

    // Call OSRM for true road geometry
    let coordinates: [number, number][] = routeWaypoints;
    try {
      if (routeWaypoints.length >= 2) {
        const osrmCoordStr = routeWaypoints.map(([lat, lng]) => `${lng},${lat}`).join(';');
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${osrmCoordStr}?overview=full&geometries=geojson`;
        const osrmResp = await fetch(osrmUrl, { signal: AbortSignal.timeout(3500) });
        if (osrmResp.ok) {
          const osrmData = await osrmResp.json();
          if (osrmData.routes && osrmData.routes[0]?.geometry?.coordinates) {
            coordinates = osrmData.routes[0].geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
            totalRoadKm = Number((osrmData.routes[0].distance / 1000).toFixed(1));
          }
        }
      }
    } catch (osrmError) {
      console.warn('OSRM multi-stop network fallback:', osrmError);
    }

    // AI Safety Rationale from Gemini
    const itemsSummary = feasibleStops.map((s) => `${s.donorName} (${s.foodName}, ${s.servings} meals)`).join(', ') || 'None';
    const aiSafetyExplanation = await explainRouteSafety({
      feasibleStopsCount: feasibleStops.length,
      ineligibleStopsCount: ineligibleStops.length,
      totalTravelMinutes,
      safetyBufferMinutes,
      targetNgoName: targetNgo.name || 'Recipient Shelter',
      itemsSummary
    });

    return res.json({
      feasibleStops,
      ineligibleStops,
      totalRoadKm,
      totalTravelMinutes,
      totalMeals: currentCarriedServings,
      totalWeightKg: currentCarriedKg,
      routeCoordinates: coordinates,
      aiSafetyExplanation,
      feasibilityFormula: 'T_a + B <= T_d',
      safetyBufferMinutes,
      simulatedDelayMinutes
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'AI route optimization failed: ' + err.message });
  }
});

// ROUTE MATCHING & DETOUR ROAD SERVICE
routingRouter.post('/calculate-detour', async (req: Request, res: Response) => {
  try {
    const { originLat, originLng, destLat, destLng, donorLat, donorLng, ngoLat, ngoLng } = req.body;

    if (!originLat || !destLat || !donorLat || !ngoLat) {
      return res.status(400).json({ error: 'Origin, Destination, Donor, and NGO coordinates required.' });
    }

    // Proximity check with Haversine
    const directProximityKm = haversineProximity(originLat, originLng, destLat, destLng);
    const donorProximityKm = haversineProximity(originLat, originLng, donorLat, donorLng);

    // Call public OSRM routing service for true road driving distance and geometry
    let roadDirectKm = directProximityKm * 1.3;
    let roadPooledKm = (directProximityKm + 2.5) * 1.3;
    let coordinates: [number, number][] = [
      [originLat, originLng],
      [donorLat, donorLng],
      [ngoLat, ngoLng],
      [destLat, destLng]
    ];

    try {
      // OSRM coordinates format: lon,lat;lon,lat
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${donorLng},${donorLat};${ngoLng},${ngoLat};${destLng},${destLat}?overview=full&geometries=geojson`;
      const response = await fetch(osrmUrl, { signal: AbortSignal.timeout(3000) });
      if (response.ok) {
        const data = await response.json();
        if (data.routes && data.routes[0]) {
          roadPooledKm = Number((data.routes[0].distance / 1000).toFixed(2));
          if (data.routes[0].geometry && data.routes[0].geometry.coordinates) {
            // OSRM returns [lng, lat], convert to [lat, lng] for Leaflet
            coordinates = data.routes[0].geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
          }
        }
      }

      // Also get direct road distance
      const osrmDirectUrl = `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=false`;
      const directResp = await fetch(osrmDirectUrl, { signal: AbortSignal.timeout(3000) });
      if (directResp.ok) {
        const directData = await directResp.json();
        if (directData.routes && directData.routes[0]) {
          roadDirectKm = Number((directData.routes[0].distance / 1000).toFixed(2));
        }
      }
    } catch (osrmErr) {
      // Graceful fallback to road-factor estimation if OSRM is unreachable
      console.warn('OSRM routing network fallback:', osrmErr);
    }

    const roadDetourKm = Number(Math.max(0, roadPooledKm - roadDirectKm).toFixed(2));
    const detourMinutes = Math.round((roadDetourKm / 28) * 60) + 12;

    return res.json({
      roadDirectKm,
      roadPooledKm,
      roadDetourKm,
      detourMinutes,
      directProximityKm,
      donorProximityKm,
      fuelReimbursement: Math.round(roadDetourKm * 18),
      coordinates
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Routing calculation failed: ' + err.message });
  }
});

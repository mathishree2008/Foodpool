import { Router, Request, Response } from 'express';

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

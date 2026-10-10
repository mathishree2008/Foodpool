import { Router, Request, Response } from 'express';
import { db, TripDoc, DonationDoc, NgoDoc } from '../db';
import { authenticateToken, AuthRequest } from './auth';

export const tripsRouter = Router();

// Haversine distance utility
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

// GET ALL TRIPS
tripsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { status, transporterId } = req.query;
    const trips = db.collection<TripDoc>('trips');
    const filter: Partial<TripDoc> = {};
    if (status && typeof status === 'string') filter.status = status as any;
    if (transporterId && typeof transporterId === 'string') filter.transporterId = transporterId;

    const list = await trips.find(filter);
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return res.json({ trips: list });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch trips: ' + err.message });
  }
});

// GET SINGLE TRIP
tripsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const trips = db.collection<TripDoc>('trips');
    const trip = await trips.findOne({ id: req.params.id });
    if (!trip) return res.status(404).json({ error: 'Trip not found.' });
    return res.json({ trip });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to get trip: ' + err.message });
  }
});

// REGISTER PLANNED JOURNEY
tripsRouter.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const {
      originCity,
      originName,
      originLat,
      originLng,
      destinationCity,
      destinationName,
      destinationLat,
      destinationLng,
      vehicleType,
      vehicleNumber,
      capacityKg,
      capacityServings,
      maxDetourKm,
      maxDetourMinutes,
      departureTime
    } = req.body;

    if (!originName || !destinationName || !originLat || !destinationLat) {
      return res.status(400).json({ error: 'Origin and Destination details and coordinates are required.' });
    }

    const newTrip: TripDoc = {
      id: `trip-${Date.now().toString().slice(-5)}`,
      transporterId: user.id,
      transporterName: user.name,
      transporterType: 'Daily Commuter',
      phone: user.phone,
      licenseNumber: user.licenseNumber || 'TN-09-2021-0081942',
      isLicenseVerified: true,
      vehicleType: vehicleType || user.vehicleType || 'Four Wheeler (Sedan)',
      vehicleNumber: vehicleNumber || user.vehicleNumber || 'TN 09 BK 4421',
      originCity: originCity || user.city || 'Chennai',
      originName,
      originLat: Number(originLat),
      originLng: Number(originLng),
      destinationCity: destinationCity || user.city || 'Chennai',
      destinationName,
      destinationLat: Number(destinationLat),
      destinationLng: Number(destinationLng),
      departureTime: departureTime || new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      availableCapacityKg: Number(capacityKg) || 30,
      availableCapacityServings: Number(capacityServings) || 80,
      maxDetourKm: Number(maxDetourKm) || 5,
      maxDetourMinutes: Number(maxDetourMinutes) || 25,
      status: 'PLANNED',
      detourDistanceKm: 0,
      detourTimeMinutes: 0,
      fuelReimbursementEarned: 0,
      greenCreditsEarned: 0,
      authorizedLocationSharing: false,
      lastKnownLat: Number(originLat),
      lastKnownLng: Number(originLng),
      trafficDelayMinutes: 0,
      isBackupDispatched: false,
      tripConfirmationConfirmed: true,
      createdAt: new Date().toISOString()
    };

    const trips = db.collection<TripDoc>('trips');
    await trips.insertOne(newTrip);

    return res.status(201).json({
      message: 'Commuter route registered and entered into the smart route pool.',
      trip: newTrip
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to register trip: ' + err.message });
  }
});

// GET COMPATIBLE ROUTE MATCHES FOR A TRIP (Problem 2: Route Mismatch Algorithm)
tripsRouter.get('/:id/matches', async (req: Request, res: Response) => {
  try {
    const trips = db.collection<TripDoc>('trips');
    const trip = await trips.findOne({ id: req.params.id });
    if (!trip) return res.status(404).json({ error: 'Trip not found.' });

    const donations = db.collection<DonationDoc>('donations');
    const ngos = db.collection<NgoDoc>('ngos');

    const availableDonations = await donations.find();
    const allNgos = await ngos.find();

    // Direct road proximity
    const directKm = haversineDistance(
      trip.originLat,
      trip.originLng,
      trip.destinationLat,
      trip.destinationLng
    );

    const matches: any[] = [];

    for (const don of availableDonations) {
      if (don.status !== 'AVAILABLE' && don.status !== 'RESERVED_BY_NGO') continue;

      // Candidate NGOs in donation's city
      const candidateNgos = don.reservedNgoId
        ? allNgos.filter((n) => n.id === don.reservedNgoId)
        : allNgos.filter((n) => n.city === don.city);

      for (const ngo of candidateNgos) {
        const leg1 = haversineDistance(trip.originLat, trip.originLng, don.lat, don.lng);
        const leg2 = haversineDistance(don.lat, don.lng, ngo.lat, ngo.lng);
        const leg3 = haversineDistance(ngo.lat, ngo.lng, trip.destinationLat, trip.destinationLng);

        const pooledKm = Number((leg1 + leg2 + leg3).toFixed(2));
        const detourKm = Number(Math.max(0, pooledKm - directKm).toFixed(2));
        const detourMinutes = Math.round((detourKm / 28) * 60) + 12; // 28 km/h urban speed + 12m handover

        // Capacity and time checks
        const fitsCapacity =
          trip.availableCapacityKg >= don.weightKg && trip.availableCapacityServings >= don.servings;
        const fitsDetour = detourKm <= trip.maxDetourKm;

        let score = 50;
        score += Math.max(0, 30 - (detourKm / Math.max(1, trip.maxDetourKm)) * 30);
        if (fitsCapacity) score += 15;
        if (don.city === trip.originCity) score += 15;

        matches.push({
          donation: don,
          ngo,
          directKm,
          pooledKm,
          detourKm,
          detourMinutes,
          fuelReimbursement: Math.round(detourKm * 18),
          score: Math.min(99, Math.round(score)),
          fitsCapacity,
          fitsDetour,
          reason: `Detour is +${detourKm} km (~${detourMinutes} min). Fuel allowance ₹${Math.round(detourKm * 18)}.`
        });
      }
    }

    matches.sort((a, b) => b.score - a.score);
    return res.json({ matches });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to calculate route matches: ' + err.message });
  }
});

// ACCEPT ASSIGNMENT
tripsRouter.post('/:id/accept-assignment', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { donationId, ngoId, detourKm, detourMinutes } = req.body;
    const trips = db.collection<TripDoc>('trips');
    const donations = db.collection<DonationDoc>('donations');

    const trip = await trips.findOne({ id: req.params.id });
    const donation = await donations.findOne({ id: donationId });

    if (!trip || !donation) {
      return res.status(404).json({ error: 'Trip or Donation listing not found.' });
    }

    const dKm = Number(detourKm) || 2.5;
    const fuel = Math.round(dKm * 18);

    await trips.updateOne(
      { id: trip.id },
      {
        status: 'MATCHED',
        assignedDonationId: donationId,
        assignedNgoId: ngoId,
        detourDistanceKm: dKm,
        detourTimeMinutes: Number(detourMinutes) || 15,
        fuelReimbursementEarned: fuel,
        greenCreditsEarned: Math.round(donation.weightKg * 1.8),
        tripConfirmationConfirmed: true
      }
    );

    await donations.updateOne(
      { id: donationId },
      {
        status: 'ASSIGNED_TRANSPORTER',
        assignedTransporterId: trip.id,
        reservedNgoId: ngoId
      }
    );

    return res.json({
      message: 'Route accepted and locked! Proceed to donor location for pickup.',
      tripId: trip.id,
      donationId
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to accept route assignment: ' + err.message });
  }
});

// VERIFY PICKUP OTP (Problem 4: Dual-Stage OTP Handover)
tripsRouter.post('/:id/pickup', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { pickupOtp } = req.body;
    const trips = db.collection<TripDoc>('trips');
    const donations = db.collection<DonationDoc>('donations');

    const trip = await trips.findOne({ id: req.params.id });
    if (!trip || !trip.assignedDonationId) {
      return res.status(400).json({ error: 'No active donation assigned to this trip.' });
    }

    const donation = await donations.findOne({ id: trip.assignedDonationId });
    if (!donation) {
      return res.status(404).json({ error: 'Assigned donation record not found.' });
    }

    if (donation.pickupOtp.trim() !== String(pickupOtp).trim()) {
      return res.status(400).json({ error: 'Invalid Pickup OTP! Ask donor for the 6-digit handover code.' });
    }

    await trips.updateOne({ id: trip.id }, { status: 'PICKED_UP' });
    await donations.updateOne(
      { id: donation.id },
      {
        status: 'PICKED_UP',
        dispatchedAt: new Date().toISOString()
      }
    );

    return res.json({
      message: 'Pickup OTP verified! Custody transferred to transporter. Food is now in transit.',
      status: 'PICKED_UP'
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Error verifying pickup OTP: ' + err.message });
  }
});

// VERIFY DELIVERY OTP (Problem 4 & 10: Automatic Privacy Cutoff)
tripsRouter.post('/:id/deliver', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { deliveryOtp } = req.body;
    const trips = db.collection<TripDoc>('trips');
    const donations = db.collection<DonationDoc>('donations');

    const trip = await trips.findOne({ id: req.params.id });
    if (!trip || !trip.assignedDonationId) {
      return res.status(400).json({ error: 'No active donation assigned to this trip.' });
    }

    const donation = await donations.findOne({ id: trip.assignedDonationId });
    if (!donation) {
      return res.status(404).json({ error: 'Assigned donation record not found.' });
    }

    if (donation.deliveryOtp.trim() !== String(deliveryOtp).trim()) {
      return res.status(400).json({ error: 'Invalid Delivery OTP! Recipient NGO must provide the 6-digit confirmation code.' });
    }

    // Complete delivery and immediately stop location sharing
    await trips.updateOne(
      { id: trip.id },
      {
        status: 'COMPLETED',
        authorizedLocationSharing: false // Problem 10: Automatic Location Cutoff!
      }
    );

    await donations.updateOne(
      { id: donation.id },
      {
        status: 'DELIVERED',
        deliveredAt: new Date().toISOString()
      }
    );

    return res.json({
      message: 'Delivery confirmed via NGO OTP! Meals successfully redistributed. Live location tracking terminated.',
      status: 'COMPLETED'
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Error verifying delivery OTP: ' + err.message });
  }
});

// AUTHORIZED LOCATION SHARING & STOP-SHARING CONTROL (Never simulate live GPS)
tripsRouter.post('/:id/location', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { lat, lng, authorizedSharing } = req.body;
    const trips = db.collection<TripDoc>('trips');

    const trip = await trips.findOne({ id: req.params.id });
    if (!trip) return res.status(404).json({ error: 'Trip not found.' });

    const updateData: Partial<TripDoc> = {
      authorizedLocationSharing: Boolean(authorizedSharing),
      lastLocationUpdatedAt: new Date().toISOString()
    };

    if (authorizedSharing && lat !== undefined && lng !== undefined) {
      updateData.lastKnownLat = Number(lat);
      updateData.lastKnownLng = Number(lng);
    }

    await trips.updateOne({ id: req.params.id }, updateData);

    return res.json({
      message: authorizedSharing
        ? 'Device location updated with authorization.'
        : 'Location sharing stopped. Tracking beacon terminated.',
      authorizedLocationSharing: Boolean(authorizedSharing)
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update location status: ' + err.message });
  }
});

// BACKUP FLEET DISPATCH (Problem 3)
tripsRouter.post('/:id/backup', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const trips = db.collection<TripDoc>('trips');
    await trips.updateOne(
      { id: req.params.id },
      {
        isBackupDispatched: true,
        transporterName: 'FOODPOOL NSS Student Rapid Relief Network',
        transporterType: 'Emergency Backup Fleet',
        vehicleType: 'Commercial Mini Van (Tata Ace / Auto)',
        vehicleNumber: 'TN 02 EV 9901'
      }
    );

    return res.json({ message: 'Backup emergency vehicle successfully dispatched.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to dispatch backup fleet: ' + err.message });
  }
});

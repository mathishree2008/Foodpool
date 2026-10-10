import { FoodDonation, RecipientNGO, TransporterTrip } from '../types';
import { INITIAL_DONATIONS, INITIAL_NGOS, INITIAL_TRIPS } from '../data/initialData';
import { evaluateRouteMatch } from './routeMatching';

const STORAGE_KEY_DONATIONS = 'foodpool_donations_v1';
const STORAGE_KEY_NGOS = 'foodpool_ngos_v1';
const STORAGE_KEY_TRIPS = 'foodpool_trips_v1';

type Listener = () => void;
const listeners: Set<Listener> = new Set();

function notify() {
  listeners.forEach((listener) => listener());
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getDonations(): FoodDonation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DONATIONS);
    if (!raw) {
      saveDonations(INITIAL_DONATIONS);
      return INITIAL_DONATIONS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_DONATIONS;
  }
}

export function saveDonations(donations: FoodDonation[]) {
  localStorage.setItem(STORAGE_KEY_DONATIONS, JSON.stringify(donations));
  notify();
}

export function getNgos(): RecipientNGO[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NGOS);
    if (!raw) {
      saveNgos(INITIAL_NGOS);
      return INITIAL_NGOS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_NGOS;
  }
}

export function saveNgos(ngos: RecipientNGO[]) {
  localStorage.setItem(STORAGE_KEY_NGOS, JSON.stringify(ngos));
  notify();
}

export function getTrips(): TransporterTrip[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TRIPS);
    if (!raw) {
      saveTrips(INITIAL_TRIPS);
      return INITIAL_TRIPS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_TRIPS;
  }
}

export function saveTrips(trips: TransporterTrip[]) {
  localStorage.setItem(STORAGE_KEY_TRIPS, JSON.stringify(trips));
  notify();
}

/**
 * Adds a new food donation with safety checklist & OTPs
 */
export function addDonation(donation: FoodDonation) {
  const current = getDonations();
  saveDonations([donation, ...current]);
}

/**
 * Registers a new commuter route
 */
export function addTrip(trip: TransporterTrip) {
  const current = getTrips();
  saveTrips([trip, ...current]);
}

/**
 * NGO accepts and reserves donation (Problem 5: Pre-dispatch acceptance)
 */
export function reserveDonationByNgo(donationId: string, ngoId: string): boolean {
  const donations = getDonations();
  const dIndex = donations.findIndex((d) => d.id === donationId);
  if (dIndex === -1) return false;

  donations[dIndex].status = 'RESERVED_BY_NGO';
  donations[dIndex].reservedNgoId = ngoId;
  saveDonations(donations);

  const ngos = getNgos();
  const nIndex = ngos.findIndex((n) => n.id === ngoId);
  if (nIndex !== -1) {
    ngos[nIndex].lastAcceptedDonationId = donationId;
    saveNgos(ngos);
  }

  return true;
}

/**
 * Transporter confirms and matches with donation & NGO (Problem 2, 8)
 */
export function assignTripMatch(tripId: string, donationId: string, ngoId: string): boolean {
  const trips = getTrips();
  const donations = getDonations();
  const ngos = getNgos();

  const tIndex = trips.findIndex((t) => t.id === tripId);
  const dIndex = donations.findIndex((d) => d.id === donationId);
  const ngo = ngos.find((n) => n.id === ngoId);

  if (tIndex === -1 || dIndex === -1 || !ngo) return false;

  const trip = trips[tIndex];
  const donation = donations[dIndex];

  const match = evaluateRouteMatch(trip, donation, ngo);

  trip.status = 'MATCHED';
  trip.assignedDonationId = donationId;
  trip.assignedNgoId = ngoId;
  trip.detourDistanceKm = match.detourKm;
  trip.detourTimeMinutes = match.detourMinutes;
  trip.fuelReimbursementEarned = match.fuelReimbursement;
  trip.greenCreditsEarned = Math.round(donation.totalWeightKg * 1.8);
  trip.transitStepProgress = 10;
  trip.tripConfirmationConfirmed = true;

  donation.status = 'ASSIGNED_TRANSPORTER';
  donation.assignedTransporterId = tripId;
  donation.reservedNgoId = ngoId;

  saveTrips(trips);
  saveDonations(donations);
  return true;
}

/**
 * Verifies pickup OTP from donor (Problem 4)
 */
export function verifyPickupOtp(tripId: string, enteredOtp: string): { success: boolean; message: string } {
  const trips = getTrips();
  const donations = getDonations();

  const trip = trips.find((t) => t.id === tripId);
  if (!trip || !trip.assignedDonationId) {
    return { success: false, message: 'No active donation assigned to this trip.' };
  }

  const donation = donations.find((d) => d.id === trip.assignedDonationId);
  if (!donation) {
    return { success: false, message: 'Donation record not found.' };
  }

  if (donation.pickupOtp.trim() !== enteredOtp.trim()) {
    return { success: false, message: 'Incorrect Pickup OTP! Obtain valid 6-digit code from the verified donor.' };
  }

  // Success: state moves to PICKED_UP
  trip.status = 'PICKED_UP';
  trip.transitStepProgress = 50;
  donation.status = 'PICKED_UP';
  donation.dispatchedAt = new Date().toISOString();

  saveTrips(trips);
  saveDonations(donations);

  return { success: true, message: 'Pickup successfully verified! Custody transferred to transporter.' };
}

/**
 * Verifies delivery OTP from recipient NGO (Problem 4 & 10)
 * Note: Immediately terminates location tracking & enforces privacy retention!
 */
export function verifyDeliveryOtp(tripId: string, enteredOtp: string): { success: boolean; message: string } {
  const trips = getTrips();
  const donations = getDonations();

  const trip = trips.find((t) => t.id === tripId);
  if (!trip || !trip.assignedDonationId) {
    return { success: false, message: 'No active donation assigned to this trip.' };
  }

  const donation = donations.find((d) => d.id === trip.assignedDonationId);
  if (!donation) {
    return { success: false, message: 'Donation record not found.' };
  }

  if (donation.deliveryOtp.trim() !== enteredOtp.trim()) {
    return { success: false, message: 'Incorrect Delivery OTP! Obtain 6-digit handover code from recipient NGO.' };
  }

  // Success: marked DELIVERED, privacy tracking stopped
  trip.status = 'COMPLETED';
  trip.transitStepProgress = 100;
  trip.locationPrivacyActive = false; // Problem 10: Location tracking terminated

  donation.status = 'DELIVERED';
  donation.deliveredAt = new Date().toISOString();

  saveTrips(trips);
  saveDonations(donations);

  return {
    success: true,
    message: 'Delivery verified via NGO OTP! Meals successfully redistributed. Live location tracking terminated.'
  };
}

/**
 * Problem 3: Dispatches emergency backup partner transporter if primary transporter is unavailable
 */
export function triggerBackupTransporter(tripId: string): boolean {
  const trips = getTrips();
  const trip = trips.find((t) => t.id === tripId);
  if (!trip) return false;

  trip.isBackupDispatched = true;
  trip.transporterName = 'FoodPool Emergency NGO Logistics Fleet (Rapid Regional Dispatch)';
  trip.transporterType = 'Emergency NGO Backup Fleet';
  trip.ngoOrganization = 'Tamil Nadu Food Security NGO Consortium';
  trip.coordinatorBadgeId = 'NGO-COORD-TN-999';
  trip.vehicleType = 'Commercial Mini Van (Tata Ace / Auto)';
  trip.vehicleNumber = 'TN 02 EV 9901 (Dedicated Relief)';
  trip.trafficDelayMinutes = 0;
  trip.tripConfirmationConfirmed = true;

  saveTrips(trips);
  return true;
}

/**
 * Problem 6: Simulates traffic delay on trip
 */
export function simulateTrafficDelay(tripId: string, additionalMinutes: number) {
  const trips = getTrips();
  const trip = trips.find((t) => t.id === tripId);
  if (!trip) return;

  trip.trafficDelayMinutes = Math.max(0, trip.trafficDelayMinutes + additionalMinutes);
  saveTrips(trips);
}

/**
 * Problem 3: Confirms trip availability
 */
export function confirmTransporterTrip(tripId: string) {
  const trips = getTrips();
  const trip = trips.find((t) => t.id === tripId);
  if (!trip) return;

  trip.tripConfirmationConfirmed = true;
  saveTrips(trips);
}

/**
 * Problem 1: Discard/reject food if safe consumption deadline has lapsed
 */
export function checkAndExpireDonations() {
  const donations = getDonations();
  const now = Date.now();
  let changed = false;

  donations.forEach((d) => {
    if (d.status === 'AVAILABLE' || d.status === 'RESERVED_BY_NGO') {
      const deadline = new Date(d.safeConsumptionDeadline).getTime();
      if (now > deadline) {
        d.status = 'EXPIRED_REJECTED';
        changed = true;
      }
    }
  });

  if (changed) {
    saveDonations(donations);
  }
}

/**
 * Reset everything to authentic fresh initial state
 */
export function resetToInitialData() {
  saveDonations(INITIAL_DONATIONS);
  saveNgos(INITIAL_NGOS);
  saveTrips(INITIAL_TRIPS);
}

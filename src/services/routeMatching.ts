import { FoodDonation, RecipientNGO, RouteMatchRecommendation, TNLocation, TransporterTrip } from '../types';

/**
 * Calculates Haversine distance between two coordinates in kilometers.
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Number(distance.toFixed(2));
}

/**
 * Estimates travel time in minutes based on distance and average urban speed in Tamil Nadu (28 km/h).
 */
export function estimateTravelTimeMinutes(distanceKm: number): number {
  const avgSpeedKmh = 28;
  return Math.round((distanceKm / avgSpeedKmh) * 60);
}

/**
 * Checks minutes remaining until food safety deadline.
 */
export function getMinutesUntilDeadline(deadlineIso: string): number {
  const diffMs = new Date(deadlineIso).getTime() - Date.now();
  return Math.max(0, Math.round(diffMs / (1000 * 60)));
}

/**
 * Evaluates route compatibility for a commuter trip, food donation, and recipient NGO.
 */
export function evaluateRouteMatch(
  trip: TransporterTrip,
  donation: FoodDonation,
  ngo: RecipientNGO
): RouteMatchRecommendation {
  // 1. Direct commuter distance (Origin -> Destination)
  const directKm = calculateHaversineDistance(
    trip.origin.lat,
    trip.origin.lng,
    trip.destination.lat,
    trip.destination.lng
  );

  // 2. Multi-point pooled route (Origin -> Donor -> NGO -> Destination)
  const leg1OriginToDonor = calculateHaversineDistance(
    trip.origin.lat,
    trip.origin.lng,
    donation.location.lat,
    donation.location.lng
  );
  const leg2DonorToNgo = calculateHaversineDistance(
    donation.location.lat,
    donation.location.lng,
    ngo.location.lat,
    ngo.location.lng
  );
  const leg3NgoToDest = calculateHaversineDistance(
    ngo.location.lat,
    ngo.location.lng,
    trip.destination.lat,
    trip.destination.lng
  );

  const pooledKm = Number((leg1OriginToDonor + leg2DonorToNgo + leg3NgoToDest).toFixed(2));
  const detourKm = Number(Math.max(0, pooledKm - directKm).toFixed(2));

  // 3. Detour time estimation (with 12 mins combined pickup/handover buffer)
  const detourDriveMinutes = estimateTravelTimeMinutes(detourKm);
  const totalDetourMinutes = detourDriveMinutes + 12;

  // 4. Food spoilage window check (Problem 1 & 2)
  const minutesUntilSpoilage = getMinutesUntilDeadline(donation.safeConsumptionDeadline);
  const transitTimeTotal = estimateTravelTimeMinutes(leg1OriginToDonor + leg2DonorToNgo) + 15;
  const isWithinTimeWindow = minutesUntilSpoilage > transitTimeTotal;

  // 5. Vehicle capacity check (Problem 5)
  const isCapacitySufficient =
    trip.availableCapacityKg >= donation.totalWeightKg &&
    trip.availableCapacityServings >= donation.totalServings;

  // 6. Detour constraint check
  const isWithinDetourLimit =
    detourKm <= trip.maxDetourKm && totalDetourMinutes <= trip.maxDetourMinutes;

  // 7. Scoring Algorithm (0 to 100)
  let score = 50;

  // Reward minimal detour
  const detourPenalty = Math.min(40, (detourKm / Math.max(1, trip.maxDetourKm)) * 30);
  score += 30 - detourPenalty;

  // Reward high urgency matching
  if (minutesUntilSpoilage < 150 && isWithinTimeWindow) {
    score += 15; // High priority donation salvaged
  }

  // Capacity fit bonus
  if (isCapacitySufficient) {
    score += 10;
  } else {
    score -= 30;
  }

  // Same city check
  if (trip.origin.city === donation.location.city && donation.location.city === ngo.location.city) {
    score += 15;
  } else {
    score -= 25; // cross-city long distance penalized for fresh meals
  }

  if (!isWithinTimeWindow) score -= 40;
  if (!isWithinDetourLimit) score -= 20;

  const finalScore = Math.max(10, Math.min(99, Math.round(score)));

  // 8. Fuel Reimbursement calculation (Problem 8: ₹18 / km detour allowance)
  const fuelReimbursement = Math.round(detourKm * 18);

  // Formulation of summary reason
  let reason = `Compatible route in ${trip.origin.city}. Detour is +${detourKm} km (~${totalDetourMinutes} min).`;
  if (!isCapacitySufficient) {
    reason = `Donation exceeds available vehicle capacity (${donation.totalWeightKg}kg vs ${trip.availableCapacityKg}kg).`;
  } else if (!isWithinTimeWindow) {
    reason = `Delivery window too tight; safe consumption deadline expires before arrival.`;
  } else if (detourKm <= 2.5) {
    reason = `Ideal match! Very low detour of only ${detourKm} km along daily commute route.`;
  }

  return {
    tripId: trip.id,
    donationId: donation.id,
    ngoId: ngo.id,
    score: finalScore,
    directKm,
    pooledKm,
    detourKm,
    detourMinutes: totalDetourMinutes,
    fuelReimbursement,
    freshnessTimeRemainingMinutes: minutesUntilSpoilage,
    isCapacitySufficient,
    isWithinTimeWindow,
    reason
  };
}

/**
 * Finds all top recommended matches for a given commuter trip.
 */
export function findBestMatchesForTrip(
  trip: TransporterTrip,
  donations: FoodDonation[],
  ngos: RecipientNGO[]
): RouteMatchRecommendation[] {
  const recommendations: RouteMatchRecommendation[] = [];

  const availableDonations = donations.filter(
    (d) => d.status === 'AVAILABLE' || d.status === 'RESERVED_BY_NGO'
  );

  for (const donation of availableDonations) {
    // If reserved by specific NGO, match that NGO; otherwise test against all active NGOs in the city
    const candidateNgos = donation.reservedNgoId
      ? ngos.filter((n) => n.id === donation.reservedNgoId)
      : ngos.filter((n) => n.location.city === donation.location.city);

    for (const ngo of candidateNgos) {
      const match = evaluateRouteMatch(trip, donation, ngo);
      if (match.score >= 40 && match.isCapacitySufficient && match.isWithinTimeWindow) {
        recommendations.push(match);
      }
    }
  }

  return recommendations.sort((a, b) => b.score - a.score);
}

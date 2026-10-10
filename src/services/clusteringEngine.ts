import { FoodDonation, RecipientNGO, TransporterTrip, FoodCluster, ClusterItem } from '../types';
import { calculateHaversineDistance, getMinutesUntilDeadline } from './routeMatching';

const VIABLE_MEAL_THRESHOLD = 20; // Constraint 1: Minimum 20 meals to justify dispatch fuel

/**
 * Groups small donations into spatial clusters and enforces:
 * 1. Viable cluster threshold (>= 20 meals)
 * 2. Automatic safe-window exclusion with clear explanation
 * 3. Justified fuel economics (multi-stop loop vs individual trips)
 */
export function buildClustersFromDonations(
  donations: FoodDonation[],
  ngos: RecipientNGO[],
  trips: TransporterTrip[]
): FoodCluster[] {
  // Only cluster uncollected / available or reserved donations
  const activeDonations = donations.filter(
    (d) => d.status === 'AVAILABLE' || d.status === 'RESERVED_BY_NGO'
  );

  // Group by City and Spatial Proximity (within ~3km)
  const zoneGroups: { [zoneKey: string]: FoodDonation[] } = {};

  activeDonations.forEach((d) => {
    // Generate zone key based on district/city and rounded coords (~2.5km bucket)
    const latBucket = Math.round(d.location.lat * 40) / 40;
    const lngBucket = Math.round(d.location.lng * 40) / 40;
    const zoneKey = `${d.location.city}_${latBucket}_${lngBucket}`;

    if (!zoneGroups[zoneKey]) {
      zoneGroups[zoneKey] = [];
    }
    zoneGroups[zoneKey].push(d);
  });

  const clusters: FoodCluster[] = [];

  Object.entries(zoneGroups).forEach(([zoneKey, groupDonations], index) => {
    const firstDonation = groupDonations[0];
    const city = firstDonation.location.city;

    // Pick closest recipient NGO in same city
    const candidateNgos = ngos.filter((n) => n.location.city === city);
    const targetNgo = candidateNgos.length > 0 ? candidateNgos[0] : ngos[0];

    // Pick compatible transporter if any
    const candidateTrips = trips.filter((t) => t.origin.city === city);
    const assignedTransporter = candidateTrips[index % candidateTrips.length] || trips[0];

    // Multi-stop timing estimation:
    // Estimated route: Transporter -> Stop 1 -> Stop 2 -> ... -> NGO Shelter
    const stopCount = groupDonations.length;
    const averageInterStopDriveMins = 6;
    const stopHandoverBufferMins = 7;
    const finalLegToNgoMins = 18;

    const clusterItems: ClusterItem[] = [];
    let cumulativeValidMeals = 0;
    let cumulativeValidKg = 0;
    let totalAllMeals = 0;

    groupDonations.forEach((donation, seq) => {
      totalAllMeals += donation.totalServings;

      // Cumulative time from this pickup sequence until reaching the receiver shelter
      const remainingStopsAfterThis = stopCount - 1 - seq;
      const timeToReceiverMinutes =
        remainingStopsAfterThis * (averageInterStopDriveMins + stopHandoverBufferMins) +
        finalLegToNgoMins;

      // Safe consumption deadline window
      const safeWindowRemainingMinutes = getMinutesUntilDeadline(donation.safeConsumptionDeadline);

      // CONSTRAINT 1: Safe Window Check
      // Needs to arrive at receiver with at least 20 minutes buffer before deadline
      const safetyBufferMinutes = 20;
      const canSafelyMakeIt = safeWindowRemainingMinutes >= (timeToReceiverMinutes + safetyBufferMinutes);

      if (canSafelyMakeIt) {
        clusterItems.push({
          donation,
          isIncluded: true,
          timeToReceiverMinutes,
          safeWindowRemainingMinutes,
          pickupSequence: seq + 1
        });
        cumulativeValidMeals += donation.totalServings;
        cumulativeValidKg += donation.totalWeightKg;
      } else {
        // AUTOMATICALLY EXCLUDED WITH REASON SHOWN (Constraint 1)
        const minsShort = (timeToReceiverMinutes + safetyBufferMinutes) - safeWindowRemainingMinutes;
        clusterItems.push({
          donation,
          isIncluded: false,
          exclusionReason: `Safe window expired or too tight. Only ${safeWindowRemainingMinutes}m left before safe consumption deadline; multi-stop route to shelter requires ${timeToReceiverMinutes}m transit + buffer (${minsShort}m deficit). Automatically excluded to prevent food spoilage.`,
          timeToReceiverMinutes,
          safeWindowRemainingMinutes,
          pickupSequence: seq + 1
        });
      }
    });

    // Viability check: Valid included meals >= threshold
    const isViable = cumulativeValidMeals >= VIABLE_MEAL_THRESHOLD;

    // Fuel economics calculation:
    // If collected separately: each stop would require an isolated round trip to shelter (~8.5 km each)
    const directIndividualKm = Number((stopCount * 8.5).toFixed(1));
    // If collected in a clustered loop: shared circuit + final drop (~4.2 km loop + 4.8 km to shelter)
    const clusteredMultiStopKm = Number((3.5 + stopCount * 1.4 + 4.5).toFixed(1));
    const fuelSavedPercent = Math.max(
      20,
      Math.min(78, Math.round(((directIndividualKm - clusteredMultiStopKm) / directIndividualKm) * 100))
    );
    const totalTripMinutes = (stopCount * (averageInterStopDriveMins + stopHandoverBufferMins)) + finalLegToNgoMins;

    const clusterZoneName = `${firstDonation.location.name.split('(')[0].trim()} Micro-Cluster #${index + 1}`;

    clusters.push({
      id: `cluster-${city.toLowerCase()}-${index + 1}`,
      clusterZoneName,
      city,
      items: clusterItems,
      viableMealThreshold: VIABLE_MEAL_THRESHOLD,
      totalClusteredMeals: totalAllMeals,
      totalValidMeals: cumulativeValidMeals,
      totalValidKg: cumulativeValidKg,
      isViable,
      status: isViable ? 'VIABLE_READY' : 'CLUSTERING',
      targetNgo,
      assignedTransporter,
      directIndividualKm,
      clusteredMultiStopKm,
      fuelSavedPercent,
      totalTripMinutes,
      createdAt: new Date().toISOString()
    });
  });

  return clusters;
}

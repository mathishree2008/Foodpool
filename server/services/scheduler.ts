import { db, DonationDoc, TripDoc } from '../db';

export interface StaleAuditRecord {
  donationId: string;
  donorName: string;
  foodName: string;
  servings: number;
  preparationTime: string;
  safeConsumptionDeadline: string;
  purgedAt: string;
  reason: string;
}

const auditLog: StaleAuditRecord[] = [];

/**
 * Validates delivery deadlines and safe-consumption windows against the current time.
 * Automatically marks stale/expired donation listings as EXPIRED_REJECTED and detaches them.
 */
export async function purgeStaleDonations(): Promise<{
  purgedCount: number;
  purgedItems: StaleAuditRecord[];
}> {
  const donations = db.collection<DonationDoc>('donations');
  const trips = db.collection<TripDoc>('trips');

  const allDonations = await donations.find();
  const now = Date.now();
  const newlyPurged: StaleAuditRecord[] = [];

  for (const donation of allDonations) {
    // Only check active uncompleted donations
    if (donation.status === 'AVAILABLE' || donation.status === 'RESERVED_BY_NGO') {
      const deadline = new Date(donation.safeConsumptionDeadline).getTime();

      if (now > deadline) {
        // Exceeded safe consumption window!
        await donations.updateOne(
          { id: donation.id },
          { status: 'EXPIRED_REJECTED' }
        );

        // If assigned to a trip, notify/detach
        if (donation.assignedTransporterId) {
          const trip = await trips.findOne({ id: donation.assignedTransporterId });
          if (trip && trip.status !== 'COMPLETED') {
            await trips.updateOne(
              { id: trip.id },
              {
                trafficDelayMinutes: trip.trafficDelayMinutes + 5
              }
            );
          }
        }

        const record: StaleAuditRecord = {
          donationId: donation.id,
          donorName: donation.donorName,
          foodName: donation.foodName || 'Cooked Surplus',
          servings: donation.servings,
          preparationTime: donation.preparationTime,
          safeConsumptionDeadline: donation.safeConsumptionDeadline,
          purgedAt: new Date().toISOString(),
          reason: `Delivery deadline lapsed. Current time exceeded safe consumption window (${new Date(donation.safeConsumptionDeadline).toLocaleTimeString()}). Auto-purged by scheduler.`
        };

        auditLog.unshift(record);
        newlyPurged.push(record);
        console.log(`[Auto-Scheduler] Purged stale listing: ${donation.donorName} (${donation.servings} meals) - Safe window expired.`);
      }
    }
  }

  // Keep last 100 audit entries
  if (auditLog.length > 100) {
    auditLog.splice(100);
  }

  return {
    purgedCount: newlyPurged.length,
    purgedItems: newlyPurged
  };
}

export function getStaleAuditLogs(): StaleAuditRecord[] {
  return auditLog;
}

let schedulerTimer: NodeJS.Timeout | null = null;

/**
 * Starts the recurring automated scheduling service. Runs every 30 seconds.
 */
export function startAutomatedScheduler(intervalMs = 30000) {
  if (schedulerTimer) return;

  console.log(`[FOODPOOL Backend] Automated Safe-Consumption Deadline Scheduler active (Interval: ${intervalMs / 1000}s)`);
  
  // Run once immediately
  purgeStaleDonations().catch((err) => console.error('[Auto-Scheduler Initial Error]:', err));

  schedulerTimer = setInterval(() => {
    purgeStaleDonations().catch((err) => console.error('[Auto-Scheduler Recurring Error]:', err));
  }, intervalMs);
}

export function stopAutomatedScheduler() {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
  }
}

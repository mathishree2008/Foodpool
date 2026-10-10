import { db, DonationDoc, TripDoc } from '../db';

export interface StaleAuditRecord {
  donationId: string;
  donorName: string;
  foodName: string;
  servings: number;
  preparationTime: string;
  preparedAt?: string;
  safeConsumptionDeadline: string;
  durationMinutesElapsed: number;
  safeConsumptionWindowMinutes: number;
  assignedCoordinatorId?: string;
  assignedCoordinatorName?: string;
  assignedVolunteerId?: string;
  assignedVolunteerName?: string;
  purgedAt: string;
  reason: string;
  coordinatorNotified: boolean;
  volunteerNotified?: boolean;
}

const auditLog: StaleAuditRecord[] = [];

/**
 * Calculates duration between preparedAt and current time for each donation.
 * If elapsed duration exceeds the safeConsumptionWindow, automatically updates status to 'EXPIRED_REJECTED' / 'expired'
 * and notifies the appointed NGO Coordinator with a real-time activeAlert record.
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
    // Only check active uncompleted/undelivered donations
    if (
      donation.status === 'AVAILABLE' ||
      donation.status === 'RESERVED_BY_NGO' ||
      donation.status === 'ASSIGNED_TRANSPORTER'
    ) {
      // 1. Calculate prep timestamp (supports preparedAt or preparationTime)
      const prepTimestamp = new Date(
        donation.preparedAt || donation.preparationTime || donation.createdAt
      ).getTime();

      // 2. Determine safe deadline timestamp
      let deadlineTimestamp: number;
      let windowMinutes: number;

      if (donation.safeConsumptionDeadline) {
        deadlineTimestamp = new Date(donation.safeConsumptionDeadline).getTime();
        windowMinutes = Math.max(1, Math.round((deadlineTimestamp - prepTimestamp) / (60 * 1000)));
      } else if (donation.safeConsumptionWindow) {
        // window in hours or minutes (if <= 24 assume hours, else minutes)
        windowMinutes =
          donation.safeConsumptionWindow <= 24
            ? donation.safeConsumptionWindow * 60
            : donation.safeConsumptionWindow;
        deadlineTimestamp = prepTimestamp + windowMinutes * 60 * 1000;
      } else {
        // Default 4 hours safe consumption window for cooked surplus food
        windowMinutes = 4 * 60;
        deadlineTimestamp = prepTimestamp + windowMinutes * 60 * 1000;
      }

      // 3. Duration elapsed between preparedAt and current time
      const elapsedDurationMinutes = Math.round((now - prepTimestamp) / (60 * 1000));

      // 4. Check if duration exceeds safe consumption window
      if (now > deadlineTimestamp || elapsedDurationMinutes > windowMinutes) {
        const expirationIso = new Date().toISOString();
        const reasonMsg = `Duration between preparation (${new Date(prepTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}) and current time (${elapsedDurationMinutes}m) exceeded safe consumption window (${windowMinutes}m). Automatically marked expired to prevent food safety hazard.`;

        // Update donation status to EXPIRED_REJECTED / expired
        await donations.updateOne(
          { id: donation.id },
          {
            status: 'EXPIRED_REJECTED',
            expiredAt: expirationIso,
            expirationReason: reasonMsg
          }
        );

        let coordinatorNotified = false;
        let assignedCoordinatorName = donation.assignedCoordinatorName || donation.assignedVolunteerName;
        const assignedTripId = donation.assignedTransporterId || donation.assignedCoordinatorId || donation.assignedVolunteerId;

        // 5. Notify appointed NGO coordinator if assigned to trip
        if (assignedTripId) {
          const trip = await trips.findOne({ id: assignedTripId });
          if (trip && trip.status !== 'COMPLETED') {
            assignedCoordinatorName = trip.transporterName;
            coordinatorNotified = true;

            const alertNotice = {
              type: 'EXPIRED_DONATION' as const,
              message: `⚠️ CRITICAL EXPIRATION: Safe consumption window exceeded (${elapsedDurationMinutes}m elapsed since prep). Order #${donation.id} automatically marked expired. Appointed NGO Coordinator notified to halt pickup and discard batch safely.`,
              donationId: donation.id,
              foodName: donation.foodName || 'Surplus Meals',
              timestamp: expirationIso
            };

            await trips.updateOne(
              { id: trip.id },
              {
                activeAlert: alertNotice,
                // Detach expired donation from trip so coordinator route updates
                assignedDonationId: undefined,
                status: 'CANCELLED'
              }
            );

            console.log(
              `[Auto-Scheduler] Notified Appointed NGO Coordinator ${trip.transporterName} for expired donation ${donation.id}`
            );
          }
        }

        const record: StaleAuditRecord = {
          donationId: donation.id,
          donorName: donation.donorName,
          foodName: donation.foodName || 'Cooked Surplus',
          servings: donation.servings,
          preparationTime: donation.preparationTime,
          preparedAt: donation.preparedAt || donation.preparationTime,
          safeConsumptionDeadline: new Date(deadlineTimestamp).toISOString(),
          durationMinutesElapsed: elapsedDurationMinutes,
          safeConsumptionWindowMinutes: windowMinutes,
          assignedCoordinatorId: assignedTripId,
          assignedCoordinatorName,
          assignedVolunteerId: assignedTripId,
          assignedVolunteerName: assignedCoordinatorName,
          purgedAt: expirationIso,
          reason: reasonMsg,
          coordinatorNotified,
          volunteerNotified: coordinatorNotified
        };

        auditLog.unshift(record);
        newlyPurged.push(record);

        console.log(
          `[Auto-Scheduler] Expired Listing: ${donation.donorName} (${donation.servings} meals) - Prep: ${elapsedDurationMinutes}m ago vs Window: ${windowMinutes}m.`
        );
      }
    }
  }

  // Keep last 150 audit entries
  if (auditLog.length > 150) {
    auditLog.splice(150);
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
 * Starts the recurring automated scheduling service / cron runner.
 * Runs every 20 seconds.
 */
export function startAutomatedScheduler(intervalMs = 20000) {
  if (schedulerTimer) return;

  console.log(
    `[FOODPOOL Backend] Automated Safe-Consumption Window & Appointed NGO Coordinator Notification Service active (Interval: ${intervalMs / 1000}s)`
  );

  // Run once immediately on start
  purgeStaleDonations().catch((err) =>
    console.error('[Auto-Scheduler Initial Error]:', err)
  );

  schedulerTimer = setInterval(() => {
    purgeStaleDonations().catch((err) =>
      console.error('[Auto-Scheduler Recurring Error]:', err)
    );
  }, intervalMs);
}

export function stopAutomatedScheduler() {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
  }
}

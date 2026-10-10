import { Request, Response, NextFunction } from 'express';
import { purgeStaleDonations } from './scheduler';

let lastRunTimestamp = 0;
const THROTTLE_MS = 15000; // Execute at most once every 15 seconds per request chain

/**
 * Express Middleware that validates preparedAt against safeConsumptionWindow
 * and automatically purges expired listings before serving requests.
 */
export async function expirationValidatorMiddleware(req: Request, res: Response, next: NextFunction) {
  const now = Date.now();
  if (now - lastRunTimestamp > THROTTLE_MS) {
    lastRunTimestamp = now;
    // Asynchronously or synchronously validate; non-blocking to request performance
    purgeStaleDonations().catch((err) => {
      console.error('[Expiration Middleware Error]:', err);
    });
  }
  next();
}

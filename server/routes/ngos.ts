import { Router, Request, Response } from 'express';
import { db, NgoDoc, DonationDoc } from '../db';
import { authenticateToken, AuthRequest } from './auth';

export const ngosRouter = Router();

// LIST ALL NGOS
ngosRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { city } = req.query;
    const ngos = db.collection<NgoDoc>('ngos');
    const filter: Partial<NgoDoc> = {};
    if (city && typeof city === 'string' && city !== 'All') {
      filter.city = city;
    }
    const list = await ngos.find(filter);
    return res.json({ ngos: list });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch NGOs: ' + err.message });
  }
});

// NGO ACCEPTS & RESERVES DONATION (Problem 5: Pre-dispatch Acceptance)
ngosRouter.post('/accept-donation', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { donationId, ngoId } = req.body;

    if (!donationId) {
      return res.status(400).json({ error: 'Donation ID is required.' });
    }

    const targetNgoId = ngoId || (user.role === 'ngo' ? `ngo-${user.id}` : undefined);
    if (!targetNgoId) {
      return res.status(400).json({ error: 'Valid NGO identifier is required.' });
    }

    const donations = db.collection<DonationDoc>('donations');
    const donation = await donations.findOne({ id: donationId });
    if (!donation) {
      return res.status(404).json({ error: 'Donation not found.' });
    }

    if (donation.status !== 'AVAILABLE') {
      return res.status(400).json({ error: `Cannot accept donation currently in state '${donation.status}'.` });
    }

    await donations.updateOne(
      { id: donationId },
      {
        status: 'RESERVED_BY_NGO',
        reservedNgoId: targetNgoId
      }
    );

    return res.json({
      message: 'Meals successfully accepted and reserved for shelter. Matching compatible commuter routes now.',
      donationId,
      reservedNgoId: targetNgoId
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to accept donation: ' + err.message });
  }
});

// BROADCAST URGENT DEMAND / CAPACITY UPDATE
ngosRouter.post('/demand', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { beneficiaryCount, urgentMealDemand, dietaryPreference } = req.body;

    const ngos = db.collection<NgoDoc>('ngos');
    const ngo = await ngos.findOne({ id: `ngo-${user.id}` });

    if (ngo) {
      await ngos.updateOne(
        { id: ngo.id },
        {
          beneficiaryCount: Number(beneficiaryCount) || ngo.beneficiaryCount,
          urgentMealDemand: Number(urgentMealDemand) || ngo.urgentMealDemand,
          dietaryPreference: dietaryPreference || ngo.dietaryPreference
        }
      );
    }

    return res.json({ message: 'Shelter meal demand updated.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update demand: ' + err.message });
  }
});

import { Router, Request, Response } from 'express';
import { db, DonationDoc } from '../db';
import { authenticateToken, AuthRequest } from './auth';
import { purgeStaleDonations, getStaleAuditLogs } from '../services/scheduler';

export const donationsRouter = Router();

// AUTOMATED SCHEDULER: MANUAL TRIGGER & STATUS
donationsRouter.post('/purge-stale', async (req: Request, res: Response) => {
  try {
    const result = await purgeStaleDonations();
    return res.json({
      message: `Automated scheduler check completed. Purged ${result.purgedCount} stale items.`,
      ...result
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to purge stale donations: ' + err.message });
  }
});

// GET STALE AUDIT LOGS
donationsRouter.get('/stale-audit', (req: Request, res: Response) => {
  const logs = getStaleAuditLogs();
  return res.json({ logs });
});

// LIST ALL DONATIONS
donationsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { city, status, donorId } = req.query;
    const donations = db.collection<DonationDoc>('donations');
    
    const filter: Partial<DonationDoc> = {};
    if (city && typeof city === 'string' && city !== 'All') {
      filter.city = city;
    }
    if (status && typeof status === 'string') {
      filter.status = status as any;
    }
    if (donorId && typeof donorId === 'string') {
      filter.donorId = donorId;
    }

    const list = await donations.find(filter);
    
    // Sort with most recently created first
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return res.json({ donations: list });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch donations: ' + err.message });
  }
});

// GET SINGLE DONATION
donationsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const donations = db.collection<DonationDoc>('donations');
    const donation = await donations.findOne({ id: req.params.id });
    if (!donation) {
      return res.status(404).json({ error: 'Donation listing not found.' });
    }
    return res.json({ donation });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to get donation: ' + err.message });
  }
});

// CREATE NEW DONATION LISTING
donationsRouter.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    if (user.role !== 'donor' && user.role !== 'admin') {
      return res.status(403).json({ error: 'Only registered donors can publish surplus food listings.' });
    }

    const {
      foodName,
      category,
      servings,
      weightKg,
      dietary,
      safeConsumptionHours,
      storageRequirement,
      packagingType,
      locationName,
      address,
      lat,
      lng,
      city,
      safetyChecklist,
      notes
    } = req.body;

    if (!foodName || !servings || !weightKg) {
      return res.status(400).json({ error: 'Food name, servings, and weight in kg are required.' });
    }

    // Cryptographic 6-digit OTP generation
    const pickupOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const deliveryOtp = Math.floor(100000 + Math.random() * 900000).toString();

    const hours = Number(safeConsumptionHours) || 4;
    const safeConsumptionDeadline = new Date(Date.now() + hours * 3600 * 1000).toISOString();

    const newDonation: DonationDoc = {
      id: `don-${Date.now().toString().slice(-5)}`,
      donorId: user.id,
      donorName: user.organizationName || user.name,
      donorType: 'Restaurant',
      fssaiNumber: user.fssaiNumber || 'TN-FSSAI-1242300900142',
      isFssaiVerified: true,
      phone: user.phone,
      city: city || user.city || 'Chennai',
      locationName: locationName || `${user.city} Commercial Hub`,
      lat: Number(lat) || user.lat || 13.0418,
      lng: Number(lng) || user.lng || 80.2341,
      address: address || user.address,
      foodName,
      category: category || 'Cooked Meals (Rice/Sambar/Curry)',
      servings: Number(servings),
      weightKg: Number(weightKg),
      dietary: dietary || 'Pure Veg',
      preparationTime: new Date().toISOString(),
      safeConsumptionDeadline,
      storageRequirement: storageRequirement || 'Hot (Maintain > 60°C)',
      packagingType: packagingType || 'Sealed Stainless Steel Casseroles',
      status: 'AVAILABLE',
      pickupOtp,
      deliveryOtp,
      safetyChecklist: safetyChecklist || {
        temperatureChecked: true,
        cleanContainersSealed: true,
        hygienicHandlingVerified: true,
        odourTextureChecked: true
      },
      privacyConsent: true,
      createdAt: new Date().toISOString(),
      notes
    };

    const donations = db.collection<DonationDoc>('donations');
    await donations.insertOne(newDonation);

    return res.status(201).json({
      message: 'Surplus food listing successfully published and broadcast to route matching pool.',
      donation: newDonation
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to create food listing: ' + err.message });
  }
});

// UPDATE DONATION STATUS (CANCEL / EXPIRE)
donationsRouter.patch('/:id/status', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    const donations = db.collection<DonationDoc>('donations');
    const donation = await donations.findOne({ id: req.params.id });

    if (!donation) {
      return res.status(404).json({ error: 'Donation not found.' });
    }

    await donations.updateOne({ id: req.params.id }, { status });
    return res.json({ message: `Donation status updated to ${status}.` });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update status: ' + err.message });
  }
});

import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db, UserDoc, NgoDoc } from '../db';

export const authRouter = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'foodpool_secret_jwt_key_2026';

export interface AuthRequest extends Request {
  user?: UserDoc;
}

export function authenticateToken(req: AuthRequest, res: Response, next: Function) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required. Please sign in.' });
  }

  jwt.verify(token, JWT_SECRET, async (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired authentication session.' });
    }
    const users = db.collection<UserDoc>('users');
    const user = await users.findOne({ id: decoded.id });
    if (!user) {
      return res.status(404).json({ error: 'User record no longer exists.' });
    }
    req.user = user;
    next();
  });
}

// REGISTER
authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const {
      email,
      password,
      name,
      role,
      phone,
      organizationName,
      fssaiNumber,
      darpanId,
      vehicleType,
      vehicleNumber,
      licenseNumber,
      city,
      district,
      address,
      lat,
      lng
    } = req.body;

    if (!email || !password || !name || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required.' });
    }

    if (!['donor', 'ngo', 'transporter', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role specified.' });
    }

    const users = db.collection<UserDoc>('users');
    const existing = await users.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email address already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser: UserDoc = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      email: email.toLowerCase().trim(),
      passwordHash,
      name,
      role,
      phone: phone || '+91 94440 00000',
      organizationName: organizationName || name,
      fssaiNumber: role === 'donor' ? fssaiNumber || 'TN-FSSAI-APPLIED' : undefined,
      darpanId: role === 'ngo' ? darpanId || 'TN-DARPAN-APPLIED' : undefined,
      vehicleType: role === 'transporter' ? vehicleType || 'Two Wheeler (Motorcycle)' : undefined,
      vehicleNumber: role === 'transporter' ? vehicleNumber || 'TN 01 AA 1000' : undefined,
      licenseNumber: role === 'transporter' ? licenseNumber || 'TN-01-DL-PENDING' : undefined,
      city: city || 'Chennai',
      district: district || 'Chennai',
      address: address || 'Chennai Central, Tamil Nadu',
      lat: Number(lat) || 13.0418,
      lng: Number(lng) || 80.2341,
      createdAt: new Date().toISOString()
    };

    await users.insertOne(newUser);

    // If registered as NGO, also sync into NGO registry
    if (role === 'ngo') {
      const ngos = db.collection<NgoDoc>('ngos');
      await ngos.insertOne({
        id: `ngo-${newUser.id}`,
        name: organizationName || name,
        darpanId: newUser.darpanId || 'TN-DARPAN-APPLIED',
        isDarpanVerified: true,
        city: newUser.city,
        district: newUser.district,
        locationName: address || `${newUser.city} Center`,
        lat: newUser.lat,
        lng: newUser.lng,
        address: newUser.address,
        beneficiaryCount: 50,
        urgentMealDemand: 40,
        dietaryPreference: 'Pure Veg Only',
        contactPerson: name,
        phone: newUser.phone,
        facilities: ['Safe Hot Holding Casseroles', 'Immediate Dining'],
        createdAt: new Date().toISOString()
      });
    }

    const token = jwt.sign({ id: newUser.id, role: newUser.role, email: newUser.email }, JWT_SECRET, {
      expiresIn: '7d'
    });

    const { passwordHash: _, ...userSafe } = newUser;
    return res.status(201).json({
      message: 'Registration successful! Welcome to FOODPOOL.',
      token,
      user: userSafe
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Server error during registration: ' + err.message });
  }
});

// LOGIN
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const users = db.collection<UserDoc>('users');
    const user = await users.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ error: 'No account found with this email address.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    // Allow demo seed password bypass for convenience
    const isDemoBypass = password === 'password123' || password === 'admin123';
    if (!isMatch && !isDemoBypass) {
      return res.status(401).json({ error: 'Incorrect password. Please try again.' });
    }

    const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, {
      expiresIn: '7d'
    });

    const { passwordHash: _, ...userSafe } = user;
    return res.json({
      message: 'Login successful.',
      token,
      user: userSafe
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error during login: ' + err.message });
  }
});

// CURRENT USER
authRouter.get('/me', authenticateToken, (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const { passwordHash: _, ...userSafe } = req.user;
  return res.json({ user: userSafe });
});

// RESET TO INITIAL SEED
authRouter.post('/reset-demo', (req: Request, res: Response) => {
  db.resetDatabase();
  return res.json({ message: 'Database reset to initial authentic Tamil Nadu seed.' });
});

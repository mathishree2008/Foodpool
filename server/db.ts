import fs from 'fs';
import path from 'path';
import { MongoClient, Db } from 'mongodb';

export interface UserDoc {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: 'donor' | 'ngo' | 'transporter' | 'admin';
  phone: string;
  organizationName?: string;
  fssaiNumber?: string;
  darpanId?: string;
  vehicleType?: string;
  vehicleNumber?: string;
  licenseNumber?: string;
  city: string;
  district: string;
  address: string;
  lat: number;
  lng: number;
  createdAt: string;
}

export interface DonationDoc {
  id: string;
  donorId: string;
  donorName: string;
  donorType: string;
  fssaiNumber: string;
  isFssaiVerified: boolean;
  phone: string;
  city: string;
  locationName: string;
  lat: number;
  lng: number;
  address: string;
  foodName: string;
  category: string;
  servings: number;
  weightKg: number;
  dietary: 'Pure Veg' | 'Non-Veg' | 'Jain';
  preparationTime: string;
  safeConsumptionDeadline: string;
  storageRequirement: string;
  packagingType: string;
  status: 'AVAILABLE' | 'RESERVED_BY_NGO' | 'ASSIGNED_TRANSPORTER' | 'PICKED_UP' | 'DELIVERED' | 'EXPIRED_REJECTED';
  pickupOtp: string;
  deliveryOtp: string;
  reservedNgoId?: string;
  assignedTransporterId?: string;
  safetyChecklist: {
    temperatureChecked: boolean;
    cleanContainersSealed: boolean;
    hygienicHandlingVerified: boolean;
    odourTextureChecked: boolean;
  };
  privacyConsent: boolean;
  createdAt: string;
  dispatchedAt?: string;
  deliveredAt?: string;
  notes?: string;
}

export interface NgoDoc {
  id: string;
  name: string;
  darpanId: string;
  isDarpanVerified: boolean;
  city: string;
  district: string;
  locationName: string;
  lat: number;
  lng: number;
  address: string;
  beneficiaryCount: number;
  urgentMealDemand: number;
  dietaryPreference: string;
  contactPerson: string;
  phone: string;
  facilities: string[];
  createdAt: string;
}

export interface TripDoc {
  id: string;
  transporterId: string;
  transporterName: string;
  transporterType: string;
  phone: string;
  licenseNumber: string;
  isLicenseVerified: boolean;
  vehicleType: string;
  vehicleNumber: string;
  originCity: string;
  originName: string;
  originLat: number;
  originLng: number;
  destinationCity: string;
  destinationName: string;
  destinationLat: number;
  destinationLng: number;
  departureTime: string;
  availableCapacityKg: number;
  availableCapacityServings: number;
  maxDetourKm: number;
  maxDetourMinutes: number;
  status: 'PLANNED' | 'CONFIRMED' | 'MATCHED' | 'EN_ROUTE_PICKUP' | 'PICKED_UP' | 'EN_ROUTE_DELIVERY' | 'COMPLETED' | 'CANCELLED';
  assignedDonationId?: string;
  assignedNgoId?: string;
  detourDistanceKm: number;
  detourTimeMinutes: number;
  fuelReimbursementEarned: number;
  greenCreditsEarned: number;
  authorizedLocationSharing: boolean;
  lastKnownLat?: number;
  lastKnownLng?: number;
  lastLocationUpdatedAt?: string;
  trafficDelayMinutes: number;
  isBackupDispatched: boolean;
  tripConfirmationConfirmed: boolean;
  createdAt: string;
}

// In-file persistent database schema
interface DbSchema {
  users: UserDoc[];
  donations: DonationDoc[];
  ngos: NgoDoc[];
  trips: TripDoc[];
}

const DATA_DIR = path.resolve(process.cwd(), 'server/data');
const DB_FILE = path.join(DATA_DIR, 'foodpool_db.json');

// Initial seed data with authentic Tamil Nadu locations
const INITIAL_DB: DbSchema = {
  users: [
    {
      id: 'user-donor-1',
      email: 'saravana@foodpool.tn',
      passwordHash: '$2a$10$vNqA/u2e2sK8X8yT8mKq1eO6S3B8V8e8t8mKq1eO6S3B8V8e8t8mK', // 'password123'
      name: 'M. Sridhar (F&B Manager)',
      role: 'donor',
      phone: '+91 98401 23411',
      organizationName: 'Hotel Saravana Bhavan (T. Nagar)',
      fssaiNumber: 'TN-FSSAI-1242300900142',
      city: 'Chennai',
      district: 'Chennai',
      address: 'No. 42, Usman Road, T. Nagar, Chennai 600017',
      lat: 13.0418,
      lng: 80.2341,
      createdAt: new Date().toISOString()
    },
    {
      id: 'user-ngo-1',
      email: 'udhavum@foodpool.tn',
      passwordHash: '$2a$10$vNqA/u2e2sK8X8yT8mKq1eO6S3B8V8e8t8mKq1eO6S3B8V8e8t8mK',
      name: 'Sister Mary Teresa (Coordinator)',
      role: 'ngo',
      phone: '+91 98410 87654',
      organizationName: 'Udhavum Karangal Community Shelter',
      darpanId: 'TN/2021/0284918',
      city: 'Chennai',
      district: 'Chennai',
      address: '12 Bypass Link Road, Velachery, Chennai 600042',
      lat: 12.9815,
      lng: 80.218,
      createdAt: new Date().toISOString()
    },
    {
      id: 'user-trans-1',
      email: 'karthik@foodpool.tn',
      passwordHash: '$2a$10$vNqA/u2e2sK8X8yT8mKq1eO6S3B8V8e8t8mKq1eO6S3B8V8e8t8mK',
      name: 'Karthik Ramanathan',
      role: 'transporter',
      phone: '+91 98841 90281',
      vehicleType: 'Four Wheeler (Sedan / Hatchback)',
      vehicleNumber: 'TN 09 BK 4421',
      licenseNumber: 'TN-09-2019-0048192',
      city: 'Chennai',
      district: 'Chennai',
      address: 'Panagal Park, T. Nagar, Chennai',
      lat: 13.0418,
      lng: 80.2341,
      createdAt: new Date().toISOString()
    }
  ],
  donations: [
    {
      id: 'don-101',
      donorId: 'user-donor-1',
      donorName: 'Hotel Saravana Bhavan (T. Nagar)',
      donorType: 'Restaurant',
      fssaiNumber: 'TN-FSSAI-1242300900142',
      isFssaiVerified: true,
      phone: '+91 98401 23411',
      city: 'Chennai',
      locationName: 'T. Nagar (Pondy Bazaar)',
      lat: 13.0418,
      lng: 80.2341,
      address: 'No. 42, Usman Road, T. Nagar, Chennai 600017',
      foodName: 'South Indian Sambar Rice & Poriyal',
      category: 'Cooked Meals (Rice/Sambar/Curry)',
      servings: 45,
      weightKg: 16,
      dietary: 'Pure Veg',
      preparationTime: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      safeConsumptionDeadline: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
      storageRequirement: 'Hot (Maintain > 60°C)',
      packagingType: 'Sealed Stainless Steel Casseroles',
      status: 'RESERVED_BY_NGO',
      pickupOtp: '482910',
      deliveryOtp: '716394',
      reservedNgoId: 'ngo-101',
      assignedTransporterId: 'trip-101',
      safetyChecklist: {
        temperatureChecked: true,
        cleanContainersSealed: true,
        hygienicHandlingVerified: true,
        odourTextureChecked: true
      },
      privacyConsent: true,
      createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      notes: 'Freshly cooked lunch batch, packed in insulated warm containers.'
    },
    {
      id: 'don-102',
      donorId: 'user-donor-annauniv',
      donorName: 'Anna University CEG Hostel Mess 4',
      donorType: 'Hostel Mess',
      fssaiNumber: 'TN-FSSAI-1242100800991',
      isFssaiVerified: true,
      phone: '+91 94440 88219',
      city: 'Chennai',
      locationName: 'Anna University (CEG Campus, Guindy)',
      lat: 13.0108,
      lng: 80.2355,
      address: 'College of Engineering, Guindy, Chennai 600025',
      foodName: 'Jeera Rice & Dal Makhani',
      category: 'Hostel Mess Bulk Food',
      servings: 65,
      weightKg: 22,
      dietary: 'Pure Veg',
      preparationTime: new Date(Date.now() - 1.5 * 3600 * 1000).toISOString(),
      safeConsumptionDeadline: new Date(Date.now() + 3.5 * 3600 * 1000).toISOString(),
      storageRequirement: 'Hot (Maintain > 60°C)',
      packagingType: 'Food-Grade Insulated Buckets',
      status: 'AVAILABLE',
      pickupOtp: '391054',
      deliveryOtp: '849201',
      safetyChecklist: {
        temperatureChecked: true,
        cleanContainersSealed: true,
        hygienicHandlingVerified: true,
        odourTextureChecked: true
      },
      privacyConsent: true,
      createdAt: new Date(Date.now() - 1.5 * 3600 * 1000).toISOString(),
      notes: 'Bulk cooked student dinner surplus.'
    },
    {
      id: 'don-103',
      donorId: 'user-donor-annapoorna',
      donorName: 'Sree Annapoorna (Gandhipuram)',
      donorType: 'Restaurant',
      fssaiNumber: 'TN-FSSAI-1241800200871',
      isFssaiVerified: true,
      phone: '+91 97900 11982',
      city: 'Coimbatore',
      locationName: 'Gandhipuram (Cross Cut Road)',
      lat: 11.0168,
      lng: 76.9688,
      address: 'Cross Cut Road, Gandhipuram, Coimbatore 641012',
      foodName: 'Mini Meals (Curd Rice & Veg Biryani)',
      category: 'Cooked Meals (Rice/Sambar/Curry)',
      servings: 50,
      weightKg: 18,
      dietary: 'Pure Veg',
      preparationTime: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
      safeConsumptionDeadline: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
      storageRequirement: 'Hot (Maintain > 60°C)',
      packagingType: 'Sealed Stainless Steel Casseroles',
      status: 'AVAILABLE',
      pickupOtp: '519382',
      deliveryOtp: '667412',
      safetyChecklist: {
        temperatureChecked: true,
        cleanContainersSealed: true,
        hygienicHandlingVerified: true,
        odourTextureChecked: true
      },
      privacyConsent: true,
      createdAt: new Date().toISOString()
    }
  ],
  ngos: [
    {
      id: 'ngo-101',
      name: 'Udhavum Karangal Community Shelter',
      darpanId: 'TN/2021/0284918',
      isDarpanVerified: true,
      city: 'Chennai',
      district: 'Chennai',
      locationName: 'Velachery (Vijayanagar)',
      lat: 12.9815,
      lng: 80.218,
      address: '12 Bypass Link Road, Velachery, Chennai 600042',
      beneficiaryCount: 75,
      urgentMealDemand: 60,
      dietaryPreference: 'Pure Veg Only',
      contactPerson: 'Sister Mary Teresa',
      phone: '+91 98410 87654',
      facilities: ['Warm Food Storage Insulated Cabinets', 'Immediate Serving Hall'],
      createdAt: new Date().toISOString()
    },
    {
      id: 'ngo-102',
      name: 'Akshaya Patra Community Dining (Tambaram)',
      darpanId: 'TN/2019/0192843',
      isDarpanVerified: true,
      city: 'Chennai',
      district: 'Chengalpattu',
      locationName: 'Tambaram Sanatorium',
      lat: 12.9304,
      lng: 80.1246,
      address: 'GST Road, Tambaram Sanatorium, Chennai 600047',
      beneficiaryCount: 130,
      urgentMealDemand: 90,
      dietaryPreference: 'Any',
      contactPerson: 'R. Soundararajan',
      phone: '+91 94441 55678',
      facilities: ['Cold Storage', 'Dining Shed'],
      createdAt: new Date().toISOString()
    },
    {
      id: 'ngo-103',
      name: 'Anbalayam Children Home & Elder Care',
      darpanId: 'TN/2022/0319482',
      isDarpanVerified: true,
      city: 'Coimbatore',
      district: 'Coimbatore',
      locationName: 'Peelamedu (Avinashi Road)',
      lat: 11.0287,
      lng: 77.0033,
      address: 'Avinashi Road, Peelamedu, Coimbatore 641004',
      beneficiaryCount: 55,
      urgentMealDemand: 45,
      dietaryPreference: 'Pure Veg Only',
      contactPerson: 'P. Saraswathi',
      phone: '+91 98940 33211',
      facilities: ['Kitchen Pantry', 'Immediate Serving'],
      createdAt: new Date().toISOString()
    }
  ],
  trips: [
    {
      id: 'trip-101',
      transporterId: 'user-trans-1',
      transporterName: 'Karthik Ramanathan',
      transporterType: 'Daily Commuter',
      phone: '+91 98841 90281',
      licenseNumber: 'TN-09-2019-0048192',
      isLicenseVerified: true,
      vehicleType: 'Four Wheeler (Sedan / Hatchback)',
      vehicleNumber: 'TN 09 BK 4421',
      originCity: 'Chennai',
      originName: 'T. Nagar (Pondy Bazaar)',
      originLat: 13.0418,
      originLng: 80.2341,
      destinationCity: 'Chennai',
      destinationName: 'Guindy Industrial Estate',
      destinationLat: 13.0067,
      destinationLng: 80.2025,
      departureTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      availableCapacityKg: 35,
      availableCapacityServings: 90,
      maxDetourKm: 4.5,
      maxDetourMinutes: 20,
      status: 'MATCHED',
      assignedDonationId: 'don-101',
      assignedNgoId: 'ngo-101',
      detourDistanceKm: 2.3,
      detourTimeMinutes: 14,
      fuelReimbursementEarned: 42,
      greenCreditsEarned: 12,
      authorizedLocationSharing: false,
      lastKnownLat: 13.0418,
      lastKnownLng: 80.2341,
      trafficDelayMinutes: 0,
      isBackupDispatched: false,
      tripConfirmationConfirmed: true,
      createdAt: new Date().toISOString()
    }
  ]
};

class PersistentDb {
  private memoryData: DbSchema;
  private mongoDbInstance: Db | null = null;
  private isMongoConnected: boolean = false;

  constructor() {
    this.memoryData = this.loadFromFile();
    this.connectMongoIfAvailable();
  }

  private loadFromFile(): DbSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Could not read existing db file, using seed data:', e);
    }
    this.saveToFile(INITIAL_DB);
    return INITIAL_DB;
  }

  private saveToFile(data: DbSchema) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving db file:', e);
    }
  }

  private async connectMongoIfAvailable() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.log('No MONGODB_URI provided. Running on Persistent File-backed Document DB.');
      return;
    }
    try {
      const client = new MongoClient(uri, { serverSelectionTimeoutMS: 3000 });
      await client.connect();
      this.mongoDbInstance = client.db();
      this.isMongoConnected = true;
      console.log('Successfully connected to MongoDB cluster at', uri);
    } catch (err) {
      console.warn('MongoDB connection failed; seamlessly falling back to Persistent File DB:', err);
      this.isMongoConnected = false;
    }
  }

  // Generic collection accessor that behaves like MongoDB
  public collection<T extends { id: string }>(name: keyof DbSchema) {
    const self = this;
    return {
      async find(filter: Partial<T> = {}): Promise<T[]> {
        const list = (self.memoryData[name] as unknown as T[]) || [];
        return list.filter((item) => {
          for (const key of Object.keys(filter)) {
            if ((filter as any)[key] !== undefined && (item as any)[key] !== (filter as any)[key]) {
              return false;
            }
          }
          return true;
        });
      },

      async findOne(filter: Partial<T>): Promise<T | null> {
        const results = await this.find(filter);
        return results[0] || null;
      },

      async insertOne(doc: T): Promise<T> {
        if (!doc.id) {
          (doc as any).id = `${name.slice(0, 3)}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        }
        (self.memoryData[name] as unknown as T[]).push(doc);
        self.saveToFile(self.memoryData);
        return doc;
      },

      async updateOne(filter: Partial<T>, update: Partial<T>): Promise<boolean> {
        const list = (self.memoryData[name] as unknown as T[]) || [];
        const index = list.findIndex((item) => {
          for (const key of Object.keys(filter)) {
            if ((filter as any)[key] !== undefined && (item as any)[key] !== (filter as any)[key]) {
              return false;
            }
          }
          return true;
        });

        if (index === -1) return false;
        list[index] = { ...list[index], ...update };
        self.saveToFile(self.memoryData);
        return true;
      },

      async deleteOne(filter: Partial<T>): Promise<boolean> {
        const list = (self.memoryData[name] as unknown as T[]) || [];
        const index = list.findIndex((item) => {
          for (const key of Object.keys(filter)) {
            if ((filter as any)[key] !== undefined && (item as any)[key] !== (filter as any)[key]) {
              return false;
            }
          }
          return true;
        });

        if (index === -1) return false;
        list.splice(index, 1);
        self.saveToFile(self.memoryData);
        return true;
      },

      async count(): Promise<number> {
        return ((self.memoryData[name] as unknown as T[]) || []).length;
      }
    };
  }

  public getRawData(): DbSchema {
    return this.memoryData;
  }

  public resetDatabase(): void {
    this.memoryData = JSON.parse(JSON.stringify(INITIAL_DB));
    this.saveToFile(this.memoryData);
  }
}

export const db = new PersistentDb();

export type UserRole = 'overview' | 'donor' | 'transporter' | 'ngo' | 'problems_matrix';

export type TNRegion = 'Chennai' | 'Coimbatore' | 'Madurai' | 'Tiruchirappalli' | 'Salem' | 'Tirunelveli';

export interface TNLocation {
  id: string;
  name: string;
  city: TNRegion;
  district: string;
  lat: number;
  lng: number;
  landmark: string;
  privacyZone: string; // e.g., "T. Nagar Commercial Ward 12" for location masking
  fullAddress: string;
}

export type FoodCategory = 
  | 'Cooked Meals (Rice/Sambar/Curry)' 
  | 'Bakery & Bread (Breads/Pastries)' 
  | 'Hostel Mess Bulk Food' 
  | 'Breakfast Items (Idli/Dosa/Vada)' 
  | 'Snacks & Packed Savories';

export type DietaryType = 'Pure Veg' | 'Non-Veg' | 'Jain';

export type StorageRequirement = 
  | 'Hot (Maintain > 60°C)' 
  | 'Cold (Refrigerated < 5°C)' 
  | 'Ambient (Dry/Cool < 25°C)';

export type PackagingType = 
  | 'Sealed Stainless Steel Casseroles' 
  | 'Food-Grade Insulated Buckets' 
  | 'Foil-Wrapped Trays' 
  | 'Bakery Corrugated Boxes';

export type DonationStatus = 
  | 'AVAILABLE' 
  | 'RESERVED_BY_NGO' 
  | 'ASSIGNED_TRANSPORTER' 
  | 'PICKED_UP' 
  | 'DELIVERED' 
  | 'EXPIRED_REJECTED';

export interface FoodItem {
  name: string;
  quantityKg: number;
  servings: number;
  category: FoodCategory;
  dietary: DietaryType;
}

export interface FoodDonation {
  id: string;
  donorId: string;
  donorName: string;
  donorType: 'Bakery' | 'Restaurant' | 'Hostel Mess' | 'Marriage Hall' | 'Corporate Cafeteria';
  fssaiNumber: string;
  isFssaiVerified: boolean;
  contactPerson: string;
  phone: string;
  location: TNLocation;
  items: FoodItem[];
  totalServings: number;
  totalWeightKg: number;
  preparationTime: string; // ISO string
  safeConsumptionDeadline: string; // ISO string (e.g., prep + 4-6 hours)
  storageRequirement: StorageRequirement;
  packagingType: PackagingType;
  status: DonationStatus;
  pickupOtp: string; // 6 digits (only revealed to donor until pickup)
  deliveryOtp: string; // 6 digits (revealed to NGO for final delivery)
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

export type VehicleType = 
  | 'Two Wheeler (Motorcycle / Scooter)' 
  | 'Four Wheeler (Sedan / Hatchback)' 
  | 'Commercial Mini Van (Tata Ace / Auto)' 
  | 'Electric Vehicle (Ather / Ola)';

export type TransporterType = 
  | 'Daily Commuter' 
  | 'College Student / NSS Volunteer' 
  | 'Corporate Carpooler' 
  | 'Partner Delivery Partner (Dunzo/Porter Volunteer)' 
  | 'Emergency Backup Fleet';

export type TripStatus = 
  | 'PLANNED' 
  | 'CONFIRMED' 
  | 'MATCHED' 
  | 'EN_ROUTE_PICKUP' 
  | 'PICKED_UP' 
  | 'EN_ROUTE_DELIVERY' 
  | 'COMPLETED' 
  | 'CANCELLED';

export interface TransporterTrip {
  id: string;
  transporterName: string;
  transporterType: TransporterType;
  phone: string;
  licenseNumber: string;
  isLicenseVerified: boolean;
  vehicleType: VehicleType;
  vehicleNumber: string;
  origin: TNLocation;
  destination: TNLocation;
  departureTime: string;
  availableCapacityKg: number;
  availableCapacityServings: number;
  maxDetourKm: number;
  maxDetourMinutes: number;
  status: TripStatus;
  assignedDonationId?: string;
  assignedNgoId?: string;
  detourDistanceKm: number;
  detourTimeMinutes: number;
  fuelReimbursementEarned: number; // ₹18 / km detour
  greenCreditsEarned: number;
  currentLat?: number;
  currentLng?: number;
  trafficDelayMinutes: number;
  isBackupDispatched: boolean;
  locationPrivacyActive: boolean; // Ephemeral tracking stops upon delivery
  tripConfirmationConfirmed: boolean;
  transitStepProgress: number; // 0 to 100%
}

export interface RecipientNGO {
  id: string;
  name: string;
  darpanId: string;
  isDarpanVerified: boolean;
  location: TNLocation;
  beneficiaryCount: number;
  urgentMealDemand: number;
  dietaryPreference: 'Any' | 'Pure Veg Only' | 'Non-Veg Accepted';
  contactPerson: string;
  phone: string;
  facilities: string[];
  lastAcceptedDonationId?: string;
}

export interface RouteMatchRecommendation {
  tripId: string;
  donationId: string;
  ngoId: string;
  score: number; // 0 to 100
  directKm: number;
  pooledKm: number;
  detourKm: number;
  detourMinutes: number;
  fuelReimbursement: number;
  freshnessTimeRemainingMinutes: number;
  isCapacitySufficient: boolean;
  isWithinTimeWindow: boolean;
  reason: string;
}

export interface ProblemSolutionItem {
  id: number;
  problem: string;
  proposedSolution: string;
  liveStatus: 'Active & Verified' | 'Operating' | 'Enforced';
  metricTitle: string;
  metricValue: string;
  demonstrationAction: string;
  badge: string;
  color: string;
}

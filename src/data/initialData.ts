import { FoodDonation, RecipientNGO, TransporterTrip } from '../types';
import { TAMIL_NADU_LOCATIONS } from './tamilNaduLocations';

// Helper to calculate realistic ISO deadlines relative to current time
const now = Date.now();
const hours = (h: number) => new Date(now + h * 3600 * 1000).toISOString();
const pastHours = (h: number) => new Date(now - h * 3600 * 1000).toISOString();

export const INITIAL_DONATIONS: FoodDonation[] = [
  {
    id: 'don-001',
    donorId: 'donor-saravana',
    donorName: 'Hotel Saravana Bhavan (T. Nagar)',
    donorType: 'Restaurant',
    fssaiNumber: 'TN-FSSAI-1242300900142',
    isFssaiVerified: true,
    contactPerson: 'M. Sridhar (F&B Manager)',
    phone: '+91 98401 23411',
    location: TAMIL_NADU_LOCATIONS.find((l) => l.id === 'loc-chn-tnagar')!,
    items: [
      {
        name: 'South Indian Sambar Rice & Poriyal',
        quantityKg: 14,
        servings: 40,
        category: 'Cooked Meals (Rice/Sambar/Curry)',
        dietary: 'Pure Veg'
      },
      {
        name: 'Crispy Medu Vada (Packed Fresh)',
        quantityKg: 4,
        servings: 30,
        category: 'Breakfast Items (Idli/Dosa/Vada)',
        dietary: 'Pure Veg'
      }
    ],
    totalServings: 70,
    totalWeightKg: 18,
    preparationTime: pastHours(1.5),
    safeConsumptionDeadline: hours(3.5), // Urgent: 3.5 hrs left
    storageRequirement: 'Hot (Maintain > 60°C)',
    packagingType: 'Sealed Stainless Steel Casseroles',
    status: 'RESERVED_BY_NGO',
    pickupOtp: '482910',
    deliveryOtp: '716394',
    reservedNgoId: 'ngo-udhavum',
    assignedTransporterId: 'trip-001',
    safetyChecklist: {
      temperatureChecked: true,
      cleanContainersSealed: true,
      hygienicHandlingVerified: true,
      odourTextureChecked: true
    },
    privacyConsent: true,
    createdAt: pastHours(1.2),
    notes: 'Hot freshly sealed in food-grade thermos containers. Direct handover at rear kitchen bay.'
  },
  {
    id: 'don-002',
    donorId: 'donor-annauniv',
    donorName: 'Anna University CEG Hostel Mess 4',
    donorType: 'Hostel Mess',
    fssaiNumber: 'TN-FSSAI-1242100800991',
    isFssaiVerified: true,
    contactPerson: 'Dr. R. Palanisamy (Mess Warden)',
    phone: '+91 94440 88219',
    location: TAMIL_NADU_LOCATIONS.find((l) => l.id === 'loc-chn-annauniv')!,
    items: [
      {
        name: 'Jeera Rice & Dal Makhani (Student Mess Batch)',
        quantityKg: 22,
        servings: 65,
        category: 'Hostel Mess Bulk Food',
        dietary: 'Pure Veg'
      }
    ],
    totalServings: 65,
    totalWeightKg: 22,
    preparationTime: pastHours(2),
    safeConsumptionDeadline: hours(2.5), // High priority: 2.5 hrs left
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
    createdAt: pastHours(1.8),
    notes: 'Bulk cooked student dinner surplus. Clean food-grade insulated buckets ready.'
  },
  {
    id: 'don-003',
    donorId: 'donor-hotbreads',
    donorName: 'Hot Breads & Patisserie (Adyar)',
    donorType: 'Bakery',
    fssaiNumber: 'TN-FSSAI-1241900100452',
    isFssaiVerified: true,
    contactPerson: 'K. Anand (Bakery Supervisor)',
    phone: '+91 98840 55192',
    location: TAMIL_NADU_LOCATIONS.find((l) => l.id === 'loc-chn-adyar')!,
    items: [
      {
        name: 'Whole Wheat Sandwich Loaves & Veg Buns',
        quantityKg: 12,
        servings: 50,
        category: 'Bakery & Bread (Breads/Pastries)',
        dietary: 'Pure Veg'
      }
    ],
    totalServings: 50,
    totalWeightKg: 12,
    preparationTime: pastHours(3),
    safeConsumptionDeadline: hours(8), // Longer shelf-life
    storageRequirement: 'Ambient (Dry/Cool < 25°C)',
    packagingType: 'Bakery Corrugated Boxes',
    status: 'AVAILABLE',
    pickupOtp: '620481',
    deliveryOtp: '302947',
    safetyChecklist: {
      temperatureChecked: true,
      cleanContainersSealed: true,
      hygienicHandlingVerified: true,
      odourTextureChecked: true
    },
    privacyConsent: true,
    createdAt: pastHours(2.5),
    notes: 'Baked today morning. Sealed with tamper-evident FoodPool hygiene sticker.'
  },
  {
    id: 'don-004',
    donorId: 'donor-annapoorna',
    donorName: 'Sree Annapoorna (Gandhipuram, Coimbatore)',
    donorType: 'Restaurant',
    fssaiNumber: 'TN-FSSAI-1241800200871',
    isFssaiVerified: true,
    contactPerson: 'V. Murugesan (Manager)',
    phone: '+91 97900 11982',
    location: TAMIL_NADU_LOCATIONS.find((l) => l.id === 'loc-cbe-gandhipuram')!,
    items: [
      {
        name: 'Mini Meals (Curd Rice, Veg Biryani & Kootu)',
        quantityKg: 16,
        servings: 45,
        category: 'Cooked Meals (Rice/Sambar/Curry)',
        dietary: 'Pure Veg'
      }
    ],
    totalServings: 45,
    totalWeightKg: 16,
    preparationTime: pastHours(1),
    safeConsumptionDeadline: hours(4.2),
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
    createdAt: pastHours(0.8),
    notes: 'Freshly packed lunch packs from corporate catering overflow.'
  },
  {
    id: 'don-005',
    donorId: 'donor-murugan',
    donorName: 'Murugan Idli Shop (Goripalayam, Madurai)',
    donorType: 'Restaurant',
    fssaiNumber: 'TN-FSSAI-1241700400511',
    isFssaiVerified: true,
    contactPerson: 'S. Alagarsamy',
    phone: '+91 94431 44520',
    location: TAMIL_NADU_LOCATIONS.find((l) => l.id === 'loc-mdu-goripalayam')!,
    items: [
      {
        name: 'Steamed Mallipoo Idlis with Coriander Chutney',
        quantityKg: 15,
        servings: 60,
        category: 'Breakfast Items (Idli/Dosa/Vada)',
        dietary: 'Pure Veg'
      }
    ],
    totalServings: 60,
    totalWeightKg: 15,
    preparationTime: pastHours(1.5),
    safeConsumptionDeadline: hours(3.8),
    storageRequirement: 'Hot (Maintain > 60°C)',
    packagingType: 'Food-Grade Insulated Buckets',
    status: 'AVAILABLE',
    pickupOtp: '748192',
    deliveryOtp: '912048',
    safetyChecklist: {
      temperatureChecked: true,
      cleanContainersSealed: true,
      hygienicHandlingVerified: true,
      odourTextureChecked: true
    },
    privacyConsent: true,
    createdAt: pastHours(1.1)
  }
];

export const INITIAL_NGOS: RecipientNGO[] = [
  {
    id: 'ngo-udhavum',
    name: 'Udhavum Karangal Community Shelter',
    darpanId: 'TN/2021/0284918',
    isDarpanVerified: true,
    location: TAMIL_NADU_LOCATIONS.find((l) => l.id === 'loc-chn-velachery')!,
    beneficiaryCount: 75,
    urgentMealDemand: 60,
    dietaryPreference: 'Pure Veg Only',
    contactPerson: 'Sister Mary Teresa (Coordinator)',
    phone: '+91 98410 87654',
    facilities: ['Warm Food Storage Insulated Cabinets', 'Immediate Resident Serving Dining Hall', 'Clean Water Dispenser'],
    lastAcceptedDonationId: 'don-001'
  },
  {
    id: 'ngo-annadhanam',
    name: 'Akshaya Patra Community Dining (Tambaram)',
    darpanId: 'TN/2019/0192843',
    isDarpanVerified: true,
    location: TAMIL_NADU_LOCATIONS.find((l) => l.id === 'loc-chn-tambaram')!,
    beneficiaryCount: 130,
    urgentMealDemand: 90,
    dietaryPreference: 'Any',
    contactPerson: 'R. Soundararajan (Field Officer)',
    phone: '+91 94441 55678',
    facilities: ['Refrigeration Cold Storage', 'Stainless Service Line', 'Community Dining Shed']
  },
  {
    id: 'ngo-anbalayam',
    name: 'Anbalayam Children Home & Elder Care',
    darpanId: 'TN/2022/0319482',
    isDarpanVerified: true,
    location: TAMIL_NADU_LOCATIONS.find((l) => l.id === 'loc-cbe-peelamedu')!,
    beneficiaryCount: 55,
    urgentMealDemand: 45,
    dietaryPreference: 'Pure Veg Only',
    contactPerson: 'P. Saraswathi (Founder)',
    phone: '+91 98940 33211',
    facilities: ['Immediate Serving Kitchen', 'Safe Hot Food Pots']
  },
  {
    id: 'ngo-akshaya-mdu',
    name: 'Akshaya Trust Destitute Feeding Center',
    darpanId: 'TN/2018/0091244',
    isDarpanVerified: true,
    location: TAMIL_NADU_LOCATIONS.find((l) => l.id === 'loc-mdu-mattuthavani')!,
    beneficiaryCount: 90,
    urgentMealDemand: 70,
    dietaryPreference: 'Any',
    contactPerson: 'Narayanan Krishnan (Managing Trustee)',
    phone: '+91 94430 77123',
    facilities: ['Mobile Rehabilitation Van', 'Thermal Storage', 'Emergency Dining Unit']
  },
  {
    id: 'ngo-blossom-try',
    name: 'Blossom Social Welfare Shelter (Srirangam)',
    darpanId: 'TN/2020/0248102',
    isDarpanVerified: true,
    location: TAMIL_NADU_LOCATIONS.find((l) => l.id === 'loc-try-srirangam')!,
    beneficiaryCount: 45,
    urgentMealDemand: 40,
    dietaryPreference: 'Pure Veg Only',
    contactPerson: 'C. Ramanathan',
    phone: '+91 97890 44102',
    facilities: ['Immediate Evening Supper Kitchen']
  }
];

export const INITIAL_TRIPS: TransporterTrip[] = [
  {
    id: 'trip-001',
    transporterName: 'Karthik Ramanathan',
    transporterType: 'Daily Commuter',
    phone: '+91 98841 90281',
    licenseNumber: 'TN-09-2019-0048192',
    isLicenseVerified: true,
    vehicleType: 'Four Wheeler (Sedan / Hatchback)',
    vehicleNumber: 'TN 09 BK 4421 (Hyundai i20)',
    origin: TAMIL_NADU_LOCATIONS.find((l) => l.id === 'loc-chn-tnagar')!,
    destination: TAMIL_NADU_LOCATIONS.find((l) => l.id === 'loc-chn-guindy')!,
    departureTime: hours(0.5),
    availableCapacityKg: 35,
    availableCapacityServings: 90,
    maxDetourKm: 4.5,
    maxDetourMinutes: 20,
    status: 'MATCHED',
    assignedDonationId: 'don-001',
    assignedNgoId: 'ngo-udhavum',
    detourDistanceKm: 2.3,
    detourTimeMinutes: 14,
    fuelReimbursementEarned: 42,
    greenCreditsEarned: 12,
    trafficDelayMinutes: 0,
    isBackupDispatched: false,
    locationPrivacyActive: true,
    tripConfirmationConfirmed: true,
    transitStepProgress: 35
  },
  {
    id: 'trip-002',
    transporterName: 'Deepa Senthil',
    transporterType: 'College Student / NSS Volunteer',
    phone: '+91 99402 11984',
    licenseNumber: 'TN-01-2022-0071829',
    isLicenseVerified: true,
    vehicleType: 'Two Wheeler (Motorcycle / Scooter)',
    vehicleNumber: 'TN 07 DC 8812 (Activa 6G)',
    origin: TAMIL_NADU_LOCATIONS.find((l) => l.id === 'loc-chn-annauniv')!,
    destination: TAMIL_NADU_LOCATIONS.find((l) => l.id === 'loc-chn-velachery')!,
    departureTime: hours(0.8),
    availableCapacityKg: 15,
    availableCapacityServings: 50,
    maxDetourKm: 3.0,
    maxDetourMinutes: 15,
    status: 'PLANNED',
    detourDistanceKm: 0,
    detourTimeMinutes: 0,
    fuelReimbursementEarned: 0,
    greenCreditsEarned: 0,
    trafficDelayMinutes: 0,
    isBackupDispatched: false,
    locationPrivacyActive: true,
    tripConfirmationConfirmed: true,
    transitStepProgress: 0
  },
  {
    id: 'trip-003',
    transporterName: 'Vigneshwaran K',
    transporterType: 'Corporate Carpooler',
    phone: '+91 97910 88201',
    licenseNumber: 'TN-10-2018-0091823',
    isLicenseVerified: true,
    vehicleType: 'Four Wheeler (Sedan / Hatchback)',
    vehicleNumber: 'TN 10 AP 1194 (Honda City)',
    origin: TAMIL_NADU_LOCATIONS.find((l) => l.id === 'loc-chn-guindy')!,
    destination: TAMIL_NADU_LOCATIONS.find((l) => l.id === 'loc-chn-omr')!,
    departureTime: hours(1.2),
    availableCapacityKg: 40,
    availableCapacityServings: 110,
    maxDetourKm: 5.0,
    maxDetourMinutes: 25,
    status: 'PLANNED',
    detourDistanceKm: 0,
    detourTimeMinutes: 0,
    fuelReimbursementEarned: 0,
    greenCreditsEarned: 0,
    trafficDelayMinutes: 0,
    isBackupDispatched: false,
    locationPrivacyActive: true,
    tripConfirmationConfirmed: false,
    transitStepProgress: 0
  },
  {
    id: 'trip-004',
    transporterName: 'Ramesh Kumar (Dunzo Volunteer Partner)',
    transporterType: 'Partner Delivery Partner (Dunzo/Porter Volunteer)',
    phone: '+91 98941 77218',
    licenseNumber: 'TN-38-2020-0033109',
    isLicenseVerified: true,
    vehicleType: 'Two Wheeler (Motorcycle / Scooter)',
    vehicleNumber: 'TN 38 BR 9081',
    origin: TAMIL_NADU_LOCATIONS.find((l) => l.id === 'loc-cbe-gandhipuram')!,
    destination: TAMIL_NADU_LOCATIONS.find((l) => l.id === 'loc-cbe-peelamedu')!,
    departureTime: hours(0.4),
    availableCapacityKg: 20,
    availableCapacityServings: 60,
    maxDetourKm: 3.5,
    maxDetourMinutes: 18,
    status: 'PLANNED',
    detourDistanceKm: 0,
    detourTimeMinutes: 0,
    fuelReimbursementEarned: 0,
    greenCreditsEarned: 0,
    trafficDelayMinutes: 0,
    isBackupDispatched: false,
    locationPrivacyActive: true,
    tripConfirmationConfirmed: true,
    transitStepProgress: 0
  }
];

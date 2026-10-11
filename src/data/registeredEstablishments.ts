export interface RegisteredEstablishment {
  id: string;
  name: string;
  category: 'Restaurant' | 'Bakery' | 'Hostel Mess' | 'Small Tiffin Center' | 'Hotel';
  fssaiNumber: string;
  managerName: string;
  phone: string;
  city: 'Chennai' | 'Coimbatore' | 'Madurai' | 'Tiruchirappalli' | 'Salem';
  district: string;
  address: string;
  lat: number;
  lng: number;
  typicalSurplusItems: string[];
  defaultServings: number;
  defaultWeightKg: number;
  defaultSafeHours: number;
  storageType: 'Hot (Maintain > 60°C)' | 'Ambient (Dry/Cool < 25°C)' | 'Refrigerated (< 4°C)';
  qrIdentifier: string;
}

export const REGISTERED_ESTABLISHMENTS: RegisteredEstablishment[] = [
  {
    id: 'est-chn-001',
    name: 'Hotel Saravana Bhavan (T. Nagar)',
    category: 'Restaurant',
    fssaiNumber: 'TN-FSSAI-1242300900142',
    managerName: 'K. Balasubramanian',
    phone: '+91 98401 23411',
    city: 'Chennai',
    district: 'Chennai Central',
    address: 'No. 42, Usman Road, Panagal Park, T. Nagar, Chennai 600017',
    lat: 13.0418,
    lng: 80.2341,
    typicalSurplusItems: ['Sambar Rice & Poriyal', 'Mini Meals & Curd Rice', 'Idli & Vadai'],
    defaultServings: 45,
    defaultWeightKg: 16,
    defaultSafeHours: 3.5,
    storageType: 'Hot (Maintain > 60°C)',
    qrIdentifier: 'QR-HSB-TNAGAR-CH01'
  },
  {
    id: 'est-chn-002',
    name: 'Iyengar Bakery & Sweets (Velachery)',
    category: 'Bakery',
    fssaiNumber: 'TN-FSSAI-1242200700819',
    managerName: 'S. Raghavan',
    phone: '+91 98401 55219',
    city: 'Chennai',
    district: 'Chennai South',
    address: '14 Bypass Link Road, Near Vijayanagar Terminus, Velachery, Chennai 600042',
    lat: 12.9815,
    lng: 80.2180,
    typicalSurplusItems: ['Fresh Sandwich Breads', 'Veg Puffs & Rusk Bakes', 'Sweet Buns'],
    defaultServings: 35,
    defaultWeightKg: 7.5,
    defaultSafeHours: 12.0,
    storageType: 'Ambient (Dry/Cool < 25°C)',
    qrIdentifier: 'QR-IYENGAR-VELA-CH02'
  },
  {
    id: 'est-chn-003',
    name: 'Anna University CEG Hostel Mess 4',
    category: 'Hostel Mess',
    fssaiNumber: 'TN-FSSAI-1242100800991',
    managerName: 'Prof. Duraisamy (Mess Warden)',
    phone: '+91 94440 88219',
    city: 'Chennai',
    district: 'Chennai South',
    address: 'Hostel Block 4, CEG Campus, Sardar Patel Road, Guindy, Chennai 600025',
    lat: 13.0108,
    lng: 80.2355,
    typicalSurplusItems: ['Bulk Student Dinner Rice & Dal Makhani', 'Jeera Rice & Veg Kurma', 'Chapati & Subzi'],
    defaultServings: 75,
    defaultWeightKg: 26,
    defaultSafeHours: 3.5,
    storageType: 'Hot (Maintain > 60°C)',
    qrIdentifier: 'QR-CEG-HOSTEL-CH03'
  },
  {
    id: 'est-cbe-001',
    name: 'Sree Annapoorna (Gandhipuram)',
    category: 'Restaurant',
    fssaiNumber: 'TN-FSSAI-1241800200871',
    managerName: 'P. Venkatachalam',
    phone: '+91 97900 11982',
    city: 'Coimbatore',
    district: 'Coimbatore Urban',
    address: 'Cross Cut Road, Gandhipuram, Coimbatore 641012',
    lat: 11.0168,
    lng: 76.9688,
    typicalSurplusItems: ['South Indian Meals & Sambar Rice', 'Curd Rice & Pickle', 'Vegetable Biryani'],
    defaultServings: 50,
    defaultWeightKg: 18,
    defaultSafeHours: 4.0,
    storageType: 'Hot (Maintain > 60°C)',
    qrIdentifier: 'QR-ANNAPOORNA-CBE01'
  },
  {
    id: 'est-cbe-002',
    name: 'JM Bakery & Confectionery (Peelamedu)',
    category: 'Bakery',
    fssaiNumber: 'TN-FSSAI-1242000500412',
    managerName: 'M. Selvaraj',
    phone: '+91 98940 33211',
    city: 'Coimbatore',
    district: 'Coimbatore East',
    address: 'Avinashi Road, Near PSG Tech, Peelamedu, Coimbatore 641004',
    lat: 11.0287,
    lng: 77.0033,
    typicalSurplusItems: ['Milk Bread Loaves', 'Dinner Rolls & Pastries', 'Veg Puff Bakes'],
    defaultServings: 40,
    defaultWeightKg: 8.0,
    defaultSafeHours: 14.0,
    storageType: 'Ambient (Dry/Cool < 25°C)',
    qrIdentifier: 'QR-JMBAKE-CBE02'
  },
  {
    id: 'est-mdu-001',
    name: 'Murugan Idli Shop (West Masi St)',
    category: 'Small Tiffin Center',
    fssaiNumber: 'TN-FSSAI-1241900300624',
    managerName: 'R. Senthil Nathan',
    phone: '+91 97890 44102',
    city: 'Madurai',
    district: 'Madurai Heritage',
    address: '196 West Masi Street, Near Meenakshi Temple, Madurai 625001',
    lat: 9.9195,
    lng: 78.1188,
    typicalSurplusItems: ['Malli Idlis & 4 Chutneys', 'Ghee Pongal & Vada', 'Tomato Rice'],
    defaultServings: 60,
    defaultWeightKg: 14,
    defaultSafeHours: 3.5,
    storageType: 'Hot (Maintain > 60°C)',
    qrIdentifier: 'QR-MURUGAN-MDU01'
  },
  {
    id: 'est-try-001',
    name: 'Hotel Sangam (Collector Office Rd)',
    category: 'Hotel',
    fssaiNumber: 'TN-FSSAI-1241700400199',
    managerName: 'V. Sundaramurthy',
    phone: '+91 94431 88902',
    city: 'Tiruchirappalli',
    district: 'Trichy Central',
    address: 'Collector Office Road, Cantonment, Tiruchirappalli 620001',
    lat: 10.8125,
    lng: 78.6820,
    typicalSurplusItems: ['Buffet Surplus Fried Rice & Paneer Butter', 'Dal Tadka & Steamed Rice', 'Tandoori Roti'],
    defaultServings: 55,
    defaultWeightKg: 20,
    defaultSafeHours: 3.5,
    storageType: 'Hot (Maintain > 60°C)',
    qrIdentifier: 'QR-SANGAM-TRY01'
  }
];

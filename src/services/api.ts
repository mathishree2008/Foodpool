export interface AuthUser {
  id: string;
  email: string;
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
}

const TOKEN_KEY = 'foodpool_auth_token';
const USER_KEY = 'foodpool_auth_user';

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function setAuthSession(token: string, user: AuthUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuthSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>)
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `HTTP error ${response.status}: ${response.statusText}`);
  }

  return data;
}

export function normalizeTrip(t: any) {
  if (!t) return t;
  const originLat = Number(t.origin?.lat ?? t.originLat ?? 13.0418);
  const originLng = Number(t.origin?.lng ?? t.originLng ?? 80.2341);
  const destLat = Number(t.destination?.lat ?? t.destinationLat ?? 13.0067);
  const destLng = Number(t.destination?.lng ?? t.destinationLng ?? 80.2025);

  const origin = t.origin || {
    id: `loc-origin-${t.id || 'def'}`,
    name: t.originName || t.originCity || 'Origin',
    city: t.originCity || 'Chennai',
    district: t.originCity || 'Chennai',
    lat: originLat,
    lng: originLng,
    landmark: t.originName || '',
    privacyZone: t.originName || '',
    fullAddress: t.originName || ''
  };

  const destination = t.destination || {
    id: `loc-dest-${t.id || 'def'}`,
    name: t.destinationName || t.destinationCity || 'Destination',
    city: t.destinationCity || 'Chennai',
    district: t.destinationCity || 'Chennai',
    lat: destLat,
    lng: destLng,
    landmark: t.destinationName || '',
    privacyZone: t.destinationName || '',
    fullAddress: t.destinationName || ''
  };

  return {
    ...t,
    originLat,
    originLng,
    destinationLat: destLat,
    destinationLng: destLng,
    origin,
    destination,
    transitStepProgress: Number(t.transitStepProgress) || 35,
    vehicleNumber: t.vehicleNumber || 'TN 09 BK 4421',
    detourDistanceKm: Number(t.detourDistanceKm) || 0,
    detourTimeMinutes: Number(t.detourTimeMinutes) || 0,
    fuelReimbursementEarned: Number(t.fuelReimbursementEarned) || 0,
    greenCreditsEarned: Number(t.greenCreditsEarned) || 0
  };
}

export function normalizeDonation(d: any) {
  if (!d) return d;
  const lat = Number(d.location?.lat ?? d.lat ?? 13.0418);
  const lng = Number(d.location?.lng ?? d.lng ?? 80.2341);
  const servings = Number(d.totalServings ?? d.servings ?? 40);
  const weightKg = Number(d.totalWeightKg ?? d.weightKg ?? 15);

  const location = d.location || {
    id: `loc-don-${d.id || 'def'}`,
    name: d.locationName || d.address || d.city || 'Pickup Location',
    city: d.city || 'Chennai',
    district: d.district || d.city || 'Chennai',
    lat,
    lng,
    landmark: d.locationName || '',
    privacyZone: d.locationName || '',
    fullAddress: d.address || ''
  };

  const items = d.items || [
    {
      name: d.foodName || 'Surplus Meals',
      servings,
      weightKg,
      dietary: d.dietary || 'Pure Veg'
    }
  ];

  return {
    ...d,
    lat,
    lng,
    totalServings: servings,
    totalWeightKg: weightKg,
    location,
    items
  };
}

export function normalizeNgo(n: any) {
  if (!n) return n;
  const lat = Number(n.location?.lat ?? n.lat ?? 12.9815);
  const lng = Number(n.location?.lng ?? n.lng ?? 80.2180);

  const location = n.location || {
    id: `loc-ngo-${n.id || 'def'}`,
    name: n.name || n.locationName || 'NGO Shelter',
    city: n.city || 'Chennai',
    district: n.district || n.city || 'Chennai',
    lat,
    lng,
    landmark: n.locationName || '',
    privacyZone: n.locationName || '',
    fullAddress: n.address || ''
  };

  return {
    ...n,
    lat,
    lng,
    location
  };
}

export const api = {
  auth: {
    async register(data: any): Promise<{ token: string; user: AuthUser }> {
      const res = await request<{ token: string; user: AuthUser }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      setAuthSession(res.token, res.user);
      return res;
    },

    async login(email: string, password: string): Promise<{ token: string; user: AuthUser }> {
      const res = await request<{ token: string; user: AuthUser }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      setAuthSession(res.token, res.user);
      return res;
    },

    async me(): Promise<{ user: AuthUser }> {
      return request<{ user: AuthUser }>('/auth/me');
    },

    logout() {
      clearAuthSession();
    },

    async resetDemo(): Promise<void> {
      await request('/auth/reset-demo', { method: 'POST' });
    }
  },

  donations: {
    async getAll(params: { city?: string; status?: string } = {}): Promise<{ donations: any[] }> {
      const q = new URLSearchParams();
      if (params.city && params.city !== 'All') q.append('city', params.city);
      if (params.status) q.append('status', params.status);
      const queryStr = q.toString() ? `?${q.toString()}` : '';
      const res = await request<{ donations: any[] }>(`/donations${queryStr}`);
      return { donations: (res.donations || []).map(normalizeDonation) };
    },

    async create(data: any): Promise<{ donation: any; message: string }> {
      const res = await request<{ donation: any; message: string }>('/donations', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      return { ...res, donation: normalizeDonation(res.donation) };
    },

    async updateStatus(id: string, status: string): Promise<any> {
      return request(`/donations/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
    },

    async purgeStale(): Promise<{ purgedCount: number; purgedItems: any[]; message: string }> {
      return request('/donations/purge-stale', { method: 'POST' });
    },

    async getStaleAudit(): Promise<{ logs: any[] }> {
      return request('/donations/stale-audit');
    }
  },

  ngos: {
    async getAll(city?: string): Promise<{ ngos: any[] }> {
      const queryStr = city && city !== 'All' ? `?city=${encodeURIComponent(city)}` : '';
      const res = await request<{ ngos: any[] }>(`/ngos${queryStr}`);
      return { ngos: (res.ngos || []).map(normalizeNgo) };
    },

    async acceptDonation(donationId: string, ngoId?: string): Promise<any> {
      return request('/ngos/accept-donation', {
        method: 'POST',
        body: JSON.stringify({ donationId, ngoId })
      });
    }
  },

  trips: {
    async getAll(): Promise<{ trips: any[] }> {
      const res = await request<{ trips: any[] }>('/trips');
      return { trips: (res.trips || []).map(normalizeTrip) };
    },

    async create(data: any): Promise<{ trip: any; message: string }> {
      const res = await request<{ trip: any; message: string }>('/trips', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      return { ...res, trip: normalizeTrip(res.trip) };
    },

    async getMatches(tripId: string): Promise<{ matches: any[] }> {
      return request<{ matches: any[] }>(`/trips/${tripId}/matches`);
    },

    async acceptAssignment(tripId: string, data: any): Promise<any> {
      return request(`/trips/${tripId}/accept-assignment`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    async verifyPickup(tripId: string, pickupOtp: string): Promise<any> {
      return request(`/trips/${tripId}/pickup`, {
        method: 'POST',
        body: JSON.stringify({ pickupOtp })
      });
    },

    async verifyDelivery(tripId: string, deliveryOtp: string): Promise<any> {
      return request(`/trips/${tripId}/deliver`, {
        method: 'POST',
        body: JSON.stringify({ deliveryOtp })
      });
    },

    async updateLocation(tripId: string, data: { lat?: number; lng?: number; authorizedSharing: boolean }): Promise<any> {
      return request(`/trips/${tripId}/location`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    async dispatchBackup(tripId: string): Promise<any> {
      return request(`/trips/${tripId}/backup`, {
        method: 'POST'
      });
    }
  },

  routing: {
    async calculateDetour(data: any): Promise<any> {
      return request('/routing/calculate-detour', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    }
  }
};

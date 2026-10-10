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
      return request<{ donations: any[] }>(`/donations${queryStr}`);
    },

    async create(data: any): Promise<{ donation: any; message: string }> {
      return request<{ donation: any; message: string }>('/donations', {
        method: 'POST',
        body: JSON.stringify(data)
      });
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
      return request<{ ngos: any[] }>(`/ngos${queryStr}`);
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
      return request<{ trips: any[] }>('/trips');
    },

    async create(data: any): Promise<{ trip: any; message: string }> {
      return request<{ trip: any; message: string }>('/trips', {
        method: 'POST',
        body: JSON.stringify(data)
      });
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

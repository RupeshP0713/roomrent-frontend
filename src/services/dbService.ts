import type { Malik, Bhadot, RentRequest, RentRequestWithDetails, AdminStats, User, Transaction, SearchResult } from '../types';

// API Base URL - Use /api for Vercel (same domain), or backend URL for separate deployment
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL 
  ? `${import.meta.env.VITE_BACKEND_URL}/api` 
  : '/api';

// Check if backend is available
let backendAvailable = true;

async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000)
    });
    const data = await response.json();
    backendAvailable = data.database === 'connected';
    return backendAvailable;
  } catch (error) {
    backendAvailable = false;
    return false;
  }
}

// LocalStorage fallback functions (kept for future use)
// const getLocalStorage = (key: string) => {
//   try {
//     const item = localStorage.getItem(key);
//     return item ? JSON.parse(item) : null;
//   } catch {
//     return null;
//   }
// };

// const setLocalStorage = (key: string, value: any) => {
//   try {
//     localStorage.setItem(key, JSON.stringify(value));
//   } catch (error) {
//     console.error('LocalStorage error:', error);
//   }
// };

// API call wrapper with fallback
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {},
  fallbackData?: T
): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.warn('API call failed, using fallback:', error);
    if (fallbackData !== undefined) {
      return fallbackData;
    }
    throw error;
  }
}

export const dbService = {
  // Health Check
  async checkHealth(): Promise<{ status: string; database: string; timestamp: string }> {
    return checkBackendHealth().then(connected => ({
      status: 'ok',
      database: connected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    }));
  },

  // Admin APIs
  async adminLogin(id: string, password: string): Promise<{ success: boolean; message: string }> {
    return apiCall('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ id, password }),
    });
  },

  async getAdminStats(): Promise<AdminStats> {
    const fallback: AdminStats = {
      totalMaliks: 0,
      totalBhadots: 0,
      totalRequests: 0,
      pendingRequests: 0,
      acceptedRequests: 0,
    };
    return apiCall('/admin/stats', {}, fallback);
  },

  async getAllUsers(): Promise<{ maliks: User[]; bhadots: User[] }> {
    const fallback = { maliks: [], bhadots: [] };
    return apiCall('/admin/users', {}, fallback);
  },

  async deleteUser(role: 'Malik' | 'Bhadot', id: string): Promise<{ success: boolean; message: string }> {
    return apiCall(`/admin/users/${role}/${id}`, {
      method: 'DELETE',
    });
  },

  async updateMalik(id: string, data: { name: string; whatsapp: string; address: string }): Promise<{ success: boolean; malik: Malik }> {
    return apiCall(`/malik/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async updateBhadot(id: string, data: { name: string; mobile: string; status?: string; cast?: string; totalFamilyMembers?: number }): Promise<{ success: boolean; bhadot: Bhadot }> {
    return apiCall(`/bhadot/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async getTransactions(): Promise<Transaction[]> {
    const fallback: Transaction[] = [];
    return apiCall('/admin/transactions', {}, fallback);
  },

  // Search API
  async searchUser(number: string): Promise<SearchResult> {
    const cleanNumber = number.replace(/\D/g, '');
    if (cleanNumber.length !== 10) {
      return { found: false };
    }

    try {
      return await apiCall(`/search/${cleanNumber}`, {}, { found: false });
    } catch {
      return { found: false };
    }
  },

  // Malik APIs
  async registerMalik(data: Omit<Malik, 'id' | 'createdAt'>): Promise<{ success: boolean; malik: Malik }> {
    return apiCall('/malik/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getMalik(id: string): Promise<Malik> {
    return apiCall(`/malik/${id}`);
  },

  async updateMalikAddress(id: string, address: string): Promise<{ success: boolean; malik: Malik }> {
    return apiCall(`/malik/${id}/address`, {
      method: 'PUT',
      body: JSON.stringify({ address }),
    });
  },


  async getMalikBhadots(malikId: string): Promise<Bhadot[]> {
    const fallback: Bhadot[] = [];
    return apiCall(`/malik/${malikId}/bhadots`, {}, fallback);
  },

  async sendRentalRequest(malikId: string, bhadotId: string): Promise<{ success: boolean; request: RentRequest }> {
    return apiCall('/malik/request', {
      method: 'POST',
      body: JSON.stringify({ malikId, bhadotId }),
    });
  },

  async getMalikRequests(malikId: string): Promise<RentRequestWithDetails[]> {
    const fallback: RentRequestWithDetails[] = [];
    return apiCall(`/malik/${malikId}/requests`, {}, fallback);
  },

  // Bhadot APIs
  async registerBhadot(data: { name: string; mobile: string; cast: string; totalFamilyMembers: number }): Promise<{ success: boolean; bhadot: Bhadot }> {
    return apiCall('/bhadot/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getBhadot(id: string): Promise<Bhadot> {
    return apiCall(`/bhadot/${id}`);
  },

  async getAvailableRoomsCount(): Promise<{ count: number }> {
    const fallback = { count: 0 };
    return apiCall('/bhadot/available-rooms', {}, fallback);
  },

  async getBhadotRequests(bhadotId: string): Promise<RentRequestWithDetails[]> {
    const fallback: RentRequestWithDetails[] = [];
    return apiCall(`/bhadot/${bhadotId}/requests`, {}, fallback);
  },

  async updateRequestStatus(requestId: string, status: 'Accepted' | 'Rejected'): Promise<{ success: boolean; request: RentRequest }> {
    return apiCall(`/bhadot/request/${requestId}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },
};


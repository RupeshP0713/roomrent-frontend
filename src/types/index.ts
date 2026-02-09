export interface Malik {
  id: string;
  name: string;
  whatsapp: string;
  address: string;
  createdAt?: string;
}

export interface Bhadot {
  id: string;
  name: string;
  mobile: string;
  area: string;
  cast?: string;
  totalFamilyMembers?: number;
  status: 'Waiting' | 'Approved';
  createdAt?: string;
}

export interface RentRequest {
  id: string;
  malikId: string;
  bhadotId: string;
  status: 'Pending' | 'Accepted' | 'Rejected';
  timestamp: string;
}

export interface RentRequestWithDetails {
  id: string;
  malikId: string;
  bhadotId: string;
  status: 'Pending' | 'Accepted' | 'Rejected';
  timestamp: string;
  malikName?: string;
  malikWhatsapp?: string | null;
  malikAddress?: string | null;
  bhadotName?: string;
  bhadotMobile?: string;
  bhadotArea?: string;
}

export interface AdminStats {
  totalMaliks: number;
  totalBhadots: number;
  totalRequests: number;
  pendingRequests: number;
  acceptedRequests: number;
}

export interface User {
  id: string;
  name: string;
  role: 'Malik' | 'Bhadot';
  whatsapp?: string;
  mobile?: string;
  address?: string;
  area?: string;
  status?: string;
  createdAt?: string;
}

export interface Transaction {
  id: string;
  malikName: string;
  bhadotName: string;
  status: string;
  timestamp: string;
}

export interface SearchResult {
  found: boolean;
  role?: 'Malik' | 'Bhadot';
  user?: Malik | Bhadot;
}


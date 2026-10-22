import axios from 'axios';

export interface Bid {
  id: string;
  cropId: string;
  buyerName: string;
  offeredPricePerKg: number;
  status: 'pending' | 'accepted' | 'rejected';
}

export async function fetchBidsForCrop(cropId: string): Promise<Bid[]> {
  const response = await axios.get(`/api/crops/${cropId}/bids`);
  return response.data;
}

// NOTE: Deliberate contract mismatch: Frontend uses POST, backend expects PUT
export async function acceptBid(bidId: string): Promise<{ success: boolean }> {
  const response = await axios.post(`/api/bids/${bidId}/accept`);
  return response.data;
}

export async function rejectBid(bidId: string): Promise<{ success: boolean }> {
  const response = await axios.post(`/api/bids/${bidId}/reject`);
  return response.data;
}

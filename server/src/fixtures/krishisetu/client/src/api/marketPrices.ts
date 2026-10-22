import axios from 'axios';

export interface MarketPrice {
  cropName: string;
  mandi: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  updatedAt: string;
}

// NOTE: Deliberate contract mismatch: Backend requires query param ?region=...,
// but frontend omits it
export async function getLiveMarketRates(): Promise<MarketPrice[]> {
  const response = await axios.get('/api/market-prices');
  return response.data;
}

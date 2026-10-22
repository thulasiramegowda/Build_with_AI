import axios from 'axios';

export interface Crop {
  id: string;
  name: string;
  quantityKg: number;
  expectedPricePerKg: number;
  harvestDate: string;
}

// NOTE: Deliberate contract mismatch: Frontend requests /api/v1/farmer/crops,
// but backend router registers /api/crops
export async function fetchFarmerCrops(): Promise<Crop[]> {
  const response = await axios.get('/api/v1/farmer/crops');
  return response.data;
}

export async function createCropListing(crop: Omit<Crop, 'id'>): Promise<Crop> {
  const response = await axios.post('/api/crops', crop);
  return response.data;
}

export async function getCropDetails(cropId: string): Promise<Crop> {
  const response = await axios.get(`/api/crops/${cropId}`);
  return response.data;
}

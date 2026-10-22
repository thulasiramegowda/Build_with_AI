export interface BidRecord {
  id: string;
  cropId: string;
  buyerName: string;
  offeredPricePerKg: number;
  status: 'pending' | 'accepted' | 'rejected';
}

const bidsStore: BidRecord[] = [
  { id: 'bid-101', cropId: 'crop-1', buyerName: 'AgroCorp Direct', offeredPricePerKg: 30, status: 'pending' },
  { id: 'bid-102', cropId: 'crop-1', buyerName: 'Indore Mandi Traders', offeredPricePerKg: 31.5, status: 'pending' },
  { id: 'bid-103', cropId: 'crop-2', buyerName: 'Heritage Grains Ltd', offeredPricePerKg: 64, status: 'accepted' },
];

export const BidModel = {
  findByCrop: async (cropId: string) => bidsStore.filter(b => b.cropId === cropId),
  updateStatus: async (id: string, status: 'accepted' | 'rejected') => {
    const bid = bidsStore.find(b => b.id === id);
    if (!bid) return null;
    bid.status = status;
    return bid;
  }
};

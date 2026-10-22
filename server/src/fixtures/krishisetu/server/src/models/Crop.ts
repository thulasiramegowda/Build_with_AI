export interface CropRecord {
  id: string;
  name: string;
  quantityKg: number;
  expectedPricePerKg: number;
  harvestDate: string;
}

const cropsStore: CropRecord[] = [
  { id: 'crop-1', name: 'Wheat (Sharbati)', quantityKg: 500, expectedPricePerKg: 32, harvestDate: '2026-03-15' },
  { id: 'crop-2', name: 'Organic Basmati Rice', quantityKg: 1200, expectedPricePerKg: 65, harvestDate: '2026-04-10' },
  { id: 'crop-3', name: 'Yellow Mustard', quantityKg: 400, expectedPricePerKg: 48, harvestDate: '2026-02-28' },
];

export const CropModel = {
  findAll: async () => cropsStore,
  findById: async (id: string) => cropsStore.find(c => c.id === id),
  create: async (data: Omit<CropRecord, 'id'>) => {
    const record = { id: `crop-${Date.now()}`, ...data };
    cropsStore.push(record);
    return record;
  }
};

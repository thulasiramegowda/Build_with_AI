import React, { useEffect, useState } from 'react';
import { fetchFarmerCrops, Crop } from '../api/crops';
import { getLiveMarketRates } from '../api/marketPrices';

export const CropDashboard: React.FC = () => {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFarmerCrops()
      .then(data => setCrops(data))
      .catch(err => console.error("Failed to load crops", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="crop-dashboard">
      <h2>Farmer Crop Listings</h2>
      {loading ? <p>Loading...</p> : (
        <ul>
          {crops.map(c => (
            <li key={c.id}>{c.name} - {c.quantityKg} kg @ ₹{c.expectedPricePerKg}/kg</li>
          ))}
        </ul>
      )}
    </div>
  );
};

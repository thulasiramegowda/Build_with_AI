import React, { useEffect, useState } from 'react';
import { fetchBidsForCrop, acceptBid, Bid } from '../api/bids';

export const BidHistory: React.FC<{ cropId: string }> = ({ cropId }) => {
  const [bids, setBids] = useState<Bid[]>([]);

  useEffect(() => {
    fetchBidsForCrop(cropId).then(setBids);
  }, [cropId]);

  const handleAccept = async (id: string) => {
    await acceptBid(id);
    alert('Bid accepted!');
  };

  return (
    <div>
      <h3>Incoming Bids</h3>
      {bids.map(b => (
        <div key={b.id}>
          <span>{b.buyerName} - ₹{b.offeredPricePerKg}</span>
          <button onClick={() => handleAccept(b.id)}>Accept</button>
        </div>
      ))}
    </div>
  );
};

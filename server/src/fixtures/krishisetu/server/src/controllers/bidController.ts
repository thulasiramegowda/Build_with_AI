import { Request, Response } from 'express';
import { BidModel } from '../models/Bid';

export async function getBidsByCrop(req: Request, res: Response) {
  const bids = await BidModel.findByCrop(req.params.id);
  res.json(bids);
}

export async function acceptBidHandler(req: Request, res: Response) {
  const updated = await BidModel.updateStatus(req.params.id, 'accepted');
  res.json({ success: true, bid: updated });
}

export async function rejectBidHandler(req: Request, res: Response) {
  const updated = await BidModel.updateStatus(req.params.id, 'rejected');
  res.json({ success: true, bid: updated });
}

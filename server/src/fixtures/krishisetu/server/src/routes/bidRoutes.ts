import { Router } from 'express';
import { getBidsByCrop, acceptBidHandler, rejectBidHandler } from '../controllers/bidController';

const router = Router();

router.get('/api/crops/:id/bids', getBidsByCrop);
// Backend expects PUT for status mutations
router.put('/api/bids/:id/accept', acceptBidHandler);
router.put('/api/bids/:id/reject', rejectBidHandler);

export default router;

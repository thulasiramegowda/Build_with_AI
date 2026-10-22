import { Router } from 'express';
import { getCrops, createCrop, getCropById } from '../controllers/cropController';

const router = Router();

// Express route definitions
router.get('/api/crops', getCrops);
router.post('/api/crops', createCrop);
router.get('/api/crops/:id', getCropById);

export default router;

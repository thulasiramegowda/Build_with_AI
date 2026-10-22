import { Router, Request, Response } from 'express';

const router = Router();

// Expects mandatory query param: ?region=...
router.get('/api/market-prices', (req: Request, res: Response) => {
  const { region } = req.query;
  if (!region) {
    return res.status(400).json({ error: "Missing required query parameter: region" });
  }
  return res.json([
    { cropName: "Wheat (Sharbati)", mandi: "Indore Mandi", minPrice: 2400, maxPrice: 2850, modalPrice: 2600, region }
  ]);
});

export default router;

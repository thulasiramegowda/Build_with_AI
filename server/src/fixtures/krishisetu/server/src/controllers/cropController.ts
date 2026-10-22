import { Request, Response } from 'express';
import { CropModel } from '../models/Crop';

export async function getCrops(req: Request, res: Response) {
  const crops = await CropModel.findAll();
  res.json(crops);
}

export async function createCrop(req: Request, res: Response) {
  const newCrop = await CropModel.create(req.body);
  res.status(201).json(newCrop);
}

export async function getCropById(req: Request, res: Response) {
  const crop = await CropModel.findById(req.params.id);
  if (!crop) return res.status(404).json({ error: 'Crop not found' });
  res.json(crop);
}

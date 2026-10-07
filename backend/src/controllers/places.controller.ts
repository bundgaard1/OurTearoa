import type { RequestHandler } from 'express';

import { getPrisma } from '../db.js';

type PlaceData = {
  name?: string;
  region?: string;
  description?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  type?: string | null;
};

function parsePlace(body: any, partial: boolean): { data?: PlaceData; error?: string } {
  const data: PlaceData = {};
  const { name, region, description, latitude, longitude, type } = body ?? {};

  if (name !== undefined || !partial) {
    if (typeof name !== 'string' || name.trim() === '' || name.length > 200) {
      return { error: 'name is required (max 200 characters)' };
    }
    data.name = name.trim();
  }
  if (region !== undefined || !partial) {
    if (typeof region !== 'string' || region.trim() === '' || region.length > 100) {
      return { error: 'region is required (max 100 characters)' };
    }
    data.region = region.trim();
  }
  for (const [key, value] of [['description', description], ['type', type]] as const) {
    if (value !== undefined) {
      if (value !== null && typeof value !== 'string') {
        return { error: `${key} must be a string` };
      }
      data[key] = value;
    }
  }
  if (latitude !== undefined) {
    if (latitude !== null && (typeof latitude !== 'number' || latitude < -90 || latitude > 90)) {
      return { error: 'latitude must be a number between -90 and 90' };
    }
    data.latitude = latitude;
  }
  if (longitude !== undefined) {
    if (longitude !== null && (typeof longitude !== 'number' || longitude < -180 || longitude > 180)) {
      return { error: 'longitude must be a number between -180 and 180' };
    }
    data.longitude = longitude;
  }
  return { data };
}

export const listPlaces: RequestHandler = async (req, res) => {
  const { region, q } = req.query;
  const where: Record<string, unknown> = {};
  if (typeof region === 'string' && region !== '') {
    where.region = { equals: region, mode: 'insensitive' };
  }
  if (typeof q === 'string' && q !== '') {
    where.name = { contains: q, mode: 'insensitive' };
  }
  const places = await getPrisma().place.findMany({ where, orderBy: { name: 'asc' } });
  res.json(places);
};

export const getPlace: RequestHandler = async (req, res) => {
  const place = await getPrisma().place.findUnique({ where: { id: String(req.params.id) } });
  if (!place) {
    res.status(404).json({ error: 'Place not found' });
    return;
  }
  res.json(place);
};

export const createPlace: RequestHandler = async (req, res) => {
  const { data, error } = parsePlace(req.body, false);
  if (!data) {
    res.status(400).json({ error });
    return;
  }
  const place = await getPrisma().place.create({ data: data as Required<Pick<PlaceData, 'name' | 'region'>> & PlaceData });
  res.status(201).json(place);
};

export const updatePlace: RequestHandler = async (req, res) => {
  const id = String(req.params.id);
  const prisma = getPrisma();
  if (!(await prisma.place.findUnique({ where: { id } }))) {
    res.status(404).json({ error: 'Place not found' });
    return;
  }
  const { data, error } = parsePlace(req.body, true);
  if (!data) {
    res.status(400).json({ error });
    return;
  }
  const place = await prisma.place.update({ where: { id }, data });
  res.json(place);
};

export const deletePlace: RequestHandler = async (req, res) => {
  const id = String(req.params.id);
  const prisma = getPrisma();
  if (!(await prisma.place.findUnique({ where: { id } }))) {
    res.status(404).json({ error: 'Place not found' });
    return;
  }
  await prisma.place.delete({ where: { id } });
  res.status(204).send();
};

import type { RequestHandler } from 'express';

import { getPrisma } from '../db.js';

export const listFavorites: RequestHandler = async (_req, res) => {
  const favorites = await getPrisma().favorite.findMany({
    where: { userId: res.locals.userId },
    include: { place: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(favorites);
};

export const addFavorite: RequestHandler = async (req, res) => {
  const { placeId } = req.body ?? {};
  if (typeof placeId !== 'string' || placeId === '') {
    res.status(400).json({ error: 'placeId is required' });
    return;
  }

  const prisma = getPrisma();
  if (!(await prisma.place.findUnique({ where: { id: placeId } }))) {
    res.status(404).json({ error: 'Place not found' });
    return;
  }

  const userId: string = res.locals.userId;
  const existing = await prisma.favorite.findUnique({
    where: { userId_placeId: { userId, placeId } },
  });
  if (existing) {
    res.status(409).json({ error: 'Place is already a favorite' });
    return;
  }

  const favorite = await prisma.favorite.create({
    data: { userId, placeId },
    include: { place: true },
  });
  res.status(201).json(favorite);
};

export const removeFavorite: RequestHandler = async (req, res) => {
  const id = String(req.params.id);
  const prisma = getPrisma();
  const favorite = await prisma.favorite.findUnique({ where: { id } });
  if (!favorite || favorite.userId !== res.locals.userId) {
    res.status(404).json({ error: 'Favorite not found' });
    return;
  }
  await prisma.favorite.delete({ where: { id } });
  res.status(204).end();
};

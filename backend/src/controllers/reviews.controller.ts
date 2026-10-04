import type { RequestHandler } from 'express';

import { getPrisma } from '../db.js';

const withAuthor = { user: { select: { id: true, name: true } } } as const;

function validRating(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 5;
}

export const getPlaceReviews: RequestHandler = async (req, res) => {
  const placeId = String(req.params.id);
  const prisma = getPrisma();
  if (!(await prisma.place.findUnique({ where: { id: placeId } }))) {
    res.status(404).json({ error: 'Place not found' });
    return;
  }
  const reviews = await prisma.review.findMany({
    where: { placeId },
    include: withAuthor,
    orderBy: { createdAt: 'desc' },
  });
  res.json(reviews);
};

export const getReview: RequestHandler = async (req, res) => {
  const review = await getPrisma().review.findUnique({
    where: { id: String(req.params.id) },
    include: withAuthor,
  });
  if (!review) {
    res.status(404).json({ error: 'Review not found' });
    return;
  }
  res.json(review);
};

export const createReview: RequestHandler = async (req, res) => {
  const { placeId, rating, comment } = req.body ?? {};
  if (typeof placeId !== 'string' || placeId === '' || !validRating(rating)) {
    res.status(400).json({ error: 'placeId and rating (integer 1-5) are required' });
    return;
  }
  if (comment !== undefined && comment !== null && typeof comment !== 'string') {
    res.status(400).json({ error: 'comment must be a string' });
    return;
  }

  const prisma = getPrisma();
  if (!(await prisma.place.findUnique({ where: { id: placeId } }))) {
    res.status(404).json({ error: 'Place not found' });
    return;
  }

  const review = await prisma.review.create({
    data: { userId: res.locals.userId, placeId, rating, comment: comment ?? null },
    include: withAuthor,
  });
  res.status(201).json(review);
};

export const updateReview: RequestHandler = async (req, res) => {
  const prisma = getPrisma();
  const existing = await prisma.review.findUnique({ where: { id: String(req.params.id) } });
  if (!existing || existing.userId !== res.locals.userId) {
    res.status(404).json({ error: 'Review not found' });
    return;
  }

  const { rating, comment } = req.body ?? {};
  if (rating !== undefined && !validRating(rating)) {
    res.status(400).json({ error: 'rating must be an integer 1-5' });
    return;
  }
  if (comment !== undefined && comment !== null && typeof comment !== 'string') {
    res.status(400).json({ error: 'comment must be a string' });
    return;
  }

  const review = await prisma.review.update({
    where: { id: existing.id },
    data: {
      ...(rating !== undefined && { rating }),
      ...(comment !== undefined && { comment }),
    },
    include: withAuthor,
  });
  res.json(review);
};

export const deleteReview: RequestHandler = async (req, res) => {
  const prisma = getPrisma();
  const existing = await prisma.review.findUnique({ where: { id: String(req.params.id) } });
  if (!existing || existing.userId !== res.locals.userId) {
    res.status(404).json({ error: 'Review not found' });
    return;
  }
  await prisma.review.delete({ where: { id: existing.id } });
  res.status(204).end();
};

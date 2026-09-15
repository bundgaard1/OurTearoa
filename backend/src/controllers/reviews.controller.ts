import type { RequestHandler } from 'express';

export const getPlaceReviews: RequestHandler = async (_req, res) => {
  res.status(501).json({ error: 'Not implemented' });
};

export const getReview: RequestHandler = async (_req, res) => {
  res.status(501).json({ error: 'Not implemented' });
};

export const createReview: RequestHandler = async (_req, res) => {
  res.status(501).json({ error: 'Not implemented' });
};
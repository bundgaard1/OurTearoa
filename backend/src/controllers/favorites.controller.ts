import type { RequestHandler } from 'express';

export const listFavorites: RequestHandler = async (_req, res) => {
  res.status(501).json({ error: 'Not implemented' });
};

export const addFavorite: RequestHandler = async (_req, res) => {
  res.status(501).json({ error: 'Not implemented' });
};
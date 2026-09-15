import type { RequestHandler } from 'express';

export const getUser: RequestHandler = async (_req, res) => {
  res.status(501).json({ error: 'Not implemented' });
};
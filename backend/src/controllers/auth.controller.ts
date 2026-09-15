import type { RequestHandler } from 'express';

export const register: RequestHandler = async (_req, res) => {
  res.status(501).json({ error: 'Not implemented' });
};

export const login: RequestHandler = async (_req, res) => {
  res.status(501).json({ error: 'Not implemented' });
};
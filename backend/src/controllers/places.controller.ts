import type { RequestHandler } from 'express';

export const listPlaces: RequestHandler = async (_req, res) => {
  res.status(501).json({ error: 'Not implemented' });
};

export const getPlace: RequestHandler = async (_req, res) => {
  res.status(501).json({ error: 'Not implemented' });
};

export const createPlace: RequestHandler = async (_req, res) => {
  res.status(501).json({ error: 'Not implemented' });
};

export const updatePlace: RequestHandler = async (_req, res) => {
  res.status(501).json({ error: 'Not implemented' });
};

export const deletePlace: RequestHandler = async (_req, res) => {
  res.status(501).json({ error: 'Not implemented' });
};
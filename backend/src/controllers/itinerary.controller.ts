import type { RequestHandler } from 'express';

export const listItinerary: RequestHandler = async (_req, res) => {
  res.status(501).json({ error: 'Not implemented' });
};

export const createItineraryEntry: RequestHandler = async (_req, res) => {
  res.status(501).json({ error: 'Not implemented' });
};

export const updateItineraryEntry: RequestHandler = async (_req, res) => {
  res.status(501).json({ error: 'Not implemented' });
};

export const deleteItineraryEntry: RequestHandler = async (_req, res) => {
  res.status(501).json({ error: 'Not implemented' });
};
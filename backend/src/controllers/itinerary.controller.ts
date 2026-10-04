import type { RequestHandler } from 'express';

import { getPrisma } from '../db.js';

function parseDate(value: unknown): Date | null {
  if (typeof value !== 'string') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function findOwnEntry(id: string, userId: string) {
  const entry = await getPrisma().itineraryEntry.findUnique({ where: { id } });
  return entry && entry.userId === userId ? entry : null;
}

export const listItinerary: RequestHandler = async (_req, res) => {
  const entries = await getPrisma().itineraryEntry.findMany({
    where: { userId: res.locals.userId },
    include: { place: true },
    orderBy: { startDate: 'asc' },
  });
  res.json(entries);
};

export const createItineraryEntry: RequestHandler = async (req, res) => {
  const { placeId, startDate, endDate, note } = req.body ?? {};
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  if (typeof placeId !== 'string' || placeId === '' || !start || !end) {
    res.status(400).json({ error: 'placeId, startDate and endDate (ISO dates) are required' });
    return;
  }
  if (end < start) {
    res.status(400).json({ error: 'endDate must not be before startDate' });
    return;
  }
  if (note !== undefined && note !== null && typeof note !== 'string') {
    res.status(400).json({ error: 'note must be a string' });
    return;
  }

  const prisma = getPrisma();
  if (!(await prisma.place.findUnique({ where: { id: placeId } }))) {
    res.status(404).json({ error: 'Place not found' });
    return;
  }

  const entry = await prisma.itineraryEntry.create({
    data: { userId: res.locals.userId, placeId, startDate: start, endDate: end, note: note ?? null },
    include: { place: true },
  });
  res.status(201).json(entry);
};

export const updateItineraryEntry: RequestHandler = async (req, res) => {
  const existing = await findOwnEntry(String(req.params.id), res.locals.userId);
  if (!existing) {
    res.status(404).json({ error: 'Itinerary entry not found' });
    return;
  }

  const { startDate, endDate, note } = req.body ?? {};
  const start = startDate === undefined ? existing.startDate : parseDate(startDate);
  const end = endDate === undefined ? existing.endDate : parseDate(endDate);
  if (!start || !end) {
    res.status(400).json({ error: 'startDate and endDate must be ISO dates' });
    return;
  }
  if (end < start) {
    res.status(400).json({ error: 'endDate must not be before startDate' });
    return;
  }
  if (note !== undefined && note !== null && typeof note !== 'string') {
    res.status(400).json({ error: 'note must be a string' });
    return;
  }

  const entry = await getPrisma().itineraryEntry.update({
    where: { id: existing.id },
    data: { startDate: start, endDate: end, ...(note !== undefined && { note }) },
    include: { place: true },
  });
  res.json(entry);
};

export const deleteItineraryEntry: RequestHandler = async (req, res) => {
  const existing = await findOwnEntry(String(req.params.id), res.locals.userId);
  if (!existing) {
    res.status(404).json({ error: 'Itinerary entry not found' });
    return;
  }
  await getPrisma().itineraryEntry.delete({ where: { id: existing.id } });
  res.status(204).end();
};

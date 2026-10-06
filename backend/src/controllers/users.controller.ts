import type { RequestHandler } from 'express';

import { getPrisma } from '../db.js';

const publicFields = { id: true, name: true, createdAt: true } as const;

export const getCurrentUser: RequestHandler = async (_req, res) => {
  const user = await getPrisma().user.findUnique({
    where: { id: res.locals.userId },
    select: { ...publicFields, email: true },
  });
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json(user);
};

export const deleteCurrentUser: RequestHandler = async (_req, res) => {
  const prisma = getPrisma();
  const user = await prisma.user.findUnique({ where: { id: res.locals.userId } });
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  await prisma.user.delete({ where: { id: user.id } });
  res.status(204).end();
};

export const getUser: RequestHandler = async (req, res) => {
  const user = await getPrisma().user.findUnique({
    where: { id: String(req.params.id) },
    select: publicFields,
  });
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json(user);
};

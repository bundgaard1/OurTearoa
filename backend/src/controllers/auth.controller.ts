import bcrypt from 'bcryptjs';
import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';

import { getPrisma } from '../db.js';
import { jwtSecret } from '../middleware/auth.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function signToken(userId: string): string {
  return jwt.sign({}, jwtSecret(), { subject: userId, expiresIn: '7d' });
}

export const register: RequestHandler = async (req, res) => {
  const { email, password, name } = req.body ?? {};
  if (
    typeof email !== 'string' ||
    !EMAIL_PATTERN.test(email) ||
    typeof password !== 'string' ||
    password.length < 8 ||
    typeof name !== 'string' ||
    name.trim() === '' ||
    name.length > 100
  ) {
    res.status(400).json({ error: 'email, name (max 100 chars) and password (min 8 chars) are required' });
    return;
  }

  const prisma = getPrisma();
  const normalizedEmail = email.trim().toLowerCase();
  if (await prisma.user.findUnique({ where: { email: normalizedEmail } })) {
    res.status(409).json({ error: 'Email already registered' });
    return;
  }

  const user = await prisma.user.create({
    data: { email: normalizedEmail, name: name.trim(), password: await bcrypt.hash(password, 10) },
  });
  res.status(201).json({
    token: signToken(user.id),
    user: { id: user.id, email: user.email, name: user.name },
  });
};

export const login: RequestHandler = async (req, res) => {
  const { email, password } = req.body ?? {};
  if (typeof email !== 'string' || typeof password !== 'string') {
    res.status(400).json({ error: 'email and password are required' });
    return;
  }

  const user = await getPrisma().user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }
  res.json({
    token: signToken(user.id),
    user: { id: user.id, email: user.email, name: user.name },
  });
};

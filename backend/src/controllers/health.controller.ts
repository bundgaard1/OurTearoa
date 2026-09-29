import type { RequestHandler } from 'express';

import { getPrisma } from '../db.js';

const DEFAULT_TIMEOUT_MS = 3000;

function timeoutMs(): number {
  const configured = Number(process.env.HEALTH_DB_TIMEOUT_MS);
  return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_TIMEOUT_MS;
}

class TimeoutError extends Error {}

async function withTimeout<T>(work: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      work,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new TimeoutError('health check timed out')), ms);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

export const healthCheck: RequestHandler = async (_req, res) => {
  const timestamp = new Date().toISOString();

  let prisma: ReturnType<typeof getPrisma>;
  try {
    prisma = getPrisma();
  } catch (err) {
    console.error('[health] database client unavailable:', err);
    res.status(503).json({
      status: 'DOWN',
      timestamp,
      database: 'DOWN',
      latencyMs: null,
      reason: 'misconfigured',
    });
    return;
  }

  const startedAt = process.hrtime.bigint();

  try {
    await withTimeout(prisma.$queryRaw`SELECT 1`, timeoutMs());
    const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    res.status(200).json({
      status: 'UP',
      timestamp,
      database: 'UP',
      latencyMs: Math.round(elapsedMs * 100) / 100,
      reason: null,
    });
  } catch (err) {
    console.error('[health] database query failed:', err);
    res.status(503).json({
      status: 'DOWN',
      timestamp,
      database: 'DOWN',
      latencyMs: null,
      reason: err instanceof TimeoutError ? 'timeout' : 'unreachable',
    });
  }
};

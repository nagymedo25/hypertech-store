import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { join } from 'path'

/**
 * Resolve the PostgreSQL connection URL.
 *
 * Priority:
 *   1. process.env.DATABASE_URL when it is a postgres:// URL
 *   2. the DATABASE_URL declared in .env (the sandbox shell sometimes
 *      injects a stale `file:` sqlite value that must never win)
 *   3. whatever process.env holds (let Prisma surface the error)
 */
function resolveDatabaseUrl(): string | undefined {
  let url = process.env.DATABASE_URL;
  if (!url || !url.startsWith('postgres')) {
    try {
      const envFile = readFileSync(join(process.cwd(), '.env'), 'utf8');
      const match = envFile.match(/^DATABASE_URL=(.+)$/m);
      const fromFile = match?.[1]?.trim().replace(/^"|"$/g, '');
      if (fromFile && fromFile.startsWith('postgres')) url = fromFile;
    } catch {
      /* no .env — fall through */
    }
  }
  if (url && url.startsWith('postgres')) {
    // Ensure optimal connection pool settings for Neon PgBouncer
    if (!url.includes('connection_limit=')) {
      url += (url.includes('?') ? '&' : '?') + 'connection_limit=20';
    }
    if (!url.includes('pool_timeout=')) {
      url += '&pool_timeout=30';
    }
  }
  return url;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url: resolveDatabaseUrl() } },
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

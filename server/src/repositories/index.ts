import { IRepository } from './interfaces.js';
import { MemoryRepository } from './memory.repository.js';
import { PrismaRepository } from './prisma.repository.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { PrismaClient } from '@prisma/client';

let repositoryInstance: IRepository | null = null;
let prismaClientInstance: PrismaClient | null = null;

export async function getRepository(): Promise<IRepository> {
  if (repositoryInstance) {
    return repositoryInstance;
  }

  // If in pure test environment without explicit DATABASE_URL testing, use MemoryRepository
  if (env.NODE_ENV === 'test' && !process.env.USE_PRISMA_TEST) {
    logger.info('Using In-Memory Repository for testing');
    repositoryInstance = new MemoryRepository();
    return repositoryInstance;
  }

  try {
    prismaClientInstance = new PrismaClient({
      datasources: {
        db: {
          url: env.DATABASE_URL,
        },
      },
      log: env.LOG_LEVEL === 'debug' ? ['query', 'error', 'warn'] : ['error'],
    });

    // Test connectivity and table existence with a timeout
    const connectPromise = (async () => {
      await prismaClientInstance.$connect();
      // Verify schema is migrated and accessible
      await prismaClientInstance.room.findFirst({ select: { id: true } });
    })();

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('PostgreSQL connection timeout or unmigrated tables')), 3500)
    );

    await Promise.race([connectPromise, timeoutPromise]);
    logger.info('Successfully connected to PostgreSQL with Prisma ORM');
    repositoryInstance = new PrismaRepository(prismaClientInstance);
    return repositoryInstance;
  } catch (err) {
    logger.warn({ err: (err as Error).message }, 'Failed to connect to PostgreSQL; falling back to in-memory repository for local resiliency');
    repositoryInstance = new MemoryRepository();
    return repositoryInstance;
  }
}

export function setTestRepository(repo: IRepository) {
  repositoryInstance = repo;
}

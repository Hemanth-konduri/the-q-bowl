import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Configure postgres-js connection client with pooling and timeout resilience for Supabase transaction pooler
const connectionString = process.env.DATABASE_URL!;

// Maintain a global singleton client across HMR reloads in Next.js to prevent socket leaks and ECONNRESET
const globalForDb = globalThis as unknown as {
  pgClient?: postgres.Sql;
  db?: ReturnType<typeof drizzle<typeof schema>>;
};

export const pgClient =
  globalForDb.pgClient ||
  postgres(connectionString, {
    prepare: false, // Required for PgBouncer / Transaction pooler
    max: process.env.NODE_ENV === "production" ? 20 : 10, // Manage connection limit
    idle_timeout: 15, // Close idle connections after 15s to prevent stale broken sockets
    connect_timeout: 15,
    max_lifetime: 60 * 15, // 15 mins
    backoff: (retryCount) => Math.min(retryCount * 100, 2000), // Exponential retry backoff
  });

export const db = globalForDb.db || drizzle(pgClient, { schema });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pgClient = pgClient;
  globalForDb.db = db;
}

/**
 * Executes a database operation with automatic retry on transient network/pool/DNS drops (e.g. ECONNRESET, ENOTFOUND, EAI_AGAIN)
 */
export async function withDbRetry<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await operation();
    } catch (err: any) {
      attempt++;
      const isConnectionError =
        err?.code === "ECONNRESET" ||
        err?.cause?.code === "ECONNRESET" ||
        err?.code === "ENOTFOUND" ||
        err?.cause?.code === "ENOTFOUND" ||
        err?.code === "EAI_AGAIN" ||
        err?.cause?.code === "EAI_AGAIN" ||
        err?.code === "ETIMEDOUT" ||
        err?.cause?.code === "ETIMEDOUT" ||
        err?.message?.includes("ECONNRESET") ||
        err?.message?.includes("ENOTFOUND") ||
        err?.message?.includes("connection reset") ||
        err?.message?.includes("Connection terminated") ||
        err?.message?.includes("getaddrinfo");

      if (attempt <= maxRetries && isConnectionError) {
        console.warn(`[DB Retry] Retrying operation due to network/DNS drop (attempt ${attempt}/${maxRetries})...`);
        await new Promise((res) => setTimeout(res, 200 * attempt));
        continue;
      }
      throw err;
    }
  }
}

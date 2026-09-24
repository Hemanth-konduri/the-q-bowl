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
    max: process.env.NODE_ENV === "production" ? 15 : 5, // Keep connection pool lean for serverless / dev
    idle_timeout: 20, // Close idle connections after 20s
    connect_timeout: 10, // 10s connection timeout
    max_lifetime: 60 * 10, // 10 mins
    ssl: { rejectUnauthorized: false },
    backoff: (retryCount) => Math.min(retryCount * 200, 2000), // Exponential retry backoff
  });

export const db = globalForDb.db || drizzle(pgClient, { schema });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pgClient = pgClient;
  globalForDb.db = db;
}

/**
 * Executes a database operation with automatic retry on transient network/pool/DNS drops (e.g. ECONNRESET, ENOTFOUND, CONNECT_TIMEOUT)
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
        err?.code === "CONNECT_TIMEOUT" ||
        err?.cause?.code === "CONNECT_TIMEOUT" ||
        err?.code === "CONNECTION_CLOSED" ||
        err?.cause?.code === "CONNECTION_CLOSED" ||
        err?.message?.includes("CONNECT_TIMEOUT") ||
        err?.message?.includes("ECONNRESET") ||
        err?.message?.includes("ENOTFOUND") ||
        err?.message?.includes("connection reset") ||
        err?.message?.includes("Connection terminated") ||
        err?.message?.includes("Connection closed") ||
        err?.message?.includes("getaddrinfo");

      if (attempt <= maxRetries && isConnectionError) {
        console.warn(`[DB Retry] Retrying operation due to network/DNS drop (attempt ${attempt}/${maxRetries})...`);
        await new Promise((res) => setTimeout(res, 300 * attempt));
        continue;
      }
      throw err;
    }
  }
}

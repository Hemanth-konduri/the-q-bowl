import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Configure postgres-js connection client with pooling and timeout resilience for Supabase transaction pooler
const connectionString = process.env.DATABASE_URL!;

const client = postgres(connectionString, {
  prepare: false, // Required for Supabase PgBouncer Transaction Pooler (port 6543)
  max: 20, // Max pool size
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 10, // 10s connection timeout
  max_lifetime: 60 * 30, // 30 mins
});

export const db = drizzle(client, { schema });


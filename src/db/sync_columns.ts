import postgres from "postgres";
import fs from "fs";
import path from "path";

const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf8");
  for (const line of envConfig.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const [key, ...vals] = trimmed.split("=");
      const val = vals.join("=").replace(/^["']|["']$/g, "");
      process.env[key.trim()] = val.trim();
    }
  }
}

async function main() {
  const dbUrl = process.env.DATABASE_URL || process.env.DIRECT_URL;
  if (!dbUrl) {
    console.error("DATABASE_URL not found!");
    process.exit(1);
  }

  const sql = postgres(dbUrl);
  console.log("Creating enum types and syncing database columns...");

  try {
    // 1. Create verification_status enum type if it doesn't exist
    await sql`
      DO $$ BEGIN
        CREATE TYPE verification_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;
    console.log("✓ Enum type 'verification_status' verified/created.");

    // 2. Create role enum type if it doesn't exist
    await sql`
      DO $$ BEGIN
        CREATE TYPE role AS ENUM ('CUSTOMER', 'ADMIN', 'DELIVERY_STAFF');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;
    console.log("✓ Enum type 'role' verified/created.");

    // 3. Add columns to users table
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone text;`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS username text;`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash text;`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id text;`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false NOT NULL;`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_status verification_status DEFAULT 'PENDING' NOT NULL;`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS aadhaar_document text;`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS id_proof_document text;`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_submitted_at timestamp;`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_reviewed_at timestamp;`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS rejection_reason text;`;

    console.log("✓ All columns synced successfully.");

    // 4. Create verification_requests table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS verification_requests (
        id text PRIMARY KEY,
        user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        aadhaar_document text NOT NULL,
        id_proof_document text NOT NULL,
        status verification_status DEFAULT 'PENDING' NOT NULL,
        review_notes text,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL,
        reviewed_at timestamp
      );
    `;
    console.log("✓ Table 'verification_requests' verified/created.");

    // 5. Create email_otps table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS email_otps (
        id text PRIMARY KEY,
        email text NOT NULL,
        otp text NOT NULL,
        expires_at timestamp NOT NULL,
        used boolean DEFAULT false NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `;
    console.log("✓ Table 'email_otps' verified/created.");

    const columns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users';
    `;
    console.log("Current 'users' table columns:", columns.map((c: any) => c.column_name));
  } catch (err) {
    console.error("Database sync error:", err);
  } finally {
    await sql.end();
  }
}

main();

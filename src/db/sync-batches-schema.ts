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
  console.log("Syncing delivery_batches & delivery_manifest schemas...");

  try {
    // 1. Create delivery_batches table
    await sql`
      CREATE TABLE IF NOT EXISTS delivery_batches (
        id text PRIMARY KEY,
        name text NOT NULL,
        meal_slot text DEFAULT 'LUNCH' NOT NULL,
        delivery_time text NOT NULL,
        assigned_partner_id text,
        status text DEFAULT 'SCHEDULED' NOT NULL,
        is_active boolean DEFAULT true NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      );
    `;
    console.log("✓ Table 'delivery_batches' verified/created.");

    // 2. Add columns to delivery_areas & subscriptions & subscription_deliveries
    await sql`ALTER TABLE delivery_areas ADD COLUMN IF NOT EXISTS batch_id text REFERENCES delivery_batches(id) ON DELETE SET NULL;`;
    await sql`ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS batch_id text REFERENCES delivery_batches(id);`;
    await sql`ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS credits_remaining integer;`;
    await sql`ALTER TABLE subscription_deliveries ADD COLUMN IF NOT EXISTS batch_id text REFERENCES delivery_batches(id);`;
    await sql`ALTER TABLE subscription_deliveries ADD COLUMN IF NOT EXISTS address_id text REFERENCES addresses(id);`;

    // 3. Create delivery_manifest table
    await sql`
      CREATE TABLE IF NOT EXISTS delivery_manifest (
        id text PRIMARY KEY,
        order_type text NOT NULL,
        reference_id text NOT NULL,
        batch_id text NOT NULL REFERENCES delivery_batches(id),
        customer_id text NOT NULL REFERENCES users(id),
        meal_id text REFERENCES food_items(id),
        address_id text REFERENCES addresses(id),
        delivery_partner_id text REFERENCES delivery_partners(id),
        delivery_date date NOT NULL,
        meal_slot text NOT NULL,
        status text DEFAULT 'SCHEDULED' NOT NULL,
        delivered_at timestamp,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      );
    `;
    console.log("✓ Table 'delivery_manifest' verified/created.");

    // 4. Seed default delivery batches if none exist
    const existingBatches = await sql`SELECT id FROM delivery_batches;`;
    if (existingBatches.length === 0) {
      console.log("Seeding default delivery batches...");
      await sql`
        INSERT INTO delivery_batches (id, name, meal_slot, delivery_time, status, is_active)
        VALUES 
          ('batch-1', 'Batch 1 - GIET & Vijay Bharathi', 'LUNCH', '12:30 PM', 'SCHEDULED', true),
          ('batch-2', 'Batch 2 - GSL Medical College', 'LUNCH', '01:00 PM', 'SCHEDULED', true),
          ('batch-3', 'Batch 3 - Aditya Campus', 'LUNCH', '01:30 PM', 'SCHEDULED', true),
          ('batch-4', 'Dinner Batch 1 - City Central', 'DINNER', '07:30 PM', 'SCHEDULED', true),
          ('batch-5', 'Dinner Batch 2 - Campus Hostels', 'DINNER', '08:30 PM', 'SCHEDULED', true)
        ON CONFLICT (id) DO NOTHING;
      `;
      console.log("✓ Default delivery batches seeded.");
    }

    // 5. Seed default delivery areas if none linked to batches
    const areas = await sql`SELECT id, name, batch_id FROM delivery_areas;`;
    if (areas.length > 0) {
      for (const area of areas) {
        if (!area.batch_id) {
          let bId = "batch-1";
          const areaLower = area.name.toLowerCase();
          if (areaLower.includes("gsl") || areaLower.includes("medical")) bId = "batch-2";
          else if (areaLower.includes("aditya") || areaLower.includes("campus")) bId = "batch-3";
          await sql`UPDATE delivery_areas SET batch_id = ${bId} WHERE id = ${area.id};`;
        }
      }
      console.log("✓ Linked existing delivery areas to default batches.");
    } else {
      console.log("Seeding default delivery areas...");
      await sql`
        INSERT INTO delivery_areas (id, name, batch_id, kitchen_lat, kitchen_lng, radius, delivery_fee, is_active)
        VALUES
          ('area-giet', 'GIET College & Vijay Bharathi', 'batch-1', 17.0005, 81.7795, 7.5, 0, true),
          ('area-gsl', 'GSL Medical College', 'batch-2', 17.0500, 81.8000, 7.5, 0, true),
          ('area-aditya', 'Aditya Campus', 'batch-3', 17.0200, 81.7900, 7.5, 0, true)
        ON CONFLICT (id) DO NOTHING;
      `;
      console.log("✓ Default delivery areas seeded.");
    }

    console.log("✓ All delivery batch schema sync & seed steps completed!");
  } catch (err) {
    console.error("Error syncing batch schema:", err);
  } finally {
    await sql.end();
  }
}

main();

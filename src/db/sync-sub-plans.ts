import "dotenv/config";
import postgres from "postgres";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("No DATABASE_URL");
    process.exit(1);
  }
  const client = postgres(connectionString);

  // 1. Update Full Veg Meal normal price to 60
  await client`
    UPDATE food_items 
    SET price = 60, updated_at = now() 
    WHERE id = 'f94ba23c-6558-4154-b63b-b40c61ab4269'
  `;

  // 2. Update Subscription Meal Pricing to 55 for subscriber
  await client`
    INSERT INTO subscription_meal_pricing (id, meal_id, price_per_meal, is_active, updated_at)
    VALUES ('smp-f94ba23c-6558-4154-b63b-b40c61ab4269', 'f94ba23c-6558-4154-b63b-b40c61ab4269', 55, true, now())
    ON CONFLICT (id) DO UPDATE SET
      price_per_meal = 55,
      is_active = true,
      updated_at = now()
  `;

  // 3. Upsert the 3 exact packages: 20 meals/month, 30 meals/month, 60 meals/month
  await client`
    INSERT INTO subscription_packages (id, name, meal_credits, discount, is_featured, is_active, updated_at)
    VALUES 
      ('pkg-20-meals', '20 Meals / Month', 20, 0, false, true, now()),
      ('pkg-30-meals', '30 Meals / Month', 30, 0, true, true, now()),
      ('pkg-60-meals', '60 Meals / Month', 60, 0, false, true, now())
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      meal_credits = EXCLUDED.meal_credits,
      discount = 0,
      is_featured = EXCLUDED.is_featured,
      is_active = true,
      updated_at = now()
  `;

  // 4. Deactivate old/other packages
  await client`
    UPDATE subscription_packages 
    SET is_active = false 
    WHERE id NOT IN ('pkg-20-meals', 'pkg-30-meals', 'pkg-60-meals')
  `;

  const pkgs = await client`SELECT id, name, meal_credits, discount, is_featured, is_active FROM subscription_packages WHERE is_active = true ORDER BY meal_credits ASC`;
  console.log("Active packages in DB:", pkgs);

  const meal = await client`SELECT id, name, price, is_veg FROM food_items WHERE id = 'f94ba23c-6558-4154-b63b-b40c61ab4269'`;
  console.log("Veg Meal in DB:", meal);

  const smp = await client`SELECT * FROM subscription_meal_pricing WHERE meal_id = 'f94ba23c-6558-4154-b63b-b40c61ab4269'`;
  console.log("SMP in DB:", smp);

  await client.end();
  console.log("Database update completed successfully.");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});

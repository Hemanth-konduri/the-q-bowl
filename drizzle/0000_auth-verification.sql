DO $$ BEGIN
  CREATE TYPE "public"."verification_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "username" text,
  ADD COLUMN IF NOT EXISTS "email_verified" boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS "verification_status" "verification_status" DEFAULT 'PENDING' NOT NULL,
  ADD COLUMN IF NOT EXISTS "aadhaar_document" text,
  ADD COLUMN IF NOT EXISTS "id_proof_document" text,
  ADD COLUMN IF NOT EXISTS "verification_submitted_at" timestamp,
  ADD COLUMN IF NOT EXISTS "verification_reviewed_at" timestamp;

CREATE UNIQUE INDEX IF NOT EXISTS "users_username_unique" ON "users" ("username");

CREATE TABLE IF NOT EXISTS "verification_requests" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "aadhaar_document" text NOT NULL,
  "id_proof_document" text NOT NULL,
  "status" "verification_status" DEFAULT 'PENDING' NOT NULL,
  "review_notes" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "reviewed_at" timestamp
);

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL as string);

async function main() {
  await sql`
    CREATE TABLE IF NOT EXISTS visits (
      id BIGSERIAL PRIMARY KEY,
      visitor_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      path TEXT NOT NULL,
      referrer TEXT,
      user_agent TEXT,
      is_admin BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS visits_created_at_idx ON visits (created_at)`;
  await sql`CREATE INDEX IF NOT EXISTS visits_visitor_id_idx ON visits (visitor_id)`;
  await sql`CREATE INDEX IF NOT EXISTS visits_session_id_idx ON visits (session_id)`;
  console.log("visits table ready.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

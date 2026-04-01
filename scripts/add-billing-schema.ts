import * as dotenv from 'dotenv'
import { createClient } from '@libsql/client'

dotenv.config()

async function main() {
  const turso = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  })

  console.log('Adding projectType column to Project table...')
  try {
    await turso.execute(`ALTER TABLE "Project" ADD COLUMN "projectType" TEXT NOT NULL DEFAULT 'fixed'`)
    console.log('Column projectType added successfully.')
  } catch (e: unknown) {
    if (e instanceof Error && e.message.toLowerCase().includes('duplicate column')) {
      console.log('Column projectType already exists, skipping.')
    } else {
      throw e
    }
  }

  console.log('Creating ProjectResourceRate table...')
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS "ProjectResourceRate" (
      "id"          INTEGER PRIMARY KEY AUTOINCREMENT,
      "projectId"   INTEGER NOT NULL,
      "resourceId"  INTEGER NOT NULL,
      "profile"     TEXT NOT NULL DEFAULT 'Developer',
      "ratePerHour" REAL NOT NULL DEFAULT 0,
      "billable"    INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE,
      FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE,
      UNIQUE ("projectId", "resourceId")
    )
  `)
  console.log('ProjectResourceRate table created (or already exists).')

  turso.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

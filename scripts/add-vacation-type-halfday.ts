import * as dotenv from 'dotenv'
import { createClient } from '@libsql/client'

dotenv.config()

// Idempotent: adds type/halfDay columns to Vacation, needed for the CSV
// import of "Registro Inasistencias/Vacaciones" (Type of Time off, Half Day
// or Full Day?). Safe to run repeatedly.
async function main() {
  const turso = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  })

  console.log('Adding type column to Vacation table...')
  try {
    await turso.execute(`ALTER TABLE "Vacation" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'Vacation / Day Off'`)
    console.log('✅ type column added.')
  } catch (e: unknown) {
    if (e instanceof Error && e.message.toLowerCase().includes('duplicate column')) {
      console.log('ℹ️  type column already exists, skipping.')
    } else {
      throw e
    }
  }

  console.log('Adding halfDay column to Vacation table...')
  try {
    await turso.execute(`ALTER TABLE "Vacation" ADD COLUMN "halfDay" BOOLEAN NOT NULL DEFAULT false`)
    console.log('✅ halfDay column added.')
  } catch (e: unknown) {
    if (e instanceof Error && e.message.toLowerCase().includes('duplicate column')) {
      console.log('ℹ️  halfDay column already exists, skipping.')
    } else {
      throw e
    }
  }

  turso.close()
  console.log('\nMigration complete.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

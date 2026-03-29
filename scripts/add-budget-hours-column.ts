import * as dotenv from 'dotenv'
import { createClient } from '@libsql/client'

dotenv.config()

async function main() {
  const turso = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  })

  console.log('Adding budgetHours column to Project table...')

  try {
    await turso.execute(`ALTER TABLE "Project" ADD COLUMN "budgetHours" REAL`)
    console.log('Column budgetHours added successfully.')
  } catch (e: unknown) {
    if (e instanceof Error && e.message.toLowerCase().includes('duplicate column')) {
      console.log('Column already exists, skipping.')
    } else {
      throw e
    }
  }

  turso.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

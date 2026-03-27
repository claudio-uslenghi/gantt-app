import * as dotenv from 'dotenv'
import { createClient } from '@libsql/client'

dotenv.config()

async function main() {
  const turso = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  })

  console.log('Creating TimeEntry table...')

  await turso.execute(`
    CREATE TABLE IF NOT EXISTS "TimeEntry" (
      "id"         INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "resourceId" INTEGER NOT NULL,
      "projectId"  INTEGER NOT NULL,
      "date"       TEXT    NOT NULL,
      "hours"      REAL    NOT NULL,
      FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE,
      FOREIGN KEY ("projectId")  REFERENCES "Project"("id")  ON DELETE CASCADE
    )
  `)

  await turso.execute(`
    CREATE UNIQUE INDEX IF NOT EXISTS "TimeEntry_resourceId_projectId_date_key"
    ON "TimeEntry"("resourceId", "projectId", "date")
  `)

  await turso.execute(`
    CREATE INDEX IF NOT EXISTS "TimeEntry_date_idx"
    ON "TimeEntry"("date")
  `)

  await turso.execute(`
    CREATE INDEX IF NOT EXISTS "TimeEntry_resourceId_idx"
    ON "TimeEntry"("resourceId")
  `)

  await turso.execute(`
    CREATE INDEX IF NOT EXISTS "TimeEntry_projectId_idx"
    ON "TimeEntry"("projectId")
  `)

  console.log('TimeEntry table created successfully.')
  turso.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

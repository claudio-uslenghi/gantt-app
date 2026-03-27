import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { createClient } from '@libsql/client'
import type { ImportTimeEntriesResult, ParsedTimeEntry } from '@/types'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const roles = (session?.user as { roles?: string[] })?.roles ?? []
  if (!roles.includes('admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const entries: ParsedTimeEntry[] = body.entries ?? []

  if (!entries.length) {
    return NextResponse.json({ error: 'No entries provided' }, { status: 400 })
  }

  // Build lookup maps (case-insensitive)
  const resources = await prisma.resource.findMany({ select: { id: true, name: true } })
  const projects = await prisma.project.findMany({ select: { id: true, name: true } })

  const resourceMap = new Map<string, number>(
    resources.map((r) => [r.name.toLowerCase().trim(), r.id])
  )
  const projectMap = new Map<string, number>(
    projects.map((p) => [p.name.toLowerCase().trim(), p.id])
  )

  const unmatchedResources = new Set<string>()
  const unmatchedProjects = new Set<string>()

  type ResolvedEntry = { resourceId: number; projectId: number; date: string; hours: number }
  const resolved: ResolvedEntry[] = []

  for (const e of entries) {
    const resourceId = resourceMap.get(e.resourceName.toLowerCase().trim())
    const projectId = projectMap.get(e.projectName.toLowerCase().trim())

    if (!resourceId) {
      unmatchedResources.add(e.resourceName)
      continue
    }
    if (!projectId) {
      unmatchedProjects.add(e.projectName)
      continue
    }

    resolved.push({ resourceId, projectId, date: e.date, hours: e.hours })
  }

  if (!resolved.length) {
    const result: ImportTimeEntriesResult = {
      inserted: 0,
      updated: 0,
      skipped: entries.length,
      unmatchedResources: Array.from(unmatchedResources),
      unmatchedProjects: Array.from(unmatchedProjects),
      errors: [],
    }
    return NextResponse.json(result)
  }

  // Fetch existing entries to count inserts vs updates
  const existingSet = new Set<string>()
  const existingRows = await prisma.timeEntry.findMany({
    where: {
      OR: resolved.map((e) => ({
        resourceId: e.resourceId,
        projectId: e.projectId,
        date: new Date(e.date),
      })),
    },
    select: { resourceId: true, projectId: true, date: true },
  })
  for (const row of existingRows) {
    const key = `${row.resourceId}_${row.projectId}_${(row.date as unknown as Date).toISOString().substring(0, 10)}`
    existingSet.add(key)
  }

  // Use libSQL batch for performance (single HTTP round-trip)
  const turso = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  })

  const statements = resolved.map((e) => ({
    sql: `INSERT INTO "TimeEntry" (resourceId, projectId, date, hours)
          VALUES (?, ?, ?, ?)
          ON CONFLICT (resourceId, projectId, date) DO UPDATE SET hours = excluded.hours`,
    args: [e.resourceId, e.projectId, e.date, e.hours],
  }))

  await turso.batch(statements, 'write')
  turso.close()

  // Count inserts vs updates
  let inserted = 0
  let updated = 0
  for (const e of resolved) {
    const key = `${e.resourceId}_${e.projectId}_${e.date.substring(0, 10)}`
    if (existingSet.has(key)) updated++
    else inserted++
  }

  const result: ImportTimeEntriesResult = {
    inserted,
    updated,
    skipped: entries.length - resolved.length,
    unmatchedResources: Array.from(unmatchedResources),
    unmatchedProjects: Array.from(unmatchedProjects),
    errors: [],
  }

  return NextResponse.json(result)
}

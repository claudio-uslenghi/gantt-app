import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { createClient } from '@libsql/client'
import type { ImportTimeEntriesResult, ParsedTimeEntry } from '@/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    return await handleImport(req)
  } catch (err) {
    // An uncaught throw here previously reached the client as an empty
    // 500 body (Vercel truncates it), which surfaces as a confusing
    // "Unexpected end of JSON input" — always return real JSON instead.
    console.error('time-entries/import failed:', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Import failed' }, { status: 500 })
  }
}

async function handleImport(req: NextRequest) {
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
  const tasks = await prisma.task.findMany({ select: { id: true, projectId: true, name: true } })

  const resourceMap = new Map<string, number>(
    resources.map((r) => [r.name.toLowerCase().trim(), r.id])
  )
  const projectMap = new Map<string, number>(
    projects.map((p) => [p.name.toLowerCase().trim(), p.id])
  )
  // Scoped by projectId, unlike resourceMap/projectMap — Task.name is only
  // unique per project (enforced by @@unique([projectId, name])), never
  // globally, so the key has to carry the project too.
  const taskMap = new Map<string, number>(
    tasks.map((t) => [`${t.projectId}:${t.name.toLowerCase().trim()}`, t.id])
  )
  let tasksCreated = 0

  const unmatchedResources = new Set<string>()
  const unmatchedProjects = new Set<string>()

  type ResolvedEntry = { resourceId: number; projectId: number; taskId: number | null; date: string; hours: number; entryType: string }
  const resolved: ResolvedEntry[] = []

  for (const e of entries) {
    let resourceId = resourceMap.get(e.resourceName.toLowerCase().trim())

    // Fallback: match by email using "first-initial + last-name" convention
    // e.g. "cuslenghi@zircon.tech" → prefix "cuslenghi" → matches "Claudio Uslenghi"
    if (!resourceId && e.resourceEmail) {
      const prefix = e.resourceEmail.split('@')[0].toLowerCase()
      const found = resources.find((r) => {
        const parts = r.name.toLowerCase().split(/\s+/)
        if (parts.length >= 2) {
          const initLast = parts[0][0] + parts[parts.length - 1]
          return initLast === prefix
        }
        return r.name.toLowerCase().replace(/\s+/g, '') === prefix
      })
      if (found) resourceId = found.id
    }

    const projectId = projectMap.get(e.projectName.toLowerCase().trim())

    if (!resourceId) {
      unmatchedResources.add(e.resourceEmail ? `${e.resourceName} (${e.resourceEmail})` : e.resourceName)
      continue
    }
    if (!projectId) {
      unmatchedProjects.add(e.projectName)
      continue
    }

    // Empty "Tarea" column stays taskId: null — same as today (T&M-style).
    // Otherwise match case-insensitively within this project, creating the
    // task on first sight — Clockify is the source of truth for task names
    // going forward, per the user's decision.
    let taskId: number | null = null
    const taskName = e.taskName?.trim()
    if (taskName) {
      const taskKey = `${projectId}:${taskName.toLowerCase()}`
      taskId = taskMap.get(taskKey) ?? null
      if (taskId == null) {
        const created = await prisma.task.create({ data: { projectId, name: taskName } })
        taskId = created.id
        taskMap.set(taskKey, taskId)
        tasksCreated++
      }
    }

    resolved.push({ resourceId, projectId, taskId, date: e.date, hours: e.hours, entryType: e.entryType ?? 'regular' })
  }

  if (!resolved.length) {
    return NextResponse.json({
      inserted: 0,
      updated: 0,
      skipped: entries.length,
      tasksCreated,
      unmatchedResources: Array.from(unmatchedResources),
      unmatchedProjects: Array.from(unmatchedProjects),
      errors: [],
    } satisfies ImportTimeEntriesResult)
  }

  // The real unique constraint is (resourceId, projectId, date, entryType,
  // taskId) — 5 columns — and SQLite treats every NULL as distinct in a
  // unique index, so an `ON CONFLICT` target can't reliably match rows
  // where taskId is null. Look up existing rows explicitly instead — same
  // pattern already used in /api/me/time-entries for this case. taskId is
  // folded into the lookup key as the string 'none' for null (matching the
  // rowKey() convention already used in app/mis-horas/page.tsx), so entries
  // are matched per-task, not collapsed across tasks for the same day.
  // Scoped by resourceId only (no date range filter) — SQLite/Turso can
  // store the datetime with enough floating-point drift that an exact-
  // boundary gte/lte range silently excludes rows whose stored value is a
  // fraction of a millisecond outside it, which caused a real duplicate
  // row in testing. Matching is done purely on the YYYY-MM-DD substring
  // below, which is immune to that.
  const resourceIds = Array.from(new Set(resolved.map((e) => e.resourceId)))
  const existing = await prisma.timeEntry.findMany({
    where: { resourceId: { in: resourceIds } },
    select: { id: true, resourceId: true, projectId: true, taskId: true, date: true, entryType: true },
  })
  const existingMap = new Map(
    existing.map((e) => [
      `${e.resourceId}:${e.projectId}:${e.taskId ?? 'none'}:${e.date.toISOString().substring(0, 10)}:${e.entryType}`,
      e.id,
    ])
  )

  const toInsert: ResolvedEntry[] = []
  const toUpdate: { id: number; hours: number }[] = []
  for (const e of resolved) {
    const key = `${e.resourceId}:${e.projectId}:${e.taskId ?? 'none'}:${e.date.substring(0, 10)}:${e.entryType}`
    const existingId = existingMap.get(key)
    if (existingId) toUpdate.push({ id: existingId, hours: e.hours })
    else toInsert.push(e)
  }

  // Use libSQL batch for performance (single HTTP round-trip to Turso)
  const turso = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  })

  // Process in chunks of 1000 to avoid request size limits
  const CHUNK = 1000
  for (let i = 0; i < toInsert.length; i += CHUNK) {
    const chunk = toInsert.slice(i, i + CHUNK)
    await turso.batch(
      chunk.map((e) => ({
        sql: `INSERT INTO "TimeEntry" (resourceId, projectId, taskId, date, hours, entryType) VALUES (?, ?, ?, ?, ?, ?)`,
        args: [e.resourceId, e.projectId, e.taskId, e.date, e.hours, e.entryType],
      })),
      'write'
    )
  }
  for (let i = 0; i < toUpdate.length; i += CHUNK) {
    const chunk = toUpdate.slice(i, i + CHUNK)
    await turso.batch(
      chunk.map((u) => ({
        sql: `UPDATE "TimeEntry" SET hours = ? WHERE id = ?`,
        args: [u.hours, u.id],
      })),
      'write'
    )
  }
  turso.close()

  const inserted = toInsert.length
  const updated = toUpdate.length

  return NextResponse.json({
    inserted,
    updated,
    skipped: entries.length - resolved.length,
    tasksCreated,
    unmatchedResources: Array.from(unmatchedResources),
    unmatchedProjects: Array.from(unmatchedProjects),
    errors: [],
  } satisfies ImportTimeEntriesResult)
}

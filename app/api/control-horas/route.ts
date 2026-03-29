export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { ControlHorasProject, ControlHorasResponse } from '@/types'

export async function GET() {
  const [entries, projects] = await Promise.all([
    prisma.timeEntry.findMany({
      select: { projectId: true, date: true, hours: true },
      orderBy: { date: 'asc' },
    }),
    prisma.project.findMany({
      select: { id: true, name: true, color: true, status: true, budgetHours: true, estimatedHours: true },
      orderBy: { name: 'asc' },
    }),
  ])

  // Build monthly gross hours per project
  const monthlyGrossMap = new Map<number, Map<string, number>>()
  const allMonths = new Set<string>()

  for (const e of entries) {
    const iso = typeof e.date === 'string' ? e.date : (e.date as unknown as Date).toISOString()
    const month = iso.substring(0, 7)
    allMonths.add(month)

    if (!monthlyGrossMap.has(e.projectId)) monthlyGrossMap.set(e.projectId, new Map())
    const pm = monthlyGrossMap.get(e.projectId)!
    pm.set(month, (pm.get(month) ?? 0) + e.hours)
  }

  const months = Array.from(allMonths).sort()

  const projectsData: ControlHorasProject[] = projects
    .filter((p) => p.status !== 'No Facturable')           // exclude no-billable projects
    .filter((p) => monthlyGrossMap.has(p.id))              // only projects with entries
    .map((p) => {
      const gross = monthlyGrossMap.get(p.id)!

      // Effective budget:
      // - Continuo → unlimited (null)
      // - explicit budgetHours set → use that
      // - otherwise → use estimatedHours as cap
      const budgetIsEstimated = p.status !== 'Continuo' && p.budgetHours === null
      const effectiveBudget: number | null =
        p.status === 'Continuo'   ? null :
        p.budgetHours !== null    ? p.budgetHours :
        p.estimatedHours

      const monthlyGross: Record<string, number> = {}
      const monthlyBillable: Record<string, number> = {}

      let remaining = effectiveBudget === null ? Infinity : effectiveBudget

      for (const month of months) {
        const grossH = gross.get(month) ?? 0
        monthlyGross[month] = grossH

        if (effectiveBudget === null) {
          monthlyBillable[month] = grossH
        } else if (effectiveBudget === 0) {
          monthlyBillable[month] = 0
        } else {
          const billable = Math.min(grossH, Math.max(0, remaining))
          monthlyBillable[month] = billable
          remaining -= billable
        }
      }

      const totalGross = Object.values(monthlyGross).reduce((s, h) => s + h, 0)
      const totalBillable = Object.values(monthlyBillable).reduce((s, h) => s + h, 0)
      const surplus = totalGross - totalBillable

      let status: ControlHorasProject['status']
      if (effectiveBudget === null) status = 'unlimited'
      else if (effectiveBudget === 0) status = 'no-billable'
      else {
        const pct = totalBillable / effectiveBudget
        status = pct >= 1 ? 'exceeded' : pct >= 0.8 ? 'warning' : 'ok'
      }

      return {
        projectId: p.id,
        projectName: p.name,
        projectColor: p.color,
        projectStatus: p.status,
        budgetHours: effectiveBudget,
        budgetIsEstimated,
        monthlyGross,
        monthlyBillable,
        totalGross,
        totalBillable,
        surplus,
        status,
      }
    })
    .sort((a, b) => b.totalGross - a.totalGross)

  return NextResponse.json({ months, projects: projectsData } satisfies ControlHorasResponse)
}

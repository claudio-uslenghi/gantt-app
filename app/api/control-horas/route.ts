export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { ControlHorasProject, ControlHorasResponse, ResourceBillingBreakdown } from '@/types'

export async function GET() {
  const [entries, projects, resources, allRates] = await Promise.all([
    prisma.timeEntry.findMany({
      select: { projectId: true, resourceId: true, date: true, hours: true },
      orderBy: { date: 'asc' },
    }),
    prisma.project.findMany({
      select: {
        id: true, name: true, color: true, status: true,
        budgetHours: true, estimatedHours: true, projectType: true,
      },
      orderBy: { name: 'asc' },
    }),
    prisma.resource.findMany({ select: { id: true, name: true, color: true } }),
    prisma.projectResourceRate.findMany(),
  ])

  // Lookup maps
  const resourceMap = new Map(resources.map((r) => [r.id, r]))
  // key = `${projectId}:${resourceId}`
  const rateMap = new Map(allRates.map((r) => [`${r.projectId}:${r.resourceId}`, r]))

  // Build monthly gross hours per project and per resource
  const monthlyGrossMap = new Map<number, Map<string, number>>()
  // monthlyResourceHoursMap: projectId → resourceId → month → hours
  const monthlyResourceHoursMap = new Map<number, Map<number, Map<string, number>>>()
  const allMonths = new Set<string>()

  for (const e of entries) {
    const iso = typeof e.date === 'string' ? e.date : (e.date as unknown as Date).toISOString()
    const month = iso.substring(0, 7)
    allMonths.add(month)

    // Project gross
    if (!monthlyGrossMap.has(e.projectId)) monthlyGrossMap.set(e.projectId, new Map())
    const pm = monthlyGrossMap.get(e.projectId)!
    pm.set(month, (pm.get(month) ?? 0) + e.hours)

    // Resource breakdown
    if (!monthlyResourceHoursMap.has(e.projectId)) monthlyResourceHoursMap.set(e.projectId, new Map())
    const resMap = monthlyResourceHoursMap.get(e.projectId)!
    if (!resMap.has(e.resourceId)) resMap.set(e.resourceId, new Map())
    const mMap = resMap.get(e.resourceId)!
    mMap.set(month, (mMap.get(month) ?? 0) + e.hours)
  }

  const months = Array.from(allMonths).sort()

  const projectsData: ControlHorasProject[] = projects
    .filter((p) => p.status !== 'No Facturable')
    .filter((p) => monthlyGrossMap.has(p.id))
    .map((p) => {
      const gross = monthlyGrossMap.get(p.id)!
      const resHoursMap = monthlyResourceHoursMap.get(p.id) ?? new Map()

      const budgetIsEstimated = p.status !== 'Continuo' && p.budgetHours === null
      const effectiveBudget: number | null =
        p.status === 'Continuo'   ? null :
        p.budgetHours !== null    ? p.budgetHours :
        p.estimatedHours

      const monthlyGross: Record<string, number> = {}
      const monthlyBillable: Record<string, number> = {}
      const monthlyResources: Record<string, ResourceBillingBreakdown[]> = {}

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

        // Build resource breakdown for this month
        const breakdown: ResourceBillingBreakdown[] = Array.from(resHoursMap.entries()).flatMap(([resourceId, monthMap]) => {
          const hours = monthMap.get(month)
          if (!hours) return []
          const res = resourceMap.get(resourceId)
          if (!res) return []
          const rate = rateMap.get(`${p.id}:${resourceId}`)
          const ratePerHour = rate?.ratePerHour ?? 0
          const billable = rate?.billable ?? true
          return [{
            resourceId,
            resourceName: res.name,
            resourceColor: res.color,
            profile: rate?.profile ?? '—',
            ratePerHour,
            billable,
            grossHours: hours,
            cost: billable ? hours * ratePerHour : 0,
          }]
        })
        breakdown.sort((a, b) => a.resourceName.localeCompare(b.resourceName))
        monthlyResources[month] = breakdown
      }

      const totalGross = Object.values(monthlyGross).reduce((s, h) => s + h, 0)
      const totalBillable = Object.values(monthlyBillable).reduce((s, h) => s + h, 0)
      const surplus = totalGross - totalBillable
      const totalCost = Object.values(monthlyResources)
        .flat()
        .reduce((s, r) => s + r.cost, 0)

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
        projectType: p.projectType ?? 'fixed',
        budgetHours: effectiveBudget,
        budgetIsEstimated,
        monthlyGross,
        monthlyBillable,
        monthlyResources,
        totalGross,
        totalBillable,
        totalCost,
        surplus,
        status,
      }
    })
    .sort((a, b) => b.totalGross - a.totalGross)

  return NextResponse.json({ months, projects: projectsData } satisfies ControlHorasResponse)
}

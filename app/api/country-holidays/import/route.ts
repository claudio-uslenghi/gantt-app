export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseISO, parse, isValid } from 'date-fns'

function parseDate(raw: string): Date | null {
  const trimmed = raw.trim()
  let d: Date | null = null
  const iso = parseISO(trimmed)
  if (isValid(iso)) d = iso
  else {
    const dmy = parse(trimmed, 'dd/MM/yyyy', new Date())
    if (isValid(dmy)) d = dmy
  }
  if (!d) return null
  // Store at noon UTC to avoid timezone day-shift in any timezone
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0))
}

function toDateKey(d: Date | string): string {
  return (typeof d === 'string' ? d : d.toISOString()).substring(0, 10)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const items: { country: string; date: string; name: string }[] = body.holidays ?? []

  if (!items.length) return NextResponse.json({ error: 'No hay feriados' }, { status: 400 })

  // Group by country
  const byCountry = new Map<string, { date: Date; name: string }[]>()
  for (const item of items) {
    const d = parseDate(item.date)
    if (!d || !item.country || !item.name) continue
    if (!byCountry.has(item.country)) byCountry.set(item.country, [])
    byCountry.get(item.country)!.push({ date: d, name: item.name.trim() })
  }

  let totalCountryHolidays = 0
  let totalResourceHolidays = 0

  for (const [country, holidays] of Array.from(byCountry.entries())) {
    // Fetch existing CountryHoliday records for this country and index by YYYY-MM-DD
    const existingCH = await prisma.countryHoliday.findMany({ where: { country } })
    const existingCHByKey = new Map(existingCH.map((h) => [toDateKey(h.date as unknown as string), h]))

    for (const h of holidays) {
      const key = toDateKey(h.date)
      const existing = existingCHByKey.get(key)
      if (existing) {
        // Already exists — update name if different, skip otherwise
        if (existing.name !== h.name) {
          await prisma.countryHoliday.update({ where: { id: existing.id }, data: { name: h.name } })
        }
      } else {
        await prisma.$executeRaw`
          INSERT INTO "CountryHoliday" (country, date, name)
          VALUES (${country}, ${h.date.toISOString()}, ${h.name})
        `
        existingCHByKey.set(key, { id: -1, country, date: h.date as unknown as Date, name: h.name })
      }
      totalCountryHolidays++
    }

    // Sync to Holiday for all resources of this country
    const resources = await prisma.resource.findMany({ where: { country } })
    for (const resource of resources) {
      const existingH = await prisma.holiday.findMany({ where: { resourceId: resource.id } })
      const existingHByKey = new Map(existingH.map((h) => [toDateKey(h.date as unknown as string), h]))

      for (const h of holidays) {
        const key = toDateKey(h.date)
        const existing = existingHByKey.get(key)
        if (existing) {
          if (existing.name !== h.name) {
            await prisma.holiday.update({ where: { id: existing.id }, data: { name: h.name } })
          }
        } else {
          await prisma.$executeRaw`
            INSERT INTO "Holiday" (resourceId, date, name)
            VALUES (${resource.id}, ${h.date.toISOString()}, ${h.name})
          `
          existingHByKey.set(key, { id: -1, resourceId: resource.id, date: h.date as unknown as Date, name: h.name })
        }
        totalResourceHolidays++
      }
    }
  }

  return NextResponse.json({ totalCountryHolidays, totalResourceHolidays })
}

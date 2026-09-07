// Parsing + resource-matching logic for the "Registro Inasistencias/Vacaciones"
// CSV import (Vacaciones programadas). Kept separate from CsvImportModal's
// country-holidays parser — different columns, different matching strategy.

export interface ResourceCandidate {
  id: number
  name: string
  email: string | null
}

export interface ParsedVacationRow {
  rowNumber: number
  email: string
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
  halfDay: boolean
  type: string
  resourceId: number | null
  matchKind: 'direct' | 'heuristic' | 'manual' | 'none'
  discarded: boolean
}

const REQUIRED_HEADERS = ['email address', 'starting', 'finishing', 'half day or full day?', 'type of time off']

export function normalizeText(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

// M/D/YYYY (as exported by the Google Form) -> YYYY-MM-DD, or null if invalid.
function parseUsDate(raw: string): string | null {
  const m = raw.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!m) return null
  const [, mo, d, y] = m
  const month = Number(mo)
  const day = Number(d)
  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`
}

export function parseVacationCsv(text: string): { rows: ParsedVacationRow[]; parseErrors: string[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  if (!lines.length) return { rows: [], parseErrors: ['Archivo vacío'] }

  const header = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/"/g, ''))
  const idx = {
    email: header.findIndex((h) => h.includes('email')),
    starting: header.findIndex((h) => h === 'starting'),
    finishing: header.findIndex((h) => h === 'finishing'),
    halfFull: header.findIndex((h) => h.includes('half day')),
    type: header.findIndex((h) => h.includes('type of time off')),
  }
  if (Object.values(idx).some((i) => i === -1)) {
    return { rows: [], parseErrors: [`El CSV debe tener las columnas: ${REQUIRED_HEADERS.join(', ')}`] }
  }

  const rows: ParsedVacationRow[] = []
  const parseErrors: string[] = []

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim().replace(/"/g, ''))
    const email = cols[idx.email]
    const startingRaw = cols[idx.starting]
    const finishingRaw = cols[idx.finishing]
    if (!email || !startingRaw || !finishingRaw) continue

    const startDate = parseUsDate(startingRaw)
    const endDate = parseUsDate(finishingRaw)
    if (!startDate || !endDate) {
      parseErrors.push(`Fila ${i + 1} (${email}): fecha inválida (${startingRaw} / ${finishingRaw})`)
      continue
    }

    // Alcance acordado: solo filas cuyo Starting cae en 2026.
    if (!startDate.startsWith('2026-')) continue

    if (endDate < startDate) {
      parseErrors.push(`Fila ${i + 1} (${email}): Finishing (${finishingRaw}) es anterior a Starting (${startingRaw}) — excluida`)
      continue
    }

    rows.push({
      rowNumber: i + 1,
      email,
      startDate,
      endDate,
      halfDay: (cols[idx.halfFull] ?? '').toLowerCase().includes('half'),
      type: cols[idx.type] || 'Vacation / Day Off',
      resourceId: null,
      matchKind: 'none',
      discarded: false,
    })
  }

  return { rows, parseErrors }
}

// Direct email match first; falls back to two name heuristics derived from
// how several Resources in this DB are actually named (no email on file):
// literal local-part-as-name ("fwade" resource <-> fwade@...) and
// initial-plus-second-word ("Pablo Pietraroia" <-> ppietraroia@...). Returns
// null (forcing manual assignment in the UI) on no match OR on ambiguity —
// never guesses between multiple equally-plausible candidates.
export function matchResourceByEmail(
  email: string,
  resources: ResourceCandidate[]
): { resource: ResourceCandidate; matchKind: 'direct' | 'heuristic' } | null {
  const target = normalizeText(email)

  const direct = resources.filter((r) => r.email && normalizeText(r.email) === target)
  if (direct.length === 1) return { resource: direct[0], matchKind: 'direct' }
  if (direct.length > 1) return null

  const localPart = target.split('@')[0] ?? ''
  const localAlnum = localPart.replace(/[^a-z0-9]/g, '')
  if (!localAlnum) return null

  const literal = resources.filter((r) => normalizeText(r.name).replace(/\s+/g, '') === localAlnum)
  if (literal.length === 1) return { resource: literal[0], matchKind: 'heuristic' }
  if (literal.length > 1) return null

  const initialPlusSecondWord = resources.filter((r) => {
    const parts = normalizeText(r.name).split(/\s+/).filter(Boolean)
    if (parts.length < 2) return false
    return parts[0][0] + parts[1] === localAlnum
  })
  if (initialPlusSecondWord.length === 1) return { resource: initialPlusSecondWord[0], matchKind: 'heuristic' }

  return null
}

export function resolveMatches(rows: ParsedVacationRow[], resources: ResourceCandidate[]): ParsedVacationRow[] {
  return rows.map((row) => {
    const match = matchResourceByEmail(row.email, resources)
    if (!match) return row
    return { ...row, resourceId: match.resource.id, matchKind: match.matchKind }
  })
}

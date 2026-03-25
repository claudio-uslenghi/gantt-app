export interface Country {
  code: string   // ISO 3166-1 alpha-2
  name: string
  flag: string
}

export const COUNTRIES: Country[] = [
  { code: 'AR', name: 'Argentina',   flag: '🇦🇷' },
  { code: 'BO', name: 'Bolivia',     flag: '🇧🇴' },
  { code: 'BR', name: 'Brasil',      flag: '🇧🇷' },
  { code: 'CL', name: 'Chile',       flag: '🇨🇱' },
  { code: 'CO', name: 'Colombia',    flag: '🇨🇴' },
  { code: 'CR', name: 'Costa Rica',  flag: '🇨🇷' },
  { code: 'CU', name: 'Cuba',        flag: '🇨🇺' },
  { code: 'EC', name: 'Ecuador',     flag: '🇪🇨' },
  { code: 'SV', name: 'El Salvador', flag: '🇸🇻' },
  { code: 'ES', name: 'España',      flag: '🇪🇸' },
  { code: 'GT', name: 'Guatemala',   flag: '🇬🇹' },
  { code: 'HN', name: 'Honduras',    flag: '🇭🇳' },
  { code: 'MX', name: 'México',      flag: '🇲🇽' },
  { code: 'NI', name: 'Nicaragua',   flag: '🇳🇮' },
  { code: 'PA', name: 'Panamá',      flag: '🇵🇦' },
  { code: 'PY', name: 'Paraguay',    flag: '🇵🇾' },
  { code: 'PE', name: 'Perú',        flag: '🇵🇪' },
  { code: 'DO', name: 'Rep. Dominicana', flag: '🇩🇴' },
  { code: 'UY', name: 'Uruguay',     flag: '🇺🇾' },
  { code: 'VE', name: 'Venezuela',   flag: '🇻🇪' },
  { code: 'US', name: 'Estados Unidos', flag: '🇺🇸' },
  { code: 'OT', name: 'Otro',        flag: '🌍' },
]

/** Lookup by country name → flag */
export const FLAG_BY_NAME: Record<string, string> = Object.fromEntries(
  COUNTRIES.map((c) => [c.name, c.flag])
)

/** Lookup by country name → ISO code */
export const CODE_BY_NAME: Record<string, string> = Object.fromEntries(
  COUNTRIES.map((c) => [c.name, c.code])
)

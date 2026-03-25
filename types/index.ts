export interface Resource {
  id: number
  name: string
  country: string
  color: string
  capacityH: number
  createdAt: string
}

export interface Project {
  id: number
  name: string
  color: string
  status: string
  priority: string
  startDate: string
  endDate: string
  estimatedHours: number
  costPerHour: number
  notes: string
  createdAt: string
}

export interface Assignment {
  id: number
  projectId: number
  resourceId: number
  moduleName: string
  percentage: number
  startDate: string
  endDate: string
  estimatedHours: number
  project?: Project
  resource?: Resource
}

export interface Holiday {
  id: number
  resourceId: number
  date: string
  name: string
  resource?: Resource
}

export interface CountryHoliday {
  id: number
  country: string
  date: string
  name: string
}

export interface Vacation {
  id: number
  resourceId: number
  startDate: string
  endDate: string
  notes: string
  resource?: Resource
}

export interface GanttData {
  assignments: (Assignment & { project: Project; resource: Resource })[]
  holidays: Holiday[]
  vacations: Vacation[]
  resources: Resource[]
  projects: Project[]
}

export type CellType = 'weekend' | 'out-of-range' | 'holiday' | 'vacation' | 'active'

export interface CellData {
  type: CellType
  hours?: number
  label?: string
}

export type ProjectStatus = 'En ejecución' | 'Próximo' | 'En planificación' | 'Continuo' | 'Finalizado'
export type ProjectPriority = 'Alta' | 'Media' | 'Baja'
export type Country = 'Argentina' | 'Uruguay' | 'Chile' | 'Otro'

export const STATUS_COLORS: Record<string, string> = {
  'En ejecución': '#C6EFCE',
  'Próximo': '#FFEB9C',
  'En planificación': '#FFC7CE',
  'Continuo': '#FCE4D6',
  'Finalizado': '#E0E0E0',
}

export const PROJECT_PALETTE = [
  '#2E75B6', '#548235', '#C55A11', '#7030A0',
  '#0070C0', '#833C00', '#1F7391', '#7D3C98',
  '#BF8F00', '#C00000', '#375623', '#203864',
]

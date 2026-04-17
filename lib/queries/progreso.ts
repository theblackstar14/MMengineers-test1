import { createClient } from '@/lib/supabase/server'

export interface CronogramaDB {
  id: string
  proyecto_id: string
  nombre: string
  version: number
  archivo_nombre: string | null
  fecha_inicio_plan: string | null
  fecha_fin_plan: string | null
  duracion_dias: number | null
  created_at: string
  updated_at: string
}

export interface TareaDB {
  id: string
  cronograma_id: string
  proyecto_id: string
  uid: number
  outline_number: string | null
  outline_level: number | null
  wbs: string | null
  nombre: string
  notas: string | null
  start_date: string | null
  end_date: string | null
  baseline_start: string | null
  baseline_end: string | null
  actual_start: string | null
  actual_end: string | null
  duration_days: number | null
  percent_complete: number
  is_milestone: boolean
  is_summary: boolean
  is_critical: boolean
  parent_uid: number | null
  responsable: string | null
  unidad: string | null
  costo_plan: number | null
  costo_real: number | null
  partida_id: string | null
  orden: number | null
}

export interface RelacionDB {
  id: string
  cronograma_id: string
  source_uid: number
  target_uid: number
  tipo: 'FS' | 'SS' | 'FF' | 'SF'
  lag_days: number
}

export async function getCronogramasProyecto(proyectoId: string): Promise<CronogramaDB[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('cronogramas')
    .select('*')
    .eq('proyecto_id', proyectoId)
    .order('version', { ascending: false })
  return (data ?? []) as CronogramaDB[]
}

export async function getCronogramaCompleto(cronogramaId: string) {
  const supabase = await createClient()
  const [crono, tareas, relaciones] = await Promise.all([
    supabase.from('cronogramas').select('*').eq('id', cronogramaId).single(),
    supabase.from('cronograma_tareas').select('*').eq('cronograma_id', cronogramaId).order('orden'),
    supabase.from('cronograma_relaciones').select('*').eq('cronograma_id', cronogramaId),
  ])
  return {
    cronograma: (crono.data ?? null) as CronogramaDB | null,
    tareas: (tareas.data ?? []) as TareaDB[],
    relaciones: (relaciones.data ?? []) as RelacionDB[],
  }
}

export async function getCronogramaActivo(proyectoId: string) {
  const cronos = await getCronogramasProyecto(proyectoId)
  if (!cronos.length) return { cronogramas: [], activo: null, tareas: [], relaciones: [] }
  const activo = cronos[0]
  const { tareas, relaciones } = await getCronogramaCompleto(activo.id)
  return { cronogramas: cronos, activo, tareas, relaciones }
}

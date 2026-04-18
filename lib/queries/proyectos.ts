import { createClient } from '@/lib/supabase/server'
import type { ProyectoResumen, HitoProyecto, CurvaS, Valorizacion, Garantia, Movimiento } from '@/lib/types/database'

export async function getProyectos(estado?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('proyectos_resumen')
    .select('*')
    .order('created_at', { ascending: false })

  if (estado && estado !== 'todos') {
    query = query.eq('estado', estado)
  }

  const { data } = await query
  return (data ?? []) as ProyectoResumen[]
}

export async function getProyectoStats() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('proyectos')
    .select('estado, monto_contrato, monto_adicionales')

  if (!data) return { total: 0, porEstado: {}, montoTotal: 0 }

  const porEstado: Record<string, number> = {}
  let montoTotal = 0

  for (const p of data) {
    porEstado[p.estado] = (porEstado[p.estado] ?? 0) + 1
    montoTotal += (p.monto_contrato ?? 0) + (p.monto_adicionales ?? 0)
  }

  return { total: data.length, porEstado, montoTotal }
}

export async function getProyectoById(id: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('proyectos_resumen')
    .select('*')
    .eq('id', id)
    .single()

  return data as ProyectoResumen | null
}

export async function getHitosProyecto(proyectoId: string): Promise<HitoProyecto[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('hitos_proyecto')
    .select('*')
    .eq('proyecto_id', proyectoId)
    .order('orden')

  return (data ?? []) as HitoProyecto[]
}

export async function getCurvaSProyecto(proyectoId: string): Promise<CurvaS[]> {
  const supabase = await createClient()

  // 1. Intenta calcular desde cronograma + partidas (fuente de verdad)
  const { data: tareasRaw } = await supabase
    .from('cronograma_tareas')
    .select('id, start_date, end_date, duration_days, percent_complete, costo_plan, partida_id, partidas:partida_id(total), is_summary')
    .eq('proyecto_id', proyectoId)
    .eq('is_summary', false)
    .not('start_date', 'is', null)
    .not('end_date', 'is', null)

  type T = {
    id: string
    start_date: string
    end_date: string
    duration_days: number | null
    percent_complete: number | null
    costo_plan: number | null
    partida_id: string | null
    partidas: { total: number | null } | null
  }
  const tareas = (tareasRaw ?? []) as unknown as T[]
  if (!tareas.length) {
    // Fallback: tabla curva_s legacy
    const { data } = await supabase
      .from('curva_s').select('*').eq('proyecto_id', proyectoId).order('fecha')
      return (data ?? []) as CurvaS[]
  }

  // 2. Determinar rango de meses
  const toDate = (s: string) => new Date(s + (s.length === 10 ? 'T00:00:00Z' : ''))
  let minStart = Infinity, maxEnd = -Infinity
  for (const t of tareas) {
    const s = +toDate(t.start_date), e = +toDate(t.end_date)
    if (s < minStart) minStart = s
    if (e > maxEnd) maxEnd = e
  }
  const start = new Date(minStart)
  const end   = new Date(maxEnd)
  // Eje mensual — último día de cada mes
  const months: Date[] = []
  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0))
  const last   = new Date(Date.UTC(end.getUTCFullYear(),   end.getUTCMonth() + 1, 0))
  while (cursor <= last) {
    months.push(new Date(cursor))
    cursor.setUTCMonth(cursor.getUTCMonth() + 1)
  }

  // 3. Acumular por mes
  const clip01 = (x: number) => Math.max(0, Math.min(1, x))
  let totalCost = 0
  for (const t of tareas) {
    const c = t.partidas?.total ?? t.costo_plan ?? 0
    totalCost += c
  }

  const puntos: CurvaS[] = months.map(m => {
    let planCost = 0
    let realCost = 0
    for (const t of tareas) {
      const c = t.partidas?.total ?? t.costo_plan ?? 0
      if (c <= 0) continue
      const s = +toDate(t.start_date)
      const e = +toDate(t.end_date)
      const dur = Math.max(1, (e - s) / 86400000)
      // Plan: avance lineal según schedule
      const planFrac = clip01((+m - s) / (dur * 86400000))
      planCost += c * planFrac
      // Real: avance lineal capado por percent_complete actual
      const pct = (t.percent_complete ?? 0) / 100
      const linearToNow = clip01((+m - s) / (dur * 86400000))
      const realFrac = Math.min(pct, linearToNow)
      realCost += c * realFrac
    }
    const iso = m.toISOString().slice(0, 10)
    return {
      id: `calc-${iso}`,
      proyecto_id: proyectoId,
      fecha: iso,
      avance_planificado: totalCost > 0 ? (planCost / totalCost) * 100 : 0,
      avance_real:        totalCost > 0 ? (realCost / totalCost) * 100 : 0,
      costo_planificado:  planCost,
      costo_real:         realCost,
      created_at: new Date().toISOString(),
    } as CurvaS
  })

  return puntos
}

export async function getEquipoProyecto(proyectoId: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('equipo_proyecto')
    .select('*, perfil:profiles(id, nombre, apellido, cargo, avatar_url)')
    .eq('proyecto_id', proyectoId)
    .eq('activo', true)

  return data ?? []
}

export async function getValorizacionesProyecto(proyectoId: string): Promise<Valorizacion[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('valorizaciones')
    .select('*')
    .eq('proyecto_id', proyectoId)
    .order('numero', { ascending: false })

  return (data ?? []) as Valorizacion[]
}

export async function getGarantiasProyecto(proyectoId: string): Promise<Garantia[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('garantias')
    .select('*')
    .eq('proyecto_id', proyectoId)
    .order('fecha_vencimiento')

  return (data ?? []) as Garantia[]
}

export async function getMovimientosProyecto(proyectoId: string): Promise<Movimiento[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('movimientos')
    .select('*, proveedor_cliente:proveedores_clientes(id, razon_social)')
    .eq('proyecto_id', proyectoId)
    .neq('estado', 'anulado')
    .order('fecha', { ascending: false })
    .limit(20)

  return (data ?? []) as Movimiento[]
}

export async function getCotizacionesProyecto(proyectoId: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('cotizaciones')
    .select('*')
    .eq('proyecto_id', proyectoId)
    .order('version', { ascending: false })

  return data ?? []
}

export async function getPartidasCotizacion(cotizacionId: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('partidas')
    .select('*')
    .eq('cotizacion_id', cotizacionId)
    .order('codigo')

  return data ?? []
}

export async function getDocumentosProyecto(proyectoId: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('documentos')
    .select('*')
    .eq('entidad_tipo', 'proyecto')
    .eq('entidad_id', proyectoId)
    .order('created_at', { ascending: false })

  return data ?? []
}

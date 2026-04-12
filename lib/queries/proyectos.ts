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

  const { data } = await supabase
    .from('curva_s')
    .select('*')
    .eq('proyecto_id', proyectoId)
    .order('fecha')

  return (data ?? []) as CurvaS[]
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

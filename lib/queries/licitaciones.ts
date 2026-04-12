import { createClient } from '@/lib/supabase/server'
import type { Licitacion } from '@/lib/types/database'

export async function getLicitaciones(estado?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('licitaciones')
    .select(`
      *,
      responsable:profiles!licitaciones_responsable_id_fkey(id, nombre, apellido, cargo)
    `)
    .order('created_at', { ascending: false })

  if (estado && estado !== 'todos') {
    query = query.eq('estado', estado)
  }

  const { data } = await query
  return (data ?? []) as (Licitacion & {
    responsable: { nombre: string; apellido: string; cargo: string | null } | null
  })[]
}

export async function getLicitacionStats() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('licitaciones')
    .select('estado, monto_referencial, monto_propuesta')

  if (!data) return { total: 0, porEstado: {}, montoTotal: 0, tasaExito: 0 }

  const porEstado: Record<string, number> = {}
  let montoTotal = 0
  let adjudicadas = 0
  let cerradas = 0

  for (const l of data) {
    porEstado[l.estado] = (porEstado[l.estado] ?? 0) + 1
    montoTotal += l.monto_referencial ?? 0
    if (l.estado === 'adjudicada') adjudicadas++
    if (['adjudicada', 'no_adjudicada', 'desierta'].includes(l.estado)) cerradas++
  }

  const tasaExito = cerradas > 0 ? Math.round((adjudicadas / cerradas) * 100) : 0

  return { total: data.length, porEstado, montoTotal, tasaExito }
}

export async function getLicitacionById(id: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('licitaciones')
    .select(`
      *,
      responsable:profiles!licitaciones_responsable_id_fkey(id, nombre, apellido, cargo)
    `)
    .eq('id', id)
    .single()

  return data as (Licitacion & {
    responsable: { nombre: string; apellido: string; cargo: string | null } | null
  }) | null
}

export async function getChecklistLicitacion(licitacionId: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('licitacion_checklist')
    .select('*')
    .eq('licitacion_id', licitacionId)
    .order('orden')

  return data ?? []
}

export async function getDocumentosLicitacion(licitacionId: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('documentos')
    .select('*')
    .eq('entidad_tipo', 'licitacion')
    .eq('entidad_id', licitacionId)
    .order('created_at', { ascending: false })

  return data ?? []
}

export async function updateChecklistItem(itemId: string, completado: boolean) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('licitacion_checklist')
    .update({ completado, updated_at: new Date().toISOString() })
    .eq('id', itemId)

  return !error
}

export async function updateEstadoLicitacion(id: string, estado: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('licitaciones')
    .update({ estado, updated_at: new Date().toISOString() })
    .eq('id', id)

  return !error
}
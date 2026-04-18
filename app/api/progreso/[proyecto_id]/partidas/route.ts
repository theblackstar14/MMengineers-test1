import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

// GET: todas las partidas (hoja = nivel 4 con precio) de las cotizaciones del proyecto
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ proyecto_id: string }> }
) {
  const { proyecto_id } = await params
  const url = new URL(req.url)
  const q = url.searchParams.get('q')?.toLowerCase() ?? ''
  const supabase = await createClient()

  // Cotizaciones del proyecto (vigente/aprobada)
  const { data: cots } = await supabase
    .from('cotizaciones')
    .select('id, nombre, version, estado')
    .eq('proyecto_id', proyecto_id)
    .in('estado', ['vigente', 'aprobada', 'borrador'])
    .order('version', { ascending: false })

  if (!cots?.length) return NextResponse.json({ partidas: [] })

  const cotIds = cots.map(c => c.id)

  // Partidas nivel 4 (hojas reales con precio) — fallback a todas con metrado + pu
  let query = supabase
    .from('partidas')
    .select('id, cotizacion_id, codigo, nombre, unidad, metrado, precio_unitario, total, nivel')
    .in('cotizacion_id', cotIds)
    .order('codigo', { ascending: true })
    .limit(500)

  if (q) {
    query = query.or(`codigo.ilike.%${q}%,nombre.ilike.%${q}%`)
  }

  const { data: partidas, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Filtrar hojas (nivel 4 o sin hijos)
  const leaves = (partidas ?? []).filter(p => p.nivel === 4 || (p.metrado != null && p.precio_unitario != null))

  // Mapa cotizacion → nombre para mostrar en UI
  const cotMap = Object.fromEntries(cots.map(c => [c.id, `${c.nombre} v${c.version}`]))
  const enriched = leaves.map(p => ({ ...p, cotizacion_label: cotMap[p.cotizacion_id] ?? '' }))

  return NextResponse.json({ partidas: enriched })
}

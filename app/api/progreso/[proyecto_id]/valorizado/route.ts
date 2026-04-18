import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

// GET: agregado de valorización = Σ (partida.total × tarea.percent_complete / 100)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ proyecto_id: string }> }
) {
  const { proyecto_id } = await params
  const supabase = await createClient()

  // Todas las tareas con partida vinculada
  const { data: tareas } = await supabase
    .from('cronograma_tareas')
    .select('id, percent_complete, partida_id, partidas:partida_id(id, total, metrado, precio_unitario)')
    .eq('proyecto_id', proyecto_id)
    .not('partida_id', 'is', null)

  const rows = (tareas ?? []) as unknown as Array<{
    id: string
    percent_complete: number | null
    partida_id: string | null
    partidas: { total: number | null } | null
  }>

  let valorizado = 0
  let total_contratado = 0
  let linked_count = 0

  for (const r of rows) {
    const t = r.partidas?.total ?? 0
    const pct = r.percent_complete ?? 0
    total_contratado += t
    valorizado += (t * pct) / 100
    if (r.partida_id) linked_count++
  }

  // Cuenta total de tareas leaf
  const { count: total_tareas } = await supabase
    .from('cronograma_tareas')
    .select('id', { count: 'exact', head: true })
    .eq('proyecto_id', proyecto_id)
    .eq('is_summary', false)

  return NextResponse.json({
    valorizado,
    total_contratado,
    linked_count,
    total_tareas: total_tareas ?? 0,
    pct: total_contratado > 0 ? (valorizado / total_contratado) * 100 : 0,
  })
}

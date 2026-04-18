import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

// PATCH: toggle estado (completado <-> pendiente). Si linked a tarea, también actualiza % avance.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; hito_id: string }> }
) {
  const { hito_id } = await params
  const body = await req.json()
  const supabase = await createClient()

  const patch: Record<string, unknown> = {}
  if (body.estado) patch.estado = body.estado
  if (body.nombre) patch.nombre = body.nombre
  if (body.fecha_estimada) patch.fecha_estimada = body.fecha_estimada
  if (body.fecha_real !== undefined) patch.fecha_real = body.fecha_real

  const { data: hito } = await supabase
    .from('hitos_proyecto').select('tarea_id').eq('id', hito_id).single()

  // Sync con tarea gantt si hay link
  if (hito?.tarea_id && body.estado) {
    const pct = body.estado === 'completado' ? 100 : 0
    await supabase.from('cronograma_tareas').update({
      percent_complete: pct,
      actual_end: body.estado === 'completado' ? new Date().toISOString() : null,
    }).eq('id', hito.tarea_id)
    if (body.estado === 'completado') patch.fecha_real = new Date().toISOString().slice(0, 10)
  }

  const { data, error } = await supabase
    .from('hitos_proyecto').update(patch).eq('id', hito_id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ hito: data })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ hito_id: string }> }
) {
  const { hito_id } = await params
  const supabase = await createClient()
  const { error } = await supabase.from('hitos_proyecto').delete().eq('id', hito_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

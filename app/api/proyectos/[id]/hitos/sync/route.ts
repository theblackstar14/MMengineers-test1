import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

// POST: auto-crea/actualiza hitos_proyecto desde tareas is_milestone=true del gantt
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: proyecto_id } = await params
  const supabase = await createClient()

  const { data: milestones } = await supabase
    .from('cronograma_tareas')
    .select('id, nombre, end_date, percent_complete')
    .eq('proyecto_id', proyecto_id)
    .eq('is_milestone', true)

  if (!milestones?.length) return NextResponse.json({ created: 0, updated: 0 })

  // Hitos existentes para comparar
  const { data: existentes } = await supabase
    .from('hitos_proyecto')
    .select('id, tarea_id, nombre')
    .eq('proyecto_id', proyecto_id)

  const byTareaId = new Map((existentes ?? []).filter(h => h.tarea_id).map(h => [h.tarea_id!, h]))

  let created = 0
  let updated = 0
  let orden = (existentes?.length ?? 0)

  for (const m of milestones) {
    const estado = (m.percent_complete ?? 0) >= 100 ? 'completado' : 'pendiente'
    const existing = byTareaId.get(m.id)
    if (existing) {
      await supabase.from('hitos_proyecto').update({
        nombre: m.nombre,
        fecha_estimada: m.end_date,
        estado,
      }).eq('id', existing.id)
      updated++
    } else {
      await supabase.from('hitos_proyecto').insert({
        proyecto_id,
        tarea_id: m.id,
        nombre: m.nombre,
        fecha_estimada: m.end_date,
        estado,
        orden: orden++,
      })
      created++
    }
  }

  return NextResponse.json({ created, updated, total: milestones.length })
}

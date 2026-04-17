import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ proyecto_id: string }> }
) {
  const { proyecto_id } = await params
  const supabase = await createClient()

  const { data: cronogramas } = await supabase
    .from('cronogramas')
    .select('*')
    .eq('proyecto_id', proyecto_id)
    .order('version', { ascending: false })

  if (!cronogramas?.length) {
    return NextResponse.json({ cronogramas: [], tareas: [], relaciones: [] })
  }

  const activeId = cronogramas[0].id

  const [tareasRes, relRes] = await Promise.all([
    supabase.from('cronograma_tareas').select('*').eq('cronograma_id', activeId).order('orden'),
    supabase.from('cronograma_relaciones').select('*').eq('cronograma_id', activeId),
  ])

  return NextResponse.json({
    cronogramas,
    active_id: activeId,
    tareas: tareasRes.data ?? [],
    relaciones: relRes.data ?? [],
  })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ proyecto_id: string }> }
) {
  const { proyecto_id } = await params
  const supabase = await createClient()
  const { error } = await supabase
    .from('cronogramas')
    .delete()
    .eq('proyecto_id', proyecto_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

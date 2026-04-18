import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

// GET: tarea + partida vinculada + fotos (signed urls) + comentarios
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ tarea_id: string }> }
) {
  const { tarea_id } = await params
  const supabase = await createClient()

  const { data: tarea, error: tErr } = await supabase
    .from('cronograma_tareas')
    .select('*')
    .eq('id', tarea_id)
    .single()
  if (tErr || !tarea) return NextResponse.json({ error: tErr?.message ?? 'Not found' }, { status: 404 })

  // Partida vinculada (si hay)
  let partida = null
  if (tarea.partida_id) {
    const { data: p } = await supabase
      .from('partidas')
      .select('id, codigo, nombre, unidad, metrado, precio_unitario, total, cotizacion_id, nivel')
      .eq('id', tarea.partida_id)
      .single()
    partida = p ?? null
  }

  // Fotos (signed urls)
  const { data: fotosRaw } = await supabase
    .from('cronograma_fotos')
    .select('id, url, storage_path, descripcion, tomada_at, size_bytes, created_at, created_by')
    .eq('tarea_id', tarea_id)
    .order('created_at', { ascending: false })

  const fotos = await Promise.all(
    (fotosRaw ?? []).map(async f => {
      const path = f.storage_path ?? f.url
      const { data: signed } = await supabase
        .storage
        .from('progreso-fotos')
        .createSignedUrl(path, 3600)
      return { ...f, signed_url: signed?.signedUrl ?? null }
    })
  )

  // Comentarios con autor
  const { data: comentarios } = await supabase
    .from('cronograma_comentarios')
    .select('id, texto, created_at, created_by, profiles:created_by(nombre, apellido, avatar_url)')
    .eq('tarea_id', tarea_id)
    .order('created_at', { ascending: true })

  return NextResponse.json({ tarea, partida, fotos, comentarios: comentarios ?? [] })
}

// PATCH: update percent_complete o partida_id
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ tarea_id: string }> }
) {
  const { tarea_id } = await params
  const body = await req.json()
  const supabase = await createClient()

  const patch: Record<string, unknown> = {}
  if (typeof body.percent_complete === 'number') {
    patch.percent_complete = Math.max(0, Math.min(100, body.percent_complete))
  }
  if ('partida_id' in body) {
    patch.partida_id = body.partida_id || null
  }
  if (typeof body.responsable === 'string') patch.responsable = body.responsable
  if (typeof body.notas === 'string') patch.notas = body.notas

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'nothing to update' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('cronograma_tareas')
    .update(patch)
    .eq('id', tarea_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tarea: data })
}

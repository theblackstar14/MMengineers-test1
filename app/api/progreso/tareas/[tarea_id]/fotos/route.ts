import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { randomUUID } from 'crypto'

export const runtime = 'nodejs'

// POST: upload foto (multipart/form-data, field "file")
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tarea_id: string }> }
) {
  const { tarea_id } = await params
  const supabase = await createClient()

  const form = await req.formData()
  const file = form.get('file') as File | null
  const descripcion = (form.get('descripcion') as string | null) ?? null
  if (!file) return NextResponse.json({ error: 'file requerido' }, { status: 400 })

  // Lookup proyecto_id desde la tarea
  const { data: tarea, error: tErr } = await supabase
    .from('cronograma_tareas')
    .select('id, proyecto_id')
    .eq('id', tarea_id)
    .single()
  if (tErr || !tarea) return NextResponse.json({ error: 'tarea not found' }, { status: 404 })

  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const path = `${tarea.proyecto_id}/${tarea_id}/${randomUUID()}.${ext}`

  const bytes = Buffer.from(await file.arrayBuffer())
  const { error: upErr } = await supabase
    .storage
    .from('progreso-fotos')
    .upload(path, bytes, { contentType: file.type, upsert: false })

  if (upErr) return NextResponse.json({ error: `upload: ${upErr.message}` }, { status: 500 })

  const { data: userRes } = await supabase.auth.getUser()

  const { data: foto, error: insErr } = await supabase
    .from('cronograma_fotos')
    .insert({
      tarea_id,
      proyecto_id: tarea.proyecto_id,
      url: path,
      storage_path: path,
      descripcion,
      size_bytes: file.size,
      tomada_at: new Date().toISOString(),
      created_by: userRes.user?.id ?? null,
    })
    .select()
    .single()

  if (insErr) {
    // Rollback storage
    await supabase.storage.from('progreso-fotos').remove([path])
    return NextResponse.json({ error: insErr.message }, { status: 500 })
  }

  // Signed URL para respuesta inmediata
  const { data: signed } = await supabase
    .storage
    .from('progreso-fotos')
    .createSignedUrl(path, 3600)

  return NextResponse.json({ foto: { ...foto, signed_url: signed?.signedUrl ?? null } })
}

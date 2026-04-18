import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

// POST: nuevo comentario
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tarea_id: string }> }
) {
  const { tarea_id } = await params
  const body = await req.json()
  const texto = (body.texto as string | undefined)?.trim()
  if (!texto) return NextResponse.json({ error: 'texto requerido' }, { status: 400 })

  const supabase = await createClient()
  const { data: userRes } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('cronograma_comentarios')
    .insert({ tarea_id, texto, created_by: userRes.user?.id ?? null })
    .select('id, texto, created_at, created_by, profiles:created_by(nombre, apellido, avatar_url)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ comentario: data })
}

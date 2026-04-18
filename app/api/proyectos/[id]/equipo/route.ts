import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

// POST: agregar miembro { perfil_id, rol_en_proyecto, fecha_inicio? }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: proyecto_id } = await params
  const body = await req.json()
  if (!body.perfil_id || !body.rol_en_proyecto) {
    return NextResponse.json({ error: 'perfil_id y rol_en_proyecto requeridos' }, { status: 400 })
  }
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('equipo_proyecto')
    .upsert({
      proyecto_id,
      perfil_id: body.perfil_id,
      rol_en_proyecto: body.rol_en_proyecto,
      fecha_inicio: body.fecha_inicio ?? new Date().toISOString().slice(0, 10),
      activo: true,
    }, { onConflict: 'proyecto_id,perfil_id' })
    .select('*, perfil:perfil_id(id, nombre, apellido, cargo, avatar_url, email)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ miembro: data })
}

// GET: profiles para autocomplete ?q=
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const q = url.searchParams.get('q')?.trim().toLowerCase() ?? ''
  const supabase = await createClient()

  let query = supabase
    .from('profiles')
    .select('id, nombre, apellido, cargo, avatar_url, email, rol')
    .eq('activo', true)
    .limit(20)

  if (q) {
    query = query.or(`nombre.ilike.%${q}%,apellido.ilike.%${q}%,email.ilike.%${q}%`)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ profiles: data ?? [] })
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('partidas')
    .select('id, parent_id, codigo, nivel, nombre, unidad, metrado, precio_unitario, total, orden')
    .eq('cotizacion_id', id)
    .order('orden', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ partidas: data ?? [] })
}

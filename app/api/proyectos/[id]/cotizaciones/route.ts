import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('cotizaciones')
    .select('id, nombre, estado, version, total, created_at, notas')
    .eq('proyecto_id', id)
    .order('version', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ cotizaciones: data ?? [] })
}

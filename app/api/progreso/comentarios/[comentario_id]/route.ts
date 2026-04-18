import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ comentario_id: string }> }
) {
  const { comentario_id } = await params
  const supabase = await createClient()
  const { error } = await supabase
    .from('cronograma_comentarios')
    .delete()
    .eq('id', comentario_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

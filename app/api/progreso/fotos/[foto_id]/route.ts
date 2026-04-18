import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ foto_id: string }> }
) {
  const { foto_id } = await params
  const supabase = await createClient()

  const { data: foto } = await supabase
    .from('cronograma_fotos')
    .select('id, storage_path, url')
    .eq('id', foto_id)
    .single()

  if (!foto) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const path = foto.storage_path ?? foto.url
  await supabase.storage.from('progreso-fotos').remove([path])

  const { error } = await supabase.from('cronograma_fotos').delete().eq('id', foto_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

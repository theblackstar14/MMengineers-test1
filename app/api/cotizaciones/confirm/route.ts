import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { PartidaFlat } from '@/lib/excel/parseCotizacion'

export const runtime = 'nodejs'

interface ConfirmBody {
  proyecto_id: string
  versiones: Array<{
    sheet_name: string
    version_label: string
    codigo_interno: string | null
    cliente: string | null
    proyecto: string | null
    total_sin_igv: number | null
    partidas_flat: PartidaFlat[]
  }>
}

export async function POST(req: NextRequest) {
  try {
    const body: ConfirmBody = await req.json()
    const { proyecto_id, versiones } = body

    if (!proyecto_id || !versiones?.length) {
      return NextResponse.json({ error: 'proyecto_id y versiones requeridos' }, { status: 400 })
    }

    const supabase = await createClient()
    const created: Array<{ cotizacion_id: string; nombre: string; partidas: number }> = []

    for (let v = 0; v < versiones.length; v++) {
      const ver = versiones[v]

      // 1. Insert cotización
      const { data: cot, error: cotError } = await supabase
        .from('cotizaciones')
        .insert({
          proyecto_id,
          nombre: ver.sheet_name,
          version: v + 1,
          estado: 'borrador',
          total: ver.total_sin_igv ?? 0,
          notas: ver.version_label
            ? `${ver.version_label}${ver.codigo_interno ? ' · ' + ver.codigo_interno : ''}`
            : null,
        })
        .select('id')
        .single()

      if (cotError || !cot) {
        return NextResponse.json(
          { error: `Error al crear cotización "${ver.sheet_name}": ${cotError?.message}` },
          { status: 500 },
        )
      }

      const cotizacion_id = cot.id

      // 2. Build codigo → id map for parent resolution
      const codigoToId = new Map<string, string>()

      // Insert partidas in order (parents before children — already ordered by flat list)
      for (const partida of ver.partidas_flat) {
        const parent_id = partida.parent_codigo
          ? (codigoToId.get(partida.parent_codigo) ?? null)
          : null

        const { data: inserted, error: partErr } = await supabase
          .from('partidas')
          .insert({
            cotizacion_id,
            parent_id,
            codigo: partida.codigo,
            nivel: Math.min(partida.nivel, 4) as 1 | 2 | 3 | 4,
            nombre: partida.descripcion,
            unidad: partida.unidad,
            metrado: partida.metrado,
            precio_unitario: partida.precio_unitario,
            total: partida.parcial ?? partida.total ?? 0,
            total_adicional: 0,
            total_valorizado: 0,
            orden: partida.orden,
          })
          .select('id')
          .single()

        if (partErr || !inserted) {
          console.error('Error partida', partida.codigo, partErr?.message)
          continue
        }

        codigoToId.set(partida.codigo, inserted.id)
      }

      created.push({
        cotizacion_id,
        nombre: ver.sheet_name,
        partidas: ver.partidas_flat.length,
      })
    }

    return NextResponse.json({ ok: true, created })
  } catch (err) {
    console.error('[confirm/cotizacion]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { PartidaFlat } from '@/lib/excel/parseCotizacion'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { proyecto_id, versiones } = body

    if (!proyecto_id || !versiones?.length) {
      return NextResponse.json(
        { error: 'proyecto_id y versiones requeridos' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const created = []

    for (let v = 0; v < versiones.length; v++) {
      const ver = versiones[v]

      const { data: cot, error: cotError } = await supabase
        .from('cotizaciones')
        .insert({
          proyecto_id,
          nombre: ver.sheet_name,
          version: v + 1,
          estado: 'borrador',
          total: ver.resumen?.total ?? ver.total_sin_igv ?? 0,
          notas: JSON.stringify({
            version_label:  ver.version_label  ?? 'REV.01',
            codigo_interno: ver.codigo_interno ?? null,
            resumen: ver.resumen
              ? {
                  gg_pct:   ver.resumen.gastos_generales_pct,
                  util_pct: ver.resumen.utilidad_pct,
                  igv_pct:  ver.resumen.igv_pct,
                }
              : null,
          }),
        })
        .select('id')
        .single()

      if (cotError || !cot) {
        console.error(cotError)
        return NextResponse.json({ error: 'Error creando cotización' }, { status: 500 })
      }

      const codigoToId = new Map<string, string>()

      for (const p of ver.partidas_flat) {
        const parent_id = p.parent_codigo
          ? codigoToId.get(p.parent_codigo) ?? null
          : null

        const { data: inserted, error: partErr } = await supabase
          .from('partidas')
          .insert({
            cotizacion_id: cot.id,
            parent_id,
            codigo: p.codigo,
            nivel: Math.min(p.nivel, 4) as 1 | 2 | 3 | 4,
            nombre: p.descripcion,
            unidad: p.unidad,
            metrado: p.metrado,
            precio_unitario: p.precio_unitario,
            total: p.total ?? p.parcial ?? 0,
            total_adicional: 0,
            total_valorizado: 0,
            orden: p.orden,
          })
          .select('id')
          .single()

        if (partErr) console.error('partida insert error', p.codigo, partErr.message)

        if (inserted) {
          codigoToId.set(p.codigo, inserted.id)
        }
      }

      // Recompute totals after all partidas inserted (trigger only fires on nivel=4)
      await supabase.rpc('recalcular_totales_partidas', { p_cotizacion_id: cot.id })

      created.push({ id: cot.id })
    }

    return NextResponse.json({ ok: true, created })

  } catch (err) {
    console.error('[confirm ERROR]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
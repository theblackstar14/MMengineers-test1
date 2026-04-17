import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { convertMppToXml } from '@/lib/aspose/convertMpp'
import { parseMspXml } from '@/lib/cronograma/parseMspXml'

export const runtime = 'nodejs'
export const maxDuration = 120

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const proyecto_id = form.get('proyecto_id')?.toString()
    const file = form.get('file') as File | null
    const replaceVersion = form.get('replace_version') === '1'

    if (!proyecto_id) return NextResponse.json({ error: 'proyecto_id requerido' }, { status: 400 })
    if (!file)        return NextResponse.json({ error: 'file requerido' },        { status: 400 })

    const name  = file.name
    const lower = name.toLowerCase()
    const isMpp = lower.endsWith('.mpp')
    const isXml = lower.endsWith('.xml')
    if (!isMpp && !isXml) {
      return NextResponse.json({ error: 'Solo se acepta .mpp o .xml' }, { status: 400 })
    }

    // 1) get XML (convert if .mpp, else use as-is)
    const bytes = Buffer.from(await file.arrayBuffer())
    let xml: string
    if (isMpp) {
      try {
        xml = await convertMppToXml(bytes, name)
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        return NextResponse.json({ error: `Conversión .mpp → XML falló: ${msg}` }, { status: 500 })
      }
    } else {
      xml = bytes.toString('utf8')
    }

    // 2) parse
    const parsed = parseMspXml(xml)
    if (!parsed.tasks.length) {
      return NextResponse.json({ error: 'El archivo no contiene tareas' }, { status: 400 })
    }

    const supabase = await createClient()

    // 3) resolve version number
    const { data: existing } = await supabase
      .from('cronogramas')
      .select('version')
      .eq('proyecto_id', proyecto_id)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle()

    const nextVersion = replaceVersion
      ? (existing?.version ?? 1)
      : (existing ? existing.version + 1 : 1)

    // If replace, delete previous cronograma (cascade removes tareas/rels)
    if (replaceVersion && existing) {
      await supabase
        .from('cronogramas')
        .delete()
        .eq('proyecto_id', proyecto_id)
        .eq('version', nextVersion)
    }

    // 4) insert cronograma
    const { data: cron, error: cronErr } = await supabase
      .from('cronogramas')
      .insert({
        proyecto_id,
        nombre: parsed.nombre || name,
        version: nextVersion,
        archivo_nombre: name,
        fecha_inicio_plan: parsed.start ? parsed.start.slice(0, 10) : null,
        fecha_fin_plan:    parsed.end   ? parsed.end.slice(0, 10)   : null,
        notas: { source: isMpp ? 'mpp' : 'xml' },
      })
      .select('id')
      .single()

    if (cronErr || !cron) {
      return NextResponse.json({ error: cronErr?.message || 'No se pudo crear cronograma' }, { status: 500 })
    }

    // 5) bulk insert tareas
    const tareaRows = parsed.tasks.map(t => ({
      cronograma_id:    cron.id,
      proyecto_id,
      uid:              t.uid,
      outline_number:   t.outline_number,
      outline_level:    t.outline_level,
      wbs:              t.wbs,
      nombre:           t.nombre,
      notas:            t.notas,
      start_date:       t.start_date,
      end_date:         t.end_date,
      baseline_start:   t.baseline_start,
      baseline_end:     t.baseline_end,
      actual_start:     t.actual_start,
      actual_end:       t.actual_end,
      duration_days:    t.duration_days,
      percent_complete: t.percent_complete,
      is_milestone:     t.is_milestone,
      is_summary:       t.is_summary,
      is_critical:      t.is_critical,
      parent_uid:       t.parent_uid,
      costo_plan:       t.costo_plan,
      orden:            t.orden,
    }))

    // chunk for big plans
    const CHUNK = 500
    for (let i = 0; i < tareaRows.length; i += CHUNK) {
      const slice = tareaRows.slice(i, i + CHUNK)
      const { error: tErr } = await supabase.from('cronograma_tareas').insert(slice)
      if (tErr) {
        await supabase.from('cronogramas').delete().eq('id', cron.id)
        return NextResponse.json({ error: `Insert tareas falló: ${tErr.message}` }, { status: 500 })
      }
    }

    // 6) bulk insert relaciones
    if (parsed.links.length) {
      const linkRows = parsed.links.map(l => ({
        cronograma_id: cron.id,
        source_uid:    l.source_uid,
        target_uid:    l.target_uid,
        tipo:          l.tipo,
        lag_days:      l.lag_days,
      }))
      for (let i = 0; i < linkRows.length; i += CHUNK) {
        const slice = linkRows.slice(i, i + CHUNK)
        await supabase.from('cronograma_relaciones').insert(slice)
      }
    }

    return NextResponse.json({
      cronograma_id: cron.id,
      version: nextVersion,
      tareas: parsed.tasks.length,
      relaciones: parsed.links.length,
      nombre: parsed.nombre,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { parseExcelCotizaciones } from '@/lib/excel/parseCotizacion'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!['xlsx', 'xls'].includes(ext ?? '')) {
      return NextResponse.json({ error: 'Solo se aceptan archivos .xlsx o .xls' }, { status: 400 })
    }

    const buffer = await file.arrayBuffer()
    const versiones = parseExcelCotizaciones(buffer)

    if (versiones.length === 0) {
      return NextResponse.json(
        { error: 'No se encontraron hojas con datos válidos de cotización' },
        { status: 422 },
      )
    }

    return NextResponse.json({
      ok: true,
      filename: file.name,
      versiones,
      total_versiones: versiones.length,
    })
  } catch (err) {
    console.error('[import/cotizacion]', err)
    return NextResponse.json({ error: 'Error al procesar el archivo' }, { status: 500 })
  }
}

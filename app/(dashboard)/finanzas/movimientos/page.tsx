import { Metadata } from 'next'
import { getMovimientosMes } from '@/lib/queries/finanzas'
import { IngresosEgresosView } from '@/components/finanzas/IngresosEgresosView'

export const metadata: Metadata = { title: 'Ingresos y Egresos — MMHIGHMETRIK ERP' }

export default async function MovimientosPage() {
  const mes = new Date().toISOString().substring(0, 7)
  const movimientos = await getMovimientosMes(mes)
  return <IngresosEgresosView initialMovimientos={movimientos} initialMes={mes} />
}

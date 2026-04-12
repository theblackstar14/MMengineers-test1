import { NuevoMovimientoForm } from '@/components/finanzas/NuevoMovimientoForm'
import { getCuentasTesoreria } from '@/lib/queries/finanzas'

export default async function NuevoMovimientoPage() {
  const cuentas = await getCuentasTesoreria()
  return <NuevoMovimientoForm cuentas={cuentas} />
}

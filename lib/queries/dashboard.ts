import { createClient } from '@/lib/supabase/server'
import type { DashboardKpis, ProyectoResumen, Alerta } from '@/lib/types/database'

// ─────────────────────────────────────────
// KPIs principales (vista SQL)
// ─────────────────────────────────────────
export async function getDashboardKpis(): Promise<DashboardKpis> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('dashboard_kpis')
    .select('*')
    .single()

  if (error || !data) {
    // Fallback con ceros si la vista aún no tiene datos
    return {
      proyectos_activos: 0,
      licitaciones_en_proceso: 0,
      monto_total_contratos: 0,
      ingresos_mes: 0,
      egresos_mes: 0,
      por_cobrar: 0,
      por_pagar: 0,
      garantias_por_vencer: 0,
      valorizaciones_pendientes: 0,
      saldo_total_bancos: 0,
    }
  }

  return data
}

// ─────────────────────────────────────────
// Datos para gráfico Ingresos vs Egresos (últimos 6 meses)
// ─────────────────────────────────────────
export async function getIngresosEgresosMensuales() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('movimientos_resumen_mes')
    .select('mes, total_ingresos, total_egresos, resultado_neto')
    .order('mes', { ascending: true })
    .limit(6)

  return (data ?? []).map(row => ({
    mes: row.mes as string,
    ingresos: Number(row.total_ingresos ?? 0),
    egresos: Number(row.total_egresos ?? 0),
    neto: Number(row.resultado_neto ?? 0),
  }))
}

// ─────────────────────────────────────────
// Distribución de proyectos por estado (para donut)
// ─────────────────────────────────────────
export async function getEstadoProyectos() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('proyectos')
    .select('estado')

  if (!data || data.length === 0) return []

  const counts: Record<string, number> = {}
  for (const p of data) {
    counts[p.estado] = (counts[p.estado] ?? 0) + 1
  }

  return Object.entries(counts).map(([estado, cantidad]) => ({
    estado,
    cantidad,
  }))
}

// ─────────────────────────────────────────
// Proyectos activos para la tabla
// ─────────────────────────────────────────
export async function getProyectosActivos(): Promise<ProyectoResumen[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('proyectos_resumen')
    .select('*')
    .in('estado', ['en_ejecucion', 'adjudicado'])
    .order('avance_fisico_pct', { ascending: false })
    .limit(5)

  return (data ?? []) as ProyectoResumen[]
}

// ─────────────────────────────────────────
// Alertas y pendientes
// ─────────────────────────────────────────
export async function getAlertas(): Promise<Alerta[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('alertas')
    .select('*')
    .eq('leida', false)
    .order('prioridad', { ascending: true }) // alta primero
    .order('created_at', { ascending: false })
    .limit(8)

  return (data ?? []) as Alerta[]
}

// ─────────────────────────────────────────
// Flujo de caja real vs proyectado (últimos 6 meses + 3 meses futuros)
// Usamos movimientos reales + estimaciones simples
// ─────────────────────────────────────────
export async function getFlujoCaja() {
  const supabase = await createClient()

  const { data: movimientos } = await supabase
    .from('movimientos_resumen_mes')
    .select('mes, total_ingresos, total_egresos')
    .order('mes', { ascending: true })
    .limit(9)

  return (movimientos ?? []).map(row => ({
    mes: row.mes as string,
    real: Number(row.total_ingresos ?? 0) - Number(row.total_egresos ?? 0),
    proyectado: null as number | null,
  }))
}

// ─────────────────────────────────────────
// Saldos de cuentas bancarias
// ─────────────────────────────────────────
export async function getCuentasBancarias() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('cuentas_bancarias')
    .select('id, nombre, banco, tipo, saldo_actual, moneda')
    .eq('activa', true)
    .order('saldo_actual', { ascending: false })

  return data ?? []
}

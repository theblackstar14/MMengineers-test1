import { createClient } from '@/lib/supabase/server'

// ── Tesorería: cuentas bancarias activas ─────────────────────────
export async function getCuentasTesoreria() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('cuentas_bancarias')
    .select('*')
    .eq('activa', true)
    .order('saldo_actual', { ascending: false })
  return data ?? []
}

// ── KPIs financieros ────────────────────────────────────────────
export async function getFinanzasKpis() {
  const supabase = await createClient()

  const [kpisRes, bancosRes, garantiasRes, valorizRes, movMesRes] = await Promise.all([
    supabase.from('dashboard_kpis').select('*').single(),
    supabase.from('cuentas_bancarias').select('saldo_actual').eq('activa', true),
    supabase.from('garantias').select('monto, estado').in('estado', ['vigente', 'por_vencer']),
    supabase.from('valorizaciones').select('monto_neto, estado, fecha_vencimiento')
      .not('estado', 'in', '("cobrada","anulada")'),
    supabase.from('movimientos_resumen_mes').select('mes, total_ingresos, total_egresos, resultado_neto')
      .order('mes', { ascending: false }).limit(2),
  ])

  const kpis = kpisRes.data
  const saldoBancos = (bancosRes.data ?? []).reduce((s, c) => s + Number(c.saldo_actual ?? 0), 0)
  const garantiasMonto = (garantiasRes.data ?? []).reduce((s, g) => s + Number(g.monto ?? 0), 0)
  const garantiasCount = (garantiasRes.data ?? []).length

  const meses = movMesRes.data ?? []
  const mesMas = meses[0] ?? null
  const mesAnt = meses[1] ?? null
  const ingresosMes = mesMas ? Number(mesMas.total_ingresos) : (kpis?.ingresos_mes ?? 0)
  const egresosMes = mesMas ? Number(mesMas.total_egresos) : (kpis?.egresos_mes ?? 0)
  const ingresosAnt = mesAnt ? Number(mesAnt.total_ingresos) : 0
  const varPct = ingresosAnt > 0 ? ((ingresosMes - ingresosAnt) / ingresosAnt) * 100 : null
  const margenNeto = ingresosMes > 0 ? ((ingresosMes - egresosMes) / ingresosMes) * 100 : 0
  const utilidad = ingresosMes - egresosMes

  // por cobrar vencido
  const valorizaciones = valorizRes.data ?? []
  const hoy = new Date()
  const vencidas = valorizaciones.filter(v => {
    if (!v.fecha_vencimiento) return false
    return new Date(v.fecha_vencimiento) < hoy && !['cobrada','anulada'].includes(v.estado)
  }).length

  return {
    ingresosMes,
    egresosMes,
    margenNeto,
    utilidad,
    porCobrar: kpis?.por_cobrar ?? 0,
    porPagar: kpis?.por_pagar ?? 0,
    saldoBancos,
    garantiasMonto,
    garantiasCount,
    varIngresosPct: varPct,
    facturasVencidas: vencidas,
  }
}

// ── Valorizaciones activas ──────────────────────────────────────
export async function getValorizacionesActivas() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('valorizaciones')
    .select(`
      id, numero, estado, monto_neto, monto_bruto,
      fecha_envio, fecha_vencimiento, fecha_cobro, fecha_aprobacion,
      proyecto:proyecto_id (id, nombre, entidad_contratante)
    `)
    .not('estado', 'in', '("anulada")')
    .order('created_at', { ascending: false })
    .limit(8)
  return (data ?? []) as Array<{
    id: string
    numero: number
    estado: string
    monto_neto: number
    monto_bruto: number
    fecha_envio: string | null
    fecha_vencimiento: string | null
    fecha_cobro: string | null
    fecha_aprobacion: string | null
    proyecto: { id: string; nombre: string; entidad_contratante: string | null } | null
  }>
}

// ── Garantías activas ───────────────────────────────────────────
export async function getGarantiasActivas() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('garantias')
    .select(`
      id, tipo, banco, numero_carta, monto,
      fecha_emision, fecha_vencimiento, estado,
      proyecto:proyecto_id (id, nombre)
    `)
    .in('estado', ['vigente', 'por_vencer'])
    .order('fecha_vencimiento', { ascending: true })
    .limit(10)
  return (data ?? []) as Array<{
    id: string
    tipo: string
    banco: string
    numero_carta: string
    monto: number
    fecha_emision: string
    fecha_vencimiento: string
    estado: string
    proyecto: { id: string; nombre: string } | null
  }>
}

// ── Flujo de caja mensual (bar chart) ──────────────────────────
export async function getFlujoCajaMensual() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('movimientos_resumen_mes')
    .select('mes, total_ingresos, total_egresos')
    .order('mes', { ascending: true })
    .limit(9)
  return (data ?? []).map(r => ({
    mes: r.mes as string,
    real: Number(r.total_ingresos ?? 0),
    egresos: Number(r.total_egresos ?? 0),
  }))
}

// ── Cuentas por cobrar (movimientos ingreso pendiente) ─────────
export async function getCuentasPorCobrar() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('movimientos')
    .select(`
      id, descripcion, monto_neto, fecha_vencimiento, estado,
      proveedor_cliente:proveedor_cliente_id (razon_social),
      proyecto:proyecto_id (nombre)
    `)
    .eq('tipo', 'ingreso')
    .in('estado', ['pendiente', 'en_proceso'])
    .order('fecha_vencimiento', { ascending: true })
    .limit(6)
  return (data ?? []) as Array<{
    id: string
    descripcion: string
    monto_neto: number
    fecha_vencimiento: string | null
    estado: string
    proveedor_cliente: { razon_social: string } | null
    proyecto: { nombre: string } | null
  }>
}

// ── Cuentas por pagar (movimientos egreso pendiente) ───────────
export async function getCuentasPorPagar() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('movimientos')
    .select(`
      id, descripcion, monto_neto, fecha_vencimiento, estado,
      proveedor_cliente:proveedor_cliente_id (razon_social),
      proyecto:proyecto_id (nombre)
    `)
    .eq('tipo', 'egreso')
    .in('estado', ['pendiente', 'en_proceso'])
    .order('fecha_vencimiento', { ascending: true })
    .limit(6)
  return (data ?? []) as Array<{
    id: string
    descripcion: string
    monto_neto: number
    fecha_vencimiento: string | null
    estado: string
    proveedor_cliente: { razon_social: string } | null
    proyecto: { nombre: string } | null
  }>
}

// ── Movimientos del mes (ingresos y egresos) ───────────────────
export async function getMovimientosMes(mes: string) {
  const supabase = await createClient()
  const [year, month] = mes.split('-')
  const from = `${year}-${month}-01`
  const to = new Date(Number(year), Number(month), 0).toISOString().split('T')[0]

  const { data } = await supabase
    .from('movimientos')
    .select(`
      id, tipo, tipo_comprobante, numero_comprobante, serie_comprobante,
      fecha, descripcion, monto_bruto, monto_neto,
      detraccion_monto, retencion_monto,
      estado, categoria, proyecto_id,
      proveedor_cliente:proveedor_cliente_id (razon_social),
      proyecto:proyecto_id (nombre, codigo),
      cuenta_bancaria:cuenta_bancaria_id (nombre, banco)
    `)
    .gte('fecha', from)
    .lte('fecha', to)
    .not('estado', 'eq', 'anulado')
    .order('fecha', { ascending: false })
    .limit(60)

  return (data ?? []) as Array<{
    id: string
    tipo: string
    tipo_comprobante: string
    numero_comprobante: string | null
    serie_comprobante: string | null
    fecha: string | null
    descripcion: string
    monto_bruto: number
    monto_neto: number
    detraccion_monto: number | null
    retencion_monto: number | null
    estado: string
    categoria: string | null
    proyecto_id: string | null
    proveedor_cliente: { razon_social: string } | null
    proyecto: { nombre: string; codigo: string } | null
    cuenta_bancaria: { nombre: string; banco: string } | null
  }>
}

// ── Gastos de oficina (egresos categoría oficina) ──────────────
export async function getGastosOficina() {
  const supabase = await createClient()
  const now = new Date()
  const primerDia = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const ultimoDia = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString().split('T')[0]

  const { data } = await supabase
    .from('movimientos')
    .select('id, descripcion, monto_neto, categoria')
    .eq('tipo', 'egreso')
    .is('proyecto_id', null)          // gastos sin proyecto = oficina
    .gte('fecha', primerDia)
    .lte('fecha', ultimoDia)
    .not('estado', 'eq', 'anulado')
    .order('monto_neto', { ascending: false })
    .limit(8)

  return data ?? []
}

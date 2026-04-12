// ============================================================
// MMHIGHMETRIK ERP — Tipos de base de datos
// Generado manualmente desde el schema SQL
// Actualizar con: npx supabase gen types typescript --project-id TU_ID
// ============================================================

export type RolUsuario = 'gerente_general' | 'residente_obra' | 'administrador' | 'contador'
export type TipoProyecto = 'contrato_publico' | 'contrato_privado' | 'consultoria_tecnica' | 'supervision_obras'
export type EstadoProyecto = 'en_licitacion' | 'adjudicado' | 'en_ejecucion' | 'paralizado' | 'en_liquidacion' | 'liquidado' | 'cerrado'
export type EstadoLicitacion = 'identificada' | 'preparando_propuesta' | 'propuesta_enviada' | 'en_evaluacion' | 'adjudicada' | 'no_adjudicada' | 'desierta' | 'cancelada'
export type TipoProcesoSeace = 'licitacion_publica' | 'concurso_publico' | 'adjudicacion_simplificada' | 'seleccion_consultores' | 'comparacion_precios' | 'contratacion_directa' | 'subasta_inversa'
export type EstadoValorizacion = 'elaborando' | 'enviada' | 'en_revision' | 'aprobada' | 'facturada' | 'cobrada' | 'anulada'
export type TipoComprobante =
  | 'factura_recibida' | 'rhe' | 'boleta_venta' | 'liquidacion_compra'
  | 'ticket_maquina' | 'nota_debito_recibida' | 'nota_credito_recibida'
  | 'carta_detraccion' | 'vale_caja_chica' | 'boleta_planilla' | 'voucher_bancario'
  | 'factura_emitida' | 'nota_debito_emitida' | 'nota_credito_emitida' | 'nota_abono_bancario'
export type TipoMovimiento = 'ingreso' | 'egreso'
export type EstadoMovimiento = 'pendiente' | 'pagado' | 'anulado' | 'en_proceso'
export type TipoGarantia = 'fiel_cumplimiento' | 'adelanto_directo' | 'adelanto_materiales' | 'vicios_ocultos'
export type EstadoGarantia = 'vigente' | 'por_vencer' | 'vencida' | 'ejecutada' | 'liberada'
export type EstadoHito = 'pendiente' | 'en_proceso' | 'completado' | 'retrasado'
export type TipoDocumentoEntidad = 'proyecto' | 'licitacion' | 'movimiento' | 'garantia' | 'valorizacion' | 'cotizacion'
export type Banco = 'bcp' | 'bbva' | 'scotiabank' | 'interbank' | 'banbif' | 'mibanco' | 'banco_nacion' | 'otro'

// ─────────────────────────────────────────
export interface Profile {
  id: string
  nombre: string
  apellido: string
  email: string
  rol: RolUsuario
  avatar_url: string | null
  telefono: string | null
  cargo: string | null
  activo: boolean
  created_at: string
  updated_at: string
}

export interface ProveedorCliente {
  id: string
  tipo: 'proveedor' | 'cliente' | 'ambos'
  razon_social: string
  ruc_dni: string
  tipo_persona: 'natural' | 'juridica'
  direccion: string | null
  email: string | null
  telefono: string | null
  contacto_nombre: string | null
  cuenta_detracciones: string | null
  activo: boolean
  created_at: string
  updated_at: string
}

export interface CuentaBancaria {
  id: string
  nombre: string
  banco: Banco
  numero_cuenta: string
  cci: string | null
  tipo: 'corriente' | 'ahorros' | 'caja_chica' | 'detracciones'
  moneda: 'PEN' | 'USD'
  saldo_actual: number
  activa: boolean
  created_at: string
  updated_at: string
}

export interface Proyecto {
  id: string
  codigo: string
  nombre: string
  descripcion: string | null
  tipo: TipoProyecto
  estado: EstadoProyecto
  cliente_id: string | null
  entidad_contratante: string | null
  numero_contrato: string | null
  monto_contrato: number
  monto_adicionales: number
  avance_fisico_pct: number
  avance_financiero_pct: number
  fecha_inicio: string | null
  fecha_fin_contractual: string | null
  fecha_fin_estimada: string | null
  fecha_fin_real: string | null
  plazo_dias: number | null
  ubicacion: string | null
  departamento: string | null
  residente_id: string | null
  licitacion_id: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface ProyectoResumen extends Proyecto {
  monto_total: number
  dias_transcurridos: number | null
  dias_restantes: number | null
  residente_nombre: string | null
  monto_valorizado: number
  monto_cobrado: number
  num_valorizaciones: number
}

export interface Licitacion {
  id: string
  codigo_seace: string | null
  nombre: string
  entidad: string
  tipo_proceso: TipoProcesoSeace | null
  estado: EstadoLicitacion
  monto_referencial: number | null
  monto_propuesta: number | null
  probabilidad_pct: number | null
  fecha_publicacion: string | null
  fecha_registro_part: string | null
  fecha_bases_integradas: string | null
  fecha_presentacion: string | null
  fecha_buena_pro: string | null
  fecha_adjudicacion: string | null
  motivo_no_adjudicacion: string | null
  responsable_id: string | null
  ubicacion: string | null
  proyecto_id: string | null
  cotizacion_elevada_id: string | null
  notas: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Cotizacion {
  id: string
  proyecto_id: string | null
  licitacion_id: string | null
  nombre: string
  version: number
  estado: 'borrador' | 'vigente' | 'historica' | 'aprobada'
  total: number
  notas: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Partida {
  id: string
  cotizacion_id: string
  parent_id: string | null
  codigo: string
  nivel: 1 | 2 | 3 | 4
  nombre: string
  unidad: string | null
  metrado: number | null
  precio_unitario: number | null
  total: number
  total_adicional: number
  total_valorizado: number
  orden: number
  created_at: string
  updated_at: string
  // Para UI jerárquica
  children?: Partida[]
}

export interface Valorizacion {
  id: string
  proyecto_id: string
  numero: number
  periodo_inicio: string
  periodo_fin: string
  estado: EstadoValorizacion
  monto_bruto: number
  retencion_5pct: number
  monto_neto: number
  es_liquidacion: boolean
  retencion_devuelta: number
  numero_factura: string | null
  fecha_factura: string | null
  fecha_envio: string | null
  fecha_aprobacion: string | null
  fecha_cobro: string | null
  movimiento_id: string | null
  notas: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Movimiento {
  id: string
  tipo: TipoMovimiento
  tipo_comprobante: TipoComprobante
  numero_comprobante: string | null
  serie_comprobante: string | null
  fecha: string
  fecha_vencimiento: string | null
  fecha_pago: string | null
  proveedor_cliente_id: string | null
  proyecto_id: string | null
  valoracion_id: string | null
  referencia_os: string | null
  referencia_oc: string | null
  categoria: string | null
  descripcion: string
  monto_bruto: number
  tiene_detraccion: boolean
  detraccion_pct: number | null
  detraccion_monto: number | null
  carta_detraccion: string | null
  tiene_retencion: boolean
  retencion_pct: number | null
  retencion_monto: number | null
  monto_neto: number
  estado: EstadoMovimiento
  cuenta_bancaria_id: string | null
  archivo_url: string | null
  archivo_nombre: string | null
  notas: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  // Joins opcionales
  proveedor_cliente?: ProveedorCliente
  proyecto?: Pick<Proyecto, 'id' | 'codigo' | 'nombre'>
}

export interface Garantia {
  id: string
  proyecto_id: string
  tipo: TipoGarantia
  banco: Banco
  numero_carta: string
  monto: number
  fecha_emision: string
  fecha_vencimiento: string
  estado: EstadoGarantia
  renovacion_de_id: string | null
  notas: string | null
  archivo_url: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  // Joins
  proyecto?: Pick<Proyecto, 'id' | 'codigo' | 'nombre'>
}

export interface HitoProyecto {
  id: string
  proyecto_id: string
  nombre: string
  descripcion: string | null
  fecha_estimada: string | null
  fecha_real: string | null
  estado: EstadoHito
  orden: number
  created_at: string
  updated_at: string
}

export interface CurvaS {
  id: string
  proyecto_id: string
  fecha: string
  avance_planificado: number
  avance_real: number | null
  costo_planificado: number
  costo_real: number | null
  created_at: string
}

export interface Alerta {
  id: string
  tipo: string
  titulo: string
  descripcion: string | null
  prioridad: 'alta' | 'media' | 'baja'
  entidad_tipo: string | null
  entidad_id: string | null
  leida: boolean
  usuario_id: string | null
  fecha_expira: string | null
  created_at: string
}

// ─────────────────────────────────────────
// Dashboard KPIs (vista SQL)
// ─────────────────────────────────────────
export interface DashboardKpis {
  proyectos_activos: number
  licitaciones_en_proceso: number
  monto_total_contratos: number
  ingresos_mes: number
  egresos_mes: number
  por_cobrar: number
  por_pagar: number
  garantias_por_vencer: number
  valorizaciones_pendientes: number
  saldo_total_bancos: number
}

// ─────────────────────────────────────────
// EVM (Earned Value Management)
// ─────────────────────────────────────────
export interface EVM {
  bac: number
  pv: number
  ev: number
  ac: number
  sv: number
  cv: number
  spi: number
  cpi: number
  eac: number
  etc: number
  vac: number
}

import Link from 'next/link'
import { MapPin, AlertTriangle, Clock } from 'lucide-react'
import { cn, formatSoles, getLabelEstadoProyecto, getColorEstadoProyecto } from '@/lib/utils'
import type { ProyectoResumen } from '@/lib/types/database'

interface Props { proyecto: ProyectoResumen }

// ── Colores avatar por inicial del nombre ────────────────────────
const AVATAR_COLORS = [
  '#10B981', '#F59E0B', '#3B82F6', '#EC4899',
  '#8B5CF6', '#F97316', '#06B6D4', '#EF4444',
]
function avatarColor(nombre: string | null) {
  if (!nombre) return '#6B7280'
  return AVATAR_COLORS[nombre.charCodeAt(0) % AVATAR_COLORS.length]
}
function initials(nombre: string | null) {
  if (!nombre) return '?'
  const p = nombre.trim().split(/\s+/)
  return p.length === 1 ? p[0][0].toUpperCase() : (p[0][0] + p[1][0]).toUpperCase()
}
function shortName(nombre: string | null) {
  if (!nombre) return '—'
  const p = nombre.trim().split(/\s+/)
  return p.length === 1 ? p[0] : `${p[0]} ${p[1][0]}.`
}

// ── Tags por tipo ────────────────────────────────────────────────
function tagPublica(tipo: string) {
  return tipo === 'contrato_privado' ? 'Privada' : 'Pública'
}
function tagTipo(tipo: string, estado: string) {
  if (estado === 'liquidado' || estado === 'cerrado') return 'Completado'
  const map: Record<string, string> = {
    contrato_publico:  'Obra',
    contrato_privado:  'Privada',
    consultoria_tecnica: 'Consultoría',
    supervision_obras: 'Supervisión',
  }
  return map[tipo] ?? tipo
}

// ── Color barra/ejecutado según avance ──────────────────────────
function avanceColor(avance: number): string {
  if (avance >= 70) return '#22C55E'
  if (avance >= 40) return '#EAB308'
  return '#EF4444'
}

// ── Banner de alerta derivado ────────────────────────────────────
type AlertBanner = { text: string; bg: string; textColor: string } | null

function getAlerta(p: ProyectoResumen): AlertBanner {
  if (p.estado === 'paralizado') {
    return { text: '⚠ Proyecto paralizado', bg: '#7F1D1D', textColor: '#FCA5A5' }
  }
  if (
    p.estado === 'en_ejecucion' &&
    p.plazo_dias &&
    p.dias_transcurridos != null &&
    p.plazo_dias > 0
  ) {
    const expectedPct = (p.dias_transcurridos / p.plazo_dias) * 100
    const delta = expectedPct - p.avance_fisico_pct
    if (delta > 15) {
      const diasAtraso = Math.round((delta / 100) * p.plazo_dias)
      return { text: `▲ Atraso ${diasAtraso} días`, bg: '#7F1D1D', textColor: '#FCA5A5' }
    }
  }
  if (
    p.estado === 'en_ejecucion' &&
    (p.dias_restantes ?? 999) <= 45 &&
    p.avance_fisico_pct >= 70
  ) {
    return { text: '▲ Entrega próxima', bg: '#064E3B', textColor: '#6EE7B7' }
  }
  return null
}

export function ProyectoCard({ proyecto: p }: Props) {
  const avance   = p.avance_fisico_pct ?? 0
  const monto    = p.monto_total ?? (p.monto_contrato + p.monto_adicionales)
  const ejecutado = p.monto_valorizado ?? 0
  const dias     = p.dias_restantes

  const barColor = avanceColor(avance)
  const ejecutadoColor = avanceColor(avance)
  const alerta   = getAlerta(p)

  const diasText = dias != null && dias >= 0 ? `${dias} días` : '—'
  const ubicacion = p.departamento ?? p.ubicacion ?? null

  return (
    <Link href={`/proyectos/${p.id}`} className="block h-full group">
      <div
        className="h-full flex flex-col rounded-xl border overflow-hidden transition-all duration-150 group-hover:brightness-105 cursor-pointer"
        style={{ backgroundColor: '#161B2E', borderColor: '#1E293B' }}
      >

        {/* ── Banner alerta (condicional) ── */}
        {alerta && (
          <div
            className="px-4 py-1.5 text-xs font-medium flex items-center gap-1.5"
            style={{ backgroundColor: alerta.bg, color: alerta.textColor }}
          >
            {alerta.text}
          </div>
        )}

        {/* ── Cuerpo ── */}
        <div className="flex flex-col gap-3 p-4 flex-1">

          {/* Fila: código + badge */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-mono text-gray-500">{p.codigo}</span>
            <span className={cn('erp-badge text-[11px] shrink-0', getColorEstadoProyecto(p.estado))}>
              {getLabelEstadoProyecto(p.estado)}
            </span>
          </div>

          {/* Nombre */}
          <div>
            <h3 className="font-bold text-white text-[15px] leading-snug line-clamp-2">
              {p.nombre}
            </h3>
            {p.entidad_contratante && (
              <p className="text-xs text-gray-500 mt-0.5 truncate">
                {p.entidad_contratante}
                <span className="mx-1 text-gray-700">·</span>
                {tagTipo(p.tipo, p.estado)}
              </p>
            )}
            {ubicacion && (
              <p className="text-[11px] text-gray-600 mt-0.5 flex items-center gap-1 truncate">
                <MapPin size={10} />
                {ubicacion}
              </p>
            )}
          </div>

          {/* Avance físico */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-gray-500">Avance físico</span>
              <span className="text-sm font-bold" style={{ color: barColor }}>
                {avance.toFixed(0)}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#0F1623' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${avance}%`, backgroundColor: barColor }}
              />
            </div>
          </div>

          {/* 3 métricas */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-[10px] text-gray-600 uppercase tracking-wide">Presupuesto</p>
              <p className="text-sm font-semibold text-white mt-0.5 tabular-nums">
                {formatSoles(monto, true)}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-gray-600 uppercase tracking-wide">Ejecutado</p>
              <p className="text-sm font-semibold mt-0.5 tabular-nums" style={{ color: ejecutadoColor }}>
                {formatSoles(ejecutado, true)}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-gray-600 uppercase tracking-wide">Días rest.</p>
              <p className={cn(
                'text-sm font-semibold mt-0.5',
                dias != null && dias < 30 ? 'text-red-400' :
                dias != null && dias < 90 ? 'text-yellow-400' : 'text-gray-300'
              )}>
                {diasText}
              </p>
            </div>
          </div>
        </div>

        {/* ── Footer: avatar + tags + "Ver detalle" ── */}
        <div
          className="px-4 py-2.5 flex items-center justify-between gap-2 border-t"
          style={{ borderColor: '#1E293B', backgroundColor: '#111827' }}
        >
          {/* Avatar + nombre residente */}
          <div className="flex items-center gap-1.5 min-w-0">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
              style={{ backgroundColor: avatarColor(p.residente_nombre) }}
            >
              {initials(p.residente_nombre)}
            </div>
            <span className="text-xs text-gray-400 truncate">{shortName(p.residente_nombre)}</span>
          </div>

          {/* Tags */}
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[10px] px-1.5 py-0.5 rounded border text-gray-500" style={{ borderColor: '#334155' }}>
              {tagPublica(p.tipo)}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded border text-gray-500" style={{ borderColor: '#334155' }}>
              {tagTipo(p.tipo, p.estado)}
            </span>
          </div>

          {/* Ver detalle */}
          <span className="text-[11px] text-yellow-500 group-hover:text-yellow-300 whitespace-nowrap shrink-0 transition-colors">
            Ver detalle →
          </span>
        </div>
      </div>
    </Link>
  )
}

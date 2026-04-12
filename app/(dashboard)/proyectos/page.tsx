import { Metadata } from 'next'
import Link from 'next/link'
import { getProyectos } from '@/lib/queries/proyectos'
import { ProyectoCard } from '@/components/proyectos/ProyectoCard'
import { SortSelect } from '@/components/proyectos/SortSelect'
import { formatSoles, cn } from '@/lib/utils'
import { Plus, Upload, Search, LayoutGrid, List, FolderKanban } from 'lucide-react'
import type { ProyectoResumen } from '@/lib/types/database'

export const metadata: Metadata = { title: 'Proyectos — MMHIGHMETRIK ERP' }
export const revalidate = 60

const POR_PAGINA = 6

// ── Helpers derivados ────────────────────────────────────────────

function isEnRiesgo(p: ProyectoResumen): boolean {
  if (p.estado === 'paralizado') return true
  if (
    p.estado === 'en_ejecucion' &&
    p.plazo_dias &&
    p.dias_transcurridos != null &&
    p.plazo_dias > 0
  ) {
    const expectedPct = (p.dias_transcurridos / p.plazo_dias) * 100
    return p.avance_fisico_pct < expectedPct - 15
  }
  return false
}

function isPorConcluir(p: ProyectoResumen): boolean {
  return (
    p.estado === 'en_ejecucion' &&
    (p.dias_restantes ?? 999) <= 60 &&
    p.avance_fisico_pct >= 70
  )
}

function isCompletado(p: ProyectoResumen): boolean {
  return p.estado === 'liquidado' || p.estado === 'cerrado'
}

function applyFiltro(list: ProyectoResumen[], filtro: string): ProyectoResumen[] {
  switch (filtro) {
    case 'en_ejecucion': return list.filter(p => p.estado === 'en_ejecucion')
    case 'en_riesgo':    return list.filter(isEnRiesgo)
    case 'por_concluir': return list.filter(isPorConcluir)
    case 'completados':  return list.filter(isCompletado)
    default:             return list
  }
}

// ── Tipos de página ──────────────────────────────────────────────

interface PageProps {
  searchParams: Promise<{
    filtro?: string
    q?: string
    orden?: string
    vista?: string
    page?: string
  }>
}

// ── buildHref ────────────────────────────────────────────────────

function buildHref(
  base: { filtro: string; q: string; orden: string; vista: string; page: number },
  overrides: Record<string, string>
) {
  const p: Record<string, string> = {
    filtro: base.filtro,
    ...(base.q ? { q: base.q } : {}),
    orden: base.orden,
    vista: base.vista,
    page: String(base.page),
    ...overrides,
  }
  if (p.filtro === 'todos')       delete p.filtro
  if (p.orden  === 'avance_desc') delete p.orden
  if (p.vista  === 'grid')        delete p.vista
  if (p.page   === '1')           delete p.page
  const qs = new URLSearchParams(p).toString()
  return `/proyectos${qs ? `?${qs}` : ''}`
}

// ── Página ───────────────────────────────────────────────────────

export default async function ProyectosPage({ searchParams }: PageProps) {
  const params        = await searchParams
  const filtroActivo  = params.filtro  ?? 'todos'
  const q             = params.q?.toLowerCase() ?? ''
  const orden         = params.orden   ?? 'avance_desc'
  const vista         = params.vista   ?? 'grid'
  const paginaActual  = Math.max(1, parseInt(params.page ?? '1'))

  // Fetch todos los proyectos (filtramos aquí, no en Supabase)
  const todos = await getProyectos()

  // ── Conteos para stats ─────────────────────────────────────────
  const enEjecucionList  = todos.filter(p => p.estado === 'en_ejecucion')
  const enRiesgoList     = todos.filter(isEnRiesgo)
  const porConcluirList  = todos.filter(isPorConcluir)
  const enLicitacionList = todos.filter(p => p.estado === 'en_licitacion')
  const completadosList  = todos.filter(isCompletado)
  const tiposDistintos   = new Set(todos.map(p => p.tipo)).size

  const montoEnEjecucion  = enEjecucionList.reduce((s, p) => s + (p.monto_total ?? 0), 0)
  const montoEnLicitacion = enLicitacionList.reduce((s, p) => s + p.monto_contrato, 0)
  const montoTotal        = todos.reduce((s, p) => s + (p.monto_total ?? 0), 0)

  const STATS = [
    {
      label: 'Total proyectos',
      value: todos.length,
      sub: `${tiposDistintos} tipos distintos`,
      color: 'text-white',
    },
    {
      label: 'En ejecución',
      value: enEjecucionList.length,
      sub: `${formatSoles(montoEnEjecucion, true)} activo`,
      color: 'text-green-400',
    },
    {
      label: 'En riesgo',
      value: enRiesgoList.length,
      sub: 'Requieren atención',
      color: 'text-red-400',
    },
    {
      label: 'Por concluir',
      value: porConcluirList.length,
      sub: 'Entrega próxima',
      color: 'text-yellow-400',
    },
    {
      label: 'En licitación',
      value: enLicitacionList.length,
      sub: `${formatSoles(montoEnLicitacion, true)} en juego`,
      color: 'text-blue-400',
    },
    {
      label: 'Completados',
      value: completadosList.length,
      sub: 'Este año',
      color: 'text-gray-400',
    },
  ]

  const FILTROS = [
    { key: 'todos',        label: 'Todos',        count: todos.length },
    { key: 'en_ejecucion', label: 'En ejecución', count: enEjecucionList.length },
    { key: 'en_riesgo',    label: 'En riesgo',    count: enRiesgoList.length },
    { key: 'por_concluir', label: 'Por concluir', count: porConcluirList.length },
    { key: 'completados',  label: 'Completados',  count: completadosList.length },
  ]

  // ── Filtrado + búsqueda + sort ─────────────────────────────────
  let lista = applyFiltro(todos, filtroActivo)

  if (q) {
    lista = lista.filter(p =>
      p.nombre.toLowerCase().includes(q) ||
      p.codigo.toLowerCase().includes(q) ||
      (p.entidad_contratante ?? '').toLowerCase().includes(q)
    )
  }

  lista = [...lista].sort((a, b) => {
    if (orden === 'avance_asc')  return a.avance_fisico_pct - b.avance_fisico_pct
    if (orden === 'monto_desc')  return (b.monto_total ?? 0) - (a.monto_total ?? 0)
    if (orden === 'nombre_asc')  return a.nombre.localeCompare(b.nombre)
    return b.avance_fisico_pct - a.avance_fisico_pct // avance_desc (default)
  })

  // ── Paginación ─────────────────────────────────────────────────
  const totalFiltrado = lista.length
  const totalPaginas  = Math.max(1, Math.ceil(totalFiltrado / POR_PAGINA))
  const pagina        = Math.min(paginaActual, totalPaginas)
  const paginados     = lista.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)

  const base = { filtro: filtroActivo, q, orden, vista, page: pagina }

  // Rango de páginas a mostrar en el paginador
  function paginasVisibles(): number[] {
    if (totalPaginas <= 7) return Array.from({ length: totalPaginas }, (_, i) => i + 1)
    if (pagina <= 4)       return [1, 2, 3, 4, 5]
    if (pagina >= totalPaginas - 3) return Array.from({ length: 5 }, (_, i) => totalPaginas - 4 + i)
    return [pagina - 1, pagina, pagina + 1]
  }
  const pgVisibles = paginasVisibles()
  const showFirstEllipsis = pgVisibles[0] > 2
  const showLastEllipsis  = pgVisibles[pgVisibles.length - 1] < totalPaginas - 1

  return (
    <div className="space-y-4 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Proyectos</h1>
          <p className="text-sm text-gray-500 mt-0.5">{todos.length} proyectos registrados</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="erp-btn-secondary h-9">
            <Upload size={14} />
            Importar
          </button>
          <Link href="/proyectos/nuevo" className="erp-btn-primary h-9">
            <Plus size={15} />
            Nuevo proyecto
          </Link>
        </div>
      </div>

      {/* ── Stats bar (6 métricas + presupuesto total) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {STATS.map(s => (
          <div key={s.label} className="erp-card !p-3">
            <p className={cn('text-2xl font-bold leading-none', s.color)}>{s.value}</p>
            <p className="text-[11px] font-medium text-white/80 mt-1">{s.label}</p>
            <p className="text-[10px] text-gray-600 mt-0.5 leading-tight">{s.sub}</p>
          </div>
        ))}
        {/* Presupuesto total */}
        <div className="erp-card !p-3">
          <p className="text-2xl font-bold leading-none text-yellow-400">{formatSoles(montoTotal, true)}</p>
          <p className="text-[11px] font-medium text-white/80 mt-1">Presupuesto total</p>
          <p className="text-[10px] text-gray-600 mt-0.5 leading-tight">Cartera activa</p>
        </div>
      </div>

      {/* ── Barra: search + filtros + sort + toggle ── */}
      <div className="flex items-center gap-2 flex-wrap">

        {/* Search */}
        <form method="GET" action="/proyectos" className="relative shrink-0">
          {filtroActivo !== 'todos' && <input type="hidden" name="filtro" value={filtroActivo} />}
          {orden !== 'avance_desc'  && <input type="hidden" name="orden"  value={orden} />}
          {vista !== 'grid'         && <input type="hidden" name="vista"  value={vista} />}
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar proyecto..."
            className="erp-input pl-8 w-44 text-sm h-9"
          />
        </form>

        {/* Filtros */}
        <div className="flex items-center gap-1 flex-1 flex-wrap">
          {FILTROS.map(({ key, label, count }) => {
            const isActive = filtroActivo === key
            return (
              <Link
                key={key}
                href={buildHref(base, { filtro: key, page: '1' })}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
                  isActive
                    ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                )}
              >
                {label}
                <span className={cn(
                  'text-[11px] px-1.5 py-0.5 rounded-full',
                  isActive ? 'bg-yellow-500/20 text-yellow-300' : 'bg-gray-700/50 text-gray-600'
                )}>
                  {count}
                </span>
              </Link>
            )
          })}
        </div>

        {/* Sort (client component) */}
        <SortSelect
          currentOrden={orden}
          currentFiltro={filtroActivo}
          currentQ={q}
          currentVista={vista}
        />

        {/* Vista toggle */}
        <div
          className="flex items-center gap-0.5 rounded-lg border p-0.5 shrink-0"
          style={{ borderColor: '#1E293B' }}
        >
          <Link
            href={buildHref(base, { vista: 'grid' })}
            className={cn(
              'p-1.5 rounded transition-colors',
              vista === 'grid' ? 'bg-white/10 text-white' : 'text-gray-600 hover:text-gray-400'
            )}
          >
            <LayoutGrid size={15} />
          </Link>
          <Link
            href={buildHref(base, { vista: 'lista' })}
            className={cn(
              'p-1.5 rounded transition-colors',
              vista === 'lista' ? 'bg-white/10 text-white' : 'text-gray-600 hover:text-gray-400'
            )}
          >
            <List size={15} />
          </Link>
        </div>
      </div>

      {/* ── Grid / Lista de cards ── */}
      {paginados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-600">
          <FolderKanban size={44} className="mb-3 opacity-20" />
          <p className="text-lg font-medium text-gray-500">No hay proyectos</p>
          <p className="text-sm mt-1">
            {q
              ? `Sin resultados para "${q}"`
              : 'Crea tu primer proyecto con el botón de arriba'}
          </p>
        </div>
      ) : (
        <div className={cn(
          vista === 'lista'
            ? 'flex flex-col gap-3'
            : 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'
        )}>
          {paginados.map(p => (
            <ProyectoCard key={p.id} proyecto={p} />
          ))}
        </div>
      )}

      {/* ── Footer: count + paginación + firma ── */}
      <div className="flex items-center justify-between pt-1 pb-2 flex-wrap gap-3">

        {/* Conteo */}
        <p className="text-xs text-gray-600">
          Mostrando {paginados.length} de {totalFiltrado} proyectos
        </p>

        {/* Paginación */}
        {totalPaginas > 1 && (
          <div className="flex items-center gap-1">

            {/* Anterior */}
            <Link
              href={buildHref(base, { page: String(Math.max(1, pagina - 1)) })}
              aria-disabled={pagina === 1}
              className={cn(
                'w-8 h-8 flex items-center justify-center rounded border text-xs transition-colors',
                pagina === 1
                  ? 'border-gray-800 text-gray-700 pointer-events-none'
                  : 'border-gray-700 text-gray-400 hover:text-white hover:border-gray-500'
              )}
              style={{ borderColor: pagina === 1 ? '#1a2030' : '#1E293B' }}
            >
              {'<'}
            </Link>

            {/* Primera página si no está visible */}
            {pgVisibles[0] > 1 && (
              <Link
                href={buildHref(base, { page: '1' })}
                className="w-8 h-8 flex items-center justify-center rounded border text-xs text-gray-400 hover:text-white transition-colors"
                style={{ borderColor: '#1E293B' }}
              >
                1
              </Link>
            )}

            {/* Ellipsis izquierdo */}
            {showFirstEllipsis && (
              <span className="w-6 text-center text-gray-600 text-xs">...</span>
            )}

            {/* Páginas visibles */}
            {pgVisibles.map(pg => (
              <Link
                key={pg}
                href={buildHref(base, { page: String(pg) })}
                className={cn(
                  'w-8 h-8 flex items-center justify-center rounded border text-xs font-medium transition-colors',
                  pg === pagina
                    ? 'border-yellow-500 bg-yellow-500 text-black'
                    : 'border-gray-700 text-gray-400 hover:text-white hover:border-gray-500'
                )}
                style={pg !== pagina ? { borderColor: '#1E293B' } : undefined}
              >
                {pg}
              </Link>
            ))}

            {/* Ellipsis derecho */}
            {showLastEllipsis && (
              <span className="w-6 text-center text-gray-600 text-xs">...</span>
            )}

            {/* Última página si no está visible */}
            {pgVisibles[pgVisibles.length - 1] < totalPaginas && (
              <Link
                href={buildHref(base, { page: String(totalPaginas) })}
                className="w-8 h-8 flex items-center justify-center rounded border text-xs text-gray-400 hover:text-white transition-colors"
                style={{ borderColor: '#1E293B' }}
              >
                {totalPaginas}
              </Link>
            )}

            {/* Siguiente */}
            <Link
              href={buildHref(base, { page: String(Math.min(totalPaginas, pagina + 1)) })}
              aria-disabled={pagina === totalPaginas}
              className={cn(
                'w-8 h-8 flex items-center justify-center rounded border text-xs transition-colors',
                pagina === totalPaginas
                  ? 'border-gray-800 text-gray-700 pointer-events-none'
                  : 'border-gray-700 text-gray-400 hover:text-white hover:border-gray-500'
              )}
              style={{ borderColor: pagina === totalPaginas ? '#1a2030' : '#1E293B' }}
            >
              {'>'}
            </Link>
          </div>
        )}

        {/* Firma */}
        <p className="text-xs text-gray-600">MMHIGHMETRIK ENGINEERS S.A.C · ERP v1.0</p>
      </div>

    </div>
  )
}

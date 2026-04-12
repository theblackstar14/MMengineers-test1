import { getLicitaciones, getLicitacionStats } from '@/lib/queries/licitaciones'
import { LicitacionesSplitView } from '@/components/licitaciones/LicitacionesSplitView'

export default async function LicitacionesPage() {
  const [licitaciones, stats] = await Promise.all([
    getLicitaciones(),
    getLicitacionStats(),
  ])

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Licitaciones</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Pipeline de procesos · {stats.total} registrados
          </p>
        </div>
        <div className="flex gap-3">
          <button
            className="px-4 py-2 text-sm font-medium rounded-lg border transition-colors hover:text-white"
            style={{ backgroundColor: '#161B2E', borderColor: '#1E293B', color: '#94A3B8' }}
          >
            Sincronizar SEACE
          </button>
          <button
            className="px-4 py-2 text-sm font-bold rounded-lg text-black transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#EAB308' }}
          >
            + Nueva licitación
          </button>
        </div>
      </div>

      <LicitacionesSplitView licitaciones={licitaciones} stats={stats} />
    </div>
  )
}
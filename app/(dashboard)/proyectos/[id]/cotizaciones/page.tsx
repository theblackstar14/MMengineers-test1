import { notFound } from 'next/navigation'
import { getProyectoById, getCotizacionesProyecto } from '@/lib/queries/proyectos'
import { VisorCotizaciones } from '@/components/cotizaciones/VisorCotizaciones'

interface PageProps { params: Promise<{ id: string }> }

export default async function CotizacionesPage({ params }: PageProps) {
  const { id } = await params
  const proyecto = await getProyectoById(id)
  if (!proyecto) notFound()

  const cotizaciones = await getCotizacionesProyecto(id)

  return (
    <VisorCotizaciones
      proyectoId={id}
      proyectoNombre={proyecto.nombre}
      cotizacionesDB={cotizaciones as any}
    />
  )
}

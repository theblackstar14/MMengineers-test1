import { notFound } from 'next/navigation'
import { getProyectoById } from '@/lib/queries/proyectos'
import { getCronogramaActivo } from '@/lib/queries/progreso'
import { VisorProgreso } from '@/components/cronograma/VisorProgreso'

interface PageProps { params: Promise<{ id: string }> }

export default async function ProgresoPage({ params }: PageProps) {
  const { id } = await params
  const proyecto = await getProyectoById(id)
  if (!proyecto) notFound()

  const data = await getCronogramaActivo(id)

  return (
    <VisorProgreso
      proyectoId={id}
      proyectoNombre={proyecto.nombre}
      initial={data}
    />
  )
}

'use client'

import { useRouter, usePathname } from 'next/navigation'

interface Props {
  currentOrden: string
  currentFiltro: string
  currentQ: string
  currentVista: string
}

const OPCIONES = [
  { value: 'avance_desc', label: 'Avance ↓' },
  { value: 'avance_asc',  label: 'Avance ↑' },
  { value: 'monto_desc',  label: 'Monto ↓' },
  { value: 'nombre_asc',  label: 'Nombre A-Z' },
]

export function SortSelect({ currentOrden, currentFiltro, currentQ, currentVista }: Props) {
  const router   = useRouter()
  const pathname = usePathname()

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const p = new URLSearchParams()
    if (currentFiltro !== 'todos') p.set('filtro', currentFiltro)
    if (currentQ)                  p.set('q', currentQ)
    if (e.target.value !== 'avance_desc') p.set('orden', e.target.value)
    if (currentVista !== 'grid')   p.set('vista', currentVista)
    router.push(`${pathname}?${p.toString()}`)
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-gray-500 whitespace-nowrap">Ordenar:</span>
      <select
        value={currentOrden}
        onChange={handleChange}
        className="text-xs text-gray-300 bg-transparent border-none outline-none cursor-pointer"
      >
        {OPCIONES.map(o => (
          <option key={o.value} value={o.value} className="bg-[#161B2E]">
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

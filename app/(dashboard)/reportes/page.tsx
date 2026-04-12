import { Metadata } from 'next'
import { ReportesView } from '@/components/reportes/ReportesView'

export const metadata: Metadata = { title: 'Reportes — MMHIGHMETRIK ERP' }

export default function ReportesPage() {
  return <ReportesView />
}

import type { Metadata } from 'next'
import { requireAuth } from '@/actions/auth.actions'
import { PageHeader } from '@/components/layout/PageHeader'
import { FaultReportsList } from '@/features/fault-reports/components/FaultReportsList'
import { LodgeFaultReportForm } from '@/features/fault-reports/components/LodgeFaultReportForm'

export const metadata: Metadata = { title: 'Fault reports' }

export default async function FaultReportsPage() {
  await requireAuth()

  return (
    <div className="space-y-8">
      <PageHeader
        title="Fault reports"
        description="Lodge a service fault and track its current status."
      />
      <LodgeFaultReportForm />
      <FaultReportsList />
    </div>
  )
}
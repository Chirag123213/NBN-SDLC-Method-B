'use client'

import { useState } from 'react'
import { CircleAlert } from 'lucide-react'
import { toast } from 'sonner'
import { EmptyState } from '@/components/shared/EmptyState'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { resolveFaultReport } from '@/features/fault-reports/actions/fault-reports.actions'
import { useFaultReports } from '@/features/fault-reports/hooks/useFaultReports'
import { useAuth } from '@/hooks/useAuth'
import { formatDatetime } from '@/lib/utils'
import type { FaultReportCategory } from '@/types/firestore'

const categoryLabels: Record<FaultReportCategory, string> = {
  connection: 'Connection',
  speed: 'Speed',
  equipment: 'Equipment',
  billing: 'Billing',
}

export function FaultReportsList() {
  const { user, loading: authLoading } = useAuth()
  const { reports, loading, error } = useFaultReports(user?.uid)
  const [resolvingId, setResolvingId] = useState<string | null>(null)

  const handleResolve = async (reportId: string) => {
    setResolvingId(reportId)
    const result = await resolveFaultReport(reportId)
    setResolvingId(null)

    if (!result.success) {
      toast.error(result.error ?? 'Failed to resolve fault report')
      return
    }

    toast.success('Fault report marked as resolved')
  }

  return (
    <section aria-labelledby="fault-reports-heading" className="space-y-4">
      <div>
        <h2 id="fault-reports-heading" className="text-lg font-semibold">
          Your fault reports
        </h2>

        <p className="mt-1 text-sm text-zinc-500">
          Reports update here automatically as their status changes.
        </p>
      </div>

      {authLoading || loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <p className="rounded-md bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          Unable to load fault reports. Please try again.
        </p>
      ) : reports.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <EmptyState
            icon={CircleAlert}
            title="No fault reports yet"
            description="Faults you lodge will appear here."
          />
        </div>
      ) : (
        <ul className="space-y-3">
          {reports.map((report) => (
            <li
              key={report.id}
              className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="break-words font-semibold">
                      {report.title}
                    </h3>

                    <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      {categoryLabels[report.category]}
                    </span>

                    <span
                      className={
                        report.status === 'open'
                          ? 'inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-300'
                      }
                    >
                      {report.status === 'open' ? 'Open' : 'Resolved'}
                    </span>
                  </div>

                  <p className="break-words whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400">
                    {report.description}
                  </p>

                  <p className="text-xs text-zinc-500">
                    Lodged {formatDatetime(report.createdAt.toDate())}
                  </p>
                </div>

                {report.status === 'open' && (
                  <button
                    type="button"
                    onClick={() => handleResolve(report.id)}
                    disabled={resolvingId !== null}
                    className="shrink-0 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    {resolvingId === report.id
                      ? 'Resolving…'
                      : 'Mark resolved'}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
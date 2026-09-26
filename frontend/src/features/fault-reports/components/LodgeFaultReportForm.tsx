'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { lodgeFaultReport } from '@/features/fault-reports/actions/fault-reports.actions'
import {
  FAULT_REPORT_CATEGORIES,
  lodgeFaultReportSchema,
  type LodgeFaultReportInput,
} from '@/features/fault-reports/validation'

const categoryLabels: Record<
  (typeof FAULT_REPORT_CATEGORIES)[number],
  string
> = {
  connection: 'Connection',
  speed: 'Speed',
  equipment: 'Equipment',
  billing: 'Billing',
}

export function LodgeFaultReportForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LodgeFaultReportInput>({
    resolver: zodResolver(lodgeFaultReportSchema),
    defaultValues: {
      title: '',
      category: 'connection',
      description: '',
    },
  })

  const onSubmit = async (values: LodgeFaultReportInput) => {
    const result = await lodgeFaultReport(values)

    if (!result.success) {
      toast.error(result.error ?? 'Failed to lodge fault report')
      return
    }

    toast.success('Fault report lodged')
    reset()
  }

  return (
    <section aria-labelledby="lodge-fault-heading">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
      >
        <div>
          <h2
            id="lodge-fault-heading"
            className="text-lg font-semibold"
          >
            Lodge a fault
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Tell us what is happening and we will record it for follow-up.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="fault-title"
              className="text-sm font-medium"
            >
              Title
            </label>

            <input
              id="fault-title"
              type="text"
              minLength={3}
              maxLength={80}
              required
              aria-invalid={!!errors.title}
              aria-describedby={
                errors.title ? 'fault-title-error' : undefined
              }
              className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-zinc-400 focus:ring-2 focus:ring-zinc-500 focus:outline-none aria-invalid:border-red-500 dark:border-zinc-700 dark:bg-zinc-950"
              placeholder="Briefly describe the problem"
              {...register('title')}
            />

            {errors.title && (
              <p
                id="fault-title-error"
                className="text-xs text-red-600"
                role="alert"
              >
                {errors.title.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="fault-category"
              className="text-sm font-medium"
            >
              Category
            </label>

            <select
              id="fault-category"
              required
              aria-invalid={!!errors.category}
              aria-describedby={
                errors.category ? 'fault-category-error' : undefined
              }
              className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-zinc-500 focus:outline-none aria-invalid:border-red-500 dark:border-zinc-700 dark:bg-zinc-950"
              {...register('category')}
            >
              {FAULT_REPORT_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {categoryLabels[category]}
                </option>
              ))}
            </select>

            {errors.category && (
              <p
                id="fault-category-error"
                className="text-xs text-red-600"
                role="alert"
              >
                {errors.category.message}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="fault-description"
            className="text-sm font-medium"
          >
            Description
          </label>

          <textarea
            id="fault-description"
            rows={5}
            minLength={10}
            maxLength={500}
            required
            aria-invalid={!!errors.description}
            aria-describedby={
              errors.description
                ? 'fault-description-error'
                : 'fault-description-help'
            }
            className="block w-full resize-y rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-zinc-400 focus:ring-2 focus:ring-zinc-500 focus:outline-none aria-invalid:border-red-500 dark:border-zinc-700 dark:bg-zinc-950"
            placeholder="Include when it started and what you have already tried"
            {...register('description')}
          />

          {errors.description ? (
            <p
              id="fault-description-error"
              className="text-xs text-red-600"
              role="alert"
            >
              {errors.description.message}
            </p>
          ) : (
            <p
              id="fault-description-help"
              className="text-xs text-zinc-500"
            >
              10–500 characters
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {isSubmitting ? 'Lodging…' : 'Lodge fault'}
        </button>
      </form>
    </section>
  )
}
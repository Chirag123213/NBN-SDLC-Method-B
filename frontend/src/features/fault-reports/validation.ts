import { z } from 'zod'

export const FAULT_REPORT_CATEGORIES = [
  'connection',
  'speed',
  'equipment',
  'billing',
] as const

export const lodgeFaultReportSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(80, 'Title must be at most 80 characters'),
  category: z.enum(FAULT_REPORT_CATEGORIES, {
    errorMap: () => ({ message: 'Choose a valid category' }),
  }),
  description: z
    .string()
    .trim()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must be at most 500 characters'),
})

export const resolveFaultReportSchema = z.string().trim().min(1, 'Fault report ID is required')

export type LodgeFaultReportInput = z.infer<typeof lodgeFaultReportSchema>
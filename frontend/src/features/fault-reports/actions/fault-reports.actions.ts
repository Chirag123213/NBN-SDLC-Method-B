'use server'

import { Timestamp } from 'firebase-admin/firestore'
import { requireAuth } from '@/actions/auth.actions'
import {
  lodgeFaultReportSchema,
  resolveFaultReportSchema,
} from '@/features/fault-reports/validation'
import { adminDb } from '@/lib/firebase/admin'
import type { ActionResult } from '@/types'

export async function lodgeFaultReport(
  input: unknown
): Promise<ActionResult<string>> {
  const session = await requireAuth()

  const parsed = lodgeFaultReportSchema.safeParse(input)

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message ?? 'Invalid input',
    }
  }

  try {
    const ref = await adminDb.collection('faultReports').add({
      ...parsed.data,
      _schemaVersion: 1,
      uid: session.uid,
      status: 'open',
      createdAt: Timestamp.now(),
      deletedAt: null,
    })

    return {
      success: true,
      data: ref.id,
    }
  } catch {
    return {
      success: false,
      error: 'Failed to lodge fault report',
    }
  }
}

type ResolveOutcome =
  | 'resolved'
  | 'already-resolved'
  | 'not-found'
  | 'forbidden'
  | 'invalid'

export async function resolveFaultReport(
  reportId: unknown
): Promise<ActionResult> {
  const session = await requireAuth()

  const parsed = resolveFaultReportSchema.safeParse(reportId)

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message ?? 'Invalid input',
    }
  }

  try {
    const reportRef = adminDb
      .collection('faultReports')
      .doc(parsed.data)

    const outcome = await adminDb.runTransaction<ResolveOutcome>(
      async (transaction) => {
        const snapshot = await transaction.get(reportRef)

        if (!snapshot.exists) {
          return 'not-found'
        }

        const report = snapshot.data()

        if (report?.uid !== session.uid) {
          return 'forbidden'
        }

        if (report.deletedAt !== null) {
          return 'not-found'
        }

        if (report.status === 'resolved') {
          return 'already-resolved'
        }

        if (report.status !== 'open') {
          return 'invalid'
        }

        transaction.update(reportRef, {
          status: 'resolved',
        })

        return 'resolved'
      }
    )

    if (outcome === 'resolved' || outcome === 'already-resolved') {
      return {
        success: true,
      }
    }

    if (outcome === 'forbidden') {
      return {
        success: false,
        error: 'You can only resolve your own fault reports',
      }
    }

    if (outcome === 'not-found') {
      return {
        success: false,
        error: 'Fault report not found',
      }
    }

    return {
      success: false,
      error: 'Fault report cannot be resolved',
    }
  } catch {
    return {
      success: false,
      error: 'Failed to resolve fault report',
    }
  }
}
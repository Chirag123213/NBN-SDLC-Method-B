import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  add: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn(),
  runTransaction: vi.fn(),
  transactionGet: vi.fn(),
  transactionUpdate: vi.fn(),
}))

vi.mock('@/actions/auth.actions', () => ({
  requireAuth: mocks.requireAuth,
}))

vi.mock('@/lib/firebase/admin', () => ({
  adminDb: {
    collection: mocks.collection,
    runTransaction: mocks.runTransaction,
  },
}))

import {
  lodgeFaultReport,
  resolveFaultReport,
} from '@/features/fault-reports/actions/fault-reports.actions'

describe('fault report actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mocks.requireAuth.mockResolvedValue({
      uid: 'owner-uid',
    })

    mocks.add.mockResolvedValue({
      id: 'report-123',
    })

    mocks.doc.mockReturnValue({
      path: 'faultReports/report-123',
    })

    mocks.collection.mockReturnValue({
      add: mocks.add,
      doc: mocks.doc,
    })

    mocks.runTransaction.mockImplementation(async (callback) =>
      callback({
        get: mocks.transactionGet,
        update: mocks.transactionUpdate,
      })
    )
  })

  describe('lodgeFaultReport', () => {
    it.each([
      [
        {
          title: 'No',
          category: 'connection',
          description: 'A valid description',
        },
      ],
      [
        {
          title: 'x'.repeat(81),
          category: 'connection',
          description: 'A valid description',
        },
      ],
      [
        {
          title: 'Valid title',
          category: 'outage',
          description: 'A valid description',
        },
      ],
      [
        {
          title: 'Valid title',
          category: 'speed',
          description: 'Too short',
        },
      ],
      [
        {
          title: 'Valid title',
          category: 'billing',
          description: 'x'.repeat(501),
        },
      ],
    ])('rejects invalid lodge input %#', async (input) => {
      const result = await lodgeFaultReport(input)

      expect(mocks.requireAuth).toHaveBeenCalledOnce()
      expect(result.success).toBe(false)
      expect(mocks.add).not.toHaveBeenCalled()
    })

    it('uses server-controlled ownership and status values', async () => {
      const result = await lodgeFaultReport({
        title: '  Slow evening connection  ',
        category: 'speed',
        description:
          '  Downloads have been slow since this evening.  ',
        uid: 'attacker-controlled',
        status: 'resolved',
        deletedAt: 'attacker-controlled',
      })

      expect(result).toEqual({
        success: true,
        data: 'report-123',
      })

      expect(mocks.add).toHaveBeenCalledWith(
        expect.objectContaining({
          _schemaVersion: 1,
          uid: 'owner-uid',
          title: 'Slow evening connection',
          category: 'speed',
          description:
            'Downloads have been slow since this evening.',
          status: 'open',
          deletedAt: null,
          createdAt: expect.anything(),
        })
      )
    })
  })

  describe('resolveFaultReport', () => {
    it('does not resolve a report owned by another user', async () => {
      mocks.transactionGet.mockResolvedValue({
        exists: true,
        data: () => ({
          uid: 'another-user',
          status: 'open',
          deletedAt: null,
        }),
      })

      const result = await resolveFaultReport('report-123')

      expect(result).toEqual({
        success: false,
        error: 'You can only resolve your own fault reports',
      })

      expect(mocks.transactionUpdate).not.toHaveBeenCalled()
    })
  })
})
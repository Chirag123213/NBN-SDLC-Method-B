'use client'

import { useEffect, useState } from 'react'
import {
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore'
import { getFaultReportsCollection } from '@/lib/firebase/firestore'
import type { FaultReport } from '@/types/firestore'

interface UseFaultReportsResult {
  reports: FaultReport[]
  loading: boolean
  error: Error | null
}

interface FaultReportsSnapshot extends UseFaultReportsResult {
  uid: string | null
}

export function useFaultReports(
  uid: string | undefined
): UseFaultReportsResult {
  const [snapshot, setSnapshot] = useState<FaultReportsSnapshot>({
    uid: null,
    reports: [],
    loading: true,
    error: null,
  })

  useEffect(() => {
    if (!uid) {
      return
    }

    const reportsQuery = query(
      getFaultReportsCollection(),
      where('uid', '==', uid),
      where('deletedAt', '==', null),
      orderBy('createdAt', 'desc')
    )

    return onSnapshot(
      reportsQuery,
      (querySnapshot) => {
        setSnapshot({
          uid,
          reports: querySnapshot.docs.map((document) => ({
            ...document.data(),
            id: document.id,
          })),
          loading: false,
          error: null,
        })
      },
      (snapshotError) => {
        setSnapshot({
          uid,
          reports: [],
          loading: false,
          error: snapshotError,
        })
      }
    )
  }, [uid])

  if (!uid) {
    return {
      reports: [],
      loading: false,
      error: null,
    }
  }

  if (snapshot.uid !== uid) {
    return {
      reports: [],
      loading: true,
      error: null,
    }
  }

  return snapshot
}
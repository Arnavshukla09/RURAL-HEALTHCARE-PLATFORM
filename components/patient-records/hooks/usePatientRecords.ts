"use client"

/**
 * components/patient-records/hooks/usePatientRecords.ts
 *
 * Custom hook managing patient records fetch, pagination, and vitals.
 * Strictly scoped per authenticated userId to prevent cross-account or guest leakage.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Clinical Records Subsystem
 */

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { MedicalRecord } from '../types'

export function usePatientRecords(userId?: string) {
  const isGuestOrUnauth = !userId || userId === "guest"

  const [records, setRecords] = useState<MedicalRecord[]>(() => {
    if (typeof window !== "undefined") {
      // Purge legacy un-scoped test/dev key to prevent any cross-account pollution
      try {
        localStorage.removeItem("rural_health_local_prescriptions")
      } catch {}

      if (isGuestOrUnauth) return []
      try {
        const local = JSON.parse(localStorage.getItem(`rhcp_records_${userId}`) || "[]")
        return Array.isArray(local) ? local : []
      } catch {
        return []
      }
    }
    return []
  })

  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [healthData, setHealthData] = useState<any[]>([])
  const [loading, setLoading] = useState(!isGuestOrUnauth)
  const [error, setError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState('')

  useEffect(() => {
    if (isGuestOrUnauth) {
      setRecords([])
      setHealthData([])
      setLoading(false)
      return
    }

    let isMounted = true

    const safetyTimer = setTimeout(() => {
      if (isMounted) setLoading(false)
    }, 2500)

    const fetchData = async () => {
      try {
        let userScopedLocal: MedicalRecord[] = []
        if (typeof window !== "undefined") {
          try {
            const raw = localStorage.getItem(`rhcp_records_${userId}`)
            if (raw) userScopedLocal = JSON.parse(raw)
          } catch {}
        }

        const res = await fetch('/api/medical-records')
        if (res.ok) {
          const data = await res.json()
          const apiList = Array.isArray(data) ? data : (data.records ?? data.data ?? [])
          const existingIds = new Set(apiList.map((r: any) => r.id))
          const merged = [...apiList, ...userScopedLocal.filter((r: any) => !existingIds.has(r.id))]
          if (isMounted) {
            setRecords(merged.length > 0 ? merged : userScopedLocal)
            setNextCursor(data.nextCursor || null)
          }
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem(`rhcp_records_${userId}`, JSON.stringify(merged.slice(0, 50)))
            } catch {}
          }
        } else if (res.status === 401) {
          // Unauthenticated session on server - do not expose any other records
          if (isMounted) setRecords([])
        } else {
          if (isMounted && userScopedLocal.length > 0) setRecords(userScopedLocal)
        }

        if (userId) {
          try {
            const supabase = createClient()
            const { data: patient } = await supabase
              .from('patients')
              .select('id')
              .eq('user_id', userId)
              .maybeSingle()

            if (patient?.id && isMounted) {
              const { data: vitals } = await supabase
                .from('health_data')
                .select('*')
                .eq('patient_id', patient.id)
                .order('recorded_at', { ascending: false })
              setHealthData(vitals || [])
            }
          } catch (e) {
            console.warn("Vitals non-fatal lookup notice:", e)
          }
        }
      } catch (err) {
        console.warn('Records fetch error:', err)
      } finally {
        clearTimeout(safetyTimer)
        if (isMounted) setLoading(false)
      }
    }

    fetchData()

    return () => {
      isMounted = false
      clearTimeout(safetyTimer)
    }
  }, [saveSuccess, userId, isGuestOrUnauth])

  const handleLoadMoreRecords = async () => {
    if (!nextCursor || loadingMore || isGuestOrUnauth) return
    setLoadingMore(true)
    try {
      const res = await fetch(`/api/medical-records?cursor=${encodeURIComponent(nextCursor)}`)
      if (res.ok) {
        const data = await res.json()
        const list = Array.isArray(data) ? data : (data.records ?? data.data ?? [])
        setRecords(prev => [...prev, ...list])
        setNextCursor(data.nextCursor || null)
      }
    } catch (err) {
      console.error('Failed to load more records:', err)
    } finally {
      setLoadingMore(false)
    }
  }

  const handleDeleteRecord = async (id: string, confirmMsg: string) => {
    if (isGuestOrUnauth) return
    if (!confirm(confirmMsg)) return
    try {
      const res = await fetch(`/api/medical-records?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setRecords(prev => {
          const updated = prev.filter(r => r.id !== id)
          if (typeof window !== "undefined" && userId) {
            try {
              localStorage.setItem(`rhcp_records_${userId}`, JSON.stringify(updated))
            } catch {}
          }
          return updated
        })
      }
    } catch (err) {
      console.error(err)
    }
  }

  return {
    records,
    setRecords,
    nextCursor,
    loadingMore,
    healthData,
    loading,
    error,
    setError,
    saveSuccess,
    setSaveSuccess,
    handleLoadMoreRecords,
    handleDeleteRecord,
  }
}

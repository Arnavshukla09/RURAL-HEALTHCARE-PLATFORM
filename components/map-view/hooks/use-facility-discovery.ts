"use client"

/**
 * components/map-view/hooks/use-facility-discovery.ts
 *
 * Data fetching, geographic calculation, and routing logic for MapView.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Map Subsystem
 */

import { useState, useEffect, useMemo, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { LGD_STATES } from "@/lib/geo/lgd-iphs"
import { REAL_DOCTORS, RealDoctor } from "@/lib/data/real-doctors"
import type { Facility } from "../types"
import { MP_CENTER } from "../types"

interface UseFacilityDiscoveryOptions {
  en: boolean
}

export function useFacilityDiscovery({ en }: UseFacilityDiscoveryOptions) {
  const { toast } = useToast()

  const [center, setCenter] = useState(MP_CENTER)
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [selectedState, setSelectedState] = useState<string>("23")
  const [selectedDistrict, setSelectedDistrict] = useState<string>("2301")
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [loading, setLoading] = useState(false)
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<Facility["type"] | "all">("all")
  const [radiusKm, setRadiusKm] = useState(25)
  const [searchQuery, setSearchQuery] = useState("")
  const [routeData, setRouteData] = useState<{ coords: [number, number][]; distance: number; duration: number } | null>(null)
  const [routingLoading, setRoutingLoading] = useState(false)

  const computeDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return Math.round(6371 * c * 10) / 10
  }

  const fetchFacilities = useCallback(
    async (lat: number, lon: number, type?: string, km?: number) => {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({
          lat: String(lat),
          lon: String(lon),
          radius_km: String(km ?? radiusKm),
        })
        if (type && type !== "all") params.set("type", type)
        const res = await fetch(`/api/facilities/nearby?${params}`)
        if (!res.ok) throw new Error(`API error ${res.status}`)
        const json = await res.json()
        if (json.error) throw new Error(json.error)
        setFacilities(json.facilities ?? [])
      } catch {
        setError(
          en ? "Could not load facilities. Please try again." : "सुविधाएं लोड नहीं हो सकीं। कृपया पुनः प्रयास करें।"
        )
      } finally {
        setLoading(false)
      }
    },
    [en, radiusKm]
  )

  const fetchDistrictPack = useCallback(
    async (distCode: string, stateCodeParam?: string) => {
      setLoading(true)
      setError(null)
      const currentStateCode = stateCodeParam || selectedState
      try {
        const res = await fetch(`/api/facilities/district/${distCode}`)
        if (res.ok) {
          const json = await res.json()
          if (json.facilities && json.facilities.length > 0) {
            const origin = userCoords || center
            const mapped: Facility[] = json.facilities.map((f: any) => {
              const distKm = computeDistanceKm(origin.lat, origin.lng, f.lat, f.lon)
              return {
                id: f.id,
                name: en ? f.nameEn : f.nameHi,
                type:
                  f.tier === "medical_college" || f.tier === "district_hospital"
                    ? "hospital"
                    : f.tier === "phc"
                    ? "health_post"
                    : "clinic",
                address: en ? f.addressEn : f.addressHi,
                phone: f.phone,
                district: f.blockName || distCode,
                distance_km: distKm,
                lat: f.lat,
                lon: f.lon,
                tier: f.tier,
                capabilities: f.capabilities,
              }
            })
            setFacilities(mapped)
            return
          }
        }
        const st = LGD_STATES.find((s) => s.code === currentStateCode)
        const dist = st?.districts.find((d) => d.code === distCode)
        if (dist) {
          fetchFacilities(dist.center.lat, dist.center.lng)
        }
      } catch {
        fetchFacilities(center.lat, center.lng)
      } finally {
        setLoading(false)
      }
    },
    [center, en, fetchFacilities, selectedState, userCoords]
  )

  useEffect(() => {
    fetchDistrictPack("2301", "23")
  }, [fetchDistrictPack])

  const handleDistrictChange = (distCode: string) => {
    setSelectedDistrict(distCode)
    const st = LGD_STATES.find((s) => s.code === selectedState)
    const dist = st?.districts.find((d) => d.code === distCode)
    if (dist) {
      setCenter(dist.center)
    }
    fetchDistrictPack(distCode, selectedState)
  }

  const handleStateChange = (stateCode: string) => {
    setSelectedState(stateCode)
    const st = LGD_STATES.find((s) => s.code === stateCode)
    if (st && st.districts.length > 0) {
      const firstDist = st.districts[0]
      setSelectedDistrict(firstDist.code)
      setCenter(firstDist.center)
      fetchDistrictPack(firstDist.code, stateCode)
    }
  }

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: en ? "Geolocation not supported." : "स्थान सेवा समर्थित नहीं है।", variant: "destructive" })
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setUserCoords(coords)
        setCenter(coords)
        fetchFacilities(coords.lat, coords.lng, filter !== "all" ? filter : undefined, radiusKm)
        setLocating(false)
      },
      () => {
        toast({ title: en ? "Location access denied." : "स्थान की अनुमति अस्वीकृत।", variant: "destructive" })
        setLocating(false)
      },
      { timeout: 10000, maximumAge: 60000 }
    )
  }

  const handleFilterChange = (f: typeof filter) => {
    setFilter(f)
    if (f !== "doctors") {
      fetchFacilities(center.lat, center.lng, f !== "all" ? f : undefined, radiusKm)
    }
  }

  const handleRadiusChange = (km: number) => {
    setRadiusKm(km)
    fetchFacilities(center.lat, center.lng, filter !== "all" && filter !== "doctors" ? filter : undefined, km)
  }

  const doctorFacilities = useMemo<Facility[]>(() => {
    const origin = userCoords || center
    let docs: RealDoctor[] = []

    if (userCoords) {
      docs = REAL_DOCTORS.filter((d) => {
        const dKm = computeDistanceKm(userCoords.lat, userCoords.lng, d.lat, d.lon)
        return dKm <= radiusKm
      })
    } else {
      const distObj = LGD_STATES.find((s) => s.code === selectedState)?.districts.find(
        (d) => d.code === selectedDistrict
      )
      const distName = (distObj?.nameEn || "").toLowerCase()

      const inDist = REAL_DOCTORS.filter(
        (d) =>
          d.stateCode === selectedState && (distName ? d.districtName.toLowerCase().includes(distName) : true)
      )
      const inState = REAL_DOCTORS.filter(
        (d) =>
          d.stateCode === selectedState && (!distName || !d.districtName.toLowerCase().includes(distName))
      )
      docs = [...inDist, ...inState]
    }

    return docs.map((d) => ({
      id: d.id,
      name: d.name,
      type: "doctors" as const,
      address: d.location,
      phone: d.phone,
      district: d.districtName,
      distance_km: computeDistanceKm(origin.lat, origin.lng, d.lat, d.lon),
      lat: d.lat,
      lon: d.lon,
      specialtyName: d.specialtyName,
      doctorQualifications: d.qualifications,
      hospitalAffiliation: d.hospitalAffiliation,
      regNo: d.regNo,
      consultationFee: d.consultationFee,
      opdTimings: d.opdTimings,
      recordType: d.recordType,
      verificationStatus: d.verificationStatus,
      sourceName: d.sourceName,
    }))
  }, [userCoords, center, radiusKm, selectedState, selectedDistrict])

  const combinedFacilities = useMemo<Facility[]>(() => {
    if (filter === "doctors") {
      return doctorFacilities
    }
    if (filter === "all") {
      return [...facilities, ...doctorFacilities]
    }
    return facilities.filter((f) => f.type === filter)
  }, [facilities, doctorFacilities, filter])

  const sorted = useMemo(() => {
    let list = [...combinedFacilities]
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          (f.address && f.address.toLowerCase().includes(q)) ||
          (f.specialtyName && f.specialtyName.toLowerCase().includes(q)) ||
          (f.hospitalAffiliation && f.hospitalAffiliation.toLowerCase().includes(q)) ||
          (f.district && f.district.toLowerCase().includes(q))
      )
    }
    if (userCoords) {
      return list.sort((a, b) => a.distance_km - b.distance_km)
    }
    return list.sort((a, b) => {
      if (a.district === b.district) return a.name.localeCompare(b.name)
      return (a.district || "").localeCompare(b.district || "")
    })
  }, [combinedFacilities, searchQuery, userCoords])

  const top10Ids = useMemo(() => new Set(sorted.slice(0, 10).map((f) => f.id)), [sorted])

  const showRoute = async (destLat: number, destLon: number) => {
    const start = userCoords || center
    if (!start) return
    setRoutingLoading(true)
    try {
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${destLon},${destLat}?overview=full&geometries=geojson`
      )
      const data = await res.json()
      if (data.code === "Ok" && data.routes.length > 0) {
        const route = data.routes[0]
        const coords = route.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]] as [number, number])
        setRouteData({ coords, distance: route.distance, duration: route.duration })
      } else {
        toast({ title: en ? "Could not find route" : "मार्ग नहीं मिला", variant: "destructive" })
      }
    } catch {
      toast({ title: en ? "Error fetching route" : "मार्ग प्राप्त करने में त्रुटि", variant: "destructive" })
    } finally {
      setRoutingLoading(false)
    }
  }

  const counts = useMemo(() => {
    const c: Record<string, number> = {
      all: facilities.length + doctorFacilities.length,
      doctors: doctorFacilities.length,
    }
    facilities.forEach((f) => {
      c[f.type] = (c[f.type] || 0) + 1
    })
    return c
  }, [facilities, doctorFacilities])

  return {
    center,
    setCenter,
    userCoords,
    setUserCoords,
    selectedState,
    selectedDistrict,
    facilities,
    loading,
    locating,
    error,
    filter,
    radiusKm,
    searchQuery,
    setSearchQuery,
    routeData,
    setRouteData,
    routingLoading,
    handleDistrictChange,
    handleStateChange,
    useMyLocation,
    handleFilterChange,
    handleRadiusChange,
    sorted,
    top10Ids,
    showRoute,
    counts,
    fetchFacilities,
  }
}

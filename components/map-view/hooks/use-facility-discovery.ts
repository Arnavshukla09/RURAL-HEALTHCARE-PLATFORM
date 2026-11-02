"use client"

/**
 * components/map-view/hooks/use-facility-discovery.ts
 *
 * Data fetching, geographic calculation, auto-location, and routing logic for MapView.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Map Subsystem
 */

import { useState, useEffect, useMemo, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { LGD_STATES } from "@/lib/geo/lgd-iphs"
import { REAL_DOCTORS, RealDoctor, calculateDistanceKm } from "@/lib/data/real-doctors"
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
  const [routeData, setRouteData] = useState<{
    coords: [number, number][]
    distance: number
    duration: number
    facilityId?: string
    isNoRoute?: boolean
    isDetour?: boolean
    detourRatio?: number
    destLat?: number
    destLon?: number
  } | null>(null)
  const [routingLoading, setRoutingLoading] = useState(false)

  const [routeDistances, setRouteDistances] = useState<Record<string, number>>({})
  const [routeDetours, setRouteDetours] = useState<Record<string, number>>({})
  const [noRouteFacilities, setNoRouteFacilities] = useState<Set<string>>(new Set())

  const fetchFacilities = useCallback(
    async (lat: number, lon: number, type?: string, km?: number) => {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({ lat: String(lat), lon: String(lon), radius_km: String(km ?? radiusKm) })
        if (type && type !== "all") params.set("type", type)
        const res = await fetch(`/api/facilities/nearby?${params}`)
        if (!res.ok) throw new Error(`API error ${res.status}`)
        const json = await res.json()
        if (json.error) throw new Error(json.error)
        setFacilities(json.facilities ?? [])
        setRouteDistances({})
        setRouteDetours({})
        setNoRouteFacilities(new Set())
      } catch {
        setError(en ? "Could not load facilities. Please try again." : "सुविधाएं लोड नहीं हो सकीं। कृपया पुनः प्रयास करें।")
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
            const mapped: Facility[] = json.facilities.map((f: any) => ({
              id: f.id,
              name: en ? f.nameEn : f.nameHi,
              type: f.tier === "medical_college" || f.tier === "district_hospital" ? "hospital" : f.tier === "phc" ? "health_post" : "clinic",
              address: en ? f.addressEn : f.addressHi,
              phone: f.phone,
              district: f.blockName || distCode,
              distance_km: calculateDistanceKm(origin.lat, origin.lng, f.lat, f.lon),
              lat: f.lat,
              lon: f.lon,
              tier: f.tier,
              capabilities: f.capabilities,
            }))
            setFacilities(mapped)
            setRouteDistances({})
            setRouteDetours({})
            setNoRouteFacilities(new Set())
            return
          }
        }
        const st = LGD_STATES.find((s) => s.code === currentStateCode)
        const dist = st?.districts.find((d) => d.code === distCode)
        if (dist) fetchFacilities(dist.center.lat, dist.center.lng)
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
    const dist = LGD_STATES.find((s) => s.code === selectedState)?.districts.find((d) => d.code === distCode)
    if (dist) setCenter(dist.center)
    fetchDistrictPack(distCode, selectedState)
  }

  const handleStateChange = (stateCode: string) => {
    setSelectedState(stateCode)
    const firstDist = LGD_STATES.find((s) => s.code === stateCode)?.districts[0]
    if (firstDist) {
      setSelectedDistrict(firstDist.code)
      setCenter(firstDist.center)
      fetchDistrictPack(firstDist.code, stateCode)
    }
  }

  const requestMyLocation = useCallback(
    (silent = false) => {
      if (typeof window === "undefined" || !navigator.geolocation) {
        if (!silent) toast({ title: en ? "Geolocation not supported." : "स्थान सेवा समर्थित नहीं है।", variant: "destructive" })
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
          if (!silent) toast({ title: en ? "Location access denied." : "स्थान की अनुमति अस्वीकृत।", variant: "destructive" })
          setLocating(false)
        },
        { timeout: 10000, maximumAge: 60000 }
      )
    },
    [en, fetchFacilities, filter, radiusKm, toast]
  )

  // Automatic geolocation: when map is opened, auto-request or pinpoint if permission exists
  useEffect(() => {
    if (typeof window === "undefined" || !navigator.geolocation) return
    if ("permissions" in navigator && navigator.permissions?.query) {
      navigator.permissions
        .query({ name: "geolocation" })
        .then((p) => {
          if (p.state === "granted" || p.state === "prompt") requestMyLocation(true)
        })
        .catch(() => requestMyLocation(true))
    } else {
      requestMyLocation(true)
    }
  }, [requestMyLocation])

  const handleFilterChange = (f: typeof filter) => {
    setFilter(f)
    if (f !== "doctors") fetchFacilities(center.lat, center.lng, f !== "all" ? f : undefined, radiusKm)
  }

  const handleRadiusChange = (km: number) => {
    setRadiusKm(km)
    fetchFacilities(center.lat, center.lng, filter !== "all" && filter !== "doctors" ? filter : undefined, km)
  }

  const doctorFacilities = useMemo<Facility[]>(() => {
    const origin = userCoords || center
    let docs: RealDoctor[] = []
    if (userCoords) {
      docs = REAL_DOCTORS.filter((d) => calculateDistanceKm(userCoords.lat, userCoords.lng, d.lat, d.lon) <= radiusKm)
    } else {
      const distName = (LGD_STATES.find((s) => s.code === selectedState)?.districts.find((d) => d.code === selectedDistrict)?.nameEn || "").toLowerCase()
      const inDist = REAL_DOCTORS.filter((d) => d.stateCode === selectedState && (distName ? d.districtName.toLowerCase().includes(distName) : true))
      const inState = REAL_DOCTORS.filter((d) => d.stateCode === selectedState && (!distName || !d.districtName.toLowerCase().includes(distName)))
      docs = [...inDist, ...inState]
    }

    return docs.map((d) => ({
      id: d.id,
      name: d.name,
      type: "doctors" as const,
      address: d.location,
      phone: d.phone,
      district: d.districtName,
      distance_km: calculateDistanceKm(origin.lat, origin.lng, d.lat, d.lon),
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
    if (filter === "doctors") return doctorFacilities
    if (filter === "all") return [...facilities, ...doctorFacilities]
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
    if (userCoords) return list.sort((a, b) => a.distance_km - b.distance_km)
    return list.sort((a, b) => {
      if (a.district === b.district) return a.name.localeCompare(b.name)
      return (a.district || "").localeCompare(b.district || "")
    })
  }, [combinedFacilities, searchQuery, userCoords])

  const top10Ids = useMemo(() => new Set(sorted.slice(0, 10).map((f) => f.id)), [sorted])

  const showRoute = useCallback(
    async (destLat: number, destLon: number, facilityId?: string) => {
      const start = userCoords || center
      if (!start) return
      setRoutingLoading(true)
      setRouteData(null)
      const straightKm = calculateDistanceKm(start.lat, start.lng, destLat, destLon)
      try {
        const res = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${destLon},${destLat}?overview=full&geometries=geojson`
        )
        const data = await res.json()
        if (data.code === "Ok" && data.routes?.length > 0) {
          const route = data.routes[0]
          const coords = route.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]] as [number, number])
          const roadDistKm = Math.round((route.distance / 1000) * 10) / 10
          const detourRatio = straightKm > 0 ? Math.round((roadDistKm / straightKm) * 10) / 10 : 1
          const isDetour = detourRatio >= 2.2

          setRouteData({ coords, distance: route.distance, duration: route.duration, facilityId, isDetour, detourRatio, destLat, destLon })
          if (facilityId) {
            setRouteDistances((prev) => ({ ...prev, [facilityId]: roadDistKm }))
            if (isDetour) setRouteDetours((prev) => ({ ...prev, [facilityId]: detourRatio }))
          }
        } else {
          // Terrain / river / mountain barrier: no driving road available
          setRouteData({
            coords: [[start.lat, start.lng], [destLat, destLon]],
            distance: straightKm * 1000,
            duration: 0,
            facilityId,
            isNoRoute: true,
            destLat,
            destLon,
          })
          if (facilityId) setNoRouteFacilities((prev) => new Set(prev).add(facilityId))
          toast({
            title: en ? "No direct road connection found" : "सीधा सड़क मार्ग नहीं मिला",
            description: en ? "Terrain/water barrier detected. May require foot trail or ferry." : "नदी/पहाड़ या कच्चा मार्ग हो सकता है।",
          })
        }
      } catch {
        toast({ title: en ? "Error fetching route" : "मार्ग प्राप्त करने में त्रुटि", variant: "destructive" })
      } finally {
        setRoutingLoading(false)
      }
    },
    [center, en, toast, userCoords]
  )

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: facilities.length + doctorFacilities.length, doctors: doctorFacilities.length }
    facilities.forEach((f) => { c[f.type] = (c[f.type] || 0) + 1 })
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
    routeDistances,
    routeDetours,
    noRouteFacilities,
    handleDistrictChange,
    handleStateChange,
    useMyLocation: requestMyLocation,
    handleFilterChange,
    handleRadiusChange,
    sorted,
    top10Ids,
    showRoute,
    counts,
    fetchFacilities,
  }
}

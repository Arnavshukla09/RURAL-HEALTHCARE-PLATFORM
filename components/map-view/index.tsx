"use client"

/**
 * components/map-view/index.tsx
 *
 * National Healthcare Facility Discovery — interactive map and facility listings.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Map Subsystem
 */

import { useEffect, useState, useMemo } from "react"
import "leaflet/dist/leaflet.css"
import { Button } from "@/components/ui/button"
import { Loader2, Star } from "lucide-react"
import { LGD_STATES } from "@/lib/geo/lgd-iphs"
import type { MapViewProps } from "./types"
import { TYPE_CONFIG } from "./types"
import {
  LeafletMap,
  makeIcon,
  TileLayer,
  Marker,
  Popup,
  Circle,
  Polyline,
} from "./parts/LeafletMap"
import { FacilityCard } from "./parts/FacilityCard"
import { FacilityPopupContent } from "./parts/FacilityPopupContent"
import { FacilityMapControls } from "./parts/FacilityMapControls"
import { FacilityListPagination } from "./parts/FacilityListPagination"
import { useFacilityDiscovery } from "./hooks/use-facility-discovery"

export function MapView({ language }: MapViewProps) {
  const en = language === "en"
  const [leafletReady, setLeafletReady] = useState(false)
  const [isMapExpanded, setIsMapExpanded] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 10

  const {
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
  } = useFacilityDiscovery({ en })

  useEffect(() => {
    setLeafletReady(true)
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [filter, searchQuery, selectedDistrict, selectedState, userCoords])

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const paginatedFacilities = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return sorted.slice(start, start + PAGE_SIZE)
  }, [sorted, currentPage])

  const stateOptions = useMemo(() => {
    return LGD_STATES.map((s) => ({
      code: s.code,
      nameEn: s.nameEn,
      nameHi: s.nameHi,
    }))
  }, [])

  const districtOptions = useMemo(() => {
    const st = LGD_STATES.find((s) => s.code === selectedState)
    return (st?.districts || []).map((d) => ({
      code: d.code,
      nameEn: d.nameEn,
      nameHi: d.nameHi,
    }))
  }, [selectedState])

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4">
      <FacilityMapControls
        en={en}
        selectedState={selectedState}
        selectedDistrict={selectedDistrict}
        stateOptions={stateOptions}
        districtOptions={districtOptions}
        onStateChange={handleStateChange}
        onDistrictChange={handleDistrictChange}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onUseMyLocation={useMyLocation}
        locating={locating}
        filter={filter}
        onFilterChange={handleFilterChange}
        counts={counts}
        radiusKm={radiusKm}
        onRadiusChange={handleRadiusChange}
        facilitiesCount={sorted.length}
        isMapExpanded={isMapExpanded}
        setIsMapExpanded={setIsMapExpanded}
      />

      {/* Map with isolated stacking context */}
      <div
        className="rounded-xl overflow-hidden border shadow-xs relative z-0 isolate transition-all duration-300"
        style={{ height: isMapExpanded ? 460 : 260 }}
      >
        {routeData && (
          <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-lg z-[1000] border text-sm">
            <p className="font-bold text-blue-700">{en ? "Route Info" : "मार्ग की जानकारी"}</p>
            <p className="mt-1">
              <strong>{en ? "Distance:" : "दूरी:"}</strong> {(routeData.distance / 1000).toFixed(1)} km
            </p>
            <p>
              <strong>{en ? "ETA:" : "अनुमानित समय:"}</strong> {Math.ceil(routeData.duration / 60)}{" "}
              {en ? "mins" : "मिनट"}
            </p>
            <Button size="sm" variant="outline" className="mt-2 h-7 text-xs w-full" onClick={() => setRouteData(null)}>
              {en ? "Clear Route" : "मार्ग हटाएं"}
            </Button>
          </div>
        )}
        {leafletReady && (
          <LeafletMap center={[center.lat, center.lng]} zoom={userCoords ? 13 : 11}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              subdomains={["a", "b", "c"]}
              maxZoom={19}
            />

            {userCoords && (
              <>
                <Marker
                  position={[userCoords.lat, userCoords.lng]}
                  icon={makeIcon("", false, true) as any}
                  draggable={true}
                  eventHandlers={{
                    dragend: (e) => {
                      const marker = e.target
                      const position = marker.getLatLng()
                      const newCoords = { lat: position.lat, lng: position.lng }
                      setUserCoords(newCoords)
                      setCenter(newCoords)
                      fetchFacilities(newCoords.lat, newCoords.lng, filter !== "all" ? filter : undefined, radiusKm)
                    },
                  }}
                >
                  <Popup>
                    <p className="font-semibold text-blue-700 mb-1">📍 {en ? "Your Location" : "आपका स्थान"}</p>
                    <p className="text-xs text-gray-500">
                      {en ? "(Drag marker to change location)" : "(स्थान बदलने के लिए मार्कर खींचें)"}
                    </p>
                  </Popup>
                </Marker>
                <Circle
                  center={[userCoords.lat, userCoords.lng]}
                  radius={radiusKm * 1000}
                  pathOptions={{ color: "#1d4ed8", fillOpacity: 0.04, dashArray: "6 4" }}
                />
              </>
            )}

            {routeData && <Polyline positions={routeData.coords} color="#3b82f6" weight={5} opacity={0.7} />}

            {sorted.slice(0, 50).map((f) => {
              const cfg = TYPE_CONFIG[f.type] ?? TYPE_CONFIG.clinic
              const isTop = top10Ids.has(f.id)
              return (
                <Marker
                  key={f.id}
                  position={[f.lat, f.lon]}
                  icon={makeIcon(cfg.markerColor, isTop) as any}
                  zIndexOffset={isTop ? 1000 : 0}
                >
                  <Popup minWidth={220}>
                    <FacilityPopupContent
                      facility={f}
                      userCoords={userCoords}
                      isTop={isTop}
                      en={en}
                      routingLoading={routingLoading}
                      onShowRoute={showRoute}
                    />
                  </Popup>
                </Marker>
              )
            })}
          </LeafletMap>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 text-gray-400 text-sm py-1">
          <Loader2 className="h-4 w-4 animate-spin" />
          {en ? "Fetching healthcare facilities & doctors..." : "स्वास्थ्य सुविधाएं एवं डॉक्टर खोजे जा रहे हैं..."}
        </div>
      )}
      {error && <p className="text-red-500 text-sm text-center">{error}</p>}

      {/* Facilities & Doctors List */}
      {sorted.length > 0 && (
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="font-bold text-sm sm:base flex items-center gap-2 text-gray-900">
              <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
              <span>
                {filter === "doctors"
                  ? en ? "Clinician & Facility Contact Directory" : "चिकित्सक एवं सुविधा संपर्क निर्देशिका"
                  : en ? "Healthcare Facilities & Doctors" : "स्वास्थ्य केंद्र एवं डॉक्टर"}
              </span>
              <span className="text-xs font-normal text-gray-500">
                ({sorted.length} {en ? "found" : "मिले"})
              </span>
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full font-semibold border border-blue-200">
                {userCoords
                  ? en ? "📍 Sorted by Distance" : "📍 दूरी अनुसार क्रमबद्ध"
                  : en ? "🏛️ LGD District View" : "🏛️ LGD जिला दृश्य"}
              </span>
              <span className="text-xs text-gray-500">
                {en ? `Page ${currentPage} of ${totalPages}` : `पृष्ठ ${currentPage} / ${totalPages}`}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {paginatedFacilities.map((f, idx) => (
              <FacilityCard
                key={f.id}
                facility={f}
                itemIndex={(currentPage - 1) * PAGE_SIZE + idx + 1}
                userCoords={userCoords}
                en={en}
                routingLoading={routingLoading}
                onShowRoute={showRoute}
              />
            ))}
          </div>

          <FacilityListPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={sorted.length}
            pageSize={PAGE_SIZE}
            en={en}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {!loading && facilities.length === 0 && !error && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-sm">
            {en
              ? "No facilities found. Try increasing the radius or use your GPS location."
              : "कोई सुविधा नहीं मिली। दूरी बढ़ाएं या GPS का उपयोग करें।"}
          </p>
        </div>
      )}

      <p className="text-xs text-center text-gray-400 pb-2">
        {en
          ? "Data: OpenStreetMap contributors · 100% free, no API key"
          : "डेटा: OpenStreetMap योगदानकर्ता · 100% निःशुल्क"}
      </p>
    </div>
  )
}

export default MapView

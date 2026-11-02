/**
 * components/MapView.tsx
 *
 * Re-export facade for MapView module.
 * Explicitly imports from "./map-view/index" to prevent Windows case-insensitive collision.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Map Subsystem
 */

export { default, MapView } from "./map-view/index"
export * from "./map-view/types"

/**
 * components/GovernmentSchemes.tsx
 *
 * Re-export facade for GovernmentSchemes module.
 * Explicitly imports from "./government-schemes/index" to prevent Windows case-insensitive collision.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Schemes Subsystem
 */

export { default, GovernmentSchemes } from "./government-schemes/index"
export * from "./government-schemes/types"

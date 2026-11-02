/**
 * components/ConsultationPortal.tsx
 *
 * Re-export facade for ConsultationPortal module.
 * Explicitly imports from "./consultation-portal/index" to prevent Windows case-insensitive collision.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Consultation Subsystem
 */

export { default, ConsultationPortal } from "./consultation-portal/index"
export * from "./consultation-portal/types"

/**
 * components/emergency/types.ts
 *
 * Types and interfaces for the Emergency Services module.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Emergency Subsystem
 */

export interface EmergencyModuleProps {
  language: string
}

export interface SavedContact {
  id: number
  label: string
  number: string
}

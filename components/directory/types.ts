/**
 * components/directory/types.ts
 *
 * Types and interfaces for the Clinician & Facility Directory module.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Directory Subsystem
 */

export interface DirectoryProps {
  language: string
}

export interface SearchableDropdownProps {
  label: string
  placeholder: string
  searchPlaceholder: string
  selectedCode: string
  options: { code: string; nameEn: string; nameHi?: string }[]
  onSelect: (code: string) => void
  disabled?: boolean
  disabledMessage?: string
  language: string
  allOptionLabel?: string
}

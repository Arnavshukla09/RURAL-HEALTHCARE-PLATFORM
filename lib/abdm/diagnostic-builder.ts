/**
 * lib/abdm/diagnostic-builder.ts
 *
 * FHIR R4 Document Bundle generator for Diagnostic / Laboratory Reports.
 * Modelled after ABDM NRCES StructureDefinitions.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — ABDM / NRCES Interoperability
 */

import type {
  PatientDemographics,
  DiagnosticReportRecord,
} from "./types"

/**
 * Generate an HL7 FHIR R4 Bundle for Diagnostic / Laboratory Reports
 * FHIR R4 structured export modelled on ABDM profiles; not validated against official profiles.
 */
export function generateFhirDiagnosticBundle(
  patient: PatientDemographics,
  report: DiagnosticReportRecord
): Record<string, any> {
  const bundleId = `bundle-diag-${report.id}`
  const timestamp = new Date().toISOString()

  const compositionId = `comp-${report.id}`
  const patientResourceId = `pat-${patient.id}`
  const practitionerResourceId = `pract-${report.id}`
  const organizationResourceId = `org-${report.id}`
  const diagnosticReportId = `diag-rep-${report.id}`

  const entries: any[] = []

  // 1. Composition Resource
  entries.push({
    fullUrl: `urn:uuid:${compositionId}`,
    resource: {
      resourceType: "Composition",
      id: compositionId,
      status: "final",
      type: {
        coding: [
          {
            system: "https://projectndhm.gov.in/document-types",
            code: "DIAG",
            display: "Diagnostic Report",
          },
        ],
        text: "Diagnostic Report",
      },
      subject: {
        reference: `urn:uuid:${patientResourceId}`,
        display: patient.name,
      },
      date: timestamp,
      author: [
        {
          reference: `urn:uuid:${practitionerResourceId}`,
          display: report.doctorName,
        },
      ],
      title: "Diagnostic Investigation Report",
      custodian: {
        reference: `urn:uuid:${organizationResourceId}`,
        display: report.facilityName,
      },
      section: [
        {
          title: "Diagnostic Studies Summary",
          code: {
            coding: [
              {
                system: "http://loinc.org",
                code: "11502-2",
                display: "Laboratory report",
              },
            ],
          },
        },
      ],
    },
  })

  // 2. Patient Resource
  const patientIdentifiers: any[] = []
  if (patient.abhaNumber) {
    patientIdentifiers.push({
      type: {
        coding: [{ system: "http://terminology.hl7.org/CodeSystem/v2-0203", code: "MR", display: "ABHA Number" }],
      },
      system: "https://healthid.ndhm.gov.in",
      value: patient.abhaNumber,
    })
  }
  if (patient.abhaAddress) {
    patientIdentifiers.push({
      type: {
        coding: [{ system: "http://terminology.hl7.org/CodeSystem/v2-0203", code: "MR", display: "ABHA Address" }],
      },
      system: "https://phr.ndhm.gov.in",
      value: patient.abhaAddress,
    })
  }

  entries.push({
    fullUrl: `urn:uuid:${patientResourceId}`,
    resource: {
      resourceType: "Patient",
      id: patientResourceId,
      identifier: patientIdentifiers,
      name: [{ text: patient.name }],
      gender: patient.gender,
      birthDate: patient.birthDate,
      telecom: patient.phone ? [{ system: "phone", value: patient.phone }] : undefined,
      address: [
        {
          district: patient.district,
          state: patient.state,
          country: "India",
        },
      ],
    },
  })

  // 3. Practitioner Resource
  entries.push({
    fullUrl: `urn:uuid:${practitionerResourceId}`,
    resource: {
      resourceType: "Practitioner",
      id: practitionerResourceId,
      identifier: report.doctorRegistrationNumber
        ? [
            {
              system: "https://www.nmc.org.in",
              value: report.doctorRegistrationNumber,
            },
          ]
        : undefined,
      name: [{ text: report.doctorName }],
    },
  })

  // 4. Organization Resource
  entries.push({
    fullUrl: `urn:uuid:${organizationResourceId}`,
    resource: {
      resourceType: "Organization",
      id: organizationResourceId,
      name: report.facilityName,
    },
  })

  const observationReferences: Array<{ reference: string; display: string }> = []

  // 5. Observation Resources
  const obsList = report.observations || []
  obsList.forEach((obs, idx) => {
    const obsId = `obs-${report.id}-${idx + 1}`
    const obsUrn = `urn:uuid:${obsId}`
    observationReferences.push({
      reference: obsUrn,
      display: obs.display,
    })

    const isNumeric = typeof obs.value === "number"
    const obsResource: Record<string, any> = {
      resourceType: "Observation",
      id: obsId,
      status: "final",
      code: {
        coding: [
          {
            system: "http://loinc.org",
            code: obs.code,
            display: obs.display,
          },
        ],
        text: obs.display,
      },
      subject: {
        reference: `urn:uuid:${patientResourceId}`,
      },
      effectiveDateTime: report.date,
      performer: [
        {
          reference: `urn:uuid:${practitionerResourceId}`,
        },
      ],
    }

    if (isNumeric) {
      obsResource.valueQuantity = {
        value: obs.value,
        unit: obs.unit || "",
        system: "http://unitsofmeasure.org",
      }
      if (obs.referenceRangeLow !== undefined || obs.referenceRangeHigh !== undefined) {
        obsResource.referenceRange = [
          {
            low: obs.referenceRangeLow !== undefined ? { value: obs.referenceRangeLow, unit: obs.unit } : undefined,
            high: obs.referenceRangeHigh !== undefined ? { value: obs.referenceRangeHigh, unit: obs.unit } : undefined,
          },
        ]
      }
    } else {
      obsResource.valueString = String(obs.value)
    }

    if (obs.interpretation) {
      obsResource.interpretation = [
        {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation",
              code: obs.interpretation,
            },
          ],
        },
      ]
    }

    entries.push({
      fullUrl: obsUrn,
      resource: obsResource,
    })
  })

  // 6. DiagnosticReport Resource
  entries.push({
    fullUrl: `urn:uuid:${diagnosticReportId}`,
    resource: {
      resourceType: "DiagnosticReport",
      id: diagnosticReportId,
      status: "final",
      category: [
        {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/v2-0074",
              code: report.category === "RAD" ? "RAD" : "LAB",
              display: report.category === "RAD" ? "Radiology" : "Laboratory",
            },
          ],
        },
      ],
      code: {
        coding: [
          {
            system: "http://loinc.org",
            code: report.category === "RAD" ? "18748-4" : "11502-2",
            display: report.category === "RAD" ? "Diagnostic Imaging Report" : "Laboratory report",
          },
        ],
      },
      subject: {
        reference: `urn:uuid:${patientResourceId}`,
      },
      effectiveDateTime: report.date,
      issued: timestamp,
      performer: [
        {
          reference: `urn:uuid:${practitionerResourceId}`,
        },
      ],
      result: observationReferences.length > 0 ? observationReferences : undefined,
      conclusion: report.conclusion,
    },
  })

  return {
    resourceType: "Bundle",
    id: bundleId,
    meta: {
      versionId: "1",
      lastUpdated: timestamp,
      profile: ["https://nrces.in/ndhm/fhir/r4/StructureDefinition/DocumentBundle"],
    },
    identifier: {
      system: "https://ruralhealth.gov.in/bundles",
      value: bundleId,
    },
    type: "document",
    timestamp,
    entry: entries,
  }
}

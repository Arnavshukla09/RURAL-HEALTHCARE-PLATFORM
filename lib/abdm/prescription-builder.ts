/**
 * lib/abdm/prescription-builder.ts
 *
 * FHIR R4 Document Bundle generator for Prescriptions.
 * Modelled after ABDM NRCES StructureDefinitions.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — ABDM / NRCES Interoperability
 */

import type {
  PatientDemographics,
  PrescriptionRecord,
} from "./types"

/**
 * Generate an HL7 FHIR R4 Bundle for an Electronic Prescription (OPConsultation)
 * ABDM Milestone 2 (M2) compliant structure.
 */
export function generateFhirPrescriptionBundle(
  patient: PatientDemographics,
  prescription: PrescriptionRecord
): Record<string, any> {
  const bundleId = `bundle-rx-${prescription.id}`
  const timestamp = new Date().toISOString()

  const compositionId = `comp-${prescription.id}`
  const patientResourceId = `pat-${patient.id}`
  const practitionerResourceId = `pract-${prescription.id}`
  const organizationResourceId = `org-${prescription.id}`

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
            code: "PRE",
            display: "Prescription",
          },
        ],
        text: "Prescription",
      },
      subject: {
        reference: `urn:uuid:${patientResourceId}`,
        display: patient.name,
      },
      date: timestamp,
      author: [
        {
          reference: `urn:uuid:${practitionerResourceId}`,
          display: prescription.doctorName,
        },
      ],
      title: "Prescription Record",
      custodian: {
        reference: `urn:uuid:${organizationResourceId}`,
        display: prescription.facilityName,
      },
      section: [
        {
          title: "OPD Prescription",
          code: {
            coding: [
              {
                system: "http://loinc.org",
                code: "57833-6",
                display: "Prescription for medication",
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
      identifier: prescription.doctorRegistrationNumber
        ? [
            {
              system: "https://www.nmc.org.in",
              value: prescription.doctorRegistrationNumber,
            },
          ]
        : undefined,
      name: [{ text: prescription.doctorName }],
    },
  })

  // 4. Organization Resource
  entries.push({
    fullUrl: `urn:uuid:${organizationResourceId}`,
    resource: {
      resourceType: "Organization",
      id: organizationResourceId,
      name: prescription.facilityName,
    },
  })

  // 5. MedicationRequest Resources
  prescription.medications.forEach((med, idx) => {
    const medReqId = `med-req-${prescription.id}-${idx + 1}`
    entries.push({
      fullUrl: `urn:uuid:${medReqId}`,
      resource: {
        resourceType: "MedicationRequest",
        id: medReqId,
        status: "active",
        intent: "order",
        medicationCodeableConcept: {
          text: med.medicineName,
        },
        subject: {
          reference: `urn:uuid:${patientResourceId}`,
        },
        authoredOn: timestamp,
        requester: {
          reference: `urn:uuid:${practitionerResourceId}`,
        },
        dosageInstruction: [
          {
            text: `${med.dosage} - ${med.frequency} for ${med.duration}. ${med.instructions || ""}`.trim(),
          },
        ],
      },
    })
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

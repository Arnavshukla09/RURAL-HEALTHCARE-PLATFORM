/**
 * lib/abdm/encounter-builder.ts
 *
 * FHIR R4 Document Bundle generator for Health Camp & OPD Encounters.
 * Modelled after ABDM NRCES StructureDefinitions.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — ABDM / NRCES Interoperability
 */

import type {
  PatientDemographics,
  EncounterRecord,
  EncounterVitals,
} from "./types"

/**
 * Generate an HL7 FHIR R4 Bundle for Health Camp & OPD Encounters
 * ABDM Milestone 2 (M2) compliant structure.
 */
export function generateFhirEncounterBundle(
  patient: PatientDemographics,
  encounter: EncounterRecord
): Record<string, any> {
  const bundleId = `bundle-enc-${encounter.id}`
  const timestamp = new Date().toISOString()

  const compositionId = `comp-${encounter.id}`
  const patientResourceId = `pat-${patient.id}`
  const practitionerResourceId = `pract-${encounter.id}`
  const organizationResourceId = `org-${encounter.id}`
  const encounterResourceId = `enc-${encounter.id}`

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
            code: "ENC",
            display: "Encounter Record",
          },
        ],
        text: "Encounter Record",
      },
      subject: {
        reference: `urn:uuid:${patientResourceId}`,
        display: patient.name,
      },
      date: timestamp,
      author: [
        {
          reference: `urn:uuid:${practitionerResourceId}`,
          display: encounter.doctorName,
        },
      ],
      title: "Clinical Encounter Record",
      custodian: {
        reference: `urn:uuid:${organizationResourceId}`,
        display: encounter.facilityName,
      },
      section: [
        {
          title: "Encounter & Vitals Summary",
          code: {
            coding: [
              {
                system: "http://loinc.org",
                code: "34109-9",
                display: "Note",
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
      identifier: encounter.doctorRegistrationNumber
        ? [
            {
              system: "https://www.nmc.org.in",
              value: encounter.doctorRegistrationNumber,
            },
          ]
        : undefined,
      name: [{ text: encounter.doctorName }],
    },
  })

  // 4. Organization Resource
  entries.push({
    fullUrl: `urn:uuid:${organizationResourceId}`,
    resource: {
      resourceType: "Organization",
      id: organizationResourceId,
      name: encounter.facilityName,
    },
  })

  // 5. Encounter Resource
  entries.push({
    fullUrl: `urn:uuid:${encounterResourceId}`,
    resource: {
      resourceType: "Encounter",
      id: encounterResourceId,
      status: "finished",
      class: {
        system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
        code: "AMB",
        display: "ambulatory",
      },
      subject: {
        reference: `urn:uuid:${patientResourceId}`,
      },
      participant: [
        {
          individual: {
            reference: `urn:uuid:${practitionerResourceId}`,
          },
        },
      ],
      period: {
        start: encounter.date,
      },
      reasonCode: [
        {
          text: encounter.reasonForVisit,
        },
      ],
      serviceType: {
        text: encounter.serviceType,
      },
    },
  })

  // 6. Optional Vital Signs Observations
  if (encounter.vitals) {
    const vitalsMap: Array<{ key: keyof EncounterVitals; loinc: string; display: string; unit: string }> = [
      { key: "systolicBp", loinc: "8480-6", display: "Systolic blood pressure", unit: "mmHg" },
      { key: "diastolicBp", loinc: "8462-4", display: "Diastolic blood pressure", unit: "mmHg" },
      { key: "heartRate", loinc: "8867-4", display: "Heart rate", unit: "/min" },
      { key: "temperatureFahrenheit", loinc: "8310-5", display: "Body temperature", unit: "degF" },
      { key: "respiratoryRate", loinc: "9279-1", display: "Respiratory rate", unit: "/min" },
      { key: "spo2Percentage", loinc: "2708-6", display: "Oxygen saturation in Arterial blood", unit: "%" },
    ]

    vitalsMap.forEach((v) => {
      const val = encounter.vitals?.[v.key]
      if (val !== undefined) {
        const vitId = `obs-vital-${encounter.id}-${v.key}`
        entries.push({
          fullUrl: `urn:uuid:${vitId}`,
          resource: {
            resourceType: "Observation",
            id: vitId,
            status: "final",
            category: [
              {
                coding: [
                  {
                    system: "http://terminology.hl7.org/CodeSystem/observation-category",
                    code: "vital-signs",
                    display: "Vital Signs",
                  },
                ],
              },
            ],
            code: {
              coding: [
                {
                  system: "http://loinc.org",
                  code: v.loinc,
                  display: v.display,
                },
              ],
              text: v.display,
            },
            subject: {
              reference: `urn:uuid:${patientResourceId}`,
            },
            effectiveDateTime: encounter.date,
            valueQuantity: {
              value: val,
              unit: v.unit,
              system: "http://unitsofmeasure.org",
            },
          },
        })
      }
    })
  }

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

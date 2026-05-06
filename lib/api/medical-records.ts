export async function fetchMedicalRecords(patientId?: string) {
  const url = new URL("/api/medical-records", window.location.origin)
  if (patientId) url.searchParams.append("patientId", patientId)

  const response = await fetch(url)
  if (!response.ok) throw new Error("Failed to fetch medical records")
  return response.json()
}

export async function createMedicalRecord(recordData: any) {
  const response = await fetch("/api/medical-records", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(recordData),
  })
  if (!response.ok) throw new Error("Failed to create medical record")
  return response.json()
}

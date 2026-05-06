export async function fetchHealthData(dataType?: string) {
  const url = new URL("/api/health-data", window.location.origin)
  if (dataType) url.searchParams.append("dataType", dataType)

  const response = await fetch(url)
  if (!response.ok) throw new Error("Failed to fetch health data")
  return response.json()
}

export async function recordHealthData(healthData: any) {
  const response = await fetch("/api/health-data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(healthData),
  })
  if (!response.ok) throw new Error("Failed to record health data")
  return response.json()
}

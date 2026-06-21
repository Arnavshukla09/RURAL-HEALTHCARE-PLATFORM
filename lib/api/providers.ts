export async function fetchProviders(specialization?: string) {
  const url = new URL("/api/providers", window.location.origin)
  if (specialization) url.searchParams.append("specialization", specialization)

  const response = await fetch(url)
  if (!response.ok) throw new Error("Failed to fetch providers")
  return response.json()
}

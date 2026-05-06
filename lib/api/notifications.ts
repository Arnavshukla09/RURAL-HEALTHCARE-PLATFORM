export async function fetchNotifications(unreadOnly = false) {
  const url = new URL("/api/notifications", window.location.origin)
  if (unreadOnly) url.searchParams.append("unreadOnly", "true")

  const response = await fetch(url)
  if (!response.ok) throw new Error("Failed to fetch notifications")
  return response.json()
}

export async function markNotificationAsRead(notificationId: string) {
  const response = await fetch("/api/notifications", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ notificationId, read: true }),
  })
  if (!response.ok) throw new Error("Failed to update notification")
  return response.json()
}

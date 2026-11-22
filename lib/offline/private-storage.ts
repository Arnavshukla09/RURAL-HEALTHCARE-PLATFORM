export const PRIVATE_DATABASES = ["rhcp_offline_db", "ruralhealth_ai", "ruralhealth_blackbox_db", "rural-healthcare-db"]
const PRIVATE_KEYS = new Set([
  "rhcp_user_profile", "rhcp_offline_operations", "rhcp_patient_clinical_pretext", "rhcp_assistant_session",
  "rural_health_local_prescriptions", "rural_health_local_notifications", "rural_health_booked_slots",
  "rural_health_doctor_claims", "rural_health_claimed_doctor", "ruralhealth_emergency_vault_v1",
])

export function isPrivateStorageKey(key: string): boolean {
  return PRIVATE_KEYS.has(key) || key.startsWith("rhcp_records_") || key.startsWith("rhcp_patient_") || key.startsWith("rhcp_assistant_session_") || key.startsWith("rhcp_assistant_conversation_")
}

export function clearPrivateStorage(storage: Storage): void {
  const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index)).filter((key): key is string => !!key)
  for (const key of keys) if (isPrivateStorageKey(key)) storage.removeItem(key)
}

/** Clear first, then delete. Blocked deletion cannot leave readable clinical object-store data. */
export async function erasePrivateDatabase(name: string): Promise<void> {
  if (typeof indexedDB === "undefined") return
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.open(name)
    request.onerror = () => reject(request.error || new Error("Private database could not be opened"))
    request.onsuccess = () => {
      const db = request.result
      const stores = Array.from(db.objectStoreNames)
      const remove = () => {
        db.close()
        const deletion = indexedDB.deleteDatabase(name)
        deletion.onsuccess = () => resolve()
        // All stores have already been erased, even if another tab retains a connection.
        deletion.onblocked = () => resolve()
        deletion.onerror = () => reject(deletion.error || new Error("Private database deletion failed"))
      }
      if (!stores.length) { remove(); return }
      const transaction = db.transaction(stores, "readwrite")
      for (const store of stores) transaction.objectStore(store).clear()
      transaction.oncomplete = remove
      transaction.onerror = () => { db.close(); reject(transaction.error || new Error("Private data erasure failed")) }
      transaction.onabort = () => { db.close(); reject(transaction.error || new Error("Private data erasure aborted")) }
    }
  })
}

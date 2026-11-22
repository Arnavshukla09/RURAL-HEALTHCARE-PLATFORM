/** Filesystem iteration order differs between Windows and Linux. IDs are identity. */
export function sameVoiceRegistrations(recorded, actual) {
  const keys = Object.keys(recorded).sort()
  if (JSON.stringify(keys) !== JSON.stringify(Object.keys(actual).sort())) return false
  const properties = entry => Object.keys(entry).filter(key => key !== 'line').sort().map(key => [key, entry[key]])
  return keys.every(key => JSON.stringify(properties(recorded[key])) === JSON.stringify(properties(actual[key])))
}

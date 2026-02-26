export const normalizeSeconds = (val) => {
  const n = Number(val)
  if (!Number.isFinite(n)) return null
  return Math.max(Math.floor(n), 0)
}

export const computeRemainingSeconds = (data) => {
  const direct = normalizeSeconds(data?.payRemainingSeconds)
  if (direct !== null) return direct
  const deadline = Number(data?.payDeadlineTime || 0)
  if (deadline > 0) return Math.max(Math.floor((deadline - Date.now()) / 1000), 0)
  return null
}

export const formatSecondsAsClock = (seconds) => {
  const safe = Math.max(Number(seconds || 0), 0)
  const m = Math.floor(safe / 60)
  const s = safe % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

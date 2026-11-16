// Dates as the household sees them: local calendar days (YYYY-MM-DD), so a note ends at local midnight.
import { onScopeDispose, ref } from 'vue'

export function localDay(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Today, kept current: the wall tablet stays open over midnight. */
export function useToday() {
  const today = ref(localDay())
  const timer = setInterval(() => (today.value = localDay()), 60_000)
  onScopeDispose(() => clearInterval(timer))
  return today
}

/** "14:05" */
export function time(iso: string): string {
  return new Date(iso).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
}

/** "2026-11-18" -> "śr 18.11" */
export function shortDay(day: string): string {
  return new Date(`${day}T00:00`).toLocaleDateString('pl-PL', { weekday: 'short', day: '2-digit', month: '2-digit' })
}

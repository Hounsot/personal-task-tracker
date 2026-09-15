type Goal = 'registration_started' | 'registration_completed' | 'ai_assistant_opened' | 'task_created' | 'task_completed'
type EventParams = Record<string, string | number | boolean>

declare global {
  interface Window {
    ym?: ((counterId: number, method: string, ...args: unknown[]) => void) & { a?: unknown[][]; l?: number }
  }
}

const counterId = Number(import.meta.env.VITE_YANDEX_METRIKA_ID)
const consentKey = 'focus.analytics-consent'
const timerPrefix = 'focus.task-work-started.'
let enabled = false
type MetrikaFunction = NonNullable<Window['ym']>

export function analyticsConsent(): 'accepted' | 'rejected' | null {
  try {
    const value = localStorage.getItem(consentKey)
    return value === 'accepted' || value === 'rejected' ? value : null
  } catch { return null }
}

export function setAnalyticsConsent(value: 'accepted' | 'rejected') {
  try { localStorage.setItem(consentKey, value) } catch { /* Storage may be blocked. */ }
  if (value === 'accepted') enableAnalytics()
}

export function enableAnalytics() {
  if (enabled || !Number.isInteger(counterId) || counterId <= 0) return
  enabled = true
  const queued = ((...args: Parameters<MetrikaFunction>) => { queued.a = (queued.a || []).concat([args]) }) as MetrikaFunction
  queued.l = Date.now()
  window.ym = queued
  const tag = document.createElement('script')
  tag.async = true
  tag.src = `https://mc.yandex.ru/metrika/tag.js?id=${counterId}`
  document.head.append(tag)
  queued(counterId, 'init', { defer: true, clickmap: true, trackLinks: true, accurateTrackBounce: true })
  queued(counterId, 'hit', `${location.pathname}${location.search}`)
}

export function trackEvent(goal: Goal, params: EventParams = {}) {
  if (!enabled || !window.ym) return
  window.ym(counterId, 'reachGoal', goal, params)
}

export function markTaskWorkStarted(taskId: string) {
  try {
    const key = `${timerPrefix}${taskId}`
    if (!localStorage.getItem(key)) localStorage.setItem(key, new Date().toISOString())
  } catch { /* The metric can fall back to task creation time. */ }
}

export function timeToCompleteSeconds(taskId: string, createdAt: string) {
  let startedAt = createdAt
  try { startedAt = localStorage.getItem(`${timerPrefix}${taskId}`) || createdAt } catch { /* no-op */ }
  const seconds = Math.max(0, Math.round((Date.now() - Date.parse(startedAt)) / 1000))
  try { localStorage.removeItem(`${timerPrefix}${taskId}`) } catch { /* no-op */ }
  return seconds
}

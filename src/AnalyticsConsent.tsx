import { useEffect, useState } from 'react'
import { analyticsConsent, enableAnalytics, setAnalyticsConsent } from './analytics'

export function AnalyticsConsent() {
  const [choice, setChoice] = useState(() => analyticsConsent())
  useEffect(() => { if (choice === 'accepted') enableAnalytics() }, [choice])
  if (choice) return null
  const decide = (value: 'accepted' | 'rejected') => { setAnalyticsConsent(value); setChoice(value) }
  return <aside className="analytics-consent" role="dialog" aria-label="Настройка аналитики">
    <p>Мы используем Яндекс.Метрику, чтобы понимать путь в продукте: регистрацию, создание и завершение задач, открытие ИИ-ассистента. Названия и описания задач не передаются.</p>
    <div><button className="auth-switch" onClick={() => decide('rejected')}>Только необходимые</button><button className="consent-accept" onClick={() => decide('accepted')}>Разрешить аналитику</button></div>
  </aside>
}

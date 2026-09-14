import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './api'
export function Auth({ children }: { children: (userId: string) => ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [register, setRegister] = useState(false)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  useEffect(() => {
    if (!supabase) return
    const { data } = supabase.auth.onAuthStateChange((_event, current) => { setSession(current); setReady(true) })
    return () => data.subscription.unsubscribe()
  }, [])
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!supabase || pending) return
    setPending(true); setMessage('')
    try {
      const { error } = register
        ? await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: new URL(import.meta.env.BASE_URL, location.href).href } })
        : await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (error) throw error
      if (register) setMessage('Проверьте почту: если требуется подтверждение, перейдите по ссылке в письме и войдите.')
    } catch { setMessage('Не удалось войти или создать аккаунт. Проверьте почту, пароль и соединение; для нового аккаунта подтвердите почту.') }
    finally { setPending(false) }
  }
  if (!supabase) return <main className="auth-page"><section className="auth-card"><h1>Focus</h1><p>Подключение к облаку ещё не настроено. Попробуйте открыть приложение позже.</p></section></main>
  if (!ready) return <main className="auth-page"><p role="status">Восстанавливаем вход…</p></main>
  if (session) return children(session.user.id)
  return <main className="auth-page"><form className="auth-card" onSubmit={submit}><h1>Focus</h1><p>Ваши задачи на всех устройствах</p>
    <label className="field"><span>ПОЧТА</span><input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} /></label>
    <label className="field"><span>ПАРОЛЬ</span><input type="password" autoComplete={register ? 'new-password' : 'current-password'} minLength={8} required value={password} onChange={e => setPassword(e.target.value)} /></label>
    {message && <p role="status">{message}</p>}
    <button className="primary-button" disabled={pending}>{pending ? 'Подождите…' : register ? 'Создать аккаунт' : 'Войти'}</button>
    <button className="auth-switch" type="button" disabled={pending} onClick={() => { setRegister(!register); setMessage('') }}>{register ? 'Уже есть аккаунт? Войти' : 'Создать аккаунт'}</button>
  </form></main>
}

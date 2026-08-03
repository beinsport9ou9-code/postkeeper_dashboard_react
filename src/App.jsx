import React, { useEffect, useState } from 'react'
import { Check, Clock3, Globe2, LogOut, RefreshCw, ShieldCheck, UserRound, X } from 'lucide-react'
import PostKeeperLibrary from './PostKeeperLibrary.jsx'
import { isConfigured, supabase } from './supabase.js'

const copy = {
  en: {
    title: 'Your saved knowledge, organized.', login: 'Sign in', register: 'Create account',
    email: 'Email', password: 'Password', username: 'Username', name: 'Full name',
    submitLogin: 'Sign in', submitRegister: 'Request account', noAccount: 'Create an account',
    hasAccount: 'I already have an account', pending: 'Your account is awaiting approval.',
    pendingBody: 'You will be able to use the dashboard and Telegram bot after the owner approves your request.',
    rejected: 'Your account request was rejected.', rejectedBody: 'The owner can still review and approve it later.',
    signOut: 'Sign out', admin: 'Account approvals', approve: 'Approve', reject: 'Reject',
    approved: 'Approved', refresh: 'Refresh', telegram: 'Connect Telegram', generate: 'Generate link code',
    telegramHelp: 'Send this command to the PostKeeper bot within 10 minutes:', settings: 'Account',
    checkEmail: 'Check your email to confirm the address, then sign in.', empty: 'No account requests yet.',
    linksMonth: 'links / month', storageMb: 'storage MB', saveLimits: 'Save limits'
  },
  ar: {
    title: 'معرفتك المحفوظة، مرتبة وآمنة.', login: 'تسجيل الدخول', register: 'إنشاء حساب',
    email: 'البريد الإلكتروني', password: 'كلمة المرور', username: 'اسم المستخدم', name: 'الاسم الكامل',
    submitLogin: 'دخول', submitRegister: 'إرسال طلب الحساب', noAccount: 'إنشاء حساب جديد',
    hasAccount: 'لدي حساب بالفعل', pending: 'حسابك بانتظار الموافقة.',
    pendingBody: 'ستتمكن من استخدام لوحة التحكم والبوت بعد موافقة مالك النظام على طلبك.',
    rejected: 'تم رفض طلب الحساب.', rejectedBody: 'يستطيع المالك مراجعته والموافقة عليه لاحقًا.',
    signOut: 'تسجيل الخروج', admin: 'طلبات الحسابات', approve: 'موافقة', reject: 'رفض',
    approved: 'مقبول', refresh: 'تحديث', telegram: 'ربط تيليجرام', generate: 'إنشاء كود الربط',
    telegramHelp: 'أرسل هذا الأمر إلى بوت PostKeeper خلال 10 دقائق:', settings: 'الحساب',
    checkEmail: 'افتح بريدك لتأكيد العنوان، ثم سجّل الدخول.', empty: 'لا توجد طلبات حسابات حاليًا.',
    linksMonth: 'رابط / شهر', storageMb: 'مساحة MB', saveLimits: 'حفظ الحدود'
  }
}

function LanguageButton({ locale, setLocale }) {
  return <button className="language-button" onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')}><Globe2 size={17} />{locale === 'ar' ? 'EN' : 'عربي'}</button>
}

function AuthScreen({ locale, setLocale }) {
  const t = copy[locale]
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ email: '', password: '', username: '', display_name: '' })
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('')
    try {
      if (mode === 'register') {
        const { error: signUpError } = await supabase.auth.signUp({
          email: form.email.trim(), password: form.password,
          options: { data: { username: form.username.trim(), display_name: form.display_name.trim(), locale } }
        })
        if (signUpError) throw signUpError
        setMessage(t.checkEmail)
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email: form.email.trim(), password: form.password })
        if (signInError) throw signInError
      }
    } catch (err) { setError(err.message || 'Something went wrong') }
    finally { setBusy(false) }
  }

  return <main className="account-shell">
    <section className="auth-card">
      <div className="auth-head"><div className="brand-mark">PK</div><LanguageButton locale={locale} setLocale={setLocale} /></div>
      <p className="eyebrow">POSTKEEPER</p><h1>{t.title}</h1>
      <div className="auth-tabs"><button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>{t.login}</button><button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>{t.register}</button></div>
      <form className="auth-form" onSubmit={submit}>
        {mode === 'register' && <><label>{t.name}<input required maxLength="80" value={form.display_name} onChange={e => setForm({...form, display_name:e.target.value})} /></label><label>{t.username}<input required minLength="3" maxLength="30" pattern="[A-Za-z0-9_.]+" autoCapitalize="none" value={form.username} onChange={e => setForm({...form, username:e.target.value})} /></label></>}
        <label>{t.email}<input required type="email" autoComplete="email" value={form.email} onChange={e => setForm({...form, email:e.target.value})} /></label>
        <label>{t.password}<input required minLength="8" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={form.password} onChange={e => setForm({...form, password:e.target.value})} /></label>
        {error && <div className="form-message error">{error}</div>}{message && <div className="form-message success">{message}</div>}
        <button className="primary-action" disabled={busy}>{busy ? '…' : mode === 'login' ? t.submitLogin : t.submitRegister}</button>
      </form>
      <button className="text-action" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? t.noAccount : t.hasAccount}</button>
    </section>
  </main>
}

function StatusScreen({ profile, locale, setLocale, reload }) {
  const t = copy[locale], rejected = profile.approval_status === 'rejected'
  return <main className="account-shell"><section className="status-card">
    <div className={`status-icon ${rejected ? 'rejected' : ''}`}>{rejected ? <X /> : <Clock3 />}</div>
    <h1>{rejected ? t.rejected : t.pending}</h1><p>{rejected ? t.rejectedBody : t.pendingBody}</p>
    <div className="status-actions"><button onClick={reload}><RefreshCw size={17}/>{t.refresh}</button><LanguageButton locale={locale} setLocale={setLocale}/><button onClick={() => supabase.auth.signOut()}><LogOut size={17}/>{t.signOut}</button></div>
  </section></main>
}

function AccountBar({ profile, locale, setLocale, reloadProfile }) {
  const t = copy[locale]
  const [open, setOpen] = useState(false), [profiles, setProfiles] = useState([]), [code, setCode] = useState(''), [error, setError] = useState('')
  async function loadProfiles() { const { data, error } = await supabase.from('profiles').select('*').order('created_at'); if (error) setError(error.message); else setProfiles(data || []) }
  useEffect(() => { if (open && profile.role === 'owner') loadProfiles() }, [open])
  async function setApproval(id, status) { setError(''); const { error } = await supabase.rpc('admin_set_approval', { target_user:id, new_status:status }); if (error) setError(error.message); else loadProfiles() }
  function changeLimit(id, field, value) { setProfiles(current => current.map(item => item.id === id ? {...item, [field]: Math.max(0, Number(value) || 0)} : item)) }
  async function saveLimits(item) { setError(''); const { error } = await supabase.rpc('admin_set_limits', { target_user:item.id, new_monthly_link_limit:item.monthly_link_limit, new_storage_limit_mb:Math.round(Number(item.storage_limit_bytes || 0) / 1048576) }); if (error) setError(error.message); else loadProfiles() }
  async function makeCode() { const { data, error } = await supabase.rpc('generate_telegram_link_token'); if (error) setError(error.message); else setCode(data) }
  return <><button className="account-fab" onClick={() => setOpen(true)} aria-label={t.settings}><UserRound size={20}/></button>
    {open && <div className="account-modal-backdrop" onClick={() => setOpen(false)}><section className="account-modal" onClick={e => e.stopPropagation()}>
      <header><div><p className="eyebrow">{t.settings}</p><h2>{profile.display_name || profile.username}</h2><span>@{profile.username}</span></div><button className="icon-button" onClick={() => setOpen(false)}><X/></button></header>
      <div className="account-controls"><LanguageButton locale={locale} setLocale={setLocale}/><button onClick={reloadProfile}><RefreshCw size={17}/>{t.refresh}</button><button onClick={() => supabase.auth.signOut()}><LogOut size={17}/>{t.signOut}</button></div>
      <div className="account-section"><h3>{t.telegram}</h3><button className="primary-action compact" onClick={makeCode}>{t.generate}</button>{code && <div className="link-code"><p>{t.telegramHelp}</p><code>/link {code}</code></div>}</div>
      {profile.role === 'owner' && <div className="account-section"><h3><ShieldCheck size={20}/>{t.admin}</h3>{error && <div className="form-message error">{error}</div>}{profiles.length === 0 ? <p>{t.empty}</p> : <div className="request-list">{profiles.map(item => <article key={item.id}><div className="request-identity"><strong>{item.display_name || item.username}</strong><span>@{item.username} · {item.email}</span><small>{item.approval_status}</small>{item.role !== 'owner' && <div className="limit-fields"><label>{t.linksMonth}<input type="number" min="0" value={item.monthly_link_limit ?? 50} onChange={e => changeLimit(item.id,'monthly_link_limit',e.target.value)}/></label><label>{t.storageMb}<input type="number" min="0" value={Math.round(Number(item.storage_limit_bytes || 0)/1048576)} onChange={e => changeLimit(item.id,'storage_limit_bytes',Number(e.target.value)*1048576)}/></label></div>}</div>{item.role !== 'owner' && <div className="request-actions"><button onClick={() => setApproval(item.id,'approved')}><Check size={16}/>{t.approve}</button><button className="danger" onClick={() => setApproval(item.id,'rejected')}><X size={16}/>{t.reject}</button><button onClick={() => saveLimits(item)}>{t.saveLimits}</button></div>}</article>)}</div>}</div>}
    </section></div>}</>
}

export default function App() {
  const [session, setSession] = useState(null), [profile, setProfile] = useState(null), [loading, setLoading] = useState(true)
  const [locale, setLocaleState] = useState(() => localStorage.getItem('pk-locale') || (navigator.language?.toLowerCase().startsWith('ar') ? 'ar' : 'en'))
  function setLocale(value) { localStorage.setItem('pk-locale', value); setLocaleState(value) }
  useEffect(() => { document.documentElement.lang = locale; document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr' }, [locale])
  async function loadProfile(userSession = session) { if (!userSession) return; setLoading(true); const { data } = await supabase.from('profiles').select('*').eq('id', userSession.user.id).single(); setProfile(data || null); if (data?.locale && !localStorage.getItem('pk-locale')) setLocaleState(data.locale); setLoading(false) }
  useEffect(() => {
    if (!isConfigured) { setLoading(false); return }
    supabase.auth.getSession().then(({data}) => { setSession(data.session); if (data.session) loadProfile(data.session); else setLoading(false) })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => { setSession(next); setProfile(null); if (next) setTimeout(() => loadProfile(next), 0); else setLoading(false) })
    return () => listener.subscription.unsubscribe()
  }, [])
  if (!isConfigured) return <main className="account-shell"><section className="status-card"><h1>PostKeeper setup required</h1><p>Supabase environment variables are missing.</p></section></main>
  if (loading) return <main className="account-shell"><div className="loading-orbit"/></main>
  if (!session) return <AuthScreen locale={locale} setLocale={setLocale}/>
  if (!profile) return <main className="account-shell"><section className="status-card"><h1>Profile unavailable</h1><button onClick={() => loadProfile(session)}>{copy[locale].refresh}</button></section></main>
  if (profile.approval_status !== 'approved') return <StatusScreen profile={profile} locale={locale} setLocale={setLocale} reload={() => loadProfile(session)}/>
  return <><PostKeeperLibrary/><AccountBar profile={profile} locale={locale} setLocale={setLocale} reloadProfile={() => loadProfile(session)}/></>
}

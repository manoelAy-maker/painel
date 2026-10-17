import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { salvar } from '../lib/supabase'
import AyresLogo from './AyresLogo'

const Svg = ({ children, ...p }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>{children}</svg>
)

const ICONES = {
  globe: <Svg width="16" height="16"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 010 18 14 14 0 010-18z" /></Svg>,
  lock: <Svg width="28" height="28"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" /></Svg>,
  chevronRight: <Svg width="14" height="14"><path d="M9 6l6 6-6 6" /></Svg>,
  shield: <Svg><path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3z" /></Svg>,
  bolt: <Svg><path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" /></Svg>,
  brain: <Svg><path d="M9.5 3a2.5 2.5 0 00-2.5 2.5v1A2.5 2.5 0 005 9v1a2.5 2.5 0 00-1 4.9V16a2.5 2.5 0 002.5 2.5 2.5 2.5 0 002.5 2.5h1" /><path d="M14.5 3a2.5 2.5 0 012.5 2.5v1A2.5 2.5 0 0119 9v1a2.5 2.5 0 011 4.9V16a2.5 2.5 0 01-2.5 2.5 2.5 2.5 0 01-2.5 2.5h-1" /><path d="M9.5 21V3M14.5 21V3" /></Svg>,
}

const TEXTOS = {
  pt: {
    marca: 'Logística inteligente',
    titulo: 'Bem-vindo ao',
    descricao: 'Entre com suas credenciais para acessar a plataforma. A localização será registrada após o login para controle operacional.',
    cardTitulo: 'Acessar plataforma',
    cardSub: 'Informe suas credenciais de acesso',
    usuario: 'Usuário',
    usuarioPlaceholder: 'Seu ID de acesso',
    senha: 'Senha',
    senhaPlaceholder: '••••••••',
    esqueci: 'Esqueci minha senha',
    erro: 'Usuário ou senha inválidos.',
    validando: 'Validando...',
    entrar: 'ENTRAR NA PLATAFORMA',
    recuperacao: 'Recuperação',
    esqueciTitulo: 'Esqueci minha senha',
    esqueciTexto: 'O admin receberá uma notificação para autorizar a troca.',
    nome: 'Nome',
    nomePlaceholder: 'Seu nome',
    motivo: 'Motivo',
    motivoPlaceholder: 'Ex: esqueci minha senha',
    enviarPedido: 'Solicitar troca de senha',
    enviando: 'Enviando...',
    informeUsuario: 'Informe seu usuário.',
    pedidoEnviado: 'Pedido enviado. Aguarde o admin autorizar a troca de senha.',
    pedidoLocal: 'Pedido salvo neste aparelho. Avise o admin para verificar depois.',
    beneficios: ['Controle Avançado', 'Tempo Real', 'Inteligência de Dados'],
    direitos: '© 2026 AYRES Logística. Todos os direitos reservados.',
    acesso: <>Localização em segundo plano<br />Acesso monitorado</>,
  },
  en: {
    marca: 'Smart logistics',
    titulo: 'Welcome to',
    descricao: 'Sign in with your credentials to access the platform. Location will be recorded after login for operational control.',
    cardTitulo: 'Access platform',
    cardSub: 'Enter your access credentials',
    usuario: 'User',
    usuarioPlaceholder: 'Your access ID',
    senha: 'Password',
    senhaPlaceholder: '••••••••',
    esqueci: 'Forgot password',
    erro: 'Invalid user or password.',
    validando: 'Validating...',
    entrar: 'ACCESS PLATFORM',
    recuperacao: 'Recovery',
    esqueciTitulo: 'Forgot my password',
    esqueciTexto: 'The admin will receive a notification to authorize the password change.',
    nome: 'Name',
    nomePlaceholder: 'Your name',
    motivo: 'Reason',
    motivoPlaceholder: 'Ex: I forgot my password',
    enviarPedido: 'Request password change',
    enviando: 'Sending...',
    informeUsuario: 'Enter your user ID.',
    pedidoEnviado: 'Request sent. Wait for admin approval.',
    pedidoLocal: 'Request saved on this device. Ask the admin to check it later.',
    beneficios: ['Advanced Control', 'Real Time', 'Data Intelligence'],
    direitos: '© 2026 AYRES Logistics. All rights reserved.',
    acesso: <>Background location<br />Monitored access</>,
  },
}

function ForgotPasswordModal({ show, onClose, onDone, textos }) {
  const [form, setForm] = useState({ usuario: '', nome: '', motivo: '' })
  const [enviando, setEnviando] = useState(false)
  const [msg, setMsg] = useState('')

  if (!show) return null

  const solicitar = async () => {
    if (!form.usuario.trim()) {
      setMsg(textos.informeUsuario)
      return
    }

    setEnviando(true)
    setMsg('')

    const pedido = {
      id: `senha_${form.usuario.trim()}_${Date.now()}`,
      usuario: form.usuario.trim(),
      nome: form.nome.trim(),
      motivo: form.motivo.trim(),
      status: 'pendente',
      criadoEm: new Date().toLocaleString('pt-BR'),
      filial: 'jatai-go',
    }

    try {
      await salvar(pedido, 'senha_reset', pedido.filial)
      setMsg(textos.pedidoEnviado)
      setTimeout(() => { onDone?.(); onClose() }, 1100)
    } catch {
      const local = JSON.parse(localStorage.getItem('solicitacoesSenhaAyres') || '[]')
      localStorage.setItem('solicitacoesSenhaAyres', JSON.stringify([pedido, ...local]))
      setMsg(textos.pedidoLocal)
      setTimeout(() => { onDone?.(); onClose() }, 1400)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="ayres-forgot" onClick={onClose}>
      <section className="ayres-forgot__dialog" role="dialog" aria-modal="true" aria-labelledby="ayres-forgot-title" onClick={e => e.stopPropagation()}>
        <div className="ayres-forgot__header">
          <div>
            <p className="ayres-overline">{textos.recuperacao}</p>
            <h3 id="ayres-forgot-title">{textos.esqueciTitulo}</h3>
            <p className="ayres-forgot__description">{textos.esqueciTexto}</p>
          </div>
          <button type="button" className="ayres-icon-button" onClick={onClose} aria-label="Fechar">×</button>
        </div>

        <div className="ayres-form-fields">
          <div className="ayres-form-field">
            <label htmlFor="ayres-recovery-user">{textos.usuario}</label>
            <input id="ayres-recovery-user" value={form.usuario} onChange={e => setForm(p => ({ ...p, usuario: e.target.value }))} placeholder="Ex: jamis" autoComplete="username" />
          </div>
          <div className="ayres-form-field">
            <label htmlFor="ayres-recovery-name">{textos.nome}</label>
            <input id="ayres-recovery-name" value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} placeholder={textos.nomePlaceholder} autoComplete="name" />
          </div>
          <div className="ayres-form-field">
            <label htmlFor="ayres-recovery-reason">{textos.motivo}</label>
            <textarea id="ayres-recovery-reason" value={form.motivo} onChange={e => setForm(p => ({ ...p, motivo: e.target.value }))} placeholder={textos.motivoPlaceholder} />
          </div>
        </div>

        {msg && <p className="ayres-feedback" role="status">{msg}</p>}
        <button type="button" disabled={enviando} onClick={solicitar} className="ayres-button ayres-button--primary ayres-forgot__submit">
          {enviando ? textos.enviando : textos.enviarPedido}
        </button>
      </section>
    </div>
  )
}

export default function Login() {
  const { entrar } = useApp()
  const [form, setForm] = useState({ usuario: '', senha: '' })
  const [heroVisivel, setHeroVisivel] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [forgot, setForgot] = useState(false)
  const [idioma, setIdioma] = useState(() => localStorage.getItem('idiomaAyres') || 'pt')
  const textos = TEXTOS[idioma] || TEXTOS.pt

  useEffect(() => {
    const t = setTimeout(() => setHeroVisivel(true), 60)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    localStorage.setItem('idiomaAyres', idioma)
  }, [idioma])

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  const handleLogin = async (e) => {
    e?.preventDefault()
    if (carregando) return

    setErro('')
    setCarregando(true)

    const ok = await entrar(form.usuario, form.senha)
    if (!ok) setErro(textos.erro)

    setCarregando(false)
  }

  const beneficios = [
    { icon: 'shield', texto: textos.beneficios[0] },
    { icon: 'bolt', texto: textos.beneficios[1] },
    { icon: 'brain', texto: textos.beneficios[2] },
  ]

  return (
    <div className="ayres-login">
      <header className="ayres-login__header">
        <div className="ayres-login__brand">
          <div className="ayres-login__logo-mark"><AyresLogo size={54} /></div>
          <div>
            <h1>AYRES</h1>
            <p>{textos.marca}</p>
          </div>
        </div>
        <div className="ayres-language" aria-label="Idioma">
          <span className="ayres-language__icon">{ICONES.globe}</span>
          <button type="button" onClick={() => setIdioma('pt')} className={idioma === 'pt' ? 'is-active' : ''} aria-pressed={idioma === 'pt'}>PT</button>
          <button type="button" onClick={() => setIdioma('en')} className={idioma === 'en' ? 'is-active' : ''} aria-pressed={idioma === 'en'}>EN</button>
        </div>
      </header>

      <main className={`ayres-login__main ${heroVisivel ? 'is-visible' : ''}`}>
        <section className="ayres-login__intro" aria-labelledby="ayres-login-title">
          <p className="ayres-overline">{textos.marca}</p>
          <h2 id="ayres-login-title" className="ayres-login__title">
            <span>{textos.titulo}</span>
            <span className="ayres-login__word"><span className="ayres-login__word-mark"><AyresLogo size={78} /></span><span>YRES</span></span>
          </h2>
          <p className="ayres-login__description">{textos.descricao}</p>
        </section>

        <section className="ayres-login__card" aria-labelledby="ayres-login-card-title">
          <div className="ayres-login__card-header">
            <div className="ayres-login__lock">{ICONES.lock}</div>
            <h3 id="ayres-login-card-title">{textos.cardTitulo}</h3>
            <p>{textos.cardSub}</p>
          </div>

          <form className="ayres-login__form" onSubmit={handleLogin}>
            <div className="ayres-form-field">
              <label htmlFor="portal-user">{textos.usuario}</label>
              <input id="portal-user" type="text" placeholder={textos.usuarioPlaceholder} autoComplete="username" value={form.usuario} onChange={(e) => set('usuario', e.target.value)} onKeyDown={(e) => e.key === 'Enter' && document.getElementById('portal-pass')?.focus()} />
            </div>
            <div className="ayres-form-field">
              <div className="ayres-form-field__label-row">
                <label htmlFor="portal-pass">{textos.senha}</label>
                <button type="button" onClick={() => setForgot(true)} className="ayres-link-button">{textos.esqueci}</button>
              </div>
              <input id="portal-pass" type="password" placeholder={textos.senhaPlaceholder} autoComplete="current-password" value={form.senha} onChange={(e) => set('senha', e.target.value)} />
            </div>

            {erro && <p className="ayres-feedback ayres-feedback--error" role="alert">{erro}</p>}

            <button type="submit" disabled={carregando} className="ayres-button ayres-button--primary ayres-login__submit">
              {carregando ? textos.validando : <>{textos.entrar} {ICONES.chevronRight}</>}
            </button>
          </form>
        </section>
      </main>

      <footer className="ayres-login__footer">
        <div className="ayres-login__benefits">
          {beneficios.map((b) => <div key={b.texto} className="ayres-login__benefit"><span>{ICONES[b.icon]}</span><span>{b.texto}</span></div>)}
        </div>
        <p>{textos.direitos}</p>
      </footer>

      <div className="ayres-login__location" aria-label={typeof textos.acesso === 'string' ? textos.acesso : undefined}>
        {ICONES.lock}<span>{textos.acesso}</span>
      </div>

      <ForgotPasswordModal show={forgot} onClose={() => setForgot(false)} textos={textos} />
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { salvar } from '../lib/supabase'
import PortalScene from './PortalScene'
import AyresLogo from './AyresLogo'

const Svg = ({ children, ...p }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>{children}</svg>
)

const ICONES = {
  shield: <Svg><path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3z" /></Svg>,
  bolt: <Svg><path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" /></Svg>,
  brain: <Svg><path d="M9.5 3a2.5 2.5 0 00-2.5 2.5v1A2.5 2.5 0 005 9v1a2.5 2.5 0 00-1 4.9V16a2.5 2.5 0 002.5 2.5 2.5 2.5 0 002.5 2.5h1" /><path d="M14.5 3a2.5 2.5 0 012.5 2.5v1A2.5 2.5 0 0119 9v1a2.5 2.5 0 011 4.9V16a2.5 2.5 0 01-2.5 2.5 2.5 2.5 0 01-2.5 2.5h-1" /><path d="M9.5 21V3M14.5 21V3" /></Svg>,
  globe: <Svg width="16" height="16"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 010 18 14 14 0 010-18z" /></Svg>,
  chevronRight: <Svg width="14" height="14"><path d="M9 6l6 6-6 6" /></Svg>,
  lock: <Svg width="28" height="28"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" /></Svg>,
}

const TEXTOS = {
  pt: { marca: 'Logística inteligente', titulo: 'Bem-vindo ao', descricao: 'Entre com suas credenciais para acessar a plataforma. Um único login dá acesso aos painéis de Estadia e Captação.', cardTitulo: 'Acessar plataforma', cardSub: 'Informe suas credenciais de acesso', usuario: 'Usuário', usuarioPlaceholder: 'Seu ID de acesso', senha: 'Senha', senhaPlaceholder: '••••••••', esqueci: 'Esqueci minha senha', erro: 'Usuário ou senha inválidos.', validando: 'Validando...', entrar: 'ENTRAR NA PLATAFORMA', recuperacao: 'Recuperação', esqueciTitulo: 'Esqueci minha senha', esqueciTexto: 'O admin receberá uma notificação para autorizar a troca.', nome: 'Nome', nomePlaceholder: 'Seu nome', motivo: 'Motivo', motivoPlaceholder: 'Ex: esqueci minha senha', enviarPedido: 'Solicitar troca de senha', enviando: 'Enviando...', informeUsuario: 'Informe seu usuário.', pedidoEnviado: 'Pedido enviado. Aguarde o admin autorizar a troca de senha.', pedidoLocal: 'Pedido salvo neste aparelho. Avise o admin para verificar depois.', beneficios: ['Controle Avançado', 'Tempo Real', 'Inteligência de Dados'], direitos: '© 2026 AYRES Logística. Todos os direitos reservados.', acesso: <>Acesso protegido<br />Sessão operacional</> },
  en: { marca: 'Smart logistics', titulo: 'Welcome to', descricao: 'Sign in with your credentials to access the platform. One login gives access to Stay Control and Capture panels.', cardTitulo: 'Access platform', cardSub: 'Enter your access credentials', usuario: 'User', usuarioPlaceholder: 'Your access ID', senha: 'Password', senhaPlaceholder: '••••••••', esqueci: 'Forgot password', erro: 'Invalid user or password.', validando: 'Validating...', entrar: 'ACCESS PLATFORM', recuperacao: 'Recovery', esqueciTitulo: 'Forgot my password', esqueciTexto: 'The admin will receive a notification to authorize the password change.', nome: 'Name', nomePlaceholder: 'Your name', motivo: 'Reason', motivoPlaceholder: 'Ex: I forgot my password', enviarPedido: 'Request password change', enviando: 'Sending...', informeUsuario: 'Enter your user ID.', pedidoEnviado: 'Request sent. Wait for admin approval.', pedidoLocal: 'Request saved on this device. Ask the admin to check it later.', beneficios: ['Advanced Control', 'Real Time', 'Data Intelligence'], direitos: '© 2026 AYRES Logistics. All rights reserved.', acesso: <>Protected access<br />Operational session</> },
}

function ForgotPasswordModal({ show, onClose, onDone, textos }) {
  const [form, setForm] = useState({ usuario: '', nome: '', motivo: '' })
  const [enviando, setEnviando] = useState(false)
  const [msg, setMsg] = useState('')
  if (!show) return null
  const solicitar = async () => {
    if (!form.usuario.trim()) { setMsg(textos.informeUsuario); return }
    setEnviando(true); setMsg('')
    const pedido = { id: `senha_${form.usuario.trim()}_${Date.now()}`, usuario: form.usuario.trim(), nome: form.nome.trim(), motivo: form.motivo.trim(), status: 'pendente', criadoEm: new Date().toLocaleString('pt-BR'), filial: 'jatai-go' }
    try { await salvar(pedido, 'senha_reset', pedido.filial); setMsg(textos.pedidoEnviado); setTimeout(() => { onDone?.(); onClose() }, 1100) }
    catch { const local = JSON.parse(localStorage.getItem('solicitacoesSenhaAyres') || '[]'); localStorage.setItem('solicitacoesSenhaAyres', JSON.stringify([pedido, ...local])); setMsg(textos.pedidoLocal); setTimeout(() => { onDone?.(); onClose() }, 1400) }
    finally { setEnviando(false) }
  }
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/75 backdrop-blur-md" onClick={onClose}><div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-[#0d1117] p-8 shadow-2xl" onClick={e => e.stopPropagation()}><div className="flex items-start justify-between gap-4 mb-7"><div><p className="text-[10px] uppercase tracking-[.22em] text-blue-400 font-black mb-2">{textos.recuperacao}</p><h3 className="text-2xl font-bold">{textos.esqueciTitulo}</h3><p className="text-sm text-slate-500 mt-2">{textos.esqueciTexto}</p></div><button className="bg-white/5 border border-white/10 rounded-xl w-9 h-9 text-white" onClick={onClose}>×</button></div><div className="space-y-4"><div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">{textos.usuario}</label><input value={form.usuario} onChange={e => setForm(p => ({ ...p, usuario: e.target.value }))} placeholder="Ex: jamis" className="w-full px-5 py-4 rounded-2xl outline-none text-white bg-white/[.03] border border-white/5" /></div><div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">{textos.nome}</label><input value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} placeholder={textos.nomePlaceholder} className="w-full px-5 py-4 rounded-2xl outline-none text-white bg-white/[.03] border border-white/5" /></div><div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">{textos.motivo}</label><textarea value={form.motivo} onChange={e => setForm(p => ({ ...p, motivo: e.target.value }))} placeholder={textos.motivoPlaceholder} className="w-full px-5 py-4 rounded-2xl outline-none text-white bg-white/[.03] border border-white/5 min-h-[88px] resize-none" /></div></div>{msg && <p className="text-sm text-center text-blue-300 mt-4">{msg}</p>}<button disabled={enviando} onClick={solicitar} className="w-full py-4 rounded-2xl font-bold text-base mt-6 bg-gradient-to-r from-blue-600 to-blue-500 disabled:opacity-60">{enviando ? textos.enviando : textos.enviarPedido}</button></div></div>
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

  useEffect(() => { const t = setTimeout(() => setHeroVisivel(true), 60); return () => clearTimeout(t) }, [])
  useEffect(() => { localStorage.setItem('idiomaAyres', idioma) }, [idioma])
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))
  const handleLogin = async (e) => { e?.preventDefault(); if (carregando) return; setErro(''); setCarregando(true); const ok = await entrar(form.usuario, form.senha); if (!ok) setErro(textos.erro); setCarregando(false) }
  const beneficios = [{ icon: 'shield', texto: textos.beneficios[0] }, { icon: 'bolt', texto: textos.beneficios[1] }, { icon: 'brain', texto: textos.beneficios[2] }]

  return (
    <div className="portal-screen min-h-screen flex flex-col bg-[#05070a] text-white font-sans relative overflow-hidden" style={{ fontFamily: "'Inter','Plus Jakarta Sans',Arial,sans-serif" }}>
      <PortalScene />
      <div className="fixed inset-0 -z-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(59,130,246,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,.05) 1px, transparent 1px)', backgroundSize: '50px 50px', maskImage: 'radial-gradient(circle at center, black, transparent 80%)', WebkitMaskImage: 'radial-gradient(circle at center, black, transparent 80%)' }} />
      <header className="px-6 sm:px-10 py-8 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-4"><div className="login-logo-mark"><AyresLogo size={54} /></div><div><h1 className="text-2xl sm:text-3xl font-bold tracking-tight">AYRES</h1><p className="text-[10px] uppercase tracking-[0.3em] text-blue-400 font-bold">{textos.marca}</p></div></div>
        <div className="bg-white/5 border border-white/10 rounded-full px-2 py-2 text-xs font-bold flex items-center gap-2 sm:gap-3 hover:bg-white/10 transition-all"><span className="text-slate-300">{ICONES.globe}</span><button type="button" onClick={() => setIdioma('pt')} className={`px-2.5 py-1 rounded-full transition-all ${idioma === 'pt' ? 'bg-blue-500/30 text-blue-100' : 'text-slate-500 hover:text-slate-200'}`}>PT</button><button type="button" onClick={() => setIdioma('en')} className={`px-2.5 py-1 rounded-full transition-all ${idioma === 'en' ? 'bg-blue-500/30 text-blue-100' : 'text-slate-500 hover:text-slate-200'}`}>EN</button></div>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-10"><div className={`text-center mb-10 max-w-2xl transition-all duration-1000 ease-out ${heroVisivel ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}><h2 className="text-4xl sm:text-6xl font-bold mb-6 tracking-tight">{textos.titulo} <span className="text-blue-500">AYRES</span></h2><p className="text-slate-400 text-base sm:text-lg leading-relaxed font-light">{textos.descricao}</p></div><div className={`w-full max-w-md bg-[#0d1117] border border-white/10 rounded-[2.5rem] p-8 sm:p-12 shadow-2xl transition-all duration-1000 ease-out ${heroVisivel ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}><div className="text-center mb-10"><div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 border bg-blue-500/10 border-blue-500/20 text-blue-500">{ICONES.lock}</div><h4 className="text-2xl font-bold mb-2">{textos.cardTitulo}</h4><p className="text-slate-500 text-sm">{textos.cardSub}</p></div><form className="space-y-6" onSubmit={handleLogin}><div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">{textos.usuario}</label><input id="portal-user" type="text" placeholder={textos.usuarioPlaceholder} autoComplete="username" value={form.usuario} onChange={(e) => set('usuario', e.target.value)} onKeyDown={(e) => e.key === 'Enter' && document.getElementById('portal-pass')?.focus()} className="w-full px-5 py-4 rounded-2xl outline-none text-white bg-white/[.03] border border-white/5 transition-all focus:border-blue-500 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.1)] focus:bg-white/5" /></div><div><div className="flex items-center justify-between gap-3 mb-2 ml-1"><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">{textos.senha}</label><button type="button" onClick={() => setForgot(true)} className="text-[11px] text-blue-400 font-bold hover:text-blue-300">{textos.esqueci}</button></div><input id="portal-pass" type="password" placeholder={textos.senhaPlaceholder} autoComplete="current-password" value={form.senha} onChange={(e) => set('senha', e.target.value)} className="w-full px-5 py-4 rounded-2xl outline-none text-white bg-white/[.03] border border-white/5 transition-all focus:border-blue-500 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.1)] focus:bg-white/5" /></div>{erro && <p className="text-red-400 text-sm text-center -mt-2">{erro}</p>}<button type="submit" disabled={carregando} className="w-full py-4 sm:py-5 rounded-2xl font-bold text-base sm:text-lg shadow-xl mt-2 flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-wait bg-gradient-to-r from-blue-600 to-blue-500 hover:shadow-[0_10px_24px_rgba(37,99,235,0.35)]">{carregando ? textos.validando : <>{textos.entrar} {ICONES.chevronRight}</>}</button></form></div></main>
      <footer className="px-6 py-12 sm:py-16 text-center"><div className="flex flex-wrap justify-center gap-6 sm:gap-12 mb-8">{beneficios.map((b) => <div key={b.texto} className="flex items-center gap-3 text-slate-500"><span className="text-blue-500">{ICONES[b.icon]}</span><span className="text-[10px] uppercase tracking-widest font-bold">{b.texto}</span></div>)}</div><p className="text-[10px] text-slate-700 uppercase tracking-[0.4em]">{textos.direitos}</p></footer>
      <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-7 flex items-center gap-2 text-slate-600 text-[10px] uppercase tracking-widest font-bold opacity-70 hover:opacity-100 transition-opacity">{ICONES.lock}<span className="text-right leading-tight normal-case tracking-normal">{textos.acesso}</span></div>
      <ForgotPasswordModal show={forgot} onClose={() => setForgot(false)} textos={textos} />
    </div>
  )
}

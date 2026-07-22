import { useMemo, useRef, useState } from 'react'
import { nomeFilial } from '../data/filiais'
import { useApp } from '../context/AppContext'
import { ADMIN_USERNAME } from '../data/defaultUsers'
import { carregarUsuarios, salvarUsuario } from '../lib/supabase'
import AccessLocationPanel from '../components/AccessLocationPanel'
import '../admin-users-pro.css'

const FILIAL_OLEO = 'oleo'
const CARGOS = ['Operador', 'Visualizador', 'Analista Júnior', 'Analista Pleno', 'Analista Sênior', 'Coordenador', 'Admin']
const SECOES_ADMIN = [
  ['usuarios', 'Usuários'],
  ['filiais', 'Filiais'],
  ['localizacao', 'Localização'],
  ['regras', 'Permissões'],
]

const novoFuncionario = (filial = 'jatai-go') => ({
  usuario: '',
  senha: '',
  nome: '',
  cargo: 'Operador',
  filial,
})

function iniciais(nome = '') {
  const partes = String(nome || '').trim().split(/\s+/).filter(Boolean)
  if (!partes.length) return '?'
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase()
}

function normalizarLogin(v = '') {
  return String(v).toLowerCase().trim().replace(/[^a-z0-9._-]/g, '')
}

async function hashSenha(senha) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${senha}ldc2025`))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function baixarCsv(usuarios = []) {
  const linhas = [
    ['Nome', 'Login', 'Cargo', 'Filial', 'Ativo'],
    ...usuarios.map(u => [u.nome || '', u.usuario || '', u.cargo || '', u.filial || '', u.ativo === false ? 'Não' : 'Sim']),
  ]
  const csv = '\ufeff' + linhas.map(linha => linha.map(valor => `"${String(valor).replace(/"/g, '""')}"`).join(';')).join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `usuarios-ayres-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function Admin() {
  const {
    usuarios = [],
    filiais = [],
    excluirUsuario,
    criarFilial,
    excluirFilial,
    usuarioAtual,
    usuariosOnline = [],
    cloudStatus,
    dispatch,
  } = useApp()

  const formRef = useRef(null)

  const filiaisBase = useMemo(() => {
    const base = filiais.length ? filiais : [
      { id: 'jatai-go', nome: 'Jataí', cidade: 'Jataí', estado: 'GO' },
      { id: FILIAL_OLEO, nome: 'Operação do Óleo', cidade: 'Jataí', estado: 'GO' },
    ]
    return base.some(f => f.id === FILIAL_OLEO)
      ? base
      : [...base, { id: FILIAL_OLEO, nome: 'Operação do Óleo', cidade: 'Jataí', estado: 'GO' }]
  }, [filiais])

  const filialPadrao = useMemo(() => {
    if (usuarioAtual?.filial && filiaisBase.some(f => f.id === usuarioAtual.filial)) return usuarioAtual.filial
    return filiaisBase[0]?.id || 'jatai-go'
  }, [usuarioAtual?.filial, filiaisBase])

  const [secaoAtiva, setSecaoAtiva] = useState('usuarios')
  const [funcionario, setFuncionario] = useState(() => novoFuncionario(filialPadrao))
  const [editandoUsuario, setEditandoUsuario] = useState(null)
  const [novaFilial, setNovaFilial] = useState({ id: '', nome: '', cidade: '', estado: '' })
  const [busca, setBusca] = useState('')
  const [filtroFilial, setFiltroFilial] = useState('')
  const [filtroCargo, setFiltroCargo] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [sincronizando, setSincronizando] = useState(false)
  const [feedback, setFeedback] = useState(null)

  const usuariosOnlineSet = useMemo(
    () => new Set((usuariosOnline || []).map(u => String(u.usuario || u).toLowerCase())),
    [usuariosOnline],
  )

  const listaFiltrada = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return usuarios
      .filter(u => !filtroFilial || u.filial === filtroFilial)
      .filter(u => !filtroCargo || u.cargo === filtroCargo)
      .filter(u => !termo || [u.nome, u.usuario, u.cargo, u.filial, nomeFilial(u.filial)].join(' ').toLowerCase().includes(termo))
      .sort((a, b) => String(a.nome || '').localeCompare(String(b.nome || '')))
  }, [usuarios, busca, filtroFilial, filtroCargo])

  const indicadores = useMemo(() => {
    const ativos = usuarios.filter(u => u.ativo !== false).length
    const admins = usuarios.filter(u => ['Admin', 'Coordenador', 'Analista Sênior', 'Analista Senior'].includes(u.cargo)).length
    return [
      { label: 'Usuários cadastrados', value: usuarios.length, info: 'total de acessos' },
      { label: 'Ativos', value: ativos, info: 'liberados para uso' },
      { label: 'Online agora', value: usuariosOnlineSet.size, info: 'sessões conectadas' },
      { label: 'Administradores', value: admins, info: 'acesso de gestão' },
    ]
  }, [usuarios, usuariosOnlineSet])

  const irParaFormulario = () => {
    setSecaoAtiva('usuarios')
    setEditandoUsuario(null)
    setFuncionario(novoFuncionario(filialPadrao))
    setFeedback(null)
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  const iniciarEdicao = (u, trocarSenha = false) => {
    setSecaoAtiva('usuarios')
    setEditandoUsuario(u.usuario)
    setFuncionario({
      usuario: u.usuario,
      senha: '',
      nome: u.nome || '',
      cargo: u.cargo || 'Operador',
      filial: filiaisBase.some(f => f.id === u.filial) ? u.filial : filialPadrao,
    })
    setFeedback(trocarSenha ? { tipo: 'info', texto: `Digite a nova senha de ${u.nome || u.usuario} e salve as alterações.` } : null)
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      if (trocarSenha) document.getElementById('admin-senha')?.focus()
    }, 50)
  }

  const cancelarEdicao = () => {
    setEditandoUsuario(null)
    setFuncionario(novoFuncionario(filialPadrao))
    setFeedback(null)
  }

  const salvarFuncionario = async (e) => {
    e?.preventDefault()
    if (salvando) return

    const login = normalizarLogin(funcionario.usuario)
    const nome = funcionario.nome.trim()
    const senha = funcionario.senha.trim()

    if (!nome) return setFeedback({ tipo: 'erro', texto: 'Informe o nome completo do colaborador.' })
    if (!login) return setFeedback({ tipo: 'erro', texto: 'Informe um login válido.' })
    if (!funcionario.filial) return setFeedback({ tipo: 'erro', texto: 'Selecione a filial.' })
    if (!editandoUsuario && senha.length < 4) return setFeedback({ tipo: 'erro', texto: 'A senha inicial precisa ter pelo menos 4 caracteres.' })
    if (!editandoUsuario && usuarios.some(u => String(u.usuario).toLowerCase() === login)) return setFeedback({ tipo: 'erro', texto: 'Esse login já está cadastrado.' })

    setSalvando(true)
    setFeedback({ tipo: 'info', texto: editandoUsuario ? 'Salvando alterações...' : 'Criando usuário no Supabase...' })

    try {
      const atual = editandoUsuario ? usuarios.find(u => u.usuario === editandoUsuario) : null
      const avatar = iniciais(nome)
      const registro = {
        ...(atual || {}),
        usuario: editandoUsuario || login,
        nome,
        cargo: funcionario.cargo,
        filial: funcionario.filial,
        avatar,
        ativo: atual?.ativo !== false,
        senha: senha ? await hashSenha(senha) : atual?.senha,
      }

      if (!registro.senha) throw new Error('Informe uma senha inicial.')
      const salvo = await salvarUsuario(registro)
      const novaLista = editandoUsuario
        ? usuarios.map(u => u.usuario === editandoUsuario ? { ...registro, ...salvo } : u)
        : [...usuarios, { ...registro, ...salvo }]

      dispatch({ type: 'SET_USUARIOS', payload: novaLista })

      if (usuarioAtual?.usuario === editandoUsuario) {
        const atualizado = novaLista.find(u => u.usuario === editandoUsuario)
        dispatch({ type: 'SET_USUARIO', payload: atualizado })
        localStorage.setItem('usuarioLogadoViaLog', JSON.stringify(atualizado))
      }

      setEditandoUsuario(null)
      setFuncionario(novoFuncionario(filialPadrao))
      setFeedback({ tipo: 'sucesso', texto: editandoUsuario ? 'Usuário atualizado com sucesso.' : 'Usuário criado e salvo no Supabase.' })
    } catch (error) {
      setFeedback({ tipo: 'erro', texto: error?.message || 'Não foi possível salvar o usuário.' })
    } finally {
      setSalvando(false)
    }
  }

  const sincronizarUsuarios = async () => {
    if (sincronizando) return
    setSincronizando(true)
    try {
      const remotos = await carregarUsuarios()
      dispatch({ type: 'SET_USUARIOS', payload: remotos })
      setFeedback({ tipo: 'sucesso', texto: `${remotos.length} usuário(s) sincronizado(s) com o Supabase.` })
    } catch (error) {
      setFeedback({ tipo: 'erro', texto: error?.message || 'Falha ao sincronizar usuários.' })
    } finally {
      setSincronizando(false)
    }
  }

  const adicionarFilial = () => {
    if (criarFilial(novaFilial)) setNovaFilial({ id: '', nome: '', cidade: '', estado: '' })
  }

  return (
    <section className="aba active users-pro-page">
      <header className="users-pro-hero">
        <div>
          <span className="users-pro-eyebrow">Administração AYRES</span>
          <h2>Central de usuários e acessos</h2>
          <p>Crie contas, altere cargos, troque senhas, organize filiais e acompanhe quem está conectado.</p>
        </div>
        <div className="users-pro-hero-actions">
          <span className={`users-pro-cloud ${cloudStatus || 'offline'}`}><i />{cloudStatus === 'online' ? 'Supabase conectado' : cloudStatus === 'syncing' ? 'Sincronizando' : 'Nuvem offline'}</span>
          <button type="button" className="users-pro-action secondary" onClick={sincronizarUsuarios} disabled={sincronizando}>{sincronizando ? 'Sincronizando...' : 'Sincronizar usuários'}</button>
          <button type="button" className="users-pro-action primary" onClick={irParaFormulario}>+ Criar usuário</button>
        </div>
      </header>

      <div className="users-pro-kpis">
        {indicadores.map(item => <article key={item.label} className="users-pro-kpi"><span>{item.label}</span><strong>{item.value}</strong><small>{item.info}</small></article>)}
      </div>

      <nav className="users-pro-tabs">
        {SECOES_ADMIN.map(([id, label]) => <button type="button" key={id} className={secaoAtiva === id ? 'active' : ''} onClick={() => setSecaoAtiva(id)}>{label}</button>)}
      </nav>

      {secaoAtiva === 'usuarios' && (
        <div className="users-pro-admin-stack">
          <form ref={formRef} className="users-pro-card users-pro-form-card" onSubmit={salvarFuncionario}>
            <div className="users-pro-card-head users-pro-form-head">
              <div>
                <span className="users-pro-section-tag">{editandoUsuario ? 'Edição de acesso' : 'Novo acesso'}</span>
                <h3>{editandoUsuario ? `Editando ${editandoUsuario}` : 'Cadastrar novo colaborador'}</h3>
                <p>Todos os campos ficam visíveis em uma única área, sem caixas pequenas ou passos escondidos.</p>
              </div>
              {editandoUsuario && <button type="button" className="users-pro-action secondary" onClick={cancelarEdicao}>Cancelar edição</button>}
            </div>

            <div className="users-pro-form users-pro-form-wide">
              <label className="name-field"><span>Nome completo</span><input value={funcionario.nome} onChange={e => { setFuncionario(p => ({ ...p, nome: e.target.value })); setFeedback(null) }} placeholder="Nome do colaborador" autoFocus /></label>
              <label><span>Login</span><input disabled={!!editandoUsuario} value={funcionario.usuario} onChange={e => { setFuncionario(p => ({ ...p, usuario: normalizarLogin(e.target.value) })); setFeedback(null) }} placeholder="ex: joao.silva" /></label>
              <label><span>{editandoUsuario ? 'Nova senha, opcional' : 'Senha inicial'}</span><input id="admin-senha" type="password" value={funcionario.senha} onChange={e => { setFuncionario(p => ({ ...p, senha: e.target.value })); setFeedback(null) }} placeholder={editandoUsuario ? 'Vazio mantém a senha atual' : 'Mínimo 4 caracteres'} autoComplete="new-password" /></label>
              <label><span>Cargo</span><select value={funcionario.cargo} onChange={e => setFuncionario(p => ({ ...p, cargo: e.target.value }))}>{CARGOS.map(c => <option key={c}>{c}</option>)}</select></label>
              <label><span>Filial</span><select value={funcionario.filial} onChange={e => setFuncionario(p => ({ ...p, filial: e.target.value }))}>{filiaisBase.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}</select></label>
            </div>

            <div className="users-pro-filial-strip">
              <div><span>Filial selecionada</span><strong>{filiaisBase.find(f => f.id === funcionario.filial)?.nome || 'Nenhuma'}</strong></div>
              <div className="users-pro-tags">{filiaisBase.map(f => <button type="button" key={f.id} className={funcionario.filial === f.id ? 'active' : ''} onClick={() => setFuncionario(p => ({ ...p, filial: f.id }))}>{f.nome}</button>)}</div>
            </div>

            {feedback && <div className={`users-pro-feedback ${feedback.tipo}`}>{feedback.texto}</div>}

            <div className="users-pro-actions">
              <button type="submit" className="users-pro-action primary big" disabled={salvando}>{salvando ? 'Salvando no Supabase...' : editandoUsuario ? 'Salvar alterações' : 'Criar usuário'}</button>
              <span className="users-pro-save-hint">O acesso só é confirmado depois que o Supabase responde.</span>
            </div>
          </form>

          <section className="users-pro-card users-pro-list-card">
            <div className="users-pro-card-head users-pro-list-head">
              <div>
                <span className="users-pro-section-tag">Gerenciamento</span>
                <h3>Usuários cadastrados</h3>
                <p>{listaFiltrada.length} de {usuarios.length} usuário(s) exibido(s)</p>
              </div>
              <div className="users-pro-list-actions">
                <button type="button" className="users-pro-action secondary" onClick={() => baixarCsv(listaFiltrada)}>Exportar CSV</button>
              </div>
            </div>

            <div className="users-pro-filters">
              <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar nome, login, cargo ou filial..." />
              <select value={filtroCargo} onChange={e => setFiltroCargo(e.target.value)}><option value="">Todos os cargos</option>{CARGOS.map(c => <option key={c}>{c}</option>)}</select>
              <select value={filtroFilial} onChange={e => setFiltroFilial(e.target.value)}><option value="">Todas as filiais</option>{filiaisBase.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}</select>
            </div>

            <div className="users-pro-table-wrap">
              <table className="users-pro-table">
                <thead><tr><th>Colaborador</th><th>Status</th><th>Login</th><th>Cargo</th><th>Filial</th><th>Ações</th></tr></thead>
                <tbody>
                  {listaFiltrada.map(u => {
                    const online = usuariosOnlineSet.has(String(u.usuario).toLowerCase())
                    return (
                      <tr key={u.usuario}>
                        <td><div className="users-pro-person"><span>{u.avatar || iniciais(u.nome)}</span><div><strong>{u.nome}</strong><small>{u.ativo === false ? 'Acesso desativado' : 'Acesso liberado'}</small></div></div></td>
                        <td><span className={`users-pro-status ${online ? 'online' : ''}`}><i />{online ? 'Online' : 'Offline'}</span></td>
                        <td><code className="users-pro-login">{u.usuario}</code></td>
                        <td><span className="users-pro-chip muted">{u.cargo}</span></td>
                        <td>{nomeFilial(u.filial)}</td>
                        <td><div className="users-pro-row-actions"><button type="button" onClick={() => iniciarEdicao(u)}>Editar</button><button type="button" onClick={() => iniciarEdicao(u, true)}>Trocar senha</button>{u.usuario !== ADMIN_USERNAME && <button type="button" className="danger" onClick={() => confirm(`Excluir o acesso de ${u.nome || u.usuario}?`) && excluirUsuario(u.usuario)}>Excluir</button>}</div></td>
                      </tr>
                    )
                  })}
                  {!listaFiltrada.length && <tr><td colSpan={6} className="users-pro-empty">Nenhum usuário encontrado com esses filtros.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {secaoAtiva === 'filiais' && (
        <section className="users-pro-card users-pro-branches-card">
          <div className="users-pro-card-head"><div><span className="users-pro-section-tag">Estrutura operacional</span><h3>Filiais cadastradas</h3><p>Crie e organize os locais que aparecem no cadastro dos usuários.</p></div></div>
          <div className="users-pro-branch-grid">{filiaisBase.map(f => <article key={f.id} className="users-pro-branch"><div><strong>{f.nome}</strong><span>{f.cidade}{f.estado ? ` · ${f.estado}` : ''}</span><code>{f.id}</code></div>{!['jatai-go', 'mineiros-go', FILIAL_OLEO].includes(f.id) && <button type="button" className="danger" onClick={() => confirm(`Excluir filial ${f.nome}?`) && excluirFilial(f.id)}>Excluir</button>}</article>)}</div>
          <div className="users-pro-form branch-form"><label><span>ID</span><input value={novaFilial.id} onChange={e => setNovaFilial(p => ({ ...p, id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') }))} placeholder="ex: jatai-go" /></label><label><span>Nome</span><input value={novaFilial.nome} onChange={e => setNovaFilial(p => ({ ...p, nome: e.target.value }))} placeholder="Nome da filial" /></label><label><span>Cidade</span><input value={novaFilial.cidade} onChange={e => setNovaFilial(p => ({ ...p, cidade: e.target.value }))} placeholder="Cidade" /></label><label><span>UF</span><input value={novaFilial.estado} onChange={e => setNovaFilial(p => ({ ...p, estado: e.target.value.toUpperCase() }))} placeholder="GO" maxLength={2} /></label><button type="button" className="users-pro-action primary" onClick={adicionarFilial}>Adicionar filial</button></div>
        </section>
      )}

      {secaoAtiva === 'localizacao' && <AccessLocationPanel />}

      {secaoAtiva === 'regras' && (
        <section className="users-pro-card users-pro-permissions-card">
          <div className="users-pro-card-head"><div><span className="users-pro-section-tag">Mapa de acesso</span><h3>Permissões por cargo</h3><p>Resumo do que cada perfil consegue acessar dentro do painel.</p></div></div>
          <div className="users-pro-rule-list"><article><strong>Operador</strong><span>Lança e acompanha registros da própria filial.</span></article><article><strong>Visualizador</strong><span>Consulta informações sem administrar usuários.</span></article><article><strong>Analistas</strong><span>Acompanham operação, relatórios e histórico conforme nível.</span></article><article><strong>Coordenador</strong><span>Gerencia operação e acessos administrativos.</span></article><article><strong>Admin</strong><span>Acesso geral a usuários, filiais, relatórios e configurações.</span></article><article><strong>Operação do Óleo</strong><span>Dados segmentados pela filial <code>oleo</code>.</span></article></div>
        </section>
      )}
    </section>
  )
}

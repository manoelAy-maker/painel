import { useEffect, useMemo, useRef, useState } from 'react'
import { nomeFilial } from '../data/filiais'
import { useApp } from '../context/AppContext'
import { ADMIN_USERNAME } from '../data/defaultUsers'
import { CARGOS, podeAdministrar } from '../utils/roles'
import AccessLocationPanel from '../components/AccessLocationPanel'
import '../admin-users-pro.css'

const FILIAL_OLEO = 'oleo'
const FILIAL_JATAI = 'jatai'
const funcionarioVazio = { usuario: '', senha: '', nome: '', cargo: 'Operador', filial: '' }
const SECOES_ADMIN = [
  ['usuarios', 'Usuários', 'Criar e editar acessos'],
  ['filiais', 'Filiais', 'Separar operação por local'],
  ['localizacao', 'Localização', 'Regras de acesso por região'],
  ['regras', 'Regras', 'Resumo das permissões'],
]
const filiaisFallback = [
  { id: 'jatai-go', nome: 'Jataí', cidade: 'Jataí', estado: 'GO' },
  { id: 'mineiros-go', nome: 'Mineiros', cidade: 'Mineiros', estado: 'GO' },
]

function iniciais(nome = '') {
  const partes = String(nome || '').trim().split(/\s+/).filter(Boolean)
  if (!partes.length) return '?'
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase()
}

function normalizarLogin(v = '') {
  return String(v).toLowerCase().replace(/[^a-z0-9._-]/g, '')
}

function rotuloFilial(filial) {
  const id = typeof filial === 'string' ? filial : filial?.id
  if (!id) return 'Sem filial'
  if (id === FILIAL_JATAI) return 'Jataí'
  return (typeof filial === 'object' && filial?.nome) || nomeFilial(id) || id
}

function validarFuncionario(dados, editandoUsuario, usuarios = []) {
  if (String(dados.nome || '').trim().length < 2) return 'Preencha o nome completo do usuário.'
  if (!/^[a-z0-9][a-z0-9._-]{2,31}$/.test(String(dados.usuario || ''))) {
    return 'O login deve ter de 3 a 32 caracteres: letras, números, ponto, hífen ou sublinhado.'
  }
  if (!editandoUsuario && usuarios.some(usuario => String(usuario.usuario || '').trim().toLowerCase() === String(dados.usuario || '').toLowerCase())) return 'Usuário já existe.'
  if (!CARGOS.includes(dados.cargo)) return 'Selecione um cargo válido.'
  if (!dados.filial) return 'Selecione uma filial válida.'

  const senha = String(dados.senha || '')
  if (!editandoUsuario && (senha.trim().length < 8 || senha.length > 128)) return 'A senha inicial deve ter de 8 a 128 caracteres.'
  if (editandoUsuario && senha && (senha.trim().length < 8 || senha.length > 128)) return 'A senha inicial deve ter de 8 a 128 caracteres.'
  return ''
}

export default function Admin({ somenteUsuarios = false }) {
  const {
    criarUsuario,
    editarUsuario,
    usuarios,
    excluirUsuario,
    filiais,
    criarFilial,
    excluirFilial,
    usuarioAtual,
  } = useApp()
  const usuariosAtuais = Array.isArray(usuarios) ? usuarios : []
  const filiaisAtuais = Array.isArray(filiais) ? filiais : []
  const [secaoAtiva, setSecaoAtiva] = useState('usuarios')
  const [novaFilial, setNovaFilial] = useState({ id: '', nome: '', cidade: '', estado: '' })
  const [funcionario, setFuncionario] = useState(() => ({
    ...funcionarioVazio,
    filial: usuarioAtual?.filial || '',
  }))
  const [editandoUsuario, setEditandoUsuario] = useState(null)
  const [busca, setBusca] = useState('')
  const [filtroFilial, setFiltroFilial] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [salvando, setSalvando] = useState(false)
  const submitGuard = useRef(false)

  const filiaisBase = useMemo(() => {
    const fallback = somenteUsuarios
      ? filiaisFallback
      : [...filiaisFallback, { id: FILIAL_OLEO, nome: 'Operação do Óleo', cidade: 'Jataí', estado: 'GO' }]
    const idsReferenciados = new Set([usuarioAtual?.filial, ...usuariosAtuais.map(usuario => usuario?.filial)].filter(Boolean))
    const base = (filiaisAtuais.length ? filiaisAtuais : fallback)
      .filter(filial => filial?.id)
      .filter(filial => !somenteUsuarios || filial.id !== FILIAL_OLEO || idsReferenciados.has(filial.id))
      .map(filial => ({ ...filial }))
    const ids = new Set(base.map(filial => filial.id))

    idsReferenciados.forEach(idBruto => {
      const id = String(idBruto || '').trim()
      if (!id || ids.has(id)) return
      const jatai = id === FILIAL_JATAI
      const nome = jatai ? 'Jataí' : nomeFilial(id)
      base.push({ id, nome, cidade: jatai ? 'Jataí' : nome, estado: jatai ? 'GO' : '' })
      ids.add(id)
    })

    if (!somenteUsuarios && !ids.has(FILIAL_OLEO)) {
      base.push({ id: FILIAL_OLEO, nome: 'Operação do Óleo', cidade: 'Jataí', estado: 'GO' })
    }
    return base
  }, [filiaisAtuais, somenteUsuarios, usuarioAtual?.filial, usuariosAtuais])

  const filiaisPorId = useMemo(
    () => new Map(filiaisBase.map(filial => [filial.id, filial])),
    [filiaisBase],
  )

  const funcionariosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return [...usuariosAtuais]
      .filter(usuario => !filtroFilial || usuario.filial === filtroFilial)
      .filter(usuario => [
        usuario.nome,
        usuario.usuario,
        usuario.cargo,
        rotuloFilial(filiaisPorId.get(usuario.filial) || usuario.filial),
        usuario.filial,
      ].join(' ').toLowerCase().includes(termo))
      .sort((a, b) => String(a.nome || '').localeCompare(String(b.nome || '')))
  }, [usuariosAtuais, busca, filtroFilial, filiaisPorId])

  const indicadores = useMemo(() => {
    const admins = usuariosAtuais.filter(usuario => [
      'Admin',
      'Coordenador',
      'Analista Sênior',
      'Analista Senior',
    ].includes(usuario.cargo)).length
    const indicadoresBase = [
      { label: 'Colaboradores', value: usuariosAtuais.length },
      { label: 'Administradores', value: admins },
      { label: 'Filiais', value: filiaisBase.length },
    ]
    if (!somenteUsuarios) {
      indicadoresBase.splice(2, 0, {
        label: 'Operação do Óleo',
        value: usuariosAtuais.filter(usuario => usuario.filial === FILIAL_OLEO).length,
      })
    }
    return indicadoresBase
  }, [usuariosAtuais, filiaisBase, somenteUsuarios])

  const filialPadrao = usuarioAtual?.filial || filiaisBase[0]?.id || ''

  useEffect(() => {
    if (somenteUsuarios && secaoAtiva !== 'usuarios') setSecaoAtiva('usuarios')
  }, [somenteUsuarios, secaoAtiva])

  useEffect(() => {
    if (editandoUsuario) return
    const filialSelecionadaExiste = funcionario.filial && filiaisBase.some(filial => filial.id === funcionario.filial)
    if (filialSelecionadaExiste || !filialPadrao) return
    setFuncionario(atual => (atual.filial === filialPadrao ? atual : { ...atual, filial: filialPadrao }))
  }, [editandoUsuario, funcionario.filial, filialPadrao, filiaisBase])

  const limparFuncionario = () => {
    setFuncionario({ ...funcionarioVazio, filial: filialPadrao })
    setEditandoUsuario(null)
    setMensagem('')
    setSecaoAtiva('usuarios')
  }

  const iniciarEdicao = (usuario) => {
    setSecaoAtiva('usuarios')
    setEditandoUsuario(usuario.usuario)
    setMensagem('')
    setFuncionario({
      usuario: usuario.usuario,
      senha: '',
      nome: usuario.nome || '',
      cargo: usuario.cargo || 'Operador',
      filial: usuario.filial || filialPadrao,
    })
  }

  const atualizarFuncionario = (campo, valor) => {
    setMensagem('')
    setFuncionario(atual => ({ ...atual, [campo]: valor }))
  }

  const selecionarFilial = (filial) => atualizarFuncionario('filial', filial)

  const salvarFuncionario = async (event) => {
    event?.preventDefault()
    if (submitGuard.current || salvando) return false

    const dados = {
      ...funcionario,
      nome: String(funcionario.nome || '').trim(),
      usuario: normalizarLogin(funcionario.usuario),
    }
    const erro = validarFuncionario(dados, editandoUsuario, usuariosAtuais)
    if (erro) {
      setMensagem(erro)
      return false
    }

    submitGuard.current = true
    setSalvando(true)
    setMensagem('')
    try {
      let ok = false
      if (editandoUsuario) {
        if (typeof editarUsuario !== 'function') {
          setMensagem('Não foi possível salvar este usuário agora.')
          return false
        }
        ok = await editarUsuario(editandoUsuario, dados)
      } else {
        if (typeof criarUsuario !== 'function') {
          setMensagem('Não foi possível criar este usuário agora.')
          return false
        }
        ok = await criarUsuario(dados)
      }

      if (!ok) {
        setMensagem('Não foi possível salvar o usuário. Verifique os dados e tente novamente.')
        return false
      }
      limparFuncionario()
      return true
    } catch {
      setMensagem('Não foi possível salvar o usuário. Tente novamente.')
      return false
    } finally {
      setSalvando(false)
      submitGuard.current = false
    }
  }

  const adicionarFilial = () => {
    if (criarFilial(novaFilial)) setNovaFilial({ id: '', nome: '', cidade: '', estado: '' })
  }

  const aplicarOleoNoUsuario = () => selecionarFilial(FILIAL_OLEO)
  const usuarioProtegido = (login) => (
    login === ADMIN_USERNAME
    || login?.toLowerCase() === usuarioAtual?.usuario?.toLowerCase()
  )

  if (!podeAdministrar(usuarioAtual)) {
    return (
      <section className="aba active users-pro-page" aria-labelledby="admin-access-title">
        <div className="users-pro-card">
          <h2 id="admin-access-title">Acesso restrito</h2>
          <p>Esta área é exclusiva para administradores do painel.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="aba active users-pro-page">
      <div className="users-pro-hero">
        <div>
          <span className="users-pro-eyebrow">Administração</span>
          <h2>Painel admin</h2>
          <p>Criar e gerenciar acessos do painel</p>
        </div>
        <button type="button" className="users-pro-ghost" onClick={limparFuncionario} disabled={salvando}>Novo usuário</button>
      </div>

      <div className="users-pro-kpis">
        {indicadores.map(item => (
          <div key={item.label} className="users-pro-kpi"><span>{item.label}</span><strong>{item.value}</strong></div>
        ))}
      </div>

      {!somenteUsuarios && (
        <div className="users-pro-tabs">
          {SECOES_ADMIN.map(([id, label, desc]) => (
            <button type="button" key={id} className={secaoAtiva === id ? 'active' : ''} onClick={() => setSecaoAtiva(id)}>
              <strong>{label}</strong>
              <span>{desc}</span>
            </button>
          ))}
        </div>
      )}

      {(somenteUsuarios || secaoAtiva === 'usuarios') && (
        <div className="users-pro-admin-stack">
          <div className="users-pro-grid users-pro-grid-main">
            <div className="users-pro-card users-pro-form-card">
              <div className="users-pro-card-head">
                <div>
                  <h3>{editandoUsuario ? 'Editar usuário' : 'Novo usuário'}</h3>
                  <p>{editandoUsuario ? `Editando acesso de ${editandoUsuario}` : 'Cadastre nome, login, senha, cargo e filial.'}</p>
                </div>
                {editandoUsuario && (
                  <button type="button" className="users-pro-ghost small" onClick={limparFuncionario} disabled={salvando}>Cancelar</button>
                )}
              </div>
              <form onSubmit={salvarFuncionario} noValidate aria-busy={salvando}>
                <div className="users-pro-form">
                  <label htmlFor="admin-user-name">
                    <span>Nome</span>
                    <input id="admin-user-name" name="nome" autoComplete="name" value={funcionario.nome} onChange={event => atualizarFuncionario('nome', event.target.value)} placeholder="Nome completo" disabled={salvando} aria-required="true" />
                  </label>
                  <label htmlFor="admin-user-login">
                    <span>Login</span>
                    <input id="admin-user-login" name="usuario" autoComplete="username" disabled={salvando || !!editandoUsuario} value={funcionario.usuario} onChange={event => atualizarFuncionario('usuario', normalizarLogin(event.target.value))} placeholder="usuario" aria-required="true" />
                  </label>
                  <label htmlFor="admin-user-password">
                    <span>{editandoUsuario ? 'Senha inicial (opcional)' : 'Senha inicial'}</span>
                    <input id="admin-user-password" name="senha" type="password" autoComplete="new-password" minLength={8} maxLength={128} value={funcionario.senha} onChange={event => atualizarFuncionario('senha', event.target.value)} placeholder={editandoUsuario ? 'Deixe vazio para manter' : 'Mínimo de 8 caracteres'} disabled={salvando} aria-required={!editandoUsuario} />
                  </label>
                  <label htmlFor="admin-user-role">
                    <span>Cargo</span>
                    <select id="admin-user-role" name="cargo" value={funcionario.cargo} onChange={event => atualizarFuncionario('cargo', event.target.value)} disabled={salvando} aria-required="true">
                      {CARGOS.map(cargo => <option key={cargo} value={cargo}>{cargo}</option>)}
                    </select>
                  </label>
                </div>
                <label className="users-pro-filial-box" htmlFor="admin-user-branch">
                  <span>Filial</span>
                  <select id="admin-user-branch" name="filial" value={funcionario.filial} onChange={event => selecionarFilial(event.target.value)} disabled={salvando} aria-required="true">
                    <option value="">Selecione uma filial</option>
                    {filiaisBase.map(filial => <option key={filial.id} value={filial.id}>{rotuloFilial(filial)}</option>)}
                  </select>
                  {!somenteUsuarios && (
                    <div className="users-pro-tags" aria-label="Atalhos de filial">
                      {filiaisBase.map(filial => (
                        <button type="button" key={filial.id} className={funcionario.filial === filial.id ? 'active' : ''} onClick={() => selecionarFilial(filial.id)} disabled={salvando}>
                          {rotuloFilial(filial)}
                        </button>
                      ))}
                    </div>
                  )}
                </label>
                {mensagem && <p className="users-pro-feedback" role="alert" aria-live="assertive" style={{ color: '#fecaca', fontSize: 12, margin: '12px 0 0' }}>{mensagem}</p>}
                <div className="users-pro-actions">
                  <button type="submit" className="users-pro-primary" disabled={salvando}>
                    {salvando ? 'Salvando…' : editandoUsuario ? 'Salvar alterações' : 'Criar usuário'}
                  </button>
                  {!somenteUsuarios && <button type="button" className="users-pro-ghost" onClick={aplicarOleoNoUsuario} disabled={salvando}>Marcar como óleo</button>}
                </div>
              </form>
            </div>

            {!somenteUsuarios && (
              <div className="users-pro-card users-pro-rules-card">
                <div className="users-pro-card-head"><div><h3>Resumo rápido</h3><p>Atalhos administrativos sem funções operacionais.</p></div></div>
                <div className="users-pro-rule-list">
                  <button type="button" onClick={() => setSecaoAtiva('filiais')}><strong>Gerenciar filiais</strong><span>Criar ou remover locais de operação.</span></button>
                  <button type="button" onClick={() => setSecaoAtiva('localizacao')}><strong>Localização de acesso</strong><span>Configurar controles por região.</span></button>
                  <button type="button" onClick={() => setSecaoAtiva('regras')}><strong>Ver regras</strong><span>Entender o que cada perfil acessa.</span></button>
                </div>
              </div>
            )}
          </div>

          <div className="users-pro-card">
            <div className="users-pro-card-head users-pro-list-head">
              <div><h3>Usuários</h3><p>{funcionariosFiltrados.length} registro(s) encontrado(s)</p></div>
              <div className="users-pro-filters">
                <input aria-label="Buscar usuários" value={busca} onChange={event => setBusca(event.target.value)} placeholder="Buscar usuário..." />
                <select aria-label="Filtrar usuários por filial" value={filtroFilial} onChange={event => setFiltroFilial(event.target.value)}>
                  <option value="">Todas as filiais</option>
                  {filiaisBase.map(filial => <option key={filial.id} value={filial.id}>{rotuloFilial(filial)}</option>)}
                </select>
              </div>
            </div>
            <div className="users-pro-table-wrap">
              <table className="users-pro-table">
                <thead>
                  <tr>
                    <th>Usuário</th>
                    <th>Login</th>
                    <th>Cargo</th>
                    <th>Filial</th>
                    {!somenteUsuarios && <th>Etiqueta</th>}
                    <th style={{ textAlign: 'right' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {funcionariosFiltrados.map(usuario => (
                    <tr key={usuario.usuario}>
                      <td><div className="users-pro-person"><span>{usuario.avatar || iniciais(usuario.nome)}</span><strong>{usuario.nome}</strong></div></td>
                      <td>{usuario.usuario}</td>
                      <td><span className="users-pro-chip muted">{usuario.cargo}</span></td>
                      <td>{rotuloFilial(filiaisPorId.get(usuario.filial) || usuario.filial)}</td>
                      {!somenteUsuarios && <td>{usuario.filial === FILIAL_OLEO ? <span className="users-pro-chip oil">Óleo</span> : <span className="users-pro-chip">Padrão</span>}</td>}
                      <td>
                        <div className="users-pro-row-actions">
                          <button type="button" onClick={() => iniciarEdicao(usuario)} disabled={salvando}>Editar</button>
                          {!usuarioProtegido(usuario.usuario) && (
                            <button type="button" className="danger" disabled={salvando} onClick={() => window.confirm(`Excluir ${usuario.usuario}?`) && excluirUsuario(usuario.usuario)}>Excluir</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {funcionariosFiltrados.length === 0 && <tr><td colSpan={somenteUsuarios ? 5 : 6} className="users-pro-empty">Nenhum usuário encontrado.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {!somenteUsuarios && secaoAtiva === 'filiais' && (
        <div className="users-pro-card">
          <div className="users-pro-card-head users-pro-list-head"><div><h3>Filiais</h3><p>{filiaisBase.length} filial(is) cadastrada(s)</p></div></div>
          <div className="users-pro-branch-grid">{filiaisBase.map(filial => <div key={filial.id} className="users-pro-branch"><div><strong>{rotuloFilial(filial)}</strong><span>{filial.cidade}{filial.estado ? ` · ${filial.estado}` : ''}</span><code>{filial.id}</code></div>{filial.id !== 'jatai-go' && filial.id !== 'mineiros-go' && filial.id !== FILIAL_OLEO && <button type="button" className="danger" onClick={() => window.confirm(`Excluir filial ${rotuloFilial(filial)}?`) && excluirFilial(filial.id)}>Excluir</button>}</div>)}</div>
          <div className="users-pro-form branch-form"><label htmlFor="admin-branch-id"><span>ID da filial</span><input id="admin-branch-id" value={novaFilial.id} onChange={event => setNovaFilial(atual => ({ ...atual, id: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') }))} placeholder="ex: jatai-go" /></label><label htmlFor="admin-branch-name"><span>Nome</span><input id="admin-branch-name" value={novaFilial.nome} onChange={event => setNovaFilial(atual => ({ ...atual, nome: event.target.value }))} placeholder="Via Log Jataí" /></label><label htmlFor="admin-branch-city"><span>Cidade</span><input id="admin-branch-city" value={novaFilial.cidade} onChange={event => setNovaFilial(atual => ({ ...atual, cidade: event.target.value }))} placeholder="Jataí" /></label><label htmlFor="admin-branch-state"><span>Estado</span><input id="admin-branch-state" value={novaFilial.estado} onChange={event => setNovaFilial(atual => ({ ...atual, estado: event.target.value.toUpperCase() }))} placeholder="GO" maxLength={2} /></label></div>
          <button type="button" className="users-pro-primary slim" onClick={adicionarFilial}>Adicionar filial</button>
        </div>
      )}

      {!somenteUsuarios && secaoAtiva === 'localizacao' && <AccessLocationPanel />}

      {!somenteUsuarios && secaoAtiva === 'regras' && (
        <div className="users-pro-card users-pro-rules-card">
          <div className="users-pro-card-head"><div><h3>Regra de acesso</h3><p>Separação de dados por filial e cargo.</p></div></div>
          <div className="users-pro-rule-list">
            <div><strong>Usuário comum</strong><span>Visualiza e opera somente os registros da filial configurada.</span></div>
            <div><strong>Usuário do Óleo</strong><span>Acessa somente registros vinculados à filial <code>oleo</code>.</span></div>
            <div><strong>Admin geral</strong><span>Administra colaboradores, filiais, localização e permissões. Não lança estadia por aqui.</span></div>
          </div>
        </div>
      )}
    </section>
  )
}

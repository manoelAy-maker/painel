import { useMemo, useState } from 'react'
import { nomeFilial } from '../data/filiais'
import { useApp } from '../context/AppContext'
import { ADMIN_USERNAME } from '../data/defaultUsers'
import AccessLocationPanel from '../components/AccessLocationPanel'
import '../admin-users-pro.css'

const FILIAL_OLEO = 'oleo'
const CARGOS = ['Operador', 'Visualizador', 'Analista Júnior', 'Analista Pleno', 'Analista Sênior', 'Coordenador', 'Admin']
const SECOES_ADMIN = [
  ['usuarios', 'Usuários', 'Criar e editar acessos'],
  ['filiais', 'Filiais', 'Organizar locais de operação'],
  ['localizacao', 'Localização', 'Auditar acessos por região'],
  ['regras', 'Permissões', 'Consultar regras dos perfis'],
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

const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 6 9 17l-5-5" />
  </svg>
)

export default function Admin() {
  const {
    criarUsuario,
    editarUsuario,
    usuarios,
    excluirUsuario,
    filiais,
    criarFilial,
    excluirFilial,
    usuarioAtual,
    cloudStatus,
  } = useApp()

  const filiaisBase = useMemo(() => {
    const base = filiais?.length ? filiais : [
      { id: 'jatai-go', nome: 'Jataí', cidade: 'Jataí', estado: 'GO' },
      { id: FILIAL_OLEO, nome: 'Operação do Óleo', cidade: 'Jataí', estado: 'GO' },
    ]
    const existeOleo = base.some(f => f.id === FILIAL_OLEO)
    return existeOleo ? base : [...base, { id: FILIAL_OLEO, nome: 'Operação do Óleo', cidade: 'Jataí', estado: 'GO' }]
  }, [filiais])

  const filialPadrao = useMemo(() => {
    const preferida = usuarioAtual?.filial
    if (preferida && filiaisBase.some(f => f.id === preferida)) return preferida
    return filiaisBase[0]?.id || 'jatai-go'
  }, [usuarioAtual?.filial, filiaisBase])

  const [secaoAtiva, setSecaoAtiva] = useState('usuarios')
  const [novaFilial, setNovaFilial] = useState({ id: '', nome: '', cidade: '', estado: '' })
  const [funcionario, setFuncionario] = useState(() => novoFuncionario(filialPadrao))
  const [editandoUsuario, setEditandoUsuario] = useState(null)
  const [busca, setBusca] = useState('')
  const [filtroFilial, setFiltroFilial] = useState('')
  const [salvandoUsuario, setSalvandoUsuario] = useState(false)
  const [feedback, setFeedback] = useState(null)

  const funcionariosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return (usuarios || [])
      .filter(u => !filtroFilial || u.filial === filtroFilial)
      .filter(u => !termo || [u.nome, u.usuario, u.cargo, nomeFilial(u.filial), u.filial].join(' ').toLowerCase().includes(termo))
      .sort((a, b) => String(a.nome || '').localeCompare(String(b.nome || '')))
  }, [usuarios, busca, filtroFilial])

  const indicadores = useMemo(() => {
    const lista = usuarios || []
    const admins = lista.filter(u => ['Admin', 'Coordenador', 'Analista Sênior', 'Analista Senior'].includes(u.cargo)).length
    const oleo = lista.filter(u => u.filial === FILIAL_OLEO).length
    return [
      { label: 'Colaboradores', value: lista.length, hint: 'acessos ativos' },
      { label: 'Administradores', value: admins, hint: 'gestão liberada' },
      { label: 'Operação do Óleo', value: oleo, hint: 'perfil segmentado' },
      { label: 'Filiais', value: filiaisBase.length, hint: 'locais disponíveis' },
    ]
  }, [usuarios, filiaisBase])

  const limparFuncionario = () => {
    setFuncionario(novoFuncionario(filialPadrao))
    setEditandoUsuario(null)
    setFeedback(null)
    setSecaoAtiva('usuarios')
  }

  const iniciarEdicao = (u) => {
    setSecaoAtiva('usuarios')
    setEditandoUsuario(u.usuario)
    setFeedback(null)
    setFuncionario({
      usuario: u.usuario,
      senha: '',
      nome: u.nome || '',
      cargo: u.cargo || 'Operador',
      filial: filiaisBase.some(f => f.id === u.filial) ? u.filial : filialPadrao,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const selecionarFilial = (filial) => {
    setFuncionario(p => ({ ...p, filial }))
    setFeedback(null)
  }

  const salvarFuncionario = async (e) => {
    e?.preventDefault()
    if (salvandoUsuario) return

    const dados = {
      ...funcionario,
      nome: funcionario.nome.trim(),
      usuario: normalizarLogin(funcionario.usuario),
      senha: funcionario.senha.trim(),
    }

    if (!dados.nome) {
      setFeedback({ tipo: 'erro', texto: 'Informe o nome do colaborador.' })
      return
    }
    if (!dados.filial) {
      setFeedback({ tipo: 'erro', texto: 'Selecione a filial do colaborador.' })
      return
    }
    if (!dados.cargo) {
      setFeedback({ tipo: 'erro', texto: 'Selecione o cargo do colaborador.' })
      return
    }
    if (!editandoUsuario && !dados.usuario) {
      setFeedback({ tipo: 'erro', texto: 'Informe um login válido, usando letras e números.' })
      return
    }
    if (!editandoUsuario && dados.senha.length < 4) {
      setFeedback({ tipo: 'erro', texto: 'A senha inicial precisa ter pelo menos 4 caracteres.' })
      return
    }

    setSalvandoUsuario(true)
    setFeedback({ tipo: 'info', texto: editandoUsuario ? 'Salvando alterações...' : 'Criando acesso no Supabase...' })

    try {
      const ok = editandoUsuario
        ? await editarUsuario(editandoUsuario, dados)
        : await criarUsuario(dados)

      if (!ok) {
        setFeedback({ tipo: 'erro', texto: 'Não foi possível salvar. Confira se o login já existe e tente novamente.' })
        return
      }

      setEditandoUsuario(null)
      setFuncionario(novoFuncionario(filialPadrao))
      setFeedback({ tipo: 'sucesso', texto: editandoUsuario ? 'Colaborador atualizado com sucesso.' : 'Colaborador criado e liberado para login.' })
    } catch (error) {
      setFeedback({ tipo: 'erro', texto: error?.message || 'Falha ao salvar o colaborador.' })
    } finally {
      setSalvandoUsuario(false)
    }
  }

  const adicionarFilial = () => {
    if (criarFilial(novaFilial)) setNovaFilial({ id: '', nome: '', cidade: '', estado: '' })
  }

  return (
    <section className="aba active users-pro-page">
      <div className="users-pro-hero">
        <div className="users-pro-hero-copy">
          <span className="users-pro-eyebrow">Central administrativa</span>
          <h2>Usuários e permissões</h2>
          <p>Crie acessos, defina cargos e mantenha cada colaborador vinculado à filial correta.</p>
        </div>
        <div className="users-pro-hero-actions">
          <span className={`users-pro-cloud ${cloudStatus || 'offline'}`}>
            <i />{cloudStatus === 'online' ? 'Supabase conectado' : cloudStatus === 'syncing' ? 'Sincronizando' : 'Verificando nuvem'}
          </span>
          <button type="button" className="users-pro-primary new-user" onClick={limparFuncionario}>+ Novo colaborador</button>
        </div>
      </div>

      <div className="users-pro-kpis">
        {indicadores.map(item => (
          <div key={item.label} className="users-pro-kpi">
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <small>{item.hint}</small>
          </div>
        ))}
      </div>

      <div className="users-pro-tabs">
        {SECOES_ADMIN.map(([id, label, desc]) => (
          <button type="button" key={id} className={secaoAtiva === id ? 'active' : ''} onClick={() => setSecaoAtiva(id)}>
            <strong>{label}</strong>
            <span>{desc}</span>
          </button>
        ))}
      </div>

      {secaoAtiva === 'usuarios' && (
        <div className="users-pro-admin-stack">
          <div className="users-pro-grid users-pro-grid-main">
            <form className="users-pro-card users-pro-form-card" onSubmit={salvarFuncionario}>
              <div className="users-pro-card-head">
                <div>
                  <span className="users-pro-section-tag">Cadastro de acesso</span>
                  <h3>{editandoUsuario ? 'Editar colaborador' : 'Novo colaborador'}</h3>
                  <p>{editandoUsuario ? `Atualizando o acesso de ${editandoUsuario}.` : 'Preencha os dados abaixo para liberar um novo login.'}</p>
                </div>
                {editandoUsuario && <button type="button" className="users-pro-ghost small" onClick={limparFuncionario}>Cancelar edição</button>}
              </div>

              <div className="users-pro-form-intro">
                <span className="users-pro-step">1</span>
                <div><strong>Dados pessoais e login</strong><p>O login será convertido automaticamente para letras minúsculas.</p></div>
              </div>

              <div className="users-pro-form">
                <label className="wide"><span>Nome completo</span><input value={funcionario.nome} onChange={e => { setFuncionario(p => ({ ...p, nome: e.target.value })); setFeedback(null) }} placeholder="Ex: João da Silva" autoFocus /></label>
                <label><span>Login</span><input disabled={!!editandoUsuario} value={funcionario.usuario} onChange={e => { setFuncionario(p => ({ ...p, usuario: normalizarLogin(e.target.value) })); setFeedback(null) }} placeholder="ex: joao.silva" autoComplete="off" /></label>
                <label><span>{editandoUsuario ? 'Nova senha opcional' : 'Senha inicial'}</span><input type="password" value={funcionario.senha} onChange={e => { setFuncionario(p => ({ ...p, senha: e.target.value })); setFeedback(null) }} placeholder={editandoUsuario ? 'Vazio mantém a senha atual' : 'Mínimo de 4 caracteres'} autoComplete="new-password" /></label>
                <label><span>Cargo</span><select value={funcionario.cargo} onChange={e => { setFuncionario(p => ({ ...p, cargo: e.target.value })); setFeedback(null) }}>{CARGOS.map(cargo => <option key={cargo}>{cargo}</option>)}</select></label>
                <label><span>Filial principal</span><select value={funcionario.filial} onChange={e => selecionarFilial(e.target.value)}>{filiaisBase.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}</select></label>
              </div>

              <div className="users-pro-form-intro access-step">
                <span className="users-pro-step">2</span>
                <div><strong>Etiqueta de acesso</strong><p>Confirme onde esse usuário poderá trabalhar e visualizar registros.</p></div>
              </div>

              <div className="users-pro-filial-box">
                <div className="users-pro-label-row">
                  <span>Filial selecionada</span>
                  <b>{filiaisBase.find(f => f.id === funcionario.filial)?.nome || 'Selecione uma filial'}</b>
                </div>
                <div className="users-pro-tags">
                  {filiaisBase.map(f => (
                    <button type="button" key={f.id} className={funcionario.filial === f.id ? 'active' : ''} onClick={() => selecionarFilial(f.id)}>
                      {funcionario.filial === f.id && <CheckIcon />}{f.id === FILIAL_OLEO ? 'Operação do Óleo' : f.nome}
                    </button>
                  ))}
                </div>
              </div>

              {feedback && <div className={`users-pro-feedback ${feedback.tipo}`}>{feedback.texto}</div>}

              <div className="users-pro-actions">
                <button type="submit" className="users-pro-primary save-user" disabled={salvandoUsuario}>
                  {salvandoUsuario ? 'Salvando...' : editandoUsuario ? 'Salvar alterações' : 'Criar colaborador'}
                </button>
                <button type="button" className="users-pro-ghost" onClick={() => selecionarFilial(FILIAL_OLEO)}>Usar perfil do óleo</button>
              </div>
            </form>

            <aside className="users-pro-card users-pro-guide-card">
              <div className="users-pro-guide-icon">A</div>
              <span className="users-pro-section-tag">Antes de liberar</span>
              <h3>Checklist do acesso</h3>
              <p>Um cadastro completo evita usuário sem filial e registros aparecendo no local errado.</p>
              <div className="users-pro-checklist">
                <div><CheckIcon /><span><strong>Login único</strong><small>Use nome ou nome.sobrenome.</small></span></div>
                <div><CheckIcon /><span><strong>Cargo correto</strong><small>Admin e coordenação enxergam mais áreas.</small></span></div>
                <div><CheckIcon /><span><strong>Filial obrigatória</strong><small>Agora o formulário já inicia com uma selecionada.</small></span></div>
              </div>
              <div className="users-pro-guide-note"><strong>Dica</strong><span>Depois de criar, o novo colaborador aparece imediatamente na lista abaixo.</span></div>
            </aside>
          </div>

          <div className="users-pro-card users-pro-list-card">
            <div className="users-pro-card-head users-pro-list-head">
              <div><span className="users-pro-section-tag">Equipe cadastrada</span><h3>Colaboradores</h3><p>{funcionariosFiltrados.length} registro(s) encontrado(s)</p></div>
              <div className="users-pro-filters">
                <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar nome, login ou cargo..." />
                <select value={filtroFilial} onChange={e => setFiltroFilial(e.target.value)}><option value="">Todas as filiais</option>{filiaisBase.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}</select>
              </div>
            </div>
            <div className="users-pro-table-wrap">
              <table className="users-pro-table">
                <thead><tr><th>Colaborador</th><th>Login</th><th>Cargo</th><th>Filial</th><th>Perfil</th><th style={{ textAlign: 'right' }}>Ações</th></tr></thead>
                <tbody>
                  {funcionariosFiltrados.map(u => (
                    <tr key={u.usuario}>
                      <td><div className="users-pro-person"><span>{u.avatar || iniciais(u.nome)}</span><strong>{u.nome}</strong></div></td>
                      <td><code className="users-pro-login">{u.usuario}</code></td>
                      <td><span className="users-pro-chip muted">{u.cargo}</span></td>
                      <td>{nomeFilial(u.filial)}</td>
                      <td>{u.filial === FILIAL_OLEO ? <span className="users-pro-chip oil">Óleo</span> : <span className="users-pro-chip">Padrão</span>}</td>
                      <td><div className="users-pro-row-actions"><button type="button" onClick={() => iniciarEdicao(u)}>Editar</button>{u.usuario !== ADMIN_USERNAME && <button type="button" className="danger" onClick={() => confirm(`Excluir ${u.usuario}?`) && excluirUsuario(u.usuario)}>Excluir</button>}</div></td>
                    </tr>
                  ))}
                  {funcionariosFiltrados.length === 0 && <tr><td colSpan={6} className="users-pro-empty">Nenhum colaborador encontrado.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {secaoAtiva === 'filiais' && (
        <div className="users-pro-card users-pro-branches-card">
          <div className="users-pro-card-head users-pro-list-head"><div><span className="users-pro-section-tag">Estrutura</span><h3>Filiais</h3><p>{filiaisBase.length} filial(is) cadastrada(s)</p></div></div>
          <div className="users-pro-branch-grid">{filiaisBase.map(f => <div key={f.id} className="users-pro-branch"><div><strong>{f.nome}</strong><span>{f.cidade}{f.estado ? ` · ${f.estado}` : ''}</span><code>{f.id}</code></div>{f.id !== 'jatai-go' && f.id !== 'mineiros-go' && f.id !== FILIAL_OLEO && <button type="button" className="danger" onClick={() => confirm(`Excluir filial ${f.nome}?`) && excluirFilial(f.id)}>Excluir</button>}</div>)}</div>
          <div className="users-pro-form branch-form"><label><span>ID da filial</span><input value={novaFilial.id} onChange={e => setNovaFilial(p => ({ ...p, id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') }))} placeholder="ex: jatai-go" /></label><label><span>Nome</span><input value={novaFilial.nome} onChange={e => setNovaFilial(p => ({ ...p, nome: e.target.value }))} placeholder="Via Log Jataí" /></label><label><span>Cidade</span><input value={novaFilial.cidade} onChange={e => setNovaFilial(p => ({ ...p, cidade: e.target.value }))} placeholder="Jataí" /></label><label><span>Estado</span><input value={novaFilial.estado} onChange={e => setNovaFilial(p => ({ ...p, estado: e.target.value.toUpperCase() }))} placeholder="GO" maxLength={2} /></label></div>
          <button type="button" className="users-pro-primary slim" onClick={adicionarFilial}>Adicionar filial</button>
        </div>
      )}

      {secaoAtiva === 'localizacao' && <AccessLocationPanel />}

      {secaoAtiva === 'regras' && (
        <div className="users-pro-card users-pro-permissions-card">
          <div className="users-pro-card-head"><div><span className="users-pro-section-tag">Segurança</span><h3>Regras de acesso</h3><p>Separação dos dados conforme filial e responsabilidade.</p></div></div>
          <div className="users-pro-rule-list">
            <div><strong>Usuário comum</strong><span>Visualiza e opera somente os registros da filial configurada.</span></div>
            <div><strong>Usuário do Óleo</strong><span>Acessa somente registros vinculados à filial <code>oleo</code>.</span></div>
            <div><strong>Admin geral</strong><span>Administra colaboradores, filiais, localização e permissões.</span></div>
          </div>
        </div>
      )}
    </section>
  )
}

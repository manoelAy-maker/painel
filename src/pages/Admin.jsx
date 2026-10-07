import { useMemo, useState } from 'react'
import { nomeFilial } from '../data/filiais'
import { useApp } from '../context/AppContext'
import { ADMIN_USERNAME } from '../data/defaultUsers'
import AccessLocationPanel from '../components/AccessLocationPanel'
import '../admin-users-pro.css'

const FILIAL_OLEO = 'oleo'
const funcionarioVazio = { usuario: '', senha: '', nome: '', cargo: 'Operador', filial: 'jatai-go' }
const CARGOS = ['Operador', 'Visualizador', 'Analista Júnior', 'Analista Pleno', 'Analista Sênior', 'Coordenador', 'Admin']
const SECOES_ADMIN = [
  ['usuarios', 'Usuários', 'Criar e editar acessos'],
  ['filiais', 'Filiais', 'Separar operação por local'],
  ['localizacao', 'Localização', 'Regras de acesso por região'],
  ['regras', 'Regras', 'Resumo das permissões'],
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

export default function Admin() {
  const { criarUsuario, editarUsuario, usuarios, excluirUsuario, filiais, criarFilial, excluirFilial } = useApp()
  const [secaoAtiva, setSecaoAtiva] = useState('usuarios')
  const [novaFilial, setNovaFilial] = useState({ id: '', nome: '', cidade: '', estado: '' })
  const [funcionario, setFuncionario] = useState(funcionarioVazio)
  const [editandoUsuario, setEditandoUsuario] = useState(null)
  const [busca, setBusca] = useState('')
  const [filtroFilial, setFiltroFilial] = useState('')

  const filiaisBase = useMemo(() => {
    const base = filiais?.length ? filiais : [
      { id: 'jatai-go', nome: 'Jataí', cidade: 'Jataí', estado: 'GO' },
      { id: FILIAL_OLEO, nome: 'Operação do Óleo', cidade: 'Jataí', estado: 'GO' },
    ]
    const existeOleo = base.some(f => f.id === FILIAL_OLEO)
    return existeOleo ? base : [...base, { id: FILIAL_OLEO, nome: 'Operação do Óleo', cidade: 'Jataí', estado: 'GO' }]
  }, [filiais])

  const funcionariosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return usuarios
      .filter(u => !filtroFilial || u.filial === filtroFilial)
      .filter(u => !termo || [u.nome, u.usuario, u.cargo, nomeFilial(u.filial), u.filial].join(' ').toLowerCase().includes(termo))
      .sort((a, b) => String(a.nome || '').localeCompare(String(b.nome || '')))
  }, [usuarios, busca, filtroFilial])

  const indicadores = useMemo(() => {
    const admins = usuarios.filter(u => ['Admin', 'Coordenador', 'Analista Sênior', 'Analista Senior'].includes(u.cargo)).length
    const oleo = usuarios.filter(u => u.filial === FILIAL_OLEO).length
    return [
      { label: 'Colaboradores', value: usuarios.length },
      { label: 'Administradores', value: admins },
      { label: 'Operação do Óleo', value: oleo },
      { label: 'Filiais', value: filiaisBase.length },
    ]
  }, [usuarios, filiaisBase])

  const limparFuncionario = () => {
    setFuncionario({ ...funcionarioVazio, filial: filiaisBase[0]?.id || 'jatai-go' })
    setEditandoUsuario(null)
    setSecaoAtiva('usuarios')
  }

  const iniciarEdicao = (u) => {
    setSecaoAtiva('usuarios')
    setEditandoUsuario(u.usuario)
    setFuncionario({
      usuario: u.usuario,
      senha: '',
      nome: u.nome || '',
      cargo: u.cargo || 'Operador',
      filial: u.filial || 'jatai-go',
    })
  }

  const selecionarFilial = (filial) => setFuncionario(p => ({ ...p, filial }))

  const salvarFuncionario = async () => {
    if (!funcionario.nome.trim() || !funcionario.filial || !funcionario.cargo) { alert('Preencha nome, cargo e filial.'); return }
    if (editandoUsuario) { const ok = await editarUsuario(editandoUsuario, funcionario); if (ok) limparFuncionario(); return }
    if (!funcionario.usuario.trim() || !funcionario.senha.trim()) { alert('Preencha login e senha para criar o colaborador.'); return }
    const ok = await criarUsuario({ ...funcionario, usuario: normalizarLogin(funcionario.usuario) })
    if (ok) limparFuncionario()
  }

  const adicionarFilial = () => {
    if (criarFilial(novaFilial)) setNovaFilial({ id: '', nome: '', cidade: '', estado: '' })
  }

  const aplicarOleoNoUsuario = () => selecionarFilial(FILIAL_OLEO)

  return (
    <section className="aba active users-pro-page">
      <div className="users-pro-hero">
        <div>
          <span className="users-pro-eyebrow">Administração</span>
          <h2>Painel admin</h2>
          <p>Área exclusiva para configurar acessos, filiais, localização e permissões. Operação diária fica fora daqui.</p>
        </div>
        <button className="users-pro-ghost" onClick={limparFuncionario}>Novo colaborador</button>
      </div>

      <div className="users-pro-kpis">{indicadores.map(item => <div key={item.label} className="users-pro-kpi"><span>{item.label}</span><strong>{item.value}</strong></div>)}</div>

      <div className="users-pro-tabs">
        {SECOES_ADMIN.map(([id, label, desc]) => (
          <button key={id} className={secaoAtiva === id ? 'active' : ''} onClick={() => setSecaoAtiva(id)}>
            <strong>{label}</strong>
            <span>{desc}</span>
          </button>
        ))}
      </div>

      {secaoAtiva === 'usuarios' && (
        <div className="users-pro-admin-stack">
          <div className="users-pro-grid users-pro-grid-main">
            <div className="users-pro-card users-pro-form-card">
              <div className="users-pro-card-head">
                <div><h3>{editandoUsuario ? 'Editar colaborador' : 'Novo colaborador'}</h3><p>{editandoUsuario ? `Editando acesso de ${editandoUsuario}` : 'Cadastre login, cargo e filial de atuação.'}</p></div>
                {editandoUsuario && <button className="users-pro-ghost small" onClick={limparFuncionario}>Cancelar</button>}
              </div>
              <div className="users-pro-form">
                <label><span>Nome</span><input value={funcionario.nome} onChange={e => setFuncionario(p => ({ ...p, nome: e.target.value }))} placeholder="Nome completo" /></label>
                <label><span>Login</span><input disabled={!!editandoUsuario} value={funcionario.usuario} onChange={e => setFuncionario(p => ({ ...p, usuario: normalizarLogin(e.target.value) }))} placeholder="usuario" /></label>
                <label><span>{editandoUsuario ? 'Nova senha opcional' : 'Senha'}</span><input type="password" value={funcionario.senha} onChange={e => setFuncionario(p => ({ ...p, senha: e.target.value }))} placeholder={editandoUsuario ? 'Deixe vazio para manter' : 'Senha inicial'} /></label>
                <label><span>Cargo</span><select value={funcionario.cargo} onChange={e => setFuncionario(p => ({ ...p, cargo: e.target.value }))}>{CARGOS.map(cargo => <option key={cargo}>{cargo}</option>)}</select></label>
              </div>
              <div className="users-pro-filial-box">
                <div className="users-pro-label-row"><span>Filial / etiqueta de acesso</span>{funcionario.filial === FILIAL_OLEO && <b>Operação do Óleo</b>}</div>
                <select value={funcionario.filial} onChange={e => selecionarFilial(e.target.value)}><option value="">Selecione...</option>{filiaisBase.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}</select>
                <div className="users-pro-tags">{filiaisBase.map(f => <button key={f.id} className={funcionario.filial === f.id ? 'active' : ''} onClick={() => selecionarFilial(f.id)}>{f.id === FILIAL_OLEO ? 'Operação do Óleo' : f.nome}</button>)}</div>
              </div>
              <div className="users-pro-actions"><button className="users-pro-primary" onClick={salvarFuncionario}>{editandoUsuario ? 'Salvar alterações' : 'Criar colaborador'}</button><button className="users-pro-ghost" onClick={aplicarOleoNoUsuario}>Marcar como óleo</button></div>
            </div>

            <div className="users-pro-card users-pro-rules-card">
              <div className="users-pro-card-head"><div><h3>Resumo rápido</h3><p>Atalhos administrativos sem funções operacionais.</p></div></div>
              <div className="users-pro-rule-list">
                <button type="button" onClick={() => setSecaoAtiva('filiais')}><strong>Gerenciar filiais</strong><span>Criar ou remover locais de operação.</span></button>
                <button type="button" onClick={() => setSecaoAtiva('localizacao')}><strong>Localização de acesso</strong><span>Configurar controles por região.</span></button>
                <button type="button" onClick={() => setSecaoAtiva('regras')}><strong>Ver regras</strong><span>Entender o que cada perfil acessa.</span></button>
              </div>
            </div>
          </div>

          <div className="users-pro-card">
            <div className="users-pro-card-head users-pro-list-head"><div><h3>Colaboradores</h3><p>{funcionariosFiltrados.length} registro(s) encontrado(s)</p></div><div className="users-pro-filters"><input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar colaborador..." /><select value={filtroFilial} onChange={e => setFiltroFilial(e.target.value)}><option value="">Todas as filiais</option>{filiaisBase.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}</select></div></div>
            <div className="users-pro-table-wrap"><table className="users-pro-table"><thead><tr><th>Colaborador</th><th>Login</th><th>Cargo</th><th>Filial</th><th>Etiqueta</th><th style={{ textAlign: 'right' }}>Ações</th></tr></thead><tbody>{funcionariosFiltrados.map(u => <tr key={u.usuario}><td><div className="users-pro-person"><span>{u.avatar || iniciais(u.nome)}</span><strong>{u.nome}</strong></div></td><td>{u.usuario}</td><td><span className="users-pro-chip muted">{u.cargo}</span></td><td>{nomeFilial(u.filial)}</td><td>{u.filial === FILIAL_OLEO ? <span className="users-pro-chip oil">Óleo</span> : <span className="users-pro-chip">Padrão</span>}</td><td><div className="users-pro-row-actions"><button onClick={() => iniciarEdicao(u)}>Editar</button>{u.usuario !== ADMIN_USERNAME && <button className="danger" onClick={() => confirm(`Excluir ${u.usuario}?`) && excluirUsuario(u.usuario)}>Excluir</button>}</div></td></tr>)}{funcionariosFiltrados.length === 0 && <tr><td colSpan={6} className="users-pro-empty">Nenhum colaborador encontrado.</td></tr>}</tbody></table></div>
          </div>
        </div>
      )}

      {secaoAtiva === 'filiais' && (
        <div className="users-pro-card">
          <div className="users-pro-card-head users-pro-list-head"><div><h3>Filiais</h3><p>{filiaisBase.length} filial(is) cadastrada(s)</p></div></div>
          <div className="users-pro-branch-grid">{filiaisBase.map(f => <div key={f.id} className="users-pro-branch"><div><strong>{f.nome}</strong><span>{f.cidade}{f.estado ? ` · ${f.estado}` : ''}</span><code>{f.id}</code></div>{f.id !== 'jatai-go' && f.id !== 'mineiros-go' && f.id !== FILIAL_OLEO && <button className="danger" onClick={() => confirm(`Excluir filial ${f.nome}?`) && excluirFilial(f.id)}>Excluir</button>}</div>)}</div>
          <div className="users-pro-form branch-form"><label><span>ID da filial</span><input value={novaFilial.id} onChange={e => setNovaFilial(p => ({ ...p, id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') }))} placeholder="ex: jatai-go" /></label><label><span>Nome</span><input value={novaFilial.nome} onChange={e => setNovaFilial(p => ({ ...p, nome: e.target.value }))} placeholder="Via Log Jataí" /></label><label><span>Cidade</span><input value={novaFilial.cidade} onChange={e => setNovaFilial(p => ({ ...p, cidade: e.target.value }))} placeholder="Jataí" /></label><label><span>Estado</span><input value={novaFilial.estado} onChange={e => setNovaFilial(p => ({ ...p, estado: e.target.value.toUpperCase() }))} placeholder="GO" maxLength={2} /></label></div>
          <button className="users-pro-primary slim" onClick={adicionarFilial}>Adicionar filial</button>
        </div>
      )}

      {secaoAtiva === 'localizacao' && <AccessLocationPanel />}

      {secaoAtiva === 'regras' && (
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

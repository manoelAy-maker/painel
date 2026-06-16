import { createContext, useContext, useReducer, useEffect, useRef, useCallback } from 'react'
import { defaultUsers, ADMIN_USERNAME } from '../data/defaultUsers'
import { FILIAIS } from '../data/filiais'
import { gerarId, baixarArquivo, dataISOTexto, calcularEstadia } from '../utils/index'
import { podeAdministrar } from '../utils/roles'
import * as sb from '../lib/supabase'
import { deletarFilialV2, deletarProfileV2 } from '../lib/supabaseV2'

const hashSenha = async (senha) => {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(senha + 'ldc2025'))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

const isHash = (s) => /^[a-f0-9]{64}$/.test(s || '')

const load = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback }
}

const chaveRegistro = (item) => String(item?.id || item?.local_id || item?.localId || '')
const dataRegistroMs = (item) => {
  const raw = item?.updated_at || item?.updatedAt || item?.dataLancamento || item?.dataCriacao || item?.dataFinalizado || item?.dataFeito || ''
  const dt = new Date(raw)
  return Number.isNaN(dt.getTime()) ? 0 : dt.getTime()
}

const mesclarRegistros = (locais = [], remotos = []) => {
  const map = new Map()
  locais.forEach(item => {
    const chave = chaveRegistro(item)
    if (chave) map.set(chave, item)
  })
  remotos.forEach(item => {
    const chave = chaveRegistro(item)
    if (chave) map.set(chave, { ...map.get(chave), ...item })
  })
  return [...map.values()].sort((a, b) => dataRegistroMs(b) - dataRegistroMs(a))
}

const initialState = {
  usuarioAtual: load('usuarioLogadoViaLog', null),
  usuarios: load('usuariosPainelViaLog', defaultUsers),
  filiais: load('filiaisViaLog', FILIAIS),
  estadias: load('estadias', []),
  estadiasALancar: load('estadiasALancar', []),
  historico: load('historicoEstadias', []),
  abaAtiva: 'inicio',
  itemParaLancar: null,
  tema: load('temaPainelViaLog', 'dark'),
  somAtivo: load('somPainelViaLog', 'off') === 'on',
  cloudStatus: 'offline',
  cloudText: 'Faça login para conectar.',
  filaNuvem: load('filaSupabaseViaLog', []),
  ultimoSave: load('ultimoSaveSupabaseViaLog', ''),
  usuariosOnline: [],
  activityFeed: [],
  toasts: [],
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_USUARIO': return { ...state, usuarioAtual: action.payload }
    case 'SET_USUARIOS': return { ...state, usuarios: action.payload }
    case 'SET_FILIAIS': return { ...state, filiais: action.payload }
    case 'SET_ESTADIAS': return { ...state, estadias: action.payload }
    case 'SET_A_LANCAR': return { ...state, estadiasALancar: action.payload }
    case 'SET_HISTORICO': return { ...state, historico: action.payload }
    case 'SET_ABA': return { ...state, abaAtiva: action.payload }
    case 'SET_ITEM_LANCAR': return { ...state, itemParaLancar: action.payload }
    case 'SET_TEMA': return { ...state, tema: action.payload }
    case 'SET_SOM': return { ...state, somAtivo: action.payload }
    case 'SET_CLOUD': return { ...state, cloudStatus: action.status, cloudText: action.text }
    case 'SET_FILA': return { ...state, filaNuvem: action.payload }
    case 'SET_ULTIMO_SAVE': return { ...state, ultimoSave: action.payload }
    case 'SET_ONLINE': return { ...state, usuariosOnline: action.payload }
    case 'ADD_FEED': return { ...state, activityFeed: [action.payload, ...state.activityFeed].slice(0, 8) }
    case 'ADD_TOAST': return { ...state, toasts: [...state.toasts, action.payload] }
    case 'REMOVE_TOAST': return { ...state, toasts: state.toasts.filter(t => t.id !== action.id) }
    default: return state
  }
}

const AppCtx = createContext(null)
export const useApp = () => useContext(AppCtx)

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const supabaseOnline = useRef(false)
  const canalRealtime = useRef(null)
  const canalPresenca = useRef(null)
  const recebendoNuvem = useRef(false)
  const conectando = useRef(false)
  const conectarRef = useRef(null)
  const usuarioRef = useRef(initialState.usuarioAtual)
  const stateRef = useRef(initialState)

  useEffect(() => { stateRef.current = state }, [state])
  useEffect(() => { usuarioRef.current = state.usuarioAtual }, [state.usuarioAtual])

  const toast = useCallback((texto, tipo = '') => {
    const id = gerarId()
    dispatch({ type: 'ADD_TOAST', payload: { id, texto, tipo } })
    setTimeout(() => dispatch({ type: 'REMOVE_TOAST', id }), 3800)
  }, [])

  const feed = useCallback((titulo, texto, icone = '⚡') => {
    dispatch({ type: 'ADD_FEED', payload: { titulo, texto, icone, tempo: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) } })
  }, [])

  const setCloud = useCallback((status, text) => {
    dispatch({ type: 'SET_CLOUD', status, text })
  }, [])

  useEffect(() => {
    localStorage.setItem('usuariosPainelViaLog', JSON.stringify(state.usuarios))
    localStorage.setItem('filiaisViaLog', JSON.stringify(state.filiais))
    localStorage.setItem('estadias', JSON.stringify(state.estadias))
    localStorage.setItem('estadiasALancar', JSON.stringify(state.estadiasALancar))
    localStorage.setItem('historicoEstadias', JSON.stringify(state.historico))
  }, [state.usuarios, state.filiais, state.estadias, state.estadiasALancar, state.historico])

  useEffect(() => {
    localStorage.setItem('temaPainelViaLog', state.tema)
    document.documentElement.classList.toggle('dark', state.tema === 'dark')
  }, [state.tema])

  useEffect(() => {
    localStorage.setItem('somPainelViaLog', state.somAtivo ? 'on' : 'off')
  }, [state.somAtivo])

  useEffect(() => {
    localStorage.setItem('filaSupabaseViaLog', JSON.stringify(state.filaNuvem))
  }, [state.filaNuvem])

  const iniciarPresenca = useCallback((usuario) => {
    if (!usuario) return
    if (canalPresenca.current) { canalPresenca.current.unsubscribe(); canalPresenca.current = null }
    try {
      canalPresenca.current = sb.iniciarPresenca(usuario, (ativos) => {
        dispatch({ type: 'SET_ONLINE', payload: ativos })
      })
    } catch {}
  }, [])

  const baixarNuvem = useCallback(async (aviso = true) => {
    if (!navigator.onLine) return false
    try {
      const usuario = usuarioRef.current
      const isAdmin = podeAdministrar(usuario)
      const filial = isAdmin ? null : (usuario?.filial || 'jatai-go')
      const data = await sb.baixarTodos(filial)

      recebendoNuvem.current = true
      const lancadasRemotas = data.filter(x => x.tipo === 'lancada').map(x => x.dados).filter(Boolean)
      const pendentesRemotas = data.filter(x => x.tipo === 'a_lancar').map(x => x.dados).filter(Boolean)
      const lancadas = mesclarRegistros(stateRef.current.estadias, lancadasRemotas)
      const pendentes = mesclarRegistros(stateRef.current.estadiasALancar, pendentesRemotas)
      dispatch({ type: 'SET_ESTADIAS', payload: lancadas })
      dispatch({ type: 'SET_A_LANCAR', payload: pendentes })
      recebendoNuvem.current = false

      if (aviso) toast('Dados baixados da nuvem.', 'ok')
      return true
    } catch (err) {
      recebendoNuvem.current = false
      if (aviso) toast('Erro ao baixar dados da nuvem.', 'warn')
      return false
    }
  }, [toast])

  const sincronizarFila = useCallback(async () => {
    const filaAtual = stateRef.current.filaNuvem
    if (!navigator.onLine || !filaAtual.length) return true

    setCloud('syncing', `Subindo ${filaAtual.length} item(s) offline...`)
    const restante = []
    const client = sb.getClient()

    for (const item of filaAtual) {
      try {
        if (item.acao === 'upsert') await client.from(sb.TABLE).upsert(item.payload, { onConflict: 'local_id' })
        if (item.acao === 'delete') await client.from(sb.TABLE).delete().eq('local_id', String(item.local_id))
      } catch { restante.push(item) }
    }

    dispatch({ type: 'SET_FILA', payload: restante })
    const agora = new Date().toLocaleString('pt-BR')
    localStorage.setItem('ultimoSaveSupabaseViaLog', agora)
    dispatch({ type: 'SET_ULTIMO_SAVE', payload: agora })
    setCloud(restante.length ? 'offline' : 'online', restante.length ? 'Ainda há pendências.' : 'Tudo sincronizado.')
    return restante.length === 0
  }, [setCloud])

  const conectarSupabase = useCallback(async () => {
    if (!navigator.onLine) { setCloud('offline', 'Sem internet.'); return false }
    if (conectando.current) return false
    if (supabaseOnline.current) {
      await baixarNuvem(false)
      return true
    }

    conectando.current = true
    try {
      setCloud('syncing', 'Conectando ao Supabase...')

      // Testa a tabela principal antes de marcar online.
      const carregou = await baixarNuvem(false)
      if (!carregou) throw new Error('Falha ao baixar dados')

      supabaseOnline.current = true

      if (!canalRealtime.current) {
        canalRealtime.current = sb.iniciarRealtime(async () => {
          if (recebendoNuvem.current) return
          await baixarNuvem(false)
          feed('Atualização em tempo real', 'Painel recebeu mudança da nuvem.', '☁️')
          setCloud('online', 'Atualizado em tempo real.')
        })
      }

      await sincronizarFila()
      await baixarNuvem(false)
      setCloud('online', 'Conectado. Salvamento automático ativo.')
      toast('Nuvem conectada.', 'ok')
      return true
    } catch {
      supabaseOnline.current = false
      if (canalRealtime.current) { canalRealtime.current.unsubscribe(); canalRealtime.current = null }
      setCloud('offline', 'Erro na nuvem. Verifique o Supabase.')
      return false
    } finally {
      conectando.current = false
    }
  }, [baixarNuvem, sincronizarFila, setCloud, feed, toast])

  useEffect(() => { conectarRef.current = conectarSupabase }, [conectarSupabase])

  useEffect(() => {
    if (!navigator.onLine) return
    const init = async () => {
      try {
        const remotos = await sb.carregarUsuarios()
        if (remotos.length > 0) dispatch({ type: 'SET_USUARIOS', payload: remotos })
        else for (const u of initialState.usuarios) await sb.salvarUsuario(u).catch(() => {})
      } catch {}

      if (usuarioRef.current) {
        iniciarPresenca(usuarioRef.current)
        conectarRef.current?.()
      }
    }
    init()
  }, [iniciarPresenca])

  useEffect(() => {
    const id = setInterval(() => {
      if (usuarioRef.current && !supabaseOnline.current && navigator.onLine) conectarRef.current?.()
    }, 15000)
    return () => clearInterval(id)
  }, [])

  const salvarNuvem = useCallback(async (item, tipo) => {
    const filial = item?.filial || usuarioRef.current?.filial || 'jatai-go'
    const filaAtual = stateRef.current.filaNuvem

    if (!supabaseOnline.current || !navigator.onLine) {
      dispatch({ type: 'SET_FILA', payload: [...filaAtual, { acao: 'upsert', payload: sb.payload(item, tipo, filial) }] })
      return
    }

    try {
      setCloud('syncing', 'Salvando na nuvem...')
      await sb.salvar(item, tipo, filial)
      const agora = new Date().toLocaleString('pt-BR')
      localStorage.setItem('ultimoSaveSupabaseViaLog', agora)
      dispatch({ type: 'SET_ULTIMO_SAVE', payload: agora })
      setCloud('online', 'Salvo automaticamente.')
    } catch {
      supabaseOnline.current = false
      dispatch({ type: 'SET_FILA', payload: [...filaAtual, { acao: 'upsert', payload: sb.payload(item, tipo, filial) }] })
      setCloud('offline', 'Falhou. Guardado na fila offline.')
    }
  }, [setCloud])

  const deletarNuvem = useCallback(async (id) => {
    const filaAtual = stateRef.current.filaNuvem
    if (!supabaseOnline.current || !navigator.onLine) {
      dispatch({ type: 'SET_FILA', payload: [...filaAtual, { acao: 'delete', local_id: String(id) }] })
      return
    }
    try { await sb.deletar(id) } catch {
      dispatch({ type: 'SET_FILA', payload: [...filaAtual, { acao: 'delete', local_id: String(id) }] })
    }
  }, [])

  const uploadAnexoItem = useCallback(async (file) => {
    if (supabaseOnline.current) {
      try { return await sb.uploadAnexo(file) } catch { toast('Storage falhou. Arquivo local.', 'warn') }
    }
    return sb.uploadAnexoLocal(file)
  }, [toast])

  const entrar = useCallback(async (login, senha) => {
    const usuarios = JSON.parse(localStorage.getItem('usuariosPainelViaLog') || 'null') || stateRef.current.usuarios
    const senhaH = await hashSenha(senha)
    const user = usuarios.find(u => {
      if (u.usuario.toLowerCase() !== login.toLowerCase()) return false
      return isHash(u.senha) ? u.senha === senhaH : u.senha === senha
    })

    if (!user) { toast('Login inválido.', 'err'); return false }

    if (!isHash(user.senha)) {
      const lista = usuarios.map(u => u.usuario === user.usuario ? { ...u, senha: senhaH } : u)
      dispatch({ type: 'SET_USUARIOS', payload: lista })
      try { await sb.salvarUsuario({ ...user, senha: senhaH }) } catch {}
    }

    dispatch({ type: 'SET_USUARIO', payload: user })
    localStorage.setItem('usuarioLogadoViaLog', JSON.stringify(user))
    iniciarPresenca(user)
    setTimeout(() => conectarRef.current?.(), 80)
    feed('Login', `${user.nome} entrou no painel.`, '👤')
    return true
  }, [toast, iniciarPresenca, feed])

  const logout = useCallback(() => {
    localStorage.removeItem('usuarioLogadoViaLog')
    localStorage.removeItem('moduloInicialViaLog')
    dispatch({ type: 'SET_USUARIO', payload: null })
    if (canalPresenca.current) { canalPresenca.current.unsubscribe(); canalPresenca.current = null }
  }, [])

  const verificarSenhaAdmin = useCallback(async (senha) => {
    const usuarios = JSON.parse(localStorage.getItem('usuariosPainelViaLog') || 'null') || stateRef.current.usuarios
    const admin = usuarios.find(u => u.usuario === ADMIN_USERNAME)
    if (!admin) return false
    const senhaH = await hashSenha(senha)
    return isHash(admin.senha) ? admin.senha === senhaH : admin.senha === senha
  }, [])

  const criarUsuario = useCallback(async (dados) => {
    const usuarios = stateRef.current.usuarios
    if (usuarios.some(u => u.usuario === dados.usuario)) { toast('Usuário já existe.', 'err'); return false }
    const avatar = dados.nome.split(' ').filter(Boolean).map(x => x[0]).slice(0, 2).join('').toUpperCase() || dados.usuario.slice(0, 2).toUpperCase()
    const senhaH = await hashSenha(dados.senha)
    const novoUser = { ...dados, senha: senhaH, avatar }
    try { await sb.salvarUsuario(novoUser) } catch { toast('Erro ao salvar usuário na nuvem.', 'warn') }
    dispatch({ type: 'SET_USUARIOS', payload: [...usuarios, novoUser] })
    toast('Usuário criado.', 'ok')
    return true
  }, [toast])

  const editarUsuario = useCallback(async (usuario, dados) => {
    const usuarios = stateRef.current.usuarios
    const atual = usuarios.find(u => u.usuario === usuario)
    if (!atual) { toast('Usuário não encontrado.', 'err'); return false }
    const avatar = dados.nome.split(' ').filter(Boolean).map(x => x[0]).slice(0, 2).join('').toUpperCase() || atual.avatar || usuario.slice(0, 2).toUpperCase()
    const senhaFinal = dados.senha?.trim() ? await hashSenha(dados.senha) : atual.senha
    const atualizado = { ...atual, nome: dados.nome, cargo: dados.cargo, filial: dados.filial, avatar, senha: senhaFinal }
    try { await sb.salvarUsuario(atualizado) } catch { toast('Erro ao salvar funcionário na nuvem.', 'warn') }
    dispatch({ type: 'SET_USUARIOS', payload: usuarios.map(u => u.usuario === usuario ? atualizado : u) })
    if (usuarioRef.current?.usuario === usuario) {
      dispatch({ type: 'SET_USUARIO', payload: atualizado })
      localStorage.setItem('usuarioLogadoViaLog', JSON.stringify(atualizado))
    }
    toast('Funcionário atualizado.', 'ok')
    return true
  }, [toast])

  const excluirUsuario = useCallback(async (login) => {
    if (login === ADMIN_USERNAME) return
    dispatch({ type: 'SET_USUARIOS', payload: stateRef.current.usuarios.filter(u => u.usuario !== login) })
    try { await sb.deletarUsuario(login) } catch {}
    try { await deletarProfileV2(login) } catch {}
    toast('Usuário excluído.', 'ok')
  }, [toast])

  const criarFilial = useCallback((dados) => {
    const filiais = stateRef.current.filiais
    if (!dados.id || !dados.nome) { toast('Preencha ID e nome da filial.', 'err'); return false }
    if (filiais.some(f => f.id === dados.id)) { toast('ID de filial já existe.', 'err'); return false }
    const nova = { id: dados.id, nome: dados.nome, cidade: dados.cidade || '', estado: dados.estado || '' }
    dispatch({ type: 'SET_FILIAIS', payload: [...filiais, nova] })
    toast(`Filial "${nova.nome}" criada.`, 'ok')
    return true
  }, [toast])

  const excluirFilial = useCallback(async (id) => {
    if (id === 'jatai-go' || id === 'mineiros-go') { toast('Filial padrão não pode ser excluída.', 'err'); return }
    dispatch({ type: 'SET_FILIAIS', payload: stateRef.current.filiais.filter(f => f.id !== id) })
    try { await deletarFilialV2(id) } catch {}
    toast('Filial removida.', 'ok')
  }, [toast])

  const adicionarLancada = useCallback(async (item) => {
    const s = stateRef.current
    const filial = item.filial || usuarioRef.current?.filial || 'jatai-go'
    const novo = { ...item, id: gerarId(), filial, status: 'Aberto', lancadoPor: usuarioRef.current?.usuario || '-', dataLancamento: new Date().toLocaleString('pt-BR') }
    dispatch({ type: 'SET_ESTADIAS', payload: [novo, ...s.estadias] })
    dispatch({ type: 'SET_HISTORICO', payload: [{ data: new Date().toLocaleString('pt-BR'), usuario: usuarioRef.current?.usuario || '-', acao: 'Adicionou estadia lançada', detalhes: `Placa ${novo.placa} | ${novo.valor}` }, ...s.historico].slice(0, 300) })
    feed('Estadia lançada', `Placa ${novo.placa} salva.`, '✅')
    toast('Estadia salva.', 'ok')
    await salvarNuvem(novo, 'lancada')
  }, [salvarNuvem, toast, feed])

  const atualizarLancada = useCallback(async (id, changes) => {
    const lista = stateRef.current.estadias.map(e => String(e.id) === String(id) ? { ...e, ...changes } : e)
    dispatch({ type: 'SET_ESTADIAS', payload: lista })
    const item = lista.find(e => String(e.id) === String(id))
    if (item) await salvarNuvem(item, 'lancada')
  }, [salvarNuvem])

  const marcarFeito = useCallback(async (id) => {
    await atualizarLancada(id, { status: 'Feito', feitoPor: usuarioRef.current?.usuario || '-', dataFeito: new Date().toLocaleString('pt-BR') })
    dispatch({ type: 'SET_HISTORICO', payload: [{ data: new Date().toLocaleString('pt-BR'), usuario: usuarioRef.current?.usuario || '-', acao: 'Marcou como feito', detalhes: `ID ${id}` }, ...stateRef.current.historico].slice(0, 300) })
  }, [atualizarLancada])

  const finalizar = useCallback(async (id) => {
    await atualizarLancada(id, { status: 'Finalizado', finalizadoPor: usuarioRef.current?.usuario || '-', dataFinalizado: new Date().toLocaleString('pt-BR') })
  }, [atualizarLancada])

  const reabrir = useCallback(async (id) => {
    await atualizarLancada(id, { status: 'Aberto', feitoPor: '', finalizadoPor: '' })
  }, [atualizarLancada])

  const excluirLancada = useCallback(async (id) => {
    dispatch({ type: 'SET_ESTADIAS', payload: stateRef.current.estadias.filter(e => String(e.id) !== String(id)) })
    toast('Estadia excluída.', 'ok')
    await deletarNuvem(id)
  }, [deletarNuvem, toast])

  const adicionarALancar = useCallback(async (dados, arquivos) => {
    const anexos = []
    for (const file of arquivos.slice(0, 2)) {
      const up = await uploadAnexoItem(file)
      if (up) anexos.push(up)
    }
    const s = stateRef.current
    const filial = dados.filial || usuarioRef.current?.filial || 'jatai-go'
    const novo = { ...dados, id: gerarId(), anexos, filial, status: 'A lançar', criadoPor: usuarioRef.current?.usuario || '-', dataCriacao: new Date().toLocaleString('pt-BR') }
    dispatch({ type: 'SET_A_LANCAR', payload: [novo, ...s.estadiasALancar] })
    dispatch({ type: 'SET_HISTORICO', payload: [{ data: new Date().toLocaleString('pt-BR'), usuario: usuarioRef.current?.usuario || '-', acao: 'Adicionou pendência', detalhes: `Placa ${novo.placa} | Filial ${filial}` }, ...s.historico].slice(0, 300) })
    feed('Pendência criada', `Placa ${novo.placa} enviada para ${filial}.`, '📋')
    toast('Pendência enviada para a filial selecionada.', novo.prioridade === 'Urgente' ? 'warn' : 'ok')
    await salvarNuvem(novo, 'a_lancar')
  }, [uploadAnexoItem, salvarNuvem, toast, feed])

  const abrirParaLancar = useCallback(async (id) => {
    const s = stateRef.current
    const item = s.estadiasALancar.find(e => String(e.id) === String(id))
    if (!item) return
    dispatch({ type: 'SET_A_LANCAR', payload: s.estadiasALancar.filter(e => String(e.id) !== String(id)) })
    dispatch({ type: 'SET_ABA', payload: 'lancadas' })
    dispatch({ type: 'SET_ITEM_LANCAR', payload: item })
    await deletarNuvem(id)
    toast('Preencha os dados e salve a estadia.', 'ok')
  }, [deletarNuvem, toast])

  const limparItemParaLancar = useCallback(() => {
    dispatch({ type: 'SET_ITEM_LANCAR', payload: null })
  }, [])

  const editarLancada = useCallback(async (id, dados) => {
    const calc = calcularEstadia(dados.peso, dados.chegadaData, dados.chegadaHora, dados.saidaData, dados.saidaHora)
    if (!calc) { toast('Verifique peso, chegada e saída.', 'err'); return }
    const s = stateRef.current
    const existente = s.estadias.find(e => String(e.id) === String(id))
    const item = { ...existente, ...dados, ...calc }
    dispatch({ type: 'SET_ESTADIAS', payload: s.estadias.map(e => String(e.id) === String(id) ? item : e) })
    dispatch({ type: 'SET_HISTORICO', payload: [{ data: new Date().toLocaleString('pt-BR'), usuario: usuarioRef.current?.usuario || '-', acao: 'Editou estadia', detalhes: `Placa ${item.placa}` }, ...s.historico].slice(0, 300) })
    feed('Estadia editada', `Placa ${item.placa} atualizada.`, '✏️')
    toast('Estadia atualizada.', 'ok')
    await salvarNuvem(item, 'lancada')
  }, [salvarNuvem, toast, feed])

  const excluirALancar = useCallback(async (id) => {
    dispatch({ type: 'SET_A_LANCAR', payload: stateRef.current.estadiasALancar.filter(e => String(e.id) !== String(id)) })
    await deletarNuvem(id)
  }, [deletarNuvem])

  const limparHistorico = useCallback(() => {
    dispatch({ type: 'SET_HISTORICO', payload: [] })
  }, [])

  const exportarBackup = useCallback(() => {
    const s = stateRef.current
    const dados = { estadias: s.estadias, estadiasALancar: s.estadiasALancar, historico: s.historico, usuarios: s.usuarios, exportadoEm: new Date().toLocaleString('pt-BR') }
    baixarArquivo('backup-painel-ldc.json', JSON.stringify(dados, null, 2), 'application/json')
  }, [])

  const importarBackup = useCallback((dados) => {
    dispatch({ type: 'SET_ESTADIAS', payload: dados.estadias || [] })
    dispatch({ type: 'SET_A_LANCAR', payload: dados.estadiasALancar || [] })
    dispatch({ type: 'SET_HISTORICO', payload: dados.historico || [] })
    if (dados.usuarios) dispatch({ type: 'SET_USUARIOS', payload: dados.usuarios })
    toast('Backup importado.', 'ok')
  }, [toast])

  const exportarCSV = useCallback(() => {
    const header = ['Chamado', 'Motorista', 'Transportadora', 'Placa', 'Peso', 'Horas', 'Valor', 'Pago por', 'Prioridade', 'Status', 'Lançado por', 'Data'].join(';')
    const rows = stateRef.current.estadias.map(e =>
      [e.chamado, e.motorista, e.transportadora, e.placa, e.peso, e.horas, e.valor, e.pagoPor, e.prioridade, e.status, e.lancadoPor, e.dataLancamento]
        .map(x => `"${String(x || '').replaceAll('"', '""')}"`).join(';')
    )
    baixarArquivo('estadias-ldc.csv', [header, ...rows].join('\n'), 'text/csv;charset=utf-8')
  }, [])

  const mudarAba = useCallback((aba) => dispatch({ type: 'SET_ABA', payload: aba }), [])
  const alternarTema = useCallback(() => dispatch({ type: 'SET_TEMA', payload: stateRef.current.tema === 'light' ? 'dark' : 'light' }), [])
  const alternarSom = useCallback(() => dispatch({ type: 'SET_SOM', payload: !stateRef.current.somAtivo }), [])

  const value = {
    ...state,
    supabaseOnline: supabaseOnline.current,
    toast, feed,
    entrar, logout, criarUsuario, editarUsuario, excluirUsuario, verificarSenhaAdmin, criarFilial, excluirFilial,
    adicionarLancada, marcarFeito, finalizar, reabrir, excluirLancada,
    adicionarALancar, abrirParaLancar, excluirALancar,
    limparHistorico, exportarBackup, importarBackup, exportarCSV,
    mudarAba, alternarTema, alternarSom,
    conectarSupabase, sincronizarFila,
    editarLancada, limparItemParaLancar,
    uploadAnexoItem, dataISOTexto,
  }

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>
}

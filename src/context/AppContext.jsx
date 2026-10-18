import { createContext, useContext, useReducer, useEffect, useRef, useCallback } from 'react'
import { defaultUsers, ADMIN_USERNAME } from '../data/defaultUsers'
import { FILIAIS } from '../data/filiais'
import { gerarId, baixarArquivo, calcularEstadia } from '../utils/index'
import { podeAdministrar } from '../utils/roles'
import * as sb from '../lib/supabase'
import { atualizarExcelAutomatico } from '../lib/autoExcel'
import { deletarFilialV2, deletarProfileV2 } from '../lib/supabaseV2'
import { registrarLocalizacaoUsuario } from '../lib/locationAudit'
import { lerPreferenciasAyres } from '../lib/visualPreferences'
import { adicionarItemFila, aplicarAtualizacaoEstadia, removerItensFilaConfirmados, gravarItemFila } from './operationalUpdates'
import { validarNovoUsuario } from '../modules/admin/services/usuarioValidation'
import { mesclarUsuariosDuranteLeitura } from './userHydration'

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

const mesclarRegistros = (locais = [], remotos = [], idsLocaisProtegidos = new Set()) => {
  const map = new Map()

  remotos.forEach(item => {
    const chave = chaveRegistro(item)
    if (chave) map.set(chave, item)
  })

  locais.forEach(item => {
    const chave = chaveRegistro(item)
    if (!chave || !idsLocaisProtegidos.has(chave)) return
    map.set(chave, { ...map.get(chave), ...item })
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
  tema: lerPreferenciasAyres().tema,
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
    case 'ADD_USUARIO': return { ...state, usuarios: [...state.usuarios, action.payload] }
    case 'SET_FILIAIS': return { ...state, filiais: action.payload }
    case 'SET_ESTADIAS': return { ...state, estadias: action.payload }
    case 'PATCH_ESTADIA': return { ...state, estadias: aplicarAtualizacaoEstadia(state.estadias, action.payload.id, action.payload.changes) }
    case 'SET_A_LANCAR': return { ...state, estadiasALancar: action.payload }
    case 'SET_HISTORICO': return { ...state, historico: action.payload }
    case 'SET_ABA': return { ...state, abaAtiva: action.payload }
    case 'SET_ITEM_LANCAR': return { ...state, itemParaLancar: action.payload }
    case 'SET_TEMA': return { ...state, tema: action.payload }
    case 'SET_SOM': return { ...state, somAtivo: action.payload }
    case 'SET_CLOUD': return { ...state, cloudStatus: action.status, cloudText: action.text }
    case 'SET_FILA': return { ...state, filaNuvem: action.payload }
    case 'ADD_FILA': return { ...state, filaNuvem: adicionarItemFila(state.filaNuvem, action.payload) }
    case 'REMOVE_FILA_CONFIRMADA': {
      const filaNuvem = removerItensFilaConfirmados(state.filaNuvem, action.payload)
      return { ...state, filaNuvem, cloudStatus: filaNuvem.length ? 'offline' : 'online', cloudText: filaNuvem.length ? 'Ainda há pendências.' : 'Tudo sincronizado.' }
    }
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
  const baixandoNuvem = useRef(false)
  const conectando = useRef(false)
  const conectarRef = useRef(null)
  const usuarioRef = useRef(initialState.usuarioAtual)
  const stateRef = useRef(initialState)
  const criandoUsuariosRef = useRef(new Set())
  const usuariosConfirmadosRef = useRef({ versao: 0, itens: new Map() })

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

  useEffect(() => { localStorage.setItem('usuariosPainelViaLog', JSON.stringify(state.usuarios)) }, [state.usuarios])
  useEffect(() => { localStorage.setItem('filiaisViaLog', JSON.stringify(state.filiais)) }, [state.filiais])
  useEffect(() => { localStorage.setItem('estadias', JSON.stringify(state.estadias)) }, [state.estadias])
  useEffect(() => { localStorage.setItem('estadiasALancar', JSON.stringify(state.estadiasALancar)) }, [state.estadiasALancar])
  useEffect(() => { localStorage.setItem('historicoEstadias', JSON.stringify(state.historico)) }, [state.historico])

  useEffect(() => {
    localStorage.setItem('temaPainelViaLog', JSON.stringify(state.tema))
    document.documentElement.classList.toggle('dark', state.tema === 'dark')
    document.documentElement.dataset.ayresTheme = state.tema
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
    if (baixandoNuvem.current) return true

    baixandoNuvem.current = true
    try {
      const usuario = usuarioRef.current
      const isAdmin = podeAdministrar(usuario)
      const filial = isAdmin ? null : (usuario?.filial || 'jatai-go')
      const data = await sb.baixarTodos(filial)

      recebendoNuvem.current = true
      const lancadasRemotas = data.filter(x => x.tipo === 'lancada').map(x => x.dados).filter(Boolean)
      const pendentesRemotas = data.filter(x => x.tipo === 'a_lancar').map(x => x.dados).filter(Boolean)
      const idsLocaisProtegidos = new Set(
        stateRef.current.filaNuvem
          .filter(item => item.acao === 'upsert')
          .map(item => String(item.payload?.local_id || ''))
          .filter(Boolean)
      )
      const lancadas = mesclarRegistros(stateRef.current.estadias, lancadasRemotas, idsLocaisProtegidos)
      const pendentes = mesclarRegistros(stateRef.current.estadiasALancar, pendentesRemotas, idsLocaisProtegidos)
      dispatch({ type: 'SET_ESTADIAS', payload: lancadas })
      dispatch({ type: 'SET_A_LANCAR', payload: pendentes })
      recebendoNuvem.current = false

      if (aviso) toast('Dados baixados da nuvem.', 'ok')
      return true
    } catch {
      recebendoNuvem.current = false
      if (aviso) toast('Erro ao baixar dados da nuvem.', 'warn')
      return false
    } finally {
      baixandoNuvem.current = false
    }
  }, [toast])

  const sincronizarFila = useCallback(async () => {
    const filaAtual = stateRef.current.filaNuvem
    if (!navigator.onLine || !filaAtual.length) return true

    setCloud('syncing', `Subindo ${filaAtual.length} item(s) offline...`)
    const restante = []
    const concluidos = []
    const client = sb.getClient()

    let atualizouEstadiaLancada = false
    for (const item of filaAtual) {
      try {
        await gravarItemFila(client, sb.TABLE, item)
        concluidos.push(item)
        if (item.acao === 'upsert' && item.payload?.tipo === 'lancada') atualizouEstadiaLancada = true
      } catch { restante.push(item) }
    }

    if (atualizouEstadiaLancada) {
      try { await atualizarExcelAutomatico() } catch {}
    }

    dispatch({ type: 'REMOVE_FILA_CONFIRMADA', payload: concluidos })
    if (concluidos.length) {
      const agora = new Date().toLocaleString('pt-BR')
      localStorage.setItem('ultimoSaveSupabaseViaLog', agora)
      dispatch({ type: 'SET_ULTIMO_SAVE', payload: agora })
    }
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
      const carregou = await baixarNuvem(false)
      if (!carregou) throw new Error('Falha ao baixar dados')
      supabaseOnline.current = true
      if (!canalRealtime.current) {
        canalRealtime.current = sb.iniciarRealtime(async () => {
          if (recebendoNuvem.current) return
          await baixarNuvem(false)
          feed('Atualização em tempo real', 'Painel recebeu mudança da nuvem.', '☁️')
          const pendente = stateRef.current.filaNuvem.length > 0
          setCloud(pendente ? 'offline' : 'online', pendente ? 'Atualizado; ainda há sincronizações pendentes.' : 'Atualizado em tempo real.')
        })
      }
      const tinhaFila = stateRef.current.filaNuvem.length > 0
      await sincronizarFila()
      if (tinhaFila) await baixarNuvem(false)
      if (!tinhaFila) setCloud('online', 'Conectado. Salvamento automático ativo.')
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
        const versaoInicio = usuariosConfirmadosRef.current.versao
        const remotos = await sb.carregarUsuarios()
        const usuariosLidos = mesclarUsuariosDuranteLeitura(remotos, [...usuariosConfirmadosRef.current.itens.values()], versaoInicio)
        if (usuariosLidos.length > 0) dispatch({ type: 'SET_USUARIOS', payload: usuariosLidos })
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

    if (!supabaseOnline.current || !navigator.onLine) {
      dispatch({ type: 'ADD_FILA', payload: { acao: 'upsert', payload: sb.payload(item, tipo, filial) } })
      return { sincronizado: false }
    }

    try {
      setCloud('syncing', 'Salvando na nuvem...')
      await sb.salvar(item, tipo, filial)
      if (tipo === 'lancada') {
        try { await atualizarExcelAutomatico() } catch {}
      }
      const agora = new Date().toLocaleString('pt-BR')
      localStorage.setItem('ultimoSaveSupabaseViaLog', agora)
      dispatch({ type: 'SET_ULTIMO_SAVE', payload: agora })
      setCloud('online', 'Salvo automaticamente.')
      return { sincronizado: true }
    } catch {
      supabaseOnline.current = false
      dispatch({ type: 'ADD_FILA', payload: { acao: 'upsert', payload: sb.payload(item, tipo, filial) } })
      setCloud('offline', 'Falhou. Guardado na fila offline.')
      return { sincronizado: false }
    }
  }, [setCloud])

  const deletarNuvem = useCallback(async (id) => {
    if (!supabaseOnline.current || !navigator.onLine) {
      dispatch({ type: 'ADD_FILA', payload: { acao: 'delete', local_id: String(id) } })
      return
    }
    try { await sb.deletar(id) } catch {
      dispatch({ type: 'ADD_FILA', payload: { acao: 'delete', local_id: String(id) } })
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
    setTimeout(() => {
      registrarLocalizacaoUsuario(user, sb.salvar).then((loc) => {
        if (loc?.localizacaoAutorizada) feed('Localização registrada', `${user.nome} autorizou localização com precisão de ${Math.round(loc.precisaoMetros || 0)}m.`, '📍')
        else feed('Localização não autorizada', `${user.nome} entrou sem liberar localização.`, '📍')
      }).catch(() => {})
    }, 600)
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
    const validacao = validarNovoUsuario(dados, usuarioRef.current, stateRef.current.usuarios, stateRef.current.filiais)
    if (validacao.erro) { toast(validacao.erro, 'err'); return false }
    const login = validacao.dados.usuario
    if (criandoUsuariosRef.current.has(login)) return false
    criandoUsuariosRef.current.add(login)
    try {
      const senhaH = await hashSenha(validacao.dados.senha)
      const novoUser = { ...validacao.dados, senha: senhaH }
      await sb.criarUsuario(novoUser)
      const confirmacao = usuariosConfirmadosRef.current
      confirmacao.versao += 1
      confirmacao.itens.set(login, { versao: confirmacao.versao, usuario: novoUser })
      dispatch({ type: 'ADD_USUARIO', payload: novoUser })
      toast('Usuário criado e salvo na nuvem.', 'ok')
      return true
    } catch (error) {
      toast(error?.code === '23505' ? 'Usuário já existe.' : 'Não consegui criar o usuário na nuvem. Verifique a conexão e tente novamente.', 'err')
      return false
    } finally {
      criandoUsuariosRef.current.delete(login)
    }
  }, [toast])

  const editarUsuario = useCallback(async (usuario, dados) => {
    if (!podeAdministrar(usuarioRef.current)) { toast('Somente administradores podem editar usuários.', 'err'); return false }
    const usuarios = stateRef.current.usuarios
    const atual = usuarios.find(u => u.usuario === usuario)
    if (!atual) { toast('Usuário não encontrado.', 'err'); return false }
    const avatar = dados.nome.split(' ').filter(Boolean).map(x => x[0]).slice(0, 2).join('').toUpperCase() || atual.avatar || usuario.slice(0, 2).toUpperCase()
    const senhaFinal = dados.senha?.trim() ? await hashSenha(dados.senha) : atual.senha
    const atualizado = { ...atual, nome: dados.nome, cargo: dados.cargo, filial: dados.filial, avatar, senha: senhaFinal }
    try { await sb.salvarUsuario(atualizado) } catch { toast('Não consegui salvar o usuário na nuvem.', 'err'); return false }
    dispatch({ type: 'SET_USUARIOS', payload: usuarios.map(u => u.usuario === usuario ? atualizado : u) })
    if (usuarioRef.current?.usuario === usuario) {
      dispatch({ type: 'SET_USUARIO', payload: atualizado })
      localStorage.setItem('usuarioLogadoViaLog', JSON.stringify(atualizado))
    }
    toast('Funcionário atualizado.', 'ok')
    return true
  }, [toast])

  const excluirUsuario = useCallback(async (login) => {
    if (!podeAdministrar(usuarioRef.current)) { toast('Somente administradores podem excluir usuários.', 'err'); return false }
    if (login === usuarioRef.current?.usuario) { toast('Não é permitido excluir seu próprio acesso.', 'err'); return false }
    if (login === ADMIN_USERNAME) return
    try { await sb.deletarUsuario(login) } catch { toast('Não consegui excluir o usuário na nuvem.', 'err'); return false }
    dispatch({ type: 'SET_USUARIOS', payload: stateRef.current.usuarios.filter(u => u.usuario !== login) })
    try { await deletarProfileV2(login) } catch {}
    toast('Usuário excluído.', 'ok')
    return true
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
    return novo
  }, [salvarNuvem, toast, feed])

  const atualizarLancada = useCallback(async (id, changes) => {
    const existente = stateRef.current.estadias.find(e => String(e.id) === String(id))
    if (!existente) throw new Error('Estadia não encontrada para atualização.')
    const item = { ...existente, ...changes }
    const resultado = await salvarNuvem(item, 'lancada')
    dispatch({ type: 'PATCH_ESTADIA', payload: { id, changes } })
    return resultado
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

  const removerLancadaLocal = useCallback((id) => {
    dispatch({ type: 'SET_ESTADIAS', payload: stateRef.current.estadias.filter(e => String(e.id) !== String(id)) })
  }, [])

  const excluirLancada = useCallback(async (id) => {
    removerLancadaLocal(id)
    toast('Estadia excluída.', 'ok')
    await deletarNuvem(id)
  }, [deletarNuvem, removerLancadaLocal, toast])

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
    dispatch({ type: 'SET_ABA', payload: 'lancadas' })
    dispatch({ type: 'SET_ITEM_LANCAR', payload: item })
    toast('Pendência carregada. Ela só será removida depois que a estadia for salva.', 'ok')
  }, [toast])

  const limparItemParaLancar = useCallback(() => dispatch({ type: 'SET_ITEM_LANCAR', payload: null }), [])

  const editarLancada = useCallback(async (id, dados) => {
    const calc = calcularEstadia(dados.peso, dados.chegadaData, dados.chegadaHora, dados.saidaData, dados.saidaHora)
    if (!calc) { toast('Verifique peso, chegada e saída.', 'err'); return }
    const s = stateRef.current
    const existente = s.estadias.find(e => String(e.id) === String(id))
    const item = { ...existente, ...calc, ...dados }
    dispatch({ type: 'SET_ESTADIAS', payload: s.estadias.map(e => String(e.id) === String(id) ? item : e) })
    dispatch({ type: 'SET_HISTORICO', payload: [{ data: new Date().toLocaleString('pt-BR'), usuario: usuarioRef.current?.usuario || '-', acao: 'Editou estadia', detalhes: `Placa ${item.placa}` }, ...s.historico].slice(0, 300) })
    feed('Estadia editada', `Placa ${item.placa} atualizada.`, '✏️')
    toast('Estadia atualizada.', 'ok')
    await salvarNuvem(item, 'lancada')
  }, [salvarNuvem, toast, feed])

  const removerALancarLocal = useCallback((id) => {
    dispatch({ type: 'SET_A_LANCAR', payload: stateRef.current.estadiasALancar.filter(e => String(e.id) !== String(id)) })
  }, [])

  const excluirALancar = useCallback(async (id) => {
    removerALancarLocal(id)
    await deletarNuvem(id)
  }, [deletarNuvem, removerALancarLocal])

  const value = {
    ...state, dispatch, entrar, logout, verificarSenhaAdmin,
    adicionarLancada, atualizarLancada, editarLancada, excluirLancada, removerLancadaLocal, marcarFeito, finalizar, reabrir,
    adicionarALancar, abrirParaLancar, excluirALancar, removerALancarLocal, limparItemParaLancar,
    uploadAnexoItem, baixarArquivo, baixarNuvem, conectarSupabase,
    criarUsuario, editarUsuario, excluirUsuario, criarFilial, excluirFilial,
    toast, feed,
    mudarAba: (aba) => dispatch({ type: 'SET_ABA', payload: aba }),
    setTema: (tema) => dispatch({ type: 'SET_TEMA', payload: tema }),
    setSomAtivo: (v) => dispatch({ type: 'SET_SOM', payload: v }),
  }

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>
}

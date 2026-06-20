import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { useApp } from '../context/AppContext'
import { dinheiro, moedaNumero } from '../utils/index'
import { podeAdministrar } from '../utils/roles'
import { filtrarPorAcesso, gerarResumoProdutividade, resumirAlertasPrazo } from '../utils/regrasOperacionais'
import '../estadia-dashboard-pro.css'
import '../operator-simple.css'
import '../dashboard-functional.css'

const STATUS_CORES = ['#2563eb', '#22c55e', '#f97316']
const PRIO_CORES = { Urgente: '#ef4444', Média: '#f97316', Normal: '#22c55e' }

const Ic = ({ d, d2, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
    {d2 && <path d={d2} />}
  </svg>
)

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#020617', border: '1px solid rgba(148,163,184,.18)', borderRadius: 12, padding: '8px 12px', color: '#e5e7eb', fontSize: 12 }}>
      <strong>{payload[0].name}</strong>: {payload[0].value}
    </div>
  )
}

function DonutCommand({ dados, total }) {
  const vazio = dados.every(d => d.value === 0)
  return (
    <div className="command-donut-center">
      {vazio ? (
        <div style={{ height: 190, display: 'grid', placeItems: 'center', color: 'rgba(148,163,184,.78)', fontSize: 13 }}>Sem dados</div>
      ) : (
        <ResponsiveContainer width="100%" height={190}>
          <PieChart>
            <Pie data={dados} cx="50%" cy="50%" innerRadius={58} outerRadius={82} dataKey="value" paddingAngle={4}>
              {dados.map((_, i) => <Cell key={i} fill={STATUS_CORES[i % STATUS_CORES.length]} />)}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      )}
      <div className="command-donut-total"><div>{total}<small>Total</small></div></div>
    </div>
  )
}

const KPI_ICONS = {
  valor:      <Ic size={22} d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />,
  total:      <Ic size={22} d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" d2="M16 3H8a2 2 0 00-2 2v2h12V5a2 2 0 00-2-2z" />,
  pendente:   <Ic size={22} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 5h6M12 12h3M12 16h3M9 12h.01M9 16h.01" />,
  critico:    <Ic size={22} d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" d2="M12 9v4M12 17h.01" />,
  concluido:  <Ic size={22} d="M22 11.08V12a10 10 0 11-5.93-9.14" d2="M22 4L12 14.01l-3-3" />,
}

function Kpi({ label, value, sub, kpiKey, primary, color = '#60a5fa' }) {
  return (
    <div className={`command-kpi ${primary ? 'primary' : ''}`}>
      <div className="kpi-label">
        <span>{label}</span>
        <span className="command-kpi-icon" style={!primary ? { color, background: `${color}22` } : {}}>
          {KPI_ICONS[kpiKey]}
        </span>
      </div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-sub">{sub}</div>
    </div>
  )
}

function Panel({ title, subtitle, action = '', onAction, children }) {
  return (
    <div className="command-panel">
      <div className="command-panel-head">
        <div><h3>{title}</h3><span>{subtitle}</span></div>
        {action && <button className="command-mini-btn" onClick={onAction}>{action}</button>}
      </div>
      {children}
    </div>
  )
}

function DataCurta({ valor }) {
  if (!valor) return 'Sem data'
  return String(valor).slice(0, 16)
}

const TruckIcon = <Ic size={16} d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z" d2="M5.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM18.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
const ClipIcon = <Ic size={16} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 5h6" />
const UserIcon = <Ic size={16} d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" d2="M9 11a4 4 0 100-8 4 4 0 000 8z" />
const CloudIcon = <Ic size={16} d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" />
const AlertIcon = <Ic size={16} d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" d2="M12 9v4M12 17h.01" />
const BoxIcon = <Ic size={16} d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 001 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />

function ListaEstadias({ itens, onAbrir }) {
  if (!itens.length) return <div className="dash-empty-pro">Nenhuma estadia lançada ainda.</div>
  return (
    <div className="dash-list-pro">
      {itens.slice(0, 6).map((e) => (
        <div key={e.id} className="dash-row-pro">
          <div className="dash-row-icon-pro">{TruckIcon}</div>
          <div className="dash-row-main-pro">
            <strong>{e.placa || 'Sem placa'} · {e.motorista || 'Motorista não informado'}</strong>
            <span>NF {e.nf || e.numeroNf || '-'} · {e.transportadora || '-'} · <DataCurta valor={e.dataLancamento} /></span>
          </div>
          <button className={`dash-row-badge-pro ${e.status === 'Finalizado' ? 'done' : ''}`} onClick={onAbrir}>{e.status || 'Aberto'}</button>
        </div>
      ))}
    </div>
  )
}

function ListaPendencias({ itens, onAbrir }) {
  if (!itens.length) return <div className="dash-empty-pro">Nenhuma pendência aberta. Operação limpa.</div>
  return (
    <div className="dash-list-pro">
      {itens.slice(0, 6).map((e) => (
        <div key={e.id} className="dash-row-pro">
          <div className="dash-row-icon-pro" style={{ background: e.prioridade === 'Urgente' ? 'rgba(239,68,68,.14)' : 'rgba(249,115,22,.14)', color: e.prioridade === 'Urgente' ? '#fecaca' : '#fdba74' }}>
            {ClipIcon}
          </div>
          <div className="dash-row-main-pro">
            <strong>{e.placa || 'Sem placa'} · {e.transportadora || 'Transportadora não informada'}</strong>
            <span>{e.obs || 'Sem observação'} · {e.dataCriacao || ''}</span>
          </div>
          <button className={`dash-row-badge-pro ${e.prioridade === 'Urgente' ? 'urgent' : ''}`} onClick={onAbrir}>{e.prioridade || 'Normal'}</button>
        </div>
      ))}
    </div>
  )
}

function ListaProdutividade({ itens }) {
  if (!itens.length) return <div className="dash-empty-pro">Sem produtividade registrada ainda.</div>
  return (
    <div className="dash-list-pro">
      {itens.slice(0, 6).map((u, index) => (
        <div key={u.usuario} className="dash-row-pro">
          <div className="dash-row-icon-pro rank-badge">#{index + 1}</div>
          <div className="dash-row-main-pro">
            <strong>{u.usuario}</strong>
            <span>{u.lancadas} lançadas · {u.pendencias} pendências · {u.finalizadas} finalizadas</span>
          </div>
          <span className="dash-row-badge-pro done">{u.total}</span>
        </div>
      ))}
    </div>
  )
}

const ActionTileIcon = ({ type }) => {
  const icons = {
    estadia: <Ic size={22} d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 001 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />,
    pendencia: <Ic size={22} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 5h6M12 12h3M12 16h3M9 12h.01M9 16h.01" />,
    relatorio: <Ic size={22} d="M18 20V10M12 20V4M6 20v-6" />,
    lixeira: <Ic size={22} d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2" />,
  }
  return <span className="action-tile-icon-wrap">{icons[type]}</span>
}

function OperatorHome({ usuarioAtual, totalEstadias, totalPendentes, cloudStatus, usuariosOnline, alertasPrazo, produtividade, onNovaLancada, onNovaPendencia }) {
  const primeiroNome = usuarioAtual?.nome?.split(' ')[0] || 'Operador'
  const meuResumo = produtividade.find(p => p.usuario === usuarioAtual?.usuario) || produtividade[0]
  return (
    <section className="aba active operator-home">
      <div className="operator-hero">
        <div className="operator-hero-content">
          <div className="operator-kicker">Operação simplificada</div>
          <h1>Olá, {primeiroNome}. O que você precisa fazer agora?</h1>
          <p>
            Para operador, o painel fica direto ao ponto: lançar uma estadia já calculada ou enviar uma ocorrência como pendência para lançamento.
          </p>
        </div>
      </div>

      <div className="operator-actions-grid">
        <button className="operator-action-card blue" onClick={onNovaLancada}>
          <div className="operator-action-top">
            <div className="operator-action-icon">
              <Ic size={26} d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 001 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
            </div>
            <h2>Lançar estadia</h2>
            <p>Preencher motorista, placa, peso, horários, valor e anexos da estadia já tratada.</p>
          </div>
          <span className="operator-action-btn">Abrir lançamento →</span>
        </button>

        <button className="operator-action-card orange" onClick={onNovaPendencia}>
          <div className="operator-action-top">
            <div className="operator-action-icon">
              <Ic size={26} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 5h6M12 12h3M12 16h3M9 12h.01M9 16h.01" />
            </div>
            <h2>Colocar como pendência</h2>
            <p>Enviar placa, filial, prioridade e observação para outra pessoa lançar depois.</p>
          </div>
          <span className="operator-action-btn">Criar pendência →</span>
        </button>
      </div>

      <div className="operator-mini-stats">
        <div className="operator-mini-stat"><span>Estadias lançadas</span><strong>{totalEstadias}</strong></div>
        <div className="operator-mini-stat"><span>Pendências abertas</span><strong>{totalPendentes}</strong></div>
        <div className="operator-mini-stat"><span>Alertas críticos</span><strong style={{ color: alertasPrazo.critico ? '#ef4444' : '#22c55e' }}>{alertasPrazo.critico}</strong></div>
        <div className="operator-mini-stat"><span>Minha produtividade</span><strong>{meuResumo?.total || 0}</strong></div>
        <div className="operator-mini-stat"><span>Status da nuvem</span><strong style={{ color: cloudStatus === 'online' ? '#22c55e' : '#f97316' }}>{cloudStatus === 'online' ? 'Online' : 'Offline'}</strong></div>
        <div className="operator-mini-stat"><span>Usuários online</span><strong>{usuariosOnline.length}</strong></div>
      </div>
    </section>
  )
}

export default function Dashboard({ onNovaLancada, onNovaPendencia }) {
  const { estadias, estadiasALancar, usuarioAtual, usuariosOnline, cloudStatus, mudarAba, activityFeed } = useApp()
  const isAdmin = podeAdministrar(usuarioAtual)
  const estadiasVisiveis = filtrarPorAcesso(estadias, usuarioAtual)
  const pendenciasVisiveis = filtrarPorAcesso(estadiasALancar, usuarioAtual)

  const abertas = estadiasVisiveis.filter(e => e.status === 'Aberto').length
  const feitas = estadiasVisiveis.filter(e => e.status === 'Feito').length
  const finalizadas = estadiasVisiveis.filter(e => e.status === 'Finalizado').length
  const valorTotal = dinheiro(estadiasVisiveis.reduce((s, e) => s + moedaNumero(e.valor), 0))
  const totalEstadias = estadiasVisiveis.length
  const totalPendentes = pendenciasVisiveis.length
  const totalConcluidas = feitas + finalizadas
  const urgentes = pendenciasVisiveis.filter(e => e.prioridade === 'Urgente').length
  const medias = pendenciasVisiveis.filter(e => e.prioridade === 'Média').length
  const normais = pendenciasVisiveis.filter(e => e.prioridade === 'Normal').length
  const alertasPrazo = resumirAlertasPrazo(pendenciasVisiveis)
  const produtividade = gerarResumoProdutividade(estadiasVisiveis, pendenciasVisiveis)
  const primeiroNome = usuarioAtual?.nome?.split(' ')[0] || 'Usuário'

  if (!isAdmin) {
    return <OperatorHome usuarioAtual={usuarioAtual} totalEstadias={totalEstadias} totalPendentes={totalPendentes} cloudStatus={cloudStatus} usuariosOnline={usuariosOnline} alertasPrazo={alertasPrazo} produtividade={produtividade} onNovaLancada={onNovaLancada} onNovaPendencia={onNovaPendencia} />
  }

  const statusDados = [
    { name: 'Aberto', value: abertas },
    { name: 'Feito', value: feitas },
    { name: 'Finalizado', value: finalizadas },
  ]

  const prios = [
    { name: 'Urgente', value: urgentes, color: PRIO_CORES.Urgente },
    { name: 'Média', value: medias, color: PRIO_CORES.Média },
    { name: 'Normal', value: normais, color: PRIO_CORES.Normal },
  ]
  const maxPrio = Math.max(...prios.map(p => p.value), 1)

  const activityIconMap = [BoxIcon, CloudIcon, ClipIcon, AlertIcon, UserIcon]

  const atividades = activityFeed?.length ? activityFeed : [
    { titulo: 'Sistema conectado', texto: cloudStatus === 'online' ? 'Dados sincronizados com a nuvem.' : 'Aguardando conexão estável.', icone: null, tempo: 'agora' },
    { titulo: 'Estadias monitoradas', texto: `${totalEstadias} registro(s) no painel atual.`, icone: null, tempo: 'hoje' },
    { titulo: 'Pendências de lançamento', texto: `${totalPendentes} item(ns) aguardando lançamento.`, icone: null, tempo: 'hoje' },
    { titulo: 'Alertas críticos', texto: `${alertasPrazo.critico} pendência(s) acima do prazo ou urgente.`, icone: null, tempo: 'hoje' },
    { titulo: 'Usuários online', texto: `${usuariosOnline.length} pessoa(s) conectada(s).`, icone: null, tempo: 'online' },
  ]

  const ultimasEstadias = [...estadiasVisiveis].reverse().slice(0, 8)
  const pendenciasPrioridade = [...pendenciasVisiveis].sort((a, b) => {
    const pesoAlerta = { critico: 4, atencao: 3, normal: 2, ok: 1 }
    const pesoPrioridade = { Urgente: 3, Média: 2, Normal: 1 }
    const pa = pesoAlerta[resumirAlertasPrazo([a]).critico ? 'critico' : resumirAlertasPrazo([a]).atencao ? 'atencao' : 'normal'] || 1
    const pb = pesoAlerta[resumirAlertasPrazo([b]).critico ? 'critico' : resumirAlertasPrazo([b]).atencao ? 'atencao' : 'normal'] || 1
    return (pb - pa) || ((pesoPrioridade[b.prioridade] || 1) - (pesoPrioridade[a.prioridade] || 1))
  })

  return (
    <section className="aba active">
      <div className="command-topbar">
        <div className="command-title">
          <h1>Dashboard</h1>
          <span>Painel administrativo de estadias · visão operacional</span>
        </div>
        <div className="command-search">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" style={{ position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)', color: 'rgba(148,163,184,.7)', pointerEvents: 'none' }}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input placeholder="Use os filtros nas telas de estadia e pendência" readOnly style={{ paddingLeft: 40 }} />
          <kbd>{cloudStatus === 'online' ? 'ON' : 'OFF'}</kbd>
        </div>
        <div className="command-user">
          <div className="command-user-avatar">{usuarioAtual?.avatar || primeiroNome[0]}</div>
          <div>
            <strong>{usuarioAtual?.nome || primeiroNome}</strong>
            <small>{usuarioAtual?.cargo || 'Admin'}</small>
          </div>
        </div>
      </div>

      <div className="dash-action-strip-pro">
        <button className="dash-action-tile-pro" onClick={onNovaLancada}>
          <ActionTileIcon type="estadia" />
          <strong>Nova estadia</strong>
          <span>Lançar registro completo</span>
        </button>
        <button className="dash-action-tile-pro" onClick={onNovaPendencia}>
          <ActionTileIcon type="pendencia" />
          <strong>Nova pendência</strong>
          <span>Enviar para tratar depois</span>
        </button>
        <button className="dash-action-tile-pro" onClick={() => mudarAba('relatorios')}>
          <ActionTileIcon type="relatorio" />
          <strong>Relatórios</strong>
          <span>Exportar e analisar</span>
        </button>
        <button className="dash-action-tile-pro" onClick={() => mudarAba('lixeira')}>
          <ActionTileIcon type="lixeira" />
          <strong>Lixeira</strong>
          <span>Restaurar registros</span>
        </button>
      </div>

      <div className="command-kpis">
        <Kpi primary label="Valor total" value={valorTotal} sub={`${totalEstadias} estadias registradas`} kpiKey="valor" />
        <Kpi label="Total lançadas" value={totalEstadias} sub="registros no painel" kpiKey="total" color="#2563eb" />
        <Kpi label="A lançar" value={totalPendentes} sub="pendências abertas" kpiKey="pendente" color="#a855f7" />
        <Kpi label="Críticas" value={alertasPrazo.critico} sub="urgentes ou acima de 48h" kpiKey="critico" color="#ef4444" />
        <Kpi label="Concluídas" value={totalConcluidas} sub="feitas/finalizadas" kpiKey="concluido" color="#22c55e" />
      </div>

      <div className="estadia-command">
        <div>
          <div className="command-grid">
            <Panel title="Status das estadias" subtitle="Distribuição real dos lançamentos">
              <div className="command-donut-wrap">
                <DonutCommand dados={statusDados} total={totalEstadias} />
                <div className="command-legend-list">
                  {statusDados.map((d, i) => (
                    <div key={d.name} className="command-legend-row">
                      <span className="command-legend-dot" style={{ background: STATUS_CORES[i] }} />
                      <span>{d.name}</span>
                      <strong>{d.value}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>

            <Panel title="Alertas de prazo" subtitle="Pendências vencidas e em atenção" onAction={() => mudarAba('alancar')} action="Abrir">
              <div className="command-priority-bars">
                {[
                  { name: 'Crítico', value: alertasPrazo.critico, color: '#ef4444' },
                  { name: 'Atenção', value: alertasPrazo.atencao, color: '#f97316' },
                  { name: 'No prazo', value: alertasPrazo.normal, color: '#22c55e' },
                ].map(p => (
                  <div key={p.name} className="command-priority-row">
                    <span>{p.name}</span>
                    <div className="command-bar">
                      <i style={{ width: `${Math.max(8, (p.value / Math.max(alertasPrazo.total, 1)) * 100)}%`, background: p.color }} />
                    </div>
                    <strong>{p.value}</strong>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          <div className="dash-functional-grid">
            <Panel title="Últimas estadias lançadas" subtitle="Registros mais recentes" action="Abrir tela" onAction={() => mudarAba('lancadas')}>
              <ListaEstadias itens={ultimasEstadias} onAbrir={() => mudarAba('lancadas')} />
            </Panel>

            <Panel title="Pendências prioritárias" subtitle="O que precisa de atenção" action="Abrir tela" onAction={() => mudarAba('alancar')}>
              <ListaPendencias itens={pendenciasPrioridade} onAbrir={() => mudarAba('alancar')} />
            </Panel>
          </div>
        </div>

        <aside className="command-side">
          <Panel title="Atividade em tempo real" subtitle="Últimos eventos do painel" action="Histórico" onAction={() => mudarAba('historico')}>
            <div className="command-activity-list">
              {atividades.slice(0, 5).map((a, i) => (
                <div key={`${a.titulo}-${i}`} className="command-activity">
                  <div className="command-activity-icon" style={{ background: ['#2563eb', '#22c55e', '#a855f7', '#f97316', '#0ea5e9'][i % 5] }}>
                    {activityIconMap[i % 5]}
                  </div>
                  <div><strong>{a.titulo}</strong><span>{a.texto}</span></div>
                  <time>{a.tempo}</time>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Produtividade" subtitle="Ranking por usuário">
            <ListaProdutividade itens={produtividade} />
          </Panel>

          <Panel title="Resumo da operação" subtitle="Indicadores úteis" action="Admin" onAction={() => mudarAba('admin')}>
            <div className="dash-list-pro">
              <div className="dash-row-pro">
                <div className="dash-row-icon-pro">{CloudIcon}</div>
                <div className="dash-row-main-pro"><strong>Nuvem</strong><span>Sincronização do banco</span></div>
                <span className={`dash-row-badge-pro ${cloudStatus === 'online' ? 'done' : 'urgent'}`}>{cloudStatus === 'online' ? 'Online' : 'Offline'}</span>
              </div>
              <div className="dash-row-pro">
                <div className="dash-row-icon-pro">{UserIcon}</div>
                <div className="dash-row-main-pro"><strong>Usuários online</strong><span>Pessoas conectadas agora</span></div>
                <span className="dash-row-badge-pro">{usuariosOnline.length}</span>
              </div>
              <div className="dash-row-pro">
                <div className="dash-row-icon-pro" style={{ background: alertasPrazo.critico ? 'rgba(239,68,68,.14)' : undefined, color: alertasPrazo.critico ? '#fecaca' : undefined }}>{AlertIcon}</div>
                <div className="dash-row-main-pro"><strong>Críticas</strong><span>Urgentes ou acima de 48h</span></div>
                <span className={`dash-row-badge-pro ${alertasPrazo.critico ? 'urgent' : ''}`}>{alertasPrazo.critico}</span>
              </div>
              <div className="dash-row-pro">
                <div className="dash-row-icon-pro" style={{ background: alertasPrazo.atencao ? 'rgba(249,115,22,.14)' : undefined, color: alertasPrazo.atencao ? '#fdba74' : undefined }}>{AlertIcon}</div>
                <div className="dash-row-main-pro"><strong>Atenção</strong><span>Entre 24h e 48h ou média</span></div>
                <span className={`dash-row-badge-pro ${alertasPrazo.atencao ? 'urgent' : ''}`}>{alertasPrazo.atencao}</span>
              </div>
            </div>
          </Panel>
        </aside>
      </div>
    </section>
  )
}

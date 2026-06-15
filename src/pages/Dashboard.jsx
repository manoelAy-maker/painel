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

function Kpi({ label, value, sub, icon, primary, color = '#60a5fa' }) {
  return (
    <div className={`command-kpi ${primary ? 'primary' : ''}`}>
      <div className="kpi-label">
        <span>{label}</span>
        <span className="command-kpi-icon" style={!primary ? { color, background: `${color}22` } : {}}>{icon}</span>
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

function ListaEstadias({ itens, onAbrir }) {
  if (!itens.length) return <div className="dash-empty-pro">Nenhuma estadia lançada ainda.</div>
  return (
    <div className="dash-list-pro">
      {itens.slice(0, 6).map((e) => (
        <div key={e.id} className="dash-row-pro">
          <div className="dash-row-icon-pro">🚛</div>
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
          <div className="dash-row-icon-pro" style={{ background: e.prioridade === 'Urgente' ? 'rgba(239,68,68,.14)' : 'rgba(249,115,22,.14)', color: e.prioridade === 'Urgente' ? '#fecaca' : '#fdba74' }}>📋</div>
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
          <div className="dash-row-icon-pro">#{index + 1}</div>
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
            <div className="operator-action-icon">📦</div>
            <h2>Lançar estadia</h2>
            <p>Preencher motorista, placa, peso, horários, valor e anexos da estadia já tratada.</p>
          </div>
          <span className="operator-action-btn">Abrir lançamento →</span>
        </button>

        <button className="operator-action-card orange" onClick={onNovaPendencia}>
          <div className="operator-action-top">
            <div className="operator-action-icon">📋</div>
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

  const atividades = activityFeed?.length ? activityFeed : [
    { titulo: 'Sistema conectado', texto: cloudStatus === 'online' ? 'Dados sincronizados com a nuvem.' : 'Aguardando conexão estável.', icone: '☁️', tempo: 'agora' },
    { titulo: 'Estadias monitoradas', texto: `${totalEstadias} registro(s) no painel atual.`, icone: '📦', tempo: 'hoje' },
    { titulo: 'Pendências de lançamento', texto: `${totalPendentes} item(ns) aguardando lançamento.`, icone: '📋', tempo: 'hoje' },
    { titulo: 'Alertas críticos', texto: `${alertasPrazo.critico} pendência(s) acima do prazo ou urgente.`, icone: '🚨', tempo: 'hoje' },
    { titulo: 'Usuários online', texto: `${usuariosOnline.length} pessoa(s) conectada(s).`, icone: '👥', tempo: 'online' },
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
        <div className="command-title"><h1>Dashboard</h1><span>Painel administrativo de estadias · visão operacional</span></div>
        <div className="command-search"><span>⌕</span><input placeholder="Use os filtros nas telas de estadia e pendência" readOnly /><kbd>{cloudStatus === 'online' ? 'ON' : 'OFF'}</kbd></div>
        <div className="command-user"><div className="command-user-avatar">{usuarioAtual?.avatar || primeiroNome[0]}</div><div><strong>{usuarioAtual?.nome || primeiroNome}</strong><small>{usuarioAtual?.cargo || 'Admin'}</small></div></div>
      </div>

      <div className="dash-action-strip-pro">
        <button className="dash-action-tile-pro" onClick={onNovaLancada}><i>📦</i><strong>Nova estadia</strong><span>Lançar registro completo</span></button>
        <button className="dash-action-tile-pro" onClick={onNovaPendencia}><i>📋</i><strong>Nova pendência</strong><span>Enviar para tratar depois</span></button>
        <button className="dash-action-tile-pro" onClick={() => mudarAba('relatorios')}><i>📊</i><strong>Relatórios</strong><span>Exportar e analisar</span></button>
        <button className="dash-action-tile-pro" onClick={() => mudarAba('lixeira')}><i>🗑️</i><strong>Lixeira</strong><span>Restaurar registros</span></button>
      </div>

      <div className="command-kpis">
        <Kpi primary label="Valor total" value={valorTotal} sub={`${totalEstadias} estadias registradas`} icon="$" />
        <Kpi label="Total lançadas" value={totalEstadias} sub="registros no painel" icon="▧" color="#2563eb" />
        <Kpi label="A lançar" value={totalPendentes} sub="pendências abertas" icon="▣" color="#a855f7" />
        <Kpi label="Críticas" value={alertasPrazo.critico} sub="urgentes ou acima de 48h" icon="!" color="#ef4444" />
        <Kpi label="Concluídas" value={totalConcluidas} sub="feitas/finalizadas" icon="✓" color="#22c55e" />
      </div>

      <div className="estadia-command">
        <div>
          <div className="command-grid">
            <Panel title="Status das estadias" subtitle="Distribuição real dos lançamentos">
              <div className="command-donut-wrap">
                <DonutCommand dados={statusDados} total={totalEstadias} />
                <div className="command-legend-list">
                  {statusDados.map((d, i) => <div key={d.name} className="command-legend-row"><span className="command-legend-dot" style={{ background: STATUS_CORES[i] }} /><span>{d.name}</span><strong>{d.value}</strong></div>)}
                </div>
              </div>
            </Panel>

            <Panel title="Alertas de prazo" subtitle="Pendências vencidas e em atenção" onAction={() => mudarAba('alancar')} action="Abrir">
              <div className="command-priority-bars">
                {[
                  { name: 'Crítico', value: alertasPrazo.critico, color: '#ef4444' },
                  { name: 'Atenção', value: alertasPrazo.atencao, color: '#f97316' },
                  { name: 'No prazo', value: alertasPrazo.normal, color: '#22c55e' },
                ].map(p => <div key={p.name} className="command-priority-row"><span>{p.name}</span><div className="command-bar"><i style={{ width: `${Math.max(8, (p.value / Math.max(alertasPrazo.total, 1)) * 100)}%`, background: p.color }} /></div><strong>{p.value}</strong></div>)}
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
              {atividades.slice(0, 5).map((a, i) => <div key={`${a.titulo}-${i}`} className="command-activity"><div className="command-activity-icon" style={{ background: ['#2563eb', '#22c55e', '#a855f7', '#f97316', '#0ea5e9'][i % 5] }}>{a.icone}</div><div><strong>{a.titulo}</strong><span>{a.texto}</span></div><time>{a.tempo}</time></div>)}
            </div>
          </Panel>

          <Panel title="Produtividade" subtitle="Ranking por usuário">
            <ListaProdutividade itens={produtividade} />
          </Panel>

          <Panel title="Resumo da operação" subtitle="Indicadores úteis" action="Admin" onAction={() => mudarAba('admin')}>
            <div className="dash-list-pro">
              <div className="dash-row-pro"><div className="dash-row-icon-pro">☁️</div><div className="dash-row-main-pro"><strong>Nuvem</strong><span>Sincronização do banco</span></div><span className={`dash-row-badge-pro ${cloudStatus === 'online' ? 'done' : 'urgent'}`}>{cloudStatus === 'online' ? 'Online' : 'Offline'}</span></div>
              <div className="dash-row-pro"><div className="dash-row-icon-pro">👥</div><div className="dash-row-main-pro"><strong>Usuários online</strong><span>Pessoas conectadas agora</span></div><span className="dash-row-badge-pro">{usuariosOnline.length}</span></div>
              <div className="dash-row-pro"><div className="dash-row-icon-pro">🚨</div><div className="dash-row-main-pro"><strong>Críticas</strong><span>Urgentes ou acima de 48h</span></div><span className={`dash-row-badge-pro ${alertasPrazo.critico ? 'urgent' : ''}`}>{alertasPrazo.critico}</span></div>
              <div className="dash-row-pro"><div className="dash-row-icon-pro">⚠️</div><div className="dash-row-main-pro"><strong>Atenção</strong><span>Entre 24h e 48h ou média</span></div><span className={`dash-row-badge-pro ${alertasPrazo.atencao ? 'urgent' : ''}`}>{alertasPrazo.atencao}</span></div>
            </div>
          </Panel>
        </aside>
      </div>
    </section>
  )
}

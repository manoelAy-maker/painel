import { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import { baixarArquivo, dataISOTexto, dinheiro, moedaNumero, resumirSLA } from '../utils/index'
import { nomeFilial } from '../data/filiais'
import { podeAdministrar } from '../utils/roles'
import { filtrarPorAcesso, resumirAlertasPrazo, gerarResumoProdutividade } from '../utils/regrasOperacionais'
import '../relatorios-pro.css'

const safe = (v, fallback = 'Não informado') => {
  const txt = String(v || '').trim()
  return txt || fallback
}

function somarPor(lista, campo) {
  const map = new Map()
  lista.forEach(item => {
    const chave = safe(item[campo])
    const atual = map.get(chave) || { nome: chave, qtd: 0, valor: 0, horas: 0 }
    atual.qtd += 1
    atual.valor += moedaNumero(item.valor)
    atual.horas += Number(String(item.horas || 0).replace(',', '.')) || 0
    map.set(chave, atual)
  })
  return [...map.values()].sort((a, b) => b.qtd - a.qtd || b.valor - a.valor)
}

function csvEscape(v) {
  return `"${String(v ?? '').replaceAll('"', '""')}"`
}

function htmlEscape(v) {
  return String(v ?? '-')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function RankingCard({ titulo, subtitulo, dados }) {
  const maior = Math.max(...dados.map(d => d.qtd), 1)
  return (
    <div className="dash-chart-card">
      <div className="dash-chart-head"><div><h3>{titulo}</h3><span>{subtitulo}</span></div></div>
      <div style={{ display: 'grid', gap: 10 }}>
        {dados.length === 0 && <div className="empty" style={{ padding: 18 }}>Sem dados no período.</div>}
        {dados.slice(0, 8).map((item, idx) => (
          <div key={item.nome} style={{ border: '1px solid var(--line)', borderRadius: 14, padding: 12, background: 'var(--bg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
              <div style={{ minWidth: 0 }}>
                <strong style={{ fontSize: 14 }}>{idx + 1}. {item.nome}</strong>
                <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 3 }}>{item.qtd} ocorrência(s) · {dinheiro(item.valor)} · {item.horas.toFixed(2)} h</div>
              </div>
              <strong style={{ fontSize: 20 }}>{item.qtd}</strong>
            </div>
            <div style={{ height: 7, borderRadius: 999, background: 'rgba(148,163,184,.22)', marginTop: 10, overflow: 'hidden' }}>
              <div style={{ width: `${Math.max(8, (item.qtd / maior) * 100)}%`, height: '100%', borderRadius: 999, background: 'linear-gradient(90deg,#2563eb,#7c3aed)' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Relatorios() {
  const { estadias, estadiasALancar, usuarioAtual } = useApp()
  const [tipoBase, setTipoBase] = useState('lancadas')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [busca, setBusca] = useState('')
  const [statusFiltro, setStatusFiltro] = useState('')
  const [filialFiltro, setFilialFiltro] = useState('')
  const [responsavelFiltro, setResponsavelFiltro] = useState('')

  const isAdmin = podeAdministrar(usuarioAtual)

  const base = useMemo(() => {
    const lancadas = filtrarPorAcesso(estadias, usuarioAtual).map(e => ({ ...e, origemRelatorio: 'Lançada' }))
    const pendentes = filtrarPorAcesso(estadiasALancar, usuarioAtual).map(e => ({ ...e, origemRelatorio: 'A lançar' }))
    if (tipoBase === 'todas') return [...lancadas, ...pendentes]
    if (tipoBase === 'alancar') return pendentes
    return lancadas
  }, [estadias, estadiasALancar, usuarioAtual, tipoBase])

  const opcoes = useMemo(() => {
    const unico = (campo) => [...new Set(base.map(campo).filter(Boolean))].sort()
    return {
      status: unico(item => item.status),
      filiais: unico(item => item.filial),
      responsaveis: unico(item => item.lancadoPor || item.criadoPor || item.feitoPor || item.finalizadoPor),
    }
  }, [base])

  const lista = useMemo(() => {
    return base.filter(item => {
      const data = dataISOTexto(item.dataLancamento || item.dataCriacao || item.dataFinalizado || item.dataFeito || '')
      const responsavel = item.lancadoPor || item.criadoPor || item.feitoPor || item.finalizadoPor || ''
      const nf = item.nf || item.numeroNf || ''
      const texto = [item.chamado, nf, item.motorista, item.transportadora, item.placa, item.filial, item.motivoEstadia, item.localEstadia, item.tipoFrete, item.pagoPor, item.status, responsavel].join(' ').toUpperCase()
      return (!dataInicio || data >= dataInicio)
        && (!dataFim || data <= dataFim)
        && (!statusFiltro || item.status === statusFiltro)
        && (!filialFiltro || item.filial === filialFiltro)
        && (!responsavelFiltro || responsavel === responsavelFiltro)
        && (!busca || texto.includes(busca.toUpperCase()))
    })
  }, [base, dataInicio, dataFim, busca, statusFiltro, filialFiltro, responsavelFiltro])

  const linhas = useMemo(() => lista.map(item => ({
    origem: item.origemRelatorio,
    data: item.dataLancamento || item.dataCriacao || '',
    filial: nomeFilial(item.filial),
    local: item.localEstadia || item.local || '',
    motivo: item.motivoEstadia || item.motivo || '',
    tipoFrete: item.tipoFrete || item.pagoPor || '',
    transportadora: item.transportadora || '',
    motorista: item.motorista || '',
    placa: item.placa || '',
    nf: item.nf || item.numeroNf || '',
    chamado: item.chamado || '',
    peso: item.peso || '',
    horas: item.horas || '',
    valorEstadia: item.valor || '',
    status: item.status || '',
    responsavel: item.lancadoPor || item.criadoPor || item.feitoPor || item.finalizadoPor || '',
  })), [lista])

  const totalEstadias = lista.length
  const valorTotal = lista.reduce((s, e) => s + moedaNumero(e.valor), 0)
  const horasTotal = lista.reduce((s, e) => s + (Number(String(e.horas || 0).replace(',', '.')) || 0), 0)
  const slaResumo = resumirSLA(filtrarPorAcesso(estadiasALancar, usuarioAtual))
  const alertasPrazo = resumirAlertasPrazo(lista)
  const produtividade = gerarResumoProdutividade(
    lista.filter(i => i.origemRelatorio === 'Lançada'),
    lista.filter(i => i.origemRelatorio === 'A lançar'),
  )

  const porFilial = useMemo(() => somarPor(lista.map(i => ({ ...i, filialNome: nomeFilial(i.filial) })), 'filialNome'), [lista])
  const porMotivo = useMemo(() => somarPor(lista.map(i => ({ ...i, motivoRel: i.motivoEstadia || i.motivo })), 'motivoRel'), [lista])
  const porLocal = useMemo(() => somarPor(lista.map(i => ({ ...i, localRel: i.localEstadia || i.local })), 'localRel'), [lista])
  const porFrete = useMemo(() => somarPor(lista.map(i => ({ ...i, freteRel: i.tipoFrete || i.pagoPor })), 'freteRel'), [lista])
  const porTransportadora = useMemo(() => somarPor(lista, 'transportadora'), [lista])
  const porResponsavel = useMemo(() => produtividade.map(p => ({ nome: p.usuario, qtd: p.total, valor: 0, horas: 0 })), [produtividade])

  const limparFiltros = () => {
    setDataInicio('')
    setDataFim('')
    setBusca('')
    setTipoBase('lancadas')
    setStatusFiltro('')
    setFilialFiltro('')
    setResponsavelFiltro('')
  }

  const exportarCSV = () => {
    const header = ['Origem', 'Data', 'NF', 'Chamado', 'Filial', 'Local', 'Motivo', 'Tipo frete', 'Transportadora', 'Placa', 'Motorista', 'Peso', 'Horas', 'Valor estadia', 'Status', 'Responsável']
    const body = linhas.map(l => [l.origem, l.data, l.nf, l.chamado, l.filial, l.local, l.motivo, l.tipoFrete, l.transportadora, l.placa, l.motorista, l.peso, l.horas, l.valorEstadia, l.status, l.responsavel].map(csvEscape).join(';'))
    baixarArquivo(`relatorio-estadias-${new Date().toISOString().slice(0, 10)}.csv`, [header.map(csvEscape).join(';'), ...body].join('\n'), 'text/csv;charset=utf-8')
  }

  const exportarResumo = () => {
    const resumo = {
      geradoEm: new Date().toLocaleString('pt-BR'),
      filtros: { tipoBase, dataInicio, dataFim, busca, statusFiltro, filialFiltro, responsavelFiltro },
      totais: { registros: totalEstadias, valorTotal: dinheiro(valorTotal), horasTotal: horasTotal.toFixed(2) },
      alertasPrazo,
      slaPendencias: slaResumo,
      produtividade,
      porFilial,
      porMotivo,
      porLocal,
      porFrete,
      porTransportadora,
      caminhões: linhas,
    }
    baixarArquivo(`resumo-executivo-estadias-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(resumo, null, 2), 'application/json')
  }

  const exportarPDF = () => {
    const periodoTxt = dataInicio || dataFim ? `${dataInicio || 'início'} até ${dataFim || 'hoje'}` : 'Todos os períodos'
    const htmlRank = (titulo, dados) => `
      <section class="rank"><h2>${htmlEscape(titulo)}</h2>${dados.slice(0, 8).map((d, i) => `<div class="row"><span>${i + 1}. ${htmlEscape(d.nome)}</span><strong>${d.qtd}</strong><em>${dinheiro(d.valor)}</em></div>`).join('') || '<p>Sem dados.</p>'}</section>
    `
    const linhasDetalhadas = linhas.slice(0, 180).map((l, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${htmlEscape(l.data || '-')}</td>
        <td><strong>${htmlEscape(l.placa || '-')}</strong></td>
        <td>${htmlEscape(l.motorista || '-')}</td>
        <td>${htmlEscape(l.transportadora || '-')}</td>
        <td>${htmlEscape(l.nf || '-')}</td>
        <td>${htmlEscape(l.chamado || '-')}</td>
        <td>${htmlEscape(l.filial || '-')}</td>
        <td>${htmlEscape(l.peso || '-')}</td>
        <td>${htmlEscape(l.horas || '-')}</td>
        <td><strong>${htmlEscape(l.valorEstadia || '-')}</strong></td>
        <td>${htmlEscape(l.status || '-')}</td>
        <td>${htmlEscape(l.responsavel || '-')}</td>
      </tr>
    `).join('')

    const html = `<!doctype html><html><head><meta charset="utf-8"/><title>Relatório Via Log</title><style>
      *{box-sizing:border-box} body{font-family:Inter,Arial,sans-serif;margin:0;background:#f8fafc;color:#0f172a}.cover{padding:34px 36px;background:linear-gradient(135deg,#020617,#1d4ed8);color:white}.cover h1{font-size:32px;margin:0 0 8px}.cover p{opacity:.82;margin:0 0 4px}.meta{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px}.pill{border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.1);border-radius:999px;padding:6px 10px;font-size:11px}.kpis{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;padding:22px}.kpi{background:white;border:1px solid #e2e8f0;border-radius:18px;padding:16px}.kpi span{display:block;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:.04em}.kpi strong{font-size:22px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;padding:0 22px 18px}.rank{background:white;border:1px solid #e2e8f0;border-radius:18px;padding:16px}.rank h2{font-size:16px;margin:0 0 10px}.row{display:grid;grid-template-columns:1fr 44px 105px;gap:10px;border-top:1px solid #e2e8f0;padding:8px 0;font-size:11px}.section-title{padding:0 22px 10px}.section-title h2{font-size:18px;margin:0}.section-title p{margin:4px 0 0;color:#64748b;font-size:12px}.table{padding:0 22px 30px}table{width:100%;border-collapse:collapse;background:white;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden}th,td{border-bottom:1px solid #e2e8f0;padding:7px 8px;font-size:9.5px;text-align:left;vertical-align:top}th{background:#f1f5f9;color:#475569;text-transform:uppercase;font-size:8px;letter-spacing:.04em}.total-row{background:#eff6ff;font-weight:800}.obs{padding:0 22px 24px;color:#64748b;font-size:11px}@page{size:A4 landscape;margin:10mm}@media print{button{display:none}.cover{print-color-adjust:exact;-webkit-print-color-adjust:exact}body{background:white}.table{page-break-inside:auto}tr{page-break-inside:avoid;page-break-after:auto}}
    </style></head><body>
      <div class="cover">
        <h1>Relatório Executivo de Estadias</h1>
        <p>Via Log · Gerado em ${new Date().toLocaleString('pt-BR')}</p>
        <div class="meta"><span class="pill">Período: ${htmlEscape(periodoTxt)}</span><span class="pill">Base: ${htmlEscape(tipoBase)}</span><span class="pill">Status: ${htmlEscape(statusFiltro || 'Todos')}</span><span class="pill">Filial: ${htmlEscape(filialFiltro ? nomeFilial(filialFiltro) : 'Todas')}</span><span class="pill">Responsável: ${htmlEscape(responsavelFiltro || 'Todos')}</span></div>
      </div>
      <div class="kpis"><div class="kpi"><span>Valor total</span><strong>${dinheiro(valorTotal)}</strong></div><div class="kpi"><span>Caminhões/registros</span><strong>${totalEstadias}</strong></div><div class="kpi"><span>Horas totais</span><strong>${horasTotal.toFixed(2)}h</strong></div><div class="kpi"><span>Críticos</span><strong>${alertasPrazo.critico}</strong></div><div class="kpi"><span>Atenção</span><strong>${alertasPrazo.atencao}</strong></div></div>
      <div class="grid">${htmlRank('Filiais com mais estadia', porFilial)}${htmlRank('Responsáveis / produtividade', porResponsavel)}${htmlRank('Motivos mais frequentes', porMotivo)}${htmlRank('Transportadoras', porTransportadora)}</div>
      <div class="section-title"><h2>Detalhamento por caminhão</h2><p>Lista com placa, motorista, NF, chamado e valor individual de cada registro filtrado.</p></div>
      <div class="table"><table><thead><tr><th>#</th><th>Data</th><th>Placa</th><th>Motorista</th><th>Transportadora</th><th>NF</th><th>Chamado</th><th>Filial</th><th>Peso</th><th>Horas</th><th>Valor</th><th>Status</th><th>Responsável</th></tr></thead><tbody>${linhasDetalhadas || '<tr><td colspan="13">Sem dados no filtro.</td></tr>'}<tr class="total-row"><td colspan="9">Total filtrado</td><td>${horasTotal.toFixed(2)}h</td><td>${dinheiro(valorTotal)}</td><td colspan="2">${totalEstadias} registro(s)</td></tr></tbody></table></div>
      <div class="obs">Observação: o PDF imprime até 180 registros por vez para não travar o navegador. Para base completa, use Exportar CSV.</div>
      <script>setTimeout(()=>window.print(),400)</script>
    </body></html>`
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(html)
    w.document.close()
  }

  if (!isAdmin) {
    return <section className="aba active"><div className="box" style={{ padding: 28, textAlign: 'center' }}><h2>Acesso restrito</h2><p style={{ color: 'var(--muted)' }}>Relatórios ficam disponíveis somente para cargos administrativos.</p></div></section>
  }

  return (
    <section className="aba active">
      <div className="report-pro-hero">
        <div className="report-pro-head">
          <div>
            <h1>Relatórios Administrativos</h1>
            <p>Analise filiais, status, responsáveis, alertas de prazo, motivos, locais, fretes e transportadoras. Exporte os dados para planilha, PDF ou resumo executivo.</p>
          </div>
          <div className="report-actions">
            <button className="report-export-btn" onClick={exportarCSV}>Exportar CSV</button>
            <button className="report-export-btn secondary" onClick={exportarPDF}>Relatório PDF</button>
            <button className="report-export-btn dark" onClick={exportarResumo}>Resumo JSON</button>
          </div>
        </div>
        <div className="report-kpis">
          <div className="report-kpi"><span>Valor total filtrado</span><strong>{dinheiro(valorTotal)}</strong></div>
          <div className="report-kpi"><span>Registros encontrados</span><strong>{totalEstadias}</strong></div>
          <div className="report-kpi"><span>Horas totais</span><strong>{horasTotal.toFixed(2)} h</strong></div>
          <div className="report-kpi"><span>Críticos</span><strong>{alertasPrazo.critico}</strong></div>
        </div>
      </div>

      <div className="box report-filter-card">
        <div className="box-title"><h2>Filtros do relatório</h2><button className="btn-light btn-small" onClick={limparFiltros}>Limpar filtros</button></div>
        <div className="filters">
          <select value={tipoBase} onChange={e => setTipoBase(e.target.value)}><option value="lancadas">Somente estadias lançadas</option><option value="alancar">Somente pendências a lançar</option><option value="todas">Tudo</option></select>
          <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
          <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} />
          <select value={statusFiltro} onChange={e => setStatusFiltro(e.target.value)}><option value="">Todos os status</option>{opcoes.status.map(s => <option key={s} value={s}>{s}</option>)}</select>
          <select value={filialFiltro} onChange={e => setFilialFiltro(e.target.value)}><option value="">Todas as filiais</option>{opcoes.filiais.map(f => <option key={f} value={f}>{nomeFilial(f)}</option>)}</select>
          <select value={responsavelFiltro} onChange={e => setResponsavelFiltro(e.target.value)}><option value="">Todos os responsáveis</option>{opcoes.responsaveis.map(r => <option key={r} value={r}>{r}</option>)}</select>
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar filial, status, responsável, placa, NF ou chamado..." />
        </div>
      </div>

      <div className="report-ranking-grid">
        <RankingCard titulo="Filiais com mais estadia" subtitulo="Quantidade, valor e horas" dados={porFilial} />
        <RankingCard titulo="Responsáveis / produtividade" subtitulo="Quem criou, lançou ou finalizou" dados={porResponsavel} />
        <RankingCard titulo="Motivos mais frequentes" subtitulo="O que mais gerou estadia" dados={porMotivo} />
        <RankingCard titulo="Locais mais críticos" subtitulo="Onde a estadia mais aparece" dados={porLocal} />
        <RankingCard titulo="Tipo de frete / responsável" subtitulo="CIF, FOB, Spot, Transportes, Logística..." dados={porFrete} />
        <RankingCard titulo="Transportadoras" subtitulo="Ranking por ocorrência" dados={porTransportadora} />
      </div>

      <div className="report-table-card"><div className="table-scroll"><table><thead><tr><th>Origem</th><th>Data</th><th>NF</th><th>Chamado</th><th>Filial</th><th>Transportadora</th><th>Placa</th><th>Motorista</th><th>Peso</th><th>Horas</th><th>Valor</th><th>Status</th><th>Responsável</th></tr></thead><tbody>{linhas.length === 0 ? <tr><td colSpan={13} className="empty">Nenhum dado nesse filtro.</td></tr> : linhas.slice(0, 120).map((l, i) => <tr key={`${l.origem}-${l.placa}-${i}`}><td><span className="badge badge-logistica">{l.origem}</span></td><td>{l.data || '-'}</td><td>{l.nf || '-'}</td><td>{l.chamado || '-'}</td><td>{l.filial}</td><td>{l.transportadora || '-'}</td><td><span className="plate">{l.placa || '-'}</span></td><td>{l.motorista || '-'}</td><td>{l.peso || '-'}</td><td>{l.horas || '-'}</td><td><strong>{l.valorEstadia || '-'}</strong></td><td>{l.status || '-'}</td><td>{l.responsavel || '-'}</td></tr>)}</tbody></table></div></div>
    </section>
  )
}

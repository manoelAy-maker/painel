import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../../../context/AppContext'
import '../../../styles/controle-embarque.css'

const STORAGE_KEY = 'controleEmbarqueViaLog'
const STATUS = ['AG. CARREGAMENTO', 'CARREGADO', 'PENDENTE', 'CANCELADO']
const SEGURADORA = ['APROVADO', 'PENDENTE', 'REPROVADO']
const STATUS_CLASS = {
  'CARREGADO': 'ok',
  'AG. CARREGAMENTO': 'wait',
  'PENDENTE': 'hold',
  'CANCELADO': 'bad',
}

const rotasIniciais = [
  {
    id: 'farelo-jatai-santos-121398',
    titulo: 'FARELO - JATAI FABRICA X SANTOS',
    subtitulo: 'JATAI LDC X SÃO SANTOS LOTE - 121398',
    produto: 'FARELO',
    origem: 'JATAI FABRICA',
    destino: 'SANTOS',
    lote: '121398',
    cor: '#8bcf4f',
    linhas: [
      { cota: 1, placa: 'FWC-8G22', peso: '37.960', ordem: true, cte: true, transportadora: 'FERPLAC - COMERCIO DE MADEIRA E ARTEFATOS LTDA', responsavel: '', status: 'CARREGADO', seguradora: 'APROVADO', chamadoMdfe: '' },
      { cota: 2, placa: 'EOE-5D70', peso: '37.320', ordem: true, cte: true, transportadora: 'EJC LOGISTICA LTDA', responsavel: '', status: 'CARREGADO', seguradora: 'APROVADO', chamadoMdfe: '' },
      { cota: 3, placa: 'FWQ-4B75', peso: '', ordem: true, cte: false, transportadora: 'R. A. FURLANETO TRANSPORTES LTDA', responsavel: '', status: 'AG. CARREGAMENTO', seguradora: 'APROVADO', chamadoMdfe: '' },
      { cota: 4, placa: 'FGP-9J13', peso: '', ordem: true, cte: false, transportadora: 'R. A. FURLANETO TRANSPORTES LTDA', responsavel: '', status: 'AG. CARREGAMENTO', seguradora: 'APROVADO', chamadoMdfe: '' },
    ],
  },
  {
    id: 'soja-agrogene-ldc-123075',
    titulo: 'SOJA - ARMZ AGROGENE X LDC JATAI',
    subtitulo: 'ARMZ AGROGENE X FABRICA JATAI LOTE - 123075',
    produto: 'SOJA',
    origem: 'ARMZ AGROGENE',
    destino: 'LDC JATAI',
    lote: '123075',
    cor: '#8bcf4f',
    linhas: [
      { cota: 1, placa: 'LXA-1Z7', peso: '38.420', ordem: true, cte: true, transportadora: 'JUNIO CESAR PEREIRA DE ALMEIDA SILVA', responsavel: '', status: 'CARREGADO', seguradora: 'APROVADO', chamadoMdfe: '' },
      { cota: 2, placa: 'MSI-1J38', peso: '37.000', ordem: true, cte: true, transportadora: 'WILSON DE JESUS MOREIRA', responsavel: '', status: 'CARREGADO', seguradora: 'APROVADO', chamadoMdfe: '' },
      { cota: 3, placa: 'JYV-2147', peso: '37.290', ordem: true, cte: true, transportadora: 'CARLOS ROBERTO DE SOUZA FILHO', responsavel: '', status: 'CARREGADO', seguradora: 'APROVADO', chamadoMdfe: '' },
      { cota: 13, placa: 'KEB-7H75', peso: '', ordem: true, cte: false, transportadora: 'SAMUEL FERREIRA BARROS', responsavel: '', status: 'AG. CARREGAMENTO', seguradora: 'APROVADO', chamadoMdfe: '' },
    ],
  },
]

function gerarId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function carregar() {
  try {
    const salvo = JSON.parse(localStorage.getItem(STORAGE_KEY))
    return Array.isArray(salvo) && salvo.length ? salvo : rotasIniciais
  } catch {
    return rotasIniciais
  }
}

function numeroPeso(valor) {
  const n = Number(String(valor || '').replace(/\./g, '').replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

function pesoTexto(valor) {
  return numeroPeso(valor).toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })
}

const Campo = ({ value, onChange, className = '', ...props }) => (
  <input className={`embarque-input ${className}`} value={value || ''} onChange={(e) => onChange(e.target.value)} {...props} />
)

const CheckCell = ({ checked, onChange }) => (
  <button className={`embarque-check ${checked ? 'on' : ''}`} onClick={() => onChange(!checked)} title={checked ? 'Marcado' : 'Pendente'}>
    {checked ? 'X' : ''}
  </button>
)

export default function ControleEmbarque() {
  const { usuarioAtual, toast } = useApp()
  const [rotas, setRotas] = useState(carregar)
  const [busca, setBusca] = useState('')
  const [rotaAtiva, setRotaAtiva] = useState('todas')
  const [statusFiltro, setStatusFiltro] = useState('Todos')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rotas))
  }, [rotas])

  const resumo = useMemo(() => {
    const linhas = rotas.flatMap(r => r.linhas.map(l => ({ ...l, rotaId: r.id })))
    return {
      total: linhas.length,
      carregados: linhas.filter(l => l.status === 'CARREGADO').length,
      aguardando: linhas.filter(l => l.status === 'AG. CARREGAMENTO').length,
      pendentes: linhas.filter(l => !l.ordem || !l.cte || l.seguradora !== 'APROVADO').length,
      peso: linhas.reduce((acc, l) => acc + numeroPeso(l.peso), 0),
    }
  }, [rotas])

  const rotasFiltradas = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return rotas
      .filter(r => rotaAtiva === 'todas' || r.id === rotaAtiva)
      .map(r => ({
        ...r,
        linhas: r.linhas.filter(l => {
          const texto = [r.titulo, r.subtitulo, r.lote, l.cota, l.placa, l.peso, l.transportadora, l.responsavel, l.status, l.seguradora, l.chamadoMdfe].join(' ').toLowerCase()
          const bateBusca = !q || texto.includes(q)
          const bateStatus = statusFiltro === 'Todos' || l.status === statusFiltro
          return bateBusca && bateStatus
        }),
      }))
      .filter(r => r.linhas.length || (!q && statusFiltro === 'Todos'))
  }, [rotas, busca, rotaAtiva, statusFiltro])

  function atualizarLinha(rotaId, index, campo, valor) {
    setRotas(prev => prev.map(r => r.id !== rotaId ? r : ({
      ...r,
      linhas: r.linhas.map((l, i) => i === index ? { ...l, [campo]: valor } : l),
    })))
  }

  function adicionarLinha(rotaId) {
    setRotas(prev => prev.map(r => r.id !== rotaId ? r : ({
      ...r,
      linhas: [...r.linhas, { cota: r.linhas.length + 1, placa: '', peso: '', ordem: false, cte: false, transportadora: '', responsavel: usuarioAtual?.nome || '', status: 'AG. CARREGAMENTO', seguradora: 'PENDENTE', chamadoMdfe: '' }],
    })))
    toast?.('Linha adicionada ao embarque.', 'ok')
  }

  function removerLinha(rotaId, index) {
    if (!confirm('Remover esta linha do embarque?')) return
    setRotas(prev => prev.map(r => r.id !== rotaId ? r : ({ ...r, linhas: r.linhas.filter((_, i) => i !== index) })))
  }

  function novaRota() {
    const id = gerarId()
    setRotas(prev => [{
      id,
      titulo: 'NOVA ROTA - ORIGEM X DESTINO',
      subtitulo: 'INFORME O LOTE',
      produto: '', origem: '', destino: '', lote: '', cor: '#8bcf4f',
      linhas: [{ cota: 1, placa: '', peso: '', ordem: false, cte: false, transportadora: '', responsavel: usuarioAtual?.nome || '', status: 'AG. CARREGAMENTO', seguradora: 'PENDENTE', chamadoMdfe: '' }],
    }, ...prev])
    setRotaAtiva(id)
  }

  function atualizarRota(rotaId, campo, valor) {
    setRotas(prev => prev.map(r => r.id === rotaId ? { ...r, [campo]: valor } : r))
  }

  function limparTudo() {
    if (!confirm('Limpar o controle e voltar para o modelo inicial?')) return
    setRotas(rotasIniciais)
  }

  return (
    <section className="embarque-page">
      <div className="embarque-hero">
        <div>
          <span className="embarque-kicker">Operação · Embarques</span>
          <h1>Controle de Embarque</h1>
          <p>Controle por rota e lote no padrão da planilha: cota, placa, peso, ordem, CTE, transportadora, responsável, status, seguradora e chamado MDF-e.</p>
        </div>
        <div className="embarque-actions">
          <button onClick={novaRota}>+ Nova rota</button>
          <button className="ghost" onClick={limparTudo}>Restaurar modelo</button>
        </div>
      </div>

      <div className="embarque-kpis">
        <div><strong>{resumo.total}</strong><span>Cotas</span></div>
        <div><strong>{resumo.carregados}</strong><span>Carregados</span></div>
        <div><strong>{resumo.aguardando}</strong><span>Ag. carregamento</span></div>
        <div><strong>{resumo.pendentes}</strong><span>Pendências doc/seg.</span></div>
        <div><strong>{pesoTexto(resumo.peso)}</strong><span>Peso total</span></div>
      </div>

      <div className="embarque-toolbar">
        <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar placa, lote, transportadora, status..." />
        <select value={rotaAtiva} onChange={e => setRotaAtiva(e.target.value)}>
          <option value="todas">Todas as rotas</option>
          {rotas.map(r => <option key={r.id} value={r.id}>{r.titulo}</option>)}
        </select>
        <select value={statusFiltro} onChange={e => setStatusFiltro(e.target.value)}>
          <option>Todos</option>
          {STATUS.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="embarque-grid">
        {rotasFiltradas.map(rota => {
          const totalPeso = rota.linhas.reduce((acc, l) => acc + numeroPeso(l.peso), 0)
          return (
            <article className="embarque-card" key={rota.id}>
              <div className="embarque-title" style={{ background: rota.cor }}>
                <Campo value={rota.titulo} onChange={v => atualizarRota(rota.id, 'titulo', v.toUpperCase())} />
              </div>
              <div className="embarque-subtitle">
                <Campo value={rota.subtitulo} onChange={v => atualizarRota(rota.id, 'subtitulo', v.toUpperCase())} />
              </div>
              <div className="embarque-table-wrap">
                <table className="embarque-table">
                  <thead>
                    <tr>
                      <th>COTA</th><th>PLACA</th><th>PESO</th><th>ORDEM</th><th>CTE</th><th>TRANSP</th><th>RESPONSÁVEL</th><th>STATUS</th><th>SEGURADORA</th><th>CHAMADO MDFE</th><th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rota.linhas.map((linha, index) => (
                      <tr key={`${rota.id}-${index}`} className={STATUS_CLASS[linha.status] || ''}>
                        <td><Campo value={linha.cota} onChange={v => atualizarLinha(rota.id, index, 'cota', v)} /></td>
                        <td><Campo value={linha.placa} onChange={v => atualizarLinha(rota.id, index, 'placa', v.toUpperCase())} /></td>
                        <td><Campo value={linha.peso} onChange={v => atualizarLinha(rota.id, index, 'peso', v)} /></td>
                        <td><CheckCell checked={linha.ordem} onChange={v => atualizarLinha(rota.id, index, 'ordem', v)} /></td>
                        <td><CheckCell checked={linha.cte} onChange={v => atualizarLinha(rota.id, index, 'cte', v)} /></td>
                        <td><Campo value={linha.transportadora} onChange={v => atualizarLinha(rota.id, index, 'transportadora', v.toUpperCase())} /></td>
                        <td><Campo value={linha.responsavel} onChange={v => atualizarLinha(rota.id, index, 'responsavel', v)} /></td>
                        <td>
                          <select value={linha.status} onChange={e => atualizarLinha(rota.id, index, 'status', e.target.value)}>
                            {STATUS.map(s => <option key={s}>{s}</option>)}
                          </select>
                        </td>
                        <td>
                          <select value={linha.seguradora} onChange={e => atualizarLinha(rota.id, index, 'seguradora', e.target.value)}>
                            {SEGURADORA.map(s => <option key={s}>{s}</option>)}
                          </select>
                        </td>
                        <td><Campo value={linha.chamadoMdfe} onChange={v => atualizarLinha(rota.id, index, 'chamadoMdfe', v)} /></td>
                        <td><button className="row-del" onClick={() => removerLinha(rota.id, index)}>×</button></td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr><td colSpan="2">TOTAL</td><td>{pesoTexto(totalPeso)}</td><td colSpan="8"></td></tr>
                  </tfoot>
                </table>
              </div>
              <div className="embarque-card-foot">
                <button onClick={() => adicionarLinha(rota.id)}>+ Adicionar cota</button>
                <span>{rota.linhas.length} veículos · {pesoTexto(totalPeso)} toneladas</span>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

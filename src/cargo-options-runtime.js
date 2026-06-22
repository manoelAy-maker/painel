const CARGOS_AYRES = [
  'Analista Júnior',
  'Analista Pleno',
  'Analista Sênior',
  'Coordenador',
  'Admin',
  'Operador',
  'Visualizador',
]

const ESTADOS_REGIAO_APROVADORA = [
  ['GO', 'Goiás - GO'],
  ['MT', 'Mato Grosso - MT'],
  ['MG', 'Minas Gerais - MG'],
  ['PR', 'Paraná - PR'],
  ['SP', 'São Paulo - SP'],
  ['OUTRO', 'Outro estado'],
]

function labelDoSelect(select) {
  const field = select.closest('.field, div')
  return String(field?.querySelector('label')?.textContent || '').trim().toLowerCase()
}

function aplicarCargos() {
  document.querySelectorAll('select').forEach(select => {
    const label = labelDoSelect(select)
    if (label !== 'cargo') return

    const atual = select.value
    const existentes = new Set([...select.options].map(o => o.value || o.textContent))

    CARGOS_AYRES.forEach(cargo => {
      if (existentes.has(cargo)) return
      const opt = document.createElement('option')
      opt.value = cargo
      opt.textContent = cargo
      select.appendChild(opt)
    })

    if (atual) select.value = atual
  })
}

function aplicarEstadosRegiaoAprovadora() {
  document.querySelectorAll('select').forEach(select => {
    const label = labelDoSelect(select)
    if (!label.includes('região aprovadora')) return
    if (select.dataset.ayresEstadosOk === '1') return

    const atual = String(select.value || '')
    select.innerHTML = '<option value="">Selecione</option>'

    ESTADOS_REGIAO_APROVADORA.forEach(([valor, texto]) => {
      const opt = document.createElement('option')
      opt.value = valor
      opt.textContent = texto
      select.appendChild(opt)
    })

    if (['GO', 'MT', 'MG', 'PR', 'SP', 'OUTRO'].includes(atual)) {
      select.value = atual
    }

    select.dataset.ayresEstadosOk = '1'
  })
}

function aplicarAjustesAyres() {
  aplicarCargos()
  aplicarEstadosRegiaoAprovadora()
}

if (typeof window !== 'undefined') {
  window.addEventListener('load', aplicarAjustesAyres)
  const observer = new MutationObserver(aplicarAjustesAyres)
  observer.observe(document.documentElement, { childList: true, subtree: true })
}

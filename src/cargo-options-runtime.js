const CARGOS_AYRES = [
  'Analista Júnior',
  'Analista Pleno',
  'Analista Sênior',
  'Coordenador',
  'Admin',
  'Operador',
  'Visualizador',
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

if (typeof window !== 'undefined') {
  window.addEventListener('load', aplicarCargos)
  const observer = new MutationObserver(aplicarCargos)
  observer.observe(document.documentElement, { childList: true, subtree: true })
}

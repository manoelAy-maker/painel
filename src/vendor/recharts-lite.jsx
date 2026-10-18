import React from 'react'

const FALLBACK_COLORS = ['#2563eb', '#22c55e', '#f97316', '#a855f7', '#0ea5e9']

export function Cell() {
  return null
}

export function Tooltip() {
  return null
}

export function ResponsiveContainer({ width = '100%', height = 190, children }) {
  return (
    <div style={{ width, height, minWidth: 0, position: 'relative' }}>
      {children}
    </div>
  )
}

export function PieChart({ children }) {
  return (
    <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', position: 'relative' }}>
      {children}
    </div>
  )
}

function montarGradiente(data, cores) {
  const total = data.reduce((soma, item) => soma + Math.max(0, Number(item?.value) || 0), 0)
  if (!total) return 'conic-gradient(rgba(148,163,184,.18) 0 100%)'

  let acumulado = 0
  const fatias = data.map((item, index) => {
    const inicio = (acumulado / total) * 100
    acumulado += Math.max(0, Number(item?.value) || 0)
    const fim = (acumulado / total) * 100
    const cor = cores[index] || FALLBACK_COLORS[index % FALLBACK_COLORS.length]
    return `${cor} ${inicio.toFixed(3)}% ${fim.toFixed(3)}%`
  })

  return `conic-gradient(${fatias.join(',')})`
}

export function Pie({ data = [], children, innerRadius = 58, outerRadius = 82 }) {
  const cells = React.Children.toArray(children)
  const cores = cells.map((cell, index) => cell?.props?.fill || FALLBACK_COLORS[index % FALLBACK_COLORS.length])
  const diametro = Math.max(40, Number(outerRadius) * 2)
  const interno = Math.max(0, Math.min(Number(innerRadius) || 0, Number(outerRadius) || 1))
  const furoPct = Math.max(0, Math.min(92, (interno / Math.max(Number(outerRadius) || 1, 1)) * 100))
  const total = data.reduce((soma, item) => soma + Math.max(0, Number(item?.value) || 0), 0)
  const label = data.map(item => `${item?.name || 'Item'}: ${Number(item?.value) || 0}`).join(', ')

  return (
    <div
      role="img"
      aria-label={label || 'Gráfico sem dados'}
      title={label}
      style={{
        width: diametro,
        height: diametro,
        borderRadius: '50%',
        background: montarGradiente(data, cores),
        position: 'relative',
        boxShadow: total ? 'inset 0 0 0 1px rgba(255,255,255,.04)' : 'none',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          width: `${furoPct}%`,
          height: `${furoPct}%`,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          background: 'var(--card, #0f172a)',
          boxShadow: '0 0 0 4px rgba(2,6,23,.08)',
        }}
      />
    </div>
  )
}

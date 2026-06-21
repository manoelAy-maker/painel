export function mapaUrl(lat, lng) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return ''
  return `https://www.google.com/maps?q=${lat},${lng}`
}

export function precisaoLabel(metros) {
  const n = Number(metros)
  if (!Number.isFinite(n)) return 'Sem precisão'
  if (n <= 25) return 'Alta precisão'
  if (n <= 100) return 'Boa precisão'
  if (n <= 500) return 'Precisão média'
  return 'Baixa precisão'
}

export function statusLocalizacao(metros) {
  const n = Number(metros)
  if (!Number.isFinite(n)) return 'sem precisão'
  if (n <= 100) return 'precisa'
  if (n <= 500) return 'atenção'
  return 'baixa precisão'
}

export function obterLocalizacaoAltaPrecisao() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocalização indisponível'))
      return
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 18000,
      maximumAge: 0,
    })
  })
}

export async function registrarLocalizacaoUsuario(usuario, salvarFn) {
  const base = {
    id: `loc_${usuario?.usuario || 'usuario'}_${Date.now()}`,
    usuario: usuario?.usuario || '-',
    nome: usuario?.nome || usuario?.usuario || 'Usuário',
    cargo: usuario?.cargo || '',
    filial: usuario?.filial || 'jatai-go',
    origem: 'login',
    dataISO: new Date().toISOString(),
    data: new Date().toLocaleString('pt-BR'),
    userAgent: navigator.userAgent,
  }

  try {
    const pos = await obterLocalizacaoAltaPrecisao()
    const coords = pos.coords
    const latitude = Number(coords.latitude)
    const longitude = Number(coords.longitude)
    const precisaoMetros = Number(coords.accuracy)

    const registro = {
      ...base,
      status: statusLocalizacao(precisaoMetros),
      statusTexto: precisaoLabel(precisaoMetros),
      latitude,
      longitude,
      precisaoMetros,
      altitude: Number.isFinite(coords.altitude) ? coords.altitude : null,
      direcao: Number.isFinite(coords.heading) ? coords.heading : null,
      velocidade: Number.isFinite(coords.speed) ? coords.speed : null,
      mapa: mapaUrl(latitude, longitude),
      localizacaoAutorizada: true,
    }

    await salvarFn(registro, 'localizacao', registro.filial)
    return registro
  } catch (err) {
    const registro = {
      ...base,
      status: err?.code === 1 ? 'negada' : 'erro',
      statusTexto: err?.code === 1 ? 'Localização negada' : 'Localização não capturada',
      erro: err?.message || 'Não foi possível obter localização',
      localizacaoAutorizada: false,
    }

    try { await salvarFn(registro, 'localizacao', registro.filial) } catch {}
    return registro
  }
}

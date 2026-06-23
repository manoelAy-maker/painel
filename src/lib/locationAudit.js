export function mapaUrl() {
  return ''
}

export function precisaoLabel() {
  return ''
}

export function statusLocalizacao() {
  return ''
}

export function obterLocalizacaoAltaPrecisao() {
  return Promise.reject(new Error('Localização desativada'))
}

export async function registrarLocalizacaoUsuario() {
  throw new Error('Localização desativada')
}

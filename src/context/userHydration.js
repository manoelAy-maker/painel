const login = usuario => String(usuario?.usuario || '').trim().toLowerCase()

export function mesclarUsuariosDuranteLeitura(remotos, confirmacoes, versaoInicio) {
  let resultado = [...remotos]
  for (const confirmacao of confirmacoes.filter(item => item.versao > versaoInicio)) {
    const anterior = resultado.find(item => login(item) === login(confirmacao.usuario))
    resultado = resultado.filter(item => login(item) !== login(confirmacao.usuario))
    resultado.push({ ...anterior, ...confirmacao.usuario })
  }
  return resultado
}

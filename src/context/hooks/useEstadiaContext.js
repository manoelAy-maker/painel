import { useApp } from '../AppContext'

export function useEstadiaContext() {
  const {
    estadias,
    estadiasALancar,
    historico,
    itemParaLancar,
    adicionarLancada,
    editarLancada,
    marcarFeito,
    finalizar,
    reabrir,
    excluirLancada,
    adicionarALancar,
    abrirParaLancar,
    excluirALancar,
    limparItemParaLancar,
    uploadAnexoItem,
    limparHistorico,
    exportarCSV,
  } = useApp()

  return {
    estadias,
    estadiasALancar,
    historico,
    itemParaLancar,
    adicionarLancada,
    editarLancada,
    marcarFeito,
    finalizar,
    reabrir,
    excluirLancada,
    adicionarALancar,
    abrirParaLancar,
    excluirALancar,
    limparItemParaLancar,
    uploadAnexoItem,
    limparHistorico,
    exportarCSV,
  }
}

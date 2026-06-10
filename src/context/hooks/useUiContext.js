import { useApp } from '../AppContext'

export function useUiContext() {
  const {
    abaAtiva,
    tema,
    somAtivo,
    toasts,
    toast,
    mudarAba,
    alternarTema,
    alternarSom,
  } = useApp()

  return {
    abaAtiva,
    tema,
    somAtivo,
    toasts,
    toast,
    mudarAba,
    alternarTema,
    alternarSom,
  }
}

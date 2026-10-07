import { useApp } from '../AppContext'

export function useUiContext() {
  const {
    abaAtiva,
    tema,
    somAtivo,
    toasts,
    toast,
    mudarAba,
    setTema,
    setSomAtivo,
  } = useApp()

  const alternarTema = () => setTema?.(tema === 'dark' ? 'light' : 'dark')
  const alternarSom = () => setSomAtivo?.(!somAtivo)

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

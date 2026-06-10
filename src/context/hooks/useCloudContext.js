import { useApp } from '../AppContext'

export function useCloudContext() {
  const {
    cloudStatus,
    cloudText,
    filaNuvem,
    ultimoSave,
    usuariosOnline,
    activityFeed,
    supabaseOnline,
    conectarSupabase,
    sincronizarFila,
    feed,
  } = useApp()

  return {
    cloudStatus,
    cloudText,
    filaNuvem,
    ultimoSave,
    usuariosOnline,
    activityFeed,
    supabaseOnline,
    conectarSupabase,
    sincronizarFila,
    feed,
  }
}

import { useApp } from '../AppContext'

export function useCloudContext() {
  const {
    cloudStatus,
    cloudText,
    filaNuvem,
    ultimoSave,
    usuariosOnline,
    activityFeed,
    conectarSupabase,
    baixarNuvem,
    feed,
  } = useApp()

  return {
    cloudStatus,
    cloudText,
    filaNuvem,
    ultimoSave,
    usuariosOnline,
    activityFeed,
    supabaseOnline: cloudStatus === 'online',
    conectarSupabase,
    baixarNuvem,
    feed,
  }
}

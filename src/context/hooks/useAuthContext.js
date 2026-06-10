import { useApp } from '../AppContext'

export function useAuthContext() {
  const {
    usuarioAtual,
    usuarios,
    filiais,
    entrar,
    logout,
    criarUsuario,
    editarUsuario,
    excluirUsuario,
    verificarSenhaAdmin,
    criarFilial,
    excluirFilial,
  } = useApp()

  return {
    usuarioAtual,
    usuarios,
    filiais,
    entrar,
    logout,
    criarUsuario,
    editarUsuario,
    excluirUsuario,
    verificarSenhaAdmin,
    criarFilial,
    excluirFilial,
  }
}

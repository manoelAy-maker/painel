# Reforma visual AYRES

- [x] Aplicar amarelo e grafite como identidade consistente no login, portal, menu, central de estadias, listas, planilha, formulários, pendências, relatórios e modais; manter contraste legível, foco e tema escuro opcional. Camada canônica integrada, marca recolorida e preferências inicializadas antes do render.
- [x] Preservar a central da foto com saudação, botões de lançar estadia e criar pendência, resumo agora e indicadores; melhorar hierarquia e espaçamento sem remover funções.
- [x] Manter autenticação, idiomas, recuperação de senha, permissões, cálculos, dados, integrações e exportações existentes; não fazer gravações no banco da operação para testar o visual. Revisão dos handlers, 22 testes unitários e build concluídos com sucesso; validação visual com dados fictícios e integrações bloqueadas.
- [x] Tornar a apresentação consistente no desktop e celular, com navegação controlada por botão, sem deslocar a área principal ao passar o mouse. Verificadas 15 capturas/estados, sem overflow horizontal nem erros de execução; abertura, Escape, seleção de abas e persistência do tema após reload verificados.
- [x] Entregar as alterações em `feat/visual-amarelo-ayres` e abrir pull request, sem merge nem substituição da versão em produção.

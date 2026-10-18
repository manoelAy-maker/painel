# Reforma visual AYRES

- [x] Aplicar amarelo e grafite como identidade consistente no login, portal, menu, central de estadias, listas, planilha, formulários, pendências, relatórios e modais; manter contraste legível, foco e tema escuro opcional. Camada canônica integrada, marca recolorida e preferências inicializadas antes do render.
- [x] Preservar a central da foto com saudação, botões de lançar estadia e criar pendência, resumo agora e indicadores; melhorar hierarquia e espaçamento sem remover funções.
- [x] Manter autenticação, idiomas, recuperação de senha, permissões, cálculos, dados, integrações e exportações existentes; não fazer gravações no banco da operação para testar o visual. Revisão dos handlers, 22 testes unitários e build concluídos com sucesso; validação visual com dados fictícios e integrações bloqueadas.
- [x] Tornar a apresentação consistente no desktop e celular, com navegação controlada por botão, sem deslocar a área principal ao passar o mouse. Verificadas 15 capturas/estados, sem overflow horizontal nem erros de execução; abertura, Escape, seleção de abas e persistência do tema após reload verificados.
- [x] Entregar as alterações em `feat/visual-amarelo-ayres` e abrir pull request, sem merge nem substituição da versão em produção.

## Melhoria da navegação e legibilidade

- [x] Na barra lateral compacta, mostrar o nome de cada botão ao passar o mouse; oferecer o mesmo nome no foco de teclado, sem expandir a barra nem movimentar a página. O nome não deve ser cortado pelo scroll do menu e deve sumir ao sair, pressionar Escape ou navegar. Manter os nomes sempre disponíveis no menu expandido do celular. Hover de todos os botões, teclado, menu aberto, janela baixa e celular verificados com dados locais.
- [x] Aumentar a legibilidade dos ícones, textos secundários, rótulos e bordas de controles que estavam apagados; preservar o tom Strada, estados de sucesso/risco, modo grafite e indicação de controles desabilitados. Contraste dos placeholders: 6,08:1 no claro e 9,17:1 no grafite; bordas dos filtros: 3,29:1 nos dois temas. Ícones ativos/inativos e hover/foco do cabeçalho verificados.
- [x] Implementar a melhoria em branch própria com testes/build e validação local isolada, mantendo dados, permissões e fluxos existentes. Branch `feat/sidebar-tooltips-contraste`; 26 testes e build concluídos, sem gravações na operação real.

## Tema Roxo clássico

- [x] Oferecer Roxo clássico nas configurações com aplicação em um clique e visual semelhante ao roxo anterior: fundo, cartões, navegação, botões e marca harmonizados; manter o Strada disponível e como padrão para acessos sem preferência. Preset visível em Tema visual, com modo escuro e opção de aparência clara.
- [x] Persistir a escolha após recarregar e permitir retornar ao Strada; preservar modos claro/grafite, idioma, nomes no hover, contraste legível, permissões e dados existentes. Persistência, cancelar sem salvar, retorno ao Strada e mobile verificados; texto secundário em roxo escuro com contraste de 8,25:1.
- [x] Verificar testes/build e a troca de tema em sessão local isolada, sem gravações no banco real; implementar em branch própria pela integração de publicação já existente. 33 testes e build concluídos; branch `feat/tema-roxo-classico`, dados locais fictícios e tráfego externo bloqueado na validação.

## Pago e ações simplificadas

- [x] Nos cartões em andamento, oferecer **Pago**, que finaliza a estadia em um clique e registra a confirmação no histórico; salvar responsável/data, impedir duplicação enquanto salva e informar falha sem simular sucesso. Status de dados permanece Finalizado; confirmação tem campos próprios, sem sobrescrever pagoPor nem valores. Fila pendente é comunicada e erros retornados pelo Supabase não removem itens.
- [x] Reduzir os controles principais a Pago, Detalhes e Mais opções; preservar Editar, Copiar, WhatsApp, Arquivar e Reabrir no menu e a confirmação de arquivamento. Registros finalizados não devem oferecer Pago novamente. Menu com Escape/clique externo e encaixe no celular verificados.
- [x] Verificar finalização, erro, clique duplicado e reabertura em dados locais fictícios, sem escrever no banco real; preparar a publicação conjunta com o tema Roxo clássico em branch própria após testes/build. Validação simulada de erro/duplicidade e validação do aplicativo completo com persistência, reabertura e dois Pagos quase simultâneos sem perda de fila/registros; sem acesso ao banco real.

# Reforma visual AYRES — amarelo e grafite

## Escopo aprovado

Reformular o visual no código do repositório `manoelAy-maker/painel`, em uma branch separada, sem substituir a versão em produção. Aplicar amarelo e grafite ao login, portal, menu, central de estadias, consultas, planilha, formulários, pendências, relatórios e modais. Preservar a central apresentada na foto, incluindo saudação, ações e resumo operacional. Não alterar autenticação, permissões, cálculos, dados, integrações ou exportações.

## Implementação

Manter React/Vite e os componentes existentes. Substituir a camada visual canônica `src/styles/ayres-unified.css`, adotando variáveis compartilhadas em vez de criar outros arquivos de correção. Reorganizar apenas a apresentação dos componentes de entrada e da central. Manter handlers, estado e fluxos operacionais. Ajustar a navegação compacta para expandir por ação explícita, sem movimentar a página ao passar o mouse. Preservar o tema escuro opcional com o mesmo amarelo. Corrigir a sincronização do lockfile, necessária para os comandos de instalação e verificação existentes.

## Direção visual

**Movimento:** design utilitário editorial para sistemas de operação, seguindo a estrutura clara da referência Strada e a central aprovada.

**Princípios:** leitura imediata, hierarquia objetiva, ações inequívocas e consistência entre telas. Fundo claro levemente quente, cartões brancos, bordas discretas e grafite para texto e navegação. Amarelo ouro `#F28C28` nas ações e indicadores de seleção, sempre com texto escuro. Verde indica sucesso e vermelho indica risco; não confundir status com a cor de marca.

**Layout:** barra lateral compacta, cabeçalho limpo e área operacional ampla. A central mantém saudação e botões à esquerda, resumo à direita e indicadores abaixo. Listas e formulários conservam a estrutura funcional atual, com densidade e alinhamento mais consistentes.

**Elementos próprios:** marca A geométrica em amarelo, filetes de seleção dourados e chips de informação sóbrios. Sem neon, efeitos de vidro ou ilustrações decorativas.

**Interação e animação:** transições discretas de 160ms, foco de teclado visível, menu controlado por botão, estados de carregamento preservados e respeito a `prefers-reduced-motion`.

**Tipografia:** Inter com fallbacks de sistema; títulos firmes, corpo legível, números tabulares e rótulos em caixa normal. Evitar excesso de caixa alta e texto minúsculo.

**Essência:** AYRES reúne o controle de estadias em uma operação clara, rápida e confiável. Personalidade: objetivo, organizado e próximo.

**Voz:** manter a saudação “Olá, Manoel. Operação na mão.” e ações diretas como “Lançar estadia” e “Criar pendência”. Preservar os idiomas já suportados.

## Estrutura do projeto

- `src/App.jsx`: seleção de módulos, shell e central operacional realmente ativa.
- `src/components`: login, portal, marca, cabeçalho, navegação e controles compartilhados.
- `src/styles/ayres-unified.css`: fonte canônica de tokens e acabamento visual de todas as telas.
- `src/modules/estadia`: páginas e serviços de lançamento e pendências; regras de negócio permanecem intactas.
- `src/pages`: consultas, planilha e relatórios existentes.
- `src/context`, `src/lib`, `src/utils`: estado, integrações e cálculos existentes, sem mudanças funcionais nesta reforma.

## Entrega

Branch `feat/visual-amarelo-ayres` e pull request para revisão. Não fazer merge nem publicar na Vercel. Usar os testes e build existentes, sem gravar dados na operação real.

## Continuação: navegação e contraste

Após a publicação da reforma solicitada pelo usuário, melhorar a identificação dos botões compactos com tooltips imediatos em hover/foco. Renderizar os nomes fora da região de scroll da barra para evitar recorte; Escape, blur, clique, scroll e resize dispensam o tooltip. O menu permanece compacto e não desloca a operação. Reforçar os tokens de texto secundário, os ícones e as bordas dos controles, sem remover estados de desabilitado ou mexer nas funções. Manter a identidade âmbar Strada `#F28C28`, o tema grafite e a navegação por botão no celular. Implementar em `feat/sidebar-tooltips-contraste`, mantendo a integração GitHub–Vercel existente.

## Continuação: Roxo clássico opcional

Adicionar um preset de tema Roxo clássico nas configurações, semelhante à identidade roxa anterior: fundo violeta escuro, cartões em tons de ameixa, botões roxos com gradiente discreto e marca harmonizada. Manter o Strada claro como padrão e oferecer retorno a ele em um clique. O usuário pode usar aparência clara/grafite sem perder persistência da escolha. Reusar as preferências de cor/modo já existentes, sem novos dados de operação ou mudanças de autenticação. Os tooltips, a legibilidade melhorada e o comportamento do menu permanecem. Integrar os tokens e a pele roxa à camada canônica, sem reativar arquivos legados conflitantes. Implementar em `feat/tema-roxo-classico` e conservar a integração GitHub–Vercel existente.

## Continuação: ação Pago e cartões mais simples

O usuário autorizou uma mudança funcional pontual na consulta: **Pago** finaliza imediatamente a estadia, sem passar por Analisar/Marcar feito. Usar o fluxo existente de edição, salvar responsável/data de finalização e histórico da ação, bloquear cliques duplicados enquanto salva e só apresentar sucesso após a gravação. Não executar qualquer transferência ou testar com registros reais. Deixar no cartão apenas Pago, Detalhes e Mais opções; mover Editar, Copiar, WhatsApp, Arquivar e Reabrir para o menu de opções, sem remover essas funções. Registros finalizados não oferecem Pago novamente. Preservar a lixeira, confirmação de arquivamento e os filtros/exportações existentes. Incluir essa melhoria no mesmo pull request do tema roxo para uma publicação conjunta.

## Continuação: importação da planilha e usuários no painel admin

Importar apenas os 45 registros da aba CONTROLE DE ESTADIA cujo status é Chamado aberto / Aguardando aprovação Logística. O usuário esclareceu que a marcação verde no STATUS indica pagamento já feito: excluir essas linhas e também os demais status. Manter as 13 estadias já existentes e finalizadas. Inserir dados operacionais no banco efetivamente utilizado pelo site, filial `jatai`, com identificação determinística e conferência de NF/chamado para evitar duplicações; nunca publicar a planilha ou os registros privados no GitHub/frontend. Preservar valores e dados originais, informar campos ausentes sem inventar saídas, horários ou pagamentos. Arquivos de preparação/auditoria ficam fora do repositório.

Restaurar uma área exclusiva de gestão de usuários no painel de estadias para quem já possui permissão administrativa. Reutilizar o cadastro e o armazenamento existentes, com nome, login, senha inicial, cargo e filial. Impedir operadores/visualizadores de abrir ou invocar a criação; não conceder privilégios ao usuário atual nem cadastrar contas reais sem dados explícitos. Confirmar gravação na nuvem antes de informar usuário criado, validar campos e duplicidades e bloquear envio repetido. Preservar os temas Strada/Roxo, o restante da operação e a publicação Vercel existente. Trabalhar em branch separada.

Resultado da importação: 45 registros confirmados na filial `jatai`, tipo `lancada`, status `Em análise`, com pagamentoConfirmado=false; aparecem em Em andamento e recebem rótulo Aguardando Logística. Preservados os 13 registros já finalizados. Excluídos 63 status verdes pagos, 18 enviados ao motorista, um status vazio e duas linhas aguardando sem placa e sem identificação do veículo. Sete valores ausentes permanecem Não informado; 15 casos sem horários confiáveis permanecem sem duração calculada. Campos de data são adaptados ao formato ISO aceito pelo formulário, enquanto valores originais ficam no próprio registro/auditoria privada. A interface não deve apresentar zero para horas não informadas.

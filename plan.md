# Reforma visual AYRES — amarelo e grafite

## Escopo aprovado

Reformular o visual no código do repositório `manoelAy-maker/painel`, em uma branch separada, sem substituir a versão em produção. Aplicar amarelo e grafite ao login, portal, menu, central de estadias, consultas, planilha, formulários, pendências, relatórios e modais. Preservar a central apresentada na foto, incluindo saudação, ações e resumo operacional. Não alterar autenticação, permissões, cálculos, dados, integrações ou exportações.

## Implementação

Manter React/Vite e os componentes existentes. Substituir a camada visual canônica `src/styles/ayres-unified.css`, adotando variáveis compartilhadas em vez de criar outros arquivos de correção. Reorganizar apenas a apresentação dos componentes de entrada e da central. Manter handlers, estado e fluxos operacionais. Ajustar a navegação compacta para expandir por ação explícita, sem movimentar a página ao passar o mouse. Preservar o tema escuro opcional com o mesmo amarelo. Corrigir a sincronização do lockfile, necessária para os comandos de instalação e verificação existentes.

## Direção visual

**Movimento:** design utilitário editorial para sistemas de operação, seguindo a estrutura clara da referência Strada e a central aprovada.

**Princípios:** leitura imediata, hierarquia objetiva, ações inequívocas e consistência entre telas. Fundo claro levemente quente, cartões brancos, bordas discretas e grafite para texto e navegação. Amarelo ouro `#EAB308` nas ações e indicadores de seleção, sempre com texto escuro. Verde indica sucesso e vermelho indica risco; não confundir status com a cor de marca.

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

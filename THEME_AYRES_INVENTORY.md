# Sistema visual AYRES

Aplicação React + Vite + Tailwind + Supabase.

## Fonte oficial de estilos

- `src/index.css`: estrutura histórica e compatibilidade dos módulos.
- `src/styles/app.css`: manifesto dos estilos específicos ainda utilizados.
- `src/styles/ayres-design-system.css`: tokens e componentes-base.
- `src/styles/ayres-unified.css`: camada visual canônica, carregada por último.

Toda nova decisão global de cor, superfície, tipografia, raio, sombra, foco ou
responsividade deve ser adicionada em `ayres-unified.css`. Evite criar novos
arquivos de “polish”, “fix”, “v2” ou “final”, pois eles voltam a fragmentar o
design e deixam a ordem da cascata imprevisível.

## Organização

- Metadados de navegação: `src/config/navigation.js`.
- Regras de negócio: `src/modules` e `src/lib`.
- Páginas compartilhadas: `src/pages`.
- Componentes reutilizáveis: `src/components`.

Os arquivos antigos sem importação e as páginas-espelho sem uso foram removidos.
Os módulos mantêm somente reexports necessários para preservar as rotas atuais.

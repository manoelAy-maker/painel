# Inventário inicial do tema AYRES

Aplicação React + Vite + Tailwind + Supabase.

## Arquivos globais
- `src/main.jsx`: importa estilos globais e agora importa `src/styles/ayres-tema.css`.
- `tailwind.config.js`: atualizado com paleta `ay-*`, mantendo `ldc` para compatibilidade.
- `src/styles/ayres-tema.css`: tokens e classes utilitárias premium AYRES.

## Captação
- `src/pages/Captacao.jsx`: mantém lógica existente de persistência, Supabase V2, legado e fallback local.
- `src/modules/captacao/pages/Captacao.jsx`: reexporta a página principal.
- `src/captacao-aggressive.css`: recebeu reskin usando variáveis do tema AYRES, sem trocar a estrutura ou campos.

## Telas existentes observadas no App
- Portal/Login
- Dashboard
- Estadia lançada
- Consulta de estadias lançadas
- Estadia a lançar
- Captação
- Captação Admin
- Histórico
- Relatórios
- Backup
- Admin
- Lixeira

## Observação
Este PR prioriza a base visual global e a captação, conforme pedido. Uma segunda passada pode converter tela por tela para classes `.ay-*` diretamente nos componentes, se necessário.

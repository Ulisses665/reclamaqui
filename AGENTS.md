## 1. Visão Geral

Este é um projeto em Next.js com Typescript e Tailwind CSS.
O objetivo e criar uma aplicação que o aluno possa fazer uma reclamação.

## 2. Tecnologias

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui (quando necessário)

## 3. Como Executar

'''bash
npm install
npm run dev
'''

## 4. Estrutura de pastas

- `src/app/`: rotas e componentes da aplicação usando o App Router.
- `src/app/page.tsx`: tela principal e fluxos da aplicação.
- `src/app/layout.tsx`: layout raiz, metadados e estilos globais.
- `src/app/globals.css`: estilos globais e classes da interface.
- `public/`: arquivos estáticos acessíveis pela aplicação.
- `docs/`: documentação e escopo do projeto.
- Arquivos de configuração na raiz: Next.js, TypeScript, Tailwind CSS e ESLint.

## 5. Padrões de código

- Use TypeScript e mantenha os tipos próximos ao código que os utiliza; use `type` para modelar dados e estados com formatos definidos.
- Em componentes React, use `PascalCase`; para funções, variáveis e propriedades, use `camelCase`.
- Prefira `const`, aspas duplas, ponto e vírgula e indentação de dois espaços, seguindo o padrão existente.
- Use componentes e hooks do React para organizar a interface e seu estado. Acesse APIs do navegador, como `localStorage`, apenas no cliente.
- Mantenha os estilos globais em `src/app/globals.css` e os estilos da aplicação consistentes com as classes existentes.
- Preserve textos apresentados ao usuário em português do Brasil e defina `lang="pt-BR"` nas páginas.
- Ao adicionar arquivos ou abstrações, siga a estrutura atual e crie novas pastas somente quando houver uma necessidade concreta.

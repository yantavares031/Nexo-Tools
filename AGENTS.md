<!-- ytech-playbook:start -->
<!-- Gerado pelo ytech-playbook (versão e26d13f, stacks: nextjs, design: ytech-default). Não edite este bloco; edite o playbook e reaplique. -->

# Padrões Ytech

## Padrões gerais Ytech

### Idioma
- Código (variáveis, funções, arquivos, pastas, commits) em **inglês**.
- Textos exibidos ao usuário final em **português do Brasil**.
- Respostas e explicações do agente em **português do Brasil**.

### Princípios
- Simplicidade antes de abstração: só crie uma abstração quando houver o segundo ou terceiro uso real.
- Organize o código por **feature/domínio**, não por tipo técnico espalhado pelo projeto.
- Funções pequenas, com um único propósito e nomes que dispensam comentário.
- Valide toda entrada externa (formulários, body de requisição, query params, variáveis de ambiente) com **Zod**.
- Nunca exponha segredos no cliente nem faça commit de `.env`. Mantenha um `.env.example` atualizado.
- Trate erros de forma explícita; nunca engula exceções silenciosamente.

### Ferramentas padrão
- Linguagem: **TypeScript** em modo `strict`.
- Gerenciador de pacotes: **pnpm**.
- Lint e formatação: ESLint + Prettier.
- Validação: Zod.

### Nomenclatura
- Arquivos e pastas: `kebab-case` (ex.: `user-profile.tsx`, `create-order.ts`).
- Componentes React e tipos: `PascalCase`.
- Variáveis e funções: `camelCase`.
- Constantes globais: `UPPER_SNAKE_CASE`.
- Booleanos começam com `is`, `has`, `can` ou `should`.

### Git
- Commits no padrão **Conventional Commits**: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `test:`.
- Branches: `feat/descricao-curta`, `fix/descricao-curta`.

## Stack: Next.js

### Tecnologias
- Next.js (App Router) + React + TypeScript
- Server Components por padrão; Server Actions para toda entrada de dados
- Zod para validação na fronteira (actions)

### Como pensamos
- **Arquitetura em camadas**: `Action → Use Case → Repository`. A action é um controller fino; a regra de negócio mora no use case; o acesso a dados e a serviços externos mora na infraestrutura.
- **Servidor primeiro**: páginas são Server Components. `"use client"` só em ilhas pequenas de interatividade (um botão, um campo), nunca na página inteira.
- **Largura total**: o conteúdo das páginas sempre ocupa toda a largura disponível; nada de coluna estreita centralizada com `max-w-*` + `mx-auto`.
- **Server Actions no lugar de `/api`**: rotas `/api` só para webhooks ou integrações externas que exigem um endpoint HTTP.
- **Guardrails centralizados**: regras de acesso (sessão, conta ativa, bloqueio, trial, inadimplência, permissões) ficam num único guard em `infrastructure/auth/guards.ts`. Toda action protegida é exportada envolvida em `withGuards(...)`; páginas e layouts chamam `getGuardedSession()`/`requirePageAccess()`; rotas `/api` e jobs usam o mesmo guard. Regra nova entra no guard, nunca em cada action.
- **Tudo atrás de contrato**: use cases dependem de interfaces (`domain/`); implementações concretas (banco, APIs externas) ficam em `infrastructure/` e são injetadas.

### Estrutura de pastas

```
app/                        # Rotas: page.tsx, layout.tsx, loading.tsx, error.tsx
│   └── <rota-mae>/
│       ├── page.tsx
│       ├── sub/            # Componentes só desta rota (um único sub por rota mãe)
│       └── [id]/page.tsx   # Sub-rotas importam de ../sub/
actions/                    # Server Actions ("use server") — controllers finos
│   └── <dominio>/
│       └── create-<entidade>.action.ts
use-cases/                  # Regras de negócio — um arquivo por operação
│   └── <dominio>/
│       └── create-<entidade>.use-case.ts
domain/                     # Entidades, contratos (interfaces) e erros de domínio
│   ├── <dominio>/
│   │   ├── <entidade>.ts
│   │   └── <entidade>.repository.ts      # interface
│   ├── services/                          # interfaces de serviços externos
│   └── errors.ts
infrastructure/             # Implementações concretas
│   ├── database/           # Cliente do banco (Prisma, pg, SQLite...)
│   ├── repositories/       # Implementam as interfaces de domain/
│   ├── auth/guards.ts      # Guardrails: regras de acesso centralizadas + wrappers
│   ├── services/           # Implementam contratos de serviços externos (ERP, pagamento, e-mail)
│   └── factories/          # Montam os use cases com suas dependências
components/                 # Componentes reutilizáveis (usados em 2+ lugares)
│   ├── ui/                 # Primitivos do design system (button, input, table, badge...)
│   ├── layout/             # Moldura: sidebar, topbar, busca, rodapé
│   └── form/               # Helpers de formulário (useActionToast, fieldProps)
modals/                     # Todos os modais do projeto
lib/                        # Utilitários puros (cn, format, form-state)
config/                     # Configuração estática (app.ts, navigation.ts)
proxy.ts                    # Proxy do Next 16+ (nunca middleware.ts)
```

### Feedback ao usuário
- Toda rota que busca dados tem `loading.tsx` (spinner + "Carregando...") usando `components/page-loading.tsx`.
- Toda ação tem loading no botão, toast de sucesso e toast de erro (Sonner). Nada de erro inline para resultado de ação.
- Confirmação de ações destrutivas sempre com `useConfirm()`; nunca `confirm()`, `alert()` ou `prompt()` nativos.

### Fluxo de uma operação

```
Página/Componente → Action → Use Case → Repository (interface) ← Implementação em infrastructure/
```

### Contexto do projeto
Todo projeto tem `.cursor/rules/project-context.mdc` descrevendo o produto, os usuários e o domínio. Leia antes de implementar qualquer funcionalidade.

## Design system: ytech-default

- Antes de criar ou alterar telas, leia `docs/design/DESIGN.md` (tokens e decisões), `docs/design/PATTERNS.md` (código de referência) e as imagens em `docs/design/references/`.
- Use os componentes de `components/ui/` e `components/layout/`; não instale bibliotecas de UI.
- `docs/design/` é gerenciado pelo playbook: não edite; preferências do cliente vão em `project-context.mdc`.

<!-- ytech-playbook:end -->

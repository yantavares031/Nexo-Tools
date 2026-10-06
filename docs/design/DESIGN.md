# Design system Ytech (padrão)

Design padrão dos sistemas web da Ytech. Nasceu no sistema de Faturamento de Telefonia (Wiki Telecom).
As capturas em [`references/`](references/) são de um SaaS de gestão de TI cujo visual adotamos como base:
use-as para decidir espaçamento, hierarquia e tom, **não** copie textos nem funcionalidades.
Padrões de tela com código em [`PATTERNS.md`](PATTERNS.md).

> **Regra de ouro:** interface calma, clara e densa na medida certa. Muito branco, poucos tons de
> cinza, cor só para significado (status, links, ação ativa). Nada de gradientes, sombras pesadas
> ou bordas grossas.

Preferências específicas de um cliente ficam em `.cursor/rules/project-context.mdc` (seção de design) e prevalecem sobre este arquivo.

## Decisões Ytech (prevalecem sobre as referências)

- Títulos de página **contidos**: `text-xl` (20px); títulos de painel/aba `text-lg`. As referências usam títulos maiores — aqui não.
- Cabeçalho de tabela sempre em **seminegrito** (`font-semibold`).
- Corpo de tabela em 13px; textos secundários em 11px.
- Códigos numéricos sem prefixo `#`.
- Nomes longos em célula: `truncate` com `title` mostrando o valor completo.
- Entidades relacionadas (razão social, cliente de um contrato) em **azul** (`text-link`).
- Filtros de listagem como **dropdowns** compactos na mesma linha da busca — nada de abas segmentadas nem quebras de linha na toolbar.
- Totais e filtros ativos exibidos como **badges** (total escuro + chips removíveis).
- Seções de uma página de detalhe em **abas server-side** via `?tab=nome`.
- O conteúdo das páginas **ocupa toda a largura** do painel; `max-w-*` só em blocos internos (ex.: formulário).
- Resultado de ações (salvar, excluir) sempre em **toast** (Sonner), nunca inline.

## Moldura da aplicação

- **Rail lateral escuro** (`bg-rail`, 64px) só com ícones; no hover (ou foco por teclado) expande para
  240px por cima do conteúdo e mostra os nomes. Só CSS (`group/rail`), sem JS.
  No mobile vira gaveta de 240px com rótulos visíveis.
- **Barra superior** sobre o fundo cinza (`bg-canvas`) com busca global em pílula (⌘K).
- **Painel de conteúdo branco** com canto superior esquerdo arredondado (`rounded-tl-2xl`),
  borda leve e sombra difusa, contendo a página e o rodapé "Desenvolvido por Ytech Solution".
- Itens do menu em `config/navigation.ts`; nome do sistema e do cliente em `config/app.ts`.

## Fundamentos

### Cores

Tokens próprios em `app/globals.css` (`@theme`):

| Token | Valor | Uso |
| --- | --- | --- |
| `rail` / `rail-hover` | `#141b2b` / `#222b3d` | rail lateral, faixa do login |
| `canvas` | `#f2f3f5` | fundo atrás do painel de conteúdo |
| `accent` | `#e0166f` | sublinhado da aba ativa |
| `link` / `link-hover` | `#1a8fd1` / `#1273ad` | entidades relacionadas, links |

A cor de marca do cliente pode substituir `accent` (e, se fizer sentido, `rail`) no `globals.css`. O resto da paleta não muda.

| Papel | Token Tailwind | Uso |
| --- | --- | --- |
| Texto principal | `neutral-950` | títulos, nomes na primeira coluna |
| Texto padrão | `neutral-600`/`700` | células, labels |
| Texto secundário | `neutral-400`/`500` | descrições, metadados, placeholders |
| Bordas | `neutral-300` em controles, `neutral-200` em divisórias | inputs, seções, linhas |
| Ação primária | `neutral-800` (hover `neutral-700`) | botão principal, filtro aplicado |
| Hover/seleção de linha | `sky-50` | linha sob o mouse/selecionada |
| Controles ligados | `blue-600` | switch, checkbox |

Status usam **pílulas suaves** (fundo claro + texto saturado, sem borda) — `Badge` com `tone`:

| Tone | Fundo / texto | Exemplos |
| --- | --- | --- |
| `success` | `lime-100` / `lime-700` | Ativo, Pago, Em uso |
| `warning` | `amber-50` / `amber-600` | Pendente, Vencendo |
| `danger` | `red-50` / `red-600` | Vencido, Erro, Cancelado |
| `info` | `sky-50` / `sky-600` | Em processamento, Novo |
| `muted` / `neutral` | `neutral-100` / `neutral-500`–`600` | Inativo, PF/PJ |
| `dark` | `neutral-800` / branco | total de resultados |

### Tipografia

- Fonte: **Inter** (`next/font`). Números tabulares (`tabular-nums`) em códigos, valores, datas e documentos.
- Escala: título de página 20px semibold · título de seção 14–16px semibold · corpo 13–14px · secundário 11–12px.
- Pesos: 400 corpo, 500 nomes/destaques, 600 títulos e cabeçalhos de tabela. Evite 700.

### Forma, espaço e profundidade

- Raio: inputs/botões `rounded-field` (6px) · cards `rounded-xl` · badges/chips `rounded-full`.
- Espaçamento generoso entre blocos (`space-y-6`), compacto dentro deles (`gap-3`/`gap-4`).
- Divisórias finas (`border-neutral-100`/`200`) separam seções em vez de caixas aninhadas.
- Sombra só em elementos flutuantes (dropdown, popover, modal): `shadow-lg shadow-neutral-900/5`.

### Ícones

- `lucide-react`, traço fino, 16px (`size-4`) em botões e títulos de seção, 14px em metadados.
- Ícone antes do título de seção (ref. 01, 07, 09) e antes do rótulo de abas (ref. 04).

## Componentes

Todos em `components/ui/`, sem bibliotecas de UI (só Tailwind + `lucide-react`). Server Components por padrão; client só quando há interação real. **Use estes antes de estilizar elementos soltos.**

| Componente | Padrão visual | Referência |
| --- | --- | --- |
| `Button` | `primary` escuro; `outline` com borda fina; `ghost` para "Cancelar/Descartar"; prop `loading` | 01, 04 |
| `SubmitButton` | `Button` de submit com loading automático (`useFormStatus`) e `pendingLabel` | — |
| `Input` / `Select` / `PasswordInput` | 40px de altura, borda `neutral-300`, foco com borda escura + anel suave | 09 |
| `Label` / `FormField` / `FieldError` | label acima (13px, `neutral-700`), erro/dica abaixo em 12px | 09 |
| `Switch` | toggle compacto; azul quando ligado | 09 |
| `Badge` | pílula suave por significado (ver tabela de status) | 03, 05, 08 |
| `FilterChip` | chip com "×" para remover filtro (link) | 03 |
| `Dropdown` + `DropdownItem` | botão pílula "Rótulo Valor ⌄"; menu flutuante com ✓ e contagem | 02 |
| `Tabs` | ícone + rótulo + contagem cinza; ativo com sublinhado 2px `accent`; links `?tab=` | 04, 08 |
| `Table` (+ `TableHead`, `TableBody`, `TableRow`, `TableHeaderCell`, `TableCell`) | header seminegrito sem fundo, linhas ~48px, divisórias finas | 02, 05 |
| `PanelHeader` | título da aba/painel + descrição, ações à direita (Descartar / Salvar) | 01, 04 |
| `FormSection` | ícone + título + descrição; seções separadas por divisória, sem caixas | 01, 09 |
| `MetaList` | rótulos 11px maiúsculos sobre valores 13px; metadados do cabeçalho de detalhe | 04 |
| `Pagination` | "Mostrando X–Y de N" + páginas compactas (links) | 02 |
| `Skeleton` | blocos `neutral-100` pulsando, no formato do conteúdo final | — |
| `EmptyState` | borda tracejada, ícone em círculo `neutral-100`, título + descrição | — |
| `Callout` | aviso informativo `sky-50`, ícone + título seminegrito + texto curto | 09 |
| `Alert` | aviso persistente na página (não usar para resultado de ação) | — |
| `Spinner` | círculo girando na cor do texto atual | — |

Fora de `ui/`:

| Componente | Onde | Uso |
| --- | --- | --- |
| `PageHeader` | `components/layout/` | trilha (`eyebrow`), voltar, título, badges, descrição e ações |
| `Sidebar`, `Topbar`, `CommandSearch`, `AppFooter` | `components/layout/` | moldura do app |
| `FormActions` | `components/form/` | "Descartar" + "Salvar" no `PanelHeader` do formulário |
| `fieldProps` / `useActionToast` | `components/form/` | liga campos ao `FormState` da action e mostra toasts |
| `PageLoading` | `components/` | conteúdo dos `loading.tsx` |
| `ConfirmProvider` / `useConfirm` | `components/confirm-provider.tsx` | confirmação de ações destrutivas |
| `ConfirmModal` | `modals/confirm-modal.tsx` | visual da confirmação |

## Padrões de tela

Código de referência de cada padrão em [`PATTERNS.md`](PATTERNS.md).

### Listagem (ref. 02, 03, 05)

1. `PageHeader`: título pequeno + descrição de uma linha + botão "Novo …" à direita.
2. Toolbar em **uma linha**: busca em pílula (ícone lupa) + dropdowns de filtro.
3. Linha de resumo: badge escuro com total + chips dos filtros ativos.
4. Tabela: primeira coluna = nome em `font-medium neutral-950` com linha secundária abaixo; entidades relacionadas em azul; status em pílula na última coluna.
5. Linha inteira clicável (link esticado, sem JS) levando ao detalhe.
6. Paginação no rodapé. Filtros, busca e página vivem na URL (`searchParams`).

### Detalhe (ref. 04, 08)

1. Trilha pequena (`eyebrow`) + seta de voltar acima do título.
2. Cabeçalho: nome, badges de status e `MetaList` com os metadados.
3. Abas sublinhadas logo abaixo; cada aba é `?tab=` renderizada no servidor.
4. Conteúdo da aba: formulário de edição, tabela para listas relacionadas ou `EmptyState`.

### Formulário (ref. 01, 09)

- `PanelHeader` com título, descrição e `FormActions` à direita.
- Seções `FormSection` (ícone + título + descrição) separadas por divisórias.
- Labels acima dos campos; pares relacionados lado a lado (datas, cidade/UF) em `grid sm:grid-cols-2`.
- Formulário com largura de leitura confortável (`max-w-3xl`/`max-w-4xl` no `<form>`, nunca no wrapper da página).
- Resultado da action em toast (`useActionToast`); erros de campo abaixo do campo.
- Criação em página dedicada (`novo/page.tsx`), não na mesma página da lista.

### Configurações (ref. 07)

- Seções em acordeão (título + descrição + chevron à direita) em um bloco `max-w-3xl`.
- Tabelas internas com borda leve, header `neutral-50` e ações por ícone (editar/excluir).

### Painéis e relatórios (ref. 06)

- Grupos com ícone em quadrado pastel (`rounded-lg` + `bg-*-50`), título e descrição.
- Cards brancos com lista de itens: título + subtítulo cinza, divisórias entre itens.

### Login

- Duas colunas: faixa `bg-rail` à esquerda (logo, nome do sistema, frase curta) e formulário branco centralizado à direita (`max-w-sm`), com `AppFooter` embaixo.

## Estados

- **Carregando a página:** `loading.tsx` com `PageLoading`.
- **Carregando um bloco:** `Suspense` + `Skeleton` no formato final; manter dados antigos visíveis quando apenas um filtro muda.
- **Vazio:** `EmptyState` ou linha única na tabela com frase de orientação.
- **Erro de campo:** borda vermelha (`aria-invalid`) + `FieldError` abaixo do campo.
- **Desabilitado:** texto `neutral-400`, fundo `neutral-50`, cursor `not-allowed`; `<fieldset disabled>` durante o envio.

## Acessibilidade

- Todo controle interativo alcançável por teclado, com `focus-visible` claro.
- `aria-current` em abas/links ativos, `aria-invalid` + `aria-describedby` em campos com erro.
- Contraste mínimo AA: não use `neutral-300` ou mais claro para texto.

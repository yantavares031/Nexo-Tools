# Padrões de tela — código de referência

Exemplos reais (adaptados) do sistema de Faturamento de Telefonia. Troque `clientes`/`Customer` pela entidade do projeto.
Componentes específicos da rota ficam em `app/<rota-mae>/sub/`.

## Listagem

```tsx
// app/(app)/clientes/page.tsx
export const metadata: Metadata = { title: "Clientes" };

export default async function ClientesPage({ searchParams }: PageProps<"/clientes">) {
  const params = listCustomersSchema.parse(await searchParams);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        description="Cadastro de clientes"
        actions={
          <Link href="/clientes/novo" className={cn(buttonBaseClassName, buttonVariants.primary, buttonSizes.md)}>
            <Plus className="size-4" strokeWidth={2.25} aria-hidden />
            Novo cliente
          </Link>
        }
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <CustomerSearch {...params} />
        <CustomerFilters {...params} />
      </div>

      <Suspense key={JSON.stringify(params)} fallback={<CustomersTableSkeleton />}>
        <CustomersTable params={params} />
      </Suspense>
    </div>
  );
}
```

### Busca em pílula (server, sem JS)

```tsx
// app/(app)/clientes/sub/customer-search.tsx
import Form from "next/form";

export function CustomerSearch({ q, status }: CustomerFilterParams) {
  return (
    <Form
      action="/clientes"
      role="search"
      className="flex h-9 w-full items-center rounded-full border border-neutral-300 bg-white transition-colors focus-within:border-neutral-700 focus-within:ring-2 focus-within:ring-neutral-900/5 hover:border-neutral-400 sm:w-80"
    >
      {status !== "all" && <input type="hidden" name="status" value={status} />}
      <Search className="ml-3.5 size-4 shrink-0 text-neutral-400" aria-hidden />
      <input
        key={q ?? ""}
        type="search"
        name="q"
        defaultValue={q}
        placeholder="Buscar por nome, CPF/CNPJ ou código"
        aria-label="Buscar clientes"
        className="h-full min-w-0 flex-1 bg-transparent px-2.5 text-[13px] outline-none placeholder:text-neutral-400 [&::-webkit-search-cancel-button]:hidden"
      />
      {q && (
        <Link href={customersHref({ status })} aria-label="Limpar busca" className="mr-2 rounded-full p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700">
          <X className="size-3.5" />
        </Link>
      )}
      <button type="submit" className="sr-only">Buscar</button>
    </Form>
  );
}
```

### Filtros em dropdown

```tsx
// app/(app)/clientes/sub/customer-filters.tsx
<Dropdown
  key={`status-${q}-${status}`}
  highlighted={status !== "all"}
  trigger={
    <>
      <CircleDot aria-hidden />
      <span className="opacity-70">Status</span>
      <span className="font-medium">{statusLabel}</span>
    </>
  }
>
  {STATUS_OPTIONS.map((option) => (
    <DropdownItem
      key={option.value}
      href={customersHref({ q, status: option.value })}
      active={status === option.value}
      count={counts?.byStatus[option.value]}
    >
      {option.label}
    </DropdownItem>
  ))}
</Dropdown>
```

### Hrefs da listagem (estado na URL)

```ts
// app/(app)/clientes/sub/hrefs.ts
export function customersHref({ q, status, page = 1 }: Partial<ListCustomersParams>) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (status && status !== "all") params.set("status", status);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/clientes?${query}` : "/clientes";
}
```

### Tabela com resumo, linha clicável e paginação

```tsx
// app/(app)/clientes/sub/customers-table.tsx
export async function CustomersTable({ params }: { params: ListCustomersParams }) {
  const result = await listCustomersAction(params);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2" aria-live="polite">
        <Badge tone="dark" className="px-2.5 py-1">
          <span className="tabular-nums">{integerFormat.format(result.total)}</span>
          {result.total === 1 ? "cliente" : "clientes"}
        </Badge>
        {params.q && (
          <FilterChip label="busca" removeHref={customersHref({ status: params.status })}>
            “{params.q}”
          </FilterChip>
        )}
      </div>

      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell className="w-20">Código</TableHeaderCell>
            <TableHeaderCell>Cliente</TableHeaderCell>
            <TableHeaderCell>CPF/CNPJ</TableHeaderCell>
            <TableHeaderCell className="w-24">Status</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {result.items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="py-12 text-center text-neutral-500">
                Nenhum cliente encontrado.
              </TableCell>
            </TableRow>
          ) : (
            result.items.map((customer) => (
              <TableRow key={customer.id} className="relative transition-colors hover:bg-sky-50/60 has-[a:focus-visible]:bg-sky-50/60">
                <TableCell className="tabular-nums text-neutral-400">{customer.id}</TableCell>
                <TableCell className="max-w-72" title={customer.name}>
                  <p className="truncate font-medium text-neutral-950">
                    <Link href={`/clientes/${customer.id}`} className="outline-none after:absolute after:inset-0 after:content-['']">
                      {customer.name}
                    </Link>
                  </p>
                  {customer.legalName && <p className="mt-0.5 truncate text-[11px] text-link">{customer.legalName}</p>}
                </TableCell>
                <TableCell className="whitespace-nowrap tabular-nums">{formatDocument(customer.document)}</TableCell>
                <TableCell>
                  {customer.active ? <Badge tone="success">Ativo</Badge> : <Badge tone="muted">Inativo</Badge>}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Pagination
        page={result.page}
        totalPages={result.totalPages}
        total={result.total}
        pageSize={result.pageSize}
        hrefForPage={(page) => customersHref({ ...params, page })}
      />
    </div>
  );
}
```

### Skeleton da tabela

```tsx
export function CustomersTableSkeleton() {
  return (
    <div role="status" aria-label="Carregando clientes" className="divide-y divide-neutral-100">
      <Skeleton className="mb-3 h-6 w-28 rounded-full" />
      {Array.from({ length: 10 }, (_, i) => (
        <div key={i} className="flex items-center gap-6 py-4">
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-3 w-56" />
          <Skeleton className="h-3 w-32" />
          <Skeleton className="ml-auto h-4 w-14 rounded-full" />
        </div>
      ))}
    </div>
  );
}
```

## Detalhe com abas

```ts
// app/(app)/clientes/sub/tabs.ts
export const CUSTOMER_TABS = [
  { value: "dados", label: "Dados cadastrais" },
  { value: "contratos", label: "Contratos" },
] as const;

export type CustomerTab = (typeof CUSTOMER_TABS)[number]["value"];

export const customerTabSchema = z
  .enum(CUSTOMER_TABS.map((tab) => tab.value) as [CustomerTab, ...CustomerTab[]])
  .catch("dados");

export function customerTabHref(id: number, tab: CustomerTab) {
  return tab === "dados" ? `/clientes/${id}` : `/clientes/${id}?tab=${tab}`;
}
```

```tsx
// app/(app)/clientes/[id]/page.tsx
export default async function ClientePage({ params, searchParams }: PageProps<"/clientes/[id]">) {
  const [customer, tab] = await Promise.all([
    loadCustomer(params),
    searchParams.then((query) => customerTabSchema.parse(query.tab)),
  ]);

  return (
    <div className="space-y-8">
      <div className="space-y-20">
        <PageHeader
          eyebrow="Clientes"
          backHref="/clientes"
          title={customer.name}
          badges={<Badge tone={customer.active ? "success" : "muted"}>{customer.active ? "Ativo" : "Inativo"}</Badge>}
          description={
            <MetaList
              items={[
                { label: "Código", value: String(customer.id) },
                { label: "CNPJ", value: formatDocument(customer.document) },
                { label: "Modificado em", value: formatDateTime(customer.updatedAt) },
              ]}
            />
          }
        />
        <Tabs
          label="Seções do cliente"
          items={CUSTOMER_TABS.map((item) => ({
            label: item.label,
            href: customerTabHref(customer.id, item.value),
            active: item.value === tab,
            icon: TAB_ICONS[item.value],
          }))}
        />
      </div>

      {tab === "dados" && <ProfileForm id={customer.id} defaults={toDefaults(customer)} />}
      {tab === "contratos" && (
        <Suspense fallback={<ContractsTabSkeleton />}>
          <ContractsTab customerId={customer.id} />
        </Suspense>
      )}
    </div>
  );
}
```

## Formulário

A action devolve um `FormState` (`lib/form-state.ts`): `success`/`message` viram toast via `useActionToast`; `fieldErrors` aparecem abaixo dos campos; `values` repõe o que o usuário digitou.

```tsx
// app/(app)/clientes/sub/customer-form.tsx
"use client";

const defaults: Partial<Record<CustomerField, string | boolean>> = { personType: "PJ", active: true };

export function CustomerForm() {
  const [state, formAction, pending] = useActionState(createCustomerAction, {} as FormState<CustomerField>);
  useActionToast(state);
  const field = (name: CustomerField) => fieldProps(state, defaults, name);

  return (
    <form action={formAction} noValidate className="max-w-4xl">
      <fieldset disabled={pending}>
        <PanelHeader
          title="Dados do cliente"
          description="Identificação e contato."
          actions={<FormActions submitLabel="Cadastrar cliente" />}
        />

        <FormSection icon={<IdCard aria-hidden />} title="Identificação" description="Como o cliente aparece no sistema.">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="name" label="Nome" error={field("name").error}>
              <Input {...field("name").input} />
            </FormField>
            <FormField id="document" label="CPF/CNPJ" error={field("document").error}>
              <Input {...field("document").input} inputMode="numeric" />
            </FormField>
          </div>
        </FormSection>

        <FormSection icon={<ToggleRight aria-hidden />} title="Situação">
          <Switch name="active" defaultChecked={checkedValue(state, defaults, "active")}>
            Cliente ativo
          </Switch>
        </FormSection>
      </fieldset>
    </form>
  );
}
```

```tsx
// app/(app)/clientes/novo/page.tsx
export default function NovoClientePage() {
  return (
    <div className="space-y-12">
      <PageHeader eyebrow="Clientes" backHref="/clientes" title="Novo cliente" description="Depois de cadastrado, o cliente pode receber contratos." />
      <CustomerForm />
    </div>
  );
}
```

## Login

```tsx
// app/login/page.tsx
export default function LoginPage() {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <aside className="flex flex-col justify-between bg-rail px-8 py-8 text-neutral-400 lg:px-12 lg:py-12">
        <AppLogo />
        <div className="hidden max-w-sm lg:block">
          <p className="text-2xl font-semibold tracking-tight text-white">{APP_CONFIG.name}</p>
          <p className="mt-3 text-sm leading-relaxed">Frase curta sobre o que o sistema faz.</p>
        </div>
        <p className="hidden text-xs lg:block">© {new Date().getFullYear()} {APP_CONFIG.company}</p>
      </aside>

      <div className="flex flex-col bg-white">
        <main className="flex flex-1 items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm">
            <h1 className="text-2xl font-semibold tracking-tight">Entrar</h1>
            <p className="mt-1 text-sm text-neutral-500">Use seu e-mail e senha.</p>
            <LoginForm />
          </div>
        </main>
        <AppFooter />
      </div>
    </div>
  );
}
```

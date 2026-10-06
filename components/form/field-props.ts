import type { FormState } from "@/lib/form-state";

export function fieldProps<Field extends string>(
  state: FormState<Field>,
  defaults: Partial<Record<Field, string | boolean>>,
  name: Field,
) {
  const error = state.fieldErrors?.[name]?.[0];
  const value = state.values?.[name] ?? defaults[name];

  return {
    error,
    input: {
      id: name,
      name,
      defaultValue: typeof value === "string" ? value : "",
      "aria-invalid": Boolean(error),
      "aria-describedby": error ? `${name}-error` : undefined,
    },
  };
}

export function checkedValue<Field extends string>(
  state: FormState<Field>,
  defaults: Partial<Record<Field, string | boolean>>,
  name: Field,
) {
  const value = state.values?.[name];
  return typeof value === "boolean" ? value : defaults[name] === true;
}

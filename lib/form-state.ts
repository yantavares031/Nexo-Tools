export type FormState<Field extends string> = {
  success?: string;
  message?: string;
  fieldErrors?: Partial<Record<Field, string[]>>;
  values?: Partial<Record<Field, string | boolean>>;
};

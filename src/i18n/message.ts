/** A message is a template with `{name}` placeholders, or per-plural-category templates selected by `count`. */
export type Message = string | { readonly one: string; readonly other: string };

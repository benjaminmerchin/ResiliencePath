// Butterbase jsonb columns accept objects but not top-level arrays,
// so lists are stored wrapped as {items: [...]}.
export function wrapList(arr: unknown[]): { items: unknown[] } {
  return { items: arr };
}

export function unwrapList(v: unknown): unknown[] {
  if (Array.isArray(v)) return v;
  if (v && typeof v === "object" && Array.isArray((v as { items?: unknown[] }).items)) {
    return (v as { items: unknown[] }).items;
  }
  return [];
}

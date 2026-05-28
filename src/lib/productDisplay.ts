export function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is string => typeof item === "string"
    );
  }

  if (typeof value === "string") {
    if (!value.trim()) {
      return [];
    }

    try {
      const parsed = JSON.parse(value);

      if (Array.isArray(parsed)) {
        return asStringArray(parsed);
      }
    } catch {
      return [value];
    }
  }

  return [];
}

export function formatAuthors(authors: unknown): string {
  return asStringArray(authors).join(", ");
}

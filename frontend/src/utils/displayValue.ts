/**
 * Presentational formatter for review-detail values.
 *
 * Returns the trimmed string form of `value`, or an em dash ("—") when the
 * value is `undefined`, `null`, or an empty/whitespace-only string. Numbers
 * (e.g. codes passed as numbers) are coerced to string without alteration.
 *
 * Pure function — it never fabricates defaults and never mutates stored data.
 */
export function orDash(value?: string | number | null): string {
  if (value === undefined || value === null) return "—";
  const text = typeof value === "number" ? String(value) : value.trim();
  return text === "" ? "—" : text;
}

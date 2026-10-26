// Shared primitives for the frontend-only JSON import/mapping layer.
//
// This file owns the parse -> validate boundary's lowest layer: a safe JSON
// parser and small reusable type guards. It mirrors the defensive, typed-result
// intent of `appStorage.ts` (wrap `JSON.parse` in try/catch, never throw), but
// surfaces structured errors instead of silently falling back — imported files
// are untrusted and user-triggered, so failures must be visible, not swallowed.
//
// A future API client can skip `safeParseJson` and feed already-parsed objects
// straight into the per-artifact guards; that keeps the data source swappable.

/**
 * Discriminated result returned by every parser/guard/adapter entry point.
 * `ok: true` carries the typed value; `ok: false` carries human-readable errors.
 */
export type ImportResult<T> =
  | { ok: true; value: T }
  | { ok: false; errors: string[] };

/** Build a successful result. */
export function ok<T>(value: T): ImportResult<T> {
  return { ok: true, value };
}

/** Build a failed result from one or more error messages. */
export function fail<T>(errors: string[] | string): ImportResult<T> {
  return { ok: false, errors: Array.isArray(errors) ? errors : [errors] };
}

/**
 * Parse a raw JSON string without ever throwing. On malformed input returns a
 * failed result with a clear message rather than crashing the caller/view.
 */
export function safeParseJson(raw: string): ImportResult<unknown> {
  if (typeof raw !== "string" || raw.trim() === "") {
    return fail("Input JSON kosong atau bukan teks.");
  }
  try {
    return ok(JSON.parse(raw) as unknown);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return fail(`Gagal mem-parse JSON: ${detail}`);
  }
}

/** Narrow an unknown value to a plain object record. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** True when the value is a non-empty string. */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/** True when the value is a finite number (rejects NaN/Infinity). */
export function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/** True when the value is an integer. */
export function isInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value);
}

/** True when the value is a string or explicitly null (nullable string fields). */
export function isStringOrNull(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

/**
 * Enforce `additionalProperties:false` at the level of `obj`: returns an error
 * string for every key not present in `allowedKeys`. Empty array means clean.
 */
export function rejectUnknownKeys(
  obj: Record<string, unknown>,
  allowedKeys: readonly string[],
  context = "objek",
): string[] {
  const allowed = new Set(allowedKeys);
  return Object.keys(obj)
    .filter((key) => !allowed.has(key))
    .map((key) => `Field tidak dikenal pada ${context}: "${key}".`);
}

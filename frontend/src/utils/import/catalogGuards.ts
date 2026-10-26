// Shape guards for the catalog artifacts: checklist version and master RO.
//
// Same defensive pattern as `reviewRequestGuards.ts`: validate an already-parsed
// `unknown`, never throw, return a typed `ImportResult`. These backend shapes are
// simpler and do NOT declare additionalProperties:false, so unknown keys are
// tolerated — only required fields are checked.

import {
  fail,
  isNonEmptyString,
  isRecord,
  ok,
  type ImportResult,
} from "./jsonImport";
import type {
  ChecklistVersionImport,
  MasterRoImport,
} from "./importTypes";

/**
 * Validate a free-form screening-items array: it must be null or an array whose
 * every element is an object. Contents are intentionally NOT inspected further
 * (items are `list[dict]` in the backend schema). Returns `null` on success or
 * an error string describing the problem.
 */
function checkScreeningItems(value: unknown, field: string): string | null {
  if (value === null) return null;
  if (!Array.isArray(value)) {
    return `${field} harus berupa array objek atau null.`;
  }
  if (!value.every((item) => isRecord(item))) {
    return `${field} hanya boleh berisi objek.`;
  }
  return null;
}

/**
 * Validate a parsed value as a `ChecklistVersionImport`.
 * Requires `nama_versi`/`file_path` strings and `is_active` boolean; each
 * screening list must be an array of objects or null.
 */
export function validateChecklistVersion(
  parsed: unknown,
): ImportResult<ChecklistVersionImport> {
  if (!isRecord(parsed)) {
    return fail("Checklist version harus berupa objek JSON.");
  }

  const errors: string[] = [];

  if (!isNonEmptyString(parsed.nama_versi)) {
    errors.push("nama_versi wajib diisi (string).");
  }
  if (!isNonEmptyString(parsed.file_path)) {
    errors.push("file_path wajib diisi (string).");
  }
  if (typeof parsed.is_active !== "boolean") {
    errors.push("is_active harus boolean.");
  }

  const s1 = checkScreeningItems(parsed.screening_1_items, "screening_1_items");
  if (s1) errors.push(s1);
  const s2 = checkScreeningItems(parsed.screening_2_items, "screening_2_items");
  if (s2) errors.push(s2);

  if (errors.length > 0) return fail(errors);
  return ok(parsed as unknown as ChecklistVersionImport);
}

/**
 * Validate a parsed value as a `MasterRoImport`.
 * `kode` is preserved as a string (leading zeros matter — never coerce).
 */
export function validateMasterRo(
  parsed: unknown,
): ImportResult<MasterRoImport> {
  if (!isRecord(parsed)) {
    return fail("Master RO harus berupa objek JSON.");
  }

  const errors: string[] = [];

  if (!isNonEmptyString(parsed.kode)) {
    errors.push("kode wajib diisi (string).");
  }
  if (!isNonEmptyString(parsed.deskripsi)) {
    errors.push("deskripsi wajib diisi (string).");
  }
  if (typeof parsed.is_active !== "boolean") {
    errors.push("is_active harus boolean.");
  }

  if (errors.length > 0) return fail(errors);
  return ok(parsed as unknown as MasterRoImport);
}

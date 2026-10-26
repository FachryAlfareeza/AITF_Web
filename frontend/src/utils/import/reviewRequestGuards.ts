// Shape guard for the TOR/RAB review request artifact.
//
// Validates an already-parsed `unknown` against the real schema shape BEFORE any
// mapping runs. Treats the input as untrusted: never throws, always returns a
// typed `ImportResult`, and enforces `additionalProperties:false` at the top
// level (unknown top-level keys are errors). Nested validation checks presence
// and basic type of required fields while tolerating nullable/optional ones.

import {
  fail,
  isInteger,
  isNonEmptyString,
  isRecord,
  isStringOrNull,
  ok,
  rejectUnknownKeys,
  type ImportResult,
} from "./jsonImport";
import type {
  ReviewRequestDocument,
  TorRabReviewRequest,
} from "./importTypes";

const TOP_LEVEL_KEYS = [
  "schema_version",
  "request_id",
  "submitted_at",
  "source",
  "documents",
  "program_context",
  "budget_summary",
  "extraction",
  "review_options",
] as const;

const SHA256_PATTERN = /^[a-fA-F0-9]{64}$/;

function validateDocument(
  value: unknown,
  label: string,
  expectedType: "tor" | "rab",
  errors: string[],
): void {
  if (!isRecord(value)) {
    errors.push(`documents.${label} harus berupa objek.`);
    return;
  }
  const doc = value as Partial<Record<keyof ReviewRequestDocument, unknown>>;

  if (doc.document_type !== expectedType) {
    errors.push(`documents.${label}.document_type harus "${expectedType}".`);
  }
  if (!isNonEmptyString(doc.document_id)) {
    errors.push(`documents.${label}.document_id wajib diisi (string).`);
  }
  if (!isNonEmptyString(doc.file_name)) {
    errors.push(`documents.${label}.file_name wajib diisi (string).`);
  }
  if (doc.media_type !== "application/pdf") {
    errors.push(`documents.${label}.media_type harus "application/pdf".`);
  }
  if (!isNonEmptyString(doc.sha256) || !SHA256_PATTERN.test(doc.sha256)) {
    errors.push(`documents.${label}.sha256 harus 64 karakter heksadesimal.`);
  }
  if (!isInteger(doc.page_count) || doc.page_count < 1) {
    errors.push(`documents.${label}.page_count harus bilangan bulat >= 1.`);
  }
  if (!isNonEmptyString(doc.storage_ref)) {
    errors.push(`documents.${label}.storage_ref wajib diisi (string opaque).`);
  }
}

function validateCodeLabel(
  value: unknown,
  path: string,
  errors: string[],
): void {
  // Optional in the schema: only validate when present (and not null).
  if (value === undefined || value === null) return;
  if (!isRecord(value)) {
    errors.push(`${path} harus berupa objek.`);
    return;
  }
  if (!isNonEmptyString(value.name)) {
    errors.push(`${path}.name wajib diisi (string).`);
  }
  if (!isStringOrNull(value.code)) {
    errors.push(`${path}.code harus string atau null.`);
  }
}

/**
 * Validate a parsed value as a `TorRabReviewRequest`. Accumulates human-readable
 * errors; returns `{ ok:false, errors }` on any problem, never throws.
 */
export function validateReviewRequest(
  parsed: unknown,
): ImportResult<TorRabReviewRequest> {
  if (!isRecord(parsed)) {
    return fail("Review request harus berupa objek JSON.");
  }

  const errors: string[] = [];

  // additionalProperties:false at the top level.
  errors.push(...rejectUnknownKeys(parsed, TOP_LEVEL_KEYS, "review request"));

  if (parsed.schema_version !== "1.0.0") {
    errors.push('schema_version harus "1.0.0".');
  }
  if (!isNonEmptyString(parsed.request_id)) {
    errors.push("request_id wajib diisi (string).");
  }
  if (!isNonEmptyString(parsed.submitted_at)) {
    errors.push("submitted_at wajib diisi (string RFC 3339).");
  }

  // source
  if (!isRecord(parsed.source)) {
    errors.push("source wajib berupa objek.");
  } else {
    if (!isNonEmptyString(parsed.source.system)) {
      errors.push("source.system wajib diisi (string).");
    }
    if (parsed.source.team !== "team_1") {
      errors.push('source.team harus "team_1".');
    }
    if (!isNonEmptyString(parsed.source.record_id)) {
      errors.push("source.record_id wajib diisi (string).");
    }
  }

  // documents
  if (!isRecord(parsed.documents)) {
    errors.push("documents wajib berupa objek dengan tor dan rab.");
  } else {
    validateDocument(parsed.documents.tor, "tor", "tor", errors);
    validateDocument(parsed.documents.rab, "rab", "rab", errors);
  }

  // program_context
  if (!isRecord(parsed.program_context)) {
    errors.push("program_context wajib berupa objek.");
  } else {
    const ctx = parsed.program_context;
    if (!isInteger(ctx.fiscal_year)) {
      errors.push("program_context.fiscal_year harus bilangan bulat.");
    }
    if (!isRecord(ctx.ministry) || !isNonEmptyString(ctx.ministry.name)) {
      errors.push("program_context.ministry.name wajib diisi (string).");
    }
    if (!isRecord(ctx.unit) || !isNonEmptyString(ctx.unit.name)) {
      errors.push("program_context.unit.name wajib diisi (string).");
    }
    validateCodeLabel(ctx.program, "program_context.program", errors);
    validateCodeLabel(ctx.activity, "program_context.activity", errors);
    validateCodeLabel(ctx.kro, "program_context.kro", errors);
    validateCodeLabel(ctx.ro, "program_context.ro", errors);
  }

  if (errors.length > 0) return fail(errors);
  return ok(parsed as unknown as TorRabReviewRequest);
}

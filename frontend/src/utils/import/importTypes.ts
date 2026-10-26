// Incoming-artifact TypeScript types for the JSON import layer.
//
// These model the SOURCE shapes produced by `tor-rab-ai-reviewer`, grounded
// field-by-field in:
//   - docs/api/team1-team2/tor-rab-review-request.schema.json (Draft 2020-12,
//     additionalProperties:false)
//   - backend/app/schemas/checklist.py
//   - backend/app/schemas/master_ro.py
//
// Convention for required vs optional:
//   - Schema-required keys are declared as required properties.
//   - Schema-optional keys use `?`.
//   - Schema `["string", "null"]` fields are typed `string | null` (NOT `?`),
//     because `null` is a meaningful "unknown/not applicable" value per the
//     steering contract and must be preserved, not dropped.
//
// Nothing from airen's app model (`types.ts`) is imported here — these are
// source types, kept separate from the mapping targets.

/** The only schema version this layer accepts. */
export type ReviewRequestSchemaVersion = "1.0.0";

/** `source` object — who sent the request. `team` is a const in the schema. */
export interface ReviewRequestSource {
  system: string;
  team: "team_1";
  record_id: string;
  source_url?: string;
  submitted_by?: string;
}

/** A single TOR or RAB document's metadata. Binary PDF is never embedded. */
export interface ReviewRequestDocument {
  document_id: string;
  document_type: "tor" | "rab";
  file_name: string;
  media_type: "application/pdf";
  sha256: string; // ^[a-fA-F0-9]{64}$
  page_count: number; // integer >= 1
  /** Opaque authorized storage reference — not a path/URL; never resolved here. */
  storage_ref: string;
  extracted_text_ref?: string | null;
  source_system_document_id?: string | null;
}

export interface ReviewRequestDocuments {
  tor: ReviewRequestDocument;
  rab: ReviewRequestDocument;
}

/** `organization` ($defs) — ministry/unit. Only `name` is required. */
export interface Organization {
  code?: string | null;
  name: string;
  unit_code?: string | null;
  unit_name?: string | null;
}

/** `code_label` ($defs) — program/activity/kro/ro. Only `name` is required. */
export interface CodeLabel {
  code?: string | null;
  name: string;
}

/** `locator` ($defs) — provenance for a value. document_id + page required. */
export interface Locator {
  document_id: string;
  page: number; // integer >= 1 (1-based)
  section?: string | null;
  table?: string | null;
  row?: number | null;
  cell?: string | null;
  /** Verbatim source excerpt; never paraphrased. */
  quote?: string | null;
}

/** `output` ($defs) — a program output with its supporting locator. */
export interface OutputItem {
  code?: string | null;
  name: string;
  indicator?: string | null;
  target?: string | number | null;
  unit?: string | null;
  source_locator: Locator;
}

export interface ProgramContext {
  fiscal_year: number; // integer 2000..2200
  ministry: Organization;
  unit: Organization;
  program?: CodeLabel;
  activity?: CodeLabel;
  kro?: CodeLabel;
  ro?: CodeLabel;
  location?: string | null;
  beneficiaries?: string | null;
  objective?: string | null;
  outputs?: OutputItem[];
}

export interface BudgetSummary {
  currency: "IDR";
  total_amount: number; // >= 0
  supporting_cost_amount?: number | null; // >= 0
  source_locator: Locator;
}

export interface Extraction {
  system: string;
  system_version?: string | null;
  status: "completed" | "partial" | "needs_manual_review";
  extracted_at: string; // RFC 3339
  warnings?: string[];
  language?: string; // default "id"
}

export interface ReviewOptions {
  checklist_version?: string | null;
  requested_review_types?: Array<
    "screening_1" | "screening_2" | "substance" | "budget"
  >;
}

/** Top-level TOR/RAB review request payload. */
export interface TorRabReviewRequest {
  schema_version: ReviewRequestSchemaVersion;
  request_id: string; // uuid
  submitted_at: string; // RFC 3339
  source: ReviewRequestSource;
  documents: ReviewRequestDocuments;
  program_context: ProgramContext;
  budget_summary?: BudgetSummary | null;
  extraction?: Extraction;
  review_options?: ReviewOptions;
}

/**
 * Checklist version artifact (backend/app/schemas/checklist.py).
 * `screening_*_items` are free-form JSON objects; the response variant allows
 * them to be null, so both are modeled as `Array<Record<string, unknown>> | null`.
 */
export interface ChecklistVersionImport {
  nama_versi: string;
  file_path: string;
  is_active: boolean;
  screening_1_items: Array<Record<string, unknown>> | null;
  screening_2_items: Array<Record<string, unknown>> | null;
}

/** Master RO artifact (backend/app/schemas/master_ro.py). */
export interface MasterRoImport {
  kode: string;
  deskripsi: string;
  is_active: boolean;
}

// Adapter: validated TOR/RAB review request -> airen `SubmissionData`.
//
// Mapping rules follow the steering contract:
//   - Codes stay STRINGS (never coerced) — but note SubmissionData carries NAMES
//     (program/kegiatan/kro/ro), so we map the `code_label.name`, not the code.
//   - Dates stay ISO strings (no reformat; the display layer uses dateUtils).
//   - Money is left to the display layer; this adapter does not touch formatting.
//   - `null`/absent source fields are NOT invented. Where airen's model demands a
//     non-optional string that has no source, we use "" and document it below.
//   - `storage_ref` is opaque and never resolved — pdfDataUrl/torPdfDataUrl are
//     left undefined (the existing blob/IndexedDB flow is untouched).
//
// Fields with NO source in the review-request JSON (documented placeholders):
//   - satkerUserId / satkerUserName / satkerUnit: the JSON carries program-context
//     orgs, not an airen user account -> "" (satkerUnit uses unit.name as the best
//     available label; satkerUserId/Name have no equivalent at all).
//   - prioritas: no priority concept in the JSON -> "".
//   - rabFileSize / torFileSize: byte size is not in the JSON -> "" (display code
//     tolerates strings; we do not fabricate a size).
//   - AI result fields (aiStatus/aiScore/aiReason/aiRecommendation/criteriaResults):
//     NO review-result artifact exists in the contract -> neutral placeholders.
//   - verificationStatus/verifikatorNotes: not yet reviewed -> "Menunggu"/"".

import type { SubmissionData } from "../../types";
import type { TorRabReviewRequest } from "./importTypes";

/** The single allowed empty-string fallback for required airen strings. */
const UNKNOWN = "";

/**
 * Map a validated review request onto airen's `SubmissionData`. Pure mapping:
 * no reformatting of dates/money, no coercion of codes, no resolving of
 * opaque storage references.
 */
export function mapReviewRequestToSubmission(
  src: TorRabReviewRequest,
): SubmissionData {
  const ctx = src.program_context;

  return {
    id: src.request_id,
    ticketNumber: src.source.record_id,

    // No airen user account is carried by the integration payload.
    satkerUserId: UNKNOWN,
    satkerUserName: UNKNOWN,
    satkerUnit: ctx.unit.name,

    // Keep the RFC 3339 string as-is; dateUtils handles display.
    submittedAt: src.submitted_at,

    // code_label.name fields (names, not codes); absent code_labels -> "".
    program: ctx.program?.name ?? UNKNOWN,
    kegiatan: ctx.activity?.name ?? UNKNOWN,
    kro: ctx.kro?.name ?? UNKNOWN,
    ro: ctx.ro?.name ?? UNKNOWN,
    unitEselon1: ctx.ministry.name,
    unitEselon2: ctx.unit.name,
    prioritas: UNKNOWN,

    // Document metadata (binary never embedded; storage_ref stays opaque).
    rabFileName: src.documents.rab.file_name,
    rabFileSize: UNKNOWN,
    torFileName: src.documents.tor.file_name,
    torFileSize: UNKNOWN,
    // pdfDataUrl / torPdfDataUrl intentionally left undefined.

    tahunAnggaran: String(ctx.fiscal_year),

    // No AI review-result artifact exists in the contract: neutral placeholders.
    aiStatus: "TIDAK LOLOS",
    aiScore: 0,
    aiReason: UNKNOWN,
    aiRecommendation: UNKNOWN,
    criteriaResults: [],

    // Not yet verified.
    verificationStatus: "Menunggu",
    verifikatorNotes: UNKNOWN,
  };
}

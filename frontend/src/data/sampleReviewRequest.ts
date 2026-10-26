// Synthetic sample TOR/RAB review request fixture.
//
// SYNTHETIC placeholder data ONLY — no real TOR/RAB content, no secrets. Values
// mirror the shapes in docs/api/team1-team2/README.md (uuid-shaped ids, 64-char
// hex placeholders, opaque storage_ref, codes as strings with a leading zero to
// prove preservation, money as a plain IDR number). Typed as the source type so
// `tsc` catches any drift from the schema.

import type { TorRabReviewRequest } from "../utils/import/importTypes";

export const SAMPLE_REVIEW_REQUEST: TorRabReviewRequest = {
  schema_version: "1.0.0",
  request_id: "b7b639f1-9d05-4c4c-a9ba-fb2015a53f62",
  submitted_at: "2026-10-22T09:30:00+07:00",
  source: {
    system: "sistem-ekstraksi-contoh",
    team: "team_1",
    record_id: "SRC-2026-000123",
    source_url: undefined,
    submitted_by: "user-contoh",
  },
  documents: {
    tor: {
      document_id: "8d1c0cc4-890f-4c7a-a823-e23b0d84112b",
      document_type: "tor",
      file_name: "contoh-tor.pdf",
      media_type: "application/pdf",
      sha256: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      page_count: 12,
      storage_ref: "object://authorized-bucket/opaque-id-tor",
      extracted_text_ref: null,
      source_system_document_id: "TOR-123",
    },
    rab: {
      document_id: "72bcd83e-a174-4e87-9a7c-e0fca1d99f12",
      document_type: "rab",
      file_name: "contoh-rab.pdf",
      media_type: "application/pdf",
      sha256: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      page_count: 8,
      storage_ref: "object://authorized-bucket/opaque-id-rab",
      extracted_text_ref: null,
      source_system_document_id: "RAB-123",
    },
  },
  program_context: {
    fiscal_year: 2026,
    ministry: { code: null, name: "Kementerian Contoh", unit_code: null, unit_name: null },
    unit: { code: null, name: "Satker Contoh", unit_code: null, unit_name: null },
    // Leading zero kept as a string to prove codes are never coerced to numbers.
    program: { code: "012", name: "Program Contoh" },
    activity: { code: "0123", name: "Kegiatan Contoh" },
    kro: { code: null, name: "KRO Contoh" },
    ro: { code: null, name: "RO Contoh" },
    location: null,
    beneficiaries: null,
    objective: "Tujuan kegiatan contoh sebagaimana tertulis di TOR.",
    outputs: [
      {
        code: null,
        name: "Output contoh sesuai TOR",
        indicator: "Indikator contoh",
        target: 1,
        unit: "dokumen",
        source_locator: {
          document_id: "8d1c0cc4-890f-4c7a-a823-e23b0d84112b",
          page: 3,
          section: "Output",
          table: null,
          row: null,
          cell: null,
          quote: "Kutipan contoh yang mendukung nilai output.",
        },
      },
    ],
  },
  budget_summary: {
    currency: "IDR",
    total_amount: 125000000,
    supporting_cost_amount: null,
    source_locator: {
      document_id: "72bcd83e-a174-4e87-9a7c-e0fca1d99f12",
      page: 2,
      section: "Ringkasan RAB",
      table: "Rincian biaya",
      row: 1,
      cell: "Total",
      quote: "TOTAL Rp125.000.000",
    },
  },
  extraction: {
    system: "contoh-extraction-adapter",
    system_version: "0.1.0",
    status: "completed",
    extracted_at: "2026-10-22T09:20:00+07:00",
    warnings: [],
    language: "id",
  },
  review_options: {
    checklist_version: null,
    requested_review_types: ["screening_1", "screening_2", "substance", "budget"],
  },
};

// Synthetic sample checklist version fixture.
//
// SYNTHETIC placeholder data ONLY — no real checklist/regulation content. Free-
// form screening items use a mix of common keys to exercise the best-effort text
// extraction in the adapter. Typed as the source type so `tsc` catches drift.

import type { ChecklistVersionImport } from "../utils/import/importTypes";

export const SAMPLE_CHECKLIST_VERSION: ChecklistVersionImport = {
  nama_versi: "Checklist Contoh v1",
  file_path: "checklists/contoh-v1.xlsx",
  is_active: true,
  screening_1_items: [
    { text: "Kelengkapan dokumen TOR contoh." },
    { kriteria: "Kesesuaian format RAB contoh." },
  ],
  screening_2_items: [
    { pertanyaan: "Apakah anggaran contoh sesuai SBM?" },
    { deskripsi: "Konsistensi output dan indikator contoh.", kode: "S2-01" },
  ],
};

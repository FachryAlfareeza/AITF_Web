// Synthetic sample master RO fixture.
//
// SYNTHETIC placeholder data ONLY. `kode` keeps a leading zero as a string to
// prove codes are never coerced to numbers. Typed as the source type so `tsc`
// catches any drift.

import type { MasterRoImport } from "../utils/import/importTypes";

export const SAMPLE_MASTER_RO: MasterRoImport = {
  kode: "0123.ABC.001",
  deskripsi: "Rincian Output contoh untuk keperluan demonstrasi.",
  is_active: true,
};

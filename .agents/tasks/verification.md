# Verification — TOR upload alongside RAB + Dokumen Acuan for verifikator

Iteration: first (no `review.json` present at start). All work done in the worktree
`d:\Coding\AITF\airen\.worktrees\tor-acuan`, frontend sources under `frontend/src`.

## Commands run and results

Run from the worktree root (single root `package.json`):

- `npm run lint` (`tsc --noEmit -p frontend/tsconfig.json`) → **exit code 0**, no type errors.
- `npm run build` (`vite build --config frontend/vite.config.ts`) → **exit code 0**,
  `✓ 1689 modules transformed`, `✓ built in ~368ms`. Emitted `frontend/dist/*`
  including `SatkerView-*.js` (105.68 kB). No warnings about root-absolute asset URLs.

No test framework exists in the repo (package.json has only dev/build/start/preview/clean/lint),
so verification is lint + build + the traced render paths below.

## Requirement 1 — TOR alongside RAB

### (a) Type fields
`frontend/src/types.ts` `SubmissionData` now has optional `torFileName?`, `torFileSize?`,
`torPdfDataUrl?` placed next to `rabFileName`/`rabFileSize`/`pdfDataUrl`. All `rab*` fields and
`pdfDataUrl` are unchanged. Optional → previously-stored submissions (no TOR) still parse; the
build's typecheck confirms no non-optional access breaks older records.

### (b) Two separate PDF inputs + validation — render path evidence
In `frontend/src/components/SatkerView.tsx`, sub-section C (`activeRabSubTab === "form"`,
reached via sidebar "Form Pengajuan RAB Baru" / `onSelectMenu("satker_form")`) renders TWO
distinct upload cards inside the "C. Unggah Berkas Dokumen PDF (RAB & TOR)" container:
- "Dokumen RAB" card → hidden input `#rab-file-upload-input` → `handleRabUpload` → `handleDirectFileUpload`.
- "Dokumen TOR" card → hidden input `#tor-file-upload-input` → `handleTorUpload`.

`handleTorUpload` performs the SAME strict PDF check used elsewhere in the file
(`handleReuploadFileChange`): reads `file.slice(0,5)`, requires `.pdf` extension AND
`new TextDecoder().decode(header) === "%PDF-"`. On failure it clears TOR state and sets
`torUploadError` (Indonesian: "Berkas Dokumen TOR harus berupa PDF yang valid."), rendered in a
rose error banner above the submit area. Both cards show Indonesian labels "Dokumen RAB" and
"Dokumen TOR", a red `*` required asterisk, and a "Wajib Unggah PDF" badge until a file is chosen.

### (c) TOR blob stored with distinct keys
In `handleAiSubmit`, after the RAB `storePdfBlob` trio, TOR is stored under `tor:`-prefixed keys:
`storePdfBlob(`tor:${newSubmission.id}`, torFile)`, `tor:${newSubmission.ticketNumber}`,
`tor:${torFileName}`. This mirrors the RAB pattern exactly and guarantees RAB/TOR blobs never
collide in IndexedDB (same `pdfStorage.storePdfBlob`, no change to `pdfStorage.ts`).

### (d) Both documents previewable + graceful degradation — render path evidence
- Live form: RAB preview via `previewOpen` → existing RAB `PdfPreviewModal`
  (`ticketNumber="FORM-USULAN-BARU"`). TOR preview via new `torPreviewOpen` → new TOR
  `PdfPreviewModal` (`ticketNumber="FORM-USULAN-BARU-TOR"`, `fileDataUrl={torBlobUrl || torDataUrl}`).
- Stored submission list (`SubmissionTable`): existing `onPreview` opens RAB. New `onPreviewTor`
  prop + a "TOR: <filename>" button in the document cell opens the TOR preview via
  `historyTorPreviewItem`. When `torFileName` is absent the cell shows "Belum ada Dokumen TOR".
- Detail modal (`selectedDetailSubmission`): new "Dokumen Terlampir" grid shows RAB + TOR
  filenames, each with a Preview button (RAB → `setHistoryPreviewItem`, TOR → `setHistoryTorPreviewItem`).
  TOR row shows "Belum ada Dokumen TOR" and hides the Preview button when missing.
- The TOR `PdfPreviewModal` is passed `tor:`-prefixed `ticketNumber`/`submissionId`, so its
  existing `resolvePdf` lookup (`[ticketNumber, submissionId, fileName]`) finds the TOR blob in
  IndexedDB. If the TOR blob is missing, `PdfPreviewModal` falls back to `generateFallbackRabPdf`
  exactly as RAB does — no TOR-specific crash path was added.

### (e) RAB analysis chain unchanged
`inspectUploadedRabDocument` (pdfInspector.ts) and `runAiRabAnalysis` (defaultCriteria.ts) are
untouched. `handleAiSubmit` still runs the RAB analysis + fallback chain as before; TOR is only
uploaded/stored/previewable with no analysis of its own.

### (f) TOR required for new submissions, optional for old
New submissions: `handleAiSubmit` has an `if (!torFile)` guard (after `if (!rabFile)`) that blocks
submit with an Indonesian error and returns. UI marks TOR required (red `*` + "Wajib Unggah PDF").
Older submissions: type fields are optional, so stored records without TOR still read; the UI shows
"Belum ada Dokumen TOR" instead of crashing.

## Requirement 2 — Dokumen acuan management for verifikator (rocan)

No code change required (confirmed, not assumed). Render path:
- `frontend/src/App.tsx`: `stdKey === "menu_acuan"` → `<SuperAdminView permission={currentPermission} />`
  where `currentPermission = ROLE_PERMISSIONS_MATRIX[stdKey]?.[activeRole]`.
- `frontend/src/types.ts`: `ROLE_PERMISSIONS_MATRIX.menu_acuan.verifikator === "E"`.
- `frontend/src/components/SuperAdminView.tsx`: `isEditable = permission === "E"` gates the
  "Unggah Peraturan Baru" button, the upload form, the reindex button, and `RegulationCardList`'s
  `isEditable` (toggle active/inactive, edit, delete). So a verifikator user (seed user
  ID `19910718`, Ahmad Fauzi, `activeRole: "verifikator"` in `initialUsers.ts`) receives
  `permission="E"` and reaches the fully editable dokumen-acuan UI. Acuan PDFs remain stored
  client-side as `RegulationDocument.pdfDataUrl` via `appStorage` (unchanged).

## Copy softening

In `SatkerView.tsx`, four user-facing strings were softened to read as a demo/prototype analysis
(Indonesian), copy-only, no logic/field-name changes:
- Submit button → "Submit & Jalankan Analisis Demo RAB (Prototipe)"
- Loading banner heading → "Analisis Demo Prototipe Sedang Menelaah Dokumen RAB"
- Results badge → "HASIL ANALISIS DEMO (PROTOTIPE) • 20 KRITERIA KEPATUHAN SBM"
- Results heading → "Laporan Analisis Demo Penapisan Dokumen RAB (Hasil Sementara Prototipe)"

## Constraints honored

Frontend-only; no backend/API/network added; no JSON adapter layer; persistence stays localStorage
+ IndexedDB and backward-compatible (optional fields); no root-absolute asset URLs introduced;
`.kiro/`, `README.md`, `Context/`, `.github/`, `vite.config.ts` untouched.

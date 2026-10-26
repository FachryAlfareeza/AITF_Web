# Review — TOR upload alongside RAB + Dokumen Acuan for verifikator

Branch: `feature/tor-and-acuan` (diff `main...feature/tor-and-acuan`).
Verdict: **APPROVED** — no blocking findings.

## Scope of diff (git diff --stat)
Only expected files changed:
- `.agents/tasks/plan.md`, `.agents/tasks/verification.md` (task docs)
- `frontend/src/components/SatkerView.tsx` (+237/-9)
- `frontend/src/components/SubmissionTable.tsx` (+15)
- `frontend/src/types.ts` (+5)

No edits to `.kiro/`, `README.md`, `Context/`, `.github/`, or `frontend/vite.config.ts`. Confirmed via `--stat`.

## Verification evidence (read, not re-run)
`verification.md` records `npm run lint` (tsc --noEmit) exit 0 and `npm run build` (vite) exit 0, 1689 modules transformed, no root-absolute asset warnings. No test framework exists in the repo. I did not re-run the suites. A required-prop (`onPreviewTor`) was added to `SubmissionTableProps`; I confirmed there is exactly one `<SubmissionTable>` usage site (SatkerView line ~994) and it passes `onPreviewTor={setHistoryTorPreviewItem}`, consistent with the clean build.

## R1 — TOR alongside RAB
- **Types**: `types.ts` adds optional `torFileName?`, `torFileSize?`, `torPdfDataUrl?` immediately after `rabFileName`/`rabFileSize`/`pdfDataUrl`. All `rab*` fields and `pdfDataUrl` are unchanged / not renamed. Optional → older stored submissions still parse. ✓
- **Second input + validation**: `handleTorUpload` reads `file.slice(0,5)`, requires `.pdf` extension AND `new TextDecoder().decode(header) === "%PDF-"`, i.e. the same magic-bytes check used by `handleReuploadFileChange`. On failure it clears TOR state and sets an Indonesian error ("Berkas Dokumen TOR harus berupa PDF yang valid."). Dedicated hidden input `#tor-file-upload-input`, separate from RAB's. ✓
- **Indonesian labels**: Sub-section C relabelled "C. Unggah Berkas Dokumen PDF (RAB & TOR)"; two cards headed "Dokumen RAB" and "Dokumen TOR", each with a red `*` and "Wajib Unggah PDF" badge. ✓
- **Distinct storage keys**: in `handleAiSubmit`, after the RAB `storePdfBlob` trio, TOR is stored under `tor:${id}`, `tor:${ticketNumber}`, `tor:${torFileName}`. Verified `storePdfBlob(key, blobOrFile)` signature in `pdfStorage.ts`; the `tor:` prefix guarantees no collision with RAB keys. `pdfStorage.ts` unchanged. ✓
- **Both previewable + graceful degradation**: live-form TOR preview via `torPreviewOpen` modal (`ticketNumber="FORM-USULAN-BARU-TOR"`, `fileDataUrl={torBlobUrl || torDataUrl}`); stored-submission TOR preview via `historyTorPreviewItem` modal passing `tor:`-prefixed `ticketNumber`/`submissionId` and `fileDataUrl={torPdfDataUrl}`. Confirmed `PdfPreviewModal.resolvePdf` lookup order `[ticketNumber, submissionId, fileName]` then falls back to `generateFallbackRabPdf` — so a missing TOR blob degrades to the standard fallback sheet, no crash path added. `SubmissionTable` shows a "TOR: <name>" preview button or "Belum ada Dokumen TOR"; detail modal shows RAB+TOR with per-doc Preview and "Belum ada Dokumen TOR" when absent. ✓
- **RAB analysis chain intact**: `runAiRabAnalysis` (defaultCriteria) and `inspectUploadedRabDocument` (pdfInspector) imports and call sites untouched; TOR has no analysis. ✓
- **TOR required (new) / optional (type)**: `handleAiSubmit` adds `if (!torFile)` guard with Indonesian error after the RAB guard; type fields remain optional for backward compatibility. ✓

## R2 — Dokumen acuan for verifikator
No parallel system; reuses the existing acuan view. `App.tsx` routes `menu_acuan` → `<SuperAdminView permission={currentPermission} />` where `currentPermission = ROLE_PERMISSIONS_MATRIX[stdKey]?.[activeRole]`. `types.ts` has `menu_acuan.verifikator === "E"`. `SuperAdminView` gates every edit control (upload button, upload form, reindex, `RegulationCardList` toggle/edit/delete) on `isEditable = permission === "E"`. So a verifikator receives "E" and can add/view/activate-deactivate/remove dokumen acuan through `RegulationDocument` + the existing regulations persistence/flow. Indonesian copy throughout. No code change was required and the diff makes none here. ✓

## Other required checks
- **Demo copy softened**: four strings reworded to read as demo/prototype (submit button, loading banner, results badge, results heading) with no change to `aiStatus`/`aiScore` logic, field names, or the 20-criteria domain text. ✓
- **Persistence**: stays client-side (localStorage + IndexedDB), backward-compatible via optional TOR fields. ✓
- **No backend/API/network added; no JSON adapter layer added.** ✓
- **No root-absolute asset URLs**: grep for `(src|href|url) = "/..."` in SatkerView returns no matches; no public-asset changes. ✓
- **Restricted paths untouched** (`.kiro/`, `README.md`, `Context/`, `.github/`, `vite.config.ts`). ✓
- **lint + build reported passing.** ✓

## Findings
None (no blockers).

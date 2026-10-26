# Implementation Plan — airen frontend text legibility & redundancy pass

Presentational/text-only pass. Do NOT change behavior, logic, state, handlers, routing, RBAC
(`ROLE_PERMISSIONS_MATRIX`), colors, dark-mode variants, spacing/layout, or component APIs — except
deleting the now-unused `sublabel` field in `Sidebar.tsx` (item 2). Preserve `aria-label`, `title`,
`role`, `htmlFor`. Preserve Indonesian copy; do not translate. Keep existing quoting, formatting, and
Tailwind class ordering (replace the size token in place; do not reorder surrounding classes).

## Build / verify commands

Discovered in `d:\Coding\AITF\airen\package.json` (run from the repo root `d:\Coding\AITF\airen`, NOT
from `frontend/`):

- Type-check (fastest, catches the `sublabel` removal and any JSX breakage):
  `npm run lint`  →  `tsc --noEmit -p frontend/tsconfig.json`
- Production build (full Vite + Tailwind compile):
  `npm run build`  →  `vite build --config frontend/vite.config.ts`

Expected outcome for every verify step below: `npm run lint` exits 0 with no errors, and (after the
final item) `npm run build` completes with no errors. There is no unit-test runner in this project, so
type-check + build is the verification bar. Tailwind v4 is JIT (`@import "tailwindcss"` in
`src/index.css`); `text-xs`/`text-sm` are standard utilities, so no config change is needed.

## Decisions (made during exploration; one line of rationale each)

- D1. **Size mapping.** `text-[9px]`/`text-[10px]`/`text-[11px]` → `text-xs` (12px). This is the "floor"
  rule and is mechanical: these three arbitrary tokens never appear on primary body copy that needs
  14px (they are chips/eyebrows/meta), so `text-xs` is the correct target for all 169 of them.
- D2. **Primary vs decorative `text-xs`.** Raise `text-xs` → `text-sm` only where it is body/primary
  reading content: form field `<label>`s, help/hint `<p>`s under inputs, descriptions, paragraph copy,
  table cell text the user reads, and view subtitle paragraphs. Keep `text-xs` on decorative/meta
  chips: permission E/V pills, numeric count badges, status pills, `v2.6`, `font-mono` ID/NIP meta,
  uppercase "eyebrow" labels, and button labels inside compact toolbars (raising button text would
  force layout/height changes, which is out of scope). Rationale: the task floors readable text at
  12px and lifts primary copy to 14px, while explicitly exempting small non-essential chips.
- D3. **Section-header descriptor paragraphs in the big views are NOT redundant.** In SatkerView,
  SuperAdminView, VerifikatorView, MasterRoView the `<p>` under each H2/H3 explains what the section
  does in new words (instructional), it does not restate the title. Per the task ("Do NOT remove text
  that carries distinct info … help/instructional text"), these are KEPT and only resized under D2.
  The genuine restating-sublabel removals are confined to Sidebar, Navbar, LoginView (items 1–3).
- D4. **`sublabel` is local to Sidebar.tsx.** `grep` confirms `sublabel` appears in no `.ts` file and
  not in `src/types.ts`; it is only the inline array-element type + data + render in `Sidebar.tsx`, so
  removing it is fully local and safe (item 2).

---

## Ordered items

Items 1–3 (Sidebar, Navbar, LoginView) contain the concrete redundant-label removals plus their local
micro-size fixes. Items 4–17 are the remaining per-file size passes. Each item leaves the tree
buildable; run `npm run lint` after each, `npm run build` after the last.

- [ ] 1. **Sidebar.tsx — role badge + section-counter cleanup and micro-size floor (no `sublabel` yet).**
      CHANGE 2 (redundant labels):
      • Role badge block (lines ~186–192): collapse the three-part block to a single clear role label.
        Remove the eyebrow `<span>…>Role Akun</span>` (line 188) — it restates the badge below it — and
        remove the `"Aktif"` pill (line 191, `>Aktif<`) which is noise; keep `{roleInfo.title}` as the
        single role label and raise it from `text-xs` to `text-sm` (line 190). (Layout: the flex
        `justify-between` wrapper may keep a single child; do not restructure spacing beyond deleting
        the two spans.)
      • "Menu Akses" section header (lines 203–207): remove the `{visibleMenus.length} Menu` counter
        eyebrow (line 205, `>{visibleMenus.length} Menu<`) — noise per the task; keep the
        `"Menu Akses"` label (line 204).
      CHANGE 1 (micro-size → `text-xs`), all in this file: lines 188, 191, 204, 205 (those not deleted
      above), 238, 247, 262, 295, 304, 319, 337, 339. The E/V pills (247, 304) and numeric count pills
      (262, 319) and the `v`/NIP footer meta (337, 339) are decorative → `text-xs` (do NOT go to
      `text-sm`). Note lines 238 and 295 are the `{item.sublabel}` render lines — leave them untouched
      in THIS item; item 2 deletes them.
      Files: `src/components/Sidebar.tsx`
      Verify: `npm run lint` — exits 0, no errors.

- [ ] 2. **Sidebar.tsx — remove the redundant per-menu `sublabel` (data, type, render).**
      Each nav item renders `label` plus a `sublabel` that paraphrases it
      ("Management User"/"Hak Akses & Kelola Akun"; "Input Acuan"/"Ketentuan & Regulasi AI";
      "Input Checklist"/"Master 20 Kriteria AI"; "Input Master RO"/"Katalog & Hierarki RO";
      "Daftar RAB"/"Riwayat & Pengajuan RAB"). Remove the secondary line entirely:
      • Delete the `sublabel: string;` field from the inline array-type (line 76).
      • Delete the five `sublabel: "…",` data entries (lines 83, 90, 97, 104, 111).
      • Delete the two render `<div>`s that output `{item.sublabel}` (lines 238 and 295) — the
        surrounding `truncate` wrapper `<div>` that also holds `{item.label}` stays; only the sublabel
        `<div>` is removed.
      `sublabel` is not referenced anywhere else (confirmed via grep: absent from `src/types.ts` and all
      `.ts` files), so no other file changes.
      Files: `src/components/Sidebar.tsx`
      Verify: `npm run lint` — exits 0; TypeScript confirms no remaining reference to `sublabel`.

- [ ] 3. **Navbar.tsx — drop redundant tagline; floor micro-sizes.**
      CHANGE 2: keep the H1 `"Sistem Pengecekan File RAB AI"` (line 56). Remove the redundant tagline
      `<p>` on line 58 (`"Kementerian Komunikasi dan Digital RI • Telaah Anggaran Berbasis LLM"`) — it
      duplicates the ministry identity already conveyed by the H1 + logo; this yields the cleaner
      single-line result. Keep the `v2.6` chip.
      CHANGE 1: `text-[10px]` on the `v2.6` chip (line 56) and the `NIP:` meta (line 93) → `text-xs`
      (decorative/meta, stay `text-xs`). Line 58's `text-[11px]` is removed with the tagline.
      Files: `src/components/Navbar.tsx`
      Verify: `npm run lint` — exits 0, no errors.

- [ ] 4. **LoginView.tsx — trim duplicative subtitle; floor micro-sizes; raise primary copy.**
      CHANGE 2: keep H1 `"Selamat Datang"` (line ~101) and the single short subtitle `<p>` on line 102
      (`"Sistem Verifikasi & Telaah Dokumen Anggaran (RAB) Komdigi RI"`) — this is already one concise
      line, so no descriptor to remove here; leave the subtitle but raise it per D2. The demo quick-login
      buttons keep BOTH the role name and the NIP (NIP is distinct info) — only enforce the 12px floor.
      CHANGE 1 (micro-size → `text-xs`): lines 127 (`{userId.length}/8` meta — decorative, `text-xs`),
      152 ("Lupa Password?" link — keep `text-xs`), 192 ("Akses Cepat Demo Akun:" eyebrow — `text-xs`),
      199/200, 208/209, 217/218 (demo button role name + NIP — raise the role-name `text-[11px]` to
      `text-xs` and NIP `text-[10px]` to `text-xs`; both decorative/meta, stay `text-xs`), 225 (help
      modal subtitle — `text-xs`), 244 (footer `"…• 2026"` — decorative meta, `text-xs`).
      CHANGE 1 (primary `text-xs` → `text-sm`, D2): the brand subtitle `<p>` (line 102) is primary
      reading copy → `text-sm`; the two field `<label>`s "ID Pengguna / NIP" (line ~121) and "Password"
      (line ~146) are form labels → `text-sm`. Keep the help-modal `<li>` list text at `text-xs` only if
      already `text-xs`; the `<ul>` list items on line ~225 are supporting fine print → leave `text-xs`.
      Files: `src/components/LoginView.tsx`
      Verify: `npm run lint` — exits 0, no errors.

- [ ] 5. **App.tsx — primary copy only (no micro-sizes present).**
      No `text-[9/10/11px]` here. Under D2 raise to `text-sm`: the "Memuat halaman..." Suspense fallback
      (`role="status"`) and the NONE-permission message `<p>` "Anda tidak memiliki hak akses…". Leave the
      footer line `text-xs` (decorative meta credit line) and the "Kembali ke Menu Utama" button
      `text-xs` (compact button). 
      Files: `src/App.tsx`
      Verify: `npm run lint` — exits 0, no errors.

- [ ] 6. **SubmissionFilterPanel.tsx — floor micro-sizes; raise field labels.**
      CHANGE 1 (micro → `text-xs`): lines 21 ("5 Parameter Penapisan" meta — stay `text-xs`), 26, 43,
      58, 73 (the four filter field `<label>`s "1. Jenis Dokumen", "2. Status Verifikasi", "3. Tahun
      Anggaran", "4. Tanggal Pengajuan…"). Under D2 these are form labels → raise to `text-sm` (i.e.
      `text-[11px]` → `text-sm`, not merely `text-xs`).
      Files: `src/components/SubmissionFilterPanel.tsx`
      Verify: `npm run lint` — exits 0, no errors.

- [ ] 7. **SubmissionTable.tsx — floor micro-sizes (all decorative/meta table chips).**
      CHANGE 1 → `text-xs` on lines 63 (empty-state hint `<p>` — this is a readable help line; raise to
      `text-sm` per D2), 92/95/100/105 (category chips + deskripsi italic — decorative chips, `text-xs`),
      110 (`TA {year}` chip — `text-xs`), 120/122 (Created/Updated logging `<div>`s — these are readable
      cell text; raise to `text-sm` per D2) — NOTE line 122 is the file-size/format meta `font-mono`
      inside the doc cell, keep that one `text-xs`; re-check: 120 = "Created/Updated" labels (raise to
      `text-sm`), 129/133 = KRO•RO + logging lines (readable cell text → `text-sm`), 137 = "Lihat
      History CRUD PDF" link eyebrow (`text-xs`). Apply D2 judgment line-by-line: readable cell text →
      `text-sm`; mono/meta chips and the small link → `text-xs`. The two `text-xs` table `<table>` base
      classes and `<thead>` stay as-is (table chrome).
      Files: `src/components/SubmissionTable.tsx`
      Verify: `npm run lint` — exits 0, no errors.

- [ ] 8. **UserAccountsTable.tsx — floor micro-sizes (decorative chips).**
      CHANGE 1 → `text-xs` on lines 45 ("Anda" badge), 54 (role pills), 69 (menu-access pill), 85
      (status pill). All four are decorative pills/badges → `text-xs` (do NOT raise to `text-sm`). The
      table body base `text-xs` (readable cell content such as name/unit) → raise the table's primary
      cell text to `text-sm` is OUT OF SCOPE here because the size is set once on the `<table
      className="… text-xs">`; raising it would also enlarge the uppercase `<thead>` chrome. Keep the
      `<table>` base `text-xs`; only the four arbitrary micro-pills change.
      Files: `src/components/UserAccountsTable.tsx`
      Verify: `npm run lint` — exits 0, no errors.

- [ ] 9. **VerificationCriteriaTable.tsx — floor micro-sizes.**
      CHANGE 1 → `text-xs` on lines 28 ("(terkunci)/(bisa diubah)" header hint — `text-xs`), 50
      (category chip — `text-xs`), 108 ("*Diubah dari AI" marker — `text-xs`). All decorative/marker
      text → `text-xs`. The `criterion.text` cell (line 49) is already set via the table's `text-xs`
      base and `font-semibold`; leave the table base `text-xs` (changing it enlarges thead chrome).
      Files: `src/components/VerificationCriteriaTable.tsx`
      Verify: `npm run lint` — exits 0, no errors.

- [ ] 10. **RegulationCardList.tsx — floor micro-sizes.**
      CHANGE 1 → `text-xs` on lines 48 (category chip) and 52 (`TA {targetYear}` chip) — both decorative
      chips → `text-xs`. Under D2 raise to `text-sm`: the card title `{regulation.title}` (currently
      `text-xs sm:text-sm`, line ~47 — set the base to `text-sm`) and the description `<p>` (line ~58,
      `text-xs`) since these are primary reading content. Keep the meta row (`fileName`, date, uploader,
      line ~61) at `text-xs` (mono meta) and the empty-state help `<p>` already `text-xs` → raise to
      `text-sm` (readable help). No redundant sublabels in this file.
      Files: `src/components/RegulationCardList.tsx`
      Verify: `npm run lint` — exits 0, no errors.

- [ ] 11. **ChangePasswordModal.tsx — raise primary copy (no micro-sizes).**
      No `text-[9/10/11px]`. Under D2 raise to `text-sm`: the three field `<label>`s "Password Lama",
      "Password Baru", "Konfirmasi Password Baru" (currently `text-xs font-semibold`). Keep the modal
      subtitle `"User ID: {id}"` (`font-mono` meta) and the error/success banners and footer buttons at
      `text-xs` (status + compact buttons). 
      Files: `src/components/ChangePasswordModal.tsx`
      Verify: `npm run lint` — exits 0, no errors.

- [ ] 12. **ErrorBoundary.tsx — floor micro-size; raise body copy.**
      CHANGE 1: line 63 `text-[11px]` on the error-detail `font-mono` box → `text-xs` (decorative mono
      block). Under D2 raise the description `<p>` ("Aplikasi mendeteksi adanya gangguan…") from `text-xs`
      to `text-sm` (primary body copy). Keep the two action buttons `text-xs`.
      Files: `src/components/ErrorBoundary.tsx`
      Verify: `npm run lint` — exits 0, no errors.

- [ ] 13. **PdfPreviewModal.tsx — floor all 21 micro-sizes; raise body copy (no redundant labels).**
      CHANGE 1 (micro → `text-xs`) on lines 251, 255, 260, 397, 456, 471, 473, 477, 482, 486, 491, 496,
      501, 516, 526, 530, 535, 539, 544, 557, 577 — all decorative chips, `font-mono` footer/hash meta,
      and the "digital sheet" metadata eyebrow labels (`text-[10px] uppercase font-bold block`).
      Under D2 raise to `text-sm`: the empty-state help `<p>` "Silakan unggah dokumen PDF untuk melihat
      pratinjau…" and the fallback info-banner body text. Keep status pills ("Lembar RAB Resmi Standar",
      "Berkas Asli (.PDF)"), the mono footer/hash meta, and the metadata-grid eyebrow labels at
      `text-xs`. CHANGE 2: none — each metadata eyebrow+value pair carries distinct info, keep both.
      Files: `src/components/PdfPreviewModal.tsx`
      Verify: `npm run lint` — exits 0, no errors.

- [ ] 14. **MasterRoView.tsx — floor micro-sizes; raise primary copy; keep descriptor paragraphs (D3).**
      CHANGE 1 (micro → `text-xs`) on lines: 289 (`font-mono` pagination "(Halaman x dari y)" meta —
      `text-xs`), 431 (thead uppercase chrome `text-[11px]` — `text-xs`), 454 (Eselon I meta under
      program cell — `text-xs`), 584 ("Total Terdaftar: N Master RO" chip — `text-xs`), 611 (Eselon I
      cell meta — `text-xs`), 618 (Eselon II cell meta — `text-xs`), 628 (priority pill — `text-xs`),
      675 (priority pill in another cell — `text-xs`). All are meta/chips/thead → `text-xs`.
      CHANGE 2 (D3): the form-card descriptor `<p>` "Masukkan nomenklatur Program, Kegiatan, KRO, dan
      RO resmi." and the catalog descriptor `<p>` "Hierarki anggaran APBN…" are instructional, NOT
      restatements — KEEP, and raise from `text-xs` → `text-sm` (D2). Also raise the form field
      `<label>`s (Program, Unit Eselon I/II, Kegiatan, KRO, Status Prioritas, RO — all `text-xs
      font-semibold`) → `text-sm`, and the View-Only banner body `<p>` → `text-sm`. Keep the "Hak
      Akses E/V" pills, the stat-card eyebrow labels, the search/filter `<option>`-adjacent `text-xs`
      filter labels ("Program:", "Prioritas:"), and the delete-modal buttons at `text-xs`.
      Files: `src/components/MasterRoView.tsx`
      Verify: `npm run lint` — exits 0, no errors.

- [ ] 15. **VerifikatorView.tsx — floor micro-sizes; raise primary copy; keep descriptors (D3).**
      CHANGE 1 (micro → `text-xs`) on lines: 332 (View-Only eyebrow), 362 ("Pejabat Verifikator:"
      eyebrow), 364 (ID meta), 389 (histori ticket•date meta), 463/469/475/483 (hierarchy field eyebrow
      labels "1. Program:" … "4. Satker & Unit Eselon:"), 485 (unit•prioritas meta), 493 ("Dasar
      Regulasi Acuan AI:" eyebrow), 596 (decision hint `<p>`), 638 ("Status terpilih:" meta), 663
      (catatan hint `<p>`), 973/990 (form hint `<span>`s "Nomor urut…"/"Tuliskan kalimat…"), 1009
      ("Catatan Sistem:" box), 1051/1056/1063 (view-criterion modal eyebrow labels). 
      D2 judgment within these: lines 596 and 663 are instructional hint paragraphs → raise to `text-sm`;
      line 1009's "Catatan Sistem" box is a readable note → `text-sm`; the rest (eyebrows, ID/ticket
      meta, "Status terpilih" meta, form field micro-hints 973/990) stay `text-xs`. The hierarchy VALUE
      spans at 463/469/475/483 that are currently `text-xs font-bold` value lines → raise to `text-sm`
      (primary content); their eyebrow label spans stay `text-xs`.
      CHANGE 1 (primary `text-xs` → `text-sm`, D2) elsewhere in file: the two top-banner subtitle `<p>`s
      (`isChecklistMenu ? … : …`, the `text-xs sm:text-sm` one — set base to `text-sm`), the AI
      reason/recommendation box `<p>`s, the "Keputusan Akhir Verifikasi" descriptor `<p>`, the master
      checklist descriptor `<p>` "Halaman ini bertujuan…", the form descriptor `<p>` "Isi kriteria…",
      the form field `<label>`s (a/b/c), and the view-criterion modal value `<p>`s. Keep AI/Verifikator
      status pills, "Lihat PDF RAB Satker" and collapse buttons, and table thead chrome at `text-xs`.
      CHANGE 2 (D3): none of VerifikatorView's sub-lines are pure restatements — all descriptor `<p>`s
      add instructional info; KEEP them (resize only).
      Files: `src/components/VerifikatorView.tsx`
      Verify: `npm run lint` — exits 0, no errors.

- [ ] 16. **SuperAdminView.tsx — floor all 30 micro-sizes; raise primary copy; keep descriptors (D3).**
      CHANGE 1 (micro → `text-xs`) on all occurrences: lines 562, 586, 601, 618, 649, 665, 676, 696,
      712, 728, 740, 762, 779, 1000, 1127, 1148, 1203, 1207, 1211, 1215, 1383, 1552, 1617, 1633, 1647,
      1661, 1670, 1766, 1846, 1851. Apply D2 within these:
      • Raise to `text-sm` (primary/body): the input help `<p>`s at 601, 618, 649, 665 ("Gunakan 8
        digit…", "Nama lengkap…", "Pilih unit kerja…", "Default: password123…"); the RBAC option
        descriptions at 696, 712, 728 ("Hanya dapat membaca…", "Dapat menginput…", "Akses penuh…");
        the role descriptions at 762; the status-akun help at 779 ("Akun aktif dapat langsung login…").
      • Keep at `text-xs` (meta/chips/eyebrows): 562 & 584-type "Total Terdaftar" chips, 586 & 1552
        "{formId.length}/8" counters, 676 "Pilih salah satu izin kewenangan" (short helper eyebrow —
        borderline; keep `text-xs`), 740 "1 Role per Akun" pill, 1000 reg-count tab pill, 1127 View-Only
        eyebrow, 1148 "Konsolidasi N Regulasi" pill, 1203/1207/1211/1215 RAG stat eyebrow labels, 1383
        "Berkas siap diunggah" chip, 1617/1633/1647/1661/1670 (RBAC/role micro labels in the edit
        modal — mirror the add-form decisions: option descriptions → `text-sm`, pills/eyebrows →
        `text-xs`; read each line's role before deciding), 1766 edit-modal meta, 1846/1851 edit-modal
        toggle sub-labels (match 779's treatment: the "Status Akun Aktif" descriptor → `text-sm`, any
        pill → `text-xs`).
      • Form field `<label>`s and section descriptor `<p>`s elsewhere (e.g. the "Formulir Pendaftaran…"
        descriptor at ~line 553, the top-banner subtitle `<p>` ~line 516, "Pengaturan Hak Akses Menu…"
        and "Role Penugasan Akun Pengguna" labels) are `text-xs`/`text-xs sm:text-sm` → raise base to
        `text-sm` under D2.
      CHANGE 2 (D3): SuperAdminView's descriptor `<p>`s (e.g. "Kelola akun pengguna…", "Atur ketentuan
        normatif…", "Daftarkan akun aparatur…") are instructional, not restatements — KEEP, resize only.
      Because this file is long, the implementer MUST re-grep after editing to confirm zero
      `text-[9px|10px|11px]` remain (see item 16).
      Files: `src/components/SuperAdminView.tsx`
      Verify: `npm run lint` — exits 0, no errors.

- [ ] 17. **SatkerView.tsx — floor all 39 micro-sizes; raise primary copy; keep descriptors (D3).**
      CHANGE 1 (micro → `text-xs`) on all occurrences: lines 830, 910, 920, 930, 940, 1186, 1391, 1395,
      1399, 1413, 1439, 1463, 1481, 1486, 1542, 1626, 1636, 1713, 1715, 1749, 1767, 1794, 1796, 1800,
      1804, 1810, 1816, 1818, 1823, 1829, 1835, 1840, 1925, 1964, 2002, 2006, 2023, 2033, 2036. Apply D2:
      • Raise to `text-sm` (primary/body): the four dashboard stat captions at 910/920/930/940 ("Seluruh
        dokumen yang diinput", "Menunggu proses telaah", "Memenuhi SBM & disahkan DIPA", "Perlu
        perbaikan dari Satker"); the category-form helper at 1439 ("Pilih kategori untuk memuat
        deskripsi…"); detail-panel value/content lines that are readable cell text (e.g. 1769/1770-area
        status value + catatan). Read each line and raise readable body copy; keep meta.
      • Keep at `text-xs` (meta/chips/eyebrows): 830 "Satker Pengusul:" eyebrow, 1186 "Dokumen saat ini"
        eyebrow, 1391/1395/1399 Eselon/Prioritas eyebrow labels, 1413 "Deskripsi otomatis terisi…" pill,
        1463 "Format: .pdf" tag, 1481/1486 PDF-selected/"Wajib Unggah PDF" status chips, 1542 reset-hint
        italic, 1626 "Daftar Dokumen Acuan Terkait…" eyebrow, 1636 "Dokumen Regulasi Acuan AI" meta,
        1713/1715 "Lolos"/"Ditolak" pills, 1749 detail ticket•satker meta, 1767 "Status Verifikasi:"
        eyebrow, 1794 "Hierarki Anggaran RKA-K/L" eyebrow, 1796/1800/1804/1810/1816/1818/1823/1829/
        1835/1840 (Program/Kegiatan/KRO•RO/etc. eyebrow labels — keep `text-xs`; raise their adjacent
        VALUE spans that are `text-xs` readable content to `text-sm`), 1925/1964/2002/2006/2023/2033/
        2036 (criteria-detail modal meta/pills — treat eyebrows/pills as `text-xs`, readable values as
        `text-sm`).
      • The top-banner subtitle `<p>` (line ~823, `text-xs sm:text-sm`) is primary → set base `text-sm`.
        Form `<label>`s in the pengajuan form → `text-sm`.
      CHANGE 2 (D3): SatkerView's section descriptor `<p>`s (e.g. "Pantau status verifikasi dokumen
        RAB…") are instructional, not restatements — KEEP, resize only.
      Because this file is the longest, the implementer MUST re-grep after editing to confirm zero
      `text-[9px|10px|11px]` remain (see the completeness check below).
      Files: `src/components/SatkerView.tsx`
      Verify: `npm run lint` — exits 0, no errors; then `npm run build` — completes with no errors.

---

## Completeness check (run once after item 16, from `d:\Coding\AITF\airen`)

Confirm NO sub-12px arbitrary sizes remain anywhere in the frontend source:

```
rg -n "text-\[(9|10|11)px\]" frontend/src
```

Expected: zero matches. (Baseline before edits: 169 matches across 14 files —
App.tsx 0, ChangePasswordModal 0, ErrorBoundary 1, LoginView 11, MasterRoView 8, Navbar 3,
PdfPreviewModal 21, RegulationCardList 2, SatkerView 39, Sidebar 12, SubmissionFilterPanel 5,
SubmissionTable 11, SuperAdminView 30, UserAccountsTable 4, VerificationCriteriaTable 3,
VerifikatorView 19.)

Also confirm `sublabel` is fully gone:

```
rg -n "sublabel" frontend/src
```

Expected: zero matches.

Then the final verification: `npm run lint` (0 errors) and `npm run build` (success).

# Airen — Antarmuka Ulasan TOR dan RAB

Airen adalah **antarmuka (wireframe) frontend** untuk sistem "Ulasan TOR dan RAB". Airen
menampilkan dan mengolah data ulasan untuk dokumen TOR (Terms of Reference) dan RAB (Rencana
Anggaran Biaya) yang diperiksa terhadap checklist (Screening 1 dan Screening 2), dokumen
acuan, serta Master RO.

Proses ulasan AI berjalan di sistem utama (`tor-rab-ai-reviewer`), **bukan** di dalam Airen.
Airen mengonsumsi keluaran sistem tersebut sebagai data. Saat ini Airen berstatus
**prototipe frontend-only** yang sedang dikembangkan: tidak ada backend, dan semua data demo
disimpan di peramban.

## Fitur saat ini

- **Pengajuan TOR + RAB (peran Satker):** Satker mengunggah dua dokumen PDF per pengajuan —
  Dokumen TOR dan Dokumen RAB — dengan validasi berkas PDF. Keduanya dapat dipratinjau dan
  tersimpan secara lokal.
- **Manajemen dokumen acuan (peran Verifikator / Rocan):** Verifikator dapat menambah,
  melihat, mengaktifkan/menonaktifkan, dan menghapus dokumen acuan, sesuai matriks hak akses.
- **Model dua penapisan (Screening 1 & 2):**
  - **Screening 1** — kualitas substansi TOR/RAB: 6 kriteria (II.A.1, II.C.1, II.C.2, IV.A.1,
    IV.B.1, IV.C.1), verdict per kriteria `PASS` / `NOT_PASS` / `INSUFFICIENT_EVIDENCE`, disertai
    dokumen rujukan wajib (TOR/RAB/REFERENCE) dan status teknis terpisah.
  - **Screening 2** — kategorisasi prioritas RO: 12 pertanyaan (C01–C12) → **Kategori 1–4**, atau
    **Kategori 0** bila bukti kurang/gagal teknis (perlu reviu manual). MATCH pertama menang;
    Kategori 4 adalah fallback.
  - Verdict AI adalah **kandidat**; **ROCAN (Verifikator)** memegang keputusan akhir per baris.
- **Tampilan ulasan terpadu (document-centric):** dokumen TOR dan RAB ditampilkan berpasangan
  (dengan pratinjau) di tabel dan detail. Layar ulasan menyatukan: pasangan dokumen → konteks
  program (nilai kosong tampil sebagai "—") → hasil Screening 1 → kategori Screening 2 →
  formulir keputusan ROCAN. Dokumen acuan aktif ikut ditampilkan sebagai rujukan ulasan.
- **Manajemen data master:** Master RO, master kriteria (Screening 1 & 2), dan akun pengguna
  (Super Admin).
- **Analisis demo (sementara):** pemeriksaan di sisi peramban menghasilkan verdict model dua
  penapisan di atas sebagai **pratinjau/prototipe** ("Mode Demo"). Ini **bukan** hasil ulasan AI
  sungguhan — ulasan sebenarnya berjalan di sistem utama.
- **Lapisan impor JSON:** tipe, validasi, dan adapter untuk memetakan artefak JSON dari
  sistem utama ke model frontend (lihat bagian di bawah).

## Alur data

Data dari sistem utama → parse → validasi → pemetaan → tampilan.

- **Fase sekarang:** impor berkas **JSON** melalui UI "Unggah JSON" (tempel teks / pilih
  berkas `.json` / muat contoh). Lapisan impor (`frontend/src/utils/import/`) mem-parse,
  memvalidasi (memperlakukan input sebagai data tak tepercaya), dan memetakan artefak JSON ke
  model frontend di `frontend/src/types.ts`; kesalahan ditampilkan per tahap (Parse / Validasi /
  Deteksi Jenis) tanpa membuat view crash. Blok "Hasil Ulasan (Pratinjau)" bersifat rancangan —
  kontrak hasil ulasan dari sistem utama masih draf.
- **Fase berikutnya:** integrasi **API** langsung. Daftar endpoint belum final, sehingga
  jalur API belum diaktifkan. Batas parse → validasi → pemetaan sengaja dibuat bersih agar
  klien API bisa memakai adapter yang sama.

Artefak JSON yang didukung (bentuk mengacu pada sistem utama): permintaan ulasan TOR/RAB,
versi checklist (`screening_1_items` / `screening_2_items`), dan Master RO. Belum ada
antarmuka hasil ulasan AI — kontrak integrasi masih berstatus draf dan belum diimplementasikan
di sistem utama.

## Teknologi

- Frontend: React 19 + TypeScript, dibangun dengan Vite 8.
- Tailwind CSS 4 dan `lucide-react` untuk ikon.
- Persistensi lokal: `localStorage` (`frontend/src/utils/appStorage.ts`) dan IndexedDB untuk
  blob PDF (`frontend/src/utils/pdfStorage.ts`).
- Express (`frontend/server.js`) menyajikan situs statis hasil build pada mode produksi.

Tidak ada backend. Airen adalah proyek frontend-only.

## Menjalankan secara lokal

Source frontend berada di `frontend/`. Perintah npm dijalankan dari root repository.

1. Pasang dependency: `npm ci`
2. Jalankan dev server: `npm run dev` (port 3000)
3. Build produksi: `npm run build` (output ke `frontend/dist`)
4. Menyajikan hasil build: `npm run start`
5. Type-check: `npm run lint`

## Deploy ke GitHub Pages

Situs dideploy sebagai situs statis ke GitHub Pages melalui GitHub Actions
(`.github/workflows/deploy-pages.yml`).

1. Di repo GitHub: **Settings → Pages → Build and deployment → Source** pilih
   **GitHub Actions** (sekali saja).
2. Push ke branch `main`. Workflow akan `npm ci`, `npm run build`, menambahkan fallback
   `404.html` + `.nojekyll`, lalu memublikasikan `frontend/dist`.
3. Setelah run di tab **Actions** berhasil, situs tersedia di URL Pages, mis.
   `https://<user>.github.io/AITF_Web/`.

Catatan base path: karena ini situs proyek (bukan `<user>.github.io`), Vite memakai
`base: '/AITF_Web/'` (lihat `frontend/vite.config.ts`). Bila nama repo berubah, atur env
`VITE_BASE` ke `'/<nama-repo-baru>/'` saat build. Rujukan aset publik memakai
`import.meta.env.BASE_URL`, jangan URL absolut berawalan `/`.

Konfigurasi Vercel (`vercel.json`) masih ada sebagai alternatif host statis; tidak wajib
untuk Pages.

## Keamanan dan secret

- Perlakukan setiap berkas JSON yang diimpor sebagai **data tak tepercaya**: validasi sebelum
  dipetakan, tolak field tingkat-atas yang tidak dikenal, dan jangan sampai view crash karena
  JSON yang buruk.
- Jangan commit berkas `.env`, API key, atau dokumen TOR/RAB/checklist/acuan asli. Pakai data
  sintetis untuk contoh/fixture.
- Variabel `VITE_*` dikirim ke peramban — jangan menaruh secret di sana. `VITE_API_URL`
  (opsional, untuk origin API di masa depan) bukan secret.

## Catatan

Airen adalah fork dari repo lama yang dahulu memiliki backend FastAPI + Gemini; backend itu
sudah dihapus karena ulasan AI kini menjadi tanggung jawab sistem utama. Beberapa konteks
pengembangan lokal (mis. folder `Context/`, `.kiro/`, artefak workflow) sengaja di-ignore dan
tidak masuk repo.

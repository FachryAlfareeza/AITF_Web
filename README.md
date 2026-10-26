# Airen — Antarmuka Ulasan TOR dan RAB

Airen adalah **antarmuka (wireframe) frontend** untuk sistem "Ulasan TOR dan RAB". Airen
menampilkan dan mengolah data ulasan untuk dokumen TOR (Terms of Reference) dan RAB (Rencana
Anggaran Biaya) yang diperiksa terhadap checklist (Screening 1 dan Screening 2), dokumen
acuan, serta Master RO.

Proses ulasan AI berjalan di sistem utama (`tor-rab-ai-reviewer`), **bukan** di dalam Airen.
Airen mengonsumsi keluaran sistem tersebut sebagai data. Saat ini Airen masih berstatus
prototipe yang sedang dikembangkan.

## Alur data

Data dari sistem utama → validasi → pemetaan → tampilan.

- **Fase sekarang:** impor berkas **JSON**. Airen mem-parse, memvalidasi, dan memetakan
  artefak JSON ke model frontend.
- **Fase berikutnya:** integrasi **API** langsung. Daftar endpoint belum final, jadi jalur
  API belum diaktifkan.

Belum ada antarmuka hasil ulasan AI secara langsung; kontrak integrasi masih berstatus draf.

## Teknologi

- Frontend: React 19 + TypeScript, dibangun dengan Vite 8.
- Tailwind CSS 4 dan `lucide-react` untuk ikon.
- Express (`frontend/server.js`) menyajikan situs statis hasil build pada mode produksi.
- Persistensi memakai `localStorage` peramban (`frontend/src/utils/appStorage.ts`).

## Menjalankan secara lokal

Source frontend berada di `frontend/`. Perintah npm dijalankan dari root repository.

1. Pasang dependency: `npm ci`
2. Jalankan dev server: `npm run dev` (port 3000)
3. Build produksi: `npm run build` (output ke `frontend/dist`)
4. Menyajikan hasil build: `npm run start`
5. Type-check: `npm run lint`

Untuk mengarahkan frontend ke origin API (bila nanti tersedia), set `VITE_API_URL` sebelum
menjalankan atau membangun frontend. `VITE_API_URL` bukan secret.

## Deploy frontend ke Vercel

Konfigurasi Vercel di `vercel.json` membangun frontend Vite sebagai situs statis dan
mengarahkan rute aplikasi ke `index.html`.

1. Push perubahan frontend dan `vercel.json` ke branch GitHub yang akan dideploy.
2. Buka [vercel.com/new](https://vercel.com/new), masuk/daftar, lalu import repository ini.
3. Biarkan Root Directory di root repository. Vercel memakai framework Vite, perintah
   `npm run build`, dan output directory `frontend/dist` dari `vercel.json`.
4. Klik **Deploy**. Vercel memberikan URL publik untuk frontend.

Deploy ini hanya meng-host frontend statis. Bila API sistem utama nanti sudah di-host,
tambahkan `VITE_API_URL` pada Vercel Project Settings → Environment Variables dengan origin
API, lalu redeploy.

## Catatan backend (legacy)

Folder `backend/` berisi layanan FastAPI lama (PostgreSQL + pemeriksa berbasis Gemini di
`backend/services/gemini_checker.py`). Layanan ini **bukan** bagian dari fokus integrasi saat
ini — ulasan AI kini berada di sistem utama. Jika dipakai, `GEMINI_API_KEY` dan kredensial
database hanya boleh disimpan sebagai environment backend.

## Keamanan dan secret

- Perlakukan setiap berkas JSON yang diimpor sebagai **data tak tepercaya**: validasi sebelum
  dipetakan, tolak field tingkat-atas yang tidak dikenal, dan jangan sampai view crash karena
  JSON yang buruk.
- Jangan commit berkas `.env`, API key, atau dokumen TOR/RAB/checklist/acuan asli.
- Variabel `VITE_*` dikirim ke peramban — jangan menaruh secret di sana.

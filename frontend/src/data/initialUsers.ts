import { UserAccount, SubmissionData, ScreeningCriterion, ScreeningQuestion } from "../types";
import { buildScreening1Results, buildScreening2Results, computeRoCategory, summarizeS1 } from "./defaultCriteria";

/**
 * Seed data pengguna dengan ID tepat 8 karakter:
 * - Super Admin (ID 8 karakter: "19850115")
 * - SatKer (ID 8 karakter: "19890422")
 * - Verifikator (ID 8 karakter: "19910718")
 */
export const INITIAL_USERS: UserAccount[] = [
  {
    id: "19850115", // 8 characters
    name: "Budi Santoso, S.Kom., M.T.",
    unit: "Biro Perencanaan & Keuangan",
    roles: ["superadmin"],
    activeRole: "superadmin",
    password: "password123",
    isActive: true,
    createdAt: "2026-01-10",
    phone: "0812-8888-0001",
  },
  {
    id: "19890422", // 8 characters
    name: "Rina Kusuma, S.E., M.Si.",
    unit: "Direktorat Pengelolaan Media Publik",
    roles: ["satker"],
    activeRole: "satker",
    password: "password123",
    isActive: true,
    createdAt: "2026-01-15",
    phone: "0813-7777-0002",
  },
  {
    id: "19910718", // 8 characters
    name: "Ahmad Fauzi, S.E., Ak., CA",
    unit: "Inspektorat / Verifikasi Anggaran",
    roles: ["verifikator"],
    activeRole: "verifikator",
    password: "password123",
    isActive: true,
    createdAt: "2026-01-18",
    phone: "0814-6666-0003",
  },
];

/** Bangun hasil Screening 1 "semua PASS" untuk seed yang disetujui penuh. */
function allPassS1(): ScreeningCriterion[] {
  return buildScreening1Results({ verdict: {} });
}

/** Hasil Screening 2 dengan satu MATCH pada kode tertentu (sisanya NO_MATCH). */
function matchS2(code: string): ScreeningQuestion[] {
  return buildScreening2Results({ [code]: { status: "MATCH", notes: "Terpilih sebagai kategori prioritas RO." } });
}

// --- Seed 1: Kategori 1 (C01 MATCH), semua S1 PASS, Diterima ---
const s1_001 = allPassS1();
const s2_001 = matchS2("C01");
// --- Seed 2: Kategori 2 (C04 MATCH), S1 PASS, Diterima ---
const s1_002 = allPassS1();
const s2_002 = matchS2("C04");
// --- Seed 3: Kategori 1 (C02 MATCH), satu INSUFFICIENT di S1, Menunggu ---
const s1_003 = buildScreening1Results({
  verdict: { "II.C.2": { status: "INSUFFICIENT_EVIDENCE", notes: "Manajemen risiko belum terdeteksi eksplisit pada TOR." } },
});
const s2_003 = matchS2("C02");
// --- Seed 4: Kategori 0 (perlu reviu manual) — tanpa MATCH + ada INSUFFICIENT, Ditolak ---
const s1_004 = buildScreening1Results({
  verdict: {
    "IV.C.1": { status: "NOT_PASS", notes: "Harga satuan narasumber melebihi batas SBM. Rekomendasi: sesuaikan ke tarif maksimal." },
    "IV.B.1": { status: "INSUFFICIENT_EVIDENCE", notes: "Kesesuaian kode akun BAS belum dapat dipastikan." },
  },
});
const s2_004 = buildScreening2Results({
  C01: { status: "INSUFFICIENT_EVIDENCE", notes: "Keselarasan prioritas belum dapat dipastikan dari dokumen." },
});
// --- Seed 5: Kategori 3 (C11 MATCH), semua S1 PASS, Diterima ---
const s1_005 = allPassS1();
const s2_005 = matchS2("C11");

export const INITIAL_SUBMISSIONS: SubmissionData[] = [
  {
    id: "SUB-2026-001",
    ticketNumber: "RAB/KOMDIGI/2026/042",
    satkerUserId: "19890422",
    satkerUserName: "Biro Perencanaan dan Kerja Sama",
    satkerUnit: "Sekretariat Jenderal Kementerian Komdigi",
    submittedAt: "24/09/2026 08:30 WIB",
    program: "INTERKONEKSI APLIKASI GAJI PADA DIREKTORAT JENDERAL PERBENDAHARAAN KEMENTERIAN KEUANGAN DENGAN APLIKASI KEPEGAWAIAN PADA KEMENTERIAN KOMUNIKASI DAN DIGITAL",
    kegiatan: "2133 Layanan Integrasi Sistem Tata Kelola Keuangan dan Gaji ASN",
    kro: "2133.EBA Layanan Dukungan Manajemen Internal",
    ro: "2133.EBA.994 Layanan Perkantoran dan Kepegawaian",
    tahunAnggaran: "2026",
    unitEselon1: "Sekretariat Jenderal",
    unitEselon2: "Biro Kepegawaian & Biro Perencanaan",
    prioritas: "Prioritas Nasional",
    rabFileName: "RAB_Interkoneksi_Aplikasi_Gaji_2026.pdf",
    rabFileSize: "2.8 MB",
    activeRegulationTitle: "Peraturan Menteri Keuangan No. 49/PMK.02/2023 tentang Standar Biaya Masukan",
    kategori: "Kategori 1",
    deskripsi: "Belanja Modal TIK & Infrastruktur",
    kategori1: "Kategori 1",
    kategori2: "Integrasi Sistem Layanan ASN",
    kategori3: "Prioritas Nasional 2026",
    createdBy: "Biro Perencanaan dan Kerja Sama (19890422)",
    updatedBy: "Biro Perencanaan dan Kerja Sama (19890422)",
    auditTrail: [
      {
        action: "CREATE",
        performedBy: "Biro Perencanaan dan Kerja Sama (19890422)",
        timestamp: "24/09/2026 08:30 WIB",
        details: "Pengunggahan perdana berkas RAB_Interkoneksi_Aplikasi_Gaji_2026.pdf",
      },
      { action: "UPDATE", performedBy: "Ahmad Fauzi, S.E., Ak., CA (19910718)", timestamp: "24/09/2026 09:15 WIB", details: "Penetapan status verifikasi Disetujui / Diterima" },
    ],
    referenceDocuments: [
      "Peraturan Menteri Keuangan No. 49/PMK.02/2023 tentang Standar Biaya Masukan",
      "Petunjuk Teknis Penyusunan RKA-K/L Kementerian Komunikasi dan Digital RI",
      "Bagan Akun Standar (BAS) Perbendaharaan Kemenkeu RI",
    ],
    screening1Results: s1_001.map((c) => ({ ...c, verifierStatus: "PASS", verifierNotes: "Sesuai regulasi SBM dan pagu operasional." })),
    s1Summary: summarizeS1(s1_001),
    aiReason: "[Mode Demo] Seluruh kriteria substansi Screening 1 terpenuhi (PASS). RO selaras Prioritas Nasional (Kategori 1).",
    aiRecommendation: "Dokumen memenuhi kriteria substansi dan siap diverifikasi ROCAN. (Keluaran demo.)",
    screening2Results: s2_001,
    roCategory: computeRoCategory(s2_001),
    verificationStatus: "Diterima",
    verifikatorNotes: "Dokumen telah disinkronkan dengan SPAN & SIMPONI Kementerian Keuangan.",
    verifiedBy: "Ahmad Fauzi, S.E., Ak., CA",
    verifiedByNip: "19910718",
    verifiedAt: "24/09/2026 09:15 WIB",
    reviewHistory: [
      { verifiedAt: "24/09/2026 08:55 WIB", verificationStatus: "Ditolak" },
      { verifiedAt: "24/09/2026 09:15 WIB", verificationStatus: "Diterima" },
    ],
  },
  {
    id: "SUB-2026-002",
    ticketNumber: "RAB/KOMDIGI/2026/048",
    satkerUserId: "19871212",
    satkerUserName: "Direktorat Tata Kelola Komunikasi Publik",
    satkerUnit: "Direktorat Jenderal Komunikasi Publik dan Media",
    submittedAt: "24/09/2026 09:45 WIB",
    program: "SINERGITAS BIDANG TRANSMIGRASI DENGAN BIDANG KOMUNIKASI DAN INFORMASI",
    kegiatan: "4775 Sosialisasi Diseminasi Informasi Wilayah Kawasan Transmigrasi",
    kro: "4775.PJA Infrastruktur & Diseminasi TIK",
    ro: "4775.PJA.001 Layanan Informasi Publik Terpadu",
    tahunAnggaran: "2026",
    unitEselon1: "Direktorat Jenderal Komunikasi Publik dan Media",
    unitEselon2: "Direktorat Pengelolaan Media",
    prioritas: "Prioritas Nasional",
    rabFileName: "RAB_Sinergitas_Bidang_Transmigrasi_2026.pdf",
    rabFileSize: "2.1 MB",
    activeRegulationTitle: "Peraturan Menteri Keuangan No. 49/PMK.02/2023 tentang Standar Biaya Masukan",
    kategori: "Kategori 2",
    deskripsi: "Diseminasi Komunikasi Publik Kawasan 3T",
    kategori1: "Kategori 2",
    kategori2: "Kawasan Transmigrasi 3T",
    kategori3: "Publikasi Media Cetak & Digital",
    createdBy: "Direktorat Tata Kelola Komunikasi Publik (19871212)",
    updatedBy: "Direktorat Tata Kelola Komunikasi Publik (19871212)",
    auditTrail: [
      {
        action: "CREATE",
        performedBy: "Direktorat Tata Kelola Komunikasi Publik (19871212)",
        timestamp: "24/09/2026 09:45 WIB",
        details: "Pendaftaran berkas RAB_Sinergitas_Bidang_Transmigrasi_2026.pdf",
      },
    ],
    referenceDocuments: ["Peraturan Menteri Keuangan No. 49/PMK.02/2023 tentang Standar Biaya Masukan", "Pedoman Pengadaan Jasa Media Informasi Publik Komdigi"],
    screening1Results: s1_002.map((c) => ({ ...c, verifierStatus: "PASS", verifierNotes: "Disetujui sesuai batas pagu." })),
    s1Summary: summarizeS1(s1_002),
    aiReason: "[Mode Demo] Kriteria substansi Screening 1 terpenuhi. RO masuk kelompok operasional (Kategori 2).",
    aiRecommendation: "Dapat diproses verifikasi administratif lanjutan. (Keluaran demo.)",
    screening2Results: s2_002,
    roCategory: computeRoCategory(s2_002),
    verificationStatus: "Diterima",
    verifikatorNotes: "Koordinasi antar kementerian telah memiliki dasar MoA yang sah.",
    verifiedBy: "Ahmad Fauzi, S.E., Ak., CA",
    verifiedByNip: "19910718",
    verifiedAt: "24/09/2026 10:20 WIB",
    reviewHistory: [
      { verifiedAt: "24/09/2026 10:05 WIB", verificationStatus: "Ditolak" },
      { verifiedAt: "24/09/2026 10:20 WIB", verificationStatus: "Diterima" },
    ],
  },
  {
    id: "SUB-2026-003",
    ticketNumber: "RAB/KOMDIGI/2026/051",
    satkerUserId: "19890422",
    satkerUserName: "Pusat Pengembangan Profesi Komunikasi",
    satkerUnit: "Badan Pengembangan SDM & Litbang Digital",
    submittedAt: "24/09/2026 10:15 WIB",
    program: "SINERGITAS DAN PENGEMBANGAN PENYELENGGARAAN PROGRAM-PROGRAM BIDANG KOMUNIKASI DAN INFORMASI",
    kegiatan: "2134 Pelatihan Vokasi dan Sertifikasi Kompetensi Talenta Digital",
    kro: "2134.QMA Pelatihan & Sertifikasi Digital",
    ro: "2134.QMA.002 Digital Talent Scholarship",
    tahunAnggaran: "2026",
    unitEselon1: "Badan Pengembangan SDM & Infrastruktur Digital",
    unitEselon2: "Pusat Pengembangan Literasi & Vokasi",
    prioritas: "Prioritas Nasional",
    rabFileName: "RAB_Pengembangan_Program_Komunikasi_2026.pdf",
    rabFileSize: "3.4 MB",
    activeRegulationTitle: "Peraturan Menteri Keuangan No. 49/PMK.02/2023 & Juknis RAB Komdigi",
    kategori: "Kategori 1",
    deskripsi: "Pelatihan & Sertifikasi Digital Talent",
    kategori1: "Kategori 1",
    screening1Results: s1_003,
    s1Summary: summarizeS1(s1_003),
    aiReason: "[Mode Demo] Mayoritas kriteria PASS; manajemen risiko (II.C.2) butuh konfirmasi. RO selaras Prioritas Nasional (Kategori 1).",
    aiRecommendation: "Usulan siap diverifikasi baris per baris; konfirmasi bukti manajemen risiko. (Keluaran demo.)",
    screening2Results: s2_003,
    roCategory: computeRoCategory(s2_003),
    verificationStatus: "Menunggu",
    verifikatorNotes: "",
    reviewHistory: [
      { verifiedAt: "24/09/2026 10:35 WIB", verificationStatus: "Ditolak" },
      { verifiedAt: "24/09/2026 10:55 WIB", verificationStatus: "Ditolak" },
      { verifiedAt: "24/09/2026 11:05 WIB", verificationStatus: "Menunggu" },
    ],
  },
  {
    id: "SUB-2026-004",
    ticketNumber: "RAB/KOMDIGI/2026/055",
    satkerUserId: "19890422",
    satkerUserName: "Balai Pelatihan dan Riset TIK",
    satkerUnit: "Pusat Pendidikan & Pelatihan Komunikasi",
    submittedAt: "24/09/2026 10:45 WIB",
    program: "SINERGITAS PENYELENGGARAAN PROGRAM PENDIDIKAN, PENELITIAN DAN PENGABDIAN KEPADA MASYARAKAT DI BIDANG KOMUNIKASI DAN INFORMASI",
    kegiatan: "4776 Kolaborasi Riset Kecerdasan Artifisial dan Keamanan Siber Kampus Merdeka",
    kro: "4776.KDA Riset dan Pengabdian Teknologi",
    ro: "4776.KDA.005 Kerja Sama Perguruan Tinggi Negeri",
    tahunAnggaran: "2026",
    unitEselon1: "Badan Pengembangan SDM & Infrastruktur Digital",
    unitEselon2: "Balai Riset & Pelatihan",
    prioritas: "Bukan Prioritas Nasional",
    rabFileName: "RAB_Pendidikan_Penelitian_Pengabdian_2026_revisi.pdf",
    rabFileSize: "1.7 MB",
    activeRegulationTitle: "Peraturan Menteri Keuangan No. 49/PMK.02/2023 tentang Standar Biaya Masukan",
    kategori: "Perlu Reviu Manual",
    deskripsi: "Kerja Sama Perguruan Tinggi Negeri Kampus Merdeka",
    kategori1: "Perlu Reviu Manual",
    screening1Results: s1_004.map((c) =>
      c.code === "IV.C.1"
        ? { ...c, verifierStatus: "NOT_PASS", verifierNotes: "Melebihi batas SBM PMK 49." }
        : { ...c, verifierStatus: c.status === "PASS" ? "PASS" : "INSUFFICIENT_EVIDENCE" },
    ),
    s1Summary: summarizeS1(s1_004),
    aiReason: "[Mode Demo] Ditemukan NOT_PASS pada harga satuan (IV.C.1) dan bukti tidak cukup pada kode akun (IV.B.1). Tanpa MATCH Screening 2 → Perlu Reviu Manual (Kategori 0).",
    aiRecommendation: "Satker wajib menyesuaikan tarif honor narasumber dan melengkapi kesesuaian kode akun BAS. (Keluaran demo.)",
    screening2Results: s2_004,
    roCategory: computeRoCategory(s2_004),
    verificationStatus: "Ditolak",
    verifikatorNotes:
      "Ditolak: Tarif honorarium narasumber melebihi batas SBM PMK No. 49/PMK.02/2023. Kategori prioritas RO perlu ditinjau manual. Harap perbaiki dan unggah kembali berkas revisi.",
    verifiedBy: "Ahmad Fauzi, S.E., Ak., CA",
    verifiedByNip: "19910718",
    verifiedAt: "24/09/2026 11:15 WIB",
    reviewHistory: [
      { verifiedAt: "24/09/2026 11:00 WIB", verificationStatus: "Diterima" },
      { verifiedAt: "24/09/2026 11:15 WIB", verificationStatus: "Ditolak" },
    ],
  },
  {
    id: "SUB-2026-005",
    ticketNumber: "RAB/KOMDIGI/2026/063",
    satkerUserId: "19890422",
    satkerUserName: "Direktorat Pengendalian Aplikasi Informatika",
    satkerUnit: "Direktorat Jenderal Aplikasi Informatika",
    submittedAt: "24/09/2026 11:00 WIB",
    program: "SINERGITAS TUGAS DAN FUNGSI DI BIDANG KOMUNIKASI DAN INFORMASI DENGAN KEPOLISIAN",
    kegiatan: "3102 Patroli Siber Terpadu dan Penanganan Konten Ilegal",
    kro: "3102.ICM Penegakan Hukum Siber & Patroli Digital",
    ro: "3102.ICM.001 Penanganan Insiden Kejahatan Siber Bersama POLRI",
    tahunAnggaran: "2026",
    unitEselon1: "Direktorat Jenderal Aplikasi Informatika",
    unitEselon2: "Direktorat Pengendalian Siber",
    prioritas: "Prioritas Nasional",
    rabFileName: "RAB_Sinergitas_Fungsi_Siber_Kepolisian_2026.pdf",
    rabFileSize: "3.1 MB",
    activeRegulationTitle: "Peraturan Menteri Keuangan No. 49/PMK.02/2023 tentang Standar Biaya Masukan",
    kategori: "Kategori 3",
    deskripsi: "Patroli Siber Terpadu Bersama POLRI",
    kategori1: "Kategori 3",
    screening1Results: s1_005.map((c) => ({ ...c, verifierStatus: "PASS", verifierNotes: "Sesuai nota kesepahaman dan regulasi anggaran." })),
    s1Summary: summarizeS1(s1_005),
    aiReason: "[Mode Demo] Seluruh kriteria substansi terpenuhi. RO masuk program prioritas kementerian (Kategori 3).",
    aiRecommendation: "Usulan disetujui penuh untuk implementasi sinergitas lintas instansi. (Keluaran demo.)",
    screening2Results: s2_005,
    roCategory: computeRoCategory(s2_005),
    verificationStatus: "Diterima",
    verifikatorNotes: "Disetujui. Sesuai perjanjian kerja sama operasional POLRI - Komdigi.",
    verifiedBy: "Ahmad Fauzi, S.E., Ak., CA",
    verifiedByNip: "19910718",
    verifiedAt: "24/09/2026 11:30 WIB",
    reviewHistory: [
      { verifiedAt: "24/09/2026 11:15 WIB", verificationStatus: "Ditolak" },
      { verifiedAt: "24/09/2026 11:30 WIB", verificationStatus: "Diterima" },
    ],
  },
];

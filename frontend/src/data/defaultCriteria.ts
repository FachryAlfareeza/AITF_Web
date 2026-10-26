import {
  EvidenceRole,
  RegulationDocument,
  MasterCriterion,
  RoCategory,
  ScreeningCriterion,
  ScreeningQuestion,
  ScreeningSummary,
} from "../types";

/**
 * MODEL DUA PENAPISAN (Two-Screening) sesuai AITF-Pipeline-LLM.md.
 *
 * SCREENING 1 — kualitas substansi TOR/RAB: 6 kriteria, verdict per kriteria
 * PASS | NOT_PASS | INSUFFICIENT_EVIDENCE.
 */
export interface Screening1Definition {
  id: number;
  code: string;
  text: string;
  requiredRoles: EvidenceRole[];
}

export const DEFAULT_SCREENING1_CRITERIA: Screening1Definition[] = [
  { id: 1, code: "II.A.1", text: "Apakah RO selaras dengan Prioritas Nasional/PKPN/Renstra/direktif pimpinan?", requiredRoles: ["TOR", "REFERENCE"] },
  { id: 2, code: "II.C.1", text: "Apakah Rincian Output dijelaskan dengan prinsip 5W+1H secara lengkap?", requiredRoles: ["TOR"] },
  { id: 3, code: "II.C.2", text: "Apakah terdapat identifikasi manajemen risiko beserta rencana mitigasinya?", requiredRoles: ["TOR", "REFERENCE"] },
  { id: 4, code: "IV.A.1", text: "Apakah RAB menjabarkan seluruh kebutuhan yang tercantum dalam TOR?", requiredRoles: ["TOR", "RAB"] },
  { id: 5, code: "IV.B.1", text: "Apakah kode akun belanja telah sesuai dengan Bagan Akun Standar (BAS)?", requiredRoles: ["RAB", "REFERENCE"] },
  { id: 6, code: "IV.C.1", text: "Apakah harga satuan tidak melebihi Standar Biaya Masukan (SBM)?", requiredRoles: ["RAB", "REFERENCE"] },
];

/**
 * SCREENING 2 — kategorisasi prioritas RO: 12 pertanyaan C01..C12 dikelompokkan
 * ke dalam kategori. Dicek berurutan, MATCH pertama menang; fallback Kategori 4;
 * Kategori 0 = perlu reviu manual (insufficient-evidence tanpa MATCH / kegagalan teknis).
 *
 * Grouping: Kategori 1 = C01–C03; Kategori 2 = C04–C10; Kategori 3 = C11; Kategori 4 = C12 (fallback).
 */
export interface Screening2Definition {
  id: number;
  code: string;
  text: string;
  categoryGroup: 1 | 2 | 3 | 4;
}

export const DEFAULT_SCREENING2_QUESTIONS: Screening2Definition[] = [
  { id: 1, code: "C01", text: "Apakah RO mendukung Prioritas Nasional (PN)?", categoryGroup: 1 },
  { id: 2, code: "C02", text: "Apakah RO merupakan belanja operasional yang bersifat wajib?", categoryGroup: 1 },
  { id: 3, code: "C03", text: "Apakah RO merupakan layanan publik langsung kepada masyarakat?", categoryGroup: 1 },
  { id: 4, code: "C04", text: "Apakah RO merupakan biaya operasional dan pemeliharaan (O&M)?", categoryGroup: 2 },
  { id: 5, code: "C05", text: "Apakah RO dibiayai dari Penerimaan Negara Bukan Pajak (PNBP)?", categoryGroup: 2 },
  { id: 6, code: "C06", text: "Apakah RO merupakan kegiatan multiyears yang telah disetujui?", categoryGroup: 2 },
  { id: 7, code: "C07", text: "Apakah RO merupakan dukungan manajemen internal?", categoryGroup: 2 },
  { id: 8, code: "C08", text: "Apakah RO melaksanakan amanat Inpres/Perpres?", categoryGroup: 2 },
  { id: 9, code: "C09", text: "Apakah RO merupakan direktif/arahan langsung Menteri?", categoryGroup: 2 },
  { id: 10, code: "C10", text: "Apakah RO terkait kewajiban kontraktual/perjanjian yang mengikat?", categoryGroup: 2 },
  { id: 11, code: "C11", text: "Apakah RO termasuk program prioritas kementerian?", categoryGroup: 3 },
  { id: 12, code: "C12", text: "Apakah RO tidak terkait langsung dengan prioritas (fallback)?", categoryGroup: 4 },
];

/** Master checklist entries rebuilt from both screenings (with code/screening). */
export const INITIAL_MASTER_CRITERIA: MasterCriterion[] = [
  ...DEFAULT_SCREENING1_CRITERIA.map((c) => ({
    id: c.id,
    code: c.code,
    text: c.text,
    description: `Penapisan 1 (substansi) — dokumen yang wajib dirujuk: ${c.requiredRoles.join(", ")}.`,
    isActive: true,
    screening: 1 as const,
  })),
  ...DEFAULT_SCREENING2_QUESTIONS.map((q) => ({
    id: DEFAULT_SCREENING1_CRITERIA.length + q.id,
    code: q.code,
    text: q.text,
    description: `Penapisan 2 (kategorisasi prioritas RO) — kelompok Kategori ${q.categoryGroup}.`,
    isActive: true,
    screening: 2 as const,
  })),
];

export interface ScreeningAnalysisResult {
  screening1Results: ScreeningCriterion[];
  s1Summary: ScreeningSummary;
  screening2Results: ScreeningQuestion[];
  roCategory: RoCategory;
  aiReason: string;
  aiRecommendation: string;
  activeRegulationTitle?: string;
}

/**
 * Keputusan kategori RO — aturan baku dari AITF-Pipeline-LLM.md.
 * Iterasi kategori 1→4; MATCH pertama menang. Tanpa MATCH: bila ada
 * INSUFFICIENT_EVIDENCE atau kegagalan teknis → Kategori 0 (reviu manual),
 * selain itu → Kategori 4 (fallback).
 *
 * Invarian kritis: kegagalan teknis/bukti tidak cukup TIDAK PERNAH menurun
 * otomatis ke Kategori 4 — selalu ke Kategori 0.
 */
export function computeRoCategory(questions: ScreeningQuestion[]): RoCategory {
  let sawInsufficient = false;
  let sawTechnicalFailure = false;

  for (const cat of [1, 2, 3, 4] as const) {
    const group = questions.filter((q) => q.categoryGroup === cat);
    if (group.some((q) => q.technicalStatus !== "")) sawTechnicalFailure = true;
    if (group.some((q) => q.status === "MATCH")) return cat;
    if (group.some((q) => q.status === "INSUFFICIENT_EVIDENCE")) sawInsufficient = true;
  }

  if (sawTechnicalFailure || sawInsufficient) return 0;
  return 4;
}

/** Hitung ringkasan kandidat Screening 1 untuk badge/ringkasan. */
export function summarizeS1(results: ScreeningCriterion[]): ScreeningSummary {
  return {
    pass: results.filter((c) => c.status === "PASS").length,
    notPass: results.filter((c) => c.status === "NOT_PASS").length,
    insufficient: results.filter((c) => c.status === "INSUFFICIENT_EVIDENCE").length,
    technicalFailures: results.filter((c) => c.technicalStatus !== "").length,
    total: results.length,
  };
}

/** Deskripsi label Kategori RO untuk tampilan. */
export function roCategoryLabel(category: RoCategory): string {
  return category === 0 ? "Perlu Reviu Manual" : `Kategori ${category}`;
}

export interface Screening1SeedInput {
  verdict: Partial<Record<string, { status: ScreeningCriterion["status"]; technicalStatus?: ScreeningCriterion["technicalStatus"]; notes?: string }>>;
}

/** Bangun 6 hasil Screening 1 dari pemetaan verdict per-kode (default PASS). */
export function buildScreening1Results(seed: Screening1SeedInput): ScreeningCriterion[] {
  return DEFAULT_SCREENING1_CRITERIA.map((criterion) => {
    const override = seed.verdict[criterion.code];
    return {
      id: criterion.id,
      code: criterion.code,
      text: criterion.text,
      requiredRoles: [...criterion.requiredRoles],
      status: override?.status ?? "PASS",
      technicalStatus: override?.technicalStatus ?? "",
      notes: override?.notes ?? `Bukti pada dokumen (${criterion.requiredRoles.join(", ")}) memenuhi kriteria ${criterion.code}.`,
      verifierStatus: "UNREVIEWED",
      verifierNotes: "",
    };
  });
}

/** Bangun 12 pertanyaan Screening 2; `matches` memetakan kode → verdict khusus. */
export function buildScreening2Results(matches: Partial<Record<string, { status: ScreeningQuestion["status"]; technicalStatus?: ScreeningQuestion["technicalStatus"]; notes?: string }>>): ScreeningQuestion[] {
  return DEFAULT_SCREENING2_QUESTIONS.map((question) => {
    const override = matches[question.code];
    return {
      id: question.id,
      code: question.code,
      text: question.text,
      categoryGroup: question.categoryGroup,
      status: override?.status ?? "NO_MATCH",
      technicalStatus: override?.technicalStatus ?? "",
      notes: override?.notes ?? "",
      verifierStatus: "UNREVIEWED",
      verifierNotes: "",
    };
  });
}

/**
 * Engine demo (Mode Demo) — menghasilkan verdict Screening 1 + kategori Screening 2
 * berdasarkan heuristik nama berkas saja (tanpa membaca isi PDF). Dipakai sebagai
 * fallback dari inspectUploadedRabDocument dan untuk seed awal.
 */
export function runAiRabAnalysis(
  program: string,
  kegiatan: string,
  kro: string,
  ro: string,
  rabFileName: string,
  activeRegulations?: RegulationDocument[],
): ScreeningAnalysisResult {
  const activeRegs = activeRegulations && activeRegulations.length > 0 ? activeRegulations.filter((r) => r.isActive) : [];
  const regulationLabel = activeRegs.length > 0 ? activeRegs.map((r) => r.title).join(" & ") : "PMK No. 49/PMK.02/2023 tentang Standar Biaya Masukan";

  const name = rabFileName.toLowerCase();
  const isRejected = name.includes("revisi") || name.includes("draft") || name.includes("tolak");

  let screening1Results: ScreeningCriterion[];
  let screening2Results: ScreeningQuestion[];

  if (isRejected) {
    // Dokumen bermasalah: beberapa NOT_PASS dengan rekomendasi + Kategori 0 (manual).
    screening1Results = buildScreening1Results({
      verdict: {
        "II.C.2": {
          status: "NOT_PASS",
          notes: "Belum ditemukan bagian manajemen risiko dan rencana mitigasi pada TOR. Rekomendasi: tambahkan matriks risiko beserta langkah mitigasinya.",
        },
        "IV.B.1": {
          status: "INSUFFICIENT_EVIDENCE",
          notes: "Kode akun belanja belum dapat dipastikan kesesuaiannya dengan BAS karena rincian akun tidak lengkap.",
        },
        "IV.C.1": {
          status: "NOT_PASS",
          notes: `Harga satuan honorarium narasumber melebihi batas SBM (${regulationLabel}). Rekomendasi: sesuaikan tarif ke batas maksimal yang berlaku.`,
        },
      },
    });
    // Bukti tidak cukup tanpa MATCH → computeRoCategory menghasilkan Kategori 0 (manual).
    screening2Results = buildScreening2Results({
      C01: { status: "INSUFFICIENT_EVIDENCE", notes: "Keselarasan dengan Prioritas Nasional belum dapat dipastikan dari dokumen revisi." },
    });
  } else {
    // Dokumen plausibel baik: campuran verdict agar ketiga warna badge muncul.
    screening1Results = buildScreening1Results({
      verdict: {
        "II.C.2": {
          status: "INSUFFICIENT_EVIDENCE",
          notes: "Bagian manajemen risiko belum terdeteksi secara eksplisit pada TOR; mohon konfirmasi keberadaannya.",
        },
      },
    });
    // RO mendukung Prioritas Nasional → C01 MATCH → Kategori 1.
    screening2Results = buildScreening2Results({
      C01: { status: "MATCH", notes: "RO dinilai mendukung Prioritas Nasional berdasarkan konteks program/kegiatan." },
    });
  }

  const s1Summary = summarizeS1(screening1Results);
  const roCategory = computeRoCategory(screening2Results);

  const aiReason = isRejected
    ? `[Mode Demo] Penapisan dokumen "${rabFileName}" menemukan ${s1Summary.notPass} kriteria NOT_PASS dan ${s1Summary.insufficient} bukti tidak cukup pada Screening 1. Kategori prioritas RO tidak dapat ditetapkan otomatis sehingga diarahkan ke reviu manual (Kategori 0). Acuan: ${regulationLabel}.`
    : `[Mode Demo] Penapisan dokumen "${rabFileName}" menghasilkan ${s1Summary.pass} PASS, ${s1Summary.insufficient} bukti tidak cukup pada Screening 1. Kategori prioritas RO terkomputasi: ${roCategoryLabel(roCategory)}. Acuan: ${regulationLabel}.`;

  const aiRecommendation = isRejected
    ? "1. Lengkapi bagian manajemen risiko dan mitigasi pada TOR.\n2. Pastikan kode akun belanja sesuai BAS.\n3. Sesuaikan harga satuan agar tidak melampaui batas SBM.\n(Hasil ini merupakan keluaran demo, bukan ulasan AI final.)"
    : "Dokumen memenuhi sebagian besar kriteria substansi. Lengkapi bukti manajemen risiko bila diperlukan. (Hasil ini merupakan keluaran demo, bukan ulasan AI final.)";

  return {
    screening1Results,
    s1Summary,
    screening2Results,
    roCategory,
    aiReason,
    aiRecommendation,
    activeRegulationTitle: regulationLabel,
  };
}

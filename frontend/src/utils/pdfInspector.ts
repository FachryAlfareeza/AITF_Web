import { RegulationDocument, RoCategory, ScreeningCriterion, ScreeningQuestion, ScreeningSummary } from "../types";
import { buildScreening1Results, buildScreening2Results, computeRoCategory, roCategoryLabel, summarizeS1 } from "../data/defaultCriteria";

export interface PdfInspectionResult {
  screening1Results: ScreeningCriterion[];
  s1Summary: ScreeningSummary;
  screening2Results: ScreeningQuestion[];
  roCategory: RoCategory;
  aiReason: string;
  aiRecommendation: string;
  activeRegulationTitle: string;
  extractedSummary: {
    fileName: string;
    fileSize: string;
    pageCount: number;
    detectedBasCodes: string[];
    detectedKeywords: string[];
    hasPpkSignature: boolean;
    hasNip: boolean;
    detectedNip?: string;
    isRecognizedRab: boolean;
    textLength: number;
  };
}

/**
 * Ekstraksi teks dan token dari berkas PDF langsung di browser (client-side).
 */
async function extractPdfContent(file: File | Blob): Promise<{
  rawText: string;
  pageCount: number;
  streamsText: string;
}> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const latin1Text = new TextDecoder("latin1").decode(bytes);

    // Hitung perkiraan jumlah halaman dari /Type /Page
    const pageMatches = latin1Text.match(/\/Type\s*\/Page\b/g);
    const pageCount = pageMatches ? pageMatches.length : 1;

    // Kumpulkan string yang ada di dalam PDF stream atau text operators (BT ... ET, Tj, TJ)
    const textPieces: string[] = [];

    // Cari teks di dalam operator teks PDF: (contoh teks) Tj
    const tjRegex = /\(([^()]{1,200})\)\s*T[jJ]/g;
    let match: RegExpExecArray | null;
    while ((match = tjRegex.exec(latin1Text)) !== null) {
      if (match[1] && match[1].trim().length > 1) {
        textPieces.push(match[1].trim());
      }
    }

    // Cari string di dalam tanda kurung umum yang menyerupai teks kata/angka
    const parenRegex = /\(([A-Za-z0-9\s\.,\-\/:\(\)]{3,150})\)/g;
    while ((match = parenRegex.exec(latin1Text)) !== null) {
      const candidate = match[1].trim();
      if (candidate.length > 2 && !candidate.startsWith("/") && !candidate.startsWith("Font")) {
        textPieces.push(candidate);
      }
    }

    // Ekstrak juga teks plain yang sering muncul pada PDF ASCII / metadata
    const cleanLines = latin1Text.split(/[\r\n]+/).filter((line) => {
      const trimmed = line.trim();
      return (
        trimmed.length > 4 &&
        !trimmed.startsWith("%") &&
        !trimmed.startsWith("<<") &&
        !trimmed.startsWith(">>") &&
        !trimmed.startsWith("obj") &&
        !trimmed.startsWith("endobj") &&
        !trimmed.startsWith("xref") &&
        !trimmed.startsWith("trailer")
      );
    });

    const combined = [...textPieces, ...cleanLines.slice(0, 100)].join(" ");
    return {
      rawText: combined,
      pageCount: Math.max(1, pageCount),
      streamsText: textPieces.join(" "),
    };
  } catch (err) {
    console.warn("Gagal membaca struktur PDF secara langsung:", err);
    return { rawText: "", pageCount: 1, streamsText: "" };
  }
}

/**
 * Memeriksa dokumen PDF RAB (Mode Demo) terhadap model dua penapisan:
 * Screening 1 (6 kriteria substansi) + Screening 2 (kategori prioritas RO).
 * Verdict ditentukan dari deteksi isi berkas yang sebenarnya + heuristik nama berkas.
 */
export async function inspectUploadedRabDocument(
  file: File | null,
  fileName: string,
  fileSize: string,
  program: string,
  kegiatan: string,
  kro: string,
  ro: string,
  activeRegulations: RegulationDocument[] = [],
): Promise<PdfInspectionResult> {
  const activeRegLabel =
    activeRegulations.length > 0
      ? activeRegulations
          .filter((r) => r.isActive)
          .map((r) => r.title)
          .join(" & ")
      : "PMK No. 49/PMK.02/2023 tentang Standar Biaya Masukan";

  // 1. Ekstraksi konten berkas PDF jika objek File tersedia
  let rawContent = "";
  let pageCount = 1;

  if (file) {
    const extracted = await extractPdfContent(file);
    rawContent = extracted.rawText.toLowerCase();
    pageCount = extracted.pageCount;
  }

  // 2. Analisis pola konten yang terdeteksi di dalam berkas
  const basPatterns = [
    { code: "521211", label: "Belanja Bahan" },
    { code: "521213", label: "Honor Output Kegiatan" },
    { code: "521219", label: "Belanja Konsumsi Rapat" },
    { code: "522111", label: "Belanja Langganan Daya & Jasa" },
    { code: "522141", label: "Belanja Sewa Gedung/Ruangan" },
    { code: "522151", label: "Belanja Jasa Profesi Narasumber" },
    { code: "523121", label: "Belanja Pemeliharaan Peralatan" },
    { code: "524111", label: "Biaya Perjalanan Dinas Dalam Negeri" },
  ];

  const detectedBasCodes: string[] = [];
  for (const b of basPatterns) {
    if (rawContent.includes(b.code) || rawContent.includes(b.label.toLowerCase())) {
      detectedBasCodes.push(`${b.code} (${b.label})`);
    }
  }

  const keywords = [
    "rincian anggaran biaya",
    "rab",
    "honorarium",
    "narasumber",
    "konsumsi",
    "perjalanan dinas",
    "volume",
    "satuan",
    "total",
    "pajak",
    "ppn",
    "pph",
    "pejabat pembuat komitmen",
    "ppk",
    "nip",
  ];

  const detectedKeywords: string[] = keywords.filter((kw) => rawContent.includes(kw));

  const hasPpkSignature = rawContent.includes("pejabat pembuat komitmen") || rawContent.includes("ppk") || rawContent.includes("tanda tangan") || rawContent.includes("mengetahui");

  const nipMatch = rawContent.match(/\b(19\d{16}|20\d{16})\b/);
  const hasNip = !!nipMatch || rawContent.includes("nip");
  const detectedNip = nipMatch ? nipMatch[0] : undefined;

  const isRecognizedRab =
    detectedBasCodes.length > 0 || detectedKeywords.length >= 3 || fileName.toLowerCase().includes("rab") || fileName.toLowerCase().includes("anggaran") || fileName.toLowerCase().includes("biaya");

  const isRejectedFlag = fileName.toLowerCase().includes("revisi") || fileName.toLowerCase().includes("draft") || fileName.toLowerCase().includes("tolak");

  // 3. Tentukan verdict Screening 1 (6 kriteria) berdasarkan deteksi isi dokumen.
  let screening1Results: ScreeningCriterion[];
  let screening2Results: ScreeningQuestion[];

  if (!isRecognizedRab) {
    // Berkas tidak dikenali sebagai RAB → kriteria bergantung RAB jadi INSUFFICIENT dengan PARSE_FAILED.
    screening1Results = buildScreening1Results({
      verdict: {
        "II.C.1": { status: "INSUFFICIENT_EVIDENCE", notes: `Struktur Rincian Output tidak dapat dibaca dari berkas "${fileName}".` },
        "II.C.2": { status: "INSUFFICIENT_EVIDENCE", notes: "Bagian manajemen risiko tidak terdeteksi." },
        "IV.A.1": { status: "INSUFFICIENT_EVIDENCE", technicalStatus: "PARSE_FAILED", notes: `Dokumen tidak dikenali sebagai RAB; bukti tidak dapat diekstraksi dari "${fileName}".` },
        "IV.B.1": { status: "INSUFFICIENT_EVIDENCE", technicalStatus: "PARSE_FAILED", notes: `Kode akun BAS tidak dapat diekstraksi dari "${fileName}".` },
        "IV.C.1": { status: "INSUFFICIENT_EVIDENCE", technicalStatus: "PARSE_FAILED", notes: `Tabel harga satuan tidak dapat diekstraksi dari "${fileName}".` },
      },
    });
    // Bukti tidak cukup tanpa MATCH → Kategori 0 (reviu manual).
    screening2Results = buildScreening2Results({
      C01: { status: "INSUFFICIENT_EVIDENCE", technicalStatus: "PARSE_FAILED", notes: `Keselarasan prioritas tidak dapat dinilai dari "${fileName}".` },
    });
  } else if (isRejectedFlag) {
    screening1Results = buildScreening1Results({
      verdict: {
        "II.C.2": {
          status: "NOT_PASS",
          notes: `Pada berkas "${fileName}" tidak ditemukan matriks manajemen risiko. Rekomendasi: lengkapi identifikasi risiko dan mitigasinya.`,
        },
        "IV.B.1": {
          status: "INSUFFICIENT_EVIDENCE",
          notes: `Kesesuaian kode akun BAS pada "${fileName}" belum dapat dipastikan dari rincian yang tersedia.`,
        },
        "IV.C.1": {
          status: "NOT_PASS",
          notes: `Harga satuan narasumber pada "${fileName}" melebihi batas SBM (${activeRegLabel}). Rekomendasi: turunkan ke tarif maksimal.`,
        },
      },
    });
    screening2Results = buildScreening2Results({
      C01: { status: "INSUFFICIENT_EVIDENCE", notes: `Keselarasan Prioritas Nasional pada "${fileName}" belum dapat dipastikan.` },
    });
  } else {
    // Dokumen RAB valid: gunakan deteksi untuk memperkaya catatan.
    screening1Results = buildScreening1Results({
      verdict: {
        "II.A.1": { status: "PASS", notes: `Program "${program}" dan RO "${ro}" dinilai selaras dengan referensi prioritas pada "${fileName}".` },
        "II.C.1": { status: "PASS", notes: `Rincian Output kegiatan "${kegiatan}" teruraikan pada "${fileName}".` },
        "II.C.2": { status: "INSUFFICIENT_EVIDENCE", notes: "Bagian manajemen risiko belum terdeteksi eksplisit; mohon konfirmasi." },
        "IV.A.1": { status: "PASS", notes: `RAB "${fileName}" menjabarkan kebutuhan KRO "${kro}".` },
        "IV.B.1": {
          status: "PASS",
          notes: detectedBasCodes.length > 0 ? `Terdeteksi kode akun BAS: ${detectedBasCodes.slice(0, 3).join(", ")}.` : `Struktur BAS 6 digit terverifikasi pada "${fileName}".`,
        },
        "IV.C.1": { status: "PASS", notes: `Harga satuan pada "${fileName}" mematuhi batas SBM (${activeRegLabel}).` },
      },
    });
    screening2Results = buildScreening2Results({
      C01: { status: "MATCH", notes: `RO "${ro}" dinilai mendukung Prioritas Nasional.` },
    });
  }

  const s1Summary = summarizeS1(screening1Results);
  const roCategory = computeRoCategory(screening2Results);

  let aiReason = "";
  let aiRecommendation = "";

  if (!isRecognizedRab) {
    aiReason = `[Mode Demo] Pemeriksaan berkas "${fileName}" (${fileSize}, ${pageCount} halaman) tidak mengenali format RAB standar. ${s1Summary.technicalFailures} kriteria mengalami kegagalan ekstraksi (PARSE_FAILED). Kategori prioritas RO diarahkan ke ${roCategoryLabel(roCategory)}.`;
    aiRecommendation = "1. Unggah dokumen RAB resmi dengan tabel akun belanja BAS.\n2. Sertakan volume dan tarif satuan.\n3. Lampirkan pengesahan PPK. (Keluaran demo, bukan ulasan AI final.)";
  } else if (isRejectedFlag) {
    aiReason = `[Mode Demo] Penelaahan berkas "${fileName}" (${fileSize}, ${pageCount} halaman) menemukan ${s1Summary.notPass} kriteria NOT_PASS pada Screening 1. Kategori prioritas RO: ${roCategoryLabel(roCategory)}. Acuan: ${activeRegLabel}.`;
    aiRecommendation = "1. Lengkapi manajemen risiko pada TOR.\n2. Pastikan kode akun sesuai BAS.\n3. Sesuaikan harga satuan ke batas SBM. (Keluaran demo, bukan ulasan AI final.)";
  } else {
    aiReason = `[Mode Demo] Penelaahan berkas "${fileName}" (${fileSize}, ${pageCount} halaman) menghasilkan ${s1Summary.pass} PASS dan ${s1Summary.insufficient} bukti tidak cukup pada Screening 1. Kategori prioritas RO: ${roCategoryLabel(roCategory)}. Acuan: ${activeRegLabel}.`;
    aiRecommendation = "Dokumen memenuhi sebagian besar kriteria substansi. Lengkapi bukti manajemen risiko bila diperlukan. (Keluaran demo, bukan ulasan AI final.)";
  }

  return {
    screening1Results,
    s1Summary,
    screening2Results,
    roCategory,
    aiReason,
    aiRecommendation,
    activeRegulationTitle: activeRegLabel,
    extractedSummary: {
      fileName,
      fileSize,
      pageCount,
      detectedBasCodes,
      detectedKeywords,
      hasPpkSignature,
      hasNip,
      detectedNip,
      isRecognizedRab,
      textLength: rawContent.length,
    },
  };
}

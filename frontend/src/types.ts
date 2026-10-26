export type UserRole = "superadmin" | "satker" | "verifikator";

export type MenuAccessLevel = "view" | "edit" | "both";

export type AccessPermission = "E" | "V" | "NONE";

export type StandardMenuKey = "menu_users" | "menu_acuan" | "menu_checklist" | "menu_master_ro" | "menu_rab_list";

export type ActiveMenuKey =
  | StandardMenuKey
  | "admin_users"
  | "admin_regulations"
  | "admin_add_regulation"
  | "satker_list"
  | "satker_form"
  | "verifikator_checklist"
  | "menu_master_ro"
  | "master_ro_list"
  | "master_ro_add";

// Matriks Hak Akses Berdasarkan Tabel Peran (Excel: E = Edit, V = View, NONE = Tidak ada akses)
export const ROLE_PERMISSIONS_MATRIX: Record<StandardMenuKey, Record<UserRole, AccessPermission>> = {
  menu_users: { superadmin: "E", verifikator: "NONE", satker: "NONE" },
  menu_acuan: { superadmin: "E", verifikator: "E", satker: "V" },
  menu_checklist: { superadmin: "E", verifikator: "E", satker: "V" },
  menu_master_ro: { superadmin: "E", verifikator: "E", satker: "V" },
  menu_rab_list: { superadmin: "E", verifikator: "V", satker: "E" },
};

export interface UserAccount {
  id: string; // 8 character ID (e.g. 19850115 / ADM88001)
  name: string;
  unit: string;
  roles: UserRole[]; // Can have 1, 2, or 3 roles
  activeRole: UserRole;
  password: string;
  isActive: boolean;
  createdAt: string;
  phone?: string;
  menuAccess?: MenuAccessLevel; // "view" | "edit" | "both" (default: "both")
}

export interface HierarchyItem {
  id?: string;
  program: string;
  unitEselon1: string;
  kegiatan: string;
  unitEselon2: string;
  prioritasCheck: string;
  kro: string;
  ro: string;
}

// ---- Screening enums (from AITF-Pipeline-LLM.md) ----
export type ScreeningVerdict = "PASS" | "NOT_PASS" | "INSUFFICIENT_EVIDENCE";
export type TechnicalStatus = "" | "MODEL_ERROR" | "PARSE_FAILED" | "VERIFICATION_FAILED";
export type Screening2Verdict = "MATCH" | "NO_MATCH" | "INSUFFICIENT_EVIDENCE";
export type RoCategory = 0 | 1 | 2 | 3 | 4;
export type EvidenceRole = "TOR" | "RAB" | "REFERENCE";

/** Human (ROCAN) decision reusing the Screening-1 verdict space, plus an
 *  unreviewed sentinel so a row can carry "no human decision yet". */
export type VerifierVerdict = ScreeningVerdict | "UNREVIEWED";

/** Candidate roll-up used by table badges in place of the old numeric score. */
export interface ScreeningSummary {
  pass: number;
  notPass: number;
  insufficient: number;
  technicalFailures: number;
  total: number;
}

// ---- Screening 1: one substance criterion evaluated for a submission ----
export interface ScreeningCriterion {
  id: number; // stable sequential id, 1..6 (row keys / onChange handlers)
  code: string; // "II.A.1" | "II.C.1" | "II.C.2" | "IV.A.1" | "IV.B.1" | "IV.C.1"
  text: string; // Indonesian criterion text
  requiredRoles: EvidenceRole[]; // which document roles must be cited
  status: ScreeningVerdict; // AI candidate verdict (substance)
  technicalStatus: TechnicalStatus; // "" when no technical failure
  notes: string; // AI findings (Indonesian)
  verifierStatus: VerifierVerdict; // ROCAN authoritative decision
  verifierNotes: string; // ROCAN notes per row
}

// ---- Screening 2: one priority-categorization question ----
export interface ScreeningQuestion {
  id: number; // sequential 1..12
  code: string; // "C01".."C12"
  text: string; // Indonesian question text
  categoryGroup: 1 | 2 | 3 | 4; // Kategori group this question belongs to
  status: Screening2Verdict; // AI candidate verdict
  technicalStatus: TechnicalStatus;
  notes: string;
  verifierStatus: Screening2Verdict | "UNREVIEWED";
  verifierNotes: string;
}

/** ChecklistCriterion kept as a NAME ALIAS of ScreeningCriterion so the import
 *  layer and generic helpers referring to the old name gain the new shape. */
export type ChecklistCriterion = ScreeningCriterion;

export interface MasterCriterion {
  id: number;
  code?: string; // S1/S2 code when applicable
  text: string;
  description: string;
  isActive: boolean;
  screening?: 1 | 2; // which screening this entry belongs to
}

export interface RegulationDocument {
  id: string;
  title: string;
  category: string;
  fileName: string;
  fileSize: string;
  uploadDate: string;
  dateInserted?: string; // Tanggal Dimasukkan
  uploadedBy: string;
  isActive: boolean;
  targetYear?: string;
  description?: string;
  extractedRulesSummary?: string;
  pdfDataUrl?: string;
}

export interface SubmissionAuditEntry {
  action: "CREATE" | "UPDATE" | "DELETE" | "REUPLOAD";
  performedBy: string; // ID / NIP & Name
  timestamp: string;
  details?: string;
}

export interface VerificationHistoryEntry {
  verifiedAt: string;
  verificationStatus: "Menunggu" | "Diterima" | "Ditolak";
  rabFileName?: string;
  verifiedBy?: string;
  verifiedByNip?: string;
  verifikatorNotes?: string;
  // Screening snapshots (replace old aiStatus/aiScore/criteriaResults)
  s1Summary?: ScreeningSummary;
  aiReason?: string;
  aiRecommendation?: string;
  screening1Results?: ScreeningCriterion[];
  screening2Results?: ScreeningQuestion[];
  roCategory?: RoCategory;
}

export interface SubmissionData {
  id: string;
  ticketNumber: string;
  satkerUserId: string; // 8 characters
  satkerUserName: string;
  satkerUnit: string;
  submittedAt: string;
  program: string;
  kegiatan: string;
  kro: string;
  ro: string;
  unitEselon1: string;
  unitEselon2: string;
  prioritas: string;
  rabFileName: string;
  rabFileSize: string;
  pdfDataUrl?: string;
  // Optional TOR (Term of Reference) document fields — optional so previously-stored
  // submissions (which have no TOR) stay valid when re-read from localStorage.
  torFileName?: string;
  torFileSize?: string;
  torPdfDataUrl?: string;
  activeRegulationTitle?: string;

  // Category & Description & Budget Year
  kategori?: string;
  deskripsi?: string;
  tahunAnggaran?: string;
  kategori1?: string;
  kategori2?: string;
  kategori3?: string;

  // User Logging / Audit Trail
  createdBy?: string;
  updatedBy?: string;
  auditTrail?: SubmissionAuditEntry[];

  // Related Reference Documents
  referenceDocuments?: string[];

  // Screening-1 candidate + ROCAN results (replaces criteriaResults)
  screening1Results: ScreeningCriterion[];
  s1Summary: ScreeningSummary; // candidate roll-up for badges
  aiReason: string; // demo narrative
  aiRecommendation: string; // demo narrative

  // Screening-2 results + computed RO priority category
  screening2Results: ScreeningQuestion[];
  roCategory: RoCategory; // 0..4 (0 = perlu reviu manual)

  // Verifikator Review
  verificationStatus: "Menunggu" | "Diterima" | "Ditolak";
  verifikatorNotes: string;
  verifiedBy?: string;
  verifiedByNip?: string;
  verifiedAt?: string;
  reviewHistory?: VerificationHistoryEntry[];
}

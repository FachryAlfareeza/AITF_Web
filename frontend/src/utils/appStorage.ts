import type { HierarchyItem, RegulationDocument, SubmissionData, UserAccount } from "../types";
import { HIERARCHY_DATA } from "../data/budgetData";
import { INITIAL_REGULATIONS } from "../data/initialRegulations";
import { INITIAL_SUBMISSIONS, INITIAL_USERS } from "../data/initialUsers";

const STORAGE_KEYS = {
  users: "rab_app_users",
  regulations: "rab_app_regulations",
  masterRo: "rab_app_master_ro",
  submissions: "rab_app_submissions",
  currentUser: "rab_app_current_user",
  theme: "rab_app_theme",
  masterCriteria: "rab_app_master_criteria",
  schemaVersion: "rab_app_schema_version",
} as const;

/** P2 two-screening model. Bump whenever the persisted model shape changes. */
const CURRENT_SCHEMA_VERSION = "2";

/**
 * Jalankan sekali saat modul dimuat (sebelum load* dipanggil). Membersihkan data
 * model-lama (LOLOS / criteriaResults 20 kriteria) ketika versi skema berbeda,
 * lalu menandai versi saat ini. Akun pengguna, sesi, dan tema TIDAK dibersihkan.
 */
export function ensureSchemaVersion(): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.schemaVersion);
    if (stored === CURRENT_SCHEMA_VERSION) return;
    localStorage.removeItem(STORAGE_KEYS.submissions);
    localStorage.removeItem(STORAGE_KEYS.regulations);
    localStorage.removeItem(STORAGE_KEYS.masterRo);
    localStorage.removeItem(STORAGE_KEYS.masterCriteria);
    localStorage.setItem(STORAGE_KEYS.schemaVersion, CURRENT_SCHEMA_VERSION);
  } catch (error) {
    console.warn("Schema version check failed:", error);
  }
}

// Clear stale old-model data as early as possible (module load, before any load*).
ensureSchemaVersion();

function readStoredJson<T>(key: string): T | null {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch (error) {
    console.error(error);
    return null;
  }
}

function writeStoredJson(key: string, value: unknown, label: string): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Could not sync ${label} to localStorage:`, error);
  }
}

function stripPdfData<T extends { pdfDataUrl?: string }>(items: T[]): Omit<T, "pdfDataUrl">[] {
  return items.map(({ pdfDataUrl: _pdfDataUrl, ...metadata }) => metadata);
}

function savePdfMetadataList<T extends { pdfDataUrl?: string }>(key: string, items: T[], label: string): void {
  try {
    const sanitized = items.map((item) => {
      if (!item.pdfDataUrl || (!item.pdfDataUrl.startsWith("blob:") && item.pdfDataUrl.length <= 20000)) return item;
      const { pdfDataUrl: _pdfDataUrl, ...metadata } = item;
      return metadata;
    });
    localStorage.setItem(key, JSON.stringify(sanitized));
  } catch (error) {
    console.warn(`Could not sync ${label} to localStorage:`, error);
    try {
      localStorage.setItem(key, JSON.stringify(stripPdfData(items)));
    } catch (fallbackError) {
      console.warn(`Fallback sync ${label} failed:`, fallbackError);
    }
  }
}

export function loadUsers(): UserAccount[] {
  const users = readStoredJson<UserAccount[]>(STORAGE_KEYS.users);
  if (Array.isArray(users) && users.length > 0 && users.every((user) => user.id && user.id.length === 8)) {
    return users.filter((user) => user.id !== "19871212");
  }

  localStorage.removeItem(STORAGE_KEYS.users);
  return INITIAL_USERS;
}

export function loadRegulations(): RegulationDocument[] {
  const regulations = readStoredJson<RegulationDocument[]>(STORAGE_KEYS.regulations);
  return Array.isArray(regulations) && regulations.length > 0 ? regulations : INITIAL_REGULATIONS;
}

export function loadMasterRoList(): HierarchyItem[] {
  const items = readStoredJson<HierarchyItem[]>(STORAGE_KEYS.masterRo);
  return Array.isArray(items) && items.length > 0
    ? items
    : HIERARCHY_DATA.map((item, index) => ({ ...item, id: `ro_${index + 1}` }));
}

export function loadSubmissions(): SubmissionData[] {
  const saved = readStoredJson<SubmissionData[]>(STORAGE_KEYS.submissions);
  if (Array.isArray(saved) && saved.length > 0 && saved.every((submission) => submission.satkerUserId && submission.satkerUserId.length === 8)) {
    const cleaned = saved.map((submission) => {
      if (submission.pdfDataUrl?.startsWith("blob:")) {
        const { pdfDataUrl: _removedPdfDataUrl, ...rest } = submission;
        return rest;
      }
      return submission;
    });
    const hydrated = cleaned.map((submission) => {
      // Defense in depth: tolerate absent screening fields on hand-edited/partial stores.
      if (!Array.isArray(submission.screening1Results)) submission.screening1Results = [];
      if (!Array.isArray(submission.screening2Results)) submission.screening2Results = [];
      if (typeof submission.roCategory !== "number") submission.roCategory = 0;
      if (!submission.s1Summary) submission.s1Summary = { pass: 0, notPass: 0, insufficient: 0, technicalFailures: 0, total: submission.screening1Results.length };
      const mockHistory = INITIAL_SUBMISSIONS.find((mock) => mock.id === submission.id)?.reviewHistory;
      const reviewHistory = submission.reviewHistory?.length ? submission.reviewHistory : mockHistory || [];

      if (submission.verificationStatus === "Menunggu" && reviewHistory.at(-1)?.verificationStatus !== "Menunggu") {
        return {
          ...submission,
          reviewHistory: [...reviewHistory, { verifiedAt: submission.submittedAt, verificationStatus: "Menunggu" as const, rabFileName: submission.rabFileName }],
        };
      }

      return reviewHistory.length ? { ...submission, reviewHistory } : submission;
    });

    if (hydrated.some((submission) => submission.verificationStatus === "Ditolak")) return hydrated;
    const rejectedMock = INITIAL_SUBMISSIONS.find((submission) => submission.verificationStatus === "Ditolak");
    return rejectedMock ? [...hydrated, rejectedMock] : hydrated;
  }

  localStorage.removeItem(STORAGE_KEYS.submissions);
  return INITIAL_SUBMISSIONS;
}

export function loadCurrentUser(): UserAccount | null {
  const user = readStoredJson<UserAccount>(STORAGE_KEYS.currentUser);
  if (user && user.id && user.id.length === 8 && user.id !== "19871212") return user;

  localStorage.removeItem(STORAGE_KEYS.currentUser);
  return null;
}

export function loadTheme(): "light" | "dark" {
  try {
    const theme = localStorage.getItem(STORAGE_KEYS.theme);
    return theme === "dark" || theme === "light" ? theme : "light";
  } catch {
    return "light";
  }
}

export const saveUsers = (users: UserAccount[]) => writeStoredJson(STORAGE_KEYS.users, users, "users");
export const saveMasterRoList = (items: HierarchyItem[]) => writeStoredJson(STORAGE_KEYS.masterRo, items, "masterRoList");
export const saveRegulations = (items: RegulationDocument[]) => savePdfMetadataList(STORAGE_KEYS.regulations, items, "regulations");
export const saveSubmissions = (items: SubmissionData[]) => savePdfMetadataList(STORAGE_KEYS.submissions, items, "submissions");
export const saveTheme = (theme: "light" | "dark") => localStorage.setItem(STORAGE_KEYS.theme, theme);
export const saveCurrentUser = (user: UserAccount) => writeStoredJson(STORAGE_KEYS.currentUser, user, "currentUser");
export const clearCurrentUser = () => localStorage.removeItem(STORAGE_KEYS.currentUser);
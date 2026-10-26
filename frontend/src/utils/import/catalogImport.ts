// Adapters: validated catalog artifacts -> airen app models.
//
//   - Checklist version -> MasterCriterion[] / ChecklistCriterion[]
//   - Master RO         -> HierarchyItem
//
// Both honor the steering contract: codes stay strings (leading zeros preserved),
// nothing is fabricated, and lossy mappings are documented.

import type {
  ChecklistCriterion,
  HierarchyItem,
  MasterCriterion,
} from "../../types";
import type {
  ChecklistVersionImport,
  MasterRoImport,
} from "./importTypes";

/** Common keys that may carry a checklist item's display text, in priority order. */
const TEXT_KEYS = ["text", "kriteria", "deskripsi", "pertanyaan", "nama", "label"] as const;

/**
 * Best-effort text extraction from a free-form checklist item. Items are
 * `list[dict]` with no agreed shape, so we probe common keys and fall back to a
 * JSON stringification rather than guessing or dropping data.
 */
function extractItemText(item: Record<string, unknown>): string {
  for (const key of TEXT_KEYS) {
    const value = item[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }
  return JSON.stringify(item);
}

/**
 * Map a validated checklist version onto airen's `MasterCriterion[]`.
 * Combines screening_1 + screening_2 items with sequential numeric ids.
 * Null item arrays yield an empty list. Text extraction is best-effort.
 */
export function mapChecklistToMasterCriteria(
  src: ChecklistVersionImport,
): MasterCriterion[] {
  const items = [
    ...(src.screening_1_items ?? []),
    ...(src.screening_2_items ?? []),
  ];
  return items.map((item, index) => ({
    id: index + 1,
    text: extractItemText(item),
    description: "",
    isActive: src.is_active,
  }));
}

/**
 * Map a validated checklist version onto airen's `ChecklistCriterion[]` (the
 * per-submission evaluation rows). No AI/verifier result exists at import time,
 * so status/notes are neutral defaults; they are filled in later by review flows.
 */
export function mapChecklistToCriteria(
  src: ChecklistVersionImport,
): ChecklistCriterion[] {
  const screening1 = src.screening_1_items ?? [];
  const screening2 = src.screening_2_items ?? [];
  const build = (
    items: Array<Record<string, unknown>>,
    category: string,
    startId: number,
  ): ChecklistCriterion[] =>
    items.map((item, index) => ({
      id: startId + index,
      text: extractItemText(item),
      status: "failed",
      notes: "",
      category,
      verifierStatus: "Ditolak",
      verifierNotes: "",
    }));

  return [
    ...build(screening1, "screening_1", 1),
    ...build(screening2, "screening_2", screening1.length + 1),
  ];
}

/**
 * Map a validated master RO onto airen's `HierarchyItem`.
 *
 * Documented lossy mapping: master RO carries only `kode`/`deskripsi`/`is_active`,
 * while `HierarchyItem` also needs program/unitEselon1/kegiatan/unitEselon2/
 * prioritasCheck/kro. The source has no such data, so those richer fields are set
 * to "" (never fabricated). `kode` is preserved as a string (leading zeros kept)
 * and used as both `ro` and `id`. `HierarchyItem` has no description field, so
 * `deskripsi` has no non-fabricating target and is not force-fit; a future richer
 * RO source (or a HierarchyItem extension) would carry it. This mapping is lossy
 * by necessity given the thin master-RO shape.
 */
export function mapMasterRoToHierarchyItem(src: MasterRoImport): HierarchyItem {
  return {
    id: src.kode,
    program: "",
    unitEselon1: "",
    kegiatan: "",
    unitEselon2: "",
    prioritasCheck: "",
    kro: "",
    ro: src.kode,
  };
}

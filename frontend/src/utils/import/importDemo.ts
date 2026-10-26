// Dev-only demonstration of the parse -> validate -> map pipeline.
//
// NOT wired into any view, router, or App.tsx and imported by no runtime code.
// Its purpose is to exercise the full boundary end to end so `tsc`/`vite` prove
// the source types flow through the guards into the airen adapters with every
// type lined up. It also doubles as a runnable reference for how to consume an
// imported JSON artifact.

import type {
  ChecklistCriterion,
  HierarchyItem,
  MasterCriterion,
  SubmissionData,
} from "../../types";
import { SAMPLE_CHECKLIST_VERSION } from "../../data/sampleChecklistVersion";
import { SAMPLE_MASTER_RO } from "../../data/sampleMasterRo";
import { SAMPLE_REVIEW_REQUEST } from "../../data/sampleReviewRequest";
import { mapChecklistToCriteria, mapChecklistToMasterCriteria, mapMasterRoToHierarchyItem } from "./catalogImport";
import { validateChecklistVersion, validateMasterRo } from "./catalogGuards";
import { safeParseJson, type ImportResult } from "./jsonImport";
import { mapReviewRequestToSubmission } from "./reviewRequestImport";
import { validateReviewRequest } from "./reviewRequestGuards";

export interface ImportDemoResult {
  submission: ImportResult<SubmissionData>;
  masterCriteria: ImportResult<MasterCriterion[]>;
  checklistCriteria: ImportResult<ChecklistCriterion[]>;
  hierarchyItem: ImportResult<HierarchyItem>;
}

/**
 * Run each synthetic fixture through safeParse -> validate -> map and return the
 * mapped airen models (or the error results). Fixtures are serialized to JSON
 * first so the demo exercises `safeParseJson` exactly as a real file import would.
 */
export function demoImportPipeline(): ImportDemoResult {
  // --- review request -> SubmissionData ---
  const rawReview = JSON.stringify(SAMPLE_REVIEW_REQUEST);
  const parsedReview = safeParseJson(rawReview);
  let submission: ImportResult<SubmissionData>;
  if (!parsedReview.ok) {
    submission = parsedReview;
  } else {
    const validated = validateReviewRequest(parsedReview.value);
    submission = validated.ok
      ? { ok: true, value: mapReviewRequestToSubmission(validated.value) }
      : validated;
  }

  // --- checklist version -> MasterCriterion[] / ChecklistCriterion[] ---
  const rawChecklist = JSON.stringify(SAMPLE_CHECKLIST_VERSION);
  const parsedChecklist = safeParseJson(rawChecklist);
  let masterCriteria: ImportResult<MasterCriterion[]>;
  let checklistCriteria: ImportResult<ChecklistCriterion[]>;
  if (!parsedChecklist.ok) {
    masterCriteria = parsedChecklist;
    checklistCriteria = parsedChecklist;
  } else {
    const validated = validateChecklistVersion(parsedChecklist.value);
    if (validated.ok) {
      masterCriteria = { ok: true, value: mapChecklistToMasterCriteria(validated.value) };
      checklistCriteria = { ok: true, value: mapChecklistToCriteria(validated.value) };
    } else {
      masterCriteria = validated;
      checklistCriteria = validated;
    }
  }

  // --- master RO -> HierarchyItem ---
  const rawMasterRo = JSON.stringify(SAMPLE_MASTER_RO);
  const parsedMasterRo = safeParseJson(rawMasterRo);
  let hierarchyItem: ImportResult<HierarchyItem>;
  if (!parsedMasterRo.ok) {
    hierarchyItem = parsedMasterRo;
  } else {
    const validated = validateMasterRo(parsedMasterRo.value);
    hierarchyItem = validated.ok
      ? { ok: true, value: mapMasterRoToHierarchyItem(validated.value) }
      : validated;
  }

  return { submission, masterCriteria, checklistCriteria, hierarchyItem };
}

// Public barrel for the frontend-only JSON import/mapping layer.
//
// A single entry point for consumers (and the future API client) to pull the
// parse -> validate -> map pipeline from. Re-exporting here keeps the module
// graph coherent and gives a stable surface independent of internal file layout.

// Shared primitives.
export {
  safeParseJson,
  isRecord,
  isNonEmptyString,
  isFiniteNumber,
  isInteger,
  isStringOrNull,
  rejectUnknownKeys,
  type ImportResult,
} from "./jsonImport";

// Source artifact types.
export type {
  TorRabReviewRequest,
  ReviewRequestSource,
  ReviewRequestDocument,
  ReviewRequestDocuments,
  Organization,
  CodeLabel,
  OutputItem,
  Locator,
  ProgramContext,
  BudgetSummary,
  Extraction,
  ReviewOptions,
  ChecklistVersionImport,
  MasterRoImport,
} from "./importTypes";

// Guards (validate before mapping).
export { validateReviewRequest } from "./reviewRequestGuards";
export { validateChecklistVersion, validateMasterRo } from "./catalogGuards";

// Adapters (map validated source onto airen models).
export { mapReviewRequestToSubmission } from "./reviewRequestImport";
export {
  mapChecklistToMasterCriteria,
  mapChecklistToCriteria,
  mapMasterRoToHierarchyItem,
} from "./catalogImport";

// Dev-only demonstration.
export { demoImportPipeline, type ImportDemoResult } from "./importDemo";

import React, { useRef, useState } from "react";
import { X, UploadCloud, AlertCircle, CheckCircle2, FileJson, FlaskConical } from "lucide-react";
import type { HierarchyItem, MasterCriterion, SubmissionData } from "../types";
import {
  safeParseJson,
  validateReviewRequest,
  validateMasterRo,
  validateChecklistVersion,
  mapReviewRequestToSubmission,
  mapMasterRoToHierarchyItem,
  mapChecklistToMasterCriteria,
  type ImportResult,
} from "../utils/import";
import { SAMPLE_REVIEW_REQUEST } from "../data/sampleReviewRequest";
import { SAMPLE_MASTER_RO } from "../data/sampleMasterRo";
import { SAMPLE_CHECKLIST_VERSION } from "../data/sampleChecklistVersion";

/** Artifact types this modal can process. */
export type ImportArtifactType = "review" | "masterRo" | "checklist";

/** Which pipeline stage produced an error (for the error panel label). */
type FailedStage = "parse" | "validate" | "detect";

interface JsonImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Artifact types allowed in this instance (drives the picker + auto-detect scope). */
  allowedTypes: ImportArtifactType[];
  /** Called with the mapped SubmissionData on a successful review-request import. */
  onImportReview?: (submission: SubmissionData) => void;
  /** Called with the mapped HierarchyItem on a successful master-RO import. */
  onImportMasterRo?: (item: HierarchyItem) => void;
}

/** Indonesian label per artifact type. */
const TYPE_LABELS: Record<ImportArtifactType, string> = {
  review: "Permintaan Ulasan TOR/RAB",
  masterRo: "Master Rincian Output (RO)",
  checklist: "Versi Checklist",
};

/** A rendered success outcome, discriminated by artifact type. */
type SuccessState =
  | { type: "review"; submission: SubmissionData }
  | { type: "masterRo"; item: HierarchyItem }
  | { type: "checklist"; criteria: MasterCriterion[] };

/**
 * Validate-then-map an already-parsed value as a specific artifact type.
 * Never throws: validation failures come back as `ok:false` results.
 */
function runForType(
  parsed: unknown,
  type: ImportArtifactType,
): { ok: true; success: SuccessState } | { ok: false; errors: string[] } {
  if (type === "review") {
    const validated = validateReviewRequest(parsed);
    if (!validated.ok) return { ok: false, errors: validated.errors };
    return { ok: true, success: { type: "review", submission: mapReviewRequestToSubmission(validated.value) } };
  }
  if (type === "masterRo") {
    const validated = validateMasterRo(parsed);
    if (!validated.ok) return { ok: false, errors: validated.errors };
    return { ok: true, success: { type: "masterRo", item: mapMasterRoToHierarchyItem(validated.value) } };
  }
  const validated = validateChecklistVersion(parsed);
  if (!validated.ok) return { ok: false, errors: validated.errors };
  return { ok: true, success: { type: "checklist", criteria: mapChecklistToMasterCriteria(validated.value) } };
}

export const JsonImportModal: React.FC<JsonImportModalProps> = ({
  isOpen,
  onClose,
  allowedTypes,
  onImportReview,
  onImportMasterRo,
}) => {
  const [rawText, setRawText] = useState("");
  const [selectedType, setSelectedType] = useState<"auto" | ImportArtifactType>("auto");
  const [fileName, setFileName] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[] | null>(null);
  const [failedStage, setFailedStage] = useState<FailedStage | null>(null);
  const [success, setSuccess] = useState<SuccessState | null>(null);
  const [applied, setApplied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const resetOutcome = () => {
    setErrors(null);
    setFailedStage(null);
    setSuccess(null);
    setApplied(false);
  };

  const handleClose = () => {
    setRawText("");
    setSelectedType("auto");
    setFileName(null);
    resetOutcome();
    onClose();
  };

  const handleLoadSample = (type: ImportArtifactType) => {
    const fixture = type === "review" ? SAMPLE_REVIEW_REQUEST : type === "masterRo" ? SAMPLE_MASTER_RO : SAMPLE_CHECKLIST_VERSION;
    setRawText(JSON.stringify(fixture, null, 2));
    setFileName(null);
    setSelectedType(type);
    resetOutcome();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Allow re-selecting the same file later.
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      setRawText(text);
      setFileName(file.name);
      resetOutcome();
    };
    reader.onerror = () => {
      setFileName(file.name);
      setFailedStage("parse");
      setErrors(["Gagal membaca berkas. Pastikan berkas berupa teks .json yang valid."]);
      setSuccess(null);
    };
    reader.readAsText(file);
  };

  const handleProcess = () => {
    resetOutcome();

    // Stage 1: parse (never throws).
    const parsedResult: ImportResult<unknown> = safeParseJson(rawText);
    if (!parsedResult.ok) {
      setFailedStage("parse");
      setErrors(parsedResult.errors);
      return;
    }
    const parsed = parsedResult.value;

    // Stage 2: validate + map, honoring a locked type or auto-detect.
    if (selectedType !== "auto") {
      const outcome = runForType(parsed, selectedType);
      if (!outcome.ok) {
        setFailedStage("validate");
        setErrors(outcome.errors);
        return;
      }
      setSuccess(outcome.success);
      return;
    }

    // Auto-detect: first allowed type whose guard accepts the value wins.
    for (const type of allowedTypes) {
      const outcome = runForType(parsed, type);
      if (outcome.ok) {
        setSuccess(outcome.success);
        return;
      }
    }
    setFailedStage("detect");
    setErrors([
      "Tidak dapat mendeteksi jenis artefak; pilih jenis secara manual lalu proses ulang.",
    ]);
  };

  const handleApply = () => {
    if (!success) return;
    if (success.type === "review" && onImportReview) {
      onImportReview(success.submission);
      setApplied(true);
    } else if (success.type === "masterRo" && onImportMasterRo) {
      onImportMasterRo(success.item);
      setApplied(true);
    }
  };

  // A type is importable (not preview-only) when a matching callback is provided.
  const canApply =
    (success?.type === "review" && !!onImportReview) ||
    (success?.type === "masterRo" && !!onImportMasterRo);

  const stageLabel = failedStage === "parse" ? "Tahap: Parse JSON" : failedStage === "validate" ? "Tahap: Validasi" : "Tahap: Deteksi Jenis";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 text-cyan-600 dark:text-cyan-400 rounded-xl">
              <FileJson className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Unggah JSON</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Impor artefak JSON (tempel teks atau pilih berkas .json)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Type picker */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Jenis Artefak</label>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value as "auto" | ImportArtifactType);
                resetOutcome();
              }}
              className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-hidden text-slate-900 dark:text-white cursor-pointer"
            >
              <option value="auto">Deteksi otomatis</option>
              {allowedTypes.map((type) => (
                <option key={type} value={type}>
                  {TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </div>

          {/* Paste area */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Tempel JSON</label>
            <textarea
              rows={8}
              value={rawText}
              onChange={(e) => {
                setRawText(e.target.value);
                setFileName(null);
                resetOutcome();
              }}
              placeholder='Tempel isi JSON di sini, misalnya {"schema_version":"1.0.0", ...}'
              className="w-full p-3 text-xs font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-hidden text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none"
            />
          </div>

          {/* File + sample controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Pilih berkas .json</span>
            </button>
            <input ref={fileInputRef} type="file" accept=".json,application/json" onChange={handleFileChange} className="hidden" />
            {fileName && <span className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate max-w-[12rem]">{fileName}</span>}

            <span className="text-xs text-slate-400 dark:text-slate-500">|</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Muat contoh:</span>
            {allowedTypes.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => handleLoadSample(type)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/60 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 border border-cyan-200 dark:border-cyan-800 rounded-xl transition-colors cursor-pointer"
              >
                <FlaskConical className="w-3.5 h-3.5" />
                <span>{TYPE_LABELS[type]}</span>
              </button>
            ))}
          </div>

          {/* Error panel */}
          {errors && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs font-bold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Impor gagal &bull; {stageLabel}</span>
              </div>
              <ul className="list-disc pl-6 space-y-1 text-xs text-rose-600 dark:text-rose-400">
                {errors.map((message, index) => (
                  <li key={index}>{message}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Success panel */}
          {success && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Validasi berhasil &bull; {TYPE_LABELS[success.type]}</span>
              </div>

              {success.type === "review" && (
                <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                  <p>
                    <strong className="text-slate-800 dark:text-slate-200">No. Tiket:</strong> <span className="font-mono">{success.submission.ticketNumber}</span>
                  </p>
                  <p>
                    <strong className="text-slate-800 dark:text-slate-200">Program:</strong> {success.submission.program || "—"}
                  </p>
                  <p>
                    <strong className="text-slate-800 dark:text-slate-200">Tahun Anggaran:</strong> {success.submission.tahunAnggaran || "—"}
                  </p>
                </div>
              )}

              {success.type === "masterRo" && (
                <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                  <p>
                    <strong className="text-slate-800 dark:text-slate-200">Kode RO:</strong> <span className="font-mono">{success.item.ro}</span>
                  </p>
                </div>
              )}

              {success.type === "checklist" && (
                <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
                  <p>
                    <strong className="text-slate-800 dark:text-slate-200">Jumlah kriteria terpetakan:</strong> {success.criteria.length}
                  </p>
                  {success.criteria.length > 0 && (
                    <ul className="list-disc pl-6 space-y-0.5">
                      {success.criteria.slice(0, 3).map((criterion) => (
                        <li key={criterion.id} className="truncate">
                          <span className="text-slate-400">[S{criterion.screening}]</span> {criterion.text}
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 rounded-lg">
                    Pratinjau saja — penerapan checklist hasil impor ke master kriteria belum tersambung pada versi ini.
                  </p>
                </div>
              )}

              {applied && (
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Data berhasil ditambahkan ke daftar.</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            {applied ? "Tutup" : "Batal"}
          </button>
          {success && canApply ? (
            <button
              type="button"
              onClick={handleApply}
              disabled={applied}
              className="px-4 py-2 text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {applied ? "Tersimpan" : "Tambahkan ke Daftar"}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleProcess}
              className="px-4 py-2 text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Proses
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

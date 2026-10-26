import type { ChecklistCriterion, ScreeningVerdict, VerifierVerdict } from "../types";
import { CheckCircle2, XCircle, HelpCircle, AlertTriangle } from "lucide-react";

interface VerificationCriteriaTableProps {
  criteria: ChecklistCriterion[];
  isEditable: boolean;
  isStatusEditable?: boolean;
  isNotesEditable?: boolean;
  isStatusDisabled?: boolean;
  isNotesDisabled?: boolean;
  onStatusChange: (criterionId: number, status: VerifierVerdict) => void;
  onNotesChange: (criterionId: number, notes: string) => void;
}

const VERDICT_META: Record<ScreeningVerdict, { label: string; badge: string; Icon: typeof CheckCircle2 }> = {
  PASS: {
    label: "PASS",
    badge: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800",
    Icon: CheckCircle2,
  },
  NOT_PASS: {
    label: "NOT_PASS",
    badge: "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800",
    Icon: XCircle,
  },
  INSUFFICIENT_EVIDENCE: {
    label: "BUKTI TIDAK CUKUP",
    badge: "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800",
    Icon: HelpCircle,
  },
};

const TECHNICAL_LABEL: Record<string, string> = {
  MODEL_ERROR: "Kesalahan Model",
  PARSE_FAILED: "Gagal Ekstraksi",
  VERIFICATION_FAILED: "Verifikasi Gagal",
};

/** ROCAN override options reuse the Screening-1 verdict space. */
const VERIFIER_OPTIONS: ScreeningVerdict[] = ["PASS", "NOT_PASS", "INSUFFICIENT_EVIDENCE"];

function VerdictBadge({ verdict }: { verdict: ScreeningVerdict }) {
  const meta = VERDICT_META[verdict];
  const { Icon } = meta;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${meta.badge}`}>
      <Icon className="w-3.5 h-3.5" />
      {meta.label}
    </span>
  );
}

export function VerificationCriteriaTable({ criteria, isEditable, isStatusEditable = isEditable, isNotesEditable = isEditable, isStatusDisabled = false, isNotesDisabled = false, onStatusChange, onNotesChange }: VerificationCriteriaTableProps) {
  return (
    <div className="border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
      <div className="overflow-x-auto max-h-125 overflow-y-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100/95 dark:bg-slate-800/95 text-slate-800 dark:text-slate-200 uppercase font-black text-xs sticky top-0 z-10 border-b-2 border-slate-300 dark:border-slate-700">
            <tr>
              <th className="px-4 py-3.5 w-12 text-center">No</th>
              <th className="px-4 py-3.5 min-w-50">Kriteria Penapisan 1 (Substansi)</th>
              <th className="px-4 py-3.5 w-32 text-center">Status AI (Kandidat)</th>
              <th className="px-4 py-3.5 min-w-45">Catatan Bukti AI</th>
              <th className="px-4 py-3.5 min-w-37.5 text-center bg-cyan-100/60 dark:bg-cyan-950/60 border-l border-r border-cyan-200 dark:border-cyan-800">
                Kolom Verifikator (ROCAN)
                {isStatusEditable && <span className="block text-xs font-semibold text-cyan-700 dark:text-cyan-400 lowercase">{isStatusDisabled ? "(terkunci)" : "(bisa diubah)"}</span>}
              </th>
              <th className="px-4 py-3.5 min-w-47.5 bg-slate-100/80 dark:bg-slate-800/80">Catatan Evaluasi Verifikator</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {criteria.map((criterion) => {
              const effectiveVerifier = criterion.verifierStatus === "UNREVIEWED" ? criterion.status : criterion.verifierStatus;
              const isOverridden = criterion.verifierStatus !== "UNREVIEWED" && criterion.verifierStatus !== criterion.status;

              return (
                <tr
                  key={criterion.id}
                  className={`hover:bg-sky-50/80 dark:hover:bg-slate-800/70 border-b border-slate-100 dark:border-slate-800/80 transition-colors ${
                    isOverridden ? "bg-amber-50/50 dark:bg-amber-950/20" : ""
                  }`}
                >
                  <td className="px-4 py-3.5 text-center font-mono text-slate-400 dark:text-slate-500 font-bold">{criterion.id}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2 mb-1">
                      {criterion.code && (
                        <span className="inline-block px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded text-xs font-mono font-bold border border-slate-200 dark:border-slate-700">
                          {criterion.code}
                        </span>
                      )}
                      {criterion.requiredRoles?.map((role) => (
                        <span key={role} className="inline-block px-1.5 py-0.5 bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 rounded text-xs font-semibold border border-cyan-200 dark:border-cyan-800">
                          {role}
                        </span>
                      ))}
                    </div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200 leading-snug">{criterion.text}</div>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <VerdictBadge verdict={criterion.status} />
                    {criterion.technicalStatus !== "" && (
                      <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600">
                        <AlertTriangle className="w-3 h-3" />
                        {TECHNICAL_LABEL[criterion.technicalStatus] || criterion.technicalStatus}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400 text-xs leading-relaxed">{criterion.notes}</td>
                  <td className="px-4 py-3.5 text-center bg-cyan-50/20 dark:bg-cyan-950/20 border-l border-r border-cyan-100 dark:border-cyan-900/60">
                    {isStatusEditable ? (
                      <div className="inline-flex flex-col gap-1">
                        {VERIFIER_OPTIONS.map((option) => {
                          const selected = effectiveVerifier === option;
                          const meta = VERDICT_META[option];
                          return (
                            <button
                              key={option}
                              type="button"
                              disabled={isStatusDisabled}
                              onClick={() => onStatusChange(criterion.id, option)}
                              className={`h-7 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 border ${isStatusDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"} ${
                                selected ? meta.badge : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500"
                              }`}
                              title={`Tetapkan ${meta.label} untuk kriteria ini`}
                            >
                              <meta.Icon className="w-3.5 h-3.5" />
                              <span>{meta.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <VerdictBadge verdict={effectiveVerifier} />
                    )}
                    {isOverridden && <div className="text-xs text-amber-700 dark:text-amber-400 font-bold mt-1">*Diubah dari AI</div>}
                  </td>
                  <td className="px-4 py-3.5 bg-slate-50/40 dark:bg-slate-800/30">
                    {isNotesEditable ? (
                      <textarea
                        rows={3}
                        disabled={isNotesDisabled}
                        value={criterion.verifierNotes}
                        onChange={(event) => onNotesChange(criterion.id, event.target.value)}
                        placeholder="Catatan evaluasi baris..."
                        className={`w-full min-w-40 px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 resize-y ${isNotesDisabled ? "cursor-not-allowed bg-slate-100 dark:bg-slate-900 opacity-75" : ""}`}
                      />
                    ) : (
                      <span className="text-xs text-slate-700 dark:text-slate-300 italic">{criterion.verifierNotes || "-"}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import type { ReactNode } from "react";
import type { Screening2Verdict, TechnicalStatus } from "../types";
import { CheckCircle2, MinusCircle, HelpCircle, type LucideIcon } from "lucide-react";

/**
 * Shared presentational helpers for status/verdict display so badges render
 * consistently (TEXT + ICON, never color alone) outside the gold-standard
 * `VerificationCriteriaTable`. Pure presentation — imports types only and does
 * not modify any enum, shape, or logic.
 */

/** Text+icon metadata for a Screening-2 verdict (MATCH / NO_MATCH / insufficient). */
export const S2_VERDICT_META: Record<Screening2Verdict, { label: string; badge: string; Icon: LucideIcon }> = {
  MATCH: {
    label: "MATCH",
    badge: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800",
    Icon: CheckCircle2,
  },
  NO_MATCH: {
    label: "NO_MATCH",
    badge: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700",
    Icon: MinusCircle,
  },
  INSUFFICIENT_EVIDENCE: {
    label: "BUKTI TIDAK CUKUP",
    badge: "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800",
    Icon: HelpCircle,
  },
};

/** Indonesian labels for a technical failure, mirroring `VerificationCriteriaTable`. */
export const TECHNICAL_LABEL: Record<Exclude<TechnicalStatus, "">, string> = {
  MODEL_ERROR: "Kesalahan Model",
  PARSE_FAILED: "Gagal Ekstraksi",
  VERIFICATION_FAILED: "Verifikasi Gagal",
};

/** Resolve the Indonesian label for any technical status string (falls back to raw). */
export function technicalLabel(status: string): string {
  return (TECHNICAL_LABEL as Record<string, string>)[status] || status;
}

/** Text+icon badge for a Screening-2 verdict. */
export function S2VerdictBadge({ verdict }: { verdict: Screening2Verdict }) {
  const meta = S2_VERDICT_META[verdict];
  const { Icon } = meta;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${meta.badge}`}>
      <Icon className="w-3.5 h-3.5" />
      {meta.label}
    </span>
  );
}

interface EmptyStateProps {
  /** Icon component (lucide-react) shown above the title. */
  icon: LucideIcon;
  /** Short, calm Indonesian headline. */
  title: string;
  /** Optional supporting sentence / hint. */
  description?: ReactNode;
  /** Extra classes for the wrapper (e.g. to tune padding inside table cells). */
  className?: string;
}

/**
 * Consistent, calm empty-state card matching the `RegulationCardList` markup.
 * Used across lists so "nothing here yet" and "no filter matches" read the same.
 */
export function EmptyState({ icon: Icon, title, description, className = "" }: EmptyStateProps) {
  return (
    <div className={`text-center text-slate-400 dark:text-slate-500 ${className}`}>
      <Icon className="w-10 h-10 mx-auto mb-3 opacity-40" />
      <p className="text-sm font-bold">{title}</p>
      {description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{description}</p>}
    </div>
  );
}

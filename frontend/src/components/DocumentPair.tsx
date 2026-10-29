import { Eye, FileSpreadsheet, FileText, Files } from "lucide-react";

interface DocumentPairProps {
  /** RAB (Rincian Anggaran Biaya) file name — always present on a submission. */
  rabFileName: string;
  rabFileSize?: string;
  /** TOR (Term of Reference) file name — optional on older/reset submissions. */
  torFileName?: string;
  torFileSize?: string;
  onPreviewRab: () => void;
  onPreviewTor: () => void;
  /**
   * `combined` means ONE PDF holds both TOR and RAB. It is carried in the RAB
   * props (rabFileName/rabFileSize/onPreviewRab) and rendered as a single
   * "TOR + RAB" entry. Defaults to `separate`.
   */
  documentMode?: "separate" | "combined";
  /**
   * `table` renders a compact stacked layout for `SubmissionTable` rows;
   * `card` renders the two documents side-by-side for detail modals / review
   * screens. Defaults to `card`.
   */
  variant?: "table" | "card";
}

/**
 * Presentation-only component that renders the TOR + RAB document pair as a
 * clearly paired set (not RAB-first with TOR as an afterthought). Each document
 * shows an icon, file name, size, and a labelled "Pratinjau" button. When no
 * TOR exists it degrades gracefully to "Belum ada Dokumen TOR" with no preview
 * affordance. It owns no modal state; previews are delegated via callbacks.
 */
export function DocumentPair({ rabFileName, rabFileSize, torFileName, torFileSize, onPreviewRab, onPreviewTor, documentMode = "separate", variant = "card" }: DocumentPairProps) {
  const hasTor = Boolean(torFileName && torFileName.trim());
  const hasRab = Boolean(rabFileName && rabFileName.trim());

  if (documentMode === "combined") {
    const previewLabel = `Pratinjau Dokumen TOR + RAB: ${rabFileName}`;
    if (variant === "table") {
      return (
        <div className="flex items-start gap-2">
          <div className="p-1.5 rounded-lg bg-violet-50 dark:bg-violet-950/60 text-violet-600 border border-violet-200 dark:border-violet-900 shrink-0 mt-0.5">
            <Files className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <span className="text-xs text-violet-600 dark:text-violet-400 font-bold uppercase tracking-wide block">TOR + RAB (Gabungan)</span>
            <span className="font-bold text-slate-900 dark:text-white block truncate max-w-xs" title={rabFileName}>
              {rabFileName}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-mono block">{rabFileSize || "-"} &bull; Format PDF</span>
            <button
              type="button"
              onClick={onPreviewRab}
              className="mt-0.5 inline-flex items-center gap-1 text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline cursor-pointer"
              title={previewLabel}
              aria-label={previewLabel}
            >
              <Eye className="w-3 h-3" />
              <span>Pratinjau TOR + RAB</span>
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="p-2 rounded-lg bg-violet-50 dark:bg-violet-950/60 text-violet-600 border border-violet-200 dark:border-violet-900 shrink-0">
            <Files className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-xs text-slate-400 uppercase font-semibold block">Dokumen TOR + RAB (Gabungan):</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate" title={rabFileName}>
              {rabFileName}
            </span>
            {rabFileSize && <span className="text-xs text-slate-400 dark:text-slate-500 font-mono block mt-0.5">{rabFileSize} &bull; Format PDF</span>}
          </div>
        </div>
        <button
          type="button"
          onClick={onPreviewRab}
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/60 dark:hover:bg-violet-900/60 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800 text-xs font-bold cursor-pointer"
          title={previewLabel}
          aria-label={previewLabel}
        >
          <Eye className="w-3.5 h-3.5" /> Pratinjau
        </button>
      </div>
    );
  }

  if (variant === "table") {
    return (
      <div className="space-y-1.5">
        {/* RAB */}
        <div className="flex items-start gap-2">
          <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 border border-rose-200 dark:border-rose-900 shrink-0 mt-0.5">
            <FileSpreadsheet className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <span className="text-xs text-rose-500 dark:text-rose-400 font-bold uppercase tracking-wide block">RAB</span>
            {hasRab ? (
              <>
                <span className="font-bold text-slate-900 dark:text-white block truncate max-w-xs" title={rabFileName}>
                  {rabFileName}
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-mono block">{rabFileSize || "2.1 MB"} &bull; Format PDF</span>
                <button
                  type="button"
                  onClick={onPreviewRab}
                  className="mt-0.5 inline-flex items-center gap-1 text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
                  title={`Pratinjau Dokumen RAB: ${rabFileName}`}
                  aria-label={`Pratinjau Dokumen RAB: ${rabFileName}`}
                >
                  <Eye className="w-3 h-3" />
                  <span>Pratinjau RAB</span>
                </button>
              </>
            ) : (
              <span className="text-xs text-slate-400 dark:text-slate-500 italic block">Belum ada Dokumen RAB</span>
            )}
          </div>
        </div>

        {/* TOR */}
        <div className="flex items-start gap-2">
          <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 border border-blue-200 dark:border-blue-900 shrink-0 mt-0.5">
            <FileText className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <span className="text-xs text-blue-500 dark:text-blue-400 font-bold uppercase tracking-wide block">TOR</span>
            {hasTor ? (
              <>
                <span className="font-bold text-slate-900 dark:text-white block truncate max-w-xs" title={torFileName}>
                  {torFileName}
                </span>
                {torFileSize && <span className="text-xs text-slate-400 dark:text-slate-500 font-mono block">{torFileSize} &bull; Format PDF</span>}
                <button
                  type="button"
                  onClick={onPreviewTor}
                  className="mt-0.5 inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  title={`Pratinjau Dokumen TOR: ${torFileName}`}
                  aria-label={`Pratinjau Dokumen TOR: ${torFileName}`}
                >
                  <Eye className="w-3 h-3" />
                  <span>Pratinjau TOR</span>
                </button>
              </>
            ) : (
              <span className="text-xs text-slate-400 dark:text-slate-500 italic block">Belum ada Dokumen TOR</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // variant === "card"
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
      {/* TOR — listed first to signal TOR + RAB are a pair, not RAB-centric */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 border border-blue-200 dark:border-blue-900 shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-xs text-slate-400 uppercase font-semibold block">Dokumen TOR:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate" title={hasTor ? torFileName : "Belum ada Dokumen TOR"}>
              {hasTor ? torFileName : "Belum ada Dokumen TOR"}
            </span>
            {hasTor && torFileSize && <span className="text-xs text-slate-400 dark:text-slate-500 font-mono block mt-0.5">{torFileSize} &bull; Format PDF</span>}
          </div>
        </div>
        {hasTor && (
          <button
            type="button"
            onClick={onPreviewTor}
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold cursor-pointer"
            title={`Pratinjau Dokumen TOR: ${torFileName}`}
            aria-label={`Pratinjau Dokumen TOR: ${torFileName}`}
          >
            <Eye className="w-3.5 h-3.5" /> Pratinjau
          </button>
        )}
      </div>

      {/* RAB */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 border border-rose-200 dark:border-rose-900 shrink-0">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-xs text-slate-400 uppercase font-semibold block">Dokumen RAB:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate" title={hasRab ? rabFileName : "Belum ada Dokumen RAB"}>
              {hasRab ? rabFileName : "Belum ada Dokumen RAB"}
            </span>
            {hasRab && rabFileSize && <span className="text-xs text-slate-400 dark:text-slate-500 font-mono block mt-0.5">{rabFileSize} &bull; Format PDF</span>}
          </div>
        </div>
        {hasRab && (
          <button
            type="button"
            onClick={onPreviewRab}
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-950/60 dark:hover:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 text-xs font-bold cursor-pointer"
            title={`Pratinjau Dokumen RAB: ${rabFileName}`}
            aria-label={`Pratinjau Dokumen RAB: ${rabFileName}`}
          >
            <Eye className="w-3.5 h-3.5" /> Pratinjau
          </button>
        )}
      </div>
    </div>
  );
}

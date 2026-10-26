# Airen — Scope Changes (old vs current)

## How this was compared

- **Old scope** = how `README.md`, `product.md`, `tech.md`, and `structure.md` describe Airen: a standalone RAB verification app.
- **Current scope** = `integration-context.md` and `json-integration.md`: the Airen frontend as a wireframe for the TOR and RAB review system, fed by JSON from `tor-rab-ai-reviewer`.
- This split is an **inference** from the file contents; the files carry no dates or version labels. The live site (`https://airen-id.vercel.app/`) is rendered by JavaScript and only its title, "Sistem Pengecekan RAB AI", could be read, so its present wording is **not** compared here.

## At a glance

| Aspect | Old scope | Current scope |
|---|---|---|
| **Product framing** | AI-assisted **RAB** verification app | Frontend wireframe of the **TOR and RAB** review system ("Sistem Ulasan TOR dan RAB") |
| **Documents reviewed** | RAB (PDF uploads) | **TOR + RAB** together, against a checklist and **reference documents** (dokumen acuan) |
| **Where the AI runs** | In Airen's own backend: `gemini_checker.py` calls **Google Gemini** on uploaded PDFs | In the **main repo** (`tor-rab-ai-reviewer`); Airen consumes its output as data. No review-result interface exists yet |
| **Data flow** | Upload PDF → Airen backend → Gemini → result | Main system produces **JSON** → Airen parses, validates, maps → UI |
| **Integration** | None; self-contained | **JSON file import now, live API later**; API list intentionally not fixed |
| **Backend** | FastAPI + PostgreSQL + Gemini, core to the product | Not mentioned as part of the integration; role next to JSON import is unstated |
| **Persistence** | PostgreSQL via API | Existing **localStorage** layer (`appStorage.ts`, `rab_app_*`) kept; imported JSON feeds the same in-memory/seed structures |
| **Screening / checklist** | "Verification criteria" and Master RO managed in Airen | **Checklist versions** with `screening_1_items` and `screening_2_items` (from `.xlsx`, exchanged as JSON) mapped to `MasterCriterion` / `ChecklistCriterion` |
| **Roles** | Satker, Verifikator, Super Admin | Main system: `super_admin`, `rocan`, `satker`. Airen `verifikator` ↔ `rocan` must be mapped deliberately, not assumed 1:1 |
| **Source of truth** | Airen itself | **Main repo**: `.kiro/specs/tor-rab-review-system/` and `docs/api/`; Airen must not edit them |
| **Maturity** | Presented as a working app | Wireframe; main system is a "development foundation"; contract is **DRAFT v1.0.0**, not implemented |
| **Deploy** | Frontend on Vercel (static); backend/DB on Railway | Unchanged |
| **Language / secrets rules** | Indonesian UI; secrets backend-only | Unchanged (plus: `VITE_*` ships to the browser) |

## What is new

- **TOR** is now a first-class document alongside RAB.
- **Reference documents** (`doc-acuan`) are part of what a review is checked against.
- **Two-stage screening** (`screening_1_items`, `screening_2_items`) appears in the checklist model.
- A **typed JSON import layer** (types + validation + one adapter per artifact) becomes the main integration work.
- The review request payload has a defined shape: documents (with `sha256`, `page_count`, opaque `storage_ref`), `program_context` (fiscal year, ministry/unit, program, activity, KRO, RO, objective, outputs), `budget_summary` (IDR), and **source locators** (`document_id` + 1-based `page`, verbatim `quote`) for traceability.
- Explicit **safety rules** for imported files: untrusted data, schema validation, reject unknown top-level fields, no crash on bad JSON.

## What is no longer the focus

- Airen **running the AI check itself** (Gemini on uploaded PDFs) as the product's core story.
- Airen owning the **end-to-end data lifecycle** through its own FastAPI/PostgreSQL stack.
- Coding against concrete HTTP endpoints. The endpoint inventory is "direction of travel" only, not a target.

## What did not change

- React 19 + TypeScript + Vite 8 + Tailwind CSS 4 frontend; Express static server for production.
- Frontend deployed on Vercel as a static site.
- Indonesian user-facing copy.
- Secrets only in the backend environment; `VITE_API_URL` is not a secret.
- Existing views: submission tables, Master RO view, verification-criteria table, user management.

## Contradictions inside the `website/` files (need your decision)

1. `README.md`, `product.md`, `tech.md` still say the **backend calls Gemini** on PDFs. `json-integration.md` says the current work is **JSON import** and that **no review-result interface exists**. Both cannot be the website's headline claim.
2. `structure.md` still lists `backend/` with `gemini_checker.py`. If the backend is out of the current story, it should not appear as a feature.
3. `product.md` lists "AI-driven document checking … via Gemini (backend only)" under *Core capabilities*; the current files say AI review is **not implemented** end to end in the main system.

## Implications for the website

Suggested changes, in order of importance (copy stays Indonesian on the site; short examples below):

1. **Title and tagline:** "Sistem Pengecekan RAB AI" covers RAB only. Current scope is **TOR dan RAB**.
   - Example: *"Airen — Antarmuka Ulasan TOR dan RAB berbantuan AI"*.
2. **Do not claim live AI review or Gemini analysis** unless that flow is confirmed to be live. Current files say there is no review-result API yet and the contract is a draft.
   - Example: *"Saat ini Airen menampilkan data hasil sistem Ulasan TOR dan RAB melalui impor berkas JSON; integrasi API menyusul."*
3. **Add the document types:** TOR, RAB, dokumen acuan, checklist (Screening 1 dan Screening 2), Master RO.
4. **Add a short "Alur data" section:** JSON dari sistem utama → validasi → pemetaan → tampilan. Mention "fase sekarang: impor JSON; fase berikutnya: API".
5. **Roles section:** use the main system's terms (Satker, Rocan/Verifikator, Super Admin) and avoid stating they are identical until confirmed.
6. **Status honesty:** label it as a wireframe / prototype in development, consistent with "development foundation" in the main repo.
7. **Remove or soften** the tech claim "Google Gemini for document analysis" and any feature list that implies the AI check runs inside Airen.
8. **Keep** the tech stack block (React, Vite, Tailwind, Vercel) as is.
9. **Do not publish** anything from the main repo's private details: local paths (`D:\Coding\...`), private repo link, internal storage paths, or real documents.

## Questions to confirm before editing the site

1. Is the **Gemini-backed analysis** still a public feature, or is AI review now only in the main system?
2. Does Airen's own **FastAPI/PostgreSQL backend** stay part of the product?
3. Are `rocan` and `verifikator` the same role for display purposes?
4. May the website name the main system ("Sistem Ulasan TOR dan RAB") and the AITF Komdigi x UGM program, or should it stay generic?
5. What does the **live site currently say**? Paste its text (or a screenshot), because it could not be read here, and I can turn this list into exact before/after copy.

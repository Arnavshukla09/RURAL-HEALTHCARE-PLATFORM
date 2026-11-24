# Contributing

Maintain secure, modular code and documentation backed by the implementation and scoped test evidence. Read [the architecture](docs/ARCHITECTURE.md), [database reference](docs/DATABASE.md) and [known limitations](docs/LIMITATIONS.md) before changing cross-cutting behavior.

---

## 1. Core Engineering & Security Invariants

1. **Append-Only Database Migrations:**
   - Historical migrations (`supabase/migrations/` up to baseline) are cryptographically locked via `supabase/migrations.sha256`.
   - Never modify or delete an existing migration file in-place.
   - All schema, policy, or function changes must be implemented as forward-only, append-only migrations with forward-chronological timestamps (`scripts/db/check_migration_immutability.mjs`).

2. **Single Authoritative Role Source:**
   - Authorization is derived **strictly from `public.patients.role`** (or trusted server-issued JWT claims).
   - **Never trust client-controlled data** (`user_metadata`, `raw_user_meta_data`, client request payloads) for role assignment, authorization checks, or RLS policies.
   - `public.handle_new_user()` must assign the `patient` role unconditionally on user signup.
   - Administrative and doctor role provisioning requires an authenticated database administrator or trusted service-role operation.

3. **Production Database Isolation:**
   - **Never run SQL, migrations, or scripts directly against production or any real Supabase project.**
   - All production schema changes and credential rotations must be delivered as tested, idempotent SQL runbooks for the project owner to execute.
   - Never run `supabase db reset` against any environment other than a disposable local test container.

4. **Testing & Behavioral Mutation Proofs:**
   - Security-critical tests (RLS policies, care-relationship scoping, concurrency controls) must include verifiable mutation proofs.
   - A mutation proof deliberately injects a realistic vulnerability, proves the test suite fails with exact error traces, and confirms restoration to clean pass.
   - Never skip tests, disable assertions, or weaken security policies to make CI green.

5. **Modularity & File-Size Standards:**
   - No non-ui component in `components/` or module in `lib/` may exceed **400 lines of code** (excluding pure data/translation catalogs).
   - Complex components must be modularized into feature directories (`components/<feature>/index.tsx`, `parts/`, `hooks/`, `types.ts`, `utils.ts`).
   - Route handlers in `app/api/**` must remain lean (<150 lines), delegating business logic to service modules in `lib/services/`.

---

## 2. Documentation Guidelines

Whenever authoring or updating documentation:
- **Keep documentation synchronized** with the code.
- **Preserve technical accuracy**; never invent features that are not implemented.
- **Explain WHY** decisions were made, not just WHAT exists.
- **Treat the repository as the source of truth.**
- **Clearly distinguish status:** Implemented, Partially implemented, Planned.
- Use GitHub Flavored Markdown with headings, tables, and Mermaid sequence/architecture diagrams where appropriate.

## 3. Local Workflow

1. Inspect `git status` and preserve unrelated local changes.
2. Keep edits within the affected feature. Preserve compatibility exports unless all consumers have been migrated.
3. Run `npm run check:components` for import/export, types, lint, unit tests, sealed migrations, unused files/dependencies and module limits.
4. Run `npm run check:docs`, `npm run check:boundaries` and `npm run check:publication` when changing documentation or client/server boundaries.
5. Run `npm run build` before proposing deployment. Database and authenticated browser verification require a disposable local stack; a skipped test is not a pass.
6. Record behavior changes and verification limits in [the changelog](docs/CHANGELOG.md). Keep historical audit evidence dated; do not rewrite old reports as new results.

There is no tracked pre-commit hook. These commands run explicitly and in GitHub Actions; a local Git commit alone does not execute them.

## 4. Repository Hygiene

- Commit application source, required public assets, migration history, reproducible generators, tests and useful technical documentation.
- Do not commit credentials, patient data, recordings, model weights, downloaded raw datasets, generated builds or local editor/tool state.
- Keep existing license, dataset/model attribution and incident history. Do not claim a different authorship or remove security disclosures for presentation purposes.
- Regenerate public assistant packs after changing their catalogs. Review generated diffs rather than removing assets that the offline application needs.
- Read [the repository maintenance guide](docs/REPOSITORY_MAINTENANCE.md) before deleting or relocating files.

For a code-first learning path, start with [the study guide](docs/STUDY_GUIDE.md).

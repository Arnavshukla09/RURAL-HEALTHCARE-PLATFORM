# Project Documentation & Engineering Guidelines

- **Role:** You are the long-term software engineering and security partner for this repository.
- **Primary Responsibility:** Maintain high-quality project documentation alongside secure, modular code.
- **No shallow summaries:** Documentation must be comprehensive, deep, and backed by verifiable code and CI evidence.

---

## 1. Core Engineering & Security Invariants

1. **Append-Only Database Migrations:**
   - Historical migrations (`supabase/migrations/` up to baseline) are cryptographically locked via `supabase/migrations.sha256`.
   - Never modify or delete an existing migration file in-place.
   - All schema, policy, or function changes must be implemented as forward-only, append-only migrations with forward-chronological timestamps (`scripts/check_migration_immutability.mjs`).

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

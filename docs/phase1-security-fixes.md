# Phase 1 — Critical Security Fixes

**Date:** June 18, 2026  
**Status:** In Progress  
**Audit Reference:** TECHNICAL_AUDIT.md → Phase 3 (Critical Findings)

---

## What We Are Fixing

### SEC1: Move Sensitive API Keys Server-Side

**Problem:** `VITE_GEMINI_API_KEY` and `VITE_AWS_LOCATION_SERVICE_API_KEY` are embedded in the client JavaScript bundle. Anyone can open browser DevTools and extract these keys, leading to API abuse and financial loss.

**Fix:** Create Vercel Serverless Functions (`api/gemini.ts`, `api/hospital-scraper.ts`) that hold the API keys server-side. Client code now calls our proxy endpoints instead of external APIs directly.

**Files Changed:**
- `api/gemini.ts` — NEW: Serverless proxy for Google Gemini API
- `api/hospital-scraper.ts` — NEW: Serverless proxy for AWS Location Service
- `src/lib/gemini.ts` — REWRITTEN: Uses fetch to call our `/api/gemini` endpoint instead of `@google/generative-ai` SDK
- `src/lib/hospitalScraper.ts` — REWRITTEN: Uses fetch to call our `/api/hospital-scraper` endpoint instead of direct AWS REST calls

**New Environment Variables (server-side only, NOT exposed to client):**
- `GEMINI_API_KEY` — Google Gemini API key (was `VITE_GEMINI_API_KEY`)
- `AWS_LOCATION_SERVICE_API_KEY` — AWS Location Service key (was `VITE_AWS_LOCATION_SERVICE_API_KEY`)
- `AWS_PLACES_INDEX` — AWS place index name (was `VITE_AWS_PLACES_INDEX`)

**Impact on Other Phases:**
- **Phase 2 (High):** The `@google/generative-ai` package can now be removed from `package.json` since the client no longer uses it directly. This saves ~15KB bundle size. (Task A2 partially addressed.)
- **Phase 3 (Medium):** When adopting TanStack Query (Task A2), the new `sendMessageToGemini` and `fetchHospitalsFromAWS` functions are already clean async functions that map directly to `useMutation`/`useQuery`.
- **Phase 5 (Production):** Vercel deployment is already configured. These serverless functions deploy automatically with `vercel.json`.

---

### SEC2: Enable Supabase Row Level Security

**Problem:** Supabase client uses the anon key. No RLS policies exist. Any user can read/modify any patient's data by crafting direct Supabase API calls.

**Fix:** SQL migration to enable RLS and add per-user policies. This must be applied via Supabase Dashboard SQL Editor.

**Documentation:** See `docs/sec2-rls-setup.md` for the complete SQL migration.

**Impact on Other Phases:**
- **Phase 2 (High):** After consolidating to Supabase-only (Task A1), RLS policies become the primary access control mechanism. Firebase Firestore removal is now safer because RLS provides the security boundary.
- **Phase 5 (Production):** RLS is mandatory before any production deployment.

---

### SEC3: Encrypt Aadhaar Numbers

**Problem:** Aadhaar numbers are stored as plaintext in Supabase and localStorage. Indian IT Act and Aadhaar Act require encryption of Aadhaar data.

**Fix:** AES-256-GCM encryption using the Web Crypto API. Aadhaar is encrypted before storage and decrypted on read. A SHA-256 hash is stored alongside for lookup without exposing the plaintext.

**Files Changed:**
- `src/lib/crypto.ts` — NEW: Encryption/decryption utility using Web Crypto API
- `src/lib/store.ts` — MODIFIED: patientStore.encrypts Aadhaar before Supabase write, decrypts on read

**New Environment Variable:**
- `VITE_AADHAAR_ENCRYPTION_KEY` — 32-character hex key for AES-256 encryption (client-side, but this is acceptable as it's a symmetric key for data-at-rest protection, not an API key)

**Impact on Other Phases:**
- **Phase 2 (High):** The `encryptAadhaar`/`decryptAadhaar` functions in `crypto.ts` are reusable. When consolidating backends, the encryption layer stays the same.
- **Phase 3 (Medium):** When fixing `any` types (Task Q2), the Supabase patient type will need an `aadhaar_encrypted: string` and `aadhaar_hash: string` field instead of `aadhaar: string`.
- **Phase 5 (Production):** The encryption key should be rotated periodically. The `crypto.ts` utility supports re-encryption with a new key.

---

## Issues Encountered

1. **`@google/generative-ai` SDK removal:** The client-side Gemini SDK (`@google/generative-ai`) is no longer needed after moving to the serverless proxy. However, removing it from `package.json` is deferred to Phase 2 to avoid breaking the build in this phase. The import in `gemini.ts` is removed, so tree-shaking will eliminate it.

2. **AWS Location Service URL construction:** The original code built the AWS REST API URL with the API key as a query parameter. The proxy now constructs this URL server-side, keeping the key out of the client bundle entirely.

3. **Web Crypto API availability:** The encryption utility uses `window.crypto.subtle` which is available in all modern browsers and in HTTPS contexts. Vercel serves over HTTPS by default, so this is safe. In local development over HTTP, `localhost` is treated as a secure context by browsers.

4. **Supabase schema change:** Adding `aadhaar_encrypted` and `aadhaar_hash` columns requires a Supabase migration. This is documented but not auto-applied — must be run manually via Dashboard or CLI.

---

## Verification Checklist

- [ ] `api/gemini.ts` and `api/hospital-scraper.ts` exist and compile
- [ ] `src/lib/gemini.ts` no longer imports `@google/generative-ai`
- [ ] `src/lib/hospitalScraper.ts` no longer references `VITE_AWS_LOCATION_SERVICE_API_KEY`
- [ ] `src/lib/crypto.ts` exports `encryptAadhaar`, `decryptAadhaar`, `hashAadhaar`
- [ ] `src/lib/store.ts` uses encryption for Aadhaar fields
- [ ] `src/lib/supabase.ts` does not fire connection check on import
- [ ] No `VITE_GEMINI_API_KEY` or `VITE_AWS_LOCATION_SERVICE_API_KEY` in client code
- [ ] Build succeeds with `npm run build`
- [ ] TypeScript check passes

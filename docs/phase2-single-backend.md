# Phase 2: Consolidate to Single Backend (Supabase)

**Date:** June 18, 2026  
**Status:** ✅ Completed

---

## What Was Done

### Problem
The codebase had a **dual-backend architecture** — Firebase Firestore AND Supabase — with no clear ownership boundary. This created:
- Data inconsistency risk between backends
- Maintenance burden maintaining two data layers
- Wasted bundle size from Firebase Firestore/Storage SDKs (~130KB)
- Confusion about which backend owned what data

### Solution
Consolidated to **Supabase as the sole data backend**, keeping Firebase Auth only (which is Supabase-compatible).

### Changes Made

| File | Action | Reason |
|------|--------|--------|
| `src/lib/firebase.ts` | **Modified** — Stripped to Auth + Analytics only | Removed Firestore, Storage, Functions initialization |
| `src/lib/firebaseDb.ts` | **Deleted** | Dead code — 0 imports found. Supabase already used for all data |
| `src/lib/firebaseStorage.ts` | **Deleted** | Dead code — 0 imports found. No file upload feature wired up |
| `src/hooks/useAuth.ts` | **Deleted** | Dead code — duplicate of `AuthContext.tsx`. Never imported |

### Why These Changes Were Safe

1. **`firebaseDb.ts` was already dead code:**
   - Code search found **0 imports** of `firebaseDb` across the entire codebase
   - `useNearbyHospitals.ts` already imported from `supabaseDb.ts` (not `firebaseDb.ts`)
   - The Firebase Firestore data layer was never actually used by any component

2. **`firebaseStorage.ts` was already dead code:**
   - Code search found **0 imports** of `firebaseStorage` across the entire codebase
   - No file upload feature was implemented or wired up
   - The Firebase Storage SDK was initialized but never used

3. **`useAuth.ts` was already dead code:**
   - Code search found **0 imports** of `useAuth` across the entire codebase
   - `AuthContext.tsx` already provided the same functionality via React Context
   - The hook duplicated `onAuthStateChanged` listener (creating 2 listeners)

4. **`firebase.ts` cleanup was safe:**
   - Only `firebaseAuth.ts`, `LoginPage.tsx`, `SignupPage.tsx`, and `AuthContext.tsx` import from `firebase.ts`
   - All of them only use `auth` (Firebase Auth) — none use `db`, `storage`, or `functions`
   - Removing Firestore/Storage/Functions initialization had no effect on existing code

---

## Cross-Phase Impact

### Phase 1 (Critical Security) — No Impact
- Serverless proxies (`api/gemini.ts`, `api/hospital-scraper.ts`) are independent of Firebase/Supabase choice
- Aadhaar encryption (`crypto.ts`) encrypts before Supabase storage — unaffected
- RLS policies (`docs/sec2-rls-setup.md`) are Supabase-only — unaffected

### Phase 3 (Medium Priority) — Positive Impact
- **Q2 (Fix `any` types):** Easier with single backend. Supabase types can be generated once
- **A2 (TanStack Query):** Easier with single backend. No need to choose which backend to cache
- **Q5 (Standardize error handling):** Only Supabase error patterns to handle

### Phase 5 (Production Readiness) — Positive Impact
- **CI/CD:** Single backend = simpler test setup
- **Offline write queue:** Only Supabase writes to queue
- **Test suite:** Only Supabase mocking needed

---

## Remaining Firebase Usage

After Phase 2, Firebase is used **only** for:

| Service | Purpose | Files |
|---------|---------|-------|
| Firebase Auth | Phone OTP, Google, Email/Password auth | `firebaseAuth.ts`, `LoginPage.tsx`, `SignupPage.tsx` |
| Firebase Analytics | Usage analytics (optional) | `firebase.ts` (conditional) |

All data operations go through Supabase:
- Patient profiles → `store.ts` → Supabase `patients` table
- Appointments → `store.ts` → Supabase `appointments` table  
- Medical reports → `store.ts` → Supabase `medical_reports` table
- Hospital cache → `supabaseDb.ts` → Supabase `hospitals` table

---

*Phase 2 completed — June 18, 2026*

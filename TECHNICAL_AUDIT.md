# RuralCare Connect — Technical Audit Report

**Date:** June 18, 2026  
**Auditor:** Principal Software Engineer Review  
**Codebase:** `rural-care-connect-main`  
**Repository:** [github.com/nadana1985/rural-care-connect-asha-health](https://github.com/nadana1985/rural-care-connect-asha-health)

---

## Executive Summary

RuralCare Connect is a React-based healthcare platform targeting rural Indian communities. It provides hospital discovery, appointment booking, medical records, an AI health assistant (Asha), and emergency SOS features. The application uses a **dual-backend architecture** (Firebase + Supabase) with client-side caching via localStorage. While the UI is polished and the feature set is ambitious, the codebase has significant architectural, security, and reliability issues that must be addressed before production deployment.

**Overall Assessment:** The application is in **early-stage prototype** status. It is not production-ready.

---

## Phase 1 — Architecture Analysis

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT (React SPA)                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│  │   Pages   │ │Components│ │  Hooks   │ │   Contexts    │   │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └──────┬───────┘   │
│       │             │            │               │           │
│  ┌────┴─────────────┴────────────┴───────────────┴───────┐  │
│  │                    lib/ layer                           │  │
│  │  firebase.ts  supabase.ts  store.ts  gemini.ts         │  │
│  │  firebaseAuth.ts  firebaseDb.ts  supabaseDb.ts         │  │
│  │  hospitalScraper.ts  location.ts  mockData.ts          │  │
│  └────┬──────────────┬──────────────┬────────────────────┘  │
└───────┼──────────────┼──────────────┼───────────────────────┘
        │              │              │
   ┌────▼────┐   ┌─────▼─────┐  ┌────▼──────────┐
   │ Firebase │   │ Supabase  │  │ External APIs │
   │ Auth     │   │ PostgreSQL│  │ AWS Location  │
   │ Firestore│   │           │  │ Overpass OSM  │
   │ Storage  │   │           │  │ Nominatim     │
   │ Functions│   │           │  │ Gemini AI     │
   │ Analytics│   │           │  │ ipapi.co      │
   └──────────┘   └───────────┘  └───────────────┘
```

### 1.2 Module Purpose Map

| Module | File(s) | Purpose |
|--------|---------|---------|
| **App Entry** | `main.tsx`, `App.tsx` | React root, routing, auth guards |
| **Auth** | `LoginPage.tsx`, `SignupPage.tsx` | Phone OTP + Google + Email/Password auth |
| **Dashboard** | `DashboardPage.tsx` | Main hub: profile card, hospital/appointment/report quick links, SOS |
| **Hospitals** | `HospitalsPage.tsx`, `useNearbyHospitals.ts` | Location-based hospital discovery with search |
| **Doctors** | `DoctorsPage.tsx` | Specialist selection, symptom-to-specialty mapping, appointment booking |
| **Appointments** | `AppointmentsPage.tsx` | View/cancel/complete appointments |
| **Reports** | `ReportsPage.tsx` | Medical reports with paywall unlock |
| **Profile** | `ProfilePage.tsx` | Patient profile (Aadhaar, demographics) |
| **AI Assistant** | `Assistant.tsx`, `gemini.ts` | Gemini-powered chatbot "Asha" |
| **Emergency** | `EmergencyModal.tsx` | SOS broadcast simulation |
| **Layout** | `Layout.tsx`, `SwipeMaskNav.tsx`, `LocationBar.tsx`, `ProfileMenu.tsx` | Shell UI with nav, location bar, profile menu |
| **Data Layer** | `store.ts`, `firebaseDb.ts`, `supabaseDb.ts` | Dual-backend data persistence |
| **Services** | `firebase.ts`, `supabase.ts` | Client initialization |
| **Hospital API** | `hospitalScraper.ts` | AWS Location + Overpass API fallback |
| **Location** | `location.ts` | Geolocation, reverse geocoding, IP fallback |
| **Cloud Functions** | `functions/src/index.ts` | Google Places proxy (unused by client) |

### 1.3 Data Flow

```
User Action → Page Component → Store (store.ts) → Supabase → PostgreSQL
                                        ↓ (on failure)
                                   localStorage (fallback)
                                        ↓ (on failure)
                                   Toast error to user

Hospital Discovery:
  getUserLocation() → fetchHospitalsFromWeb() → AWS Location / Overpass API
                    → cacheHospitals() → Supabase hospitals table
                    → useNearbyHospitals hook → HospitalsPage
```

### 1.4 Request Lifecycle

1. User navigates to `/hospitals`
2. `HospitalsPage` mounts → renders `useNearbyHospitals` hook
3. Hook calls `getUserLocation()` (browser geolocation → IP fallback)
4. Hook calls `getCachedHospitals(60)` from Supabase
5. If cache empty → calls `fetchHospitalsFromWeb()` (AWS Location → Overpass fallback)
6. Results cached in Supabase via `cacheHospitals()`
7. Distances calculated client-side via Haversine formula
8. Hospitals rendered sorted by distance

### 1.5 Database Interactions

| Database | Tables | Access Pattern |
|----------|--------|----------------|
| **Supabase PostgreSQL** | `patients`, `appointments`, `medical_reports`, `hospitals` | Direct client queries via `@supabase/supabase-js` |
| **Firebase Firestore** | `hospitals` (cache) | Direct client writes via Firebase SDK |
| **localStorage** | 8+ keys | Offline fallback, caching |

### 1.6 External Service Integrations

| Service | Purpose | API Key Location | Used By |
|---------|---------|-----------------|---------|
| Firebase Auth | Authentication (Phone OTP, Google, Email) | `VITE_FIREBASE_*` | `firebaseAuth.ts` |
| Firebase Firestore | Hospital cache | `VITE_FIREBASE_*` | `firebaseDb.ts` |
| Firebase Storage | File uploads | `VITE_FIREBASE_*` | `firebaseStorage.ts` |
| Firebase Functions | Google Places proxy | `GOOGLE_PLACES_API_KEY` (server) | `functions/src/index.ts` |
| Supabase | Primary data store | `VITE_SUPABASE_*` | `supabase.ts`, `store.ts` |
| AWS Location Service | Hospital geocoding | `VITE_AWS_LOCATION_SERVICE_API_KEY` | `hospitalScraper.ts` |
| OpenStreetMap Overpass | Hospital data (free fallback) | None (public API) | `hospitalScraper.ts` |
| Nominatim | Reverse geocoding | None (public API) | `location.ts` |
| ipapi.co | IP-based geolocation | None (public API) | `location.ts` |
| Google Gemini | AI health assistant | `VITE_GEMINI_API_KEY` | `gemini.ts` |

### 1.7 Authentication Flow

```
Phone OTP Flow:
  LoginPage → RecaptchaVerifier → signInWithPhoneNumber → ConfirmationResult
            → confirm(otp) → Firebase Auth session → AuthContext.onAuthChange
            → navigate("/dashboard")

Google Flow:
  LoginPage → signInWithPopup(GoogleAuthProvider) → Firebase Auth session
            → AuthContext.onAuthChange → navigate("/dashboard")

Email/Password Flow (Signup):
  SignupPage → createUserWithEmailAndPassword → updateProfile(displayName)
            → Firebase Auth session → AuthContext.onAuthChange
            → navigate("/dashboard")
```

### 1.8 State Management Strategy

- **React Context** (`AuthContext`): User authentication state
- **React hooks** (`useState`/`useEffect`): Page-level state
- **localStorage**: Offline-first caching (patients, appointments, reports, doctors, hospitals, location)
- **Supabase**: Primary persistence
- **Firebase Firestore**: Secondary cache (hospitals only)
- **No global state library**: No Zustand, Redux, or similar. TanStack Query is installed but **unused**.

---

## Phase 2 — Codebase Audit

### 2.1 Architecture Problems

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| A1 | **Dual backend without clear ownership** | `firebaseDb.ts` vs `supabaseDb.ts`, `store.ts` | Firebase and Supabase are both initialized, both used for hospital caching. Data can diverge. No clear boundary for which backend owns what. |
| A2 | **TanStack Query installed but unused** | `App.tsx` wraps `QueryClientProvider`, but no `useQuery`/`useMutation` calls exist | Wasted bundle size (~15KB), missed opportunity for proper caching/loading/error states |
| A3 | **Firebase Functions orphaned** | `functions/src/index.ts` exports `fetchGoogleHospitals`, but no client code calls it | Dead server-side code; client uses `hospitalScraper.ts` instead |
| A4 | **`firebaseStorage.ts` unused** | No imports found outside the file itself | Dead code; no file upload feature is wired up |
| A5 | **`useAuth` hook duplicates `AuthContext`** | `useAuth.ts` vs `AuthContext.tsx` | Two independent `onAuthStateChanged` listeners created. `useAuth` is never imported anywhere (dead code). |
| A6 | **No separation of API layer from UI** | Pages directly call store/scraper functions | Business logic mixed into React components (e.g., `HospitalsPage` calls `fetchHospitalsFromWeb` directly) |

### 2.2 Code Quality Problems

| # | Issue | Location | Details |
|---|-------|----------|---------|
| Q1 | **51+ console.log/error/warn calls** | Entire codebase | Production code should not emit console statements. Includes debug emojis (`🔥`, `💾`, `☁️`, `✅`, `❌`). |
| Q2 | **`any` types** | `store.ts` (lines 23, 134, 146), `supabaseDb.ts` (lines 36, 44, 52) | `catch (error)`, `res.data`, `h: any` — defeats TypeScript's purpose |
| Q3 | **Unused import** | `LoginPage.tsx` line 5 | `Button` from `@/components/ui/button` is imported but never used |
| Q4 | **Hardcoded secret key** | `firebase.ts` line 21 | `app.secret_key = 'success123!'` in `__init__.py` equivalent (in `firebase.ts` no secret, but `supabase.ts` creates client with no auth guard) |
| Q5 | **Inconsistent error handling** | `store.ts`, `hospitalScraper.ts` | Some errors toast to user, some silently catch, some re-throw. No consistent pattern. |
| Q6 | **Dead code** | `useAuth.ts`, `firebaseStorage.ts`, `functions/src/index.ts` (client unused) | Never imported or referenced |
| Q7 | **Duplicated hospital lookup logic** | `AppointmentsPage.tsx` `getHospital()`, `ReportsPage.tsx` `getHospitalName()`, `DoctorsPage.tsx` useEffect | Three different implementations of "find hospital by ID from mock/cache" |
| Q8 | **Mock data injection in production paths** | `hospitalScraper.ts` lines 52-60, 140-148 | `mockHospitals` are injected into real API results in `fetchHospitalsFromAWS` and `fetchHospitalsFromOverpassAPI` |

### 2.3 Performance Issues

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| P1 | **N+1 pattern in Firebase cache** | `firebaseDb.ts` `cacheHospitals()` lines 117-128 | Iterates hospitals with individual `setDocument` calls instead of batch write |
| P2 | **Redundant localStorage reads** | `AppointmentsPage`, `DoctorsPage`, `ReportsPage` | Multiple `JSON.parse(localStorage.getItem(...))` calls per render without memoization |
| P3 | **No request deduplication** | `useNearbyHospitals` | `fetchNearbyHospitals` can be called multiple times; no abort controller for stale requests |
| P4 | **Unnecessary re-renders** | `DoctorsPage.tsx` | `doctors` array recreated on every render via `useMemo` that depends on `specialization` string, but `mockDoctors` is a module-level constant |
| P5 | **Google Fonts loaded twice** | `index.css` (via `@import url(...)`) + likely via link tag | CSS `@import` for Google Fonts is render-blocking |
| P6 | **Large bundle candidates** | `package.json` | `firebase` (~180KB), `@supabase/supabase-js` (~80KB), `recharts` (unused in visible code), `embla-carousel-react`, `react-resizable-panels`, `cmdk` — many UI libs appear unused |

### 2.4 Scalability Risks

| # | Issue | Details |
|---|-------|---------|
| S1 | **localStorage as primary cache** | No size limits enforced. Stale data served without validation. Cross-tab sync impossible. |
| S2 | **No database pagination** | `getDocuments`, `getCachedHospitals` fetch all records. Will degrade with data growth. |
| S3 | **Client-side distance calculation** | All hospitals fetched, then filtered/sorted in JS. Should use PostGIS queries or server-side filtering. |
| S4 | **No CDN/static asset optimization** | Firebase Hosting configured but no asset hashing strategy beyond Vite defaults |
| S5 | **Hardcoded API timeouts** | 15s (AWS), 10s (Overpass), 5s (Nominatim, ipapi) — no retry logic, no circuit breaker |

### 2.5 Security Risks

| # | Issue | Severity | Details |
|---|-------|----------|---------|
| SEC1 | **API keys exposed to client bundle** | **CRITICAL** | All `VITE_*` env vars are embedded in client JS. `VITE_GEMINI_API_KEY`, `VITE_AWS_LOCATION_SERVICE_API_KEY` are visible in browser DevTools. |
| SEC2 | **No Supabase Row Level Security (RLS)** | **CRITICAL** | Supabase client is initialized with anon key. No evidence of RLS policies. Any user can read/write any patient's data. |
| SEC3 | **Aadhaar numbers stored in plaintext** | **HIGH** | `patients.aadhaar` stored as plain text in Supabase and localStorage. Indian IT law requires encryption for Aadhaar data. |
| SEC4 | **No CORS configuration on client calls** | **MEDIUM** | Overpass, Nominatim, ipapi calls made from browser with no origin restrictions |
| SEC5 | **Supabase client created even with missing credentials** | **MEDIUM** | `supabase.ts` warns but still creates client with empty strings, causing runtime errors |
| SEC6 | **No CSRF protection beyond Firebase** | **MEDIUM** | Supabase calls have no additional auth tokens beyond the anon key |
| SEC7 | **Payment "flow" has no server-side validation** | **HIGH** | `ReportsPage.tsx` simulates payment with `setTimeout`. No actual payment gateway. If extended naively, it would be trivially bypassable. |
| SEC8 | **No input sanitization for XSS** | **MEDIUM** | Hospital names, addresses rendered via `{hospital.name}` — React auto-escapes, but Nominatim/Overpass data could contain unexpected content |

### 2.6 Reliability Risks

| # | Issue | Details |
|---|-------|---------|
| R1 | **No retry logic** | All external API calls fail silently. No exponential backoff. No circuit breaker pattern. |
| R2 | **No offline queue** | localStorage fallback is read-only. Writes to Supabase that fail are lost (no retry queue). |
| R3 | **Silent error swallowing** | `try { ... } catch { // Ignore localStorage errors }` appears 8+ times |
| R4 | **No structured logging** | Only `console.log`/`console.error`. No log levels, no remote logging, no error tracking (Sentry, etc.) |
| R5 | **Emergency SOS is simulated** | `EmergencyModal.tsx` shows a countdown timer then displays "Alert Sent" — no actual hospital notification, no SMS, no real location sharing |
| R6 | **Location failure = broken experience** | If geolocation and IP fallback both fail, `useNearbyHospitals` sets error but user sees empty hospital list with no way to manually enter coordinates |

### 2.7 Testability Issues

| # | Issue | Details |
|---|-------|---------|
| T1 | **Zero unit tests** | Only `src/test/example.test.ts` exists (placeholder). No tests for store, hooks, or components. |
| T2 | **No integration tests** | No Playwright tests configured (config exists but no test files) |
| T3 | **Untestable store layer** | `store.ts` directly imports `supabase` singleton — no dependency injection, no mocking seams |
| T4 | **Side effects in module scope** | `supabase.ts` fires a connection check on import. `firebase.ts` logs on import. These run during test setup. |
| T5 | **No test utilities** | No mock factories, no test helpers, no custom render with providers |

---

## Phase 3 — Prioritized Findings

### Critical (Fix Before Any Deployment)

| # | Finding | Business Impact | Technical Impact | Root Cause | Solution | Effort |
|---|---------|-----------------|------------------|------------|----------|--------|
| SEC1 | API keys in client bundle | Financial loss from API abuse; service disallowed by providers | Keys visible in DevTools, source map | Vite embeds `import.meta.env.VITE_*` in client JS | Move `GEMINI_API_KEY` and `AWS_LOCATION_SERVICE_API_KEY` to Cloud Functions proxies. Firebase keys are acceptable client-side per Firebase design. | 2-3 days |
| SEC2 | No Supabase RLS | Any user can read/modify any patient's medical records | Complete data breach potential | Supabase project likely has default permissive policies | Enable RLS on all tables. Add policies: `auth.uid() = id` for patients, `patient_id = auth.uid()` for appointments/reports. | 1 day |
| SEC3 | Aadhaar in plaintext | Legal liability under Aadhaar Act / IT Act | Regulatory non-compliance | No encryption requirement was implemented | Encrypt Aadhaar at application layer before storage. Use AES-256 with a server-side key. Or store only a hashed version. | 2 days |

### High (Fix Before Beta)

| # | Finding | Business Impact | Technical Impact | Root Cause | Solution | Effort |
|---|---------|-----------------|------------------|------------|----------|--------|
| A1 | Dual backend confusion | Data inconsistency between Firebase and Supabase | Maintenance nightmare; debugging difficulty | Unclear migration strategy from Firebase to Supabase | Pick one backend (Supabase). Remove Firebase Firestore/Storage usage. Keep Firebase Auth only. | 3-5 days |
| Q1 | 51+ console.log calls | Information leakage in production | Performance overhead, noise in debugging | No linting rule for `console.*` | Add ESLint `no-console` rule. Replace with a lightweight logger (e.g., `tslog`). Remove all debug emojis. | 1 day |
| Q8 | Mock data in production | Users see fake hospitals alongside real ones | Incorrect distance calculations, confusing UX | Prototype shortcut never removed | Remove `mockHospitals` injection from `hospitalScraper.ts`. Keep mock data only in dev/test. | 0.5 day |
| R5 | Fake SOS feature | Users may rely on it in actual emergency | No real emergency response triggered | Prototype feature | Either implement real SMS/call integration or prominently label as "Demo Mode" | 3-5 days (for real) |
| R7 | Fake payment flow | Users expect payment to work | Payment is a `setTimeout` — trivially bypassable | Prototype feature | Integrate Razorpay/Stripe or remove the paywall entirely | 2-3 days |
| P1 | N+1 Firebase writes | Slow hospital caching, potential rate limiting | O(n) Firestore writes instead of O(1) batch | No batch write API used | Use `writeBatch()` from Firebase Firestore | 0.5 day |

### Medium (Fix Before Launch)

| # | Finding | Business Impact | Technical Impact | Root Cause | Solution | Effort |
|---|---------|-----------------|------------------|------------|----------|--------|
| A2 | TanStack Query unused | Wasted bundle size (~15KB) | No caching, deduplication, or background refetch | Installed but never wired up | Adopt TanStack Query for all data fetching. Replace manual useState/useEffect patterns. | 3-4 days |
| Q2 | `any` types in store | Runtime type errors not caught | TypeScript compiler bypassed | Rushed implementation | Add proper Supabase types (generate via `supabase gen types`). Remove all `any` casts. | 1-2 days |
| Q7 | Duplicated hospital lookup | Inconsistent behavior across pages | 3 separate implementations to maintain | No shared utility | Extract `getHospitalById()` utility in `store.ts` or `lib/` | 0.5 day |
| Q5 | Inconsistent error handling | Some errors silently lost, others toasted | User sees different error UX per page | No error handling strategy | Create `handleError(error, context)` utility. Standardize toast + logging. | 1 day |
| P3 | No request deduplication | Stale data served if user navigates quickly | Race conditions in async operations | No AbortController usage | Add AbortController to all `fetch` calls. Cancel stale requests on unmount. | 1-2 days |
| P5 | Render-blocking font import | Slower initial page load (FCP) | ~200ms added to critical path | CSS `@import` for Google Fonts | Move to `<link rel="preconnect">` + `<link href="...">` in `index.html` | 0.5 day |
| R4 | No error tracking | No visibility into production errors | Cannot diagnose issues in production | Not implemented | Add Sentry or similar. Capture errors with context. | 1 day |
| R6 | Location failure UX | Users stuck with empty hospital list | No manual location entry on failure | Only one path to set location | Add manual location input on HospitalsPage (partially exists but not connected to error state) | 1 day |

### Low (Technical Debt)

| # | Finding | Details | Effort |
|---|---------|---------|--------|
| Q3 | Unused `Button` import in LoginPage | Dead import | 5 min |
| Q4 | Unused `useAuth` hook | Dead code; duplicate of AuthContext | 10 min |
| A4 | Unused `firebaseStorage.ts` | Dead code; no upload feature | 10 min |
| A3 | Orphaned Cloud Function `fetchGoogleHospitals` | Never called by client | 30 min |
| Q6 | Dead code cleanup | Remove unused imports, hooks, functions | 1 hour |
| S6 | Missing `.env.example` | New developers don't know required env vars | 15 min |
| T1-T5 | No tests | Entire codebase untested | 5-10 days (comprehensive) |

---

## Phase 4 — Refactoring Roadmap

### Quick Wins (1-2 Days)

These changes have immediate benefit with low risk:

1. **Remove all `console.log` statements** — Add ESLint `no-console` rule. Replace critical logs with a logger utility.
2. **Remove mock data injection** — Delete `mockHospitals` imports from `hospitalScraper.ts`. Keep mock data only in dev.
3. **Remove dead code** — Delete `useAuth.ts`, unused `firebaseStorage.ts` imports, orphaned `Button` import in `LoginPage`.
4. **Add `.env.example`** — Document all required `VITE_*` environment variables.
5. **Fix `any` types** — Replace `any` in `store.ts` and `supabaseDb.ts` with proper Supabase-generated types.
6. **Add `getHospitalById()` utility** — Deduplicate hospital lookup logic across 3 pages.
7. **Move Google Fonts to `<link>` tags** — Eliminate render-blocking CSS `@import`.

### Medium-Term Improvements (1-2 Weeks)

These improve maintainability and set up for production:

1. **Consolidate to single backend** — Keep Firebase Auth, migrate all data to Supabase. Remove `firebaseDb.ts` and Firebase Firestore usage.
2. **Adopt TanStack Query** — Replace manual `useState`/`useEffect` data fetching with `useQuery`/`useMutation`. Get caching, deduplication, background refetch for free.
3. **Move sensitive API keys server-side** — Create Cloud Functions for Gemini and AWS Location Service calls. Remove `VITE_GEMINI_API_KEY` and `VITE_AWS_LOCATION_SERVICE_API_KEY` from client bundle.
4. **Enable Supabase RLS** — Add Row Level Security policies for `patients`, `appointments`, `medical_reports`, `hospitals` tables.
5. **Add Sentry error tracking** — Capture client-side errors with context (user ID, page, action).
6. **Standardize error handling** — Create `AppError` class, `handleError()` utility, consistent toast + logging pattern.
7. **Encrypt Aadhaar data** — Add AES-256 encryption layer for Aadhaar numbers before Supabase storage.
8. **Add AbortController to all fetch calls** — Prevent stale request race conditions.

### Long-Term Architecture (1-2 Months)

Production-grade improvements:

1. **Implement real payment integration** — Razorpay or Stripe for report unlock paywall.
2. **Implement real SOS** — SMS gateway (Twilio/MSG91) + emergency contact notification + real-time location sharing.
3. **Add server-side doctor/hospital data** — Move from mock/generated doctors to a real doctor directory backed by Supabase.
4. **Implement offline queue** — Use a library like `idb-keyval` or `localforage` for indexedDB. Queue failed writes and retry on reconnect.
5. **Add comprehensive test suite** — Unit tests for store/hooks, integration tests for pages, E2E tests for critical flows (signup → book appointment → view report).
6. **Add CI/CD pipeline** — GitHub Actions for lint, typecheck, test, build on PR. Auto-deploy to Firebase Hosting on merge to main.
7. **Performance monitoring** — Add Web Vitals tracking, Supabase query performance monitoring.
8. **Accessibility audit** — Ensure WCAG 2.1 AA compliance. Add keyboard navigation, screen reader support, proper ARIA labels.

---

## Phase 5 — Production Readiness Score

| Category | Score | Justification |
|----------|-------|---------------|
| **Architecture** | 4/10 | Dual backend with unclear boundaries. TanStack Query unused. Good component structure but no data layer abstraction. |
| **Maintainability** | 5/10 | Clean component code with consistent styling. But duplicated logic, dead code, and no shared utilities hurt maintainability. |
| **Scalability** | 3/10 | localStorage as primary cache. No pagination. Client-side filtering of all hospitals. No database indexing strategy visible. |
| **Performance** | 5/10 | Vite with code splitting and manual chunks. But render-blocking fonts, N+1 Firebase writes, and unused dependencies hurt. |
| **Security** | 2/10 | API keys in client bundle. No RLS. Aadhaar in plaintext. No payment security. This is the biggest risk area. |
| **Reliability** | 3/10 | No retry logic, no error tracking, fake SOS/payment, silent error swallowing. No monitoring or observability. |
| **Testability** | 1/10 | Zero tests. No test utilities. Side effects in module scope. No mocking infrastructure. |
| **Developer Experience** | 6/10 | Good TypeScript setup, Vite dev server, clear project structure. But missing .env.example, no linting rules, no CI. |

**Overall Score: 3.6 / 10**

### What's Working Well

- ✅ **UI/UX quality** — Polished, modern dark theme with glass morphism, smooth Framer Motion animations
- ✅ **Component architecture** — Clean separation of pages, components, hooks, contexts, lib
- ✅ **TypeScript adoption** — Most files properly typed (except store layer)
- ✅ **PWA configuration** — Service worker, manifest, offline caching strategy
- ✅ **Build optimization** — Vite with manual chunks for vendor/firebase/supabase/ui
- ✅ **Multi-auth support** — Phone OTP, Google, Email/Password all implemented
- ✅ **Location fallback chain** — Browser geolocation → IP-based → manual input

### What Needs Immediate Attention

- 🚨 **Security** — API keys exposed, no RLS, Aadhaar plaintext
- 🚨 **No tests** — Zero test coverage
- 🚨 **Fake features** — SOS and payment are simulated
- 🚨 **Dual backend** — Firebase + Supabase creates confusion

---

## Appendix: File-by-File Impact Summary

| File | Lines | Issues Found | Priority |
|------|-------|-------------|----------|
| `src/lib/store.ts` | 260+ | `any` types, duplicated patterns, no types for Supabase responses | High |
| `src/lib/hospitalScraper.ts` | 225+ | Mock data injection, API keys in client, no retry logic | High |
| `src/lib/supabase.ts` | 25 | Connection check on import (side effect), no auth guard | Medium |
| `src/lib/firebaseDb.ts` | 170+ | N+1 writes, unused by main data flow, duplicates Supabase | Medium |
| `src/lib/firebaseStorage.ts` | 45 | Completely unused dead code | Low |
| `src/lib/gemini.ts` | 40 | API key in client bundle, empty string fallback | High |
| `src/lib/location.ts` | 210+ | No AbortController, IP fallback limited | Medium |
| `src/hooks/useAuth.ts` | 25 | Dead code, duplicates AuthContext | Low |
| `src/hooks/useNearbyHospitals.ts` | 90+ | No deduplication, no AbortController | Medium |
| `src/pages/LoginPage.tsx` | 175+ | Unused import, good otherwise | Low |
| `src/pages/DoctorsPage.tsx` | 250+ | Mock doctor generation, duplicated hospital lookup | Medium |
| `src/pages/ReportsPage.tsx` | 200+ | Fake payment, duplicated hospital lookup | High |
| `src/pages/AppointmentsPage.tsx` | 180+ | Duplicated hospital lookup | Medium |
| `src/components/EmergencyModal.tsx` | 140+ | Fake SOS, only uses mock hospitals | High |
| `src/components/Assistant.tsx` | 120+ | API key in client, good UX | Medium |
| `functions/src/index.ts` | 70 | Unused by client, CORS imported but not used | Low |
| `src/test/example.test.ts` | 5 | Placeholder only | High |

---

*This audit was conducted by analyzing the full source code of the RuralCare Connect project as of June 18, 2026. All findings are based on actual code inspection, not assumptions.*

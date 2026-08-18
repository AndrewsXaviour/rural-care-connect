# RuralCare Connect — Project Specification

> **Source of truth: the code.** This document describes the project as it actually exists in the repository (`rural-care-connect-main`), verified against source on **August 18, 2026**. Where this document conflicts with earlier audit/planning docs, the code wins.

**Repository:** [github.com/nadana1985/rural-care-connect-asha-health](https://github.com/nadana1985/rural-care-connect-asha-health)

---

## 1. Product Summary

RuralCare Connect is a mobile-first web application (React SPA, installable as a PWA) that connects rural Indian users with nearby healthcare:

- **Find hospitals** near their current location or a searched city
- **Book appointments** with doctors, guided by a symptom → specialty mapping
- **View medical reports** (₹10 unlock per report)
- **Chat with "Asha"**, a Gemini-powered health assistant
- **Trigger an emergency SOS** that calls 108, shares GPS, and SMS-alerts saved emergency contacts
- **Maintain a patient profile** (Aadhaar, blood group, demographics, emergency contacts)

It is designed for **low connectivity**: reads and writes are mirrored to local storage, failed writes queue in IndexedDB and retry when the network returns.

## 2. Project Goals (as evidenced by code)

1. **Accessible healthcare discovery** for rural/semi-urban India (Vernacular-friendly UI language, simple flows, India-specific emergency numbers).
2. **Offline resilience** — localStorage mirrors, IndexedDB write queue, graceful API fallbacks.
3. **Privacy & compliance** — Aadhaar encrypted at rest (AES-256-GCM), Supabase RLS, API keys kept server-side.
4. **Production-readiness practices** — Sentry error tracking + web vitals, PWA, unit tests, CI/CD, accessibility affordances.

## 3. Feature Inventory (implemented in code)

| Feature | Status | Where |
|---------|--------|-------|
| Phone OTP login (Firebase, +91, reCAPTCHA) | ✅ | `LoginPage`, `firebaseAuth.ts` |
| Google login (popup) | ✅ | `LoginPage` |
| Email/password signup | ✅ | `SignupPage` |
| Email/password login + password reset helpers | ⚠️ functions exist, not wired to UI | `firebaseAuth.ts` |
| Patient profile (demographics, Aadhaar, blood group, emergency contacts) | ✅ | `ProfilePage`, `store.ts` |
| Location-based hospital discovery (GPS → IP → manual search) | ✅ | `HospitalsPage`, `useNearbyHospitals`, `location.ts` |
| Hospital sources: AWS Location proxy → Overpass OSM → mock data | ✅ | `hospitalScraper.ts`, `api/hospital-scraper.ts` |
| Symptom → specialty suggestion | ✅ | `DISEASE_SPECIALIZATION` in `mockData.ts` |
| Doctor list + booking (date, time slot) | ✅ (mock/generated doctors) | `DoctorsPage` |
| Appointments timeline, mark-complete → auto report | ✅ | `AppointmentsPage`, `store.ts` |
| Medical reports with ₹10 unlock (Razorpay / demo) | ✅ (client-side unlock only) | `ReportsPage`, `razorpay.ts` |
| AI assistant "Asha" (Gemini via proxy) | ✅ | `Assistant`, `api/gemini.ts` |
| Emergency SOS: tel:108 + Web Share + SMS (Vonage/demo) | ✅ | `EmergencyModal`, `api/send-sms.ts` |
| Aadhaar encryption (AES-256-GCM) + hash lookup | ✅ | `crypto.ts` |
| Offline write queue (IndexedDB, 5 retries) | ✅ | `offlineQueue.ts`, `store.ts` |
| Sentry errors + web vitals | ✅ | `main.tsx`, `errors.ts` |
| PWA (manifest, service worker, font caching) | ✅ | `vite.config.ts` |
| Unit tests (Vitest) | ✅ | `src/**/__tests__` |
| CI/CD (lint → typecheck → test → build) | ✅ | `.github/workflows/ci.yml` |
| Playwright E2E harness | ⚠️ config only, no specs | `playwright.config.ts` |
| Supabase RLS | ⚠️ documented SQL, manual apply | `docs/sec2-rls-setup.md` |
| Server-side doctor/hospital directory | ❌ not implemented (mock/generated data) | — |

## 4. Tech Stack (from `package.json` / configs)

- **Frontend:** React 18 + TypeScript + Vite 5 (SWC), Tailwind CSS 3 + shadcn/ui, framer-motion, react-router-dom 6, TanStack Query 5, sonner, lucide-react, date-fns
- **Backend-as-a-service:** Supabase (PostgreSQL data), Firebase Auth + optional Analytics
- **Serverless:** Vercel functions (`api/*`) proxying Gemini, AWS Location, Vonage
- **Observability:** Sentry (errors, replay, tracing, web vitals)
- **Payments:** Razorpay Checkout (client-side, CDN)
- **Infra:** Vercel (primary), Firebase Hosting config present, PWA via vite-plugin-pwa
- **QA:** Vitest + Testing Library, ESLint 9 flat config, TypeScript (`strict: false`), GitHub Actions

## 5. Project Structure

```
rural-care-connect-main/
├── api/                      # Vercel serverless functions (keys live here)
│   ├── gemini.ts             # Gemini AI proxy (Asha)
│   ├── hospital-scraper.ts   # AWS Location proxy
│   └── send-sms.ts           # Vonage emergency SMS proxy
├── src/
│   ├── components/           # Layout, nav, LocationBar, ProfileMenu, Assistant, EmergencyModal, ui/*
│   ├── contexts/             # AuthContext
│   ├── hooks/                # useNearbyHospitals, useAuthContext, use-toast, use-mobile
│   ├── lib/                  # store, supabase(Db), firebase(Auth), crypto, errors,
│   │   │                     # gemini, hospitalScraper, hospitalUtils, location,
│   │   │                     # offlineQueue, razorpay, mockData, utils
│   ├── pages/                # Login, Signup, Dashboard, Profile, Hospitals, Doctors,
│   │                         # Appointments, Reports, NotFound
│   ├── test/                 # vitest setup
│   └── main.tsx / App.tsx    # entry, providers, routes
├── docs/                     # RLS migration, emergency-contacts migration, phase notes
├── .github/workflows/ci.yml  # CI pipeline
├── functions/                # legacy Firebase Functions stub (dead, kept as note)
├── vite.config.ts            # PWA, aliases, manual chunks
├── vercel.json               # rewrites + cache headers
├── .env.example              # all environment variables
└── playwright.config.ts / vitest.config.ts
```

Path alias: `@/*` → `src/*` (configured in Vite, tsconfig, Vitest).

## 6. Conventions

- **Component style:** shadcn/ui conventions; `cn()` from `src/lib/utils.ts` for class merging; lucide-react icons; framer-motion `motion` components with `containerVariants`/`itemVariants` stagger patterns.
- **Styling:** Tailwind utility classes; dark theme (background `#0a0a0a`, primary green `#22C55E`); custom `glass-card`, `btn-primary-glow`, `bg-grid-pattern` classes defined in `src/index.css`.
- **Data flow:** pages → `lib` store modules → Supabase, with localStorage mirroring; hooks for shared async state (TanStack Query).
- **Error handling:** use `handleError` / `handleErrorSilent` from `src/lib/errors.ts` (Sentry + toast); background cache failures may be silently swallowed.
- **Auth access:** `useAuthContext()`; guard routes with `<ProtectedRoute>` / `<PublicOnlyRoute>` in `App.tsx`.
- **Lint:** ESLint flat config; `no-console` is a warning — new production code should avoid console statements.
- **Patient data ownership:** the Firebase `uid` is the Supabase `patients.id` — never mint a different id for the same person.

## 7. Getting Started

```bash
npm install
cp .env.example .env   # fill in VITE_* values (see §9)
npm run dev            # Vite dev server on :8080
```

Scripts (`package.json`):

| Command | Action |
|---------|--------|
| `npm run dev` | Vite dev server (port 8080) |
| `npm run build` | Production build → `dist/` |
| `npm run build:dev` | Dev-mode build |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint |
| `npm run test` | Vitest (once) |
| `npm run test:watch` | Vitest watch |

## 8. Manual Setup Steps (not automated)

These are documented but must be performed by a human (Supabase Dashboard / SQL Editor):

1. **Supabase schema** — create `patients`, `appointments`, `medical_reports`, `hospitals` per `TECHNICAL_SPECIFICATION.md §8.1`.
2. **RLS** — run SQL from `docs/sec2-rls-setup.md` (enable RLS + per-user policies).
3. **Aadhaar columns** — `aadhaar_encrypted`, `aadhaar_hash` (in the same doc).
4. **Emergency contacts column** — `ALTER TABLE patients ADD COLUMN IF NOT EXISTS emergency_contacts JSONB DEFAULT '[]'::jsonb;` (`docs/emergency-contacts-migration.md`).
5. **Server env vars** on Vercel: `GEMINI_API_KEY`, `AWS_LOCATION_SERVICE_API_KEY`, `AWS_PLACES_INDEX`, `VONAGE_API_KEY`, `VONAGE_API_SECRET`, `VONAGE_FROM_NUMBER`.

## 9. Environment Variables (`.env.example`)

| Variable | Scope | Required for |
|----------|-------|--------------|
| `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_MEASUREMENT_ID` | client | Auth + Analytics |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | client | All persistence |
| `VITE_AADHAAR_ENCRYPTION_KEY` | client | Aadhaar encryption (64-hex) |
| `VITE_RAZORPAY_KEY_ID` | client | Real payments (else demo mode) |
| `VITE_SENTRY_DSN` | client | Error tracking (prod only) |
| `GEMINI_API_KEY` | **server** | Asha assistant |
| `AWS_LOCATION_SERVICE_API_KEY`, `AWS_PLACES_INDEX` | **server** | AWS hospital search |
| `VONAGE_API_KEY`, `VONAGE_API_SECRET`, `VONAGE_FROM_NUMBER` | **server** | Real SOS SMS |

## 10. Deployment

- **Vercel:** `vercel.json` routes `/api/*` to serverless functions and everything else to `index.html`. Static assets get `immutable` cache headers.
- **Firebase Hosting:** configured in `firebase.json` (dist + SPA rewrite) but not required.
- **CI:** `.github/workflows/ci.yml` runs lint, `tsc --noEmit`, tests, and build on push/PR to `main` (build needs Supabase env secrets).

## 11. Quality Bar

- All changes should pass: `npm run lint` + `npx tsc --noEmit` + `npm run test` + `npm run build`.
- New store/service logic should follow the `tryDatabase` fallback pattern and queue failed writes.
- Sensitive credentials must never be added to client code; add them to `api/*` proxies + server env instead.
- Patient-identifiable data (Aadhaar) must go through `crypto.ts` before persistence.

## 12. Known Gaps & Roadmap (code reality)

| Gap | Notes |
|-----|-------|
| Real doctor/hospital directory | Currently mock + generated data; "server-side doctor/hospital data" remains the open Phase 5 item (TASKS.md). |
| Server-side payment verification | Report unlock is enforced in the client only. |
| RLS / schema migrations | Not auto-applied; manual SQL steps required before prod. |
| Email/password login UI | Helpers exist, login page offers phone + Google only. |
| E2E tests | Playwright configured; no specs yet. |
| Cancel-appointment UI | Status value supported; no UI path. |
| Legacy `functions/` folder | Contains only a deletion note; safe to remove entirely. |

---

*Generated from the repository at `rural-care-connect-main` — August 18, 2026. The code is the source of truth.*

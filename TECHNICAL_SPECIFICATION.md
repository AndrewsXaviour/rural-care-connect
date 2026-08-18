# RuralCare Connect — Technical Specification

**Status:** Generated from source code (code is the source of truth)
**Date:** August 18, 2026
**Codebase:** `rural-care-connect-main`
**Repository:** [github.com/nadana1985/rural-care-connect-asha-health](https://github.com/nadana1985/rural-care-connect-asha-health)

---

## 1. Overview

RuralCare Connect is a React single-page application (SPA) that brings healthcare access to rural Indian communities. It provides:

- **Authentication** — phone OTP, Google, and email/password sign-in
- **Hospital discovery** — location-based hospital search with caching and distance sorting
- **Appointment booking** — symptom → specialty mapping, doctor selection, date/time slot booking
- **Medical records** — lab reports with a ₹10 paywall (Razorpay or demo mode)
- **AI health assistant ("Asha")** — Gemini-powered chat widget
- **Emergency SOS** — calls India emergency number 108, shares location, and SMS-alerts emergency contacts
- **Patient profile** — demographics, Aadhaar, blood group, and emergency contacts

The app is designed **offline-first for rural connectivity**: all writes go to Supabase with a localStorage mirror and an IndexedDB retry queue for failed writes.

---

## 2. Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| UI framework | React | ^18.3.1 |
| Language | TypeScript (strict: **false**) | ^5.8.3 |
| Build tool | Vite + @vitejs/plugin-react-swc | ^5.4.19 |
| Routing | react-router-dom | ^6.30.1 |
| Data fetching | @tanstack/react-query | ^5.83.0 |
| Styling | Tailwind CSS + tailwindcss-animate | ^3.4.17 |
| UI components | shadcn/ui on Radix UI primitives (dialog, popover, calendar, toast, etc.) | — |
| Icons | lucide-react | ^0.462.0 |
| Animations | framer-motion | ^12.38.0 |
| Toasts | sonner | ^1.7.4 |
| Forms | react-hook-form + zod + @hookform/resolvers (installed; pages use controlled state) | — |
| Dates | date-fns | ^3.6.0 |
| Auth | Firebase Auth (`firebase/app`, `firebase/auth`) | ^12.11.0 |
| Database | Supabase (`@supabase/supabase-js`) | ^2.101.1 |
| AI | Google Gemini via serverless proxy (`gemini-2.5-flash`) | — |
| Payments | Razorpay Checkout (CDN script) | — |
| SMS | Vonage (`@vonage/server-sdk`, server-side) | ^3.27.0 |
| Monitoring | @sentry/react + web-vitals | ^10.58.0 |
| PWA | vite-plugin-pwa (Workbox) | ^1.2.0 |
| Tests | Vitest + @testing-library/react + jsdom | ^3.2.4 |
| E2E | @playwright/test (config + fixture present; no spec files) | ^1.57.0 |
| Package manager | npm (package-lock.json) / bun (bun.lockb) | — |

**Unused dependencies present in `package.json`:** several shadcn/ui support packages (recharts, embla-carousel-react, react-resizable-panels, cmdk, vaul, input-otp, next-themes, react-day-picker is used, etc.) are installed but not imported by application code.

---

## 3. System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        CLIENT (React SPA)                        │
│                                                                  │
│  pages/      Dashboard, Hospitals, Doctors, Appointments,        │
│              Reports, Profile, Login, Signup, NotFound           │
│  components/ Layout, SwipeMaskNav, LocationBar, ProfileMenu,     │
│              Assistant, EmergencyModal, ui/* (shadcn)            │
│  hooks/      useNearbyHospitals, useAuthContext, use-toast,      │
│              use-mobile                                          │
│  contexts/   AuthContext                                         │
│  lib/        store, supabase, supabaseDb, firebase, firebaseAuth,│
│              crypto, errors, gemini, hospitalScraper,            │
│              hospitalUtils, location, offlineQueue, razorpay,    │
│              mockData, utils                                     │
└───────┬───────────────┬──────────────────┬───────────────────────┘
        │               │                  │
   Firebase Auth   Supabase (data)    Vercel Serverless /api/*
   (phone OTP,     (patients,          (gemini, hospital-scraper,
    Google, email)  appointments,        send-sms) — keys live
                   medical_reports,     server-side
                   hospitals)
        │               │                  │
   ┌────▼───────┐ ┌─────▼──────┐   ┌──────▼─────────────────────┐
   │ Firebase   │ │ PostgreSQL │   │ Gemini / AWS Location /    │
   │ Auth       │ │ + RLS      │   │ Vonage SMS (server-side)   │
   └────────────┘ └────────────┘   └────────────────────────────┘

   Client-direct public APIs: Overpass (OSM), Nominatim, ipapi.co
   Browser storage: localStorage (mirror/cache), IndexedDB (offline queue)
```

### 3.1 Architecture decisions (as implemented)

- **Single data backend:** Supabase owns all persistence (`patients`, `appointments`, `medical_reports`, `hospitals`). Firebase is used **only** for authentication and (conditionally) Analytics — Firestore/Storage/Functions were removed.
- **Auth ≠ data:** Firebase Auth provides the session (`auth.uid()`); the same uid is the primary key of the Supabase `patients` table, giving RLS a join key.
- **Offline-first pattern:** every store operation writes to localStorage first, then attempts Supabase; on Supabase failure the write is queued in IndexedDB and retried later.
- **Sensitive keys are server-side:** Gemini, AWS Location, and Vonage credentials live only in Vercel serverless functions.
- **Progressive fallbacks:** hospital discovery degrades AWS proxy → Overpass (OSM) → mock regional data; geolocation degrades browser GPS → ipapi.co IP lookup → manual location search.

---

## 4. Directory & Module Map

| Module | File(s) | Responsibility |
|--------|---------|----------------|
| App entry | `src/main.tsx` | Sentry init, web-vitals, offline-queue init, React root |
| App shell | `src/App.tsx` | QueryClient, AuthProvider, router, route guards |
| Auth context | `src/contexts/AuthContext.tsx` | Firebase `onAuthStateChanged` subscription, `isAuthenticated`, `logout` (clears all localStorage keys) |
| Firebase init | `src/lib/firebase.ts` | `initializeApp`, `getAuth`, conditional Analytics |
| Firebase auth ops | `src/lib/firebaseAuth.ts` | register/login/logout, Google popup, reCAPTCHA, phone OTP send/verify, password reset, profile update |
| Supabase init | `src/lib/supabase.ts` | Creates client; placeholder values if env missing (fails gracefully) |
| Data store | `src/lib/store.ts` | `patientStore`, `appointmentStore`, `reportStore` — Supabase + localStorage fallback + offline queue |
| Hospital cache | `src/lib/supabaseDb.ts` | `cacheHospitals`, `getCachedHospitals(maxAge)`, `clearHospitalCache` |
| Aadhaar crypto | `src/lib/crypto.ts` | AES-256-GCM encrypt/decrypt + SHA-256 hash of Aadhaar |
| Error handling | `src/lib/errors.ts` | `handleError` (Sentry + toast), `handleErrorSilent` (Sentry only) |
| Gemini client | `src/lib/gemini.ts` | `sendMessageToGemini(history)` → `POST /api/gemini` |
| Hospital fetch | `src/lib/hospitalScraper.ts` | `fetchHospitalsFromAWS` → `fetchHospitalsFromOverpassAPI` → mock fallback |
| Hospital lookup | `src/lib/hospitalUtils.ts` | `getHospitalById`, `getHospitalName` (mock → cached map → cached list) |
| Location | `src/lib/location.ts` | Haversine `calculateDistance`, `getUserLocation` (GPS → IP), reverse geocoding via Nominatim |
| Offline queue | `src/lib/offlineQueue.ts` | IndexedDB queue; `queueWrite`, `retryPendingWrites`, `initOfflineQueue` |
| Razorpay | `src/lib/razorpay.ts` | Lazy-load checkout.js, `openRazorpayCheckout`, `isRazorpayConfigured` |
| Mock/seed data | `src/lib/mockData.ts` | Types (Patient, Hospital, Doctor, Appointment, MedicalReport, EmergencyContact), `DISEASE_SPECIALIZATION`, mock hospitals/doctors/reports |
| UI utils | `src/lib/utils.ts` | `cn()` (clsx + tailwind-merge) |
| Hospital hook | `src/hooks/useNearbyHospitals.ts` | TanStack `useQuery` for location + hospital fetch + cache + distance sort |
| Serverless API | `api/gemini.ts`, `api/hospital-scraper.ts`, `api/send-sms.ts` | Key-holding proxies (see §7) |

---

## 5. Routing

| Route | Page | Guard |
|-------|------|-------|
| `/`, `/login` | `LoginPage` | PublicOnlyRoute (redirects to `/dashboard` if authed) |
| `/signup` | `SignupPage` | PublicOnlyRoute |
| `/dashboard` | `DashboardPage` | ProtectedRoute |
| `/profile` | `ProfilePage` | ProtectedRoute |
| `/hospitals` | `HospitalsPage` | ProtectedRoute |
| `/hospitals/:hospitalId/doctors` | `DoctorsPage` | ProtectedRoute |
| `/appointments` | `AppointmentsPage` | ProtectedRoute |
| `/reports` | `ReportsPage` | ProtectedRoute |
| `*` | `NotFound` | — |

- **ProtectedRoute:** shows a spinner while auth loads; redirects to `/login` (preserving `from` state) when unauthenticated.
- **PublicOnlyRoute:** redirects authenticated users to `/dashboard`.
- All routes render inside `Layout`, which provides the header (brand, `LocationBar`, `ProfileMenu`), the `SwipeMaskNav` pill navigation, animated page transitions, the floating `Assistant` widget, a skip-to-content link, and a decorative grid background. Auth pages render full-bleed without the header.

---

## 6. Authentication

Firebase Auth is the identity provider. Three methods are implemented:

### 6.1 Phone OTP (LoginPage)
1. Validate: exactly 10 digits, starts with 6–9 (`/^[6-9]\d{9}$/`).
2. Build `RecaptchaVerifier` (invisible, `#recaptcha-container`).
3. `signInWithPhoneNumber(auth, "+91" + phone, verifier)` → `ConfirmationResult`.
4. `confirmationResult.confirm(otp)` with a 6-digit code.
5. On success, `AuthContext` picks up the session via `onAuthStateChanged`; navigate to `/dashboard`.
- Error mapping: `auth/invalid-phone-number`, `auth/too-many-requests`, `auth/invalid-verification-code`, `auth/code-expired`.

### 6.2 Google (LoginPage)
- `signInWithPopup(auth, GoogleAuthProvider, browserPopupRedirectResolver)`.
- Graceful handling of popup-close COOP errors: if `auth.currentUser` exists after a popup exception, treat as success.

### 6.3 Email/Password (SignupPage)
- `createUserWithEmailAndPassword` + `updateProfile(displayName)`.
- Client validation: name required, email regex, phone 10 digits (6–9), password ≥ 6 chars, matching confirmation.
- Error mapping: `auth/email-already-in-use`, `auth/weak-password`, `auth/invalid-email`, `auth/operation-not-allowed`, `auth/too-many-requests`.

### 6.4 Session & logout
- `AuthContext` exposes `{ user, loading, isAuthenticated, logout }`.
- `logout()` signs out and clears every app localStorage key (`rural_health_auth`, `rural_health_patient`, `rural_health_appointments`, `rural_health_reports`, `cached_doctors`, `cached_hospitals_map`, `cached_hospitals_list`, `userLocation`).
- `firebaseAuth.ts` also exports `loginUser` and `resetPassword`, but no page currently wires them to UI.

---

## 7. Serverless API (Vercel `/api/*`)

All three functions set CORS headers (`*`), answer `OPTIONS`, and reject non-`POST` with 405.

### 7.1 `POST /api/gemini`
- **Purpose:** proxy Google Gemini `gemini-2.5-flash:generateContent`.
- **Env (server-only):** `GEMINI_API_KEY`.
- **Request:** `{ "messages": [{ role: "user"|"model", text }] }`
  - Validates `messages` is a non-empty array, max 50 messages.
  - Slices from the first `user` message (Gemini requirement).
- **Behavior:** injects the **"Asha" system instruction** (simple language, directs users to Nearby Hospitals / Reports tabs, prioritizes SOS in emergencies, always adds "I am an AI assistant, not a doctor" disclaimer), `temperature: 0.7`, `maxOutputTokens: 2048`, 30s timeout.
- **Response:** `{ "text": "..." }`; errors as `{ "error": "..." }` with mapped status.

### 7.2 `POST /api/hospital-scraper`
- **Purpose:** proxy AWS Location Service `search/position` for hospital discovery.
- **Env (server-only):** `AWS_LOCATION_SERVICE_API_KEY`, `AWS_PLACES_INDEX` (region hardcoded `us-east-1`).
- **Request:** `{ latitude, longitude, radiusKm? }` (radiusKm unused by the AWS call; coordinates validated to ±90/±180).
- **Behavior:** `POST https://places.geo.us-east-1.amazonaws.com/places/v0/indexes/{index}/search/position` with `{ Position: [lng, lat], MaxResults: 50 }`, 15s timeout. Filters results whose categories/label contain `hospital | medical | clinic | health | nursing`. ID format: `aws-{lng}-{lat}`; distance converted m→km (1 decimal).
- **Response:** `{ hospitals: [{ id, name, address, latitude, longitude, distance? }], configured: true }`. If env keys are absent: `{ configured: false }` (client falls back to Overpass). On AWS error: 500 with `configured: true` → client falls back to Overpass.

### 7.3 `POST /api/send-sms`
- **Purpose:** emergency SMS to a patient's contacts via Vonage.
- **Env (server-only):** `VONAGE_API_KEY`, `VONAGE_API_SECRET`, `VONAGE_FROM_NUMBER`.
- **Request:** `{ contacts: [{ name, phone }], patient: { name, bloodGroup, age }, location?: { latitude, longitude } }`.
- **Behavior:**
  - Production: `vonage.message.sendSms(fromNumber || "RuralCare", phone, smsBody)` per contact via `Promise.allSettled`. SMS body: `EMERGENCY from {name} — Blood: {blood}, Age: {age}. Please help immediately! https://maps.google.com/?q={lat},{lng}`.
  - **Demo mode:** if Vonage keys are absent, returns `{ success: true, demo: true, sent: [...] }` and logs the would-be messages server-side (no SMS sent).
- **Response:** `{ success, sent, failed, total }` or demo payload.

---

## 8. Data Layer

### 8.1 Supabase tables (schema implied by `store.ts` / `supabaseDb.ts` + `docs/`)

**`patients`** — keyed by Firebase `uid` (`id` column)
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid/text | = `auth.uid()`; PK |
| `full_name` | text | |
| `phone` | text | |
| `gender` | text | |
| `blood_group` | text | |
| `age` | int | |
| `height` | int (cm) | |
| `weight` | int (kg) | |
| `address` | text | |
| `house_number` | text | |
| `aadhaar_encrypted` | text | JSON `{encrypted, iv}` base64 (SEC3) |
| `aadhaar_hash` | text | salted SHA-256 for lookup (SEC3) |
| `aadhaar` | text | legacy plaintext, read as fallback only |
| `emergency_contacts` | jsonb | `[{name, phone, relation}]` (migration in `docs/emergency-contacts-migration.md`) |
| `updated_at` | timestamptz | |

**`appointments`**
| Column | Type |
|--------|------|
| `id` | uuid (`crypto.randomUUID()`) |
| `patient_id` | = `auth.uid()` |
| `doctor_id` | text (mock id or `gen-{hospitalId}-d{n}`) |
| `hospital_id` | text |
| `date` | `yyyy-MM-dd` |
| `time` | slot string e.g. `"09:00"` |
| `status` | `booked` \| `completed` \| `cancelled` |

**`medical_reports`**
| Column | Type |
|--------|------|
| `id` | uuid |
| `patient_id` | = `auth.uid()` |
| `hospital_id` | text |
| `test_name` | text |
| `date` | text |
| `status` | text |
| `result_summary` | text (the locked result) |

**`hospitals`** — cache table
| Column | Type |
|--------|------|
| `id` | text (`aws-…` / `osm-…` / mock id) |
| `name` | text |
| `address` | text |
| `latitude` | double |
| `longitude` | double |
| `cached_at` | timestamptz (used for 60-min freshness) |

**RLS:** policies are documented in `docs/sec2-rls-setup.md` (per-user SELECT/INSERT/UPDATE on `patients`, `appointments`, `medical_reports`; public read + authenticated write on `hospitals`). **Manual step required** — apply via Supabase SQL Editor; not auto-applied in code.

### 8.2 Store pattern (`store.ts`)

Every store operation:
1. Mirrors the change to localStorage (instant read/offline).
2. Calls Supabase through the `tryDatabase` helper.
3. On Supabase error: if a write (`insert`/`update`/`upsert`), `queueWrite(...)` pushes it to the IndexedDB offline queue; returns the localStorage fallback.

- `patientStore.save/get/getCached` — upsert/get on `patients`; Aadhaar encrypted + hashed before Supabase write, decrypted on read (legacy plaintext `aadhaar` column supported).
- `appointmentStore.getAll/add/updateStatus` — `appointments`.
- `reportStore.getAllForUser/add` — `medical_reports`.

### 8.3 localStorage keys

| Key | Content |
|-----|---------|
| `rural_health_patient` | current `Patient` |
| `rural_health_appointments` | all `Appointment[]` (filtered by patient on read) |
| `rural_health_reports` | all `MedicalReport[]` (filtered by patient on read) |
| `cached_doctors` | `{ doctorId: Doctor }` written on booking |
| `cached_hospitals_map` | `{ hospitalId: Hospital }` written on booking |
| `cached_hospitals_list` | `Hospital[]` written by HospitalsPage |
| `userLocation` | `DetailedLocationInfo` + timestamp from LocationBar |
| `unlocked_reports_{uid}` | `string[]` of unlocked report ids (paywall state) |
| `rural_health_auth` | legacy auth flag |

### 8.4 IndexedDB — offline write queue (`offlineQueue.ts`)

- DB `ruralcare_offline_queue` / object store `pending_writes` (keyPath `id`).
- `PendingWrite`: `{ id, table, operation, payload, filters?, timestamp, retries }`.
- `retryPendingWrites()` replays queue via the Supabase client: `insert` → `.insert(payload)`, `update` → `.update(payload).match(filters)`, `upsert` → `.upsert(payload)`; removes on success; **max 5 retries** then discards.
- `initOfflineQueue()` (called from `main.tsx`) retries on app load and on the browser `online` event.

---

## 9. External Service Integrations

| Service | Purpose | Key location | Client code |
|---------|---------|--------------|-------------|
| Firebase Auth | Phone OTP / Google / Email | `VITE_FIREBASE_*` (client, per Firebase design) | `firebase.ts`, `firebaseAuth.ts` |
| Supabase | Data store | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (client, RLS-protected) | `supabase.ts`, `store.ts`, `supabaseDb.ts` |
| Google Gemini | AI assistant | `GEMINI_API_KEY` (server) | `api/gemini.ts` ← `src/lib/gemini.ts` |
| AWS Location | Hospital places | `AWS_LOCATION_SERVICE_API_KEY`, `AWS_PLACES_INDEX` (server) | `api/hospital-scraper.ts` ← `hospitalScraper.ts` |
| Overpass (OSM) | Hospital fallback (free) | none | `hospitalScraper.ts` |
| Nominatim (OSM) | Reverse geocoding + place search | none | `location.ts`, `HospitalsPage` |
| ipapi.co | IP geolocation fallback | none | `location.ts` |
| Razorpay | Report paywall | `VITE_RAZORPAY_KEY_ID` (publishable, client) | `razorpay.ts`, `ReportsPage` |
| Vonage | Emergency SMS | `VONAGE_*` (server) | `api/send-sms.ts` ← `EmergencyModal` |
| Sentry | Error tracking + web vitals | `VITE_SENTRY_DSN` (client, prod only) | `main.tsx`, `errors.ts` |

---

## 10. Feature Flows

### 10.1 Hospital discovery (`HospitalsPage` + `useNearbyHospitals`)
1. `useNearbyHospitals` runs TanStack `useQuery(["nearbyHospitals"])` → `fetchHospitalData()`.
2. `getUserLocation()`: browser geolocation (15s internal timeout) → ipapi.co IP fallback (5s timeout).
3. `getAddressFromCoordinates()`: Nominatim reverse geocode for a display address.
4. `getCachedHospitals(60)`: fresh hospitals from Supabase cache (< 60 min).
5. Cache miss → `fetchHospitalsFromWeb(lat, lng, 50)`: `POST /api/hospital-scraper` → (not configured/error/empty) → Overpass `amenity=hospital` query → (empty) → **mock regional hospitals** with computed distances.
6. Results cached to Supabase `hospitals` via `cacheHospitals()`; distances computed client-side (Haversine); sorted ascending.
7. Query options: `staleTime 5m`, `gcTime 30m`, `retry 1`, `refetchOnWindowFocus false`.
8. UI: radius slider (2–50 km), manual location search (Nominatim search → `fetchHospitalsFromWeb`), auto-shows manual input on location error, error card with retry, `cached_hospitals_list` persisted.
9. Cards navigate to `/hospitals/{id}/doctors`.

### 10.2 Doctor selection & appointment booking (`DoctorsPage`)
1. Hospital resolved via `getHospitalById` (mock → `cached_hospitals_map` → `cached_hospitals_list`).
2. Symptom input → `DISEASE_SPECIALIZATION` map suggests a specialty (e.g., "fever" → General Physician, "heart" → Cardiologist); live "AI suggests" chip.
3. Doctor list: mock hospitals use `mockDoctors` (filtered by hospital); **real (non-mock) hospitals get procedurally generated doctors** via `generateDoctorsForHospital` (deterministic from hospital id hash, 3–4 doctors).
4. Select doctor → date picker (react-day-picker, past dates disabled) → time slot buttons.
5. `bookSlot()`: creates `Appointment` (`crypto.randomUUID()`, status `booked`) → `appointmentStore.add` (localStorage + Supabase + offline queue) → caches doctor/hospital to `cached_doctors` / `cached_hospitals_map` → confirmation screen.

### 10.3 Appointments timeline (`AppointmentsPage`)
- `appointmentStore.getAll(uid)` sorted: `booked` first, then `completed`/`cancelled`.
- Doctor name/specialization via `mockDoctors` or `cached_doctors`; hospital via `getHospitalById`.
- **"Mark Complete"** on a booked appointment: sets status `completed` **and auto-creates** a `General Health Checkup` medical report with a canned `resultSummary` (via `reportStore.add`).

### 10.4 Reports & paywall (`ReportsPage`)
- `reportStore.getAllForUser(uid)`; unlock state per user in `unlocked_reports_{uid}`.
- Locked report → ₹10 unlock dialog:
  - If `VITE_RAZORPAY_KEY_ID` set: lazy-load `checkout.razorpay.com/v1/checkout.js`, open checkout (amount 1000 paise, INR, theme green). Success unlocks.
  - **Demo mode** (no key): 1.5s simulated delay, toast "Report unlocked (Demo Mode - no payment was charged)".
  - Unlock is client-side only (localStorage) — no server-side verification in the current code.
- Unlocked reports render a result summary modal.

### 10.5 Emergency SOS (`EmergencyModal`, from Dashboard)
On trigger:
1. `window.location.href = "tel:108"` — calls India's medical emergency number.
2. GPS location fetched (10s timeout).
3. **Web Share API** (if available) shares name, blood group, age, and Google Maps link.
4. If the patient has emergency contacts: `POST /api/send-sms` with contacts (`+91` prefixed), patient info, and location — Vonage SMS, or demo-mode log when keys are absent.
5. UI shows "nearest responder" derived from **mock hospitals only** (distances from `userLocation`), confirmation screen, and a "Call Emergency (108)" link.
6. Accessibility: `role="dialog"`, `aria-modal`, `aria-label`, `FocusTrap` (Tab cycling + Escape).
- **Note:** if the patient has no profile (`patient === null`), SOS is blocked with a toast prompting profile completion.

### 10.6 AI Assistant (`Assistant` widget, all authed pages)
- Floating chat bubble (bottom-right); window with message history.
- `sendMessageToGemini(history)` → `POST /api/gemini` (30s abort timeout) → renders reply.
- Welcoming message from "Asha"; error path shows a friendly fallback via `handleError`.
- Disclaimer footer: "I am an AI. Not a replacement for a doctor."

### 10.7 Profile (`ProfilePage`)
- Form: full name, Aadhaar (12-digit), phone, age, height (cm), weight (kg), blood group (8 groups), gender, house number, address, plus **emergency contacts** (add/remove rows: name, phone, relation).
- Save requires full name, Aadhaar, blood group, age. `patientStore.save` handles encryption + persistence.
- Logout link at the bottom.

---

## 11. Security Implementation

| Area | Implementation |
|------|----------------|
| **API keys** | Gemini, AWS Location, Vonage keys are server-side in Vercel functions. Client only holds Firebase config, Supabase anon key (RLS-protected), Razorpay publishable key, Sentry DSN, and the Aadhaar encryption key. |
| **Aadhaar encryption** | `crypto.ts`: AES-256-GCM via Web Crypto API; 12-byte random IV per encryption; key from `VITE_AADHAAR_ENCRYPTION_KEY` (64 hex chars = 32 bytes, validated). Stored as `{encrypted, iv}` base64 JSON in `aadhaar_encrypted`; salted SHA-256 in `aadhaar_hash` for lookups. |
| **RLS** | Documented per-table policies (see §8.1) — manual SQL application required. |
| **Input validation** | Client-side: phone `/^[6-9]\d{9}$/`, OTP 6 digits, email regex, Aadhaar 12 digits (in crypto layer), appointment date not in the past, coordinate ranges on the scraper proxy, message-count cap (50) on the Gemini proxy. |
| **Credential guards** | `supabase.ts` uses placeholders if env vars are missing so calls fail gracefully. Gemini/AWS proxies return 500 + `configured:false` when keys are absent. |
| **XSS** | React auto-escaping on all rendered data. |
| **Limitations** | Report unlock is client-enforced (no server-side payment verification); the Aadhaar encryption key ships to the client (data-at-rest protection, not transport auth); CORS on proxies is `*`. |

---

## 12. Reliability & Offline Behavior

- **localStorage mirror** on every read/write — pages render instantly and work offline for cached data.
- **IndexedDB offline queue** for failed Supabase writes; automatic retry on app load + `online` event; 5-retry cap.
- **External API timeouts:** Gemini 30s, AWS 15s, Overpass 10s, Nominatim 5–10s, ipapi 5s, geolocation 15–30s — all via `AbortSignal.timeout`.
- **Caching:** Supabase hospital cache (60-min freshness), TanStack Query (5-min stale, 30-min GC), Google Fonts Workbox `CacheFirst` (1-year), static assets `immutable` on Vercel.
- **Fallback chains:** hospital source AWS → Overpass → mock; location GPS → IP → manual search; payment real → demo.
- **Error surfacing:** `handleError` → Sentry + toast; `handleErrorSilent` → Sentry only; background cache failures swallowed silently by design.

---

## 13. Observability

- **Sentry** (`main.tsx`): DSN-gated, enabled only in prod builds with a DSN set. `browserTracingIntegration`, `replayIntegration`, `tracesSampleRate 0.2`, session replay 10% / error replay 100%.
- **Web Vitals** (`onCLS`, `onFCP`, `onLCP`, `onTTFB`) → `Sentry.setMeasurement`.
- **Errors:** `errors.ts` attaches `context` extra to Sentry scopes; pages pass context strings (e.g., `"HospitalsPage:manualSearch"`, `"DoctorsPage:bookSlot"`, `"ProfilePage:save"`, `"Assistant:sendMessage"`).
- **Logging:** ESLint `no-console: warn`; only the two serverless proxies and the hospital-scraper mock fallback retain console statements.

---

## 14. PWA & Performance

- **vite-plugin-pwa:** `registerType: autoUpdate`, manifest (name "Rural Care Connect", theme `#22C55E`, standalone display, SVG icons), Workbox precache of `js/css/html/ico/png/svg`, runtime caching for Google Fonts.
- **Code splitting:** `manualChunks` → `vendor` (react, react-dom, react-router-dom, framer-motion), `firebase`, `supabase`, `ui` (lucide-react, sonner).
- **Fonts:** Google Fonts moved to `<link>` + `preconnect` in `index.html` (no render-blocking `@import`).
- **Bundle hygiene:** dead-code removal (Firebase Firestore/Storage/Functions layers, `useAuth` hook) and server-side key moves reduced client payload.

---

## 15. Testing & CI/CD

### 15.1 Unit tests (Vitest + Testing Library, jsdom)
6 test files under `src/**/__tests__` (plus a placeholder `src/test/example.test.ts`):
- `lib/__tests__/location.test.ts` — Haversine distance cases (identical points, known city pairs, hemisphere, rounding, symmetry).
- `lib/__tests__/hospitalUtils.test.ts` — `getHospitalById` / `getHospitalName` lookups.
- `lib/__tests__/errors.test.ts` — error handler behavior.
- `lib/__tests__/mockData.test.ts` — seed data invariants.
- `lib/__tests__/utils.test.ts` — `cn()`.
- `hooks/__tests__/useNearbyHospitals.test.ts` — hook loading/success states with mocked location, scraper, and Supabase-cache modules.

Test setup: `src/test/setup.ts` (jest-dom + `matchMedia` mock). Config: `vitest.config.ts`.

### 15.2 E2E
- `playwright.config.ts` + `playwright-fixture.ts` exist; **no spec files** are present yet.

### 15.3 CI (` .github/workflows/ci.yml`)
On push/PR to `main`: `lint` → `typecheck` (`tsc --noEmit`) → `test` (`vitest run`) → `build` (with `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` from GitHub secrets), Node 20, npm cache. Concurrency group cancels in-progress runs.

### 15.4 Quality gates (local)
- `npm run lint` (ESLint 9 flat config, `no-console` warn)
- `npx tsc --noEmit` (tsconfig.app.json, `strict: false`)
- `npm run test`
- `npm run build`

---

## 16. Deployment

- **Vercel:** primary host. `vercel.json` rewrites `/api/*` to serverless functions and all other routes to `index.html` (SPA fallback); immutable cache headers on `/assets/*`.
- **Firebase Hosting:** `firebase.json` also configures `dist` hosting with SPA rewrite; the `functions/` directory retains only a stub comment file (the old `fetchGoogleHospitals` Cloud Function was deleted as dead code) — no active Firebase Functions.
- **Env vars:** see `.env.example` for the full list; server-only keys go in Vercel project settings.

---

## 17. Known Limitations & Demo Modes (as implemented)

| Area | Current behavior |
|------|------------------|
| **Doctor directory** | `mockDoctors` (18) + deterministic generated doctors for real hospitals — **not** a server-side directory. |
| **Hospital fallback** | Mock regional hospitals (Srivilliputhur + 5 district hospitals) appear if AWS/Overpass are unavailable. |
| **Payments** | Real Razorpay checkout when key configured; otherwise demo unlock with no charge. No server-side order verification. |
| **SOS** | Real `tel:108` + Web Share always; SMS is real (Vonage) when configured, demo-logged otherwise. "Nearest responder" uses mock hospitals only. |
| **Report generation** | "Mark Complete" generates a canned `General Health Checkup` report client-side. |
| **Cancel appointment** | `cancelled` status exists in the type/model but no page UI sets it. |
| **Email/password login** | `loginUser` + `resetPassword` exist in `firebaseAuth.ts` but are not wired to UI (signup uses email/password; login page is phone + Google). |
| **RLS / schema migrations** | Documented SQL must be applied manually in Supabase (RLS, `aadhaar_encrypted`/`aadhaar_hash`, `emergency_contacts`). |
| **E2E tests** | Playwright configured but no spec files. |

---

## 18. Environment Variables

See `.env.example`. Summary:

| Variable | Where | Purpose |
|----------|-------|---------|
| `VITE_FIREBASE_*` (7) | client | Firebase app + Auth + Analytics |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | client | Supabase client |
| `VITE_AADHAAR_ENCRYPTION_KEY` | client | 64-hex AES-256 key for Aadhaar |
| `VITE_RAZORPAY_KEY_ID` | client | publishable Razorpay key |
| `VITE_SENTRY_DSN` | client (prod) | Sentry |
| `GEMINI_API_KEY` | server | Gemini proxy |
| `AWS_LOCATION_SERVICE_API_KEY`, `AWS_PLACES_INDEX` | server | hospital proxy |
| `VONAGE_API_KEY`, `VONAGE_API_SECRET`, `VONAGE_FROM_NUMBER` | server | SMS proxy |

---

*This specification is derived directly from the current source code. If the code and any other document disagree, the code wins.*

# RuralCare Connect — Interview Q&A (125 Questions)

> **Part A: General / High-Level Questions (Q1–Q50)** — What, Why, How
> **Part B: Technical Drilldown Questions (Q1–Q50)** — Architecture, Security, Frontend, Backend, etc.
> **Part C: Functional / Domain Questions (Q1–Q50)** — Healthcare workflows, user flows, edge cases, compliance

---

# PART A: General & High-Level Questions

---

## Project Overview

### Q1. What is RuralCare Connect about?

**Answer:** RuralCare Connect is a full-stack progressive web application that brings modern healthcare access to rural communities in India. It solves three core problems: (1) patients can't find nearby hospitals easily, (2) there's no centralized system to book appointments and track medical records, and (3) emergency response is slow because there's no way to instantly share patient info with responders. The app lets users find nearby hospitals using GPS, book doctor appointments, store medical reports, use an AI health assistant, and trigger an SOS that calls emergency services while SMSing patient details and GPS location to family members.

### Q2. Who is the target user?

**Answer:** Rural patients in India — particularly in Tier 2/3 cities and villages like Srivilliputhur (Tamil Nadu). The app is designed for low-end Android phones with spotty 2G/3G connectivity. This drove every major design decision: offline-first data storage, PWA (no app store needed), lightweight UI, phone-based authentication (most rural users don't have email), and support for local payment methods (UPI via Razorpay).

### Q3. What problem does it solve that existing solutions don't?

**Answer:** Existing hospital finder apps (Google Maps, Practo) assume good internet, English literacy, and urban infrastructure. RuralCare Connect is different because: (1) it works offline — data syncs when connectivity returns, (2) it uses phone OTP auth (no email required), (3) the AI chatbot speaks in the user's context (rural health scenarios), (4) it sends emergency SMS (not just app notifications) because rural responders don't use apps, (5) payments support UPI which dominates rural India.

### Q4. What are the key features?

**Answer:** Five core features: (1) **Hospital Discovery** — GPS-based nearby hospital finder with distance sorting and manual location search, (2) **Appointment Booking** — AI-suggested specialization based on symptoms, doctor selection, date/time picker, (3) **Medical Records** — Store and view test results with a payment-gated unlock flow, (4) **Emergency SOS** — One-tap call to 108 (India emergency), Web Share API for GPS, SMS to emergency contacts via Vonage, (5) **AI Health Assistant** — Gemini-powered chatbot for health guidance.

### Q5. What is the current state of the project?

**Answer:** Phases 1–4 are complete (security, high-priority fixes, medium-priority improvements, cleanup). Phase 5 (production readiness) is in progress — real payment (Razorpay) and real SOS (Vonage SMS) are implemented. Remaining: server-side hospital data (replacing mock doctors), E2E tests, and a full accessibility audit. The app has 40 unit tests, a CI/CD pipeline, Sentry error tracking, and Web Vitals monitoring.

---

## Tech Stack & Decisions

### Q6. What is the tech stack?

**Answer:** Frontend: React 18 + TypeScript + Vite 5. Styling: Tailwind CSS + shadcn/ui (Radix UI primitives). State: TanStack Query + React Context + useState. Auth: Firebase Auth (Google OAuth + Phone OTP). Database: Supabase (PostgreSQL). Backend: Vercel Serverless Functions. AI: Google Gemini. Payments: Razorpay. SMS: Vonage. Error tracking: Sentry. Testing: Vitest + Testing Library. CI/CD: GitHub Actions. PWA: vite-plugin-pwa + Workbox.

### Q7. Why React over Angular or Vue?

**Answer:** React was chosen because: (1) the team has the strongest React expertise, (2) the ecosystem is the largest — shadcn/ui gave us 40+ accessible components out of the box, (3) TanStack Query is the gold standard for server state management in React, (4) Vite + React SWC gives sub-second hot reload, (5) React's component model fits the app's UI patterns (modals, cards, forms). Angular would be overkill for a SPA of this size, and Vue's ecosystem is smaller in India.

### Q8. Why Vite over Create React App or Next.js?

**Answer:** CRA is deprecated and slow. Next.js adds server-side rendering which this app doesn't need — it's a client-side SPA with a few serverless API routes. Vite gives us: (1) instant dev server startup (no bundling step), (2) SWC compilation (10x faster than Babel), (3) native ESM during development, (4) optimized production builds with Rollup, (5) first-class PWA support via vite-plugin-pwa. The serverless functions in `/api/` handle the backend — we don't need a full Next.js framework.

### Q9. Why Tailwind CSS over styled-components or CSS modules?

**Answer:** Tailwind was chosen for: (1) consistency — utility classes enforce a design system without custom CSS, (2) performance — no runtime CSS-in-JS overhead (important on low-end phones), (3) shadcn/ui compatibility — the component library is built on Tailwind, (4) dark mode — the app uses CSS variables for theme switching, (5) developer velocity — no context-switching between CSS files. The glassmorphism design (backdrop-blur, transparent backgrounds) is easy with Tailwind utilities.

### Q10. Why shadcn/ui over Material UI or Ant Design?

**Answer:** shadcn/ui gives us: (1) full source code ownership — components are copied into our codebase, not imported from a package, (2) zero bundle bloat — we only include what we use, (3) Tailwind-native — no style conflicts, (4) Radix UI primitives underneath — best-in-class accessibility (focus management, ARIA, keyboard navigation), (5) dark mode support via CSS variables. Material UI would force us into Google's design language, and Ant Design is too enterprise-heavy for a healthcare consumer app.

### Q11. Why Supabase over Firebase Firestore for the database?

**Answer:** Firestore is a NoSQL document store — it doesn't support JOIN queries, which we need for relational healthcare data (patient → appointments → hospital → doctor). Supabase gives us: (1) real PostgreSQL with full SQL, (2) Row Level Security policies (data isolation per user), (3) a familiar relational model, (4) the Supabase JS client has great TypeScript support, (5) free tier includes 500MB database. We kept Firebase Auth because it already handles phone OTP + Google sign-in perfectly.

### Q12. Why Firebase Auth over Supabase Auth?

**Answer:** Firebase Auth was already integrated when we started the project. It excels at: (1) Phone OTP with invisible reCAPTCHA (works on低端 Android), (2) Google OAuth with one-click sign-in, (3) the `onAuthStateChanged` listener that powers our AuthContext. We considered migrating to Supabase Auth in Phase 2 but decided it wasn't worth the risk — Firebase Auth is battle-tested and the consolidation effort was better spent on the data layer.

### Q13. Why TanStack Query over Redux or Zustand?

**Answer:** TanStack Query handles server state (data from APIs), not client state (UI flags, form inputs). It gives us: (1) automatic caching with configurable staleTime, (2) deduplication — 3 components requesting the same data only fire 1 fetch, (3) background refetch — data stays fresh while the user navigates, (4) built-in loading/error states — eliminates useState+useEffect boilerplate, (5) offline support via cache. Redux would be overkill — our data is naturally scoped to pages, not shared globally.

### Q14. Why Vercel for hosting?

**Answer:** Vercel gives us: (1) zero-config deployment for Vite projects, (2) automatic serverless functions from the `/api/` directory, (3) preview deployments for every PR, (4) edge network CDN for fast global delivery, (5) environment variable management in the dashboard. The free tier covers our current traffic. We don't need a full AWS/GCP setup — Vercel abstracts away the infrastructure.

### Q15. Why Sentry for error tracking?

**Answer:** Sentry was chosen because: (1) it has a generous free tier (5K errors/month), (2) browser tracing gives us performance metrics (LCP, CLS, FCP), (3) session replay lets us see exactly what the user did before an error, (4) it integrates with our Vercel deployment, (5) the `@sentry/react` package is lightweight. We configured conditional initialization — Sentry only activates in production when `VITE_SENTRY_DSN` is set, so it doesn't add overhead in development.

---

## Architecture Decisions

### Q16. Why is it a PWA instead of a native app?

**Answer:** Three reasons: (1) **No app store friction** — rural users may not have Play Store access or storage for another app, (2) **Cross-platform** — works on any Android phone with Chrome, (3) **Offline support** — the service worker caches assets and the app works without internet. The PWA gives an app-like experience (home screen icon, splash screen, push notification ready) without the 50MB+ download. We use `vite-plugin-pwa` with Workbox for automatic precaching.

### Q17. Why did you build your own serverless functions instead of using BaaS directly?

**Answer:** Security. API keys for Gemini AI, AWS Location Service, and Vonage SMS must never be exposed to the client. The serverless functions in `/api/` act as a secure proxy — the client calls `/api/gemini`, and the function adds the API key before forwarding to Google. This is the standard pattern for keeping secrets server-side in a Jamstack architecture.

### Q18. How does the offline-first architecture work?

**Answer:** Every data operation follows a dual-write pattern: (1) Write to localStorage first (instant, works offline), (2) Write to Supabase asynchronously, (3) If Supabase fails, queue the write in IndexedDB, (4) On browser `online` event, retry queued writes. For reads: try Supabase → fallback to localStorage. This means the app works without internet (reads from cache) while eventually syncing to the cloud. The IndexedDB queue has a max 5 retries per write to prevent infinite loops.

### Q19. Why IndexedDB for the offline queue instead of localStorage?

**Answer:** localStorage has a 5MB limit and only stores strings. IndexedDB: (1) has much higher storage limits (hundreds of MB), (2) stores structured data natively (no JSON parse/stringify), (3) supports transactions for atomic operations, (4) is asynchronous (doesn't block the main thread), (5) is the standard for PWA offline storage. The queue stores complex objects with timestamps, retry counts, and operation metadata — too much for localStorage.

### Q20. How do you handle different environments (dev, staging, production)?

**Answer:** Vite uses `.env` files: `.env.local` for development overrides (gitignored), `.env.example` for documentation. Production env vars are set in Vercel's dashboard. Features gracefully degrade: Sentry only activates with `VITE_SENTRY_DSN` set, Razorpay falls back to demo mode without `VITE_RAZORPAY_KEY_ID`, Vonage logs instead of sending SMS without `VONAGE_API_KEY`. This means the app runs fully functional in demo mode with zero configuration.

---

## Feature Deep-Dives

### Q21. How does the hospital finder work?

**Answer:** The flow: (1) User opens Hospitals page → `useNearbyHospitals` hook fires, (2) Gets GPS coordinates via `navigator.geolocation`, (3) Checks Supabase cache (60-minute freshness), (4) If stale, fetches from OpenStreetMap Overpass API (searches for `amenity=hospital` within radius), (5) Calculates distance from user to each hospital using Haversine formula, (6) Sorts by distance, (7) Displays with distance badges ("Very Close" for <10km). Manual search allows typing a city name → Nominatim geocoding → fetch hospitals for that location.

### Q22. How does the AI chatbot work?

**Answer:** The Assistant component maintains a `messages[]` array with role ("user"/"model") and text. When the user sends a message: (1) append to messages, (2) POST full history to `/api/gemini`, (3) server function calls Google Gemini API with the conversation, (4) response is appended as a "model" message. The chatbot is pre-prompted as "Asha, your RuralCare AI assistant" and is restricted to health-related queries. Error handling shows a toast and adds a fallback message.

### Q23. How does the emergency SOS work?

**Answer:** Five actions fire in sequence: (1) `window.location.href = "tel:108"` triggers India's medical emergency call, (2) `navigator.geolocation.getCurrentPosition` gets GPS, (3) `navigator.share()` shares patient info + Google Maps link via Web Share API, (4) `POST /api/send-sms` sends SMS to all emergency contacts via Vonage with patient name, blood group, age, and GPS link, (5) UI transitions to "SOS Activated" state with follow-up call button. Each step has fallbacks — if geolocation fails, SMS still sends; if share is cancelled, the call still triggers.

### Q24. How does the payment flow work?

**Answer:** Reports are "locked" by default. To view results: (1) User clicks "Unlock" → payment modal opens, (2) If Razorpay is configured (`VITE_RAZORPAY_KEY_ID` set), opens real Razorpay checkout (UPI/cards/net banking), (3) If not configured, runs demo mode (1.5s simulated delay), (4) On success, report ID is added to `unlockedReports[]` in localStorage, (5) User can now click "View Results" to see the test summary. The unlock state persists across sessions via localStorage.

### Q25. How does the appointment booking work?

**Answer:** On DoctorsPage: (1) User types symptoms → `DISEASE_SPECIALIZATION` map suggests a doctor type (e.g., "fever" → "General Physician"), (2) Filters mock/generated doctors by specialization, (3) User picks a doctor → selects date + time slot, (4) `appointmentStore.add()` writes to localStorage + Supabase, (5) On AppointmentsPage, user can "Mark Complete" which updates status and auto-generates a mock medical report. The doctor list is generated deterministically from the hospital ID (seeded random) for non-mock hospitals.

---

## Security & Privacy

### Q26. How do you protect patient data?

**Answer:** Five layers: (1) **Firebase Auth** — only authenticated users can access the app, (2) **Supabase RLS** — Row Level Security policies ensure users can only read/write their own rows, (3) **Aadhaar encryption** — national ID numbers are AES-256-GCM encrypted before storage, (4) **Server-side API keys** — sensitive keys never reach the client, (5) **HTTPS everywhere** — Vercel enforces TLS. The encryption uses Web Crypto API (browser-native, no crypto library dependency).

### Q27. What is Aadhaar and why does it need encryption?

**Answer:** Aadhaar is India's 12-digit unique identity number issued to every resident — it's linked to bank accounts, phone numbers, and government services. If leaked, it enables identity theft and financial fraud. We encrypt it with AES-256-GCM using a server-side key, and store a hash for lookups without decryption. The app needs Aadhaar for patient identification in healthcare contexts (prescriptions, lab reports reference it).

### Q28. How does Row Level Security work?

**Answer:** RLS is a PostgreSQL feature enforced by Supabase. For the `patients` table, the policy is: `CREATE POLICY "Users can only access their own data" ON patients FOR ALL USING (auth.uid() = id)`. This means even if someone bypasses the frontend, the database itself rejects unauthorized queries. We created RLS policies for all 4 tables (patients, appointments, medical_reports, hospitals) in a SQL migration documented in `docs/sec2-rls-setup.md`.

### Q29. How do you handle API key rotation?

**Answer:** All sensitive keys are in Vercel environment variables — rotating them only requires updating the Vercel dashboard, no code changes or redeployment needed (for server-side keys). Client-side keys (`VITE_` prefix) require redeployment since they're baked into the build. The app gracefully handles missing keys — features degrade to demo mode rather than crashing. We document all required keys in `.env.example`.

### Q30. What about HIPAA/data protection compliance?

**Answer:** The app implements HIPAA-aligned practices: encryption at rest (AES-256-GCM for Aadhaar), access controls (RLS), audit trail (Sentry captures all errors with context), and minimal data collection (only health-relevant fields). For full compliance, we'd need: (1) a Business Associate Agreement with Supabase/Vercel, (2) data retention policies, (3) patient consent flows, (4) a formal privacy policy. The current implementation is production-ready for a beta launch but would need legal review for scale.

---

## Development Process

### Q31. How was the project structured?

**Answer:** The codebase follows a feature-based structure: `src/pages/` (route components), `src/components/` (shared UI), `src/lib/` (utilities, stores, API clients), `src/hooks/` (custom hooks), `src/contexts/` (React Context), `src/test/` (test setup), `api/` (Vercel serverless functions), `docs/` (migrations, documentation). Each page is a self-contained module that imports from shared utilities. The `lib/` directory has no React dependencies — pure TypeScript functions that can be tested independently.

### Q32. How did you manage the technical debt?

**Answer:** We used a phased approach: Phase 1 (security), Phase 2 (high-priority fixes), Phase 3 (medium-priority improvements), Phase 4 (cleanup), Phase 5 (production readiness). Each phase had specific tasks tracked in `TASKS.md`. The biggest wins: (1) removing 36 console statements + adding ESLint rule, (2) fixing 7 `any` types with proper interfaces, (3) deduplicating hospital lookup logic across 3 pages, (4) consolidating to a single backend (Supabase).

### Q33. How do you handle code reviews?

**Answer:** In this project, I used an AI code reviewer (code-reviewer-mimo) for every significant change. The reviewer checks: (1) TypeScript correctness, (2) ESLint compliance, (3) security concerns (exposed keys, missing validation), (4) performance implications, (5) consistency with existing patterns. For a team setting, I'd use GitHub PR reviews with a checklist: does it have tests? Does it handle errors? Is the bundle size impact acceptable?

### Q34. How did you write tests?

**Answer:** 40 tests across 7 files using Vitest. Strategy: test pure functions (calculateDistance, cn, getHospitalById), test error handling paths (handleError captures to Sentry, shows toast), test hooks (useNearbyHospitals with mocked dependencies), test data integrity (mock hospitals have valid IDs, doctors reference valid hospitals). No snapshot tests — we test behavior. Each mock is explicit (vitest.mock per dependency) for clarity.

### Q35. What was the commit/branch strategy?

**Answer:** The project used a linear development approach with descriptive commit messages. Each phase was a focused set of changes: Phase 1 had 3 commits (SEC1, SEC2, SEC3), Phase 2 had 6 commits (A1, Q1, Q8, R5, R7, P1), etc. For a team, I'd recommend: feature branches → PR with CI checks → squash merge to main. The CI pipeline (lint → typecheck → test → build) prevents broken code from reaching main.

---

## Challenges & Learnings

### Q36. What was the biggest technical challenge?

**Answer:** The dual-write consistency problem — writing to both localStorage and Supabase simultaneously. Edge cases: (1) localStorage succeeds but Supabase fails (no network) → data is cached but not synced, (2) Supabase succeeds but localStorage fails → data is in cloud but not locally available, (3) both fail → data lost. Solution: localStorage-first for instant UX, Supabase async, IndexedDB queue for failed writes, retry on `online` event. This gives eventual consistency without complex conflict resolution.

### Q37. What would you do differently?

**Answer:** (1) Start with Supabase Auth instead of Firebase — fewer dependencies, (2) Implement the offline queue in Phase 2 instead of Phase 5, (3) Add E2E tests earlier (Playwright), (4) Use Supabase CLI for migrations instead of manual SQL docs, (5) Set up the CI/CD pipeline on day one, (6) Create a proper component library from shadcn/ui instead of ad-hoc components.

### Q38. How did you handle the transition from demo to production features?

**Answer:** Every feature has a demo fallback: Razorpay → simulated payment, Vonage SMS → logged messages, hospital data → generated from seeds. The pattern: check if the API key is configured → if yes, use real integration → if no, run demo mode. This means the app works fully functional without any API keys configured, which is great for development and demos. Production activation only requires setting environment variables.

### Q39. How did you optimize for rural users?

**Answer:** Every decision was filtered through "will this work on a $50 Android phone on 2G?": (1) PWA instead of native app (smaller download), (2) localStorage caching (instant reads, no loading spinners), (3) Service worker for offline asset caching, (4) Offline write queue (data survives connectivity gaps), (5) Phone OTP auth (no email needed), (6) UPI payments (dominant in rural India), (7) SMS for emergency alerts (works on feature phones), (8) Lightweight UI (Tailwind, no heavy animation libraries except framer-motion for essential transitions).

### Q40. What metrics would you track in production?

**Answer:** (1) **Performance**: LCP, CLS, FCP via Web Vitals → Sentry, (2) **Errors**: Crash rate, unhandled exceptions via Sentry, (3) **Business**: Hospital searches per session, appointment conversion rate, report unlock rate, SOS trigger rate, (4) **Infrastructure**: Supabase query latency, serverless function cold start time, API error rates, (5) **User**: DAU/MAU, feature adoption, drop-off points in booking flow. Currently tracking (1) and (2) via Sentry; the rest would need analytics integration (Plausible, PostHog, or similar).

---

## Behavioral & Leadership

### Q41. Describe your role in this project.

**Answer:** I was the sole full-stack developer responsible for: architecture design, frontend development (React/TypeScript), backend (Vercel serverless functions), database design (Supabase), security implementation (Aadhaar encryption, RLS), testing strategy (40 unit tests, CI/CD), deployment (Vercel, PWA), and production monitoring (Sentry, Web Vitals). I also handled product decisions (feature prioritization via phased roadmap) and technical documentation.

### Q42. How did you prioritize tasks?

**Answer:** Using a risk-based framework: Phase 1 = security (must-fix before any deployment), Phase 2 = high-priority bugs (broken features, user-facing issues), Phase 3 = code quality (maintainability, performance), Phase 4 = cleanup (dead code, unused imports), Phase 5 = production features (real payments, real SMS). Each phase was estimated in days and tracked in TASKS.md. The key insight: security first, then correctness, then quality, then features.

### Q43. How did you handle scope creep?

**Answer:** The phased approach was the guardrail. When new ideas came up (e.g., "add WhatsApp integration"), they went into Phase 5 or a future phase. The TASKS.md document served as the single source of truth — if it wasn't in the task list, it wasn't being built. The "confirm before expanding" principle helped: I'd complete the current phase, show results, then discuss next steps.

### Q44. How did you ensure code quality across the codebase?

**Answer:** Five mechanisms: (1) TypeScript strict mode — catches type errors at compile time, (2) ESLint with custom rules (no-console, no-explicit-any), (3) Consistent patterns — every store method follows tryDatabase+fallback, every error uses handleError, (4) Code review — AI reviewer checked every significant change, (5) Tests — 40 tests covering pure functions, hooks, and data integrity. The result: zero runtime type errors, consistent error handling, and no console.log in production.

### Q45. What would you tell a new developer joining this project?

**Answer:** (1) Read TASKS.md first — it documents every decision and why, (2) The app works in demo mode — no API keys needed for development, (3) Every feature has a fallback — trace the tryDatabase pattern to understand the data flow, (4) Check docs/ for migration SQL — some Supabase changes are manual, (5) Run `npm run test` before committing — the CI pipeline will catch it anyway, (6) The target user is a rural Indian farmer on a $50 phone — optimize for that constraint.

---

## Future Vision

### Q46. What's next for RuralCare Connect?

**Answer:** Phase 5 remaining: (1) Server-side hospital data (replace mock doctors with real directory), (2) E2E tests (Playwright for critical flows), (3) Full accessibility audit (WCAG 2.1 AA). Beyond that: (4) WhatsApp integration (more common than SMS in rural India), (5) Multilingual support (Hindi, Tamil, Telugu), (6) Telemedicine video calls, (7) Government health scheme integration (Ayushman Bharat), (8) Offline write queue UI indicator.

### Q47. How would you scale this to 1M users?

**Answer:** (1) **Database**: Supabase Pro plan with connection pooling, read replicas for hospital queries, (2) **CDN**: Vercel Edge Network already handles static assets, (3) **Caching**: Redis layer for hospital data (reduce Supabase load), (4) **Queue**: Replace IndexedDB with a proper job queue (BullMQ) for SMS delivery, (5) **Monitoring**: Add Datadog/Grafana for infrastructure metrics, (6) **Testing**: Load testing with k6 to find bottlenecks, (7) **Feature flags**: LaunchDarkly for gradual rollouts.

### Q48. What technologies would you add?

**Answer:** (1) **Redis** — for session caching and rate limiting, (2) **Elasticsearch** — for full-text hospital/doctor search, (3) **WebSockets** — for real-time appointment updates, (4) **Push Notifications** — via Firebase Cloud Messaging for appointment reminders, (5) **Analytics** — PostHog or Plausible for user behavior, (6) **Feature Flags** — for gradual rollouts, (7) **A/B Testing** — for UI optimization, (8) **Multilingual** — i18next for Hindi/Tamil/Telugu.

### Q49. How would you add real-time features?

**Answer:** Supabase Realtime (built-in PostgreSQL changes) for: (1) appointment status updates (doctor marks complete → patient sees it instantly), (2) new medical reports (lab uploads → patient gets notified), (3) hospital availability (bed count changes). Implementation: `supabase.channel("appointments").on("postgres_changes", { event: "UPDATE", schema: "public", table: "appointments" }, callback).subscribe()`. This replaces polling and gives instant UI updates.

### Q50. What's the long-term vision?

**Answer:** RuralCare Connect aims to be the "super app" for rural healthcare in India — a single app where a farmer can: find a hospital, book an appointment, get AI health advice, store medical records, pay for services, and trigger emergencies. The offline-first architecture is the moat — no competitor solves the connectivity problem. Long-term: integrate with Ayushman Bharat (India's national health insurance), add telemedicine, and build a health data lake for preventive care analytics.

---

# PART B: Technical Drilldown Questions

---

## Architecture & System Design

### T1. Walk me through the architecture of RuralCare Connect.

**Answer:** RuralCare Connect is a full-stack healthcare PWA. Frontend: React 18 + TypeScript + Vite, styled with Tailwind CSS and shadcn/ui. Auth: Firebase Auth (Google OAuth + Phone OTP). Data: Supabase (PostgreSQL) + localStorage fallback. State: TanStack Query. Backend: Vercel Serverless Functions proxying Gemini AI, AWS Location, Razorpay, Vonage SMS. Monitoring: Sentry with browser tracing + replay.

### T2. Why Supabase over Firebase Firestore?

**Answer:** Firestore doesn't support JOIN queries needed for relational healthcare data. Supabase gives us PostgreSQL with full SQL, RLS policies, and a relational model. We kept Firebase Auth (it handles phone OTP perfectly) and deleted dead Firestore/Storage code in Phase 2.

### T3. Explain the offline-first data strategy.

**Answer:** Dual-write: localStorage first (instant), Supabase async. Reads: Supabase → localStorage fallback. Failed writes → IndexedDB queue → retry on `online` event. Max 5 retries per write. This gives eventual consistency for rural users with spotty connectivity.

### T4. How does `tryDatabase` work?

**Answer:** Generic wrapper: execute Supabase call → if error, queue write (if queueInfo provided) → return fallback. Used by every store method. The queueInfo parameter captures table, operation, payload, and filters for retry.

### T5. How do you handle environment configuration?

**Answer:** Client keys use `VITE_` prefix. Sensitive keys stay server-side in Vercel. Features degrade gracefully: no Sentry DSN → no error tracking, no Razorpay key → demo payment, no Vonage key → logged SMS. `.env.example` documents all vars.

---

## Security

### T6. How did you secure Aadhaar numbers?

**Answer:** AES-256-GCM encryption via Web Crypto API. `encryptAadhaar()` encrypts before Supabase write, `decryptAadhaar()` reverses on read. `hashAadhaar()` enables lookups without decryption. Legacy unencrypted fallback supported.

### T7. What RLS policies did you implement?

**Answer:** Policies for 4 tables using `auth.uid()`: patients (own data only), appointments (scoped to patient_id), medical_reports (scoped to patient_id), hospitals (read-only for all, write for service role). Documented in `docs/sec2-rls-setup.md`.

### T8. How do you prevent API key exposure?

**Answer:** All sensitive calls go through `/api/` serverless functions. Keys live in Vercel env vars. Client only sees the proxy endpoint. Removed `@google/generative-ai` SDK from client code.

### T9. What security headers are in place?

**Answer:** CORS on serverless functions, `AbortSignal.timeout()` on external fetches, HTTPS via Vercel, PWA service worker with Workbox. Would add CSP headers and rate limiting in production.

### T10. How do you handle secret rotation?

**Answer:** Server-side keys: update Vercel dashboard, no redeploy needed. Client-side keys: require redeployment (baked into build). Missing keys → feature degrades to demo mode, no crash.

---

## Frontend Engineering

### T11. Explain the TanStack Query integration.

**Answer:** `useNearbyHospitals` uses `useQuery` with: `staleTime: 5min`, `gcTime: 30min`, `retry: 1`, `refetchOnWindowFocus: false`. Query function: getUserLocation → getAddress → check cache → fetch if stale → calculate distances → sort.

### T12. How does the Haversine formula work?

**Answer:** Calculates great-circle distance: `a = sin²(Δlat/2) + cos(lat1)*cos(lat2)*sin²(Δlon/2)`, `c = 2*atan2(√a, √(1-a))`, `distance = 6371 * c` km. Rounds to 1 decimal place.

### T13. How does Emergency SOS work end-to-end?

**Answer:** (1) `tel:108` → India emergency call, (2) geolocation → GPS coords, (3) Web Share API → patient info + Google Maps link, (4) `/api/send-sms` → SMS to emergency contacts via Vonage. Each step has fallbacks.

### T14. How did you implement FocusTrap?

**Answer:** Queries focusable elements, focuses first on mount, traps Tab cycling, Escape calls onClose. Uses `useRef` for onClose to avoid re-registering keydown handler. Applied to EmergencyModal.

### T15. Explain page transitions.

**Answer:** `AnimatePresence mode="wait"` with framer-motion: `initial: { opacity: 0, y: 15, filter: "blur(4px)" }` → `animate: { opacity: 1, y: 0, filter: "blur(0px)" }`. Keyed by `location.pathname` for route-change triggers.

---

## Backend & APIs

### T16. Explain the Gemini AI integration.

**Answer:** Client sends full conversation history to `/api/gemini`. Server function calls Google Gemini API. Response appended as "model" message. Error handling via handleError + fallback message.

### T17. How does hospital scraping work?

**Answer:** Fallback chain: AWS Location Service (`/api/hospital-scraper`) → OpenStreetMap Overpass API. Results cached in Supabase with `cached_at` timestamp (60min freshness). Distances calculated client-side via Haversine.

### T18. Explain the Vonage SMS integration.

**Answer:** Serverless function receives contacts + patient info + GPS. Sends SMS: "EMERGENCY from [name] — Blood: [group], Age: [age]. [Google Maps link]". Demo mode when VONAGE_API_KEY not set.

### T19. How does Razorpay work?

**Answer:** Dynamically loads `checkout.razorpay.com` from CDN. `openRazorpayCheckout()` with publishable key, amount in paise, INR currency. Demo fallback when key not configured. Secret stays server-side.

### T20. How do you handle API rate limiting?

**Answer:** `AbortSignal.timeout()` on all external fetches (5-15s). Fallback chain for hospital APIs. TanStack Query retry:1. Offline queue for persistent failures.

---

## Data Modeling

### T21. Explain the Patient data model.

**Answer:** uid, aadhaar (encrypted), fullName, phone, gender, bloodGroup, age, height, weight, address, houseNumber, emergencyContacts[]. Emergency contacts are JSONB array (embedded, not separate table) because they're always loaded with patient.

### T22. How does appointment booking work?

**Answer:** Symptom → AI specialization suggestion → doctor filter → date/time selection → `appointmentStore.add()` (localStorage + Supabase). "Mark Complete" → status update + auto-generated report.

### T23. Why localStorage + Supabase?

**Answer:** localStorage: instant reads, works offline. Supabase: persistence, sync, server queries. Dual-write: app works without internet while eventually syncing. Offline queue prevents data loss.

### T24. How is hospital data cached?

**Answer:** `cacheHospitals()` upserts with `cached_at`. `getCachedHospitals(maxAge)` filters by age. Flow: check cache → if stale, fetch fresh → re-cache.

### T25. Explain `DbResult<T>`.

**Answer:** Standardizes Supabase response: `{ data: T | null; error: { message: string } | null }`. Used by `tryDatabase` to decide: error → throw + fallback, success → return data.

---

## Performance

### T26. How did you fix render-blocking fonts?

**Answer:** Moved Google Fonts from CSS `@import` to `<link>` tags in `index.html` with `<link rel="preconnect">`. Fonts load in parallel with CSS. ~200ms faster FCP.

### T27. Explain AbortController.

**Answer:** `useRef<AbortController>` in useNearbyHospitals. Aborts previous request before new fetch. Cleanup on unmount. Prevents stale state updates.

### T28. What metrics do you track?

**Answer:** Web Vitals (CLS, FCP, LCP, TTFB) via `web-vitals` → Sentry. Sentry browser tracing (20% sampling). Error replays (100% on errors).

### T29. How does code splitting work?

**Answer:** Vite auto-splits by route (dynamic imports). Separate chunks for vendor libs and pages. Service worker precaches all built assets.

### T30. How did you optimize the build?

**Answer:** SWC instead of Babel, Tailwind purge, PWA precaching, TanStack Query staleTime, IndexedDB for offline queue.

---

## Testing

### T31. Explain your test strategy.

**Answer:** 40 tests, 7 files, Vitest + jsdom. Unit tests for pure functions (calculateDistance, cn, getHospitalById), error handling (handleError), hooks (useNearbyHospitals), data integrity. No snapshots. E2E deferred to Phase 5.

### T32. How do you mock Sentry and Supabase?

**Answer:** `vitest.mock("@sentry/react")` → vi.fn() for withScope/captureException. `vitest.mock("sonner")` → toast.error. useNearbyHospitals mocks location, scraper, supabaseDb. QueryClient with retry:false.

### T33. What does CI/CD do?

**Answer:** GitHub Actions: lint → typecheck → test → build (build depends on others). Cancel-in-progress concurrency. Node 20 + npm cache.

### T34. How did you test FocusTrap?

**Answer:** Implicitly via EmergencyModal. Verifies: renders children, sets role="dialog", Tab cycling, Escape closes. fireEvent.keyDown for keyboard simulation.

### T35. Why Vitest over Jest?

**Answer:** Native to Vite (same config/aliases), faster (ESM natively), globals:true for Jest-compatible API, jsdom for browser APIs.

---

## DevOps & Deployment

### T36. How is the app deployed?

**Answer:** Vercel auto-detects Vite. Push to main → production. PRs → preview URLs. Serverless functions auto-deployed. PWA service worker generated during build.

### T37. Explain serverless functions.

**Answer:** `/api/gemini.ts` → Gemini AI proxy. `/api/hospital-scraper.ts` → AWS Location proxy. `/api/send-sms.ts` → Vonage SMS. Each: CORS handling, input validation, JSON response. Keys in Vercel env vars.

### T38. How do you handle migrations?

**Answer:** SQL in `docs/` files (manual execution in Supabase Dashboard). Chosen over automated: free tier limitation, forces review, infrequent changes.

### T39. How does PWA work?

**Answer:** `vite-plugin-pwa` → `sw.js` + `workbox-*.js`. Precaches 14 entries (~1.4MB). Serves cached assets offline, checks for updates in background.

### T40. How do you handle secrets?

**Answer:** Dev: `.env` (gitignored). Prod: Vercel dashboard. `.env.example` documents. Firebase/Supabase anon keys are public (RLS protects). Sensitive keys server-side only.

---

## Problem Solving

### T41. Hardest technical challenge?

**Answer:** Dual-write consistency (localStorage + Supabase). Solved with: localStorage-first, Supabase async, IndexedDB queue, retry on online event.

### T42. Why not Redux?

**Answer:** Data is page-scoped, not global. TanStack Query handles server state better. useState for UI state. Context only for auth (infrequent changes, needed everywhere).

### T43. Firebase-to-Supabase migration?

**Answer:** Incremental. Kept Firebase Auth. Deleted dead Firestore/Storage code. Fresh Supabase tables. `tryDatabase` pattern allows coexistence.

### T44. What would you do differently?

**Answer:** Supabase Auth from start, offline queue earlier, E2E tests earlier, Supabase CLI for migrations, monorepo for API functions.

### T45. TypeScript strictness?

**Answer:** `strict: true`. Added typed interfaces for Supabase rows. `as unknown as DbResult<T>` double-cast for Supabase return types. Removed all eslint-disable comments.

---

## React Patterns

### T46. AuthContext implementation?

**Answer:** `{ user, loading, logout }` via createContext. Firebase onAuthStateChanged listener. Protected routes: `if (!user) navigate("/login")`. Loading state prevents flash.

### T47. Form validation?

**Answer:** Controlled components + useState. Submit-time validation: required checks, regex (phone: /^[6-9]\d{9}$/), email format, password length. Errors in Record<string, string>.

### T48. How does `cn` work?

**Answer:** `clsx` (conditional classes) + `twMerge` (Tailwind dedup). `cn("text-red", "text-blue")` → "text-blue". Standard shadcn/ui pattern.

### T49. Error handling?

**Answer:** `handleError(error, message, context)` → Sentry + toast. `handleErrorSilent` → Sentry only. EmergencyModal: geolocation fail → share without location, SMS fail → "call 108".

### T50. Framer Motion's role?

**Answer:** Page transitions (blur+slide), staggered lists, modal animations, hover effects, loading skeletons, SOS pulse. Spring physics for natural motion.

---

## Quick-Fire

| # | Question | Answer |
|---|----------|--------|
| QF1 | What is the project? | Healthcare PWA for rural India — hospital finder, appointments, records, SOS, AI assistant |
| QF2 | Tech stack? | React 18 + TypeScript + Vite + Tailwind + shadcn/ui + Supabase + Firebase Auth + Vercel |
| QF3 | Why these choices? | React ecosystem, Vite speed, Tailwind performance, Supabase relational model, Vercel zero-config |
| QF4 | Biggest challenge? | Offline-first dual-write consistency between localStorage and Supabase |
| QF5 | How many tests? | 40 unit tests across 7 files (Vitest + jsdom) |
| QF6 | Deployment? | Vercel (auto-detect Vite), GitHub Actions CI/CD |
| QF7 | Security? | AES-256-GCM Aadhaar encryption, Supabase RLS, server-side API keys |
| QF8 | Offline support? | localStorage cache + IndexedDB write queue + PWA service worker |
| QF9 | Target user? | Rural Indian farmers on低端 Android phones with spotty connectivity |
| QF10 | What's next? | Real hospital data, E2E tests, multilingual, telemedicine |

---

# PART C: Functional / Domain Questions

---

## User Onboarding & Authentication

### F1. Walk me through the complete user journey from first visit to first appointment booking.

**Answer:** (1) User visits the PWA → splash screen + service worker registration, (2) Redirected to `/login` → sees Phone OTP and Google sign-in options, (3) Enters phone number → Firebase sends OTP → enters code → verified, (4) Profile setup page → fills name, age, blood group, Aadhaar (encrypted before storage), (5) Lands on dashboard → can navigate to Hospitals, Doctors, Appointments, Reports, or Assistant.

### F2. What happens if a user loses their phone or switches devices?

**Answer:** Firebase Auth handles cross-device sessions — the user logs in with the same phone number or Google account and gets back their profile from Supabase. All data (appointments, reports, emergency contacts) is server-synced. localStorage data is device-specific, so the new device gets a fresh local cache that populates on first Supabase read. The offline queue only exists on the original device.

### F3. How do you handle account deletion / data portability?

**Answer:** Currently not implemented — this would be a Phase 6 task. GDPR/DPDPA (India's data protection law) requires: (1) data export endpoint (JSON dump of patient + appointments + reports), (2) account deletion that cascades to Supabase (delete patient → delete appointments → delete reports), (3) Firebase Auth user deletion. The Supabase RLS policies would need a `DELETE` policy. Implementation: serverless function that takes the user's auth token and performs cascading deletes.

### F4. What if two users try to book the same doctor slot simultaneously?

**Answer:** Currently there's no server-side slot locking — the last write wins. In production, this needs: (1) a `doctor_slots` table with unique constraints on (doctor_id, date, time_slot), (2) an `INSERT ... WHERE NOT EXISTS` pattern in the serverless function, (3) optimistic UI — if the insert fails, show "Slot no longer available" and refresh the doctor's schedule. This is a known limitation in the current demo mode.

---

## Hospital Discovery Flow

### F5. How does the hospital finder handle users in areas with no hospitals nearby?

**Answer:** The Overpass API search expands the radius progressively — if no results within 5km, it tries 10km, then 25km, then 50km. If still no results, the UI shows "No hospitals found nearby" with a manual search input that lets the user type any city name. The manual search uses Nominatim geocoding to find coordinates for the city, then fetches hospitals for that area. This handles rural areas where the nearest hospital might be 30+ km away.

### F6. How accurate is the hospital distance calculation?

**Answer:** The Haversine formula calculates great-circle distance (as-the-crow-flies), which is typically 20-40% shorter than actual road distance. For a rural user, this is acceptable for initial filtering — the user will still need to navigate with a map app. The distance is displayed as a badge ("Very Close" <10km, "Close" <25km, "Medium" <50km, "Far" >50km) rather than a precise number, so the approximation doesn't mislead.

### F7. What happens if the geolocation permission is denied?

**Answer:** `getUserLocation()` catches the error and returns `null`. The UI shows the manual location search input immediately (this was added in Phase 4 — the useEffect watches for the error and auto-shows the search bar). The user can type any city name to find hospitals there. The app remains fully functional without GPS — just without automatic distance sorting.

### F8. How do you prevent stale hospital data from misleading users?

**Answer:** Hospital cache has a 60-minute freshness window (`cached_at` timestamp). If stale, fresh data is fetched from Overpass API. The cache is per-location — if the user searches for Madurai hospitals, that's cached separately from Srivilliputhur hospitals. Manual search always triggers a fresh fetch. The Supabase `cached_at` column enables this per-location freshness check.

---

## Appointment Booking

### F9. How does the symptom-to-specialization mapping work?

**Answer:** `DISEASE_SPECIALIZATION` is a hardcoded map in `mockData.ts` with ~20 entries: `"fever": "General Physician"`, `"chest pain": "Cardiologist"`, `"pregnancy": "Gynecologist"`, etc. When the user types symptoms, the app checks for keyword matches (case-insensitive) and pre-selects the matching specialization in the doctor filter. This is a heuristic — not a diagnosis. The user can always override the suggestion.

### F10. What if the mapped specialization has no available doctors?

**Answer:** The doctor list filters by specialization first, then falls back to showing all doctors if no match. The UI shows the suggested specialization as a chip but allows the user to remove it and browse all doctors. In demo mode, doctors are generated deterministically from the hospital ID, so there's always at least 3-5 doctors per hospital.

### F11. How does the appointment time slot system work?

**Answer:** Each doctor has a `timeSlots` array of strings like `["09:00", "09:30", "10:00", ...]` generated deterministically. These represent 30-minute slots from 9 AM to 5 PM. When a user books, the slot is written to localStorage + Supabase. There's no conflict checking (see F4) — this is a known demo limitation. In production, a slots table would prevent double-booking.

### F12. What happens to an appointment after it's booked?

**Answer:** Three states: (1) "scheduled" — default, shows on AppointmentsPage, (2) "completed" — user clicks "Mark Complete" → status updates, a mock medical report is auto-generated with random vitals (BP, temperature, weight), (3) the report becomes visible in ReportsPage (but locked behind payment). The appointment lifecycle is: booked → completed → report generated → report unlocked (payment) → report viewed.

### F13. Can a user cancel an appointment?

**Answer:** Currently no cancel button — the user can only mark as complete. In production, cancellation should: (1) update status to "cancelled" in Supabase, (2) notify the doctor (via real-time or push notification), (3) optionally refund any advance payment. This is a Phase 6 feature. The `updateStatus` method in the store already supports arbitrary status strings, so the backend is ready.

---

## Medical Reports & Payments

### F14. Why are reports locked behind payment?

**Answer:** This models the real-world scenario where lab tests require payment before results are released. It also demonstrates a monetization pattern — the app could take a commission on report unlocks. In the current implementation, the payment unlocks a report for the user's account permanently (stored in localStorage `unlockedReports[]`). If they clear browser data, they'd need to pay again — a production version would track unlocks server-side.

### F15. What if the payment fails mid-transaction?

**Answer:** The Razorpay checkout has `onDismiss` and `onError` callbacks. On dismiss: user sees "Payment cancelled" toast, nothing changes. On error: user sees "Payment failed" toast with retry suggestion. The report remains locked. No partial state — the unlock only happens on explicit success. The `handlePaymentSuccess` function only runs after Razorpay confirms the payment.

### F16. How does demo mode handle payment?

**Answer:** When `VITE_RAZORPAY_KEY_ID` is not set, clicking "Unlock" triggers a 1.5-second `setTimeout` that calls `handlePaymentSuccess`. This simulates the payment flow without any real money movement. The UI shows the same button states ("Processing..." → "Unlocked!"). This lets developers and stakeholders test the complete flow without Razorpay credentials.

### F17. What medical data is stored in a report?

**Answer:** `MedicalReport` has: id, patientId, hospitalId, date, type ("blood_test"/"x_ray"/"general"/"prescription"), title (e.g., "Complete Blood Count"), summary (text description), and `results` object (key-value pairs like `{ hemoglobin: "12.5 g/dL", wbc_count: "7000/μL" }`). Reports are auto-generated when appointments are marked complete — in production, these would come from actual lab systems.

---

## Emergency SOS

### F18. What are the five steps of the SOS flow and why that order?

**Answer:** Order matters because of user attention: (1) `tel:108` fires immediately — user needs to start talking to emergency services before anything else, (2) geolocation runs in background while user talks to 108, (3) Web Share API shares the user's GPS link — user can send to anyone nearby, (4) SMS to emergency contacts fires last because it's the slowest (network-dependent), (5) UI updates to "SOS Activated" state. The tel: link fires first because it's the most time-critical — every second counts in an emergency.

### F19. What if the user has no emergency contacts configured?

**Answer:** The SOS still works — steps 1-3 (call 108, get GPS, Web Share) don't require contacts. The SMS step is skipped. The UI shows "No emergency contacts saved" and suggests adding them in Profile. The confirm step displays the contact count so the user knows before triggering. The system degrades gracefully — core emergency actions always fire.

### F20. How does the SMS content help responders?

**Answer:** SMS includes: patient name, blood group, age, and a Google Maps link with GPS coordinates. This gives responders critical info before they arrive: (1) name for identification, (2) blood group for transfusion decisions, (3) age for treatment calibration, (4) exact location for navigation. The Google Maps link opens in any phone's browser — no app needed.

### F21. What happens if geolocation fails during SOS?

**Answer:** The flow continues without GPS. The SMS is sent without the Google Maps link. The Web Share includes patient info but no location. The user can still call 108 — the operator will ask for their location verbally. The app catches the geolocation error and logs it to Sentry but doesn't block the emergency flow. Graceful degradation is critical for emergencies.

### F22. Could a malicious user abuse the SOS button?

**Answer:** The SOS requires profile completion (checks `patient` exists) and has a two-step confirmation (click SOS → confirm). The confirmation step shows what will happen (call 108, send SMS to X contacts). For production: add rate limiting (max 1 SOS per 5 minutes), log all SOS triggers to Supabase for audit, and consider adding a "false alarm" cancellation within 30 seconds. Currently the `handleSOS` fires immediately on confirm — no undo.

---\n
## AI Health Assistant

### F23. What are the limitations of the AI chatbot?

**Answer:** Three key limitations: (1) **No diagnosis** — the chatbot is pre-prompted to give general health information, not medical diagnoses, (2) **No memory** — each page refresh starts a fresh conversation (messages are in React state, not persisted), (3) **No image input** — text only, so users can't share photos of symptoms or prescriptions. In production, conversation history should persist in Supabase, and the system prompt should include stronger disclaimers.

### F24. How do you prevent the chatbot from giving dangerous advice?

**Answer:** The system prompt includes: "You are Asha, a helpful AI health assistant. Provide general health information and guidance. Always recommend consulting a doctor for serious concerns. Do not diagnose conditions or prescribe medications." This is a soft guardrail — it relies on the LLM's training. For production, add: (1) output filtering for prescription/diagnosis keywords, (2) mandatory disclaimer on every response, (3) escalation to "Please call a doctor" for severe symptom keywords.

### F25. What would you improve about the AI integration?

**Answer:** (1) **Persist conversations** in Supabase so users can reference past advice, (2) **Add structured health assessments** — symptom checker with branching logic instead of free-form chat, (3) **Multi-language** — translate the system prompt and user input for Hindi/Tamil speakers, (4) **RAG (Retrieval-Augmented Generation)** — index WHO guidelines and Indian government health data so responses are evidence-based, (5) **Voice input** — rural users may prefer speaking over typing.

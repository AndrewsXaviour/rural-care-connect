# RuralCare Connect — Audit Summary

## What Is This Project?

RuralCare Connect is a **React + TypeScript healthcare platform** for rural Indian communities. It provides hospital discovery, appointment booking, medical records, an AI health assistant ("Asha"), and emergency SOS — built with Vite, Tailwind CSS, shadcn/ui, and Framer Motion.

**Stack:** React 18 · Vite 5 · TypeScript · Tailwind · Firebase (Auth) · Supabase (DB) · Gemini AI · AWS Location Service

---

## Architecture at a Glance

```
React SPA (Vite)
├── Auth: Firebase Phone OTP / Google / Email
├── Data: Supabase PostgreSQL (primary) + Firebase Firestore (hospital cache)
├── AI: Google Gemini (health assistant)
├── Maps: AWS Location → Overpass OSM (fallback)
├── Caching: localStorage (offline-first)
└── Deploy: Firebase Hosting (current) → Vercel (planned)
```

---

## Scorecard

| Category | Score | Verdict |
|----------|-------|---------|
| Architecture | 4/10 | Dual backend confusion, unused TanStack Query |
| Maintainability | 5/10 | Clean components but duplicated logic |
| Scalability | 3/10 | localStorage cache, no pagination, client-side filtering |
| Performance | 5/10 | Good Vite setup but N+1 writes, unused deps |
| Security | 2/10 | API keys in client, no RLS, Aadhaar in plaintext |
| Reliability | 3/10 | No retries, no error tracking, fake SOS/payment |
| Testability | 1/10 | Zero tests anywhere |
| Developer Experience | 6/10 | Good TS setup, Vite dev server, but no CI |
| **Overall** | **3.6/10** | **Not production-ready** |

---

## Top 10 Findings

### 🚨 Critical (3)

1. **API keys exposed in client bundle** — `VITE_GEMINI_API_KEY` and `VITE_AWS_LOCATION_SERVICE_API_KEY` are visible in browser DevTools
2. **No Supabase Row Level Security** — Any user can read/modify any patient's data
3. **Aadhaar numbers stored in plaintext** — Legal liability under Indian IT Act

### ⚠️ High (6)

4. **Dual backend without clear ownership** — Firebase Firestore + Supabase both used for hospital caching, data can diverge
5. **51+ console.log statements** — Debug emojis (`🔥💾☁️❌`) in production code
6. **Mock data injected into real API results** — Fake hospitals mixed with real ones
7. **Emergency SOS is simulated** — Countdown timer, no actual hospital notification
8. **Payment flow is fake** — `setTimeout` simulates payment processing
9. **N+1 Firebase writes** — Individual `setDocument` calls per hospital instead of batch

### 📋 Medium (8)

10. TanStack Query installed but unused (15KB wasted)
11. `any` types in store/supabaseDb layer
12. Duplicated hospital lookup logic across 3 pages
13. No request deduplication / AbortController
14. Render-blocking Google Fonts via CSS `@import`
15. No error tracking (Sentry, etc.)
16. Silent error swallowing (8+ `catch {} // Ignore`)
17. No structured logging

---

## What's Working Well ✅

- Polished dark UI with glass morphism and smooth animations
- Clean component architecture (pages/components/hooks/lib separation)
- TypeScript adoption throughout (except store layer)
- PWA configuration with service worker
- Vite build optimization with manual chunks
- Multi-auth support (Phone OTP, Google, Email)
- Location fallback chain (Browser → IP → Manual)

---

## Files Analyzed

| File | Lines | Key Issues |
|------|-------|-----------|
| `src/lib/store.ts` | 260+ | `any` types, no Supabase types |
| `src/lib/hospitalScraper.ts` | 225+ | Mock injection, API keys in client |
| `src/lib/supabase.ts` | 25 | Side effect on import |
| `src/lib/firebaseDb.ts` | 170+ | N+1 writes, unused by main flow |
| `src/lib/firebaseStorage.ts` | 45 | Completely dead code |
| `src/lib/gemini.ts` | 40 | API key in client |
| `src/hooks/useAuth.ts` | 25 | Dead code, duplicates AuthContext |
| `src/pages/ReportsPage.tsx` | 200+ | Fake payment |
| `src/components/EmergencyModal.tsx` | 140+ | Fake SOS |
| `functions/src/index.ts` | 70 | Unused Cloud Function |

---

*Generated from TECHNICAL_AUDIT.md — June 18, 2026*

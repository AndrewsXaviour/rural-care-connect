# 🗺️ RuralCare Connect — Full-Stack Learning Roadmap

This document maps **every technology** used in this repository into a structured learning path.  
Each section includes **what it is**, **where it's used in this repo**, and **projects to build** to master it.

---

## 📦 Phase 1: Foundation (Week 1–2)

### 1. HTML5 & CSS3 (Prerequisite)

| Topic | Where Used in Repo | Mini Project |
|-------|--------------------|--------------|
| Semantic HTML tags | `index.html`, all `.tsx` components | Build a profile card |
| CSS Flexbox & Grid | Every page layout (`grid gap-4`, `flex items-center`) | Recreate a hospital listing card |
| CSS Variables | `index.css` (`--primary`, `--radius`, etc.) | Theme switcher |
| Responsive Design | `sm:`, `md:` breakpoints throughout | Mobile-responsive navbar |

### 2. TypeScript (Prerequisite)

| Topic | Where Used | Mini Project |
|-------|------------|--------------|
| Types & Interfaces | `mockData.ts` — `Hospital`, `Doctor`, `Patient` | Type a todo item |
| Generics | `firebaseDb.ts` — `<T extends DocumentData>` | Generic API fetcher |
| Union Types | `Appointment["status"]` — `"booked" | "completed" | "cancelled"` | Status badge component |
| `import.meta.env` | `.env` variables prefixed `VITE_` | Config loader |
| `as const` / `satisfies` | `tailwind.config.ts` | Color palette constants |

---

## 🎨 Phase 2: Styling & UI (Week 2–3)

### 3. Tailwind CSS 3

| Concept | Repo Location | Try It |
|---------|---------------|--------|
| Utility classes | Any `.tsx` file (e.g. `p-4`, `text-white`, `bg-secondary`) | Style a button 10 ways |
| `@apply` | Not used (utility-first is preferred) | — |
| Dark mode | `tailwind.config.ts` → `darkMode: ["class"]` | Dark/Light toggle |
| Custom config | `tailwind.config.ts` — `colors.primary`, `borderRadius` | Add a brand color |
| Animations | `animate-fade-in`, `animate-pulse` in pages | Entrance animation |
| `cn()` helper | `utils.ts` — merges Tailwind classes | Conditional class combiner |

### 4. shadcn/ui Components

| Component | File | How to Learn |
|-----------|------|-------------|
| **Button** | `components/ui/button.tsx` | Read `cva()` — variant-based styling |
| **Card** | `components/ui/card.tsx` | Build an appointment card |
| **Dialog/AlertDialog** | `components/ui/dialog.tsx` | Confirmation modal |
| **Popover** | `components/ui/popover.tsx` → used in `DoctorsPage.tsx` | Tooltip with custom content |
| **Calendar** (date picker) | `components/ui/calendar.tsx` + `DoctorsPage.tsx:292-315` | **Watch how `react-day-picker` + `Popover` makes a date picker** |
| **Input** | `components/ui/input.tsx` | Styled text field |
| **Select** | `components/ui/select.tsx` | Dropdown menu |
| **Tabs** | `components/ui/tabs.tsx` | Tabbed dashboard |
| **Toast/Sonner** | `components/ui/sonner.tsx` + `toast("message")` | Success/error notifications |
| **Form** | `components/ui/form.tsx` + `react-hook-form` | Validated signup form |

**🔑 Key Insight — How the Date Picker Works (example):**

```tsx
// 1. Popover wraps the trigger button + calendar popup
<Popover>
  <PopoverTrigger asChild>
    <Button>
      <CalendarIcon /> {date ? format(date, "PPP") : "Pick a date"}
    </Button>
  </PopoverTrigger>
  <PopoverContent>
    {/* 2. shadcn Calendar wraps react-day-picker with dark theme styling */}
    <CalendarPicker
      mode="single"
      selected={date}
      onSelect={setDate}
      disabled={(d) => d < new Date()}   // 3. Disable past dates
    />
  </PopoverContent>
</Popover>
```

### 5. Lucide Icons

```tsx
import { Heart, MapPin, Calendar } from "lucide-react";
<Heart className="w-5 h-5 text-red-500" />
```

- Browse all icons at [lucide.dev](https://lucide.dev)
- Use `className` for sizing & coloring (works with any Tailwind class)

### 6. Framer Motion — Animations

| Pattern | Repo Location |
|---------|---------------|
| `motion.div` variants | `HospitalsPage.tsx:102-110` — staggered list |
| `AnimatePresence` | `HospitalsPage.tsx:169` — enter/exit |
| `initial` / `animate` / `exit` | Every page |
| `whileHover` / `whileTap` | Buttons & cards |
| `spring` transitions | `DoctorsPage.tsx` — `type: "spring", stiffness: 400` |

**Practice:** Animate a list of items appearing one by one (stagger).

---

## ⚛️ Phase 3: React Core (Week 3–5)

### 7. React 18

| Concept | Repo Usage |
|---------|-----------|
| `useState` | Every page — form inputs, modals |
| `useEffect` | `HospitalsPage.tsx:34` — cache to localStorage |
| `useRef` | `LoginPage.tsx` — reCAPTCHA ref |
| `useMemo` | `DoctorsPage.tsx:72` — filtered doctor list |
| Custom Hooks | `useNearbyHospitals.ts`, `useAuth.ts`, `useAuthContext.ts` |
| Context API | `AuthContext.tsx` — global auth state |
| `createRoot` | `main.tsx:43` |

### 8. React Router v6

| Feature | Repo File |
|---------|-----------|
| `<Route>` + `<Routes>` | `App.tsx` |
| `useParams()` | `DoctorsPage.tsx:48` — `hospitalId` |
| `useNavigate()` | Every page — redirects |
| `<Link>` | `NavLink.tsx` |
| Nested routes | `/hospitals/:hospitalId/doctors` |

### 9. Custom Hooks (Repos's Own)

| Hook | File | Purpose |
|------|------|---------|
| `useNearbyHospitals` | `hooks/useNearbyHospitals.ts` | GPS → API → sorted list |
| `useAuth` | `hooks/useAuth.ts` | Firebase auth state |
| `useAuthContext` | `hooks/useAuthContext.ts` | Consumes Auth context |
| `use-mobile` | `hooks/use-mobile.tsx` | Responsive breakpoint |

---

## 🔥 Phase 4: Backend & Services (Week 5–7)

### 10. Firebase

| Service | Repo File | What It Does |
|---------|-----------|--------------|
| **Auth** | `firebase.ts` + `firebaseAuth.ts` | Phone OTP, Google sign-in, email/password |
| **Firestore** | `firebaseDb.ts` | CRUD: hospitals, patients, reports |
| **Storage** | `firebaseStorage.ts` | File uploads (reports) |
| **Functions** | `functions/src/index.ts` | Serverless Google Places proxy |
| **Analytics** | `firebase.ts:22-31` | Page views, event tracking |
| **reCAPTCHA** | `LoginPage.tsx` | Bot protection for phone auth |

**Learning path:**
1. Console → Create a Firebase project
2. Enable Auth (Phone, Google, Email)
3. Create a Firestore collection
4. Deploy a cloud function

### 11. Supabase

| Feature | Repo Usage |
|---------|-----------|
| PostgreSQL DB | Patients, hospitals tables (unconfigured in local `.env`) |
| Auth | Alternative to Firebase Auth |
| Real-time | Not yet used, but supported |

### 12. TanStack React Query

| Concept | Repo Usage |
|---------|-----------|
| `useQuery` | Hospital data fetching |
| Cache invalidation | Auto-refetch on location change |
| Loading/error states | Used in `useNearbyHospitals` pattern |

---

## 🌐 Phase 5: APIs & Integrations (Week 6–8)

### 13. External APIs

| API | File | Purpose | Auth |
|-----|------|---------|------|
| **Gemini AI** | `gemini.ts` | AI health assistant chat | API key (server-side) |
| **Google Places** | `hospitalScraper.ts` (via Cloud Function) | Real hospital search | API key (server-side) |
| **OpenStreetMap Overpass** | `hospitalScraper.ts:65` | Free hospital geodata | None (rate-limited) |
| **Nominatim** | `HospitalsPage.tsx:55` | Address → coordinates | None |
| **Razorpay** | `razorpay.ts` | Payment gateway | Publishable key + secret |
| **Vonage SMS** | `api/send-sms.ts` | Emergency SOS SMS | API key + secret |

**Pattern to learn — API call with fallback:**

```tsx
// hospitalScraper.ts line 113-124
const result = await tier1() || await tier2() || fallbackMockData();
```

### 14. Environment Variables

```env
# .env — client-side (VITE_ prefix required for Vite)
VITE_FIREBASE_API_KEY=xxx

# Server-side only (no VITE_ prefix)
VONAGE_API_KEY=xxx      # Never sent to browser
```

**Rule:** Anything with `VITE_` gets bundled. Secrets go in server-only env vars.

---

## 🧰 Phase 6: Tooling & DX (Week 7)

### 15. Build Tools

| Tool | Repo File | Role |
|------|-----------|------|
| **Vite** | `vite.config.ts` | Fast dev server + bundler |
| **SWC** | `@vitejs/plugin-react-swc` | Rust-based TS/JSX compiler (fast!) |
| **TypeScript** | `tsconfig.json` | Type checking |
| **ESLint** | `eslint.config.js` | Code quality |
| **PostCSS** | `postcss.config.js` + `tailwind.config.ts` | CSS processing |

### 16. State Management & Forms

| Library | Repo Usage |
|---------|-----------|
| `react-hook-form` | `SignupPage.tsx` (form validation) |
| `zod` | Schema validation (with hookform/resolvers) |
| `localStorage` | `store.ts` — offline-first patient data |

---

## 🧪 Phase 7: Testing (Week 8)

### 17. Testing Stack

| Tool | Repo File | Type |
|------|-----------|------|
| **Vitest** | `vitest.config.ts` | Unit tests (fast, Vite-native) |
| **Playwright** | `playwright.config.ts` | E2E browser tests |
| **Testing Library** | `src/test/` | React component tests |

---

## 🚀 Phase 8: Production Features (Week 8–9)

### 18. Monitoring

| Tool | File | What It Tracks |
|------|------|----------------|
| **Sentry** | `main.tsx:11` | Error tracking, performance |
| **Web Vitals** | `main.tsx:30-33` | LCP, CLS, FCP, TTFB |
| **Firebase Analytics** | `firebase.ts:22` | User events |

### 19. Payments

```tsx
// razorpay.ts — order flow
1. Create order on server (Razorpay secret)
2. Get `order_id` from server response
3. Open Razorpay checkout with `order_id`
4. Verify payment signature on server
```

### 20. Offline Support

```tsx
// offlineQueue.ts
initOfflineQueue();          // Called in main.tsx
// Queues failed Supabase writes
// Retries when browser comes online
```

---

## 🏗️ Phase 9: Architecture Patterns (Ongoing)

### 21. Folder Structure

```
src/
├── components/       # Reusable UI
│   └── ui/           # shadcn components
├── pages/            # Route pages
├── hooks/            # Custom React hooks
├── lib/              # Utilities, API clients
├── api/              # Serverless routes (Vercel)
└── test/             # Test files
```

### 22. Key Patterns Used

| Pattern | Example |
|---------|---------|
| **Custom hook for data** | `useNearbyHospitals.ts` — encapsulates all hospital fetching logic |
| **Local-first storage** | `store.ts` — writes to localStorage before API |
| **Fallback chain** | AWS → Overpass → Mock data |
| **Context + Provider** | `AuthContext.tsx` — wraps app with auth state |
| **Lazy loading** | Not yet — add with `React.lazy()` + Suspense |

---

## 🎯 Learning Project Ideas

| # | Project | Tech to Practice |
|---|---------|------------------|
| 1 | **Todo App** | React, TypeScript, Tailwind, shadcn Button + Input |
| 2 | **Weather Dashboard** | API calls, `useEffect`, TanStack Query, recharts |
| 3 | **Auth Page** | Firebase Auth (Phone + Google), react-hook-form, zod |
| 4 | **Calendar Booking** | shadcn Calendar + Popover + date-fns |
| 5 | **E-commerce Cart** | Context API, Razorpay integration |
| 6 | **Chat UI** | Gemini API, framer-motion message animations |
| 7 | **Dashboard** | recharts charts, shadcn Card + Tabs, dark mode |

---

## 📚 Quick Reference — Most Used APIs

### shadcn Add a New Component
```bash
npx shadcn@latest add button card dialog popover calendar
```

### Tailwind — Common Classes
```
p-4       → padding: 1rem
gap-3     → gap: 0.75rem
flex-1    → flex: 1
rounded-xl → border-radius: 0.75rem
bg-secondary → background: var(--secondary)
text-primary → color: var(--primary)
```

### Vite Environment Variables
```tsx
const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const isDev = import.meta.env.DEV;     // true in dev mode
const isProd = import.meta.env.PROD;   // true in production build
```

### Firebase Auth (Phone OTP Flow)
```tsx
// See LoginPage.tsx for full implementation
const verifier = new RecaptchaVerifier(auth, "recaptcha-container", { size: "invisible" });
const confirmation = await signInWithPhoneNumber(auth, phone, verifier);
const result = await confirmation.confirm(otp);
```

---

## ✅ Checklist — Track Your Progress

```
[ ] HTML/CSS (Flexbox, Grid, Responsive)
[ ] TypeScript basics (types, interfaces, generics)
[ ] Tailwind CSS (utility classes, custom config)
[ ] shadcn/ui (Button, Card, Dialog, Calendar, Popover)
[ ] React (useState, useEffect, useMemo, custom hooks)
[ ] React Router (params, navigation, nested routes)
[ ] Framer Motion (variants, AnimatePresence)
[ ] Firebase (Auth, Firestore CRUD, Storage)
[ ] TanStack React Query (fetch, cache, refetch)
[ ] External APIs (REST, error handling, fallbacks)
[ ] Environment variables (VITE_ prefix, server-side)
[ ] Forms (react-hook-form + zod)
[ ] Payments (Razorpay flow)
[ ] Testing (Vitest, Playwright)
[ ] Production (Sentry, Web Vitals, offline support)
```

---

> **Tip:** Open this repo side-by-side with the [shadcn/ui docs](https://ui.shadcn.com/docs) and [Firebase docs](https://firebase.google.com/docs). Every component's source is in `src/components/ui/` — reading these directly is the best way to learn.
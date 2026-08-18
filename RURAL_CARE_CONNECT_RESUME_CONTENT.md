# RuralCare Connect - Resume / Portfolio Content

*Use the following bullet points and project descriptions in your resume, portfolio, or during technical interviews to emphasize your spec-driven engineering approach, system architecture, and responsible AI integration.*

## 📌 Project Title & Short Description
**RuralCare Connect** | *Lead Developer / Architect*
An offline-first, Progressive Web App (PWA) designed to bridge the healthcare accessibility gap in rural areas through resilient architecture, graceful degradation, and constrained AI triage.

## 🛠 Tech Stack
**Frontend:** React (Vite), TypeScript, Tailwind CSS, shadcn/ui, Framer Motion
**Backend & Database:** Supabase (PostgreSQL), Firebase Auth, Vercel Serverless Functions
**Resilience & AI:** IndexedDB (Offline Queue), Service Workers (PWA), Google Gemini API, Geolocation API (with IP Fallbacks)

---

## 📝 Resume Bullet Points (Tailor to your needs)

### Option 1: Emphasizing Spec-Driven & Resilient Architecture (Recommended)
*   **Engineered an offline-first architecture** using IndexedDB and `localStorage` to ensure zero-latency data access in low-bandwidth rural environments, achieving a 100% functional read-state without network connectivity.
*   **Implemented a robust "graceful degradation" synchronization queue**, allowing critical mutations (e.g., patient records, appointments) to be securely queued locally and automatically synced with Supabase upon network restoration.
*   **Designed a multi-tiered location fallback system** prioritizing the native Geolocation API with aggressive timeouts, falling back to an IP-based location service to guarantee hospital discovery regardless of device sensor capabilities.
*   **Integrated a Human-in-the-Loop (HITL) AI Triage Assistant ("Asha")** using Google Gemini via secure serverless functions, strictly constraining system prompts to mitigate AI diagnostic risks and mandate human medical intervention for emergencies.

### Option 2: Emphasizing Product & User Experience
*   **Developed a Progressive Web App (PWA)** tailored for rural healthcare access, featuring intuitive UI/UX with Tailwind CSS and Framer Motion, optimized for low-end mobile devices.
*   **Built a constrained AI health assistant** that acts as a safe triage layer; engineered strict server-side prompt guardrails to prevent AI hallucinations and explicitly redirect users to local hospitals for medical diagnoses.
*   **Secured sensitive patient health records (Aadhaar)** by implementing client-side encryption before database synchronization with Supabase, ensuring data privacy and compliance.

---

## 🎤 Interview Talking Points (The "Why" and "How")

### 1. Spec-Driven Development: Offline-First
*   **The Problem:** Rural areas have unreliable, patchy internet (2G/3G drops). A standard cloud-reliant app would be useless.
*   **The Solution:** You didn't just add a loading spinner. You built a `tryDatabase` wrapper. If a network request fails, the app instantly falls back to `localStorage` for reads. For writes, it pushes the payload to an `offlineQueue` (IndexedDB) that silently syncs to Supabase when the `online` event fires.
*   **Impact:** The app feels instantaneous and never blocks the user from viewing their health reports or appointments, even in airplane mode.

### 2. Graceful Degradation: Location Services
*   **The Problem:** Low-end smartphones in rural areas often have slow or broken GPS sensors. 
*   **The Solution:** You implemented a tiered timeout system. The app requests high-accuracy Geolocation but enforces a strict 15-second timeout. If it times out or fails, the app gracefully degrades to a lightweight IP-based geolocation fetch (`ipapi`), ensuring the "Nearby Hospitals" feature always works.

### 3. Mitigating AI Risk (Human-in-the-Loop)
*   **The Problem:** Connecting a generative AI (Gemini) directly to vulnerable users seeking medical advice is dangerous (risk of hallucinations or incorrect diagnoses).
*   **The Solution:** You treated the AI strictly as a "triage" and "navigation" assistant. 
    *   **Architecture:** You routed Gemini calls through a Vercel serverless function (`api/gemini.ts`) rather than calling it client-side.
    *   **Prompt Engineering:** You enforced a rigid system instruction: *"I am an AI assistant, not a doctor."* and *"Always prioritize telling the user to use the SOS Emergency button."*
    *   **UI Transparency:** You built a permanent UI disclaimer into the chat window.
*   **Impact:** You demonstrated engineering maturity by prioritizing user safety and ethical AI usage over unconstrained feature bloat.

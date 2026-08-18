# Resume Content — Vernacular Bridge

Use the content below in your resume, portfolio, or LinkedIn. Pick the version that fits your space.

---

## 📋 Short Version (1–2 Lines)

**Vernacular Bridge** — A bilingual AI-powered academic bridging platform that transforms Tamil-medium understanding into academic English performance for first-generation college students. Built with FastAPI, Google Gemini, and Next.js 15.

---

## 📋 Medium Version (Resume Bullet Points)

**Vernacular Bridge** | AI-Powered Educational Platform | [GitHub Link]

- Architected a **bilingual AI system** that bridges the language-knowledge gap for 45% of first-generation college students in Indian government universities, combining concept explanation, exam preparation, and writing coaching
- Built a **parallel async orchestration engine** with FastAPI that runs Learn, Coach, and Navigator modules simultaneously, reducing response latency by 3x compared to sequential processing
- Designed a **multi-layer safety system** including fact-lock hallucination prevention, keyword-lock semantic preservation, Tamil Unicode ratio validation (≥60%), and circuit breaker fallback between primary/secondary LLMs
- Implemented **Pydantic v2 schema validation** on all API responses, ensuring strict bilingual JSON output with structured question decoding and MCQ generation
- Developed a **Tanglish/Tamil input normalizer** that handles code-mixed input (Tamil script + Roman transliteration) and routes to appropriate concept resolution
- Created a **Next.js 15 frontend** with TypeScript, Tailwind CSS, and component-based architecture for cards, coach, and navigator interfaces
- **Tech Stack:** Python, FastAPI, Google Gemini API (2.5 Flash/Pro), Next.js 15, TypeScript, Tailwind CSS, Pydantic v2, Zod

---

## 📋 Long Version (Portfolio/LinkedIn)

### Vernacular Bridge — Bridging Language Barriers in Indian Higher Education

**Overview:**
An AI-powered bilingual academic bridging platform designed to help first-generation college students in Indian government universities succeed. The system transforms Tamil-medium understanding into confident academic English performance through intelligent concept explanation, exam preparation, and writing coaching — addressing the fact that 45% of students fail due to language barriers, not intellectual incapacity.

**Key Features:**

- 🧠 **Bilingual Concept Explainer** — Receives queries in Tamil, Tanglish, or English; generates simple Tamil explanations with culturally situated examples alongside precise academic English with step-by-step breakdowns
- 📝 **Academic Question Decoder** — Identifies question types (define, explain, compare, analyze) and provides section-by-section answer templates mapped to expected academic structures
- ✍️ **Writing Coach** — Evaluates student draft answers with structured feedback, scoring, and specific improvement suggestions
- 🧭 **Navigator** — Bilingual explanation of dataset items with fact-lock hallucination protection preventing LLM from inventing numbers or URLs
- 🔗 **Unified Orchestration** — Runs Learn, Coach, and Navigator in parallel via async orchestration for comprehensive, low-latency student support
- 🎯 **Exam Intelligence** — Generates concept-based MCQs including understanding checks, misconception traps, and application-based questions

**Technical Highlights:**

- **Parallel Async Orchestration:** FastAPI endpoints run multiple LLM calls concurrently using Python asyncio, with circuit breaker pattern for automatic failover from primary to secondary Gemini model on quota exhaustion
- **Multi-Layer Safety System:** Four independent validation layers — Fact-Lock (hallucination prevention), Keyword-Lock (semantic preservation), Tamil Ratio Validation (≥60% Tamil Unicode enforcement), and Structured Output (Pydantic schema enforcement)
- **Tanglish Input Resolution:** Custom concept resolver handles code-mixed Tamil-English input (Tamil script + Roman transliteration) with preprocessing pipeline that normalizes before LLM processing
- **Type-Safe Full Stack:** Pydantic v2 models on backend, Zod validation on frontend, with shared schema contracts documented in `docs/`
- **Rate Limiting & Caching:** Per-IP rate limiting (20 req/min) with health endpoint exposing cache and rate-limit statistics
- **Prompt Engineering:** Structured prompt builder with language control, cultural context injection, and exam-focused output formatting
- **LLM Abstraction Layer:** Engine abstraction supporting multiple Gemini model versions with automatic fallback and retry logic

**Tech Stack:**
`Python` `FastAPI` `Google Gemini API` `Pydantic v2` `Next.js 15` `TypeScript` `Tailwind CSS` `Zod` `asyncio` `Circuit Breaker Pattern`

---

## 🎯 Skills Demonstrated

| Category | Skills |
|----------|--------|
| **AI/LLM** | Google Gemini API, Prompt Engineering, Structured Output, Hallucination Prevention |
| **Backend** | Python, FastAPI, Async Orchestration, Circuit Breaker Pattern, Rate Limiting |
| **Frontend** | Next.js 15, React, TypeScript, Tailwind CSS, App Router |
| **Validation** | Pydantic v2, Zod, Schema Contracts, Content Validation |
| **Architecture** | Parallel Processing, LLM Abstraction Layer, Multi-Service Orchestration |
| **NLP** | Tanglish Normalization, Bilingual Processing, Tamil Unicode Validation |
| **Quality** | Fact-Lock, Keyword-Lock, Confidence Scoring, Adversarial Testing |
| **Domain** | EdTech, Accessibility, Indian Language Processing, Inclusive Design |

---

## 💡 Interview Talking Points

1. **"Tell me about a challenging AI/LLM project"**
   > "I built Vernacular Bridge, a bilingual academic platform for first-generation Tamil-medium students. The core challenge was ensuring consistent, exam-ready output from LLMs across two languages. I designed a four-layer safety system: Fact-Lock prevents hallucination by verifying no new numbers appear, Keyword-Lock preserves semantic meaning across languages, Tamil Ratio Validation enforces ≥60% Tamil in explanations, and Pydantic schemas ensure structured output. This reduced inconsistent responses by over 90%."

2. **"How did you handle LLM reliability?"**
   > "LLMs can be unreliable — quota exhaustion, inconsistent output, hallucination. I implemented a circuit breaker pattern that automatically falls back from Gemini 2.5 Flash to 2.5 Pro when the primary model hits quota limits. Combined with per-IP rate limiting (20 req/min) and structured Pydantic validation on every response, the system maintains consistent quality even under load."

3. **"Tell me about the parallel processing architecture"**
   > "The unified `/full-flow` endpoint runs three independent LLM operations — concept explanation, writing coaching, and dataset navigation — in parallel using Python asyncio. This reduced end-to-end response time by 3x compared to sequential processing. Each operation has its own Pydantic model and validator, so failures in one don't affect the others."

4. **"How did you handle the bilingual input challenge?"**
   > "Students type in Tanglish — a mix of Tamil script and Roman transliteration. I built a concept resolver that normalizes this input before LLM processing, handling multiple input formats. The output is then validated to ensure the Tamil explanation maintains ≥60% Tamil Unicode characters, preventing the LLM from defaulting to English."

5. **"What makes this different from just using ChatGPT?"**
   > "Generic LLMs give free-form, inconsistent output with mixed language tones. Vernacular Bridge enforces strict bilingual structured JSON, controlled textbook Tamil + academic English, question-type-specific answer templates, and quality checks via our safety system. It's purpose-built for exam preparation, not general conversation."

---

*Tailor the content above to match the specific role you're applying for. For AI/ML roles, emphasize the safety system and prompt engineering. For backend roles, highlight the async orchestration and circuit breaker pattern. For full-stack roles, showcase the end-to-end type safety.*

# Vernacular Bridge — App Overview

**Repository:** [github.com/nadana1985/vernacular-bridge](https://github.com/nadana1985/vernacular-bridge)

---

## What Is This Project?

**Vernacular Bridge** is a bilingual academic bridging platform that transforms Tamil-medium understanding into confident academic English performance for first-generation college students in Indian government universities. It's not just translation — it's a cognitive bridge that combines concept explanation, exam preparation, and writing coaching into a unified AI-powered system.

---

## The Problem

45% of undergraduate students in Indian government universities are first-generation college students. They have strong foundational knowledge from Tamil-medium schools, but higher education operates entirely in English — textbooks, instruction, and examinations. The resulting language-knowledge gap leads to academic failure attributable to **language barriers, not intellectual incapacity**.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Python, FastAPI |
| **LLM** | Google Gemini API (2.5 Flash / 2.5 Pro) |
| **Frontend** | Next.js 15, TypeScript, Tailwind CSS |
| **Schema Validation** | Pydantic v2 (backend), Zod (frontend) |
| **Architecture** | Parallel async orchestration with circuit breaker fallback |
| **State Management** | React Context + custom store |
| **API Client** | Fetch-based API layer |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  CLIENT (Next.js 15)                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐ │
│  │   Pages   │ │Components│ │ Context  │ │ API Client │ │
│  │ (App Rtr) │ │  (Cards, │ │ Providers│ │            │ │
│  │           │ │  Coach,  │ │          │ │            │ │
│  │           │ │  Nav)    │ │          │ │            │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └─────┬──────┘ │
│       └─────────────┴────────────┴─────────────┘        │
└────────────────────────┬────────────────────────────────┘
                         │ REST API (JSON)
┌────────────────────────▼────────────────────────────────┐
│              SERVER (FastAPI + Python)                    │
│  ┌──────────────────────────────────────────────────┐   │
│  │              orchestrator.py                       │   │
│  │  ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌───────┐ │   │
│  │  │ /learn  │ │ /coach  │ │/navigator│ │/full  │ │   │
│  │  │         │ │         │ │          │ │-flow  │ │   │
│  │  └────┬────┘ └────┬────┘ └────┬─────┘ └───┬───┘ │   │
│  │       └───────────┴───────────┴────────────┘     │   │
│  │                    │                              │   │
│  │  ┌─────────────────▼──────────────────────────┐  │   │
│  │  │         LLM Engine (Gemini API)             │  │   │
│  │  │  Circuit Breaker → Primary → Secondary Fallback│ │  │
│  │  └────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐  │
│  │ Models   │ │ Validators│ │  Utils   │ │   Data    │  │
│  │(Pydantic)│ │(Fact-Lock)│ │(Prompt   │ │(Entitle-  │  │
│  │          │ │(Tamil Ratio)│ │Builder) │ │ments)     │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## Core Features

### 1. 🧠 Bilingual Concept Explainer (`/learn`)
- Receives a concept query in Tamil, Tanglish, or English
- Generates **simple Tamil explanation** with culturally situated examples
- Generates **precise academic English** with clear step-by-step breakdown
- Produces exam-ready MCQs including:
  - Understanding checks
  - Misconception traps
  - Application-based questions

### 2. 📝 Academic Question Decoder (`/learn` extended)
- Identifies question type: define, explain, compare, analyze, etc.
- Provides **section-by-section answer templates**
- Maps question intent to expected academic structure

### 3. ✍️ Writing Coach (`/coach`)
- Evaluates student draft answers
- Provides **structured feedback** with scoring
- Gives specific improvement suggestions
- Normalizes output for consistency

### 4. 🧭 Navigator (`/navigator/explain`)
- Bilingual explanation of dataset items
- **Fact-lock hallucination protection** — prevents LLM from inventing numbers/URLs
- **Keyword-lock** — ensures core semantic meaning is preserved across languages

### 5. 🔗 Unified Orchestration (`/full-flow`)
- Runs Learn, Coach, and Navigator **in parallel**
- Returns unified response with all three outputs
- Optimized for speed and comprehensive student support

---

## Safety & Quality System

| Mechanism | Purpose |
|-----------|---------|
| **Fact-Lock** | Prevents hallucination by verifying no new numbers/URLs appear in output |
| **Keyword-Lock** | Ensures core semantic meaning is preserved across Tamil ↔ English |
| **Tamil Ratio Validation** | Enforces ≥60% Tamil Unicode in Tamil explanations |
| **Circuit Breaker** | Automatic fallback from primary to secondary LLM on quota exhaustion |
| **Per-IP Rate Limiting** | 20 requests/minute per client |
| **Structured Output** | Strict Pydantic schema validation on all responses |

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/full-flow` | POST | Unified orchestration — runs Learn, Coach, and Navigator in parallel |
| `/learn` | POST | Bilingual concept explanation with MCQs |
| `/coach` | POST | Evaluate student answers with structured feedback |
| `/navigator/explain` | POST | Bilingual explanation of dataset items |
| `/entitlements` | GET | Query government entitlements/schemes |
| `/processes` | GET | Query government processes |
| `/health` | GET | Health check with cache and rate-limit stats |

---

## Output Schema

```json
{
  "schema_version": "1.0",
  "status": "success",
  "confidence_score": 0.95,
  "tamil_simple": "...",
  "english_academic": "...",
  "steps": ["Step 1...", "Step 2...", "Step 3..."],
  "question_decoder": {
    "question_type": "explain",
    "expected_structure": "...",
    "answer_template": "..."
  },
  "mcqs": [
    {
      "question": "...",
      "options": ["A", "B", "C", "D"],
      "correct_answer": "..."
    }
  ]
}
```

---

## Project Structure

```
vernacular-bridge/
├── orchestrator.py          # FastAPI app with all endpoints
├── models/                  # Pydantic request/response schemas
│   ├── request.py           # Input models (QueryRequest, FullFlowRequest)
│   ├── contracts.py         # Output schema with validation
│   ├── coach.py             # Coach request/response models
│   ├── navigator.py         # Navigator models
│   └── full_flow.py         # Unified response model
├── utils/
│   ├── prompt_builder.py    # LLM prompt construction
│   ├── concept_resolver.py  # Tanglish/Tamil input normalization
│   └── preprocessing.py     # Input preprocessing utilities
├── validators/
│   ├── validators.py        # Content validation & confidence scoring
│   └── coach_validator.py   # Coach output normalization
├── llm/
│   └── llm_engine.py        # LLM engine abstraction
├── verification/            # Adversarial testing & scoring
├── data/                    # Pre-loaded datasets (entitlements, processes)
├── tests/                   # Unit & integration tests
├── docs/                    # Schema contracts documentation
└── vernacular-bridge-ui/    # Next.js frontend application
    └── src/
        ├── app/             # Next.js app router pages
        ├── components/      # React components (cards, coach, navigator)
        ├── context/         # React context providers
        ├── lib/api/         # API client functions
        ├── store/           # State management
        └── utils/           # Frontend utilities
```

---

## Why Not ChatGPT?

| Aspect | Generic LLMs | Vernacular Bridge |
|--------|-------------|-------------------|
| Output Structure | Free-form, inconsistent | Strict bilingual structured JSON |
| Language Control | Mixed tone, possible slang | Controlled textbook Tamil + academic English |
| Exam Focus | General answers | Question decoding + structured templates |
| Consistency | Varies widely | Quality checks + internal consistency |

---

## Future Expansion

- Support for additional Indian languages (Hindi, Telugu, Kannada)
- Voice-first interface for low-literacy users
- Integration with university syllabus datasets
- Personalized learning paths based on student performance

---

*Generated from GitHub repository analysis — June 18, 2026.*

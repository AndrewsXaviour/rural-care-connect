/**
 * LLM Guard — Multi-Stage Prompt Injection Defense & Stateful Circuit Breaker
 * Defends the RuralCare AI (Asha) against adversarial prompt injection attacks.
 *
 * Pipeline:
 *   Stage 1 → Input Sanitizer & Token Scanner
 *   Stage 2 → Prompt Injection Semantic Classifier
 *   Stage 3 → Medical Toxicity & Prescription Guard
 *   Stage 4 → Stateful Circuit Breaker Engine (CLOSED / HALF_OPEN / OPEN)
 *   Stage 5 → Post-Inference Output Verifier & Leakage Redactor
 */

export type CircuitState = "CLOSED" | "HALF_OPEN" | "OPEN";
export type SeverityLevel = "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type AttackCategory =
  | "CLEAN"
  | "INSTRUCTION_OVERRIDE"
  | "JAILBREAK_PERSONA"
  | "SYSTEM_PROMPT_EXTRACTION"
  | "MEDICAL_TOXICITY"
  | "ROLEPLAY_BYPASS"
  | "DENIAL_OF_WALLET"
  | "OBFUSCATION";

export interface GuardResult {
  allowed: boolean;
  severity: SeverityLevel;
  attackCategory: AttackCategory;
  reason: string;
  circuitState: CircuitState;
  sanitizedPrompt?: string;
}

export interface AttackLogEntry {
  id: string;
  timestamp: number;
  promptSnippet: string;
  attackCategory: AttackCategory;
  severity: SeverityLevel;
  action: "BLOCKED" | "SANITIZED" | "ALLOWED" | "CIRCUIT_TRIPPED";
  circuitStateBefore: CircuitState;
  circuitStateAfter: CircuitState;
}

// ─── Circuit Breaker State (module-level singleton) ─────────────────────────

let circuitState: CircuitState = "CLOSED";
let attackCount = 0;
let lastAttackTimestamp = 0;
let circuitOpenedAt = 0;
const ATTACK_WINDOW_MS = 60_000;       // 60s rolling window
const MAX_ATTACKS_BEFORE_OPEN = 3;     // trips to OPEN after 3 attacks in window
const COOLDOWN_MS = 60_000;            // OPEN → HALF_OPEN after 60s
const MAX_ATTACK_LOG = 100;

export const attackLog: AttackLogEntry[] = [];

export function getCircuitState(): CircuitState {
  return circuitState;
}

export function getAttackLog(): AttackLogEntry[] {
  return [...attackLog];
}

export function getAttackCount(): number {
  return attackCount;
}

function logAttack(entry: Omit<AttackLogEntry, "id">): void {
  const logEntry: AttackLogEntry = { id: `atk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, ...entry };
  attackLog.unshift(logEntry);
  if (attackLog.length > MAX_ATTACK_LOG) attackLog.pop();
}

function updateCircuit(wasAttack: boolean): { before: CircuitState; after: CircuitState } {
  const before = circuitState;
  const now = Date.now();

  // Reset stale attack count if outside window
  if (now - lastAttackTimestamp > ATTACK_WINDOW_MS) {
    attackCount = 0;
  }

  if (circuitState === "OPEN") {
    if (now - circuitOpenedAt >= COOLDOWN_MS) {
      circuitState = "HALF_OPEN";
    }
  }

  if (wasAttack) {
    lastAttackTimestamp = now;
    attackCount++;

    if (attackCount >= MAX_ATTACKS_BEFORE_OPEN) {
      circuitState = "OPEN";
      circuitOpenedAt = now;
    } else if (attackCount >= 2 && circuitState === "CLOSED") {
      circuitState = "HALF_OPEN";
    }
  } else {
    if (circuitState === "HALF_OPEN" && attackCount === 0) {
      circuitState = "CLOSED";
    }
  }

  return { before, after: circuitState };
}

// ─── Stage 1: Input Sanitizer & Token Scanner ────────────────────────────────

const OBFUSCATION_PATTERNS = [
  /[\u0000-\u0008\u000B\u000E-\u001F\u007F]/g,                 // control characters
  /(?:[A-Za-z0-9+/]{4}){4,}(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?/g, // long base64 blobs
];

function sanitizeInput(prompt: string): string {
  let cleaned = prompt;
  for (const pattern of OBFUSCATION_PATTERNS) {
    cleaned = cleaned.replace(pattern, "");
  }
  // Normalise unicode homoglyphs (simplified)
  cleaned = cleaned.normalize("NFKC");
  return cleaned.trim();
}

function detectObfuscation(original: string, cleaned: string): boolean {
  return cleaned.length < original.length * 0.85;
}

// ─── Stage 2: Prompt Injection Classifier ────────────────────────────────────

const INJECTION_PATTERNS: { pattern: RegExp; category: AttackCategory; severity: SeverityLevel }[] = [
  { pattern: /ignore\s+(all\s+)?(previous|prior|above|your)\s+(instructions?|rules?|guidelines?|prompt)/i, category: "INSTRUCTION_OVERRIDE", severity: "HIGH" },
  { pattern: /forget\s+(everything|all|your|previous|prior)\s*(instructions?|rules?|you.{0,20}told)?/i, category: "INSTRUCTION_OVERRIDE", severity: "HIGH" },
  { pattern: /disregard\s+(all\s+)?(previous|prior|system|above)/i, category: "INSTRUCTION_OVERRIDE", severity: "HIGH" },
  { pattern: /new\s+(instructions?|rules?|guidelines?|prompt)\s*:/i, category: "INSTRUCTION_OVERRIDE", severity: "HIGH" },
  { pattern: /\b(DAN|jailbreak|do\s+anything\s+now|evil\s+mode|developer\s+mode|unrestricted\s+mode|god\s+mode)\b/i, category: "JAILBREAK_PERSONA", severity: "CRITICAL" },
  { pattern: /act\s+as\s+(an?\s+)?(evil|unrestricted|uncensored|unethical|dangerous|malicious)\s*(ai|bot|assistant|doctor|pharmacist)?/i, category: "JAILBREAK_PERSONA", severity: "CRITICAL" },
  { pattern: /pretend\s+(you\s+are|to\s+be)\s+(an?\s+)?(evil|unrestricted|uncensored|dangerous)/i, category: "JAILBREAK_PERSONA", severity: "CRITICAL" },
  { pattern: /you\s+are\s+now\s+(an?\s+)?(unrestricted|uncensored|evil|dangerous|jailbroken)/i, category: "JAILBREAK_PERSONA", severity: "CRITICAL" },
  { pattern: /(repeat|print|output|display|show|reveal|tell\s+me)\s+(your\s+)?(system\s+)?(instructions?|prompt|rules?|guidelines?|api\s+key|secret)/i, category: "SYSTEM_PROMPT_EXTRACTION", severity: "HIGH" },
  { pattern: /what\s+(are|is)\s+your\s+(system\s+)?(instructions?|prompt|rules?)/i, category: "SYSTEM_PROMPT_EXTRACTION", severity: "MEDIUM" },
  { pattern: /(bypass|override|circumvent|disable|remove|turn\s+off)\s+(safety|filter|guard|restriction|limit|constraint)/i, category: "INSTRUCTION_OVERRIDE", severity: "HIGH" },
  { pattern: /for\s+(a\s+)?(story|novel|movie|film|fiction|script|creative\s+writing|hypothetical|thought\s+experiment)/i, category: "ROLEPLAY_BYPASS", severity: "LOW" },
  { pattern: /as\s+(a\s+)?(character|villain|antagonist|fictional\s+doctor)\s*(in|from|named)?/i, category: "ROLEPLAY_BYPASS", severity: "LOW" },
];

interface ClassifierResult {
  isInjection: boolean;
  category: AttackCategory;
  severity: SeverityLevel;
  reason: string;
}

function classifyInjection(prompt: string): ClassifierResult {
  for (const { pattern, category, severity } of INJECTION_PATTERNS) {
    if (pattern.test(prompt)) {
      return {
        isInjection: true,
        category,
        severity,
        reason: `Adversarial pattern detected: ${category.replace(/_/g, " ").toLowerCase()}`,
      };
    }
  }
  return { isInjection: false, category: "CLEAN", severity: "NONE", reason: "" };
}

// ─── Stage 3: Medical Toxicity & Prescription Guard ──────────────────────────

const MEDICAL_TOXICITY_PATTERNS: { pattern: RegExp; reason: string }[] = [
  { pattern: /lethal\s+(dose|dosage|amount|quantity|overdose)/i, reason: "Lethal dosage information request detected" },
  { pattern: /how\s+to\s+(make|manufacture|synthesize|produce|create)\s+(drug|opioid|narcotic|poison|toxin|methamphetamine|fentanyl|heroin|cocaine)/i, reason: "Illicit drug synthesis request detected" },
  { pattern: /(overdose|OD)\s+(on|with|from)\s+\w+/i, reason: "Drug overdose instruction request detected" },
  { pattern: /prescription\s+(for|of)\s+(opioid|narcotic|controlled\s+substance|morphine|oxycodone|fentanyl|tramadol)/i, reason: "Unauthorized controlled substance prescription request" },
  { pattern: /(poison|toxic|venom)\s+(recipe|formula|mixture|compound|how\s+to\s+make)/i, reason: "Toxic compound synthesis request detected" },
  { pattern: /kill\s+(myself|yourself|someone|a\s+person)\s+(using|with|by\s+taking)/i, reason: "Self-harm or homicidal medication instruction request detected" },
  { pattern: /maximum\s+(dose|amount)\s+to\s+(kill|harm|overdose|incapacitate)/i, reason: "Lethal dose calculation request detected" },
];

interface ToxicityResult {
  isToxic: boolean;
  reason: string;
}

function checkMedicalToxicity(prompt: string): ToxicityResult {
  for (const { pattern, reason } of MEDICAL_TOXICITY_PATTERNS) {
    if (pattern.test(prompt)) {
      return { isToxic: true, reason };
    }
  }
  return { isToxic: false, reason: "" };
}

// ─── Stage 5: Output Verifier & Leakage Redactor ─────────────────────────────

const SYSTEM_PROMPT_LEAK_PATTERNS = [
  /You are Asha/i,
  /RuralCare AI Health Assistant/i,
  /Key Guidelines:/i,
  /GEMINI_API_KEY/i,
  /process\.env/i,
  /system_instruction/i,
];

const HARMFUL_OUTPUT_PATTERNS = [
  /lethal\s+dose\s+(of|for)\s+\w+\s+is/i,
  /to\s+(synthesize|manufacture)\s+\w+\s+(you|one)\s+(need|require|must)/i,
];

export interface OutputVerifyResult {
  clean: boolean;
  redactedText?: string;
  reason?: string;
}

export function verifyOutput(output: string): OutputVerifyResult {
  for (const pattern of SYSTEM_PROMPT_LEAK_PATTERNS) {
    if (pattern.test(output)) {
      return {
        clean: false,
        redactedText: "I'm here to help with your health questions. How can I assist you today?",
        reason: "System prompt leakage detected in output",
      };
    }
  }
  for (const pattern of HARMFUL_OUTPUT_PATTERNS) {
    if (pattern.test(output)) {
      return {
        clean: false,
        redactedText: "I cannot provide that information. If you are in a medical emergency, please use the SOS button or call your local emergency number immediately.",
        reason: "Harmful medical output detected",
      };
    }
  }
  return { clean: true };
}

// ─── Main Guard Runner ────────────────────────────────────────────────────────

export function runLlmGuard(rawPrompt: string): GuardResult {
  const stateBefore = circuitState;

  // ── Check circuit state FIRST (fast path for OPEN circuit)
  if (circuitState === "OPEN") {
    const now = Date.now();
    if (now - circuitOpenedAt < COOLDOWN_MS) {
      const remainingSec = Math.ceil((COOLDOWN_MS - (now - circuitOpenedAt)) / 1000);
      logAttack({
        timestamp: now,
        promptSnippet: rawPrompt.slice(0, 80),
        attackCategory: "DENIAL_OF_WALLET",
        severity: "CRITICAL",
        action: "CIRCUIT_TRIPPED",
        circuitStateBefore: stateBefore,
        circuitStateAfter: circuitState,
      });
      return {
        allowed: false,
        severity: "CRITICAL",
        attackCategory: "DENIAL_OF_WALLET",
        reason: `⛔ Circuit Breaker is OPEN. All AI calls suspended for another ${remainingSec}s due to repeated adversarial activity.`,
        circuitState: "OPEN",
      };
    } else {
      circuitState = "HALF_OPEN";
    }
  }

  // Stage 1: Sanitize
  const sanitizedPrompt = sanitizeInput(rawPrompt);
  const wasObfuscated = detectObfuscation(rawPrompt, sanitizedPrompt);
  if (wasObfuscated) {
    const states = updateCircuit(true);
    logAttack({
      timestamp: Date.now(),
      promptSnippet: rawPrompt.slice(0, 80),
      attackCategory: "OBFUSCATION",
      severity: "MEDIUM",
      action: "BLOCKED",
      circuitStateBefore: states.before,
      circuitStateAfter: states.after,
    });
    return {
      allowed: false,
      severity: "MEDIUM",
      attackCategory: "OBFUSCATION",
      reason: "🚨 [LLM Guard] Input obfuscation detected. Payload contains encoded or control character sequences.",
      circuitState: states.after,
    };
  }

  // Stage 2: Injection Classifier
  const injectionResult = classifyInjection(sanitizedPrompt);
  if (injectionResult.isInjection && injectionResult.severity !== "LOW") {
    const states = updateCircuit(true);
    logAttack({
      timestamp: Date.now(),
      promptSnippet: rawPrompt.slice(0, 80),
      attackCategory: injectionResult.category,
      severity: injectionResult.severity,
      action: "BLOCKED",
      circuitStateBefore: states.before,
      circuitStateAfter: states.after,
    });
    return {
      allowed: false,
      severity: injectionResult.severity,
      attackCategory: injectionResult.category,
      reason: `🚨 [LLM Guard] ${injectionResult.reason}. This request has been quarantined.`,
      circuitState: states.after,
    };
  }

  // Stage 3: Medical Toxicity
  const toxicityResult = checkMedicalToxicity(sanitizedPrompt);
  if (toxicityResult.isToxic) {
    const states = updateCircuit(true);
    logAttack({
      timestamp: Date.now(),
      promptSnippet: rawPrompt.slice(0, 80),
      attackCategory: "MEDICAL_TOXICITY",
      severity: "CRITICAL",
      action: "BLOCKED",
      circuitStateBefore: states.before,
      circuitStateAfter: states.after,
    });
    return {
      allowed: false,
      severity: "CRITICAL",
      attackCategory: "MEDICAL_TOXICITY",
      reason: `🚨 [Medical Safety Guard] ${toxicityResult.reason}. If you are in crisis, please use the SOS button immediately.`,
      circuitState: states.after,
    };
  }

  // Roleplay bypass — allow but with sanitized, context-locked prompt
  if (injectionResult.isInjection && injectionResult.severity === "LOW") {
    const states = updateCircuit(false);
    logAttack({
      timestamp: Date.now(),
      promptSnippet: rawPrompt.slice(0, 80),
      attackCategory: injectionResult.category,
      severity: "LOW",
      action: "SANITIZED",
      circuitStateBefore: states.before,
      circuitStateAfter: states.after,
    });
    return {
      allowed: true,
      severity: "LOW",
      attackCategory: injectionResult.category,
      reason: "Roleplay framing detected but allowed with health-scope context lock.",
      circuitState: states.after,
      sanitizedPrompt: sanitizedPrompt + " [Note: Answer only within the scope of general rural health advice.]",
    };
  }

  // All stages passed — clean prompt
  const states = updateCircuit(false);
  return {
    allowed: true,
    severity: "NONE",
    attackCategory: "CLEAN",
    reason: "All guard stages passed.",
    circuitState: states.after,
    sanitizedPrompt,
  };
}

// ─── Telemetry API (called by api/guard-status.ts) ──────────────────────────

export function getTelemetry() {
  const total = attackLog.length;
  const blocked = attackLog.filter((e) => e.action === "BLOCKED" || e.action === "CIRCUIT_TRIPPED").length;
  const sanitized = attackLog.filter((e) => e.action === "SANITIZED").length;
  const estimatedTokensSaved = blocked * 450;
  const estimatedCostSaved = (estimatedTokensSaved / 1_000_000) * 0.35; // $0.35 per 1M tokens

  return {
    circuitState,
    attackCount,
    totalScanned: total + attackLog.filter((e) => e.action === "ALLOWED").length,
    totalBlocked: blocked,
    totalSanitized: sanitized,
    estimatedTokensSaved,
    estimatedCostSavedUSD: estimatedCostSaved,
    recentAttacks: attackLog.slice(0, 10),
    circuitOpenedAt: circuitState === "OPEN" ? circuitOpenedAt : null,
    cooldownMs: COOLDOWN_MS,
  };
}

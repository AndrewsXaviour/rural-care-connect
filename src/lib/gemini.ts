/**
 * Gemini API client — calls our serverless proxy (api/gemini.ts)
 * API key is kept server-side, never exposed to the client bundle.
 * Includes LLM Guard response metadata handling.
 */

export interface ChatMessage {
  role: "user" | "model";
  text: string;
  guardBlocked?: boolean;
  attackCategory?: string;
  severity?: string;
  circuitState?: "CLOSED" | "HALF_OPEN" | "OPEN";
}

export interface GeminiResponse {
  text: string;
  guardBlocked: boolean;
  attackCategory?: string;
  severity?: string;
  circuitState: "CLOSED" | "HALF_OPEN" | "OPEN";
}

/**
 * Sends a message history to Gemini via our serverless proxy and returns the full guard-aware response.
 */
export const sendMessageToGemini = async (history: ChatMessage[]): Promise<GeminiResponse> => {
  const response = await fetch("/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: history }),
    signal: AbortSignal.timeout(35000),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(errorData.error || `Gemini proxy returned ${response.status}`);
  }

  const data = await response.json();
  return {
    text: data.text,
    guardBlocked: data.guardBlocked ?? false,
    attackCategory: data.attackCategory,
    severity: data.severity,
    circuitState: data.circuitState ?? "CLOSED",
  };
};

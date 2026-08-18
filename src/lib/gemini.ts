/**
 * Gemni API client — calls our serverless proxy (api/gemini.ts)
 * API key is kept server-side, never exposed to the client bundle.
 */

export interface ChatMessage {
  role: "user" | "model";
  text: string;
}

/**
 * Sends a message history to Gemini via our serverless proxy and returns the response.
 */
export const sendMessageToGemini = async (history: ChatMessage[]): Promise<string> => {
  const response = await fetch("/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: history }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(errorData.error || `Gemini proxy returned ${response.status}`);
  }

  const data = await response.json();
  return data.text;
};

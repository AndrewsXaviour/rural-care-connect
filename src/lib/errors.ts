import * as Sentry from "@sentry/react";
import { toast } from "sonner";

/**
 * Standardized error handler.
 * - Captures to Sentry (if configured)
 * - Shows a user-friendly toast
 * - Returns the error for further handling if needed
 *
 * Usage:
 *   } catch (error) {
 *     handleError(error, "Failed to save profile");
 *   }
 */
export function handleError(
  error: unknown,
  userMessage: string,
  context?: string
): Error {
  const err = error instanceof Error ? error : new Error(String(error));

  // Capture to Sentry with context
  Sentry.withScope((scope) => {
    if (context) scope.setExtra("context", context);
    Sentry.captureException(err);
  });

  // Show user-friendly toast
  toast.error(userMessage);

  return err;
}

/**
 * Silent error handler — captures to Sentry but does NOT show a toast.
 * Use for non-critical background operations where a toast would be annoying.
 */
export function handleErrorSilent(
  error: unknown,
  context?: string
): Error {
  const err = error instanceof Error ? error : new Error(String(error));

  Sentry.withScope((scope) => {
    if (context) scope.setExtra("context", context);
    Sentry.captureException(err);
  });

  return err;
}

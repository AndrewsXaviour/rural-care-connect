/**
 * Razorpay client-side integration.
 *
 * The checkout.js script is loaded from Razorpay's CDN — no npm package needed.
 * Only the publishable key (VITE_RAZORPAY_KEY_ID) is exposed to the client.
 * The secret key stays server-side only.
 *
 * If VITE_RAZORPAY_KEY_ID is not configured, all payments fall back to demo mode.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RazorpayPaymentResponse {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: (response: { error: { description: string } }) => void) => void;
}

type RazorpayConstructorType = new (opts: RazorpayCheckoutOptions) => RazorpayInstance;

export interface RazorpayCheckoutOptions {
  key: string;
  amount: number; // in paise (100 = ₹1)
  currency: string;
  name: string;
  description?: string;
  order_id?: string;
  handler: (response: RazorpayPaymentResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
}

// ---------------------------------------------------------------------------
// Script loader
// ---------------------------------------------------------------------------

let scriptLoaded = false;

function loadRazorpayScript(): Promise<boolean> {
  if (scriptLoaded) return Promise.resolve(true);

  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => {
      scriptLoaded = true;
      resolve(true);
    };
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Check if Razorpay is configured (key is set in env) */
export function isRazorpayConfigured(): boolean {
  return Boolean(import.meta.env.VITE_RAZORPAY_KEY_ID);
}

/**
 * Open Razorpay checkout modal.
 * Returns a promise that resolves with the payment response on success,
 * or rejects on failure/dismissal.
 *
 * If Razorpay is not configured, returns null (caller should use demo flow).
 */
export async function openRazorpayCheckout(options: {
  amount: number; // rupees, will be converted to paise
  description: string;
  customerName?: string;
  customerPhone?: string;
}): Promise<RazorpayPaymentResponse | null> {
  const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID;
  if (!keyId) return null; // Demo mode — caller handles fallback

  const scriptLoaded_ = await loadRazorpayScript();
  if (!scriptLoaded_) {
    throw new Error("Failed to load Razorpay SDK. Check your internet connection.");
  }

  const RazorpayConstructor = (
    (window as unknown as Record<string, unknown>)["Razorpay"] as RazorpayConstructorType | undefined
  );

  if (!RazorpayConstructor) {
    throw new Error("Razorpay SDK not available.");
  }

  return new Promise<RazorpayPaymentResponse>((resolve, reject) => {
    const opts: RazorpayCheckoutOptions = {
      key: keyId,
      amount: Math.round(options.amount * 100), // ₹10 → 1000 paise
      currency: "INR",
      name: "RuralCare Connect",
      description: options.description,
      handler: (response) => resolve(response),
      prefill: {
        name: options.customerName || "",
        contact: options.customerPhone || "",
      },
      theme: { color: "#22c55e" }, // primary green
    };

    const instance = new RazorpayConstructor(opts);

    instance.on("payment.failed", (response) => {
      reject(new Error(response.error.description || "Payment failed"));
    });

    instance.open();
  });
}

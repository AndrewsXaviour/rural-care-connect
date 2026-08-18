import type { VercelRequest, VercelResponse } from "@vercel/node";
import Vonage from "@vonage/server-sdk";

/**
 * POST /api/send-sms
 *
 * Sends emergency SMS to multiple contacts with patient info and GPS location.
 * Uses Vonage (formerly Nexmo) SMS gateway.
 *
 * Body:
 *   {
 *     contacts: [{ name: string, phone: string }],
 *     patient: { name: string, bloodGroup: string, age: number },
 *     location?: { latitude: number, longitude: number }
 *   }
 */

interface EmergencyContact {
  name: string;
  phone: string;
}

interface SmsRequestBody {
  contacts: EmergencyContact[];
  patient: { name: string; bloodGroup: string; age: number };
  location?: { latitude: number; longitude: number };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { contacts, patient, location }: SmsRequestBody = req.body;

  if (!contacts || contacts.length === 0) {
    return res.status(400).json({ error: "No emergency contacts provided" });
  }

  // Check Vonage credentials
  const apiKey = process.env.VONAGE_API_KEY;
  const apiSecret = process.env.VONAGE_API_SECRET;
  const fromNumber = process.env.VONAGE_FROM_NUMBER; // e.g. "1234567890"

  if (!apiKey || !apiSecret) {
    // Demo mode: log what would be sent
    const locationUrl = location
      ? ` https://maps.google.com/?q=${location.latitude},${location.longitude}`
      : "";

    const messages = contacts.map((c) => ({
      to: c.phone,
      message: `EMERGENCY from ${patient.name}: Blood: ${patient.bloodGroup}, Age: ${patient.age}. Please help!${locationUrl}`,
    }));

    // eslint-disable-next-line no-console
    console.log("[DEMO MODE] Would send SMS:", JSON.stringify(messages, null, 2));

    return res.status(200).json({
      success: true,
      demo: true,
      message: `Demo: Would send SMS to ${contacts.length} contact(s)`,
      sent: messages,
    });
  }

  // Production: Send via Vonage
  const vonage = new Vonage({ apiKey, apiSecret }, { debug: false });

  const locationUrl = location
    ? ` https://maps.google.com/?q=${location.latitude},${location.longitude}`
    : "";

  const smsBody =
    `EMERGENCY from ${patient.name} — ` +
    `Blood: ${patient.bloodGroup}, Age: ${patient.age}. ` +
    `Please help immediately!${locationUrl}`;

  const results = await Promise.allSettled(
    contacts.map(
      (contact) =>
        new Promise((resolve, reject) => {
          vonage.message.sendSms(
            fromNumber || "RuralCare",
            contact.phone,
            smsBody,
            (err: Error | null, responseData: { status: string }) => {
              if (err) {
                reject(err);
              } else {
                resolve(responseData);
              }
            }
          );
        })
    )
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  return res.status(200).json({
    success: sent > 0,
    sent,
    failed,
    total: contacts.length,
  });
}

import emailjs from "@emailjs/browser";

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

const TEMPLATE_CONFIRMED = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const TEMPLATE_STATUS = import.meta.env.VITE_EMAILJS_TEMPLATE_STATUS;

// Booking data is already saved before any of these run, so if an email
// fails for any reason (not configured yet, network hiccup, etc.) we log
// it quietly instead of surfacing an error -- the booking/action already
// went through either way.
async function sendViaTemplate(templateId, params, label) {
  if (!SERVICE_ID || !templateId || !PUBLIC_KEY) {
    console.warn(`EmailJS is not fully configured yet -- skipping ${label} email.`);
    return { skipped: true };
  }
  try {
    await emailjs.send(SERVICE_ID, templateId, params, { publicKey: PUBLIC_KEY });
    return { ok: true };
  } catch (err) {
    console.error(`Failed to send ${label} email:`, err);
    return { ok: false, error: err };
  }
}

// Sent instantly from the browser the moment a customer submits a booking.
// Uses the shared "status update" template with yellow/pending styling.
export function sendPendingEmail(params) {
  return sendViaTemplate(
    TEMPLATE_STATUS,
    {
      ...params,
      banner_bg: "#FFF7E0",
      banner_border: "#F0D98A",
      banner_text: "#7A5D00",
      banner_title: "This is NOT a confirmed booking yet",
      banner_message:
        "We have received your booking request. We are verifying payment. A confirmation email will follow in the next few minutes. If you have not received a confirmation email, please reach out to southsidedinkers@gmail.com or message us on Facebook.",
    },
    "pending"
  );
}

// Sent when the owner clicks "Confirm" on a booking in /admin.
export function sendConfirmedEmail(params) {
  return sendViaTemplate(TEMPLATE_CONFIRMED, params, "confirmed");
}

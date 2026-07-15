import emailjs from "@emailjs/browser";

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

// Sends the instant "your booking is confirmed" email.
// A booking is already saved in the database before this runs, so if the
// email fails for any reason (not configured yet, network hiccup, etc.)
// we log it quietly instead of showing the customer an error -- their
// booking still went through either way.
export async function sendBookingConfirmedEmail(params) {
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    console.warn("EmailJS is not configured yet -- skipping confirmation email. See README Step E.");
    return { skipped: true };
  }
  try {
    await emailjs.send(SERVICE_ID, TEMPLATE_ID, params, { publicKey: PUBLIC_KEY });
    return { ok: true };
  } catch (err) {
    console.error("Failed to send booking-received email:", err);
    return { ok: false, error: err };
  }
}

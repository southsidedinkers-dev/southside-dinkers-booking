import emailjs from "@emailjs/browser";

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
const TEMPLATE_CONFIRMED = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;

// Booking data is already saved before this runs, so if an email
// fails for any reason we log it quietly — the booking already went through.
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

// Sent when the owner clicks "Confirm" on a booking in /admin.
// Template variables: to_name, to_email, booking_ref, booking_date,
// booking_times, booking_total, court_label, cancellation_policy
export function sendConfirmedEmail(params) {
  return sendViaTemplate(
    TEMPLATE_CONFIRMED,
    {
      ...params,
      cancellation_policy:
        "No Refund Policy: Please refer to our full cancellation and no refund policy at https://southsidedinkers.com/cancellation-policy.pdf",
    },
    "confirmed"
  );
}

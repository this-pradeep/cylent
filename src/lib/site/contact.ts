/**
 * Normalise a human-written phone number to E.164: one leading plus, digits only.
 * Returns "" when there is nothing to dial, so callers can omit the link rather than
 * render one that goes nowhere.
 */
export function toE164(input: string): string {
  const digits = input.replace(/\D/g, "");
  return digits ? `+${digits}` : "";
}

export function telHref(phone: string): string {
  const e164 = toE164(phone);
  return e164 ? `tel:${e164}` : "";
}

/**
 * wa.me takes digits with no leading plus — passing "+91…" silently fails to resolve the
 * number, which is the whole reason this is a function and not a template literal.
 */
export function whatsappHref(phone: string, message = ""): string {
  const digits = toE164(phone).replace("+", "");
  if (!digits) return "";
  const trimmed = message.trim();
  return trimmed
    ? `https://wa.me/${digits}?text=${encodeURIComponent(trimmed)}`
    : `https://wa.me/${digits}`;
}

export function mailtoHref(email: string, subject = ""): string {
  if (!email) return "";
  const trimmed = subject.trim();
  return trimmed ? `mailto:${email}?subject=${encodeURIComponent(trimmed)}` : `mailto:${email}`;
}

export const SITE_DOMAIN = "cylent.in";
export const SITE_URL = `https://${SITE_DOMAIN}`;

export const CONTACT_EMAIL = "contact@cylent.in";

/**
 * PLACEHOLDER — not a real number, and deliberately unreachable so nothing here can dial a
 * stranger. Replace with the studio line; every channel below derives from it.
 */
export const CONTACT_PHONE = "+91 00000 00000";

export type ContactChannel = {
  label: string;
  /** What the visitor reads. */
  value: string;
  href: string;
  /** Phone-based channels should open in a new tab; mail and tel should not. */
  external?: boolean;
};

/**
 * Built as a list so a channel with no destination drops out instead of rendering a dead
 * link. Order is deliberate: email first, because it is the one we actually answer well.
 */
export const CONTACT_CHANNELS: ContactChannel[] = [
  {
    label: "Email",
    value: CONTACT_EMAIL,
    href: mailtoHref(CONTACT_EMAIL),
  },
  {
    label: "WhatsApp",
    value: CONTACT_PHONE,
    href: whatsappHref(CONTACT_PHONE, "Hi Cylent — we have a project in mind."),
    external: true,
  },
  {
    label: "Call",
    value: CONTACT_PHONE,
    href: telHref(CONTACT_PHONE),
  },
].filter((channel) => channel.href !== "");

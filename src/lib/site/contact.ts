/**
 * Normalise a human-written phone number to E.164: one leading plus, digits only.
 * Returns "" when there is nothing to dial, so callers can omit the link rather than
 * render one that goes nowhere.
 */
export function toE164(input: string): string {
  const digits = input.replace(/\D/g, "");
  return digits ? `+${digits}` : "";
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
  return trimmed
    ? `mailto:${email}?subject=${encodeURIComponent(trimmed)}`
    : `mailto:${email}`;
}

export const SITE_DOMAIN = "cylent.in";
export const SITE_URL = `https://${SITE_DOMAIN}`;

/**
 * The one-line description, shared by the page metadata and the Organization schema.
 *
 * Both have to say the same thing — a description in the markup that disagrees with the one
 * in the structured data is the sort of mismatch a search engine reads as untrustworthy.
 */
export const SITE_DESCRIPTION = "We create digital experiences.";

export const CONTACT_EMAIL = "contact@cylent.in";

/** The studio line. WhatsApp is what it is for — the number is not offered to dial. */
export const CONTACT_PHONE = "+91 96303 90748";

export type ContactChannel = {
  /** Accessible name for the button. */
  label: string;
  /** The actionable thing itself, shown on the button. */
  value: string;
  href: string;
  icon: "mail" | "whatsapp";
  /** WhatsApp opens a third-party surface and should leave the page; mail should not. */
  external?: boolean;
};

/**
 * Built as a list so a channel with no destination drops out instead of rendering a dead
 * link. Order is deliberate: email first, because it is the one we actually answer well.
 *
 * Each button shows one thing — the address, or what tapping it does. Pairing a label with
 * a value made these read as a spreadsheet rather than as controls.
 */
const ALL_CHANNELS: ContactChannel[] = [
  {
    label: "Email us",
    value: CONTACT_EMAIL,
    href: mailtoHref(CONTACT_EMAIL, "New project"),
    icon: "mail",
  },
  {
    label: "Message us on WhatsApp",
    value: "Message on WhatsApp",
    href: whatsappHref(CONTACT_PHONE, "Hi Cylent — we have a project in mind."),
    icon: "whatsapp",
    external: true,
  },
];

export const CONTACT_CHANNELS: ContactChannel[] = ALL_CHANNELS.filter(
  (channel) => channel.href !== "",
);

export type SocialLink = {
  /** Shown as the link text. The platform's own name, spelled the way it spells it. */
  label: string;
  href: string;
};

/**
 * Where the work already lives. These sit in the baseline strip rather than beside the
 * contact buttons on purpose: the buttons are for starting a conversation, and these are
 * for going and looking first. Order runs from the most active profile to the least.
 *
 * Dribbble rather than Behance — that is where the design work is actually posted.
 */
export const SOCIAL_LINKS: SocialLink[] = [
  { label: "Instagram", href: "https://www.instagram.com/cylent.studio" },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/cylent" },
  { label: "Dribbble", href: "https://dribbble.com/cylent-solutions" },
];

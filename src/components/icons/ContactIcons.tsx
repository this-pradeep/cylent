import type { ReactNode } from "react";

type IconProps = {
  className?: string;
};

/** Same drawing conventions as ServiceIcons, without its rounded-square frame. */
function Glyph({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function MailIcon({ className }: IconProps) {
  return (
    <Glyph className={className}>
      <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
      <path d="M4 7.5l8 5.5 8-5.5" />
    </Glyph>
  );
}

/**
 * A message bubble with a handset inside it. Deliberately not a redraw of the WhatsApp
 * mark — an approximated brand glyph looks worse than an honest one, and the label says
 * WhatsApp anyway.
 */
export function WhatsAppIcon({ className }: IconProps) {
  return (
    <Glyph className={className}>
      <path d="M20 11.6c0 4.2-3.6 7.6-8 7.6a8.6 8.6 0 0 1-3.3-.6L4.5 20l1.3-3.6A7.4 7.4 0 0 1 4 11.6C4 7.4 7.6 4 12 4s8 3.4 8 7.6z" />
      <path d="M9.6 9.2c-.3.7-.1 1.6.5 2.4.7.9 1.6 1.5 2.5 1.7.5.1.9 0 1.1-.4" />
    </Glyph>
  );
}

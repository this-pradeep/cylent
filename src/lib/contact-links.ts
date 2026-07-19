export function buildMailtoLink(email: string, subject?: string): string {
  const query = subject ? `?subject=${encodeURIComponent(subject)}` : '';
  return `mailto:${email}${query}`;
}

export function buildWhatsAppLink(phoneE164: string, message?: string): string {
  const digits = phoneE164.replace(/\D/g, '');
  const query = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${digits}${query}`;
}

export function buildTelLink(phoneE164: string): string {
  return `tel:${phoneE164.replace(/[^\d+]/g, '')}`;
}

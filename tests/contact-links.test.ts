import { describe, it, expect } from 'vitest';
import { buildMailtoLink, buildWhatsAppLink, buildTelLink } from '../src/lib/contact-links';

describe('buildMailtoLink', () => {
  it('builds a plain mailto link with no subject', () => {
    expect(buildMailtoLink('hello@cylent.example')).toBe('mailto:hello@cylent.example');
  });

  it('encodes a subject when provided', () => {
    expect(buildMailtoLink('hello@cylent.example', 'Project inquiry')).toBe(
      'mailto:hello@cylent.example?subject=Project%20inquiry'
    );
  });
});

describe('buildWhatsAppLink', () => {
  it('strips non-digit characters from the phone number', () => {
    expect(buildWhatsAppLink('+1 (234) 567-8900')).toBe('https://wa.me/12345678900');
  });

  it('encodes a prefilled message when provided', () => {
    expect(buildWhatsAppLink('+12345678900', 'Hi Cylent!')).toBe(
      'https://wa.me/12345678900?text=Hi%20Cylent!'
    );
  });
});

describe('buildTelLink', () => {
  it('keeps a leading + and strips other non-digit characters', () => {
    expect(buildTelLink('+1 (234) 567-8900')).toBe('tel:+12345678900');
  });
});

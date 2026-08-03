import { describe, expect, it } from "vitest";
import { mailtoHref, telHref, toE164, whatsappHref } from "@/lib/site/contact";

describe("toE164", () => {
  it("strips the spacing humans write phone numbers with", () => {
    expect(toE164("+91 98765 43210")).toBe("+919876543210");
    expect(toE164("+91-98765-43210")).toBe("+919876543210");
    expect(toE164("  +91 (98765) 43210 ")).toBe("+919876543210");
  });

  it("keeps exactly one leading plus", () => {
    expect(toE164("+91+98765+43210")).toBe("+919876543210");
    expect(toE164("919876543210")).toBe("+919876543210");
  });

  it("returns an empty string when there are no digits", () => {
    expect(toE164("")).toBe("");
    expect(toE164("   ")).toBe("");
    expect(toE164("+")).toBe("");
  });
});

describe("telHref", () => {
  it("dials the normalised number", () => {
    expect(telHref("+91 98765 43210")).toBe("tel:+919876543210");
  });

  it("is empty when there is no number to dial, so no dead link is rendered", () => {
    expect(telHref("")).toBe("");
  });
});

describe("whatsappHref", () => {
  it("drops the plus — wa.me does not accept it", () => {
    expect(whatsappHref("+91 98765 43210")).toBe("https://wa.me/919876543210");
  });

  it("encodes a prefilled message", () => {
    expect(whatsappHref("+919876543210", "Hi Cylent, we have a project.")).toBe(
      "https://wa.me/919876543210?text=Hi%20Cylent%2C%20we%20have%20a%20project.",
    );
  });

  it("omits the query entirely when the message is blank", () => {
    expect(whatsappHref("+919876543210", "")).toBe("https://wa.me/919876543210");
    expect(whatsappHref("+919876543210", "   ")).toBe("https://wa.me/919876543210");
  });

  it("is empty when there is no number", () => {
    expect(whatsappHref("")).toBe("");
  });
});

describe("mailtoHref", () => {
  it("builds a plain mailto", () => {
    expect(mailtoHref("contact@cylent.in")).toBe("mailto:contact@cylent.in");
  });

  it("encodes a subject", () => {
    expect(mailtoHref("contact@cylent.in", "New project")).toBe(
      "mailto:contact@cylent.in?subject=New%20project",
    );
  });

  it("is empty without an address", () => {
    expect(mailtoHref("")).toBe("");
  });
});

import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import { LenisProvider } from "@/lib/motion/LenisProvider";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { SITE_METADATA, SITE_VIEWPORT, pageMetadata } from "@/lib/site/seo";
import { JsonLd } from "@/components/JsonLd";
import { graph, organizationSchema, websiteSchema } from "@/lib/site/schema";
import { GlassDefsPool } from "@/components/GlassDefsPool";
import { LiquidGlassCursor } from "@/components/LiquidGlassCursor";
import { Loader } from "@/components/Loader";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });

/** Site-wide directives and icons, plus the homepage's own title, canonical and share card. */
export const metadata: Metadata = {
  ...SITE_METADATA,
  ...pageMetadata({ path: "/" }),
};

export const viewport: Viewport = SITE_VIEWPORT;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} font-sans antialiased`}>
        {/* In the layout, so the studio is described identically on every route rather than
            re-stated per page. Page-specific nodes (breadcrumbs) are added by the page. */}
        <JsonLd schema={graph([organizationSchema(), websiteSchema()])} />
        <GlassDefsPool />
        <LiquidGlassCursor />
        <Loader />
        {/* WCAG 2.4.1, Level A. It matters more here than on most sites: a full-screen
            loader and a nav sit ahead of the content, so without this a keyboard visitor
            tabs the whole navigation on every route before reaching anything.

            Same `sr-only focus-visible:not-sr-only` idiom the hero already uses for its
            rotation pause control — hidden until it is tabbed to, then a real control.
            First in the body so it is the first stop, and outside LenisProvider because
            it must work whether or not smooth scrolling has initialised. */}
        <a
          href="#main"
          className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:left-4 focus-visible:top-4 focus-visible:z-[10000] focus-visible:rounded-full focus-visible:bg-ink focus-visible:px-5 focus-visible:py-3 focus-visible:text-sm focus-visible:font-semibold focus-visible:text-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Skip to content
        </a>
        <LenisProvider>
          <Nav />
          {/* `tabIndex={-1}` so the skip link's jump actually moves focus. Without it the
              browser scrolls to the target and leaves focus on the link, and the next Tab
              returns to the navigation the visitor just asked to skip. */}
          <div id="main" tabIndex={-1} className="outline-none">
            {children}
          </div>
          {/* In the layout, not the page: it belongs to every route once the site grows. */}
          <Footer />
        </LenisProvider>
      </body>
    </html>
  );
}

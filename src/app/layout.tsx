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
        <LenisProvider>
          <Nav />
          {children}
          {/* In the layout, not the page: it belongs to every route once the site grows. */}
          <Footer />
        </LenisProvider>
      </body>
    </html>
  );
}

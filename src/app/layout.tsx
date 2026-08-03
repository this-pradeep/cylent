import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { LenisProvider } from "@/lib/motion/LenisProvider";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { GlassDefsPool } from "@/components/GlassDefsPool";
import { LiquidGlassCursor } from "@/components/LiquidGlassCursor";
import { Loader } from "@/components/Loader";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });

export const metadata: Metadata = {
  title: "Cylent Solutions",
  description: "We create digital experiences.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} font-sans antialiased`}>
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

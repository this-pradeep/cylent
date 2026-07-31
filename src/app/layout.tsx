import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { LenisProvider } from "@/lib/motion/LenisProvider";
import { Nav } from "@/components/Nav";
import { GlassDefsPool } from "@/components/GlassDefsPool";
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
        <LenisProvider>
          <Nav />
          {children}
        </LenisProvider>
      </body>
    </html>
  );
}

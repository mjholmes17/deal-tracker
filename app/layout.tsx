import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Wavecrest Deal Tracker",
  description: "Competitive deal intelligence platform for Wavecrest Growth Partners",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen antialiased font-[family-name:var(--font-inter)]">
        {children}
      </body>
    </html>
  );
}

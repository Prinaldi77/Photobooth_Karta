import type { Metadata } from "next";
import { Anton, Plus_Jakarta_Sans, Space_Mono } from "next/font/google";
import "./globals.css";

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-space-mono",
});

export const metadata: Metadata = {
  title: "FKPGR 02 — Photobooth Kemerdekaan Digital",
  description: "Kios Photobooth Digital Resmi Karang Taruna FKPGR 02 - Edisi Spesial 3 Pose Single Strip Kemerdekaan",
  icons: {
    icon: "/logo-karta.webp",
    shortcut: "/logo-karta.webp",
    apple: "/logo-karta.webp",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="id"
      className={`${anton.variable} ${jakarta.variable} ${spaceMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#FFFBF2] text-[#161F33] font-sans">{children}</body>
    </html>
  );
}

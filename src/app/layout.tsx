import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Photobooth Karang Taruna FKPGR 02",
  description: "Web Photobooth Resmi Karang Taruna FKPGR 02 - Edisi Spesial 3 Pose Twin Strip",
  icons: {
    icon: "/logo-karta.png",
    shortcut: "/logo-karta.png",
    apple: "/logo-karta.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#FFFDF5] text-black">{children}</body>
    </html>
  );
}

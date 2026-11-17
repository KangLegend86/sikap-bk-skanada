import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SiKAP BK Skanada — SMKS NU 2 Kedungpring",
  description:
    "Aplikasi Penilaian Sikap & Bimbingan Konseling SMKS NU 2 Kedungpring (Skanada)",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/images/logo-sikap-bk.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SiKAP BK Skanada",
  },
};

export const viewport: Viewport = {
  themeColor: "#0D6A37",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${plusJakarta.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#F2F4F7] text-zinc-900">{children}</body>
    </html>
  );
}

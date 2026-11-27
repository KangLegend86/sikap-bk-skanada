import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Inter, JetBrains_Mono } from "next/font/google";
import { getSession } from "@/lib/auth";
import { ACTIVE_MODE_COOKIE, isValidAppMode } from "@/lib/mode";
import { PersistentBottomNav } from "@/components/layout/PersistentBottomNav";
import { TopProgressBar } from "@/components/layout/TopProgressBar";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["500", "600"],
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
  themeColor: "#FFFFFF",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  const cookieStore = await cookies();
  const rawSavedMode = cookieStore.get(ACTIVE_MODE_COOKIE)?.value;
  const savedMode = isValidAppMode(rawSavedMode) ? rawSavedMode : null;

  return (
    <html
      lang="id"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#FAFAFA] text-zinc-900">
        <Suspense fallback={null}>
          <TopProgressBar />
        </Suspense>
        {children}
        <PersistentBottomNav
          role={session?.role ?? null}
          ruangKelasId={session?.ruangKelasId ?? null}
          initialSavedMode={savedMode}
        />
      </body>
    </html>
  );
}

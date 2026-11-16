import type { Metadata } from 'next';
import { Alkatra, Yellowtail } from 'next/font/google';
import { LoginClient } from '@/components/auth/LoginClient';

const yellowtail = Yellowtail({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
});

const alkatra = Alkatra({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Masuk — SiKAP BK Skanada',
  description:
    'Portal masuk Aplikasi Penilaian Sikap & Bimbingan Konseling SMKS NU 2 Kedungpring',
};

export default function LoginPage() {
  return (
    <LoginClient
      fontScriptClass={yellowtail.className}
      fontQuoteClass={alkatra.className}
    />
  );
}

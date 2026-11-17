import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';

/**
 * Garis aksen 3 segmen khas Skanada (Hijau - Emas - Hijau) dari footer halaman login.
 */
export function SkanadaAccentBar({ className = '' }: { className?: string }) {
  return (
    <div className={`flex h-0.5 w-[72px] items-center ${className}`} aria-hidden="true">
      <span className="h-full w-7 shrink-0 rounded-l-full bg-[#045A19]" />
      <span className="h-full w-4 shrink-0 bg-[#FFCC00]" />
      <span className="h-full w-7 shrink-0 rounded-r-full bg-[#045A19]" />
    </div>
  );
}

/**
 * Kartu standar SiKAP BK Skanada dengan border dan bayangan lembut bernuansa hijau.
 */
export function SkanadaCard({
  children,
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div className={`skanada-card p-4 sm:p-5 ${className}`} {...props}>
      {children}
    </div>
  );
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'skanada-btn-primary',
  secondary:
    'rounded-xl border border-[#C9D6CC] bg-white text-[#17331E] font-semibold hover:bg-[#E9F2EB] hover:border-[#045A19]/40 transition-colors',
  ghost:
    'rounded-xl text-[#045A19] font-semibold hover:bg-[#E9F2EB] transition-colors',
  danger:
    'rounded-xl bg-rose-600 text-white font-semibold hover:bg-rose-700 shadow-xs transition-colors',
};

/**
 * Tombol standar sesuai Design System halaman login.
 */
export function SkanadaButton({
  variant = 'primary',
  className = '',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  children: ReactNode;
}) {
  return (
    <button
      className={`inline-flex cursor-pointer items-center justify-center gap-2 px-4 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-60 ${buttonVariants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

type BadgeVariant = 'green' | 'gold' | 'neutral';

const badgeVariants: Record<BadgeVariant, string> = {
  green: 'bg-[#E9F2EB] text-[#045A19] border-[#C9D6CC]',
  gold: 'bg-[#FFF9DB] text-[#7A5900] border-[#FCD20B]/70',
  neutral: 'bg-[#EEF3EF] text-[#495E4E] border-[#DCE6DE]',
};

/**
 * Badge status / peran khas SiKAP BK Skanada.
 */
export function SkanadaBadge({
  variant = 'green',
  className = '',
  children,
}: {
  variant?: BadgeVariant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold ${badgeVariants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

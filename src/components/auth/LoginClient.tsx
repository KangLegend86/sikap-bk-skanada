'use client';

import { useActionState, useState, type KeyboardEvent } from 'react';
import {
  AlertCircle,
  Check,
  Eye,
  EyeOff,
  Info,
  Loader2,
  Lock,
  LogIn,
  User,
} from 'lucide-react';
import { loginGuruAction, type AuthActionState } from '@/actions/auth';

const initialState: AuthActionState = {};

interface LoginClientProps {
  fontScriptClass: string;
  fontQuoteClass: string;
}

export function LoginClient({ fontScriptClass, fontQuoteClass }: LoginClientProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotHint, setShowForgotHint] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);

  const [state, formAction, isPending] = useActionState(
    loginGuruAction,
    initialState
  );

  function handlePasswordKeyEvent(e: KeyboardEvent<HTMLInputElement>) {
    setCapsLockOn(e.getModifierState('CapsLock'));
  }

  return (
    <div
      className="flex min-h-dvh flex-col overflow-x-hidden bg-cover bg-no-repeat"
      style={{
        backgroundColor: '#ECFDF5',
        backgroundImage:
          "linear-gradient(0deg, rgba(255, 255, 255, 0.86) 0%, rgba(255, 255, 255, 0.86) 100%), url('/images/login-bg.webp')",
        backgroundPosition: 'center, 18.2% 0',
      }}
    >
      <main className="flex flex-1 flex-col items-center justify-center px-4 pt-6 pb-4 sm:px-6 sm:py-3">
        <div className="flex w-full max-w-[360px] flex-1 flex-col items-center sm:max-w-[420px] sm:flex-none sm:rounded-3xl sm:border sm:border-white/80 sm:bg-white/85 sm:px-8 sm:py-4 sm:shadow-[0_24px_60px_rgba(4,120,87,0.12)] sm:backdrop-blur-md">
          <div className="my-auto flex w-full flex-col items-center sm:my-0">
          {/* Brand Header */}
          <header className="flex w-full flex-col items-center">
            <div className="flex h-24 w-24 items-center justify-center p-1.5 sm:h-[68px] sm:w-[68px] sm:p-0.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/logo-maarif.jpg"
                alt="Logo LP Ma'arif"
                className="h-full w-full object-contain mix-blend-multiply"
              />
            </div>

            <div className="relative mt-2 h-[40px] w-full max-w-[292px] sm:h-[43px]">
              <svg
                className="pointer-events-none absolute left-1/2 top-[21px] z-0 block h-[27px] w-[223px] -translate-x-1/2 sm:top-6 sm:h-[29px] sm:w-[239px]"
                viewBox="0 0 239 29"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M228.428 19.0347C228.476 18.7893 228.524 18.544 228.572 18.2986C224.99 17.5162 221.479 16.8533 217.821 16.2032C185.347 10.5519 152.295 8.03367 119.285 8.00001C86.219 8.00835 53.2718 10.6647 20.7441 16.3051C17.1588 16.9283 13.5563 17.5916 9.93911 18.2967C9.9797 18.5433 10.0203 18.79 10.0609 19.0367C13.7088 18.5462 17.3365 18.0873 20.9421 17.6582C53.6498 13.767 86.3987 12.0102 119.285 12C152.114 12.035 184.987 13.6566 217.618 17.5556C221.291 18.0108 224.834 18.4704 228.428 19.0347Z"
                  fill="#FCD20B"
                />
              </svg>
              <div className="relative z-10 flex h-[32px] w-full items-center justify-center px-2 sm:h-[34px]">
                <h1
                  className={`${fontScriptClass} whitespace-nowrap text-[28px] font-normal leading-none text-[#047857] sm:text-[30px]`}
                >
                  Selamat Datang di Portal
                </h1>
              </div>
            </div>

            {/* Brand Lockup */}
            <div className="mt-2 flex w-full max-w-[328px] flex-col items-center gap-1.5">
              <div className="relative flex w-full items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/logo-sikap-bk.svg"
                  alt="Logo SiKAP BK Skanada"
                  className="absolute left-0 top-1/2 aspect-square h-[68px] w-[68px] -translate-y-1/2 object-contain sm:h-[76px] sm:w-[76px]"
                />
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className="flex items-center justify-center rounded-full border-x-2 border-[#FFCC00] px-3.5 py-1"
                    style={{
                      backgroundImage:
                        'linear-gradient(323deg, #047857 -1.52%, #4c8d5e 98.48%)',
                    }}
                  >
                    <span className="text-xs font-extrabold leading-none text-white sm:text-sm">
                      Aplikasi
                    </span>
                  </div>
                  <div className="text-[28px] font-extrabold leading-none tracking-tight text-[#047857] sm:text-[32px]">
                    SiKAP BK
                  </div>
                </div>
              </div>

              <div className="relative h-[36px] w-full max-w-[323px] sm:h-[38px]">
                <svg
                  className="absolute inset-0 block h-full w-full"
                  viewBox="0 0 323 38"
                  fill="none"
                  preserveAspectRatio="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M23.6088 8.75H11.8588C11.8588 8.75 1.10883 8.75 0.108826 8.75C-0.891174 8.75 5.30883 18.75 6.10883 18.75H18.1088C18.7755 19.25 19.4088 21.25 18.6088 21.25H11.1088C9.10883 23.75 9.10883 26.75 11.1088 29.25H23.6088C20 23.25 19.5 15.25 23.6088 8.75Z"
                    fill="#FFCC00"
                    stroke="#FFCC00"
                  />
                  <rect
                    x="23.6088"
                    width="275.659"
                    height="38"
                    rx="19"
                    fill="url(#paint0_linear_login_pill)"
                  />
                  <path
                    d="M299.268 8.75H311.018C311.018 8.75 321.768 8.75 322.768 8.75C323.768 8.75 317.568 18.75 316.768 18.75H304.768C304.101 19.25 303.468 21.25 304.268 21.25H311.768C313.768 23.75 313.768 26.75 311.768 29.25H299.268C302.877 23.25 303.377 15.25 299.268 8.75Z"
                    fill="#FFCC00"
                    stroke="#FFCC00"
                  />
                  <defs>
                    <linearGradient
                      id="paint0_linear_login_pill"
                      x1="301.455"
                      y1="38.7917"
                      x2="294.452"
                      y2="-27.563"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop stopColor="#004914" />
                      <stop offset="1" stopColor="#4C8D5E" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="relative flex h-full items-center justify-center text-[26px] font-extrabold leading-none text-white sm:text-[32px]">
                  SKANADA
                </div>
              </div>
            </div>

            <div className="mt-2 flex w-full max-w-[328px] items-center justify-center gap-3">
              <span className="h-0.5 flex-1 bg-[#035526]" />
              <span className="whitespace-nowrap text-center text-sm font-extrabold leading-none text-[#004C15] sm:text-base">
                SMKS NU 2 Kedungpring
              </span>
              <span className="h-0.5 flex-1 bg-[#035526]" />
            </div>
          </header>

          {/* Login Form */}
          <section className="mt-6 w-full sm:mt-4" aria-label="Formulir Masuk">
            <form
              className="flex w-full flex-col gap-3 sm:gap-2.5"
              action={formAction}
            >
              {state.error && (
                <div
                  id="login-error"
                  role="alert"
                  aria-live="polite"
                  className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/95 px-3.5 py-2.5 text-xs font-medium leading-relaxed text-rose-700 shadow-xs"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                  <span>{state.error}</span>
                </div>
              )}

              {/* Username */}
              <div>
                <label htmlFor="login-username" className="sr-only">
                  Username
                </label>
                <div className="group flex h-[52px] items-center rounded-xl border border-[#A7F3D0] bg-white/95 pl-3.5 pr-3 shadow-[0_2px_8px_rgba(4,120,87,0.04)] transition-all focus-within:border-[#047857] focus-within:bg-white focus-within:ring-3 focus-within:ring-[#047857]/12 sm:h-[44px]">
                  <User
                    className="h-[18px] w-[18px] shrink-0 text-[#5C7362] transition-colors group-focus-within:text-[#047857]"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  <span className="mx-3 h-[22px] w-px shrink-0 bg-[#D1FAE5] transition-colors group-focus-within:bg-[#047857]/25" />
                  <input
                    id="login-username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    type="text"
                    name="username"
                    required
                    autoComplete="username"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    aria-invalid={Boolean(state.error)}
                    aria-describedby={state.error ? 'login-error' : undefined}
                    placeholder="Username"
                    className="h-full min-w-0 flex-1 bg-transparent text-sm font-medium leading-5 text-[#17331E] outline-none placeholder:font-normal placeholder:text-[#6D8272]"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="login-password" className="sr-only">
                  Password
                </label>
                <div className="group flex h-[52px] items-center rounded-xl border border-[#A7F3D0] bg-white/95 pl-3.5 pr-1.5 shadow-[0_2px_8px_rgba(4,120,87,0.04)] transition-all focus-within:border-[#047857] focus-within:bg-white focus-within:ring-3 focus-within:ring-[#047857]/12 sm:h-[44px]">
                  <Lock
                    className="h-[18px] w-[18px] shrink-0 text-[#5C7362] transition-colors group-focus-within:text-[#047857]"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  <span className="mx-3 h-[22px] w-px shrink-0 bg-[#D1FAE5] transition-colors group-focus-within:bg-[#047857]/25" />
                  <input
                    id="login-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyUp={handlePasswordKeyEvent}
                    onKeyDown={handlePasswordKeyEvent}
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    autoComplete="current-password"
                    aria-invalid={Boolean(state.error)}
                    aria-describedby={
                      capsLockOn
                        ? 'caps-lock-warning'
                        : state.error
                          ? 'login-error'
                          : undefined
                    }
                    placeholder="Password"
                    className="h-full min-w-0 flex-1 bg-transparent text-sm font-medium leading-5 text-[#17331E] outline-none placeholder:font-normal placeholder:text-[#6D8272]"
                  />
                  <button
                    type="button"
                    className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-lg text-[#5C7362] transition-colors hover:bg-[#047857]/8 hover:text-[#047857] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#047857]"
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-[18px] w-[18px]" strokeWidth={2} />
                    ) : (
                      <Eye className="h-[18px] w-[18px]" strokeWidth={2} />
                    )}
                  </button>
                </div>

                {capsLockOn && (
                  <p
                    id="caps-lock-warning"
                    aria-live="polite"
                    className="px-1 text-[11px] font-medium text-amber-700"
                  >
                    Caps Lock sedang aktif
                  </p>
                )}
              </div>

              {/* Remember & Forgot Password */}
              <div className="flex min-h-[36px] items-center justify-between px-0.5 sm:min-h-[28px]">
                <label className="inline-flex min-h-[36px] cursor-pointer items-center gap-2 text-xs font-medium text-[#495E4E] select-none sm:min-h-[28px]">
                  <span className="relative flex h-4 w-4 items-center justify-center">
                    <input
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      type="checkbox"
                      name="remember"
                      className="peer h-4 w-4 cursor-pointer appearance-none rounded-[5px] border-[1.5px] border-[#B9CBBD] bg-white transition-colors checked:border-[#047857] checked:bg-[#047857] hover:border-[#047857] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#047857]"
                    />
                    <Check
                      className="pointer-events-none absolute h-3 w-3 text-white opacity-0 transition-opacity peer-checked:opacity-100"
                      strokeWidth={3}
                      aria-hidden="true"
                    />
                  </span>
                  Ingat saya
                </label>

                <button
                  type="button"
                  onClick={() => setShowForgotHint((prev) => !prev)}
                  aria-expanded={showForgotHint}
                  className="min-h-[36px] cursor-pointer rounded-md px-1 text-xs font-semibold text-[#047857] transition-colors hover:text-[#065F46] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#047857]"
                >
                  Lupa Password?
                </button>
              </div>

              {showForgotHint && (
                <div className="flex items-start gap-2.5 rounded-xl border border-[#A7F3D0] bg-white/95 px-3.5 py-2.5 text-xs leading-relaxed text-[#3B5240] shadow-xs">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#047857]" />
                  <span>
                    Silakan hubungi <strong>Koordinator BK</strong> atau{' '}
                    <strong>Administrator</strong> sekolah untuk mereset password akun Anda.
                  </span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isPending}
                className="mt-0.5 flex h-[50px] w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl bg-[linear-gradient(354deg,#004914_0%,#4C8D5E_100%)] text-sm font-semibold tracking-wide text-white shadow-[0_6px_16px_rgba(0,73,20,0.28)] transition-all hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#004914] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-65 sm:h-[44px]"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-[18px] w-[18px] animate-spin" strokeWidth={2.2} />
                    <span>Memverifikasi...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="h-[18px] w-[18px]" strokeWidth={2.2} />
                    <span>Masuk</span>
                  </>
                )}
              </button>
            </form>
          </section>

          {/* Quote Banner */}
          <div className="mt-3 flex w-full justify-center sm:mt-2">
            <svg
              className="block h-auto w-full max-w-[290px] sm:max-w-[215px]"
              viewBox="0 0 300 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              role="img"
              aria-label="Melayani dengan Hati, Mendampingi dengan Solusi"
            >
              <g filter="url(#filter0_g_quote_banner)">
                <path
                  d="M207.046 9.47544L205.23 11.9365C151.841 7.02389 97.2286 10.091 44.5471 19.7966C42.9829 20.084 38.856 20.5974 39.1937 22.5961L116.047 13.6239C149.192 13.6596 182.405 13.1551 215.366 16.1536C240.544 18.4385 265.687 23.2764 290.569 27.0925L280.156 28.4745L266.13 28.2112L270.885 32.0061L260.234 33.1844L294.183 38.9976L290.104 41.5232L276.044 43.8398C284.407 44.1909 291.829 45.378 294.848 53.0269L288.891 56.6735C290.643 56.1492 301.227 57.1495 298.232 60.2695C296.887 61.6612 282.117 61.5397 286.207 64.8552L298.636 68.993C290.383 73.0012 282.114 75.694 272.826 73.5593L291.646 83.4038L259.443 82.2367L267.256 85.9034C267.767 88.0149 265.183 87.4363 263.542 87.3915C243.164 86.8986 223.023 82.9167 202.755 82.1636L204.422 84.7453C142.441 77.8538 79.6235 83.0065 17.9052 92.043C17.948 89.3284 22.3894 91.9696 20.7463 87.9096L18.0912 87.7909L19.1397 85.2982L14.447 83.5147L26.3168 75.5789C22.3643 73.5731 9.47238 79.9448 8.1152 79.081C5.16475 77.2168 18.9204 71.6377 16.7738 67.9502C16.1567 67.5222 6.04817 71.1597 3.03302 68.5599C-0.348547 65.6548 13.4099 63.1105 13.3605 60.7224L3.85904 55.6433C3.13814 51.9838 5.28917 49.816 8.18473 47.5198L5.05088 45.6641L14.2043 45.2132L3.3351 41.6881C5.76711 38.3122 10.6126 32.1521 8.87626 29.3856L34.809 26.8011L28.5096 22.4062C29.6415 21.0512 31.0977 20.084 32.8922 19.4771C41.0798 16.694 60.5808 14.4612 70.1823 13.1032C115.528 6.71866 161.59 5.53825 207.075 9.43383L207.046 9.47544Z"
                  fill="url(#paint0_linear_quote_banner)"
                />
              </g>
              <text
                fill="white"
                className={fontQuoteClass}
                style={{ whiteSpace: 'pre' }}
                xmlSpace="preserve"
                fontSize="16"
                letterSpacing="0em"
              >
                <tspan x="72.6896" y="40.5548">
                  “Melayani dengan Hati
                </tspan>
                <tspan x="52.3381" y="54.5548">
                  Mendampingi dengan Solusi”
                </tspan>
              </text>
              <path
                d="M52.7337 77.8757C52.7824 78.0351 52.8312 78.1945 52.8799 78.3539C55.9498 77.5977 59.2277 77.0067 62.3955 76.4688C88.7242 72.2611 115.297 69.8759 141.838 67.9125C173.451 65.6712 205.109 64.6683 236.854 65.5306C240.105 65.6209 243.343 65.7308 246.598 65.8642C246.612 65.6982 246.626 65.5321 246.64 65.366C243.405 64.955 240.181 64.5799 236.941 64.2371C205.281 60.9035 173.295 60.6672 141.481 62.9252C114.769 64.8998 88.0954 68.5018 62.0964 75.0776C58.9704 75.9032 55.7412 76.7987 52.7337 77.8757Z"
                fill="#FFCC00"
              />
              <defs>
                <filter
                  id="filter0_g_quote_banner"
                  x="1.49808"
                  y="6.19879"
                  width="298.264"
                  height="86.8442"
                  filterUnits="userSpaceOnUse"
                  colorInterpolationFilters="sRGB"
                >
                  <feFlood floodOpacity="0" result="BackgroundImageFix" />
                  <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                  <feTurbulence
                    type="fractalNoise"
                    baseFrequency="0.99900001287460327 0.99900001287460327"
                    numOctaves="3"
                    seed="5993"
                  />
                  <feDisplacementMap
                    in="shape"
                    scale="2"
                    xChannelSelector="R"
                    yChannelSelector="G"
                    result="displacedImage"
                    width="100%"
                    height="100%"
                  />
                  <feMerge result="effect1_texture_quote_banner">
                    <feMergeNode in="displacedImage" />
                  </feMerge>
                </filter>
                <linearGradient
                  id="paint0_linear_quote_banner"
                  x1="302.432"
                  y1="87.5886"
                  x2="263.619"
                  y2="-55.4683"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#004914" />
                  <stop offset="1" stopColor="#4C8D5E" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          </div>

          {/* App Footer */}
          <footer className="mt-auto flex w-full flex-col items-center justify-center gap-1 pt-4 sm:mt-2 sm:pt-1">
            <div className="flex h-2 w-[72px] items-start py-1" aria-hidden="true">
              <span className="h-0.5 w-7 shrink-0 bg-[#047857]" />
              <span className="h-0.5 w-4 shrink-0 bg-[#FFCC00]" />
              <span className="h-0.5 w-7 shrink-0 bg-[#047857]" />
            </div>
            <p className="text-center text-xs font-medium leading-[18px] text-[#047857]">
              Aplikasi Penilaian Sikap &amp; Bimbingan Konseling
            </p>
            <p className="text-center text-[11px] font-normal leading-4 text-[#4D6452]">
              ©2026 Copyright Skanada
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}

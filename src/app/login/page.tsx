'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { loginGuruAction, type AuthActionState } from '@/actions/auth';

const initialState: AuthActionState = {};

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotHint, setShowForgotHint] = useState(false);

  const [state, formAction, isPending] = useActionState(
    loginGuruAction,
    initialState
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Alkatra:wght@400&family=Inter:ital,wght@0,400;0,500;0,600;0,800;1,800&family=Yellowtail&display=swap');

        .login-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, sans-serif;
          text-rendering: optimizeLegibility;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        .login-font-script {
          font-family: 'Yellowtail', cursive;
        }

        .login-brand-pill {
          background-image: linear-gradient(323deg, #045a19 -1.52%, #4c8d5e 98.48%);
        }

        .login-page-bg {
          background-color: lightgray;
          background-image:
            linear-gradient(0deg, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0.85) 100%),
            url('https://cdn.builder.io/api/v1/image/assets%2Feddcb334c2104c49b949190797eb874d%2F5ccf65637adb4b63b35d488cfd87cdcb');
          background-size: cover, cover;
          background-position: center, 18.2% 0;
          background-repeat: no-repeat;
        }

        .login-checkbox {
          appearance: none;
          width: 15px;
          height: 15px;
          flex-shrink: 0;
          border-radius: 4px;
          border: 1px solid #c9d6cc;
          background-color: #fff;
          background-repeat: no-repeat;
          background-position: center;
          background-size: 11px 11px;
          cursor: pointer;
        }

        .login-checkbox:checked {
          border-color: #045a19;
          background-color: #045a19;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M2.5 6.5l2.5 2.5 4.5-5.5'/%3E%3C/svg%3E");
        }
      `}</style>

      <div className="login-page login-page-bg flex min-h-dvh flex-col overflow-x-hidden">
        <main className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 pb-[22px] pt-[33px]">
          {/* Brand Header */}
          <header className="flex w-full flex-col items-center">
            <div className="flex h-[115px] w-[115px] items-center justify-center p-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://api.builder.io/api/v1/image/assets/TEMP/d84d979da903b0f176fc038b00d0a972feb44cb2?width=190"
                alt="Logo LP Ma'arif"
                className="h-[95px] w-[95px]"
              />
            </div>

            <div className="relative mt-3 h-[43px] w-full max-w-[292px]">
              <svg
                className="pointer-events-none absolute left-[27px] top-6 z-0 block h-[29px] w-[239px] max-w-full"
                width="239"
                height="29"
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
              <div className="absolute left-0 top-0 z-10 flex h-[34px] w-full items-center justify-center p-2.5">
                <h1 className="login-font-script whitespace-nowrap text-[30px] font-normal leading-[14px] text-[#045A19]">
                  Selamat Datang di Portal
                </h1>
              </div>
            </div>

            <div className="mt-[11px] flex w-[335px] items-start max-[359px]:[zoom:0.85]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://api.builder.io/api/v1/image/assets/TEMP/076bccc1085a6f92989eec78b0f76f738eb5810e?width=160"
                alt="Logo SKANADA"
                className="-mr-[68px] aspect-[10/9] h-[72px] w-[80px] shrink-0"
              />
              <div className="relative flex w-[323px] shrink-0 flex-col items-center gap-1.5">
                <div className="login-brand-pill flex items-center justify-center rounded-[20px] border-x-2 border-[#FFCC00] px-3.5 py-1">
                  <span className="text-sm font-extrabold italic leading-[14px] text-white">
                    Aplikasi
                  </span>
                </div>

                <div className="flex h-8 items-center justify-center self-stretch text-[32px] font-extrabold italic leading-[14px] text-[#045A19]">
                  SiKAP BK
                </div>

                <div className="relative h-[38px] w-[323px]">
                  <svg
                    className="absolute inset-0 block"
                    width="323"
                    height="38"
                    viewBox="0 0 323 38"
                    fill="none"
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
                        <stop stopColor="#045A19" />
                        <stop offset="1" stopColor="#4C8D5E" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="relative flex h-full items-center justify-center text-[32px] font-extrabold italic leading-[14px] text-white">
                    SKANADA
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3 flex w-full max-w-[338px] items-center justify-center gap-3">
              <span className="h-0.5 w-[60px] shrink bg-[#035526]" />
              <span className="whitespace-nowrap text-center text-base font-extrabold italic leading-[14px] text-[#004C15]">
                SMKS NU 2 Kedungpring
              </span>
              <span className="h-0.5 w-[60px] shrink bg-[#035526]" />
            </div>
          </header>

          {/* Login Form */}
          <div className="mt-[31px] flex w-full justify-center">
            <form
              className="flex w-full max-w-[318px] flex-col gap-[15px]"
              action={formAction}
            >
              {state.error && (
                <div
                  role="alert"
                  className="rounded-[10px] border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700"
                >
                  {state.error}
                </div>
              )}

              <div className="flex h-[50px] items-center rounded-[10px] border border-[#C9D6CC] bg-white pl-4 focus-within:border-[#045A19]">
                <svg
                  className="shrink-0"
                  width="16"
                  height="20"
                  viewBox="0 0 16 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M0 20V17C0 10 16 10 16 17V20M12 4C12 5.06087 11.5786 6.07828 10.8284 6.82843C10.0783 7.57857 9.06087 8 8 8C6.93913 8 5.92172 7.57857 5.17157 6.82843C4.42143 6.07828 4 5.06087 4 4C4 2.93913 4.42143 1.92172 5.17157 1.17157C5.92172 0.421427 6.93913 0 8 0C9.06087 0 10.0783 0.421427 10.8284 1.17157C11.5786 1.92172 12 2.93913 12 4Z"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    stroke="#5A5A5A"
                  />
                </svg>
                <span className="ml-[15px] h-[22px] w-px shrink-0 bg-[#D4DED6]" />
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  type="text"
                  name="username"
                  required
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="Username"
                  aria-label="Username"
                  className="ml-[13px] h-full min-w-0 flex-1 bg-transparent pr-4 text-sm leading-5 text-[#1E3A28] outline-none placeholder:text-[#5A5A5A]"
                />
              </div>

              <div className="flex h-[50px] items-center rounded-[10px] border border-[#C9D6CC] bg-white pl-4 focus-within:border-[#045A19]">
                <svg
                  className="mr-0.5 shrink-0"
                  width="14"
                  height="20"
                  viewBox="0 0 14 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M2 8.5V4.5C2 -1.5 12 -1.5 12 4.5V8.5M7 12.5V15.5M0 8.5H14V19.5H0V8.5Z"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    stroke="#5A5A5A"
                  />
                </svg>
                <span className="ml-[15px] h-[22px] w-px shrink-0 bg-[#D4DED6]" />
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  autoComplete="current-password"
                  placeholder="Password"
                  aria-label="Password"
                  className="ml-[13px] h-full min-w-0 flex-1 bg-transparent text-sm leading-5 text-[#1E3A28] outline-none placeholder:text-[#5A5A5A]"
                />
                <button
                  type="button"
                  className="mr-px h-12 w-11 shrink-0 cursor-pointer"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  <svg
                    width="44"
                    height="48"
                    viewBox="0 0 44 48"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 23.75C17 14.75 27 14.75 32 23.75C27 32.75 17 32.75 12 23.75ZM25 23.75C25 24.5456 24.6839 25.3087 24.1213 25.8713C23.5587 26.4339 22.7956 26.75 22 26.75C21.2044 26.75 20.4413 26.4339 19.8787 25.8713C19.3161 25.3087 19 24.5456 19 23.75C19 22.9544 19.3161 22.1913 19.8787 21.6287C20.4413 21.0661 21.2044 20.75 22 20.75C22.7956 20.75 23.5587 21.0661 24.1213 21.6287C24.6839 22.1913 25 22.9544 25 23.75Z"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      stroke="#5A5A5A"
                    />
                    {showPassword && (
                      <path
                        d="M14 31L30 16.5"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        stroke="#5A5A5A"
                      />
                    )}
                  </svg>
                </button>
              </div>

              <div className="flex h-5 items-center justify-between">
                <label className="flex cursor-pointer items-center gap-2 text-xs leading-5 text-[#5A5A5A]">
                  <input
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    type="checkbox"
                    name="remember"
                    className="login-checkbox"
                  />
                  Ingat saya
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotHint((prev) => !prev)}
                  className="cursor-pointer text-xs font-medium leading-5 text-[#045A19] hover:underline"
                >
                  Lupa Password
                </button>
              </div>

              {showForgotHint && (
                <div className="rounded-[10px] border border-[#C9D6CC] bg-white/95 px-3.5 py-2.5 text-xs leading-relaxed text-[#3B5240]">
                  Silakan hubungi <strong>Koordinator BK / Administrator</strong>{' '}
                  untuk mereset password akun Anda.
                </div>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-[10px] bg-[#045A19] py-3.5 text-sm font-semibold leading-5 text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <svg
                  className="shrink-0 self-center"
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M11 0H18V18H11M0 9H12M7 14L12 9L7 4"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    stroke="white"
                  />
                </svg>
                {isPending ? 'Memverifikasi...' : 'Login'}
              </button>
            </form>
          </div>

          {/* Quote Banner */}
          <div className="mt-[15px]">
            <svg
              className="block h-[100px] w-[300px] max-w-full"
              width="300"
              height="100"
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
                style={{ whiteSpace: 'pre' }}
                xmlSpace="preserve"
                fontFamily="Alkatra"
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
        </main>

        {/* App Footer */}
        <footer className="flex w-full flex-col items-center justify-center gap-1.5 px-6 pb-4 pt-1.5">
          <div className="flex h-2 w-[72px] items-start py-1" aria-hidden="true">
            <span className="h-0.5 w-7 shrink-0 bg-[#045A19]" />
            <span className="h-0.5 w-4 shrink-0 bg-[#FFCC00]" />
            <span className="h-0.5 w-7 shrink-0 bg-[#045A19]" />
          </div>
          <p className="self-stretch text-center text-xs font-medium leading-[18px] text-[#045A19]">
            Aplikasi Penilaian Sikap &amp; Bimbingan Konseling
          </p>
          <p className="self-stretch text-center text-[11px] font-normal leading-4 text-[#4D6452]">
            ©2026 Copyright Skanada •{' '}
            <Link
              href="/admin/login"
              className="font-semibold text-[#045A19] hover:underline"
            >
              Panel Admin
            </Link>
          </p>
        </footer>
      </div>
    </>
  );
}

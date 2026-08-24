import type { ReactNode } from "react";
import Image from "next/image";
import { t } from "@/lib/i18n";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-charcoal lg:grid lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative flex min-h-[38vh] flex-col justify-between overflow-hidden px-8 py-10 sm:px-12 sm:py-14 lg:min-h-screen lg:px-16 lg:py-16">
        <ArchitecturalBackground />

        <div className="relative">
          <Image
            src="/brand/bizrael-logo.png"
            alt="BIZRAEL — Your Key to Success"
            width={218}
            height={80}
            priority
            className="h-auto w-44 sm:w-52"
          />
        </div>

        <div className="relative mt-10 max-w-md lg:mt-0">
          <h1
            style={{ fontFamily: "var(--font-display)" }}
            className="text-3xl font-medium leading-tight text-ivory sm:text-4xl"
          >
            {t.app.heroTitle}
          </h1>
          <div className="my-5 h-px w-16 bg-gradient-to-r from-gold-light via-gold to-gold-dark" />
          <p className="text-sm leading-relaxed text-warmgray sm:text-base">
            {t.app.heroSubtitle}
          </p>
        </div>

        <p className="relative hidden text-xs tracking-wide text-warmgray/70 lg:block">
          {t.app.fullName} — {t.app.tagline}
        </p>
      </div>

      {/* Login/form panel */}
      <div className="flex flex-1 items-center justify-center bg-charcoal-light px-4 py-10 sm:px-8">
        <div className="w-full max-w-md rounded-xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl backdrop-blur-sm sm:p-9">
          {children}
        </div>
      </div>
    </div>
  );
}

function ArchitecturalBackground() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.18]"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="goldLine" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ecd9a0" />
          <stop offset="100%" stopColor="#8a6d3a" />
        </linearGradient>
      </defs>
      <line x1="0%" y1="15%" x2="60%" y2="0%" stroke="url(#goldLine)" strokeWidth="1" />
      <line x1="0%" y1="45%" x2="100%" y2="10%" stroke="url(#goldLine)" strokeWidth="1" />
      <line x1="10%" y1="100%" x2="80%" y2="35%" stroke="url(#goldLine)" strokeWidth="1" />
      <line x1="40%" y1="100%" x2="100%" y2="55%" stroke="url(#goldLine)" strokeWidth="1" />
      <line x1="0%" y1="75%" x2="45%" y2="100%" stroke="url(#goldLine)" strokeWidth="1" />
      <circle cx="88%" cy="18%" r="120" stroke="url(#goldLine)" strokeWidth="0.75" fill="none" />
      <circle cx="12%" cy="88%" r="90" stroke="url(#goldLine)" strokeWidth="0.75" fill="none" />
    </svg>
  );
}

import Image from "next/image";

export default function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-charcoal">
      <div className="flex flex-col items-center gap-4">
        <Image
          src="/brand/bizrael-logo.png"
          alt="BIZRAEL"
          width={218}
          height={80}
          className="h-auto w-40 animate-pulse"
        />
        <div className="h-px w-24 animate-pulse bg-gradient-to-r from-gold-light via-gold to-gold-dark" />
      </div>
    </div>
  );
}

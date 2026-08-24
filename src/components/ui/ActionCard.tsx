import Link from "next/link";

export function ActionCard({
  href,
  title,
  description,
  icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-gold-light via-gold to-gold-dark opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-gold-light to-gold-dark text-charcoal">
        {icon}
      </div>
      <h3
        style={{ fontFamily: "var(--font-display)" }}
        className="text-lg font-medium text-slate-900"
      >
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-500">{description}</p>
      <span className="mt-4 text-sm font-medium text-gold-dark group-hover:text-gold">
        →
      </span>
    </Link>
  );
}

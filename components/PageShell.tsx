import Link from "next/link";
import { Icon } from "@/components/ui/icons";
import { Wordmark } from "@/components/brand/Logo";

/** Simple centered page shell for settings/profile/admin secondary pages. */
export function PageShell({
  title,
  children,
  wide,
}: {
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="min-h-[100dvh] bg-canvas text-ink">
      <header className="flex h-12 items-center justify-between border-b border-border px-4">
        <Link href="/" className="flex items-center gap-2 text-sm text-muted hover:text-ink">
          <Icon.ChevronDown width={16} height={16} className="rotate-90" />
          Kembali ke chat
        </Link>
        <Wordmark showMark={false} />
      </header>
      <main className={`mx-auto w-full px-4 py-8 ${wide ? "max-w-4xl" : "max-w-2xl"}`}>
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">{title}</h1>
        {children}
      </main>
    </div>
  );
}

export function SettingsRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-4 last:border-0">
      <div>
        <div className="text-sm font-medium text-ink">{label}</div>
        {description && <div className="text-xs text-muted">{description}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

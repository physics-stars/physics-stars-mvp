import Link from "next/link";

/*
 * Targeta d'opció per als menús de professorat/administració. Si té
 * `href`, és un enllaç funcional; si no, es mostra desactivada amb
 * l'etiqueta "Properament" (comunica que hi haurà més opcions sense
 * haver-les d'implementar encara).
 */
interface OptionCardProps {
  title: string;
  description: string;
  href?: string;
}

export function OptionCard({ title, description, href }: OptionCardProps) {
  const content = (
    <div className="flex flex-col gap-2 rounded-2xl border border-border-subtle bg-background-elevated p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {!href && (
          <span className="rounded-full bg-border-subtle px-2 py-0.5 text-xs text-foreground-muted">
            Properament
          </span>
        )}
      </div>
      <p className="text-sm text-foreground-muted">{description}</p>
    </div>
  );

  if (!href) {
    return <div className="cursor-not-allowed opacity-60">{content}</div>;
  }

  return (
    <Link href={href} className="transition-opacity hover:opacity-90">
      {content}
    </Link>
  );
}

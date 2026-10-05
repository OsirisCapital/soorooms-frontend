/**
 * Reproduction du logo SòôRooms (case stylisée + toit en arc, motif de
 * porte géométrique) — recréée en SVG à partir des maquettes fournies,
 * pas un export du fichier vectoriel d'origine. À remplacer par l'asset
 * officiel dès qu'il est disponible.
 */
type LogoProps = {
  size?: number;
  withWordmark?: boolean;
  className?: string;
};

export function Logo({ size = 64, withWordmark = true, className = "" }: LogoProps) {
  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <svg width={size} height={size} viewBox="0 0 512 512" aria-hidden="true">
        <path d="M256 72 L456 216 H396 V440 H116 V216 H56 Z" fill="#C1622E" />
        <rect x="150" y="240" width="212" height="200" rx="10" fill="#1E4A4A" />
        <path d="M256 240 L330 296 V440 H182 V296 Z" fill="#F2A65A" />
        <rect x="170" y="260" width="24" height="90" fill="#F2A65A" opacity="0.85" />
        <rect x="318" y="260" width="24" height="90" fill="#E3EFED" opacity="0.85" />
      </svg>
      {withWordmark && (
        <p className="font-display text-2xl font-bold tracking-tight">
          <span className="text-[var(--color-terracotta)]">Sòô</span>
          <span className="text-[var(--color-teal)]">Rooms</span>
        </p>
      )}
    </div>
  );
}

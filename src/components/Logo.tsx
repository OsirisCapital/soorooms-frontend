import Image from "next/image";

/**
 * Logo SòôRooms, à partir des fichiers fournis (public/logo-full.png avec le nom, public/logo-mark.png
 * la maison seule). Le fond blanc d'origine a été retiré : il se pose sur n'importe quelle couleur.
 * À remplacer par les fichiers définitifs en gardant les mêmes noms et proportions (≈ 1,6 : 1 pour la maison
 * seule, 1,6 : 1 pour le logo complet).
 */
type LogoProps = {
  size?: number;
  withWordmark?: boolean;
  className?: string;
};

const FULL_RATIO = 468 / 291;
const MARK_RATIO = 312 / 196;

export function Logo({ size = 64, withWordmark = true, className = "" }: LogoProps) {
  if (withWordmark) {
    const height = Math.round(size * 1.5);
    return (
      <div className={`flex flex-col items-center ${className}`}>
        <Image src="/logo-full.png" alt="SòôRooms" width={Math.round(height * FULL_RATIO)} height={height} priority />
      </div>
    );
  }
  const width = Math.round(size * 1.35);
  return (
    <div className={`flex items-center ${className}`}>
      <Image src="/logo-mark.png" alt="" aria-hidden="true" width={width} height={Math.round(width / MARK_RATIO)} />
    </div>
  );
}

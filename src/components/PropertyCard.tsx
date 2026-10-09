import Link from "next/link";
import { FavoriteStar } from "@/components/FavoriteStar";
import { PropertyPhoto } from "./PropertyPhoto";

/** Sans photo, une case colorée (stable pour un même logement) tient la place de l'image. */
const PLACEHOLDER_COLORS = [
  ["#c1622e", "#7a3a18"],
  ["#2c6363", "#1e4a4a"],
  ["#d9a05b", "#9a6a2c"],
  ["#6f8f72", "#3f5f46"],
  ["#b4543a", "#6e2f20"],
  ["#4f7c8a", "#2f4f5a"],
];

function colorsFor(id: string) {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return PLACEHOLDER_COLORS[hash % PLACEHOLDER_COLORS.length];
}

type PropertyCardProps = {
  propertyId: string;
  title: string;
  subtitle: string;
  priceLabel: string;
  photoUrl?: string;
  /** Classes de dimension et de disposition (ex. « h-56 w-44 shrink-0 »). */
  className?: string;
};

/** Carte d'un logement : photo (ou case colorée), titre, lieu, prix et étoile de favori. */
export function PropertyCard({ propertyId, title, subtitle, priceLabel, photoUrl, className = "" }: PropertyCardProps) {
  const [from, to] = colorsFor(propertyId);

  return (
    <div
      className={`relative overflow-hidden rounded-3xl shadow-md ${className}`}
      style={{ background: `linear-gradient(160deg, ${from}, ${to})` }}
    >
      <Link href={`/logements/${propertyId}`} className="absolute inset-0 block">
        {photoUrl && (
  <PropertyPhoto url={photoUrl} width={600} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
)}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 pb-4 pt-12 text-white">
          <h3 className="line-clamp-2 font-display text-sm font-semibold leading-snug">{title}</h3>
          <p className="mt-0.5 text-xs text-white/85">{subtitle}</p>
          <p className="mt-1 text-sm font-semibold">{priceLabel}</p>
        </div>
      </Link>
      <FavoriteStar propertyId={propertyId} />
    </div>
  );
}

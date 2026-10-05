import { PropertyCard } from "@/components/PropertyCard";
import type { RoomSearchResult } from "@/lib/api";
import { dedupeByProperty, formatNightPrice } from "@/lib/rooms";

function SkeletonCard() {
  return <div className="h-56 w-44 shrink-0 animate-pulse rounded-3xl bg-[var(--color-cream-soft)]" />;
}

type ListingCarouselProps = {
  title: string;
  rooms: RoomSearchResult[];
  loading: boolean;
  failed: boolean;
  emptyLabel: string;
};

export function ListingCarousel({ title, rooms, loading, failed, emptyLabel }: ListingCarouselProps) {
  const cards = dedupeByProperty(rooms);

  return (
    <section className="mt-8">
      <h2 className="px-5 text-xl font-bold text-[var(--color-teal)]">{title}</h2>

      {failed ? (
        <p className="px-5 pt-4 text-sm text-red-500">Impossible de charger les logements. Réessayez.</p>
      ) : !loading && cards.length === 0 ? (
        <p className="px-5 pt-4 text-sm text-slate-500">{emptyLabel}</p>
      ) : (
        <div className="no-scrollbar mt-4 flex snap-x gap-3 overflow-x-auto px-5 pb-2">
          {loading
            ? Array.from({ length: 3 }, (_, i) => <SkeletonCard key={i} />)
            : cards.map((room) => (
                <PropertyCard
                  key={room.propertyId}
                  propertyId={room.propertyId}
                  title={room.property.title}
                  subtitle={`${room.property.city} · ${room.property.quarter}`}
                  priceLabel={formatNightPrice(room.basePrice)}
                  photoUrl={room.property.photos?.[0]?.url}
                  className="h-56 w-44 shrink-0 snap-start"
                />
              ))}
        </div>
      )}
    </section>
  );
}

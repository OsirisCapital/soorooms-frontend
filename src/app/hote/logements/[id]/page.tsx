"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useRef, useState, type ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { PropertyForm } from "@/components/host/PropertyForm";
import { RoomForm } from "@/components/host/RoomForm";
import { Button } from "@/components/ui/Button";
import {
  addPropertyPhoto,
  ApiError,
  createRoom,
  deleteRoom,
  getMyProperty,
  publishProperty,
  removePropertyPhoto,
  updateAmenities,
  updateProperty,
  updateRoom,
  type HostProperty,
} from "@/lib/api";
import { PROPERTY_STATUS_LABEL, PROPERTY_TYPE_LABEL } from "@/lib/booking-labels";
import { useAsyncData } from "@/lib/use-async-data";
import { ACCEPT_ATTRIBUTE, uploadErrorMessage, uploadFile } from "@/lib/upload";

export default function ManagePropertyPage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error } = useAsyncData(`my-property-${id}`, () => getMyProperty(id));
  const [fresh, setFresh] = useState<HostProperty | null>(null);
  const property = fresh ?? data;

  // Après chaque modification, on relit la fiche complète : c'est la source de vérité.
  const reload = async () => setFresh(await getMyProperty(id));

  return (
    <AppShell backHref="/hote/logements">
      {loading ? (
        <div className="flex flex-col gap-4">
          <div className="h-8 w-2/3 animate-pulse rounded-xl bg-[var(--color-cream-soft)]" />
          <div className="h-32 animate-pulse rounded-2xl bg-[var(--color-cream-soft)]" />
          <div className="h-40 animate-pulse rounded-2xl bg-[var(--color-cream-soft)]" />
        </div>
      ) : error || !property ? (
        <p className="rounded-2xl bg-white p-6 text-center text-slate-600 shadow-sm">{error ?? "Logement introuvable."}</p>
      ) : (
        <>
          <h1 className="font-display text-2xl font-bold text-[var(--color-teal)]">{property.title}</h1>
          <p className="mt-1 text-slate-600">
            {property.city} · {property.quarter} · {PROPERTY_TYPE_LABEL[property.propertyType]}
          </p>

          <PublishCard property={property} reload={reload} />
          <RoomsCard property={property} reload={reload} />
          <AmenitiesCard property={property} reload={reload} />
          <PhotosCard property={property} reload={reload} />
          <InfoCard property={property} reload={reload} />
        </>
      )}
    </AppShell>
  );
}

type CardProps = { property: HostProperty; reload: () => Promise<void> };

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-5 rounded-3xl bg-white p-5 shadow-sm">
      <h2 className="font-display text-lg font-semibold text-[var(--color-teal)]">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

const messageOf = (err: unknown) => (err instanceof ApiError ? err.message : "Une erreur est survenue. Réessayez.");

// --- Publication ------------------------------------------------------------

function PublishCard({ property, reload }: CardProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const noRoom = property.rooms.length === 0;

  async function publish() {
    setError(null);
    setBusy(true);
    try {
      await publishProperty(property.id);
      await reload();
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title={`Statut : ${PROPERTY_STATUS_LABEL[property.status]}`}>
      {property.status === "ACTIVE" ? (
        <p className="text-sm text-slate-600">
          Ce logement est visible des voyageurs.{" "}
          <Link href={`/logements/${property.id}`} className="font-semibold text-[var(--color-terracotta)]">
            Voir la page publique
          </Link>
        </p>
      ) : property.status === "SUSPENDED" ? (
        <p className="text-sm text-slate-600">Ce logement est suspendu et n&apos;est pas visible des voyageurs.</p>
      ) : (
        <>
          <p className="text-sm text-slate-600">
            Ce logement n&apos;est pas encore visible. La publication nécessite au moins une chambre et une vérification
            d&apos;identité (KYC) approuvée.
          </p>
          {noRoom && <p className="mt-2 text-sm text-slate-500">Ajoutez d&apos;abord une chambre ci-dessous.</p>}
          {error && (
            <p className="mt-3 text-sm text-red-500">
              {error}{" "}
              <Link href="/profil/parametres" className="font-semibold underline">
                Voir l&apos;état de ma vérification
              </Link>
            </p>
          )}
          <div className="mt-4">
            <Button onClick={publish} loading={busy} disabled={noRoom}>
              Publier le logement
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}

// --- Chambres ---------------------------------------------------------------

function RoomsCard({ property, reload }: CardProps) {
  const [mode, setMode] = useState<"idle" | "adding" | string>("idle"); // "string" = id de la chambre en cours de modification
  const [error, setError] = useState<string | null>(null);

  async function remove(roomId: string, name: string) {
    if (!window.confirm(`Supprimer « ${name} » ?`)) return;
    setError(null);
    try {
      await deleteRoom(property.id, roomId);
      await reload();
    } catch (err) {
      setError(messageOf(err));
    }
  }

  return (
    <Card title="Chambres et prix">
      {property.rooms.length === 0 && mode !== "adding" && (
        <p className="text-sm text-slate-600">
          Aucune chambre pour l&apos;instant. Pour une maison ou un appartement entier, créez une seule chambre qui le représente.
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {property.rooms.map((room) =>
          mode === room.id ? (
            <li key={room.id} className="rounded-2xl border border-[var(--color-border)] p-4">
              <RoomForm
                initial={room}
                submitLabel="Enregistrer"
                onCancel={() => setMode("idle")}
                onSubmit={async (payload) => {
                  await updateRoom(property.id, room.id, payload);
                  await reload();
                  setMode("idle");
                }}
              />
            </li>
          ) : (
            <li key={room.id} className="flex items-start justify-between gap-3 rounded-2xl border border-[var(--color-border)] p-4">
              <div className="min-w-0">
                <p className="font-medium text-[var(--color-ink)]">{room.name}</p>
                <p className="text-xs text-slate-500">
                  {room.roomType} · {room.maxGuests} voyageur{room.maxGuests > 1 ? "s" : ""} · {room.bedroomCount} chambre
                  {room.bedroomCount > 1 ? "s" : ""} · {room.bedCount} lit{room.bedCount > 1 ? "s" : ""}
                </p>
                <p className="mt-1 text-sm font-semibold text-[var(--color-teal)]">
                  {Number(room.basePrice).toLocaleString("fr-FR")} FCFA/nuit
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1 text-sm">
                <button type="button" onClick={() => setMode(room.id)} className="font-semibold text-[var(--color-teal-600)]">
                  Modifier
                </button>
                <button type="button" onClick={() => remove(room.id, room.name)} className="text-red-500">
                  Supprimer
                </button>
              </div>
            </li>
          ),
        )}
      </ul>

      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

      {mode === "adding" ? (
        <div className="mt-4 rounded-2xl border border-[var(--color-border)] p-4">
          <RoomForm
            submitLabel="Ajouter la chambre"
            onCancel={() => setMode("idle")}
            onSubmit={async (payload) => {
              await createRoom(property.id, payload);
              await reload();
              setMode("idle");
            }}
          />
        </div>
      ) : (
        <div className="mt-4">
          <Button variant="outline" onClick={() => setMode("adding")}>
            Ajouter une chambre
          </Button>
        </div>
      )}
    </Card>
  );
}

// --- Équipements ------------------------------------------------------------

const AMENITY_FIELDS = [
  { key: "hasWifi", label: "Wi-Fi" },
  { key: "hasGeneratorOrSolar", label: "Groupe électrogène / solaire" },
  { key: "hasAc", label: "Climatisation" },
  { key: "hasParking", label: "Parking" },
] as const;

function AmenitiesCard({ property, reload }: CardProps) {
  const initial = property.amenities;
  const [flags, setFlags] = useState({
    hasWifi: initial?.hasWifi ?? false,
    hasGeneratorOrSolar: initial?.hasGeneratorOrSolar ?? false,
    hasAc: initial?.hasAc ?? false,
    hasParking: initial?.hasParking ?? false,
  });
  const [extras, setExtras] = useState((initial?.additionalEquipments ?? []).join(", "));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  async function save() {
    setMessage(null);
    setBusy(true);
    try {
      await updateAmenities(property.id, {
        ...flags,
        additionalEquipments: extras
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      });
      await reload();
      setMessage({ text: "Équipements enregistrés.", ok: true });
    } catch (err) {
      setMessage({ text: messageOf(err), ok: false });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title="Équipements">
      <div className="flex flex-col gap-2">
        {AMENITY_FIELDS.map((field) => (
          <label key={field.key} className="flex items-center gap-3 text-[var(--color-ink)]">
            <input
              type="checkbox"
              checked={flags[field.key]}
              onChange={(e) => setFlags((prev) => ({ ...prev, [field.key]: e.target.checked }))}
              className="h-5 w-5"
            />
            {field.label}
          </label>
        ))}
      </div>
      <label className="mt-4 flex flex-col gap-1 text-xs font-medium text-slate-500">
        Autres équipements (séparés par des virgules)
        <input
          value={extras}
          onChange={(e) => setExtras(e.target.value)}
          placeholder="Piscine, Jardin, Cuisine équipée"
          className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-ink)]"
        />
      </label>
      {message && <p className={`mt-3 text-sm ${message.ok ? "text-[var(--color-teal-600)]" : "text-red-500"}`}>{message.text}</p>}
      <div className="mt-4">
        <Button variant="outline" onClick={save} loading={busy}>
          Enregistrer les équipements
        </Button>
      </div>
    </Card>
  );
}

// --- Photos ------------------------------------------------------------------

function PhotosCard({ property, reload }: CardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const photos = property.photos ?? [];

  // Envoie les fichiers un par un (Cloudinary), puis rattache chacun au logement.
  async function handleFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const files: File[] = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    setError(null);
    setBusy(true);
    let failed: string | null = null;
    for (const [index, file] of files.entries()) {
      setProgress(`Envoi ${index + 1}/${files.length}…`);
      try {
        await addPropertyPhoto(property.id, await uploadFile(file, "property_photo"));
      } catch (err) {
        failed = `${file.name} : ${uploadErrorMessage(err)}`;
        break;
      }
    }
    await reload();
    setProgress(null);
    setBusy(false);
    if (failed) setError(failed);
  }

  async function addByLink(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await addPropertyPhoto(property.id, url.trim());
      setUrl("");
      await reload();
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove(photoId: string) {
    setError(null);
    try {
      await removePropertyPhoto(property.id, photoId);
      await reload();
    } catch (err) {
      setError(messageOf(err));
    }
  }

  return (
    <Card title="Photos">
      <p className="text-sm text-slate-600">La première photo sert de vignette. Formats JPG, PNG ou WebP, 8 Mo maximum chacune.</p>

      {photos.length > 0 && (
        <ul className="mt-4 grid grid-cols-3 gap-2">
          {photos.map((photo) => (
            <li key={photo.id} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element -- photos hébergées sur Cloudinary */}
              <img src={photo.url} alt="" className="h-24 w-full rounded-xl object-cover" />
              <button
                type="button"
                onClick={() => remove(photo.id)}
                aria-label="Supprimer la photo"
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs text-white"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <input ref={inputRef} type="file" accept={ACCEPT_ATTRIBUTE.property_photo} multiple onChange={handleFiles} className="hidden" />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="mt-4 w-full rounded-2xl border border-dashed border-[var(--color-teal-600)] px-4 py-3 text-sm font-semibold text-[var(--color-teal)] disabled:opacity-60"
      >
        {progress ?? "Ajouter des photos"}
      </button>

      <details className="mt-4">
        <summary className="cursor-pointer text-xs font-semibold text-slate-500">Ajouter une photo par lien</summary>
        <form onSubmit={addByLink} className="mt-3 flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
            aria-label="Lien de la photo"
            required
            className="min-w-0 flex-1 rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm"
          />
          <button
            type="submit"
            disabled={busy}
            className="shrink-0 rounded-2xl bg-[var(--color-teal-600)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            Ajouter
          </button>
        </form>
      </details>

      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
    </Card>
  );
}

// --- Informations générales -------------------------------------------------

function InfoCard({ property, reload }: CardProps) {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <Card title="Informations du logement">
      {open ? (
        <PropertyForm
          submitLabel="Enregistrer"
          initial={{
            title: property.title,
            description: property.description,
            propertyType: property.propertyType,
            city: property.city,
            quarter: property.quarter,
            latitude: property.latitude,
            longitude: property.longitude,
          }}
          onSubmit={async (payload) => {
            await updateProperty(property.id, payload);
            await reload();
            setSaved(true);
            setOpen(false);
          }}
        />
      ) : (
        <>
          <p className="whitespace-pre-line text-sm text-slate-600">{property.description}</p>
          {saved && <p className="mt-3 text-sm text-[var(--color-teal-600)]">Informations enregistrées.</p>}
          <div className="mt-4">
            <Button variant="outline" onClick={() => setOpen(true)}>
              Modifier les informations
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}

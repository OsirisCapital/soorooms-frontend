"use client";

import { useParams } from "next/navigation";
import { useRef, useState } from "react";
import { AdminFrame } from "@/components/admin/AdminFrame";
import { VisitResultView } from "@/components/VisitResultView";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/api";
import { useAsyncData } from "@/lib/use-async-data";
import { ACCEPT_ATTRIBUTE, uploadFile } from "@/lib/upload";
import { getMyVisit, submitVisitReport, type VisitDetail } from "@/lib/visits-api";

const MIN_PHOTOS = 3;
const MAX_PHOTOS = 20;

function ReportForm({ visit, onDone }: { visit: VisitDetail; onDone: () => void }) {
  const items = visit.checklist ?? [];
  const [checks, setChecks] = useState<Record<string, boolean>>(() => Object.fromEntries(items.map((i) => [i.key, false])));
  const [photos, setPhotos] = useState<string[]>([]);
  const [report, setReport] = useState("");
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const allOk = items.every((i) => checks[i.key]);

  async function addPhotos(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      const urls: string[] = [];
      for (const file of files.slice(0, MAX_PHOTOS - photos.length)) urls.push(await uploadFile(file, "property_photo"));
      setPhotos((current) => [...current, ...urls]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Envoi des photos impossible.");
    } finally {
      setUploading(false);
    }
  }

  async function submit(conforming: boolean) {
    setError(null);
    if (photos.length < MIN_PHOTOS) return setError(`Ajoutez au moins ${MIN_PHOTOS} photos prises sur place.`);
    if (conforming && !allOk) return setError("Pour déclarer le logement conforme, validez tous les points.");
    if (!conforming && report.trim().length < 10) return setError("Expliquez à l'hôte ce qui n'est pas conforme.");
    const message = conforming
      ? "Confirmer : logement CONFORME ? Le badge « Vérifié par SòôRooms » sera accordé tout de suite."
      : "Confirmer : logement NON conforme ? L'hôte verra votre rapport.";
    if (!window.confirm(message)) return;
    setBusy(true);
    try {
      await submitVisitReport(visit.id, { conforming, checklist: checks, photoUrls: photos, report });
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Envoi du rapport impossible. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-base font-bold text-[var(--color-ink)]">Grille de contrôle</h2>
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <li key={item.key}>
              <label className="flex items-start gap-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={checks[item.key] ?? false}
                  onChange={(e) => setChecks((c) => ({ ...c, [item.key]: e.target.checked }))}
                  className="mt-0.5 h-5 w-5 accent-[var(--color-teal)]"
                />
                {item.label}
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-1 text-base font-bold text-[var(--color-ink)]">Photos prises sur place</h2>
        <p className="mb-3 text-xs text-slate-500">Au moins {MIN_PHOTOS} : façade, chambre, salle d&apos;eau.</p>
        {photos.length > 0 && (
          <div className="mb-3 grid grid-cols-3 gap-2">
            {photos.map((url) => (
              <div key={url} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="Photo de la visite" className="aspect-square w-full rounded-xl object-cover" />
                <button
                  type="button"
                  onClick={() => setPhotos((current) => current.filter((u) => u !== url))}
                  aria-label="Retirer cette photo"
                  className="absolute right-1 top-1 rounded-full bg-black/60 px-2 text-sm text-white"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <input ref={inputRef} type="file" accept={ACCEPT_ATTRIBUTE.property_photo} capture="environment" multiple onChange={addPhotos} className="hidden" />
        <Button variant="outline" loading={uploading} disabled={photos.length >= MAX_PHOTOS} onClick={() => inputRef.current?.click()}>
          Ajouter des photos ({photos.length})
        </Button>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <label htmlFor="report" className="mb-1.5 block text-base font-bold text-[var(--color-ink)]">Commentaire</label>
        <textarea
          id="report"
          value={report}
          onChange={(e) => setReport(e.target.value)}
          maxLength={2000}
          rows={4}
          placeholder="Ce que vous avez constaté. Obligatoire si le logement n'est pas conforme."
          className="w-full rounded-xl border border-[var(--color-border)] p-3 text-sm"
        />
      </section>

      {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
      <div className="flex flex-col gap-2">
        <Button loading={busy} disabled={!allOk} onClick={() => submit(true)}>Logement conforme : accorder le badge</Button>
        <Button variant="outline" loading={busy} onClick={() => submit(false)}>Non conforme : signaler les points</Button>
      </div>
    </div>
  );
}

function Content({ id }: { id: string }) {
  const { data, loading, error } = useAsyncData(`my-visit-${id}`, () => getMyVisit(id));
  const [done, setDone] = useState(false);
  const [fresh, setFresh] = useState<VisitDetail | null>(null);
  const visit = fresh ?? data;

  if (loading) return <div className="h-48 animate-pulse rounded-2xl bg-[var(--color-cream-soft)]" />;
  if (error || !visit) return <p className="text-sm text-red-500">{error ?? "Visite introuvable."}</p>;

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h1 className="text-lg font-bold text-[var(--color-ink)]">{visit.property?.title}</h1>
        <p className="text-sm text-slate-600">
          {visit.property?.city} · {visit.property?.quarter}
          {visit.site?.region ? ` · ${visit.site.region}` : ""}
        </p>
        {visit.site && (
          <a
            href={`https://www.google.com/maps?q=${visit.site.latitude},${visit.site.longitude}`}
            target="_blank"
            rel="noreferrer"
            className="mt-2 block text-sm font-semibold text-[var(--color-teal)]"
          >
            Ouvrir l&apos;emplacement sur la carte
          </a>
        )}
        {visit.manager && (
          <p className="mt-2 text-sm text-slate-700">
            Gérant : {visit.manager.fullName} ·{" "}
            <a href={`tel:${visit.manager.phone}`} className="font-semibold text-[var(--color-terracotta)]">{visit.manager.phone}</a>
          </p>
        )}
      </section>

      {done || visit.status === "COMPLETED" || visit.status === "REJECTED" ? (
        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-base font-bold text-[var(--color-ink)]">Rapport envoyé</h2>
          {visit.result ? (
            <VisitResultView result={visit.result} checklist={visit.checklist ?? []} />
          ) : (
            <p className="text-sm text-[var(--color-teal)]">Merci, le rapport est enregistré et l&apos;hôte est prévenu.</p>
          )}
        </section>
      ) : visit.status === "ASSIGNED" ? (
        <ReportForm
          visit={visit}
          onDone={() => {
            setDone(true);
            void getMyVisit(id).then(setFresh);
          }}
        />
      ) : (
        <p className="rounded-2xl bg-white p-4 text-sm text-slate-600 shadow-sm">Cette visite n&apos;est pas ouverte au rapport.</p>
      )}
    </div>
  );
}

export default function VisitReportPage() {
  const { id } = useParams<{ id: string }>();
  return <AdminFrame permission="visits.perform">{() => <Content id={id} />}</AdminFrame>;
}

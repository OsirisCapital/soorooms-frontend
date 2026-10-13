"use client";

import { useParams } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { ApiError, getMyProperty } from "@/lib/api";
import { createRoomBlock, deleteRoomBlock, getRoomCalendar, listRoomBlocks, type RoomBlockView, type RoomCalendar } from "@/lib/blocks-api";
import { formatDay } from "@/lib/booking-labels";
import { useAsyncData } from "@/lib/use-async-data";

const messageOf = (err: unknown) => (err instanceof ApiError ? err.message : "Une erreur est survenue. Réessayez.");
const FIELD = "w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm focus:border-[var(--color-teal)] focus:outline-none";
const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];
const DAYS_SHOWN = 35;

/** Date du jour au format AAAA-MM-JJ, à l'heure du Cameroun (UTC+1). */
const todayIso = () => new Date(Date.now() + 3_600_000).toISOString().slice(0, 10);
/** Lundi de la semaine de la date donnée : le calendrier commence toujours un lundi. */
function mondayOf(iso: string) {
  const d = new Date(`${iso}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}
const shiftDays = (iso: string, n: number) => new Date(new Date(`${iso}T00:00:00.000Z`).getTime() + n * 86_400_000).toISOString().slice(0, 10);

function cellStyle(day: RoomCalendar["days"][number], unitCount: number, past: boolean) {
  if (past) return "bg-slate-100 text-slate-400";
  if (day.free === 0 && day.blocked >= unitCount) return "bg-slate-300 text-slate-700"; // fermé
  if (day.free === 0) return "bg-[var(--color-terracotta)] text-white"; // complet
  if (day.booked > 0 || day.blocked > 0) return "bg-[var(--color-teal-100)] text-[var(--color-teal)]"; // partiel
  return "bg-white text-[var(--color-ink)] border border-[var(--color-border)]";
}

export default function HostCalendarPage() {
  const { id } = useParams<{ id: string }>();
  const { data: property, loading, error } = useAsyncData(`host-property-${id}`, () => getMyProperty(id));
  const [roomId, setRoomId] = useState<string | null>(null);
  const [start, setStart] = useState(() => mondayOf(todayIso()));
  const rooms = property?.rooms ?? [];
  const room = rooms.find((r) => r.id === (roomId ?? rooms[0]?.id)) ?? null;

  return (
    <AppShell backHref={`/hote/logements/${id}`}>
      <h1 className="mb-1 text-xl font-bold text-[var(--color-ink)]">Calendrier</h1>
      <p className="mb-4 text-sm text-slate-600">Fermez les dates où le logement n&apos;est pas disponible : plus personne ne pourra les réserver.</p>

      {loading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-[var(--color-cream-soft)]" />
      ) : error || !property ? (
        <p className="rounded-2xl bg-white p-6 text-center text-slate-600 shadow-sm">{error ?? "Logement introuvable."}</p>
      ) : rooms.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-center text-slate-600 shadow-sm">Ajoutez d&apos;abord une chambre à ce logement.</p>
      ) : (
        <>
          {rooms.length > 1 && (
            <select aria-label="Chambre" className={`${FIELD} mb-4`} value={room?.id ?? ""} onChange={(e) => setRoomId(e.target.value)}>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                  {r.unitCount > 1 ? ` (${r.unitCount} unités)` : ""}
                </option>
              ))}
            </select>
          )}
          {room && <RoomCalendar key={room.id} propertyId={id} roomId={room.id} unitCount={room.unitCount} start={start} setStart={setStart} />}
        </>
      )}
    </AppShell>
  );
}

function RoomCalendar({ propertyId, roomId, unitCount, start, setStart }: { propertyId: string; roomId: string; unitCount: number; start: string; setStart: (s: string) => void }) {
  const [version, setVersion] = useState(0);
  const calendar = useAsyncData(`calendar-${roomId}-${start}-${version}`, () => getRoomCalendar(propertyId, roomId, start, DAYS_SHOWN));
  const blocks = useAsyncData(`blocks-${roomId}-${version}`, () => listRoomBlocks(propertyId, roomId));
  const refresh = () => setVersion((v) => v + 1);
  const today = todayIso();
  const days = calendar.data?.days ?? [];

  return (
    <>
      <section className="rounded-3xl bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <button type="button" onClick={() => setStart(shiftDays(start, -7))} className="rounded-full border border-[var(--color-border)] px-3 py-1.5 text-sm" aria-label="Semaines précédentes">
            ‹
          </button>
          <p className="text-sm font-semibold text-[var(--color-ink)]">
            {days.length > 0 ? `${formatDay(days[0].date)} → ${formatDay(days[days.length - 1].date)}` : "…"}
          </p>
          <button type="button" onClick={() => setStart(shiftDays(start, 7))} className="rounded-full border border-[var(--color-border)] px-3 py-1.5 text-sm" aria-label="Semaines suivantes">
            ›
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-500">
          {WEEKDAYS.map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>
        {calendar.loading && days.length === 0 ? (
          <div className="mt-1 h-40 animate-pulse rounded-2xl bg-[var(--color-cream-soft)]" />
        ) : calendar.error ? (
          <p className="mt-2 text-sm text-red-500">{calendar.error}</p>
        ) : (
          <div className="mt-1 grid grid-cols-7 gap-1">
            {days.map((d) => (
              <div key={d.date} title={`${formatDay(d.date)} — ${d.booked} réservée(s), ${d.blocked} fermée(s), ${d.free} libre(s)`} className={`flex h-12 flex-col items-center justify-center rounded-xl text-sm ${cellStyle(d, unitCount, d.date < today)}`}>
                <span className="font-semibold">{Number(d.date.slice(8))}</span>
                {unitCount > 1 && d.date >= today && <span className="text-[10px] leading-none opacity-80">{d.free}/{unitCount}</span>}
              </div>
            ))}
          </div>
        )}
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          <li><span className="mr-1 inline-block h-2.5 w-2.5 rounded bg-white ring-1 ring-[var(--color-border)]" />Libre</li>
          <li><span className="mr-1 inline-block h-2.5 w-2.5 rounded bg-[var(--color-teal-100)]" />En partie occupé</li>
          <li><span className="mr-1 inline-block h-2.5 w-2.5 rounded bg-[var(--color-terracotta)]" />Complet</li>
          <li><span className="mr-1 inline-block h-2.5 w-2.5 rounded bg-slate-300" />Fermé</li>
        </ul>
      </section>

      <BlockForm propertyId={propertyId} roomId={roomId} unitCount={unitCount} onDone={refresh} />
      <BlockList propertyId={propertyId} roomId={roomId} blocks={blocks.data ?? []} loading={blocks.loading} onDone={refresh} />
    </>
  );
}

function BlockForm({ propertyId, roomId, unitCount, onDone }: { propertyId: string; roomId: string; unitCount: number; onDone: () => void }) {
  const today = useMemo(() => todayIso(), []);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [units, setUnits] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!from) return setError("Choisissez le premier jour fermé.");
    const last = to || from;
    if (last < from) return setError("Le dernier jour ne peut pas précéder le premier.");
    const count = units.trim() === "" ? undefined : Number(units);
    if (count !== undefined && (!Number.isInteger(count) || count < 1 || count > unitCount)) return setError(`Indiquez un nombre d'unités entre 1 et ${unitCount}.`);
    setBusy(true);
    setError(null);
    try {
      await createRoomBlock(propertyId, roomId, { startDate: from, endDate: last, units: count, reason: reason.trim() || undefined });
      setFrom("");
      setTo("");
      setUnits("");
      setReason("");
      onDone();
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-5 flex flex-col gap-3 rounded-3xl bg-white p-5 shadow-sm">
      <h2 className="font-display text-lg font-semibold text-[var(--color-teal)]">Fermer des dates</h2>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm text-slate-600">
          Du
          <input type="date" min={today} value={from} onChange={(e) => setFrom(e.target.value)} className={`${FIELD} mt-1`} />
        </label>
        <label className="text-sm text-slate-600">
          Au (inclus)
          <input type="date" min={from || today} value={to} onChange={(e) => setTo(e.target.value)} className={`${FIELD} mt-1`} />
        </label>
      </div>
      {unitCount > 1 && (
        <label className="text-sm text-slate-600">
          Nombre d&apos;unités à fermer (vide = les {unitCount})
          <input type="number" inputMode="numeric" min={1} max={unitCount} value={units} onChange={(e) => setUnits(e.target.value)} className={`${FIELD} mt-1`} />
        </label>
      )}
      <label className="text-sm text-slate-600">
        Motif (facultatif, visible de vous seul)
        <input type="text" maxLength={120} placeholder="Travaux, séjour hors plateforme…" value={reason} onChange={(e) => setReason(e.target.value)} className={`${FIELD} mt-1`} />
      </label>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button type="submit" loading={busy}>Fermer ces dates</Button>
      <p className="text-xs text-slate-500">Si des réservations existent déjà sur ces dates, la fermeture est refusée : annulez-les d&apos;abord.</p>
    </form>
  );
}

function BlockList({ propertyId, roomId, blocks, loading, onDone }: { propertyId: string; roomId: string; blocks: RoomBlockView[]; loading: boolean; onDone: () => void }) {
  const [error, setError] = useState<string | null>(null);

  async function remove(block: RoomBlockView) {
    if (!window.confirm("Rouvrir ces dates à la réservation ?")) return;
    setError(null);
    try {
      await deleteRoomBlock(propertyId, roomId, block.id);
      onDone();
    } catch (err) {
      setError(messageOf(err));
    }
  }

  return (
    <section className="mt-5 rounded-3xl bg-white p-5 shadow-sm">
      <h2 className="font-display text-lg font-semibold text-[var(--color-teal)]">Dates fermées</h2>
      {loading && blocks.length === 0 ? (
        <div className="mt-3 h-12 animate-pulse rounded-2xl bg-[var(--color-cream-soft)]" />
      ) : blocks.length === 0 ? (
        <p className="mt-3 text-sm text-slate-600">Aucune date fermée.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {blocks.map((b) => (
            <li key={b.id} className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--color-cream-soft)] p-3">
              <div className="min-w-0">
                <p className="font-medium text-[var(--color-ink)]">{b.startDate === b.endDate ? formatDay(b.startDate) : `${formatDay(b.startDate)} → ${formatDay(b.endDate)}`}</p>
                <p className="truncate text-xs text-slate-600">
                  {b.units ? `${b.units} unité${b.units > 1 ? "s" : ""}` : "Tout le type de chambre"}
                  {b.reason ? ` · ${b.reason}` : ""}
                </p>
              </div>
              <button type="button" onClick={() => remove(b)} className="shrink-0 text-sm text-red-500">
                Rouvrir
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
    </section>
  );
}

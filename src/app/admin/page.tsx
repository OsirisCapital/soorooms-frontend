"use client";

import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import {
  ApiError,
  approveKyc,
  listDisputes,
  listPendingKyc,
  rejectKyc,
  type AdminDispute,
  type PendingKyc,
} from "@/lib/api";
import { formatDay, formatFcfa } from "@/lib/booking-labels";
import { useAsyncData } from "@/lib/use-async-data";
import { useMe } from "@/lib/use-me";

export default function AdminPage() {
  const me = useMe();

  return (
    <AppShell title="Administration" backHref="/profil">
      {me == null ? (
        <div className="h-24 animate-pulse rounded-2xl bg-[var(--color-cream-soft)]" />
      ) : me.role !== "ADMIN" ? (
        <p className="rounded-2xl bg-white p-6 text-center text-slate-600 shadow-sm">Cette page est réservée aux administrateurs.</p>
      ) : (
        <>
          <KycSection />
          <DisputesSection />
        </>
      )}
    </AppShell>
  );
}

/** Seuls les liens http(s) sont rendus cliquables : ces URL sont saisies par les utilisateurs. */
function safeHttpUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

const messageOf = (err: unknown) => (err instanceof ApiError ? err.message : "Une erreur est survenue. Réessayez.");

function DocLink({ label, url }: { label: string; url: string | null }) {
  const href = safeHttpUrl(url);
  if (!url) return null;
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className="block text-sm font-semibold text-[var(--color-terracotta)] underline">
      {label}
    </a>
  ) : (
    <p className="text-sm text-slate-500">{label} : lien non valide</p>
  );
}

// --- KYC en attente ---------------------------------------------------------

function KycSection() {
  const { data, loading, error } = useAsyncData("admin-kyc", listPendingKyc);
  const [done, setDone] = useState<string[]>([]);
  const items = (data ?? []).filter((item) => !done.includes(item.id));

  return (
    <section>
      <h2 className="text-xl font-bold text-[var(--color-teal)]">Vérifications d&apos;identité{data ? ` (${items.length})` : ""}</h2>
      {loading ? (
        <div className="mt-3 h-32 animate-pulse rounded-2xl bg-[var(--color-cream-soft)]" />
      ) : error ? (
        <p className="mt-3 text-sm text-red-500">{error}</p>
      ) : items.length === 0 ? (
        <p className="mt-3 rounded-2xl bg-white p-5 text-center text-sm text-slate-600 shadow-sm">Aucune demande en attente.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {items.map((item) => (
            <KycCard key={item.id} item={item} onDecided={() => setDone((prev) => [...prev, item.id])} />
          ))}
        </ul>
      )}
    </section>
  );
}

function KycCard({ item, onDecided }: { item: PendingKyc; onDecided: () => void }) {
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function decide(action: () => Promise<unknown>) {
    setError(null);
    setBusy(true);
    try {
      await action();
      onDecided();
    } catch (err) {
      setError(messageOf(err));
      setBusy(false);
    }
  }

  return (
    <li className="rounded-2xl bg-white p-4 shadow-sm">
      <p className="font-display font-semibold text-[var(--color-teal)]">{item.fullName}</p>
      <p className="text-sm text-slate-600">
        {item.phone}
        {item.email ? ` · ${item.email}` : ""}
      </p>
      {item.document ? (
        <>
          <p className="mt-1 text-xs text-slate-500">Envoyé le {formatDay(item.document.submittedAt)}</p>
          <div className="mt-3 flex flex-col gap-1">
            <DocLink label="Pièce d'identité" url={item.document.idCardUrl} />
            <DocLink label="Justificatif de domicile" url={item.document.proofOfAddressUrl} />
          </div>
        </>
      ) : (
        <p className="mt-2 text-sm text-slate-500">Aucun document trouvé.</p>
      )}

      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

      {rejecting ? (
        <div className="mt-4 flex flex-col gap-3">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Motif du refus, visible par l'utilisateur (5 caractères minimum)"
            className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm focus:border-[var(--color-teal)] focus:outline-none"
          />
          <Button variant="outline" disabled={busy || note.trim().length < 5} onClick={() => decide(() => rejectKyc(item.id, note.trim()))}>
            Confirmer le refus
          </Button>
          <button type="button" onClick={() => setRejecting(false)} disabled={busy} className="text-sm text-slate-500">
            Annuler
          </button>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          <Button
            loading={busy}
            onClick={() => {
              if (window.confirm(`Approuver la vérification de ${item.fullName} ?`)) decide(() => approveKyc(item.id));
            }}
          >
            Approuver
          </Button>
          <Button variant="outline" onClick={() => setRejecting(true)} disabled={busy}>
            Refuser
          </Button>
        </div>
      )}
    </li>
  );
}

// --- Litiges (lecture seule) --------------------------------------------------

function DisputesSection() {
  const { data, loading, error } = useAsyncData("admin-disputes", listDisputes);

  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold text-[var(--color-teal)]">Litiges ouverts{data ? ` (${data.length})` : ""}</h2>
      <p className="mt-1 text-sm text-slate-500">
        Les fonds restent bloqués en séquestre. La résolution (remboursement ou reversement) arrivera avec l&apos;intégration du
        paiement.
      </p>
      {loading ? (
        <div className="mt-3 h-32 animate-pulse rounded-2xl bg-[var(--color-cream-soft)]" />
      ) : error ? (
        <p className="mt-3 text-sm text-red-500">{error}</p>
      ) : !data || data.length === 0 ? (
        <p className="mt-3 rounded-2xl bg-white p-5 text-center text-sm text-slate-600 shadow-sm">Aucun litige ouvert.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {data.map((dispute: AdminDispute) => (
            <li key={dispute.id} className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="font-display font-semibold text-[var(--color-teal)]">{dispute.room.property.title}</p>
              <p className="text-sm text-slate-600">
                {dispute.room.name} · {dispute.room.property.city}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {formatDay(dispute.checkInDate)} → {formatDay(dispute.checkOutDate)}
                {dispute.totalPrice != null ? ` · ${formatFcfa(dispute.totalPrice)}` : ""}
              </p>
              <p className="mt-2 text-sm text-[var(--color-ink)]">
                <strong>Voyageur :</strong> {dispute.traveler.fullName} ({dispute.traveler.phone})
              </p>
              <p className="mt-2 rounded-xl bg-[var(--color-cream)] px-3 py-2 text-sm text-[var(--color-ink)]">
                {dispute.disputeReason ?? "Aucun motif renseigné."}
              </p>
              {dispute.escrowVault && (
                <p className="mt-2 text-xs text-slate-500">
                  Séquestre : {formatFcfa(dispute.escrowVault.amountHeld)} ({dispute.escrowVault.status})
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

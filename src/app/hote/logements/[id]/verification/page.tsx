"use client";

import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { VisitResultView } from "@/components/VisitResultView";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/api";
import { formatDay, formatFcfa } from "@/lib/booking-labels";
import { useAsyncData } from "@/lib/use-async-data";
import {
  getVisitOverview,
  payVisit,
  requestVisit,
  verifyVisitPayment,
  VISIT_STATUS_LABEL,
  type Visit,
  type VisitOverview,
} from "@/lib/visits-api";

const storageKey = (visitId: string) => `sooroms.pendingVisit.${visitId}`;
const ATTEMPTS = 8;
const DELAY_MS = 5000;

const remember = (visitId: string, reference: string) => {
  try {
    localStorage.setItem(storageKey(visitId), reference);
  } catch {
    // le retour fournira la référence dans l'adresse
  }
};
const recall = (visitId: string) => {
  try {
    return localStorage.getItem(storageKey(visitId));
  } catch {
    return null;
  }
};
const forget = (visitId: string) => {
  try {
    localStorage.removeItem(storageKey(visitId));
  } catch {
    // sans importance
  }
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-base font-bold text-[var(--color-ink)]">{title}</h2>
      {children}
    </section>
  );
}

function Content({ propertyId, initial }: { propertyId: string; initial: VisitOverview }) {
  const [overview, setOverview] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  const current: Visit | null = overview.current;

  async function refresh() {
    setOverview(await getVisitOverview(propertyId));
  }

  async function check(visitId: string, reference: string, automatic: boolean) {
    setChecking(true);
    setError(null);
    try {
      for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
        const result = await verifyVisitPayment(visitId, reference);
        if (result.confirmed) {
          forget(visitId);
          setMessage("Paiement reçu. Nous allons confier la visite à un agent.");
          await refresh();
          return;
        }
        if (result.paymentStatus === "FAILED") {
          forget(visitId);
          setError("Le paiement a échoué. Vous pouvez réessayer.");
          return;
        }
        if (!automatic && attempt === 0) {
          setMessage("Paiement toujours en cours chez l'opérateur…");
        }
        await wait(DELAY_MS);
      }
      setMessage("Le paiement n'est pas encore confirmé. Revenez vérifier dans quelques minutes : vous ne serez pas débité deux fois.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Vérification impossible. Réessayez.");
    } finally {
      setChecking(false);
    }
  }

  // Retour de la page de paiement : l'adresse porte la référence ; on la vérifie une fois.
  useEffect(() => {
    if (started.current || !current || current.status !== "AWAITING_PAYMENT") return;
    const params = new URLSearchParams(window.location.search);
    const reference = params.get("reference") ?? params.get("trxref");
    if (!reference) return;
    started.current = true;
    window.history.replaceState(null, "", window.location.pathname);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- check() ne modifie l'état qu'après des appels réseau
    void check(current.id, reference, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, current?.status]);

  async function startPayment(visit: Visit) {
    setBusy(true);
    setError(null);
    try {
      const { paymentUrl, gatewayRef } = await payVisit(visit.id);
      remember(visit.id, gatewayRef);
      window.location.href = paymentUrl;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Paiement impossible. Réessayez.");
      setBusy(false);
    }
  }

  async function requestAndPay() {
    setBusy(true);
    setError(null);
    try {
      const visit = await requestVisit(propertyId);
      await startPayment(visit);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Demande impossible. Réessayez.");
      setBusy(false);
    }
  }

  const saved = current ? recall(current.id) : null;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold text-[var(--color-ink)]">Vérification du logement</h1>
        <p className="mt-1 text-sm text-slate-600">{overview.property.title}</p>
      </div>

      {overview.property.verified && (
        <p className="rounded-2xl bg-[var(--color-teal-100)] p-4 text-sm font-semibold text-[var(--color-teal)]">
          ✓ Ce logement porte le badge « Vérifié par SòôRooms »
          {overview.property.verifiedAt ? ` depuis le ${formatDay(overview.property.verifiedAt)}` : ""}. Il remonte en premier dans les recherches triées par confiance.
        </p>
      )}

      {message && <p role="status" className="rounded-2xl bg-white p-4 text-sm text-[var(--color-teal)] shadow-sm">{message}</p>}
      {error && <p role="alert" className="rounded-2xl bg-white p-4 text-sm text-red-500 shadow-sm">{error}</p>}

      {!overview.property.verified && !current && (
        <Card title="Faire vérifier ce logement">
          <p className="text-sm text-slate-600">
            Un agent SòôRooms visite votre logement, contrôle les points ci-dessous et prend des photos. S&apos;il est conforme, il reçoit le
            badge « Vérifié par SòôRooms » : les voyageurs, surtout ceux de la diaspora, lui font davantage confiance.
          </p>
          <ul className="mt-3 flex flex-col gap-1.5 text-sm text-slate-700">
            {overview.checklist.map((item) => (
              <li key={item.key} className="flex gap-2">
                <span aria-hidden className="text-[var(--color-teal)]">•</span>
                {item.label}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-2xl font-bold text-[var(--color-teal)]">{formatFcfa(overview.price)}</p>
          <p className="mt-1 text-xs text-slate-500">Frais de visite, payés une fois et non remboursables, que le logement soit conforme ou non. En cas de points à corriger, vous pourrez redemander une visite.</p>
          <div className="mt-4">
            <Button loading={busy} onClick={requestAndPay}>Demander la visite et payer</Button>
          </div>
        </Card>
      )}

      {current && (
        <Card title={VISIT_STATUS_LABEL[current.status]}>
          {current.status === "AWAITING_PAYMENT" ? (
            <>
              <p className="text-sm text-slate-600">
                Visite de vérification : <span className="font-semibold">{formatFcfa(current.amount ?? overview.price)}</span>. Paiement Mobile Money sécurisé.
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <Button loading={busy} onClick={() => startPayment(current)}>Payer {formatFcfa(current.amount ?? overview.price)}</Button>
                {saved && (
                  <Button variant="outline" loading={checking} onClick={() => check(current.id, saved, false)}>
                    J&apos;ai déjà payé : vérifier mon paiement
                  </Button>
                )}
              </div>
            </>
          ) : current.status === "PENDING_ASSIGNMENT" ? (
            <p className="text-sm text-slate-600">Paiement reçu{current.paidAt ? ` le ${formatDay(current.paidAt)}` : ""}. Nous choisissons l&apos;agent qui passera chez vous.</p>
          ) : (
            <p className="text-sm text-slate-600">
              {current.agentName ? `${current.agentName} passera` : "Un agent passera"} vérifier votre logement. Gardez votre téléphone à portée : il vous appellera avant de venir.
            </p>
          )}
        </Card>
      )}

      {overview.history.length > 0 && (
        <Card title="Visites précédentes">
          <ul className="flex flex-col gap-5">
            {overview.history.map((visit) => (
              <li key={visit.id}>
                <p className="mb-2 text-xs text-slate-500">
                  {visit.visitedAt ? `Visite du ${formatDay(visit.visitedAt)}` : formatDay(visit.createdAt)}
                  {visit.agentName ? ` · ${visit.agentName}` : ""}
                </p>
                {visit.result ? <VisitResultView result={visit.result} checklist={overview.checklist} /> : <p className="text-sm text-slate-600">{VISIT_STATUS_LABEL[visit.status]}</p>}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

export default function PropertyVerificationPage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error } = useAsyncData(`visit-overview-${id}`, () => getVisitOverview(id));
  return (
    <AppShell backHref={`/hote/logements/${id}`}>
      {loading ? (
        <div className="h-64 animate-pulse rounded-2xl bg-[var(--color-cream-soft)]" />
      ) : error || !data ? (
        <p className="rounded-2xl bg-white p-6 text-center text-slate-600 shadow-sm">{error ?? "Page indisponible."}</p>
      ) : (
        <Content propertyId={id} initial={data} />
      )}
    </AppShell>
  );
}

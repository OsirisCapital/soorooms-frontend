"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api";
import { formatDay, formatFcfa } from "@/lib/booking-labels";
import {
  adminCheckPartnerPayout,
  adminListPartnerPayouts,
  adminListPartners,
  adminMarkPartnerPayoutPaid,
  adminPartnerConfig,
  adminRejectPartnerPayout,
  adminSendPartnerPayout,
  adminSuspendPartner,
  adminUpdatePartnerConfig,
  PARTNER_PAYOUT_STATUS_LABEL,
  type AdminPartnerPayout,
  type PartnerConfig,
} from "@/lib/partners-api";
import { PAYOUT_CHANNEL_LABEL } from "@/lib/payouts-api";
import { useAsyncData } from "@/lib/use-async-data";

const actionClass = "rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-60";
const message = (err: unknown) => (err instanceof ApiError ? err.message : "Action impossible. Réessayez.");

function PayoutCard({ payout, onChange }: { payout: AdminPartnerPayout; onChange: (next: AdminPartnerPayout | null) => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const b = payout.beneficiary;

  async function run(kind: "send" | "check" | "manual" | "reject") {
    let arg = "";
    if (kind === "send" && !window.confirm(`Envoyer ${formatFcfa(payout.net)} à ${b.accountName} (${b.phone}) ?`)) return;
    if (kind === "manual") {
      arg = (window.prompt(`Vous avez déjà versé ${formatFcfa(payout.net)} à ${b.accountName} par Orange Money / MTN ?\nSaisissez la référence de l'opération :`) ?? "").trim();
      if (!arg) return;
    }
    if (kind === "reject") {
      arg = (window.prompt("Motif du refus (le partenaire le verra) :") ?? "").trim();
      if (arg.length < 3) return;
    }
    setError(null);
    setBusy(kind);
    try {
      onChange(
        await (kind === "send"
          ? adminSendPartnerPayout(payout.id)
          : kind === "check"
            ? adminCheckPartnerPayout(payout.id)
            : kind === "manual"
              ? adminMarkPartnerPayoutPaid(payout.id, arg)
              : adminRejectPartnerPayout(payout.id, arg)),
      );
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(null);
    }
  }

  return (
    <li className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display font-semibold text-[var(--color-teal)]">{payout.fullName}</p>
          <p className="text-sm text-slate-600">
            Code {payout.code} · {payout.phone}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-[var(--color-cream)] px-3 py-1 text-xs font-semibold text-[var(--color-ink)]">{PARTNER_PAYOUT_STATUS_LABEL[payout.status]}</span>
      </div>
      <p className="mt-3 text-2xl font-bold text-[var(--color-ink)]">{formatFcfa(payout.net)}</p>
      {payout.withholding > 0 && (
        <p className="text-sm text-slate-600">
          Brut {formatFcfa(payout.gross)} − retenue {formatFcfa(payout.withholding)}
        </p>
      )}
      <div className="mt-2 rounded-xl bg-[var(--color-cream)] px-3 py-2 text-sm text-[var(--color-ink)]">
        <p>
          <strong>Verser sur :</strong> {PAYOUT_CHANNEL_LABEL[b.channel]} · {b.phone} · {b.accountName}
        </p>
        <p className="mt-1">
          {payout.kycApproved ? "✅ Identité vérifiée" : "❌ Identité non vérifiée"} · {payout.nameMatches ? "✅ Nom du compte conforme" : "❌ Nom du compte différent"}
        </p>
        {payout.detailsRecentlyChanged && <p className="mt-1 text-amber-700">⚠️ Compte de retrait modifié il y a moins de 72 h.</p>}
        {payout.partnerStatus === "SUSPENDED" && <p className="mt-1 text-red-600">Partenaire suspendu.</p>}
      </div>
      {payout.failureReason && payout.status !== "PAID" && <p className="mt-2 text-sm text-red-600">{payout.failureReason}</p>}
      {payout.decidedNote && payout.status === "REJECTED" && <p className="mt-2 text-sm text-slate-600">Motif : {payout.decidedNote}</p>}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <p className="mt-2 text-xs text-slate-500">
        Demandé le {formatDay(payout.createdAt)}
        {payout.attempts > 0 ? ` · ${payout.attempts} tentative${payout.attempts > 1 ? "s" : ""}` : ""}
        {payout.paidAt ? ` · versé le ${formatDay(payout.paidAt)}` : ""}
      </p>
      {(payout.canSend || payout.canCheck || payout.canMarkPaid || payout.canReject) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {payout.canSend && (
            <button type="button" disabled={busy !== null} onClick={() => run("send")} className={`${actionClass} bg-[var(--color-terracotta)] text-white`}>
              {busy === "send" ? "Envoi…" : payout.status === "FAILED" ? "Réessayer l'envoi" : "Envoyer"}
            </button>
          )}
          {payout.canCheck && (
            <button type="button" disabled={busy !== null} onClick={() => run("check")} className={`${actionClass} border border-[var(--color-border)] bg-white text-[var(--color-ink)]`}>
              {busy === "check" ? "Vérification…" : "Vérifier l'état"}
            </button>
          )}
          {payout.canMarkPaid && (
            <button type="button" disabled={busy !== null} onClick={() => run("manual")} className={`${actionClass} border border-[var(--color-border)] bg-white text-[var(--color-ink)]`}>
              {busy === "manual" ? "Enregistrement…" : "Marquer comme versé (manuel)"}
            </button>
          )}
          {payout.canReject && (
            <button type="button" disabled={busy !== null} onClick={() => run("reject")} className={`${actionClass} border border-red-200 bg-white text-red-700`}>
              {busy === "reject" ? "…" : "Refuser"}
            </button>
          )}
        </div>
      )}
    </li>
  );
}

function PayoutList({ view }: { view: "open" | "done" }) {
  const { data, loading, error } = useAsyncData(`admin-partner-payouts-${view}`, () => adminListPartnerPayouts(view));
  const [changes, setChanges] = useState<Record<string, AdminPartnerPayout | null>>({});
  if (loading) return <div className="mt-3 h-32 animate-pulse rounded-2xl bg-[var(--color-cream-soft)]" />;
  if (error) return <p className="mt-3 text-sm text-red-500">{error}</p>;
  const items = (data ?? []).map((p) => (p.id in changes ? changes[p.id] : p)).filter((p): p is AdminPartnerPayout => p !== null);
  if (items.length === 0) {
    return <p className="mt-3 rounded-2xl bg-white p-5 text-center text-sm text-slate-600 shadow-sm">{view === "open" ? "Aucun retrait en attente." : "Aucun retrait traité pour le moment."}</p>;
  }
  return (
    <ul className="mt-3 flex flex-col gap-3">
      {items.map((p) => (
        <PayoutCard key={p.id} payout={p} onChange={(next) => setChanges((c) => ({ ...c, [p.id]: next }))} />
      ))}
    </ul>
  );
}

function Payouts() {
  const [view, setView] = useState<"open" | "done">("open");
  return (
    <div>
      <p className="text-sm text-slate-500">
        Premier retrait d&apos;un partenaire : contrôlez la pièce d&apos;identité et le nom du compte avant d&apos;envoyer. Refuser un retrait remet le montant dans le solde du partenaire.
      </p>
      <div className="mt-3 flex gap-2">
        {(["open", "done"] as const).map((v) => (
          <button key={v} type="button" onClick={() => setView(v)} aria-pressed={view === v} className={`rounded-full px-4 py-2 text-sm font-semibold ${view === v ? "bg-[var(--color-teal)] text-white" : "border border-[var(--color-border)] bg-white text-[var(--color-ink)]"}`}>
            {v === "open" ? "À traiter" : "Traités"}
          </button>
        ))}
      </div>
      <PayoutList key={view} view={view} />
    </div>
  );
}

function PartnerList() {
  const { data, loading, error } = useAsyncData("admin-partners", adminListPartners);
  const [changes, setChanges] = useState<Record<string, "ACTIVE" | "SUSPENDED">>({});
  const [err, setErr] = useState<string | null>(null);
  if (loading) return <div className="h-32 animate-pulse rounded-2xl bg-[var(--color-cream-soft)]" />;
  if (error) return <p className="text-sm text-red-500">{error}</p>;
  if (!data?.length) return <p className="rounded-2xl bg-white p-5 text-center text-sm text-slate-600 shadow-sm">Aucun partenaire pour le moment.</p>;

  async function toggle(id: string, suspend: boolean) {
    let reason: string | undefined;
    if (suspend) {
      reason = (window.prompt("Motif de la suspension :") ?? "").trim();
      if (!reason) return;
    }
    setErr(null);
    try {
      await adminSuspendPartner(id, suspend, reason);
      setChanges((c) => ({ ...c, [id]: suspend ? "SUSPENDED" : "ACTIVE" }));
    } catch (e) {
      setErr(message(e));
    }
  }

  return (
    <>
      {err && <p className="mb-2 text-sm text-red-500">{err}</p>}
      <ul className="flex flex-col gap-3">
        {data.map((p) => {
          const status = changes[p.id] ?? p.status;
          return (
            <li key={p.id} className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display font-semibold text-[var(--color-teal)]">{p.fullName}</p>
                  <p className="text-sm text-slate-600">
                    {p.phone} · code {p.code}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status !== "ACTIVE" ? "bg-red-100 text-red-700" : p.isStaff ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
                  {status !== "ACTIVE" ? "Suspendu" : p.isStaff ? "Équipe : commissions suspendues" : "Actif"}
                </span>
              </div>
              <p className="mt-2 text-sm text-[var(--color-ink)]">
                {p.referrals} filleul{p.referrals > 1 ? "s" : ""} · gagné {formatFcfa(p.earned)} · disponible {formatFcfa(p.available)}
              </p>
              <p className="text-xs text-slate-500">Inscrit le {formatDay(p.createdAt)} · identité : {p.kycStatus === "APPROVED" ? "vérifiée" : p.kycStatus === "PENDING_REVIEW" ? "en cours d'examen" : "non vérifiée"}</p>
              <button type="button" onClick={() => toggle(p.id, status === "ACTIVE")} className={`mt-3 ${actionClass} border border-[var(--color-border)] bg-white text-[var(--color-ink)]`}>
                {status === "ACTIVE" ? "Suspendre" : "Réactiver"}
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}

const FIELDS: Array<{ key: keyof PartnerConfig; label: string; unit: string }> = [
  { key: "hostRatePercent", label: "Commission pour un hôte parrainé", unit: "% du revenu SòôRooms" },
  { key: "hostMonths", label: "Durée pour un hôte parrainé", unit: "mois après sa 1re réservation payée" },
  { key: "travelerRatePercent", label: "Commission pour un voyageur parrainé", unit: "% du revenu SòôRooms" },
  { key: "travelerMonths", label: "Durée pour un voyageur parrainé", unit: "mois après son inscription" },
  { key: "capPercent", label: "Plafond cumulé par réservation", unit: "% du revenu SòôRooms" },
  { key: "minPayout", label: "Retrait minimum", unit: "FCFA" },
  { key: "withholdingPercent", label: "Retenue à la source sur les retraits", unit: "% (0 tant que non fixée)" },
  { key: "claimWindowDays", label: "Délai pour enregistrer un parrainage", unit: "jours après l'inscription" },
];

function ConfigForm({ initial }: { initial: PartnerConfig }) {
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(FIELDS.map((f) => [f.key, String(initial[f.key])])));
  const [enabled, setEnabled] = useState(initial.enabled);
  const [terms, setTerms] = useState(initial.termsVersion);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const body: Partial<PartnerConfig> = { enabled, termsVersion: terms.trim() };
      for (const f of FIELDS) (body as Record<string, number>)[f.key] = Number(values[f.key]);
      await adminUpdatePartnerConfig(body);
      setMsg({ ok: true, text: "Réglages enregistrés ✓ (valables pour les prochaines réservations)" });
    } catch (err) {
      setMsg({ ok: false, text: message(err) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm">
      <label className="flex items-center gap-3 text-sm font-semibold text-[var(--color-ink)]">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
        Programme ouvert (décocher : plus d&apos;inscription ni de nouvelles commissions)
      </label>
      {FIELDS.map((f) => (
        <label key={f.key} className="flex flex-col gap-1 text-xs font-medium text-slate-500">
          {f.label} <span className="font-normal">({f.unit})</span>
          <input type="number" step="any" min={0} required value={values[f.key]} onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))} className="rounded-xl border border-[var(--color-border)] px-3 py-2.5 text-base text-[var(--color-ink)]" />
        </label>
      ))}
      <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
        Version des conditions <span className="font-normal">(changer la valeur oblige les partenaires à ré-accepter)</span>
        <input type="text" required minLength={3} maxLength={20} value={terms} onChange={(e) => setTerms(e.target.value)} className="rounded-xl border border-[var(--color-border)] px-3 py-2.5 text-base text-[var(--color-ink)]" />
      </label>
      {msg && <p className={`text-sm ${msg.ok ? "text-emerald-700" : "text-red-500"}`}>{msg.text}</p>}
      <button type="submit" disabled={busy} className={`${actionClass} bg-[var(--color-terracotta)] text-white`}>
        {busy ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}

function Config() {
  const { data, loading, error } = useAsyncData("admin-partner-config", adminPartnerConfig);
  if (loading) return <div className="h-48 animate-pulse rounded-2xl bg-[var(--color-cream-soft)]" />;
  if (error || !data) return <p className="text-sm text-red-500">{error ?? "Impossible de charger les réglages."}</p>;
  return <ConfigForm initial={data} />;
}

type Tab = "payouts" | "partners" | "config";

export function PartnersSection() {
  const [tab, setTab] = useState<Tab>("payouts");
  return (
    <section>
      <h2 className="text-xl font-bold text-[var(--color-teal)]">Programme partenaire</h2>
      <div className="mt-3 flex gap-2">
        {(
          [
            ["payouts", "Retraits"],
            ["partners", "Partenaires"],
            ["config", "Réglages"],
          ] as const
        ).map(([id, label]) => (
          <button key={id} type="button" onClick={() => setTab(id)} aria-pressed={tab === id} className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === id ? "bg-[var(--color-teal)] text-white" : "border border-[var(--color-border)] bg-white text-[var(--color-ink)]"}`}>
            {label}
          </button>
        ))}
      </div>
      <div className="mt-4">
        {tab === "payouts" && <Payouts />}
        {tab === "partners" && <PartnerList />}
        {tab === "config" && <Config />}
      </div>
    </section>
  );
}

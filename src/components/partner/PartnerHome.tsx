"use client";

import Link from "next/link";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/api";
import { formatDay, formatFcfa } from "@/lib/booking-labels";
import {
  activatePartner,
  getPartner,
  listPartnerCommissions,
  listPartnerPayouts,
  listPartnerReferrals,
  PARTNER_PAYOUT_STATUS_LABEL,
  requestPartnerPayout,
  savePartnerPayout,
  type PartnerAccount,
  type PartnerConfig,
  type PartnerMe,
} from "@/lib/partners-api";
import { PAYOUT_CHANNEL_LABEL, type PayoutChannel } from "@/lib/payouts-api";
import { useAsyncData } from "@/lib/use-async-data";

const inputClass = "rounded-xl border border-[var(--color-border)] px-3 py-2.5 text-[var(--color-ink)]";
const card = "rounded-3xl bg-white p-5 shadow-sm";
const errorText = (err: unknown, fallback: string) => (err instanceof ApiError ? err.message : fallback);

function Rates({ config }: { config: PartnerConfig }) {
  return (
    <ul className="mt-3 flex flex-col gap-2 text-sm text-slate-700">
      <li>
        🔑 <strong>{config.hostRatePercent} %</strong> du revenu de SòôRooms sur chaque réservation des hôtes que vous amenez, pendant{" "}
        <strong>{config.hostMonths} mois</strong> à compter de leur première réservation payée.
      </li>
      <li>
        🧳 <strong>{config.travelerRatePercent} %</strong> sur les séjours des voyageurs que vous amenez, pendant{" "}
        <strong>{config.travelerMonths} mois</strong> à compter de leur inscription.
      </li>
      <li>💸 Retrait en argent sur votre compte Mobile Money dès {formatFcfa(config.minPayout)}.</li>
    </ul>
  );
}

function Activate({ me, onDone }: { me: PartnerMe; onDone: (next: PartnerMe) => void }) {
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function activate() {
    setError(null);
    setBusy(true);
    try {
      onDone(await activatePartner());
    } catch (err) {
      setError(errorText(err, "Activation impossible. Réessayez."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={card}>
      <h2 className="font-display text-xl font-semibold text-[var(--color-teal)]">Devenez partenaire SòôRooms</h2>
      <p className="mt-2 text-sm text-slate-600">
        Recommandez SòôRooms à des hôtes et à des voyageurs avec votre lien personnel, et gagnez de l&apos;argent à chaque réservation qu&apos;ils font.
      </p>
      <Rates config={me.config} />
      <div className="mt-4 rounded-2xl bg-[var(--color-cream)] p-4">
        <p className="text-sm font-semibold text-[var(--color-ink)]">Conditions du programme</p>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-xs text-slate-600">
          {me.terms.map((term) => (
            <li key={term}>{term}</li>
          ))}
        </ul>
      </div>
      <label className="mt-4 flex items-start gap-3 text-sm text-[var(--color-ink)]">
        <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-1" />
        <span>J&apos;ai lu et j&apos;accepte les conditions du programme partenaire.</span>
      </label>
      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
      <Button className="mt-4" disabled={!accepted} loading={busy} onClick={activate}>
        Activer mon compte partenaire
      </Button>
    </section>
  );
}

function ShareCard({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const [qr, setQr] = useState<string | null>(null);
  const link = `${window.location.origin}/r/${code}`;
  const message = `Rejoins-moi sur SòôRooms, la plateforme camerounaise de logements vérifiés (hôtels, meublés, chambres) : ${link}`;

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(link, { width: 480, margin: 1, errorCorrectionLevel: "M", color: { dark: "#1e4a4a", light: "#ffffff" } })
      .then((url) => {
        if (!cancelled) setQr(url);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [link]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copiez votre lien :", link);
    }
  }

  return (
    <section className={card}>
      <h2 className="font-display text-lg font-semibold text-[var(--color-teal)]">Votre lien de parrainage</h2>
      <p className="mt-1 text-sm text-slate-600">
        Code : <strong className="tracking-widest text-[var(--color-ink)]">{code}</strong>
      </p>
      <p className="mt-2 break-all rounded-xl bg-[var(--color-cream)] px-3 py-2 text-sm text-[var(--color-ink)]">{link}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button variant="outline" onClick={copy}>
          {copied ? "Copié ✓" : "Copier le lien"}
        </Button>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-2xl bg-[var(--color-teal)] px-5 py-3.5 text-center font-semibold text-white"
        >
          WhatsApp
        </a>
      </div>
      {qr && (
        <div className="mt-4 flex flex-col items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="QR code de votre lien de parrainage" width={200} height={200} className="rounded-xl border border-[var(--color-border)]" />
          <a href={qr} download={`soorooms-parrainage-${code}.png`} className="mt-2 text-sm font-semibold text-[var(--color-terracotta)]">
            Télécharger le QR code
          </a>
        </div>
      )}
    </section>
  );
}

function PayoutForm({ partner, onSaved }: { partner: PartnerAccount; onSaved: (next: PartnerMe) => void }) {
  const [channel, setChannel] = useState<PayoutChannel>(partner.payout?.channel ?? "cm.mtn");
  const [phone, setPhone] = useState(partner.payout?.phone ?? "");
  const [accountName, setAccountName] = useState(partner.payout?.accountName ?? partner.fullName);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      onSaved(await savePartnerPayout({ channel, phone: phone.trim(), accountName: accountName.trim() }));
    } catch (err) {
      setError(errorText(err, "Enregistrement impossible. Réessayez."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-3 flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        {(Object.keys(PAYOUT_CHANNEL_LABEL) as PayoutChannel[]).map((value) => (
          <label key={value} className={`flex cursor-pointer items-center gap-2 rounded-2xl border px-3 py-2.5 text-sm ${value === channel ? "border-[var(--color-terracotta)] bg-[var(--color-cream)]" : "border-[var(--color-border)]"}`}>
            <input type="radio" name="partner-channel" checked={value === channel} onChange={() => setChannel(value)} />
            {PAYOUT_CHANNEL_LABEL[value]}
          </label>
        ))}
      </div>
      <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
        Numéro Mobile Money
        <input type="tel" inputMode="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="6 70 00 00 00" className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
        Nom du titulaire (identique à votre pièce d&apos;identité)
        <input type="text" required minLength={2} maxLength={80} value={accountName} onChange={(e) => setAccountName(e.target.value)} className={inputClass} />
      </label>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button type="submit" loading={busy}>
        Enregistrer le compte
      </Button>
    </form>
  );
}

function Balance({ me, partner, onChange }: { me: PartnerMe; partner: PartnerAccount; onChange: (next: PartnerMe) => void }) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { available, earned, withdrawn } = partner.balance;
  const kycOk = partner.kycStatus === "APPROVED";
  const hasAccount = !!partner.payout;
  const enough = available >= me.config.minPayout;
  const canRequest = partner.status === "ACTIVE" && kycOk && hasAccount && enough && !partner.hasOpenPayout;

  async function request() {
    if (!window.confirm(`Retirer ${formatFcfa(available)} sur ${partner.payout?.phone} ?`)) return;
    setError(null);
    setBusy(true);
    try {
      onChange(await requestPartnerPayout());
    } catch (err) {
      setError(errorText(err, "Demande impossible. Réessayez."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={card}>
      <h2 className="font-display text-lg font-semibold text-[var(--color-teal)]">Mes gains</h2>
      <p className="mt-2 text-3xl font-bold text-[var(--color-ink)]">{formatFcfa(available)}</p>
      <p className="text-sm text-slate-500">disponible au retrait · {formatFcfa(earned)} gagnés au total · {formatFcfa(withdrawn)} déjà versés</p>

      <ol className="mt-4 flex flex-col gap-2 text-sm">
        <li className="flex items-start gap-2">
          <span>{kycOk ? "✅" : "⬜"}</span>
          <span className="flex-1">
            Identité vérifiée (pièce d&apos;identité + photo de profil){" "}
            {partner.kycStatus === "PENDING_REVIEW" ? (
              <span className="text-slate-500">— en cours d&apos;examen</span>
            ) : !kycOk ? (
              <Link href="/profil/partenaire/identite" className="font-semibold text-[var(--color-terracotta)]">
                {partner.kycStatus === "REJECTED" ? "Renvoyer mes documents" : "Vérifier mon identité"}
              </Link>
            ) : null}
          </span>
        </li>
        <li className="flex items-start gap-2">
          <span>{hasAccount ? "✅" : "⬜"}</span>
          <span className="flex-1">
            Compte Mobile Money à votre nom
            {hasAccount && (
              <span className="text-slate-500">
                {" "}
                — {partner.payout ? `${PAYOUT_CHANNEL_LABEL[partner.payout.channel]} · ${partner.payout.phone}` : ""}{" "}
                <button type="button" onClick={() => setEditing((v) => !v)} className="font-semibold text-[var(--color-terracotta)]">
                  modifier
                </button>
              </span>
            )}
          </span>
        </li>
        <li className="flex items-start gap-2">
          <span>{enough ? "✅" : "⬜"}</span>
          <span className="flex-1">Solde d&apos;au moins {formatFcfa(me.config.minPayout)}</span>
        </li>
      </ol>

      {(!hasAccount || editing) && <PayoutForm partner={partner} onSaved={(next) => { setEditing(false); onChange(next); }} />}
      {hasAccount && partner.payoutRecentlyChanged && (
        <p className="mt-3 text-xs text-amber-700">Compte modifié récemment : par sécurité, le retrait est possible 72 h après le changement.</p>
      )}
      {partner.hasOpenPayout && <p className="mt-3 text-sm text-slate-600">Un retrait est en cours de traitement par notre équipe.</p>}
      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
      <Button className="mt-4" disabled={!canRequest} loading={busy} onClick={request}>
        Retirer mes gains
      </Button>
      {me.config.withholdingPercent > 0 && (
        <p className="mt-2 text-xs text-slate-500">Une retenue de {me.config.withholdingPercent} % s&apos;applique sur les retraits, selon la réglementation fiscale.</p>
      )}
    </section>
  );
}

type Tab = "referrals" | "commissions" | "payouts";

function Lists({ partner }: { partner: PartnerAccount }) {
  const [tab, setTab] = useState<Tab>("referrals");
  const stamp = `${partner.balance.earned}-${partner.balance.available}-${partner.referrals}-${partner.hasOpenPayout}`;
  const referrals = useAsyncData(`partner-referrals-${stamp}`, listPartnerReferrals);
  const commissions = useAsyncData(`partner-commissions-${stamp}`, listPartnerCommissions);
  const payouts = useAsyncData(`partner-payouts-${stamp}`, listPartnerPayouts);
  const empty = (text: string) => <p className="mt-3 rounded-2xl bg-[var(--color-cream)] p-4 text-center text-sm text-slate-600">{text}</p>;

  return (
    <section className={card}>
      <div className="flex gap-2">
        {(
          [
            ["referrals", `Filleuls (${partner.referrals})`],
            ["commissions", "Commissions"],
            ["payouts", "Retraits"],
          ] as const
        ).map(([id, label]) => (
          <button key={id} type="button" aria-pressed={tab === id} onClick={() => setTab(id)} className={`rounded-full px-3 py-1.5 text-sm font-semibold ${tab === id ? "bg-[var(--color-teal)] text-white" : "border border-[var(--color-border)] text-[var(--color-ink)]"}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === "referrals" &&
        (referrals.loading ? (
          <div className="mt-3 h-24 animate-pulse rounded-2xl bg-[var(--color-cream-soft)]" />
        ) : !referrals.data?.length ? (
          empty("Personne n'est encore inscrit avec votre lien. Partagez-le sur WhatsApp !")
        ) : (
          <ul className="mt-3 divide-y divide-[var(--color-border)]">
            {referrals.data.map((r) => (
              <li key={r.id} className="py-3 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="font-semibold text-[var(--color-ink)]">{r.name}</span>
                  <span className="font-semibold text-emerald-700">{r.earned > 0 ? `+${formatFcfa(r.earned)}` : "—"}</span>
                </div>
                <p className="text-xs text-slate-500">
                  Inscrit le {formatDay(r.joinedAt)}
                  {r.hostEndsAt ? ` · commissions hôte jusqu'au ${formatDay(r.hostEndsAt)}` : " · pas encore de réservation payée"}
                </p>
              </li>
            ))}
          </ul>
        ))}

      {tab === "commissions" &&
        (commissions.loading ? (
          <div className="mt-3 h-24 animate-pulse rounded-2xl bg-[var(--color-cream-soft)]" />
        ) : !commissions.data?.length ? (
          empty("Vos commissions apparaissent ici dès qu'une réservation de vos filleuls est terminée.")
        ) : (
          <ul className="mt-3 divide-y divide-[var(--color-border)]">
            {commissions.data.map((c) => (
              <li key={c.id} className="flex justify-between gap-3 py-3 text-sm">
                <div>
                  <p className="font-semibold text-[var(--color-ink)]">{c.kind === "HOST" ? "Hôte parrainé" : "Voyageur parrainé"}</p>
                  <p className="text-xs text-slate-500">
                    {formatDay(c.createdAt)} · {c.ratePercent} % de {formatFcfa(c.revenue)}
                  </p>
                </div>
                <span className="font-semibold text-emerald-700">+{formatFcfa(c.amount)}</span>
              </li>
            ))}
          </ul>
        ))}

      {tab === "payouts" &&
        (payouts.loading ? (
          <div className="mt-3 h-24 animate-pulse rounded-2xl bg-[var(--color-cream-soft)]" />
        ) : !payouts.data?.length ? (
          empty("Aucun retrait pour le moment.")
        ) : (
          <ul className="mt-3 divide-y divide-[var(--color-border)]">
            {payouts.data.map((p) => (
              <li key={p.id} className="py-3 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="font-semibold text-[var(--color-ink)]">{formatFcfa(p.net)}</span>
                  <span className="text-slate-600">{PARTNER_PAYOUT_STATUS_LABEL[p.status]}</span>
                </div>
                <p className="text-xs text-slate-500">
                  Demandé le {formatDay(p.createdAt)}
                  {p.withholding > 0 ? ` · retenue ${formatFcfa(p.withholding)}` : ""}
                  {p.paidAt ? ` · versé le ${formatDay(p.paidAt)}` : ""}
                </p>
                {p.status === "REJECTED" && p.decidedNote && <p className="mt-1 text-xs text-red-600">{p.decidedNote}</p>}
              </li>
            ))}
          </ul>
        ))}
    </section>
  );
}

function Dashboard({ me, partner, onChange }: { me: PartnerMe; partner: PartnerAccount; onChange: (next: PartnerMe) => void }) {
  const [busy, setBusy] = useState(false);

  async function acceptNewTerms() {
    setBusy(true);
    try {
      onChange(await activatePartner());
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {partner.status === "SUSPENDED" && (
        <p className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">
          Votre compte partenaire est suspendu{partner.suspendedReason ? ` : ${partner.suspendedReason}` : "."} Contactez le support.
        </p>
      )}
      {partner.needsTerms && (
        <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
          <p>Les conditions du programme ont changé. Relisez-les ci-dessous puis acceptez-les pour continuer.</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
            {me.terms.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <Button className="mt-3" loading={busy} onClick={acceptNewTerms}>
            J&apos;accepte les nouvelles conditions
          </Button>
        </div>
      )}
      <ShareCard code={partner.code} />
      <Balance me={me} partner={partner} onChange={onChange} />
      <Lists partner={partner} />
      <section className={card}>
        <h2 className="font-display text-lg font-semibold text-[var(--color-teal)]">Comment ça marche</h2>
        <Rates config={me.config} />
        <p className="mt-3 text-xs text-slate-500">
          La commission est calculée sur le revenu que SòôRooms conserve réellement, une fois le séjour terminé. Une réservation remboursée ne rapporte rien sur la part remboursée, et ce que vous avez déjà gagné n&apos;est jamais repris. Vous ne gagnez rien sur vos propres logements ou réservations.
        </p>
      </section>
    </div>
  );
}

/** Page « Programme partenaire » : présentation et activation, puis tableau de bord. */
export function PartnerHome() {
  const { data, loading, error } = useAsyncData("partner-me", getPartner);
  const [fresh, setFresh] = useState<PartnerMe | null>(null);
  const me = fresh ?? data;

  if (loading) return <div className="h-64 animate-pulse rounded-3xl bg-[var(--color-cream-soft)]" />;
  if (error || !me) return <p className="text-sm text-red-500">{error ?? "Impossible de charger le programme partenaire."}</p>;
  if (!me.config.enabled && !me.partner) return <p className={`${card} text-sm text-slate-600`}>Le programme partenaire est momentanément fermé.</p>;
  if (!me.partner) return <Activate me={me} onDone={setFresh} />;
  return <Dashboard me={me} partner={me.partner} onChange={setFresh} />;
}

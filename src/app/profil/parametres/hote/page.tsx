"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { AvatarEditor } from "@/components/AvatarEditor";
import { FileUploadField } from "@/components/FileUploadField";
import { setMode } from "@/lib/account";
import { ApiError, becomeHost, getMyKyc, submitKyc } from "@/lib/api";
import { useAsyncData } from "@/lib/use-async-data";
import { isOwnAvatarUrl } from "@/lib/profile-api";
import { loadMe, useMe } from "@/lib/use-me";

const STEPS = ["Profil hôte", "Documents", "Envoi"];

/**
 * Activation du compte hôte : l'étape 1 ouvre le profil hôte
 * (POST /auth/become-host), les étapes 2 et 3 constituent la demande KYC
 * (POST /kyc/submit). Les documents sont envoyés depuis l'appareil vers Cloudinary,
 * en livraison privée : seul un administrateur peut ensuite les consulter.
 */
export default function ActivationHotePage() {
  const router = useRouter();
  const { data: kyc, loading } = useAsyncData("my-kyc", getMyKyc);
  const me = useMe();
  const hasPhoto = isOwnAvatarUrl(me?.avatarUrl);

  const [step, setStep] = useState(0);
  const [bio, setBio] = useState("");
  const [idCardUrl, setIdCardUrl] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const blocked = kyc?.kycStatus === "PENDING_REVIEW" || kyc?.kycStatus === "APPROVED";

  async function run(action: () => Promise<void>) {
    setError(null);
    setBusy(true);
    try {
      await action();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  const submitProfile = () =>
    run(async () => {
      await becomeHost({ bio: bio.trim() || undefined });
      setStep(1);
    });

  function submitDocuments(event: React.FormEvent) {
    event.preventDefault();
    if (!hasPhoto) return setError("Ajoutez votre photo de profil : elle permet de vérifier que vous êtes la personne de la pièce d'identité.");
    if (!idCardUrl) return setError("Ajoutez votre pièce d'identité : choisissez un fichier sur votre appareil.");
    setError(null);
    setStep(2);
  }

  const sendRequest = () =>
    run(async () => {
      await submitKyc({ idCardUrl, proofOfAddressUrl: proofUrl || undefined });
      await loadMe(true); // le profil passe à « KYC envoyé » : la flèche de bascule apparaît
      setDone(true);
    });

  return (
    <AppShell title="Devenir hôte" backHref="/profil/parametres">
      {loading ? (
        <div className="h-32 animate-pulse rounded-2xl bg-[var(--color-cream-soft)]" />
      ) : blocked ? (
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-slate-600">
            {kyc?.kycStatus === "APPROVED"
              ? "Votre compte hôte est déjà vérifié."
              : "Une demande est déjà en cours d'examen."}
          </p>
          <Link href="/profil/parametres" className="mt-3 inline-block font-semibold text-[var(--color-terracotta)]">
            Retour aux paramètres
          </Link>
        </div>
      ) : done ? (
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="font-display text-xl font-semibold text-[var(--color-teal)]">Demande envoyée</h2>
          <p className="mt-2 text-slate-600">
            Vos documents sont en cours de vérification. Une flèche est apparue à côté du logo : elle vous permet de
            basculer entre le mode voyageur et le mode hôte.
          </p>
          <div className="mt-5 flex flex-col gap-3">
            <Button
              onClick={() => {
                setMode("HOST");
                router.push("/hote");
              }}
            >
              Passer en mode hôte
            </Button>
            <Button variant="outline" onClick={() => router.push("/profil")}>
              Retour au profil
            </Button>
          </div>
        </div>
      ) : (
        <>
          <ol className="mb-6 flex items-center gap-2" aria-label="Progression">
            {STEPS.map((label, index) => (
              <li key={label} className="flex flex-1 flex-col gap-1.5">
                <span className={`h-1.5 rounded-full ${index <= step ? "bg-[var(--color-terracotta)]" : "bg-[var(--color-border)]"}`} />
                <span className={`text-xs font-medium ${index === step ? "text-[var(--color-teal)]" : "text-slate-400"}`}>
                  {index + 1}. {label}
                </span>
              </li>
            ))}
          </ol>

          {step === 0 && (
            <div className="flex flex-col gap-4">
              <p className="text-slate-600">Présentez-vous en quelques mots aux voyageurs (facultatif).</p>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                placeholder="Ex. : Je loue des villas à Kribi depuis 5 ans…"
                className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3.5 text-[var(--color-ink)] placeholder:text-slate-400 focus:border-[var(--color-teal)] focus:outline-none"
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button onClick={submitProfile} loading={busy}>
                Continuer
              </Button>
            </div>
          )}

          {step === 1 && (
            <form onSubmit={submitDocuments} noValidate className="flex flex-col gap-4">
              <p className="text-slate-600">
                Ajoutez vos documents : touchez le bouton pour choisir un fichier ou une photo sur votre appareil (image ou
                PDF, 8 Mo maximum). Vos documents restent privés : seule l&apos;équipe SòôRooms peut les consulter.
              </p>
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <p className="font-semibold text-[var(--color-ink)]">Votre photo de profil</p>
                <p className="mb-4 mt-1 text-sm text-slate-600">
                  Une photo de votre visage, de face, nette et sans lunettes de soleil ni filtre. Le contrôleur la compare à
                  votre pièce d&apos;identité pour s&apos;assurer qu&apos;il s&apos;agit bien de vous. Elle sera aussi votre photo sur
                  SòôRooms, et ne pourra plus être changée une fois la vérification envoyée.
                </p>
                <AvatarEditor name={me?.fullName ?? ""} url={hasPhoto ? (me?.avatarUrl ?? null) : null} hint="Touchez le cercle pour choisir une photo" />
              </div>
              <FileUploadField label="Pièce d'identité" purpose="kyc_document" value={idCardUrl} onChange={setIdCardUrl} required />
              <FileUploadField label="Justificatif de domicile" purpose="kyc_document" value={proofUrl} onChange={setProofUrl} />
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit">Continuer</Button>
              <Button type="button" variant="outline" onClick={() => setStep(0)}>
                Précédent
              </Button>
            </form>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-4">
              <p className="text-slate-600">Vérifiez vos informations avant d&apos;envoyer votre demande.</p>
              <dl className="rounded-2xl bg-white p-4 text-sm shadow-sm">
                <dt className="text-xs font-medium text-slate-500">Présentation</dt>
                <dd className="mb-3 mt-0.5 text-[var(--color-ink)]">{bio.trim() || "—"}</dd>
                <dt className="text-xs font-medium text-slate-500">Photo de profil</dt>
                <dd className="mb-3 mt-0.5 text-[var(--color-ink)]">{hasPhoto ? "Ajoutée ✓" : "—"}</dd>
                <dt className="text-xs font-medium text-slate-500">Pièce d&apos;identité</dt>
                <dd className="mb-3 mt-0.5 text-[var(--color-ink)]">Document envoyé ✓</dd>
                <dt className="text-xs font-medium text-slate-500">Justificatif de domicile</dt>
                <dd className="mt-0.5 text-[var(--color-ink)]">{proofUrl ? "Document envoyé ✓" : "—"}</dd>
              </dl>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button onClick={sendRequest} loading={busy}>
                Envoyer ma demande
              </Button>
              <Button variant="outline" onClick={() => setStep(1)} disabled={busy}>
                Précédent
              </Button>
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}

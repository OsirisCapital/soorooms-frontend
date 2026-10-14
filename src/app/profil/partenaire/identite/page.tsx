"use client";

import Link from "next/link";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { AvatarEditor } from "@/components/AvatarEditor";
import { FileUploadField } from "@/components/FileUploadField";
import { Button } from "@/components/ui/Button";
import { ApiError, getMyKyc, submitKyc } from "@/lib/api";
import { isOwnAvatarUrl } from "@/lib/profile-api";
import { useAsyncData } from "@/lib/use-async-data";
import { loadMe, useMe } from "@/lib/use-me";

/**
 * Vérification d'identité d'un partenaire : pièce d'identité (CNI ou passeport) et photo de visage. C'est la même
 * vérification que pour un hôte (une seule fois pour le compte), sans ouvrir de compte hôte.
 */
export default function PartnerIdentityPage() {
  const { data: kyc, loading } = useAsyncData("my-kyc", getMyKyc);
  const me = useMe();
  const hasPhoto = isOwnAvatarUrl(me?.avatarUrl);
  const [idCardUrl, setIdCardUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const blocked = kyc?.kycStatus === "PENDING_REVIEW" || kyc?.kycStatus === "APPROVED";
  const rejectedNote = kyc?.documents.find((d) => d.status === "REJECTED")?.reviewerNote;

  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (!hasPhoto) return setError("Ajoutez votre photo de profil : elle permet de vérifier que vous êtes la personne de la pièce d'identité.");
    if (!idCardUrl) return setError("Ajoutez votre pièce d'identité : choisissez un fichier sur votre appareil.");
    setError(null);
    setBusy(true);
    try {
      await submitKyc({ idCardUrl });
      await loadMe(true);
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Envoi impossible. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell title="Vérifier mon identité" backHref="/profil/partenaire">
      {loading ? (
        <div className="h-32 animate-pulse rounded-2xl bg-[var(--color-cream-soft)]" />
      ) : blocked || done ? (
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-slate-600">
            {kyc?.kycStatus === "APPROVED" ? "Votre identité est déjà vérifiée." : "Votre demande est en cours d'examen : vous serez prévenu dès la décision."}
          </p>
          <Link href="/profil/partenaire" className="mt-3 inline-block font-semibold text-[var(--color-terracotta)]">
            Retour au programme partenaire
          </Link>
        </div>
      ) : (
        <form onSubmit={send} noValidate className="flex flex-col gap-4">
          {kyc?.kycStatus === "REJECTED" && (
            <p className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">Vos documents ont été refusés{rejectedNote ? ` : ${rejectedNote}` : "."} Vous pouvez les renvoyer.</p>
          )}
          <p className="text-slate-600">
            Pour retirer vos gains, nous vérifions que le compte Mobile Money est bien à votre nom. Il nous faut votre photo et votre pièce d&apos;identité (CNI ou passeport). Vos documents restent privés : seule l&apos;équipe SòôRooms peut les consulter.
          </p>
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="font-semibold text-[var(--color-ink)]">Votre photo de profil</p>
            <p className="mb-4 mt-1 text-sm text-slate-600">Une photo de votre visage, de face, nette. Elle ne pourra plus être changée une fois la vérification envoyée.</p>
            <AvatarEditor name={me?.fullName ?? ""} url={hasPhoto ? (me?.avatarUrl ?? null) : null} hint="Touchez le cercle pour choisir une photo" />
          </div>
          <FileUploadField label="Pièce d'identité (CNI ou passeport)" purpose="kyc_document" value={idCardUrl} onChange={setIdCardUrl} required />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" loading={busy}>
            Envoyer ma demande
          </Button>
        </form>
      )}
    </AppShell>
  );
}

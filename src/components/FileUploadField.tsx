"use client";

import { useRef, useState } from "react";
import type { UploadPurpose } from "@/lib/api";
import { ACCEPT_ATTRIBUTE, uploadErrorMessage, uploadFile } from "@/lib/upload";

type Props = {
  label: string;
  purpose: UploadPurpose;
  /** URL du fichier envoyé, chaîne vide tant qu'il n'y en a pas. */
  value: string;
  onChange: (url: string) => void;
  required?: boolean;
};

/**
 * Champ « choisir un fichier » : ouvre le sélecteur de l'appareil (galerie,
 * fichiers ou appareil photo), envoie le fichier et mémorise son URL. Aucun lien
 * ne peut être collé : le serveur n'accepte que les fichiers envoyés d'ici.
 *
 * Pas d'aperçu pour les documents KYC : ils sont privés, leur lien direct ne
 * s'affiche pas (et c'est voulu — seul un administrateur peut les consulter).
 */
export function FileUploadField({ label, purpose, value, onChange, required = false }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // permet de rechoisir le même fichier après une erreur
    if (!file) return;

    setError(null);
    setBusy(true);
    try {
      onChange(await uploadFile(file, purpose));
      setFileName(file.name);
    } catch (err) {
      setError(uploadErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const showPreview = purpose !== "kyc_document" && value !== "" && !value.toLowerCase().endsWith(".pdf");

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
      <p className="text-sm font-medium text-[var(--color-ink)]">
        {label}
        {required ? " *" : " (facultatif)"}
      </p>

      <input ref={inputRef} type="file" accept={ACCEPT_ATTRIBUTE[purpose]} onChange={handleFile} className="hidden" />

      {value && (
        <div className="mt-3 flex items-center gap-3">
          {showPreview && (
            // eslint-disable-next-line @next/next/no-img-element -- aperçu d'un fichier que l'utilisateur vient d'envoyer
            <img src={value} alt="" className="h-14 w-14 rounded-xl object-cover" />
          )}
          <p className="min-w-0 truncate text-sm text-[var(--color-teal-600)]">{fileName ?? "Fichier envoyé"} ✓</p>
        </div>
      )}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="mt-3 w-full rounded-2xl border border-dashed border-[var(--color-teal-600)] px-4 py-3 text-sm font-semibold text-[var(--color-teal)] disabled:opacity-60"
      >
        {busy ? "Envoi en cours…" : value ? "Remplacer le fichier" : "Choisir un fichier"}
      </button>

      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  );
}

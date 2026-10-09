"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import { isAvatarLocked, removeAvatar, setAvatar } from "@/lib/profile-api";
import { squareThumbnail } from "@/lib/image-resize";
import { ACCEPT_ATTRIBUTE, uploadErrorMessage, uploadFile } from "@/lib/upload";
import { loadMe, useMe } from "@/lib/use-me";

/** Avatar de la page Profil : toucher la photo pour la changer, « Supprimer la photo » pour revenir à l'initiale. */
export function AvatarEditor({ name, url, hint }: { name: string; url: string | null; hint?: string }) {
  const me = useMe();
  const locked = isAvatarLocked(me?.kycStatus, url);
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const uploaded = await uploadFile(await squareThumbnail(file), "avatar");
      await setAvatar(uploaded);
      await loadMe(true);
    } catch (err) {
      setError(uploadErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    setError(null);
    setBusy(true);
    try {
      await removeAvatar();
      await loadMe(true);
    } catch (err) {
      setError(uploadErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (locked) {
    return (
      <div className="flex flex-col items-center">
        <Avatar url={url} name={name} size={112} />
        <p className="mt-2 max-w-xs text-center text-xs text-slate-500">
          {me?.kycStatus === "APPROVED"
            ? "Cette photo est celle de votre identité vérifiée : elle ne peut plus être modifiée."
            : "Votre photo est en cours de vérification avec votre pièce d'identité : elle ne peut pas être modifiée pour l'instant."}{" "}
          <Link href="/profil/aide/tickets" className="font-semibold text-[var(--color-teal)] underline">
            Contacter le support
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <input ref={inputRef} type="file" accept={ACCEPT_ATTRIBUTE.avatar} onChange={handleFile} className="hidden" />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        aria-label="Changer ma photo de profil"
        className="relative rounded-full disabled:opacity-60"
      >
        <Avatar url={url} name={name} size={112} />
        <span
          aria-hidden="true"
          className="absolute -right-1 -top-1 flex h-9 w-9 items-center justify-center rounded-full bg-white text-[var(--color-teal)] shadow"
        >
          <Icon name="pencil" size={18} />
        </span>
      </button>
      <p className="mt-2 text-xs text-slate-500" aria-live="polite">
        {busy ? "Envoi en cours…" : (hint ?? "Touchez la photo pour la changer")}
      </p>
      {url && !busy && (
        <button type="button" onClick={handleRemove} className="mt-1 text-xs font-semibold text-[var(--color-terracotta)]">
          Supprimer la photo
        </button>
      )}
      {error && <p className="mt-2 text-center text-sm text-red-500">{error}</p>}
    </div>
  );
}

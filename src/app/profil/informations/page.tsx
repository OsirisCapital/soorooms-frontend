"use client";

import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { PasswordToggle } from "@/components/ui/PasswordToggle";
import { TextField } from "@/components/ui/TextField";
import { ApiError, resendVerification, setEmail, type Me } from "@/lib/api";
import { loadMe, useMe } from "@/lib/use-me";

function Field({ label, value, badge }: { label: string; value: string; badge?: { text: string; ok: boolean } }) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        {badge && (
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              badge.ok ? "bg-[var(--color-teal-100)] text-[var(--color-teal)]" : "bg-orange-100 text-[var(--color-terracotta-dark)]"
            }`}
          >
            {badge.text}
          </span>
        )}
      </div>
      <p className="mt-0.5 break-all text-[var(--color-ink)]">{value}</p>
    </div>
  );
}

function errorText(err: unknown, fallback: string) {
  return err instanceof ApiError ? err.message : fallback;
}

function EmailSection({ me }: { me: Me }) {
  const isGoogleAccount = me.phone.startsWith("google:");
  const verified = Boolean(me.email && me.emailVerifiedAt);

  const [notice, setNotice] = useState<{ text: string; ok: boolean } | null>(null);
  const [resending, setResending] = useState(false);
  const [editing, setEditing] = useState(false);
  const [email, setEmailValue] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleResend() {
    setNotice(null);
    setResending(true);
    try {
      const result = await resendVerification();
      setNotice({ text: result.message, ok: true });
    } catch (err) {
      setNotice({ text: errorText(err, "Envoi impossible. Réessayez dans un instant."), ok: false });
    } finally {
      setResending(false);
    }
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setNotice(null);
    setSaving(true);
    try {
      const result = await setEmail(email.trim(), password);
      setNotice({ text: result.message, ok: result.emailSent });
      setEditing(false);
      setEmailValue("");
      setPassword("");
      await loadMe(true);
    } catch (err) {
      setNotice({ text: errorText(err, "Enregistrement impossible. Réessayez."), ok: false });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="flex flex-col gap-3">
      {me.email ? (
        <Field label="E-mail" value={me.email} badge={verified ? { text: "Vérifiée", ok: true } : { text: "Non vérifiée", ok: false }} />
      ) : (
        <div className="rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3.5">
          <p className="text-xs font-medium text-slate-500">E-mail</p>
          <p className="mt-0.5 text-[var(--color-ink)]">Aucune adresse enregistrée</p>
        </div>
      )}

      {!verified && (
        <p className="text-sm text-slate-500">
          {me.email
            ? "Confirmez votre adresse pour pouvoir réinitialiser votre mot de passe par e-mail. Pensez à vérifier vos courriers indésirables."
            : "Ajoutez une adresse e-mail : c'est le seul moyen de retrouver votre compte si vous oubliez votre mot de passe."}
        </p>
      )}

      {me.email && !verified && (
        <Button type="button" variant="outline" onClick={handleResend} loading={resending}>
          Renvoyer l&apos;e-mail de confirmation
        </Button>
      )}

      {notice && <p className={`text-sm ${notice.ok ? "text-[var(--color-teal)]" : "text-red-500"}`}>{notice.text}</p>}

      {isGoogleAccount ? (
        <p className="text-sm text-slate-500">Votre compte utilise Google : votre adresse e-mail est gérée par Google.</p>
      ) : editing ? (
        <form onSubmit={handleSave} className="flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-white p-4">
          <TextField
            type="email"
            placeholder="Nouvelle adresse e-mail"
            value={email}
            onChange={(e) => setEmailValue(e.target.value)}
            autoComplete="email"
            required
          />
          <TextField
            type={showPassword ? "text" : "password"}
            placeholder="Votre mot de passe actuel"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            trailing={<PasswordToggle visible={showPassword} onToggle={() => setShowPassword((v) => !v)} />}
            autoComplete="current-password"
            required
          />
          <p className="text-xs text-slate-500">Votre mot de passe est demandé pour protéger votre compte.</p>
          <Button type="submit" loading={saving}>
            Enregistrer l&apos;adresse
          </Button>
          <button type="button" onClick={() => setEditing(false)} className="text-sm text-slate-500">
            Annuler
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => {
            setNotice(null);
            setEditing(true);
          }}
          className="text-left text-sm font-semibold text-[var(--color-teal)] underline"
        >
          {me.email ? "Modifier mon adresse e-mail" : "Ajouter mon adresse e-mail"}
        </button>
      )}
    </section>
  );
}

export default function InformationsPage() {
  const me = useMe();

  return (
    <AppShell title="Mes informations" backHref="/profil">
      <div className="flex flex-col gap-3">
        <Field label="Nom complet" value={me?.fullName ?? "…"} />
        <Field label="Téléphone" value={me ? (me.phone.startsWith("google:") ? "Non renseigné" : me.phone) : "…"} />
        {me && <EmailSection me={me} />}
      </div>
      <p className="mt-6 text-sm text-slate-500">
        La modification de votre nom, de votre téléphone et de votre photo arrivera dans une prochaine version.
      </p>
    </AppShell>
  );
}

"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { PhoneField } from "@/components/ui/PhoneField";
import { ApiError, type CollaboratorRole } from "@/lib/api";
import { useAsyncData } from "@/lib/use-async-data";
import { useMe } from "@/lib/use-me";
import { changeMemberRole, INVITABLE_ROLES, inviteMember, listTeam, removeMember, ROLE_HELP, ROLE_LABEL, type TeamMember } from "@/lib/team-api";

const FIELD = "w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2.5 text-sm";
const messageOf = (err: unknown) => (err instanceof ApiError ? err.message : "Une erreur est survenue. Réessayez.");

function MemberRow({ member, isMe, propertyId, onChanged }: { member: TeamMember; isMe: boolean; propertyId: string; onChanged: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const roles: CollaboratorRole[] = member.role === "MANAGER" ? ["MANAGER", ...INVITABLE_ROLES] : [...INVITABLE_ROLES, "MANAGER"];

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      await onChanged();
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-[var(--color-ink)]">
            {member.fullName}
            {isMe ? " (vous)" : ""}
          </p>
          <p className="text-xs text-slate-500">{member.phone}</p>
        </div>
        <span className="shrink-0 rounded-full bg-[var(--color-teal-100)] px-3 py-1 text-xs font-semibold text-[var(--color-teal)]">{ROLE_LABEL[member.role]}</span>
      </div>
      <p className="mt-2 text-xs text-slate-500">{ROLE_HELP[member.role]}</p>
      <div className="mt-3 flex items-center gap-2">
        <select
          aria-label={`Rôle de ${member.fullName}`}
          value={member.role}
          disabled={busy}
          onChange={(e) => {
            const role = e.target.value as CollaboratorRole;
            if (role === "MANAGER" && !window.confirm(`Donner à ${member.fullName} tous les droits de gérant principal, finances et équipe comprises ?`)) return;
            void run(() => changeMemberRole(propertyId, member.userId, role));
          }}
          className={FIELD}
        >
          {roles.map((role) => (
            <option key={role} value={role}>{ROLE_LABEL[role]}</option>
          ))}
        </select>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            if (window.confirm(`Retirer ${member.fullName} de l'équipe de ce logement ?`)) void run(() => removeMember(propertyId, member.userId));
          }}
          className="shrink-0 rounded-full border border-red-300 px-4 py-2.5 text-sm font-semibold text-red-600 disabled:opacity-50"
        >
          Retirer
        </button>
      </div>
      {error && <p role="alert" className="mt-2 text-sm text-red-500">{error}</p>}
    </li>
  );
}

function InviteForm({ propertyId, onInvited }: { propertyId: string; onInvited: () => Promise<void> }) {
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<CollaboratorRole>("RECEPTIONIST");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [formKey, setFormKey] = useState(0);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setDone(false);
    if (!phone) return setError("Saisissez le numéro de la personne.");
    setBusy(true);
    try {
      await inviteMember(propertyId, phone, role);
      setDone(true);
      setPhone("");
      setFormKey((k) => k + 1); // vide le champ téléphone
      await onInvited();
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="text-base font-bold text-[var(--color-ink)]">Ajouter une personne</h2>
      <p className="text-xs text-slate-500">Elle doit déjà avoir un compte SòôRooms : demandez-lui de s&apos;inscrire d&apos;abord, puis saisissez son numéro.</p>
      <PhoneField key={formKey} onChange={(value) => setPhone(value)} required />
      <select aria-label="Rôle" value={role} onChange={(e) => setRole(e.target.value as CollaboratorRole)} className={FIELD}>
        {INVITABLE_ROLES.map((r) => (
          <option key={r} value={r}>{ROLE_LABEL[r]}</option>
        ))}
      </select>
      <p className="text-xs text-slate-500">{ROLE_HELP[role]}</p>
      {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
      {done && <p role="status" className="text-sm text-[var(--color-teal)]">Personne ajoutée : elle a reçu une notification.</p>}
      <Button type="submit" loading={busy}>Ajouter à l&apos;équipe</Button>
    </form>
  );
}

function Content({ propertyId }: { propertyId: string }) {
  const me = useMe();
  const { data, loading, error } = useAsyncData(`team-${propertyId}`, () => listTeam(propertyId));
  const [fresh, setFresh] = useState<TeamMember[] | null>(null);
  const team = fresh ?? data;
  const reload = async () => setFresh(await listTeam(propertyId));

  if (loading) return <div className="h-48 animate-pulse rounded-2xl bg-[var(--color-cream-soft)]" />;
  if (error || !team) return <p className="rounded-2xl bg-white p-6 text-center text-slate-600 shadow-sm">{error ?? "Équipe indisponible."}</p>;

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-3">
        {team.map((member) => (
          <MemberRow key={member.userId} member={member} isMe={me?.id === member.userId} propertyId={propertyId} onChanged={reload} />
        ))}
      </ul>
      <InviteForm propertyId={propertyId} onInvited={reload} />
    </div>
  );
}

export default function TeamPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <AppShell backHref={`/hote/logements/${id}`}>
      <h1 className="mb-1 text-xl font-bold text-[var(--color-ink)]">Équipe du logement</h1>
      <p className="mb-4 text-sm text-slate-600">Donnez à chacun uniquement les droits dont il a besoin.</p>
      <Content propertyId={id} />
    </AppShell>
  );
}

"use client";

import { useState } from "react";
import { AdminFrame } from "@/components/admin/AdminFrame";
import { messageOf } from "@/components/support/parts";
import { Button } from "@/components/ui/Button";
import {
  addStaff,
  listStaff,
  PERMISSION_LABEL,
  removeStaff,
  STAFF_ROLE_LABEL,
  updateStaff,
  type AdminAccess,
  type Permission,
  type StaffMember,
  type StaffRole,
} from "@/lib/admin-api";
import { useAsyncData } from "@/lib/use-async-data";

const FIELD = "w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm focus:border-[var(--color-teal)] focus:outline-none";
const ROLES = Object.keys(STAFF_ROLE_LABEL) as StaffRole[];
const PERMISSIONS = Object.keys(PERMISSION_LABEL) as Permission[];

/** Niveau + accès en plus. Les accès déjà inclus dans le niveau ne se cochent pas deux fois. */
function AccessForm({
  initial,
  submitLabel,
  allowed,
  onSubmit,
  onCancel,
}: {
  initial: { staffRole: StaffRole; permissions: Permission[] };
  submitLabel: string;
  /** Accès que la personne connectée peut donner (on ne donne pas ce qu'on n'a pas). */
  allowed: Permission[];
  onSubmit: (value: { staffRole: StaffRole; permissions: Permission[] }) => Promise<void>;
  onCancel?: () => void;
}) {
  const [staffRole, setRole] = useState(initial.staffRole);
  const [extras, setExtras] = useState<Permission[]>(initial.permissions);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    setBusy(true);
    try {
      await onSubmit({ staffRole, permissions: extras });
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <select value={staffRole} onChange={(e) => setRole(e.target.value as StaffRole)} aria-label="Niveau" className={FIELD}>
        {ROLES.map((r) => (
          <option key={r} value={r} disabled={r === "SUPER_ADMIN" && !allowed.includes("staff.manage")}>
            {STAFF_ROLE_LABEL[r]}
          </option>
        ))}
      </select>
      <fieldset className="rounded-2xl border border-[var(--color-border)] p-3">
        <legend className="px-1 text-xs font-semibold text-slate-500">Accès supplémentaires</legend>
        <div className="flex flex-col gap-2">
          {PERMISSIONS.map((p) => (
            <label key={p} className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={extras.includes(p)}
                disabled={!allowed.includes(p)}
                onChange={(e) => setExtras((cur) => (e.target.checked ? [...cur, p] : cur.filter((x) => x !== p)))}
              />
              {PERMISSION_LABEL[p]}
            </label>
          ))}
        </div>
      </fieldset>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex gap-2">
        <Button loading={busy} onClick={submit}>
          {submitLabel}
        </Button>
        {onCancel && (
          <Button variant="outline" disabled={busy} onClick={onCancel}>
            Annuler
          </Button>
        )}
      </div>
    </div>
  );
}

function AddMember({ access, onAdded }: { access: AdminAccess; onAdded: (m: StaffMember) => void }) {
  const [identifier, setIdentifier] = useState("");
  return (
    <div className="mb-6 flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="font-semibold text-[var(--color-teal)]">Ajouter un membre</h2>
      <p className="text-xs text-slate-500">La personne doit déjà avoir un compte SòôRooms avec un e-mail vérifié. Elle devra se reconnecter pour voir son nouvel espace.</p>
      <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="E-mail ou téléphone du compte" aria-label="E-mail ou téléphone" className={FIELD} />
      <AccessForm
        initial={{ staffRole: "SUPPORT", permissions: [] }}
        submitLabel="Ajouter à l'équipe"
        allowed={access.permissions}
        onSubmit={async (value) => {
          if (!identifier.trim()) throw new Error("Indiquez l'e-mail ou le téléphone du compte.");
          onAdded(await addStaff({ ...value, identifier: identifier.trim() }));
          setIdentifier("");
        }}
      />
    </div>
  );
}

function Member({ member, access, onChange, onRemove }: { member: StaffMember; access: AdminAccess; onChange: (m: StaffMember) => void; onRemove: (id: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMe = member.id === access.id;

  async function remove() {
    if (!window.confirm(`Retirer ${member.fullName} de l'équipe ? Son compte reste utilisable comme voyageur ou hôte, et ses tâches et demandes redeviennent non assignées.`)) return;
    setError(null);
    setBusy(true);
    try {
      await removeStaff(member.id);
      onRemove(member.id);
    } catch (err) {
      setError(messageOf(err));
      setBusy(false);
    }
  }

  return (
    <li className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-[var(--color-teal)]">
            {member.fullName}
            {isMe ? " (vous)" : ""}
          </p>
          <p className="truncate text-xs text-slate-500">{member.email ?? member.phone}</p>
        </div>
        <span className="shrink-0 rounded-full bg-[var(--color-teal-100)] px-3 py-1 text-xs font-semibold text-[var(--color-teal)]">{STAFF_ROLE_LABEL[member.staffRole]}</span>
      </div>
      <p className="mt-2 text-xs text-slate-500">Accès : {member.permissions.map((p) => PERMISSION_LABEL[p]).join(", ")}</p>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      {editing ? (
        <div className="mt-3">
          <AccessForm
            initial={{ staffRole: member.staffRole, permissions: member.extraPermissions as Permission[] }}
            submitLabel="Enregistrer"
            allowed={access.permissions}
            onCancel={() => setEditing(false)}
            onSubmit={async (value) => {
              onChange(await updateStaff(member.id, value));
              setEditing(false);
            }}
          />
        </div>
      ) : isMe ? (
        <p className="mt-3 text-xs text-slate-400">Vous ne pouvez pas modifier votre propre compte.</p>
      ) : (
        <div className="mt-3 flex gap-2">
          <Button variant="outline" disabled={busy} onClick={() => setEditing(true)}>
            Modifier
          </Button>
          <Button variant="outline" loading={busy} onClick={remove}>
            Retirer
          </Button>
        </div>
      )}
    </li>
  );
}

function Team({ access }: { access: AdminAccess }) {
  const { loading, data, error } = useAsyncData("admin-staff", listStaff);
  const [local, setLocal] = useState<StaffMember[] | null>(null);
  const items = local ?? data;

  return (
    <div>
      <AddMember access={access} onAdded={(m) => setLocal([...(items ?? []), m].sort((a, b) => a.fullName.localeCompare(b.fullName)))} />
      {loading && !items && <div className="h-24 animate-pulse rounded-2xl bg-[var(--color-cream-soft)]" />}
      {error && !items && <p className="text-sm text-red-500">{error}</p>}
      {items && (
        <ul className="flex flex-col gap-3">
          {items.map((m) => (
            <Member key={m.id} member={m} access={access} onChange={(next) => setLocal(items.map((x) => (x.id === next.id ? next : x)))} onRemove={(id) => setLocal(items.filter((x) => x.id !== id))} />
          ))}
        </ul>
      )}
    </div>
  );
}

export default function TeamPage() {
  return <AdminFrame permission="staff.manage">{(access) => <Team access={access} />}</AdminFrame>;
}

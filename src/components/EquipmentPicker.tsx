"use client";

import { useState } from "react";

/** Équipements courants proposés d'office ; l'hôte ajoute les siens avec « + ». */
export const ROOM_EQUIPMENT_SUGGESTIONS = [
  "Climatisation",
  "Ventilateur",
  "Wi-Fi",
  "Télévision",
  "Eau chaude",
  "Douche",
  "Baignoire",
  "Réfrigérateur",
  "Bureau",
  "Armoire",
  "Balcon",
  "Moustiquaire",
  "Insonorisation",
];

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
  suggestions?: string[];
  label?: string;
};

/** Sélecteur d'équipements : cases à cocher pour les propositions, et un champ « + » pour en ajouter. */
export function EquipmentPicker({ value, onChange, suggestions = ROOM_EQUIPMENT_SUGGESTIONS, label = "Équipements" }: Props) {
  const [draft, setDraft] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const has = (name: string) => value.some((v) => v.toLowerCase() === name.toLowerCase());
  const custom = value.filter((v) => !suggestions.some((s) => s.toLowerCase() === v.toLowerCase()));

  function toggle(name: string) {
    onChange(has(name) ? value.filter((v) => v.toLowerCase() !== name.toLowerCase()) : [...value, name]);
  }

  function add() {
    const name = draft.replace(/\s+/g, " ").trim();
    if (name.length < 2) return setNote("Écrivez au moins 2 caractères.");
    if (name.length > 60) return setNote("60 caractères maximum.");
    if (has(name)) {
      setNote("Déjà dans la liste.");
      return;
    }
    if (value.length >= 40) return setNote("40 équipements au maximum.");
    onChange([...value, name]);
    setDraft("");
    setNote(null);
  }

  const chip = (name: string, removable: boolean) => (
    <li key={name}>
      <button
        type="button"
        onClick={() => toggle(name)}
        aria-pressed={has(name)}
        className={`rounded-full border px-3 py-1.5 text-sm ${
          has(name) ? "border-[var(--color-teal-600)] bg-[var(--color-teal-100)] text-[var(--color-teal)]" : "border-[var(--color-border)] text-slate-600"
        }`}
      >
        {has(name) ? "✓ " : ""}
        {name}
        {removable && <span aria-hidden="true"> ✕</span>}
      </button>
    </li>
  );

  return (
    <fieldset>
      <legend className="text-xs font-medium text-slate-500">{label}</legend>
      <ul className="mt-2 flex flex-wrap gap-2">
        {suggestions.map((s) => chip(s, false))}
        {custom.map((c) => chip(c, true))}
      </ul>
      <div className="mt-2 flex gap-2">
        <input
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setNote(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Un autre équipement…"
          aria-label="Ajouter un équipement"
          maxLength={60}
          className="min-w-0 flex-1 rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-ink)]"
        />
        <button
          type="button"
          onClick={add}
          aria-label="Ajouter cet équipement"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-teal)] text-xl font-semibold text-white"
        >
          +
        </button>
      </div>
      {note && <p className="mt-1 text-xs text-red-500">{note}</p>}
    </fieldset>
  );
}

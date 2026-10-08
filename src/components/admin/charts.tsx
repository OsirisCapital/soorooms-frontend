"use client";

import Link from "next/link";
import { useId, useState, type KeyboardEvent } from "react";

/** Pastille de chiffre clé. `href` en fait un lien (ex. identités à examiner). */
export function StatTile({
  label,
  value,
  hint,
  href,
  hero = false,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  href?: string;
  hero?: boolean;
  tone?: "default" | "alert";
}) {
  const body = (
    <>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 font-bold text-[var(--color-ink)] ${hero ? "text-3xl" : "text-2xl"}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </>
  );
  const base = `rounded-2xl p-4 shadow-sm ${hero ? "col-span-2 bg-[var(--color-teal-100)]" : "bg-white"} ${
    tone === "alert" ? "ring-2 ring-[var(--color-terracotta)]" : ""
  }`;
  return href ? (
    <Link href={href} className={`${base} block transition active:scale-[0.99]`}>
      {body}
    </Link>
  ) : (
    <div className={base}>{body}</div>
  );
}

const shortDay = (key: string) => {
  const [, m, d] = key.split("-");
  return `${d}/${m}`;
};
const longDay = (key: string) =>
  new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${key}T12:00:00Z`));

const W = 640;
const H = 180;
const PAD = { top: 12, right: 22, bottom: 28, left: 22 };

/**
 * Courbe ou barres par jour. Survol ou clavier (flèches) : info-bulle ; un tableau équivalent est
 * proposé sous le graphique. Une seule série, donc pas de légende : le titre la nomme.
 */
export function DailyChart({
  title,
  days,
  values,
  kind,
  color,
  format = (n) => n.toLocaleString("fr-FR"),
  unit,
}: {
  title: string;
  days: string[];
  values: number[];
  kind: "bar" | "line";
  color: string;
  format?: (n: number) => string;
  unit: string;
}) {
  const uid = useId();
  const [active, setActive] = useState<number | null>(null);
  const n = days.length;
  const max = Math.max(1, ...values);
  const total = values.reduce((a, b) => a + b, 0);
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const slot = innerW / Math.max(1, n);
  const x = (i: number) => PAD.left + slot * i + slot / 2;
  const y = (v: number) => PAD.top + innerH - (v / max) * innerH;
  const barW = Math.min(24, Math.max(3, slot * 0.6));
  const tickEvery = n > 45 ? 14 : n > 14 ? 7 : 1;

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") setActive((a) => Math.min(n - 1, (a ?? -1) + 1));
    else if (e.key === "ArrowLeft") setActive((a) => Math.max(0, (a ?? n) - 1));
    else if (e.key === "Escape") setActive(null);
    else return;
    e.preventDefault();
  };

  const tip = active !== null ? { i: active, left: (x(active) / W) * 100 } : null;

  return (
    <figure className="rounded-2xl bg-white p-4 shadow-sm">
      <figcaption className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-semibold text-[var(--color-ink)]">{title}</span>
        <span className="text-xs text-slate-500">
          Total : {format(total)} {unit}
        </span>
      </figcaption>

      <div className="relative mt-3">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full touch-pan-y outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-teal)]"
          role="img"
          tabIndex={0}
          aria-label={`${title}, ${n} derniers jours. Flèches gauche et droite pour parcourir.`}
          onKeyDown={onKey}
          onBlur={() => setActive(null)}
          onMouseLeave={() => setActive(null)}
        >
          {[0.5, 1].map((f) => (
            <line key={f} x1={PAD.left} x2={W - PAD.right} y1={PAD.top + innerH * (1 - f)} y2={PAD.top + innerH * (1 - f)} stroke="var(--color-border)" strokeWidth={1} />
          ))}
          <line x1={PAD.left} x2={W - PAD.right} y1={PAD.top + innerH} y2={PAD.top + innerH} stroke="var(--color-border)" strokeWidth={1} />

          {kind === "bar" &&
            values.map((v, i) => {
              const h = Math.max(v > 0 ? 2 : 0, (v / max) * innerH);
              return <path key={days[i]} d={roundedTop(x(i) - barW / 2, PAD.top + innerH - h, barW, h, 4)} fill={color} opacity={active === null || active === i ? 1 : 0.45} />;
            })}

          {kind === "line" && (
            <>
              <polyline fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" points={values.map((v, i) => `${x(i)},${y(v)}`).join(" ")} />
              {active !== null && <circle cx={x(active)} cy={y(values[active])} r={5} fill={color} stroke="#fff" strokeWidth={2} />}
            </>
          )}

          {days.map((d, i) =>
            (i % tickEvery === 0 && n - 1 - i >= tickEvery / 2) || i === n - 1 ? (
              <text key={d} x={x(i)} y={H - 7} textAnchor="middle" fontSize={17} fill="var(--color-slate-500, #64748b)">
                {shortDay(d)}
              </text>
            ) : null,
          )}

          {/* Zones de survol : plus larges que les marques. */}
          {days.map((d, i) => (
            <rect key={d} x={PAD.left + slot * i} y={0} width={slot} height={H} fill="transparent" onMouseEnter={() => setActive(i)} onTouchStart={() => setActive(i)} />
          ))}
        </svg>

        {tip && (
          <div
            role="status"
            className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-lg bg-[var(--color-ink)] px-2.5 py-1.5 text-xs text-white shadow-lg"
            style={{ left: `${Math.min(88, Math.max(12, tip.left))}%` }}
          >
            <span className="block text-[11px] opacity-80">{longDay(days[tip.i])}</span>
            <span className="font-semibold">
              {format(values[tip.i])} {unit}
            </span>
          </div>
        )}
      </div>

      <details className="mt-2 text-xs text-slate-600">
        <summary className="cursor-pointer select-none font-semibold text-[var(--color-teal)]">Voir en tableau</summary>
        <div className="mt-2 max-h-48 overflow-y-auto">
          <table className="w-full text-left" aria-label={`${title} par jour`} id={`${uid}-table`}>
            <thead>
              <tr>
                <th className="py-1 font-semibold">Jour</th>
                <th className="py-1 text-right font-semibold">{unit}</th>
              </tr>
            </thead>
            <tbody>
              {days.map((d, i) => (
                <tr key={d} className="border-t border-[var(--color-border)]">
                  <td className="py-1">{longDay(d)}</td>
                  <td className="py-1 text-right">{format(values[i])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}

/** Rectangle dont seul le haut est arrondi (le pied reste posé sur la ligne de base). */
function roundedTop(x0: number, y0: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h);
  return `M${x0},${y0 + h} V${y0 + rr} Q${x0},${y0} ${x0 + rr},${y0} H${x0 + w - rr} Q${x0 + w},${y0} ${x0 + w},${y0 + rr} V${y0 + h} Z`;
}

/** Liste de barres horizontales fines : répartition par statut, villes… Le chiffre est toujours écrit. */
export function BarList({ title, rows, color }: { title: string; rows: Array<{ label: string; value: number }>; color: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-[var(--color-ink)]">{title}</h3>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">Rien à afficher pour le moment.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {rows.map((row) => (
            <li key={row.label}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="text-[var(--color-ink)]">{row.label}</span>
                <span className="font-semibold text-[var(--color-ink)]">{row.value.toLocaleString("fr-FR")}</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-[var(--color-cream)]">
                <div className="h-2 rounded-full" style={{ width: `${(row.value / max) * 100}%`, minWidth: row.value > 0 ? 4 : 0, background: color }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

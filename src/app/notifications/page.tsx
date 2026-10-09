"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { EmailPreference } from "@/components/EmailPreference";
import { Logo } from "@/components/Logo";
import {
  isInternalPath,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from "@/lib/notifications-api";
import { refreshUnread, setUnreadCount } from "@/lib/use-unread-count";
import { useAsyncData } from "@/lib/use-async-data";

function timeAgo(iso: string) {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  if (hours < 48) return "Hier";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function List({ filter }: { filter: "all" | "unread" }) {
  const router = useRouter();
  const first = useAsyncData(`notifications-${filter}`, () => listNotifications({ unreadOnly: filter === "unread" }));
  const [more, setMore] = useState<{ items: AppNotification[]; hasMore: boolean } | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [allRead, setAllRead] = useState(false);

  if (first.loading) return <div className="h-40 animate-pulse rounded-2xl bg-[var(--color-cream-soft)]" />;
  if (first.error || !first.data) return <p className="text-sm text-red-500">{first.error ?? "Notifications indisponibles."}</p>;

  const items = [...first.data.items, ...(more?.items ?? [])];
  const hasMore = more ? more.hasMore : first.data.hasMore;
  const isUnread = (n: AppNotification) => n.readAt === null && !allRead && !readIds.includes(n.id);

  async function open(n: AppNotification) {
    if (isUnread(n)) {
      setReadIds((prev) => [...prev, n.id]);
      markNotificationRead(n.id).then((r) => setUnreadCount(r.count), () => void refreshUnread());
    }
    if (isInternalPath(n.linkUrl)) router.push(n.linkUrl);
  }

  async function readAll() {
    setAllRead(true);
    setUnreadCount(0);
    try {
      await markAllNotificationsRead();
    } catch {
      setAllRead(false);
      void refreshUnread();
    }
  }

  async function loadMore() {
    const last = items[items.length - 1];
    if (!last) return;
    setLoadingMore(true);
    try {
      const page = await listNotifications({ unreadOnly: filter === "unread", before: last.createdAt });
      setMore((prev) => ({ items: [...(prev?.items ?? []), ...page.items], hasMore: page.hasMore }));
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <>
      <button type="button" onClick={readAll} className="mb-4 text-sm text-[var(--color-teal-600)]">
        Tout marquer comme lu
      </button>
      {items.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-center text-slate-600 shadow-sm">
          {filter === "unread" ? "Aucune notification non lue." : "Aucune notification pour le moment."}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((n) => {
            const unread = isUnread(n);
            return (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => open(n)}
                  className={`flex w-full items-start gap-4 rounded-2xl p-4 text-left shadow-sm ${unread ? "bg-white ring-1 ring-[var(--color-terracotta)]/30" : "bg-white/70"}`}
                >
                  <Logo size={40} withWordmark={false} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="flex items-center gap-2 font-semibold text-[var(--color-ink)]">
                        {unread && <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--color-terracotta)]" aria-label="Non lue" />}
                        {n.title}
                      </p>
                      <span className="shrink-0 text-xs text-slate-500">{timeAgo(n.createdAt)}</span>
                    </div>
                    <p className="mt-0.5 text-sm text-[var(--color-ink)]">{n.body}</p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {hasMore && (
        <button
          type="button"
          onClick={loadMore}
          disabled={loadingMore}
          className="mt-4 w-full rounded-full border border-[var(--color-border)] bg-white py-3 text-sm font-semibold text-[var(--color-teal)] disabled:opacity-60"
        >
          {loadingMore ? "Chargement…" : "Voir plus"}
        </button>
      )}
    </>
  );
}

export default function NotificationsPage() {
  const [filter, setFilter] = useState<"all" | "unread">("all");

  return (
    <AppShell title="Notifications">
      <EmailPreference />
      <div className="mb-4 flex justify-end">
        <div className="flex rounded-full bg-[var(--color-cream-soft)] p-1 text-sm font-medium">
          {(["all", "unread"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              aria-pressed={filter === value}
              className={`rounded-full px-4 py-1.5 ${filter === value ? "bg-white text-[var(--color-teal)] shadow-sm" : "text-slate-500"}`}
            >
              {value === "all" ? "Toutes" : "Non lues"}
            </button>
          ))}
        </div>
      </div>
      <List key={filter} filter={filter} />
    </AppShell>
  );
}

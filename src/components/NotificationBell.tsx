"use client";

import Link from "next/link";
import { Icon } from "@/components/Icon";
import { useUnreadCount } from "@/lib/use-unread-count";

/** Cloche de l'en-tête, avec le nombre de notifications non lues. */
export function NotificationBell({ className }: { className?: string }) {
  const unread = useUnreadCount();
  const label = unread > 0 ? `Notifications, ${unread} non lue${unread > 1 ? "s" : ""}` : "Notifications";
  return (
    <Link href="/notifications" aria-label={label} className={`relative ${className ?? ""}`}>
      <Icon name="bell" size={20} />
      {unread > 0 && (
        <span
          aria-hidden="true"
          className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-terracotta)] px-1 text-[11px] font-bold leading-none text-white ring-2 ring-white"
        >
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}

"use client";

import Link from "next/link";
import { Icon } from "@/components/Icon";
import { useMessageUnread } from "@/lib/use-message-unread";

/** Bulle de l'en-tête, avec le nombre de conversations non lues. */
export function MessagesLink({ className }: { className?: string }) {
  const unread = useMessageUnread();
  const label = unread > 0 ? `Messages, ${unread} conversation${unread > 1 ? "s" : ""} non lue${unread > 1 ? "s" : ""}` : "Messages";
  return (
    <Link href="/messages" aria-label={label} className={`relative ${className ?? ""}`}>
      <Icon name="chat" size={20} />
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

"use client";

import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Conversation as Thread, messageOf } from "@/components/support/parts";
import { Button } from "@/components/ui/Button";
import { type Conversation, getConversation, sendMessage } from "@/lib/messages-api";
import { refreshMessageUnread } from "@/lib/use-message-unread";

const MAX = 2000;

export default function ConversationPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const [conv, setConv] = useState<Conversation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const lastId = useRef<string | null>(null);

  // Ouverture, puis relecture toutes les 10 secondes tant que l'onglet est visible.
  useEffect(() => {
    let cancelled = false;
    const load = () =>
      getConversation(bookingId)
        .then((data) => {
          if (cancelled) return;
          setConv(data);
          setError(null);
          void refreshMessageUnread();
        })
        .catch((err: unknown) => {
          if (!cancelled) setError(messageOf(err));
        });
    void load();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 10_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [bookingId]);

  // Descend en bas seulement quand un nouveau message arrive.
  const newest = conv?.messages.at(-1)?.id ?? null;
  useEffect(() => {
    if (newest && newest !== lastId.current) {
      lastId.current = newest;
      endRef.current?.scrollIntoView({ block: "end" });
    }
  }, [newest]);

  async function send() {
    const content = draft.trim();
    if (!content) return;
    setSendError(null);
    setSending(true);
    try {
      const message = await sendMessage(bookingId, content);
      setConv((c) => (c ? { ...c, messages: [...c.messages, message] } : c));
      setDraft("");
    } catch (err) {
      setSendError(messageOf(err));
    } finally {
      setSending(false);
    }
  }

  return (
    <AppShell title={conv?.counterpart ?? "Conversation"} backHref="/messages">
      {error && !conv && <p className="text-red-500">{error}</p>}
      {!conv && !error && <p className="text-slate-500">Chargement…</p>}
      {conv && (
        <>
          <p className="mb-4 text-xs text-slate-500">{conv.propertyTitle}</p>
          <Thread
            messages={conv.messages.map((m) => ({ id: m.id, mine: m.mine, author: m.author, body: m.content, createdAt: m.sentAt }))}
          />
          <div ref={endRef} />
          {conv.messages.length === 0 && <p className="rounded-2xl bg-white p-4 text-center text-sm text-slate-600 shadow-sm">Écrivez le premier message.</p>}
          <div className="mt-6 flex flex-col gap-3">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              maxLength={MAX}
              placeholder="Votre message…"
              aria-label="Votre message"
              className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm focus:border-[var(--color-teal)] focus:outline-none"
            />
            <p className="text-xs text-slate-400">
              Pour votre sécurité, gardez vos échanges et vos paiements sur SòôRooms.
            </p>
            {sendError && <p className="text-sm text-red-500">{sendError}</p>}
            <Button loading={sending} disabled={draft.trim().length === 0} onClick={send}>
              Envoyer
            </Button>
          </div>
        </>
      )}
    </AppShell>
  );
}

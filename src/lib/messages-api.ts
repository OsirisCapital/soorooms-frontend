/** Appels de la messagerie : une conversation par réservation. */
import { authRequest } from "./api";

export interface ConversationSummary {
  bookingId: string;
  propertyTitle: string;
  bookingStatus: string;
  /** Nom de l'interlocuteur (l'hôte pour un voyageur, le voyageur pour un hôte). */
  counterpart: string;
  lastMessage: { preview: string; sentAt: string; mine: boolean };
  unread: number;
}

export interface ChatMessage {
  id: string;
  mine: boolean;
  author: string;
  content: string;
  sentAt: string;
}

export interface Conversation {
  bookingId: string;
  propertyTitle: string;
  bookingStatus: string;
  counterpart: string;
  messages: ChatMessage[];
}

export const listConversations = () => authRequest<ConversationSummary[]>("/messages/conversations");
export const getUnreadConversations = () => authRequest<{ count: number }>("/messages/unread-count");
export const getConversation = (bookingId: string) => authRequest<Conversation>(`/messages/conversations/${encodeURIComponent(bookingId)}`);
export const sendMessage = (bookingId: string, content: string) =>
  authRequest<ChatMessage>(`/messages/conversations/${encodeURIComponent(bookingId)}`, { method: "POST", body: JSON.stringify({ content }) });

/**
 * Informations de l'éditeur reprises dans les pages légales.
 * À compléter par l'éditeur : tant que CONTACT_EMAIL est vide, les pages
 * renvoient vers la rubrique « Aide et support » de l'application.
 */
export const LEGAL = {
  platform: "SòôRooms",
  publisher: "AlterConcept",
  country: "Cameroun",
  /** Adresse e-mail publique pour les demandes (droits sur les données, signalements). */
  CONTACT_EMAIL: "soorooms00@gmail.com",
  /** Adresse postale ou siège de l'éditeur, si vous souhaitez l'afficher. */
  ADDRESS: "",
  updatedAt: "8 octobre 2026",
};

export const contactSentence = LEGAL.CONTACT_EMAIL
  ? `Pour toute question ou demande, écrivez-nous à ${LEGAL.CONTACT_EMAIL}.`
  : "Pour toute question ou demande, utilisez la rubrique « Aide et support » de votre profil dans l'application.";

/** Un document légal est une suite de sections : titres, paragraphes et listes à puces. */
export type LegalSection = {
  id: string;
  title: string;
  paragraphs?: string[];
  items?: string[];
  /** Paragraphes placés après la liste. */
  after?: string[];
};

export type LegalDocument = {
  title: string;
  /** Date de dernière mise à jour, écrite en toutes lettres. */
  updatedAt: string;
  intro: string[];
  sections: LegalSection[];
};

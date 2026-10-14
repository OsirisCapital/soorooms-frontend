import type { LegalDocument } from "./types";

/**
 * Règlement du programme partenaire, lisible sans compte (avant d'activer son compte partenaire).
 * Les taux et durées indiqués sont ceux en vigueur à la date de mise à jour ; les valeurs exactes sont toujours
 * affichées dans l'espace partenaire, et SòôRooms peut les modifier (section « Modification du programme »).
 */
export const PARTNER_RULES: LegalDocument = {
  title: "Règlement du programme partenaire",
  updatedAt: "14 octobre 2026",
  intro: [
    "Le programme partenaire permet à toute personne de recommander SòôRooms à des hôtes et à des voyageurs avec un lien personnel, et de gagner une part du revenu de SòôRooms sur leurs réservations.",
    "Lisez ce règlement avant d'activer votre compte partenaire : l'activation vaut acceptation. La version acceptée et la date d'acceptation sont conservées.",
  ],
  sections: [
    {
      id: "principe",
      title: "1. Comment ça marche",
      paragraphs: [
        "Après activation, vous recevez un code et un lien (soorooms.com/r/VOTRECODE) avec un QR code. Une personne qui s'inscrit en suivant votre lien devient votre filleul.",
        "À chaque réservation terminée de vos filleuls, une commission est calculée sur le revenu que SòôRooms conserve réellement, puis ajoutée à votre solde. Vous la retirez en argent sur votre compte Mobile Money.",
      ],
    },
    {
      id: "eligibilite",
      title: "2. Qui peut devenir partenaire",
      items: [
        "Toute personne majeure titulaire d'un compte SòôRooms, voyageur ou hôte.",
        "Avoir accepté le présent règlement dans sa version en vigueur.",
        "Pour retirer vos gains : avoir fait vérifier votre identité (pièce d'identité — CNI ou passeport — et photo de votre visage) et disposer d'un compte Mobile Money ouvert à votre nom, tel qu'il figure sur votre pièce d'identité.",
      ],
    },
    {
      id: "ineligibilite",
      title: "3. Qui ne peut pas être partenaire, et quand on cesse de gagner",
      items: [
        "Les membres de l'équipe SòôRooms, quel que soit leur rôle (administration, finance, support, vérification d'identité, agents de terrain, contenu). Ils vérifient, suivent ou départagent les comptes et les réservations : percevoir des commissions sur ces mêmes comptes créerait un conflit d'intérêts.",
        "Une personne qui rejoint l'équipe alors qu'elle est déjà partenaire ne perçoit plus aucune commission tant qu'elle en fait partie. Son compte partenaire est conservé, ses gains déjà acquis restent retirables, et les commissions reprennent si elle quitte l'équipe.",
        "Aucune commission sur vos propres logements, vos propres réservations, ni sur un compte de votre entourage créé pour contourner cette règle. Un hôte payé sur le même numéro Mobile Money que vous n'ouvre aucun droit à commission.",
        "On ne peut avoir qu'un seul parrain, et on ne peut pas être parrainé par quelqu'un que l'on a soi-même parrainé.",
        "Un parrainage doit être enregistré dans les 14 jours qui suivent l'inscription du filleul, et avant sa première réservation.",
        "Un seul niveau : vous ne gagnez rien sur les partenaires que vos filleuls recrutent.",
      ],
    },
    {
      id: "commissions",
      title: "4. Commissions et durées",
      items: [
        "Hôte parrainé : 20 % du revenu de SòôRooms sur chaque réservation, pendant 18 mois à compter de la première réservation payée chez cet hôte.",
        "Voyageur parrainé : 10 % du revenu de SòôRooms sur ses séjours, pendant 6 mois à compter de son inscription.",
        "Plafond : toutes commissions de partenaires confondues, 30 % du revenu de SòôRooms au maximum sur une même réservation.",
        "Le montant est arrondi au franc inférieur. Il est calculé quand la réservation est terminée, annulée ou tranchée par un litige.",
      ],
      after: ["Les taux et les durées en vigueur sont affichés dans votre espace partenaire."],
    },
    {
      id: "remboursements",
      title: "5. Annulations et remboursements",
      paragraphs: [
        "La commission porte sur le revenu que SòôRooms a effectivement conservé. Si une réservation est remboursée en totalité, elle ne rapporte aucune commission ; si elle est remboursée en partie, la commission suit la part de revenu conservée.",
        "Ce qui a déjà été gagné n'est jamais repris : ni SòôRooms ni le partenaire ne sont touchés par un remboursement ultérieur sur une commission déjà acquise.",
      ],
    },
    {
      id: "retrait",
      title: "5 bis. Retrait de vos gains",
      items: [
        "Retrait minimum : 5 000 FCFA, sur un compte MTN Mobile Money ou Orange Money à votre nom.",
        "Chaque retrait est vérifié par l'équipe finance avant l'envoi. Un changement de compte de retrait bloque le retrait pendant 72 heures, par sécurité.",
        "Un retrait refusé remet le montant dans votre solde, avec le motif.",
      ],
    },
    {
      id: "fiscalite",
      title: "6. Impôts",
      paragraphs: [
        "Vos commissions peuvent être imposables et donner lieu à une retenue à la source selon la loi en vigueur. Lorsqu'une retenue s'applique, elle est indiquée sur chaque retrait (montant brut, retenue, montant net). Vous restez responsable de vos obligations fiscales personnelles.",
      ],
    },
    {
      id: "conduite",
      title: "7. Conduite attendue, fraude et suspension",
      items: [
        "Présentez SòôRooms honnêtement : ne vous présentez pas comme un agent officiel de SòôRooms et ne promettez rien qui ne figure pas dans le service.",
        "Pas de démarchage abusif (spam), de faux comptes, de fausses réservations ni de réservations croisées entre proches pour générer des commissions.",
        "En cas de fraude constatée, le compte partenaire est suspendu et les gains non retirés peuvent être perdus. Un manquement moins grave peut donner lieu à un avertissement avant suspension.",
      ],
    },
    {
      id: "modification",
      title: "8. Modification du programme",
      paragraphs: [
        "SòôRooms peut modifier les taux, les durées, le plafond, le minimum de retrait ou le présent règlement, ou suspendre le programme. Les changements s'appliquent aux réservations futures, vous sont notifiés, et un nouveau règlement vous est demandé d'accepter lorsqu'il change.",
      ],
    },
    {
      id: "donnees",
      title: "9. Vos données",
      paragraphs: [
        "Pour vous verser vos gains, nous traitons votre identité, votre pièce d'identité, votre photo et votre numéro Mobile Money. Ces documents restent privés et ne sont consultables que par l'équipe habilitée. Un filleul n'apparaît dans votre tableau de bord que sous la forme « Prénom N. », sans coordonnées. Détails dans la politique de confidentialité.",
      ],
    },
  ],
};

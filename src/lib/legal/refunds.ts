import { contactSentence, LEGAL } from "../legal-info";
import type { LegalDocument } from "./types";

/**
 * Politique d'annulation et de remboursement. PROJET À RELIRE : les délais et pourcentages ci-dessous
 * sont des propositions, à ajuster avant le lancement (ils doivent rester identiques à ce que
 * l'application applique réellement).
 */
export const REFUNDS: LegalDocument = {
  title: "Politique d'annulation et de remboursement",
  updatedAt: "13 octobre 2026",
  intro: [
    `Cette page explique dans quels cas une réservation faite sur ${LEGAL.platform} peut être annulée et remboursée, et combien.`,
    "Votre paiement est conservé en séquestre jusqu'à votre arrivée : tant que l'hôte n'a pas été payé, l'argent est protégé. Les montants et délais ci-dessous s'appliquent aux réservations payées sur la plateforme.",
  ],
  sections: [
    {
      id: "principe",
      title: "1. Le principe",
      items: [
        "Le remboursement est calculé sur le montant que vous avez réellement payé (prix accepté par l'hôte, après négociation éventuelle).",
        "Il est versé à la personne qui a payé, avec le même moyen de paiement lorsque c'est possible (Mobile Money ou carte). Si un proche a payé avec un lien de paiement, c'est lui qui est remboursé.",
        "Les délais ci-dessous se comptent à partir de l'heure d'arrivée prévue, heure du Cameroun.",
      ],
    },
    {
      id: "sejour",
      title: "2. Annulation par le voyageur : séjours à la nuit",
      items: [
        "Plus de 48 heures avant l'arrivée : remboursement de 100 % du prix du séjour.",
        "Entre 48 heures et l'arrivée : remboursement de 50 % du prix du séjour.",
        "Après l'heure d'arrivée, ou si vous ne vous présentez pas : aucun remboursement, sauf litige reconnu (voir plus bas).",
        "Les frais de service de la plateforme sont remboursés lorsque l'annulation donne droit à 100 %, et conservés dans les autres cas.",
      ],
    },
    {
      id: "sieste",
      title: "3. Annulation d'une sieste",
      items: [
        "Au moins 3 heures avant l'heure de début de la sieste : remboursement de 100 %.",
        "Moins de 3 heures avant, ou en cas d'absence : aucun remboursement.",
      ],
    },
    {
      id: "residence",
      title: "4. Résidences étudiantes (semestre ou année)",
      items: [
        "Au moins 7 jours avant la date d'entrée : remboursement de 100 % du forfait.",
        "Moins de 7 jours avant l'entrée : remboursement de 50 % du forfait.",
        "Après l'entrée dans la résidence : pas de remboursement automatique. Écrivez-nous : chaque situation est examinée avec la résidence.",
      ],
    },
    {
      id: "salles",
      title: "5. Salles de fêtes (acompte et solde)",
      items: [
        "La réservation d'une salle se paie en deux temps : un acompte, puis le solde avant la date limite indiquée.",
        "Si le solde n'est pas payé à temps, la réservation est annulée et l'acompte n'est pas remboursé.",
        "Annulation à votre demande au moins 30 jours avant l'événement : l'acompte est remboursé.",
        "Annulation à moins de 30 jours de l'événement : l'acompte n'est pas remboursé. Si le solde a déjà été payé, il est remboursé à 50 %.",
      ],
    },
    {
      id: "groupe",
      title: "6. Réservations de plusieurs chambres",
      paragraphs: [
        "Les règles ci-dessus s'appliquent à l'ensemble de la réservation. Pour n'annuler qu'une partie des chambres, contactez-nous avant la date limite de remboursement : nous la traitons comme une annulation partielle.",
      ],
    },
    {
      id: "hote",
      title: "7. Annulation par l'hôte ou logement non conforme",
      items: [
        "Si l'hôte annule, refuse l'arrivée ou ne peut pas vous loger : remboursement de 100 % du montant payé, frais de service compris.",
        "Si le logement ne correspond pas à l'annonce (propreté, équipements essentiels absents, logement différent), ouvrez un litige. Selon l'examen, le remboursement peut être total ou partiel.",
        "Dans ces cas, nous pouvons vous aider à trouver un autre logement.",
      ],
    },
    {
      id: "litige",
      title: "8. Comment signaler un problème",
      items: [
        "Signalez le problème dès votre arrivée, et avant de confirmer votre séjour dans l'application : tant que vous n'avez pas confirmé, l'argent reste en séquestre.",
        "Décrivez ce qui ne va pas et ajoutez des photos si possible.",
        "Nous écoutons le voyageur et l'hôte, puis nous décidons : remboursement total, remboursement partiel ou reversement à l'hôte. Les fonds restent bloqués pendant l'examen.",
      ],
    },
    {
      id: "delai",
      title: "9. Délai et mode de remboursement",
      paragraphs: [
        "Une fois l'annulation ou la décision validée, le remboursement est lancé rapidement. Le délai d'arrivée de l'argent sur votre compte dépend ensuite de votre opérateur ou de votre banque, et peut atteindre quelques jours ouvrables.",
        "Si vous ne voyez rien passé ce délai, écrivez-nous en indiquant la date et le montant du paiement.",
      ],
    },
    {
      id: "contact",
      title: "10. Demander une annulation",
      paragraphs: [
        "Pour annuler une réservation, utilisez la rubrique « Aide et support » de votre profil en indiquant la réservation concernée.",
        contactSentence,
      ],
    },
  ],
};

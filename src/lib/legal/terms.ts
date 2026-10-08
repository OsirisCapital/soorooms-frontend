import { contactSentence, LEGAL } from "../legal-info";
import type { LegalDocument } from "./types";

export const TERMS: LegalDocument = {
  title: "Conditions d'utilisation",
  updatedAt: LEGAL.updatedAt,
  intro: [
    `Bienvenue sur ${LEGAL.platform}, la plateforme camerounaise de réservation de logements (hôtels, appartements meublés, chambres d'hôtes, résidences étudiantes) éditée par ${LEGAL.publisher}.`,
    "En créant un compte ou en utilisant l'application, vous acceptez les présentes conditions. Lisez-les attentivement : elles expliquent ce que nous faisons, ce que nous attendons de vous et comment votre argent est protégé.",
  ],
  sections: [
    {
      id: "objet",
      title: "1. Ce que fait SòôRooms",
      paragraphs: [
        `${LEGAL.platform} met en relation des voyageurs et des hôtes. Nous fournissons l'outil qui permet de publier une annonce, de la trouver, de réserver et de payer en sécurité.`,
        "Le contrat de séjour est conclu entre le voyageur et l'hôte. SòôRooms n'est pas propriétaire des logements, n'en assure pas la gestion et n'est pas l'hôtelier : nous intervenons comme intermédiaire technique et comme tiers de confiance pour le paiement.",
      ],
    },
    {
      id: "compte",
      title: "2. Votre compte",
      items: [
        "Vous devez avoir au moins 18 ans et la capacité de conclure un contrat.",
        "Les informations que vous donnez (nom, téléphone, e-mail) doivent être exactes et tenues à jour.",
        "Votre mot de passe est personnel. Vous êtes responsable de ce qui est fait depuis votre compte : prévenez-nous sans délai si vous pensez qu'il a été utilisé par quelqu'un d'autre.",
        "Un compte par personne. Nous pouvons vous demander de confirmer votre adresse e-mail ou votre numéro de téléphone.",
      ],
    },
    {
      id: "voyageurs",
      title: "3. Réserver en tant que voyageur",
      items: [
        "Les prix sont affichés en francs CFA (FCFA). Le prix total, les dates et les conditions propres au logement vous sont présentés avant le paiement.",
        "Une réservation est confirmée une fois le paiement reçu. Vous recevez alors une confirmation dans l'application et par e-mail.",
        "Vous vous engagez à respecter le logement, le règlement de l'hôte, le nombre de personnes prévu et les voisins.",
        "Les conditions d'annulation et de remboursement applicables sont celles indiquées sur l'annonce au moment de la réservation.",
      ],
    },
    {
      id: "paiement",
      title: "4. Paiement et séquestre",
      paragraphs: [
        "Les paiements sont traités par un prestataire de paiement tiers (Mobile Money MTN, Orange Money ou carte, selon les moyens proposés). SòôRooms ne conserve ni votre code secret Mobile Money ni les données de votre carte.",
        "Pour vous protéger, la somme versée est conservée en séquestre : l'hôte n'est pas payé tout de suite. Elle lui est reversée après l'arrivée et la confirmation du séjour, selon les règles affichées dans l'application.",
      ],
      items: [
        "Si le logement n'est pas conforme à l'annonce, ou si l'hôte n'honore pas la réservation, vous pouvez ouvrir un litige. Les fonds restent alors bloqués le temps de l'examen.",
        "Nous examinons les litiges de bonne foi, en écoutant les deux parties et en nous appuyant sur les messages, photos et pièces transmis. Notre décision peut conduire à un remboursement total ou partiel, ou au reversement à l'hôte.",
        "Des frais de service ou une commission peuvent s'appliquer ; ils vous sont indiqués avant que vous ne validiez une réservation ou une annonce.",
      ],
    },
    {
      id: "hotes",
      title: "5. Publier un logement en tant qu'hôte",
      items: [
        "Vous devez être le propriétaire du logement ou avoir le droit de le proposer à la location, et respecter les lois applicables (autorisations, déclaration d'activité, fiscalité).",
        "Votre annonce doit être exacte : description, adresse approximative, équipements, prix, règles. Les photos doivent être réelles, récentes et vous appartenir ou être utilisées avec l'accord de leur auteur.",
        "Vous honorez les réservations confirmées. Une annulation répétée de votre part peut entraîner la suspension de vos annonces.",
        "Vous gardez le calendrier à jour afin d'éviter les doubles réservations.",
      ],
    },
    {
      id: "verification",
      title: "6. Vérification d'identité des hôtes",
      paragraphs: [
        "Pour la sécurité de tous, nous vérifions l'identité des hôtes avant de publier leurs annonces : pièce d'identité et, selon le cas, justificatif de domicile.",
        "Ces documents sont stockés de manière privée et ne sont jamais affichés publiquement. Seuls des administrateurs habilités peuvent les consulter, via un lien temporaire, et chaque consultation est enregistrée. Ils ne servent qu'à cette vérification. Pour plus de détails, voir la Politique de confidentialité.",
        "Nous pouvons accepter, refuser ou demander un complément. Un refus peut être motivé ; vous pouvez soumettre une nouvelle demande.",
      ],
    },
    {
      id: "contenus",
      title: "7. Vos contenus (photos, avis, messages)",
      paragraphs: [
        "Vous restez propriétaire des contenus que vous publiez. Vous nous accordez le droit non exclusif de les héberger, de les afficher et de les adapter techniquement (redimensionnement, compression) pour faire fonctionner et promouvoir la plateforme, tant que le contenu est en ligne.",
        "Les avis doivent refléter une expérience réelle. Nous pouvons retirer un contenu illicite, trompeur ou contraire aux présentes conditions.",
      ],
    },
    {
      id: "interdits",
      title: "8. Ce qui est interdit",
      items: [
        "Publier de fausses annonces, usurper l'identité d'une personne ou fournir de faux documents.",
        "Contourner la plateforme pour éviter le paiement sécurisé ou les frais, par exemple en demandant à être payé hors de l'application pour une réservation faite sur SòôRooms.",
        "Harceler, menacer, discriminer ou diffuser des propos haineux ou illicites.",
        "Utiliser la plateforme pour des activités illégales, y compris l'exploitation de personnes.",
        "Tenter d'accéder sans autorisation aux comptes ou aux systèmes, perturber le service, collecter les données des utilisateurs de façon automatisée ou envoyer du courrier indésirable.",
      ],
    },
    {
      id: "propriete",
      title: "9. Propriété intellectuelle",
      paragraphs: [
        `La marque ${LEGAL.platform}, le logo, l'application, ses textes, son design et son code appartiennent à ${LEGAL.publisher} ou à ses concédants. Aucun droit ne vous est cédé en dehors du droit personnel d'utiliser l'application conformément aux présentes conditions.`,
      ],
    },
    {
      id: "responsabilite",
      title: "10. Responsabilité",
      paragraphs: [
        "Nous mettons tout en œuvre pour que le service soit disponible et fiable, mais nous ne pouvons pas garantir qu'il fonctionne sans interruption ni erreur (maintenance, coupure de réseau, défaillance d'un prestataire, cas de force majeure).",
        "Nous ne sommes pas responsables de la qualité des logements ni des actes des hôtes ou des voyageurs, au-delà de nos obligations d'intermédiaire et de gardien des fonds en séquestre. Rien dans ces conditions ne limite les droits que la loi vous reconnaît, notamment en tant que consommateur, ni notre responsabilité en cas de faute lourde ou dolosive.",
      ],
    },
    {
      id: "suspension",
      title: "11. Suspension et fermeture du compte",
      paragraphs: [
        "Vous pouvez demander la fermeture de votre compte à tout moment en nous contactant, sous réserve du traitement des réservations en cours.",
        "Nous pouvons suspendre ou fermer un compte, avec explication, en cas de manquement grave ou répété aux présentes conditions, de fraude, ou d'atteinte à la sécurité des autres utilisateurs.",
      ],
    },
    {
      id: "donnees",
      title: "12. Données personnelles",
      paragraphs: [
        "Nous traitons vos données personnelles conformément à la législation camerounaise sur la protection des données à caractère personnel. La Politique de confidentialité explique ce que nous collectons, pourquoi, avec qui nous le partageons et comment exercer vos droits.",
      ],
    },
    {
      id: "modifications",
      title: "13. Modifications des conditions",
      paragraphs: [
        "Nous pouvons faire évoluer ces conditions, par exemple pour ajouter une fonctionnalité ou répondre à une obligation légale. En cas de changement important, nous vous en informons dans l'application ou par e-mail avant son entrée en vigueur. Continuer à utiliser SòôRooms après cette date vaut acceptation ; si vous refusez, vous pouvez demander la fermeture de votre compte.",
      ],
    },
    {
      id: "droit",
      title: "14. Droit applicable et règlement des différends",
      paragraphs: [
        "Les présentes conditions sont régies par le droit camerounais. En cas de désaccord, nous vous invitons d'abord à nous contacter pour chercher une solution amiable. À défaut, les juridictions camerounaises compétentes seront saisies, sans préjudice des règles protectrices applicables aux consommateurs.",
      ],
    },
    {
      id: "contact",
      title: "15. Nous contacter",
      paragraphs: [
        `${LEGAL.platform} est édité par ${LEGAL.publisher}, ${LEGAL.country}.${LEGAL.ADDRESS ? ` Adresse : ${LEGAL.ADDRESS}.` : ""}`,
        contactSentence,
      ],
    },
  ],
};

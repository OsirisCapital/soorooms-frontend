import { contactSentence, LEGAL } from "../legal-info";
import type { LegalDocument } from "./types";

export const PRIVACY: LegalDocument = {
  title: "Politique de confidentialité",
  updatedAt: LEGAL.updatedAt,
  intro: [
    `Chez ${LEGAL.platform}, vos données personnelles ne sont ni vendues ni louées. Cette politique explique, simplement, quelles données nous collectons, pourquoi, qui peut les voir, combien de temps nous les gardons et comment exercer vos droits.`,
    `Responsable du traitement : ${LEGAL.publisher}, éditeur de ${LEGAL.platform}, ${LEGAL.country}. Nous appliquons la loi camerounaise n° 2024/017 du 23 décembre 2024 portant protection des données à caractère personnel, ainsi que les textes sur la cybersécurité et le commerce électronique.`,
  ],
  sections: [
    {
      id: "donnees",
      title: "1. Les données que nous collectons",
      paragraphs: ["Nous ne collectons que ce qui est nécessaire au service."],
      items: [
        "Compte : nom complet, numéro de téléphone, adresse e-mail, mot de passe (conservé uniquement sous forme chiffrée, jamais en clair). Si vous vous connectez avec Google : nom, adresse e-mail et identifiant Google.",
        "Vérification d'identité des hôtes : copie de la pièce d'identité et, le cas échéant, justificatif de domicile.",
        "Annonces : description du logement, adresse, photos, prix, disponibilités.",
        "Réservations et paiements : dates, montants, statut, références de transaction, moyen de paiement choisi. Nous ne voyons ni votre code secret Mobile Money ni les données complètes de votre carte, traitées par notre prestataire de paiement.",
        "Échanges : messages entre voyageurs et hôtes, avis, signalements et litiges.",
        "Données techniques : adresse IP, type d'appareil et de navigateur, journaux de connexion, erreurs. Elles servent à la sécurité et au bon fonctionnement.",
        "Appareil : l'application enregistre sur votre appareil des jetons de session pour vous garder connecté, et des préférences (favoris, par exemple). Nous n'utilisons pas de cookies publicitaires.",
      ],
    },
    {
      id: "finalites",
      title: "2. Pourquoi nous les utilisons",
      items: [
        "Créer et sécuriser votre compte, vous identifier, réinitialiser votre mot de passe (exécution du contrat).",
        "Permettre la recherche, la réservation, le paiement en séquestre et le reversement aux hôtes (exécution du contrat).",
        "Vérifier l'identité des hôtes et prévenir la fraude (intérêt légitime de sécurité de la plateforme, et obligations légales).",
        "Vous envoyer les e-mails et notifications liés à votre compte et à vos réservations : confirmation, rappel, litige (exécution du contrat).",
        "Traiter les litiges et répondre à vos demandes d'assistance (exécution du contrat, intérêt légitime).",
        "Améliorer le service et mesurer son bon fonctionnement, à partir de données techniques (intérêt légitime).",
        "Respecter nos obligations légales, comptables et fiscales.",
      ],
      after: [
        "Nous ne vous envoyons des informations promotionnelles qu'avec votre accord, que vous pouvez retirer à tout moment. Nous ne prenons aucune décision uniquement automatisée produisant un effet juridique sur vous.",
      ],
    },
    {
      id: "documents",
      title: "3. Pièces d'identité : un traitement renforcé",
      paragraphs: ["Les pièces d'identité sont des données sensibles. Nous les protégeons ainsi :"],
      items: [
        "Elles sont stockées en accès privé : l'adresse enregistrée en base ne permet pas, à elle seule, de les ouvrir.",
        "Seuls des administrateurs habilités y accèdent, uniquement pour examiner votre demande, par un lien qui expire au bout de quelques minutes.",
        "Chaque consultation est enregistrée (qui, quel document, quand) ; le contenu du document n'est jamais écrit dans nos journaux.",
        "Elles ne sont ni publiées, ni utilisées à d'autres fins, ni transmises à des tiers, sauf obligation légale ou demande d'une autorité compétente.",
      ],
    },
    {
      id: "destinataires",
      title: "4. Qui peut voir vos données",
      paragraphs: [
        "Entre utilisateurs : l'hôte voit le nom, le contact nécessaire et les dates d'un voyageur qui a réservé chez lui ; le voyageur voit les informations de son hôte et de son annonce. Votre mot de passe et vos pièces d'identité ne sont jamais montrés aux autres utilisateurs.",
        "Nos prestataires techniques, qui agissent sur nos instructions et seulement pour fournir leur service :",
      ],
      items: [
        "Hébergement de l'application et du serveur : Vercel et Render.",
        "Base de données : Neon (PostgreSQL).",
        "Stockage des images et documents : Cloudinary.",
        "Envoi des e-mails : Brevo.",
        "Paiement : Notch Pay, avec les opérateurs de Mobile Money et les banques concernés.",
        "Connexion avec Google, si vous choisissez cette option : Google.",
      ],
      after: [
        "Nous pouvons aussi communiquer des données à une autorité judiciaire ou administrative lorsque la loi l'exige. Nous ne vendons jamais vos données.",
      ],
    },
    {
      id: "transferts",
      title: "5. Hébergement et transferts hors du Cameroun",
      paragraphs: [
        "Certains de nos prestataires hébergent leurs serveurs hors du Cameroun. Nous choisissons des prestataires qui appliquent des mesures de sécurité reconnues, nous limitons les données transmises au strict nécessaire, et nous respectons les conditions posées par la loi camerounaise pour les transferts de données vers l'étranger.",
      ],
    },
    {
      id: "duree",
      title: "6. Combien de temps nous les gardons",
      items: [
        "Compte et profil : tant que votre compte est actif, puis supprimés ou anonymisés dans un délai raisonnable après sa fermeture.",
        "Pièces d'identité des hôtes : le temps nécessaire à la vérification et à la relation avec l'hôte, puis supprimées dans un délai maximal de 12 mois après la fermeture du compte, sauf obligation légale de les conserver plus longtemps.",
        "Réservations, paiements et factures : dix ans, conformément aux règles comptables et fiscales applicables.",
        "Messages et avis : tant que le compte existe, ou le temps d'un litige en cours.",
        "Journaux techniques : quelques mois, pour la sécurité et le diagnostic.",
      ],
    },
    {
      id: "droits",
      title: "7. Vos droits",
      paragraphs: ["Vous pouvez à tout moment :"],
      items: [
        "accéder aux données que nous détenons sur vous ;",
        "faire corriger celles qui sont inexactes ou incomplètes ;",
        "demander leur suppression (« droit à l'oubli »), dans les limites des obligations légales de conservation ;",
        "vous opposer à un traitement, notamment à la prospection commerciale ;",
        "retirer votre consentement lorsque le traitement repose dessus, sans effet sur ce qui a eu lieu avant.",
      ],
      after: [
        contactSentence,
        "Nous répondons dans un délai raisonnable, après avoir vérifié votre identité. Si vous estimez que vos droits ne sont pas respectés, vous pouvez saisir l'autorité camerounaise chargée de la protection des données à caractère personnel.",
      ],
    },
    {
      id: "securite",
      title: "8. Comment nous protégeons vos données",
      items: [
        "Connexions chiffrées (HTTPS) entre votre appareil et nos serveurs.",
        "Mots de passe conservés sous forme chiffrée et irréversible.",
        "Accès aux données limité aux personnes qui en ont besoin, avec traçabilité des accès aux documents sensibles.",
        "Séparation des documents privés et des photos publiques, et liens temporaires pour les documents.",
        "En cas d'incident de sécurité touchant vos données, nous vous informons ainsi que l'autorité compétente, dans les conditions prévues par la loi.",
      ],
      after: ["Aucun système n'est invulnérable : choisissez un mot de passe fort et ne le partagez avec personne."],
    },
    {
      id: "mineurs",
      title: "9. Mineurs",
      paragraphs: [`${LEGAL.platform} est réservé aux personnes de 18 ans et plus. Si vous pensez qu'un mineur a créé un compte, contactez-nous pour que nous le supprimions.`],
    },
    {
      id: "modifications",
      title: "10. Modifications de cette politique",
      paragraphs: [
        "Nous pouvons mettre à jour cette politique, par exemple si nous ajoutons une fonctionnalité qui utilise de nouvelles données. La date de mise à jour figure en haut de la page. En cas de changement important, nous vous informons dans l'application ou par e-mail.",
      ],
    },
    {
      id: "contact",
      title: "11. Nous contacter",
      paragraphs: [`${LEGAL.publisher}, ${LEGAL.country}.${LEGAL.ADDRESS ? ` ${LEGAL.ADDRESS}.` : ""}`, contactSentence],
    },
  ],
};

# SòôRooms — Frontend (Next.js PWA)

Application web installable (PWA) de réservation de logements au Cameroun.
Ce dossier ne contient que le frontend ; le backend NestJS est dans le
dossier `soorooms`.

## Démarrage

1. `npm install`
2. Copier `.env.local.example` vers `.env.local` (`NEXT_PUBLIC_API_URL` =
   `http://localhost:3000`, l'adresse du backend).
3. Lancer d'abord le backend (`npm run start:dev` dans `soorooms`, port 3000).
4. `npm run dev` ici — l'application tourne sur **http://localhost:3001**.

## Écrans construits

- Accès : `/` (splash), `/login`, `/register`, `/forgot-password`, `/reset-password`, `/auth/callback` (retour Google)
- Voyageur : `/home`, `/explorer`, `/logements/[id]`, `/favoris`, `/profil/**` (informations, réservations, paramètres, aide), détail et négociation d'une réservation
- Hôte : `/hote` (tableau de bord), `/hote/logements/**` (création, édition, chambres, photos, publication), `/hote/reservations/**`, demande de KYC (`/profil/parametres/hote`)
- Administration : `/admin` (validation KYC, liste des litiges)

## Écrans provisoires (« bientôt »)

`/messages`, `/notifications`, `/profil/paiements`, `/profil/avis`.

## Choix produit

- Connexion/inscription par **téléphone** (identifiant technique du backend),
  saisi avec ou sans « +237 » : le backend normalise en `+237XXXXXXXXX`.

## Limites connues

- **Connexion Google** : demande de vrais identifiants Google côté backend
  (`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`) ; le backend redirige ensuite
  vers `/auth/callback#accessToken=…&refreshToken=…`.
- **Paiement** : l'intégration Notch Pay du backend n'est pas encore écrite ;
  le bouton de paiement échoue tant qu'elle n'est pas faite.
- Le logo est une **recréation SVG** (`src/components/Logo.tsx`, `public/icon.svg`)
  à remplacer par le fichier officiel.
- Le service worker est minimal (installation uniquement, pas de hors-ligne).

/**
 * Service worker volontairement minimal : il suffit à rendre l'application
 * installable sur l'écran d'accueil. Aucune mise en cache hors-ligne pour
 * l'instant — une stratégie de cache (pages consultées, images de
 * logements) demande de vraies décisions produit et sera ajoutée plus tard.
 */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {
  // Passage direct au réseau — le simple fait de déclarer ce gestionnaire
  // satisfait le critère d'installabilité de certains navigateurs.
});

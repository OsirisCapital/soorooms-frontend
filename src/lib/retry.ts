/**
 * Réessaie une opération asynchrone tant qu'elle échoue pour une raison passagère.
 *
 * Sert surtout au backend hébergé gratuitement chez Render : après 15 minutes sans trafic il
 * s'endort, et son réveil prend environ une minute pendant lesquelles les requêtes n'aboutissent
 * pas. Une page qui abandonne au premier échec accuserait à tort l'utilisateur ou son lien.
 */
export interface RetryOptions {
  /** Nombre de nouveaux essais après le premier. */
  retries: number;
  delayMs: number;
  /** L'erreur est-elle passagère ? Sinon on la renvoie tout de suite, sans réessayer. */
  shouldRetry: (error: unknown) => boolean;
  /** Appelé avant chaque nouvel essai, avec son numéro (1 pour le premier nouvel essai). */
  onRetry?: (retryNumber: number) => void;
  /** Permet d'arrêter dès que l'écran a été quitté. */
  isCancelled?: () => boolean;
  /** Durée totale au-delà de laquelle on ne lance plus de nouvel essai, quoi qu'il reste de tentatives. */
  maxElapsedMs?: number;
  /** Remplaçable dans les tests. */
  sleep?: (ms: number) => Promise<void>;
}

export async function retry<T>(task: () => Promise<T>, options: RetryOptions): Promise<T> {
  const sleep = options.sleep ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
  const startedAt = Date.now();

  for (let attempt = 0; ; attempt++) {
    try {
      return await task();
    } catch (error) {
      const exhausted = attempt >= options.retries;
      // Un nouvel essai qui dépasserait la durée maximale n'est pas lancé : l'attente a une fin garantie.
      const outOfTime = options.maxElapsedMs !== undefined && Date.now() - startedAt + options.delayMs > options.maxElapsedMs;
      if (exhausted || outOfTime || !options.shouldRetry(error) || options.isCancelled?.()) throw error;
      options.onRetry?.(attempt + 1);
      await sleep(options.delayMs);
      if (options.isCancelled?.()) throw error;
    }
  }
}

import { Transform } from 'class-transformer';

/**
 * Décorateur pour transformer automatiquement une chaîne de caractères :
 * - Convertit en minuscules (toLowerCase)
 * - Supprime les espaces en début et fin (trim)
 * Utilise class-transformer pour appliquer la transformation lors de la désérialisation
 */
export function ToLowerCaseAndTrim(): PropertyDecorator {
  return Transform(({ value }: { value: string }) => {
    if (typeof value === 'string') {
      return value.toLowerCase().trim();
    }
    return value;
  });
}

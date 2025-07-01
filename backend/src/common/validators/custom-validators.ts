import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

// Validateur pour vérifier qu'une date n'est pas dans le passé
@ValidatorConstraint({ async: false })
export class IsFutureDateConstraint implements ValidatorConstraintInterface {
  validate(value: string | Date) {
    if (!value) return false;

    const inputDate = new Date(value);

    // Si la date n'est pas valide, on laisse passer (le frontend enverra toujours une date valide)
    if (isNaN(inputDate.getTime())) return true;

    // Comparer avec aujourd'hui (sans les heures)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dateToCheck = new Date(inputDate);
    dateToCheck.setHours(0, 0, 0, 0);

    // La date doit être aujourd'hui ou dans le futur
    return dateToCheck >= today;
  }

  defaultMessage() {
    return "La date d'échéance ne peut pas être dans le passé";
  }
}

export function IsFutureDate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsFutureDateConstraint,
    });
  };
}

// Validateur pour mot de passe fort
@ValidatorConstraint({ async: false })
export class IsStrongPasswordConstraint
  implements ValidatorConstraintInterface
{
  validate(password: string) {
    // Au moins 8 caractères, une majuscule, une minuscule, un chiffre
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return strongPasswordRegex.test(password);
  }

  defaultMessage() {
    return 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre';
  }
}

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsStrongPasswordConstraint,
    });
  };
}

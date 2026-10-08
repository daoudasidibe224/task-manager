import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
// Validateur pour mot de passe fort
@ValidatorConstraint({ async: false })
export class IsStrongPasswordConstraint implements ValidatorConstraintInterface {
  validate(password: unknown) {
    // Au moins 8 caractères, une majuscule, une minuscule, un chiffre
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return (
      typeof password === 'string' &&
      Buffer.byteLength(password) <= 72 &&
      strongPasswordRegex.test(password)
    );
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

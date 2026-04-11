import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

/**
 * Validation decorator for ULID format
 * Validates that the value is a 26-character string matching Crockford's Base32 encoding
 *
 * Usage:
 * ```ts
 * class MyDto {
 *   @IsUlid()
 *   public id!: string;
 * }
 * ```
 */
export function IsUlid(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          if (typeof value !== 'string') return false;
          if (value.length !== 26) return false;
          // Crockford's Base32: 0-9, A-H, J-N, P-V, W-Z (excludes I, L, O, U)
          return /^[0123456789ABCDEFGHJKMNPQRSTVWXYZ]{26}$/i.test(value);
        },
        defaultMessage(args: ValidationArguments): string {
          return `${args.property} must be a valid ULID (26-character alphanumeric string)`;
        },
      },
    });
  };
}

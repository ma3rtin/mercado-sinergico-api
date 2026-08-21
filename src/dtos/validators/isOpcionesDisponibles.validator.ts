import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

/**
 * Valida que el valor tenga la forma { caracteristicaId: [opcionId, ...] }:
 * un objeto plano cuyos valores son arrays no vacíos de enteros positivos.
 * No decide si el campo es obligatorio: combinar con @IsOptional() o
 * @IsDefined() según corresponda en cada DTO.
 */
export function IsOpcionesDisponibles(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isOpcionesDisponibles',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          if (value === null || typeof value !== 'object' || Array.isArray(value)) {
            return false;
          }

          return Object.values(value as Record<string, unknown>).every(
            (opcionIds) =>
              Array.isArray(opcionIds) &&
              opcionIds.length > 0 &&
              opcionIds.every((id) => typeof id === 'number' && Number.isInteger(id) && id > 0)
          );
        },
        defaultMessage(args: ValidationArguments): string {
          return `${args.property} debe tener la forma { caracteristicaId: [opcionId, ...] }, con ids numéricos positivos`;
        },
      },
    });
  };
}

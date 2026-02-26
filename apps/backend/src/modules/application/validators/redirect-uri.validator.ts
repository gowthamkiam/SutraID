import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function IsValidRedirectUri(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidRedirectUri',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (!Array.isArray(value)) return false;

          const isDevMode = process.env.NODE_ENV === 'development';

          for (const uri of value) {
            if (typeof uri !== 'string') return false;

            try {
              const url = new URL(uri);

              if (url.hash) {
                return false;
              }

              if (url.protocol === 'http:') {
                if (!isDevMode) {
                  return false;
                }
                if (!url.hostname.match(/^(localhost|127\.0\.0\.1|::1)$/)) {
                  return false;
                }
              } else if (url.protocol !== 'https:') {
                return false;
              }
            } catch {
              return false;
            }
          }

          return true;
        },
        defaultMessage(args: ValidationArguments) {
          return 'Redirect URIs must use HTTPS (http://localhost allowed in dev) and must not contain fragments (#)';
        },
      },
    });
  };
}

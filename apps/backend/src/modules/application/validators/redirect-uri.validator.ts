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

          const isDevMode = process.env.NODE_ENV !== 'production';

          for (const uri of value) {
            if (typeof uri !== 'string') return false;

            try {
              const url = new URL(uri);

              if (url.hash) {
                return false;
              }

              const isLocalhost = /^(localhost|127\.0\.0\.1|::1)$/.test(
                url.hostname,
              );

              if (url.protocol === 'http:') {
                if (!isLocalhost && !isDevMode) {
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
          return 'Redirect URIs must use HTTPS (http://localhost is always allowed). URIs must not contain fragments (#)';
        },
      },
    });
  };
}

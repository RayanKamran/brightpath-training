/**
 * Browser no-op stub for class-validator.
 *
 * class-validator is a backend-only concern (NestJS validation). The shared
 * @dms/data-models library re-exports DTOs that use class-validator decorators,
 * which causes CJS/ESM failures in the browser when Vite serves validator.js raw.
 *
 * This stub replaces the entire class-validator package in client-web builds,
 * making every decorator a no-op. The frontend never needs to run validation —
 * it only needs the TypeScript types and pure utility functions from data-models.
 *
 * Vite alias: 'class-validator' → this file  (see vite.config.ts)
 */

const noop =
  (..._args: unknown[]) =>
  (..._decoratorArgs: unknown[]) => {};

// Common decorators
export const Allow = noop;
export const IsDefined = noop;
export const IsOptional = noop;
export const IsNotEmpty = noop;
export const IsString = noop;
export const IsNumber = noop;
export const IsInt = noop;
export const IsBoolean = noop;
export const IsDate = noop;
export const IsArray = noop;
export const IsObject = noop;
export const IsEnum = noop;
export const IsIn = noop;
export const IsNotIn = noop;
export const IsEmpty = noop;

// String decorators
export const IsEmail = noop;
export const IsUrl = noop;
export const IsUUID = noop;
export const IsAlpha = noop;
export const IsAlphanumeric = noop;
export const IsNumberString = noop;
export const IsMongoId = noop;
export const IsPhoneNumber = noop;
export const IsLatLong = noop;
export const IsISO8601 = noop;
export const IsJSON = noop;
export const IsJWT = noop;
export const IsCreditCard = noop;
export const IsIP = noop;
export const IsPort = noop;
export const IsLocale = noop;
export const IsCurrency = noop;
export const IsBase64 = noop;
export const IsHexColor = noop;
export const IsUppercase = noop;
export const IsLowercase = noop;
export const Matches = noop;
export const Contains = noop;
export const NotContains = noop;
export const IsAscii = noop;
export const IsDecimal = noop;
export const IsHash = noop;
export const IsBIC = noop;
export const IsIBAN = noop;
export const IsISRC = noop;
export const IsEAN = noop;
export const IsISIN = noop;
export const IsMimeType = noop;
export const IsOctal = noop;
export const IsPassportNumber = noop;
export const IsPostalCode = noop;
export const IsSemVer = noop;
export const IsStrongPassword = noop;
export const IsTaxId = noop;
export const IsTimeZone = noop;
export const Length = noop;
export const MinLength = noop;
export const MaxLength = noop;

// Number decorators
export const Min = noop;
export const Max = noop;
export const IsPositive = noop;
export const IsNegative = noop;
export const IsNotNegative = noop;
export const IsNotPositive = noop;
export const IsDivisibleBy = noop;

// Array decorators
export const ArrayContains = noop;
export const ArrayNotContains = noop;
export const ArrayMinSize = noop;
export const ArrayMaxSize = noop;
export const ArrayNotEmpty = noop;
export const ArrayUnique = noop;

// Object decorators
export const ValidateNested = noop;
export const ValidateIf = noop;
export const ValidatePromise = noop;

// Custom decorators
export const registerDecorator = noop;
export const getMetadataStorage = () => ({});
export const buildMessage = (_cb: unknown) => _cb;

// Runtime validators (return valid results so nothing crashes)
export const validate = async (_obj: unknown) => [];
export const validateSync = (_obj: unknown) => [];
export const validateOrReject = async (_obj: unknown) => {};

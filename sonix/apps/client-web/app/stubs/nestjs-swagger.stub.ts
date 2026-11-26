/**
 * Browser no-op stub for @nestjs/swagger.
 * Swagger decorators are backend-only. This prevents the package from being
 * loaded in the browser via the shared @dms/data-models barrel export.
 */

const noop =
  (..._args: unknown[]) =>
  (..._decoratorArgs: unknown[]) => {};

export const ApiProperty = noop;
export const ApiPropertyOptional = noop;
export const ApiResponse = noop;
export const ApiOperation = noop;
export const ApiTags = noop;
export const ApiBody = noop;
export const ApiParam = noop;
export const ApiQuery = noop;
export const ApiHeader = noop;
export const ApiSecurity = noop;
export const ApiBearerAuth = noop;
export const ApiOkResponse = noop;
export const ApiCreatedResponse = noop;
export const ApiNotFoundResponse = noop;
export const ApiUnauthorizedResponse = noop;
export const ApiForbiddenResponse = noop;
export const ApiBadRequestResponse = noop;
export const ApiInternalServerErrorResponse = noop;
export const ApiExtraModels = noop;
export const ApiHideProperty = noop;
export const ApiSchema = noop;
export const getSchemaPath = (_model: unknown) => '';
export const IntersectionType = (_a: unknown, _b: unknown) => class {};
export const PartialType = (_type: unknown) => class {};
export const PickType = (_type: unknown, _keys: unknown) => class {};
export const OmitType = (_type: unknown, _keys: unknown) => class {};

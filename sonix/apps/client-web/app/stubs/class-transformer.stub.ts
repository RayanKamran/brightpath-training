/**
 * Browser no-op stub for class-transformer.
 * class-transformer is backend-only (NestJS serialization/deserialization).
 * This prevents it from being loaded in the browser via the shared @dms/data-models barrel.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const noop =
  (..._args: unknown[]) =>
  (..._decoratorArgs: unknown[]) => {};

export const Type = noop;
export const Transform = noop;
export const Expose = noop;
export const Exclude = noop;
export const plainToClass = <T>(_cls: unknown, plain: T) => plain;
export const plainToInstance = <T>(_cls: unknown, plain: T) => plain;
export const instanceToPlain = (obj: unknown) => obj;
export const classToPlain = (obj: unknown) => obj;
export const instanceToInstance = <T>(obj: T) => obj;
export const serialize = (obj: unknown) => JSON.stringify(obj);
export const deserialize = <T>(_cls: unknown, json: string) => JSON.parse(json) as T;

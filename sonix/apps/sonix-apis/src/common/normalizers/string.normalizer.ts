// biome-ignore lint/complexity/noStaticOnlyClass: Intentional namespace-style container for reusable string normalization methods.
export abstract class StringNormalizer {
  /**
   * Trims a string value and converts null, undefined, or blank input to null.
   *
   * @param value - Source value to normalize.
   * @returns Trimmed string when non-empty; otherwise null.
   */
  public static toTrimmedOrNull(value: string | null | undefined): string | null {
    const trimmed = value?.trim();
    return trimmed?.length ? trimmed : null;
  }
}

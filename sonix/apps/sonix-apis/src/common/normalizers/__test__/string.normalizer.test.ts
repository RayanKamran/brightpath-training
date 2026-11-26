import {describe, expect, it} from 'vitest';
import {StringNormalizer} from '../string.normalizer';

describe('StringNormalizer', () => {
  describe('toTrimmedOrNull', () => {
    it('should trim and return non-empty strings', () => {
      expect(StringNormalizer.toTrimmedOrNull('  hello  ')).toBe('hello');
      expect(StringNormalizer.toTrimmedOrNull('test')).toBe('test');
      expect(StringNormalizer.toTrimmedOrNull('  multiple words  ')).toBe('multiple words');
    });

    it('should return null for empty or whitespace-only strings', () => {
      expect(StringNormalizer.toTrimmedOrNull('')).toBeNull();
      expect(StringNormalizer.toTrimmedOrNull('   ')).toBeNull();
      expect(StringNormalizer.toTrimmedOrNull('\t')).toBeNull();
      expect(StringNormalizer.toTrimmedOrNull('\n')).toBeNull();
      expect(StringNormalizer.toTrimmedOrNull('\t\n\r  ')).toBeNull();
    });

    it('should return null for null input', () => {
      expect(StringNormalizer.toTrimmedOrNull(null)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(StringNormalizer.toTrimmedOrNull(undefined)).toBeNull();
    });

    it('should handle strings with internal whitespace correctly', () => {
      expect(StringNormalizer.toTrimmedOrNull('  hello   world  ')).toBe('hello   world');
      expect(StringNormalizer.toTrimmedOrNull('a\tb\tc')).toBe('a\tb\tc');
    });

    it('should handle strings with only leading whitespace', () => {
      expect(StringNormalizer.toTrimmedOrNull('   value')).toBe('value');
    });

    it('should handle strings with only trailing whitespace', () => {
      expect(StringNormalizer.toTrimmedOrNull('value   ')).toBe('value');
    });

    it('should handle single character strings', () => {
      expect(StringNormalizer.toTrimmedOrNull('a')).toBe('a');
      expect(StringNormalizer.toTrimmedOrNull(' a ')).toBe('a');
    });

    it('should handle special characters', () => {
      expect(StringNormalizer.toTrimmedOrNull('  @#$%  ')).toBe('@#$%');
      expect(StringNormalizer.toTrimmedOrNull('  emoji 🎉  ')).toBe('emoji 🎉');
    });
  });
});

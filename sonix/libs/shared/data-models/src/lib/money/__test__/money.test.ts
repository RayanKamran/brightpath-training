import {
  addMoney,
  allocateMoney,
  applyRate,
  formatMoney,
  multiplyMoney,
  subtractMoney,
  sumMoney,
  toMoney,
  zeroMoney,
} from '../money.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

const usd = (amount: number) => ({amount, currency: 'USD' as const});
const cad = (amount: number) => ({amount, currency: 'CAD' as const});

// ── toMoney ───────────────────────────────────────────────────────────────────

describe('toMoney', () => {
  it('converts a dollar float to integer cents', () => {
    expect(toMoney(12.99, 'USD')).toEqual(usd(1299));
  });

  it('converts a decimal string', () => {
    expect(toMoney('12.99', 'USD')).toEqual(usd(1299));
  });

  it('strips non-numeric characters from a string (e.g. currency symbols)', () => {
    expect(toMoney('$12.99', 'USD')).toEqual(usd(1299));
  });

  it('returns zero for an empty string', () => {
    expect(toMoney('', 'USD')).toEqual(usd(0));
  });

  it('returns zero for NaN input', () => {
    expect(toMoney('abc', 'USD')).toEqual(usd(0));
  });

  it('rounds fractional cents using Math.round', () => {
    expect(toMoney(0.005, 'USD')).toEqual(usd(1)); // 0.5 cents rounds up
    expect(toMoney(0.001, 'USD')).toEqual(usd(0)); // 0.1 cents rounds down
  });

  it('preserves the supplied currency', () => {
    expect(toMoney(1.0, 'CAD')).toEqual(cad(100));
    expect(toMoney(1.0, 'EUR')).toEqual({amount: 100, currency: 'EUR'});
  });
});

// ── zeroMoney ─────────────────────────────────────────────────────────────────

describe('zeroMoney', () => {
  it('returns a zero-amount Money for the given currency', () => {
    expect(zeroMoney('USD')).toEqual(usd(0));
    expect(zeroMoney('CAD')).toEqual(cad(0));
  });
});

// ── addMoney ──────────────────────────────────────────────────────────────────

describe('addMoney', () => {
  it('adds two same-currency values', () => {
    expect(addMoney(usd(100), usd(200))).toEqual(usd(300));
  });

  it('adds negative amounts correctly', () => {
    expect(addMoney(usd(500), usd(-200))).toEqual(usd(300));
  });

  it('throws on currency mismatch', () => {
    expect(() => addMoney(usd(100), cad(100))).toThrow('Currency mismatch');
  });
});

// ── subtractMoney ─────────────────────────────────────────────────────────────

describe('subtractMoney', () => {
  it('subtracts two same-currency values', () => {
    expect(subtractMoney(usd(500), usd(200))).toEqual(usd(300));
  });

  it('produces a negative result when b > a (e.g. net trade with payoff > allowance)', () => {
    expect(subtractMoney(usd(200), usd(500))).toEqual(usd(-300));
  });

  it('throws on currency mismatch', () => {
    expect(() => subtractMoney(usd(100), cad(100))).toThrow('Currency mismatch');
  });
});

// ── multiplyMoney ─────────────────────────────────────────────────────────────

describe('multiplyMoney', () => {
  it('multiplies by a whole number', () => {
    expect(multiplyMoney(usd(100), 3)).toEqual(usd(300));
  });

  it('multiplies by a fraction', () => {
    expect(multiplyMoney(usd(100), 0.5)).toEqual(usd(50));
  });

  it('rounds half-up to nearest cent', () => {
    // 100 * 0.015 = 1.5 → rounds to 2
    expect(multiplyMoney(usd(100), 0.015)).toEqual(usd(2));
    // 100 * 0.014 = 1.4 → rounds to 1
    expect(multiplyMoney(usd(100), 0.014)).toEqual(usd(1));
  });

  it('multiplies by zero to produce zero', () => {
    expect(multiplyMoney(usd(9999), 0)).toEqual(usd(0));
  });
});

// ── sumMoney ──────────────────────────────────────────────────────────────────

describe('sumMoney', () => {
  it('returns zero for an empty array', () => {
    expect(sumMoney([], 'USD')).toEqual(usd(0));
  });

  it('sums a single value', () => {
    expect(sumMoney([usd(500)], 'USD')).toEqual(usd(500));
  });

  it('sums multiple values', () => {
    expect(sumMoney([usd(100), usd(200), usd(300)], 'USD')).toEqual(usd(600));
  });

  it('throws when a value has a different currency', () => {
    expect(() => sumMoney([usd(100), cad(200)], 'USD')).toThrow('Currency mismatch');
  });
});

// ── applyRate ─────────────────────────────────────────────────────────────────

describe('applyRate', () => {
  it('computes 6.25% (625 bps) of $100.00', () => {
    // 10000 * 625 / 10000 = 625 cents = $6.25
    expect(applyRate(usd(10000), 625)).toEqual(usd(625));
  });

  it('matches the example in the docstring: 6.25% of $123.45', () => {
    // 12345 * 625 / 10000 = 771.5625 → rounds to 772
    expect(applyRate(usd(12345), 625)).toEqual(usd(772));
  });

  it('matches the example in the docstring: 10% of $500.00 CAD', () => {
    // 50000 * 1000 / 10000 = 5000
    expect(applyRate(cad(50000), 1000)).toEqual(cad(5000));
  });

  it('applies 7.25% (725 bps) — a common state sales tax rate', () => {
    // $174.99 (17499 cents) * 725 / 10000 = 1268.6775 → 1269
    expect(applyRate(usd(17499), 725)).toEqual(usd(1269));
  });

  it('applies a 0% rate and returns zero', () => {
    expect(applyRate(usd(99999), 0)).toEqual(usd(0));
  });

  it('applies a 100% rate (10000 bps) and returns the original amount', () => {
    expect(applyRate(usd(5000), 10000)).toEqual(usd(5000));
  });

  it('rounds 0.5 fractional cents up (half-away-from-zero)', () => {
    // 1 cent * 5000 bps = 0.5 → rounds to 1
    expect(applyRate(usd(1), 5000)).toEqual(usd(1));
  });

  it('rounds 0.4 fractional cents down', () => {
    // 1 cent * 4999 bps = 0.4999 → rounds to 0
    expect(applyRate(usd(1), 4999)).toEqual(usd(0));
  });

  it('preserves the currency of the input', () => {
    expect(applyRate(cad(10000), 500)).toEqual(cad(500));
  });

  it('applies a dealer discount of 5% (500 bps) on a $38,999 unit', () => {
    // 3899900 cents * 500 / 10000 = 194995 cents = $1949.95
    expect(applyRate(usd(3899900), 500)).toEqual(usd(194995));
  });
});

// ── allocateMoney ─────────────────────────────────────────────────────────────

describe('allocateMoney', () => {
  it('returns an empty array for empty ratios', () => {
    expect(allocateMoney(usd(1000), [])).toEqual([]);
  });

  it('throws when all ratios are zero', () => {
    expect(() => allocateMoney(usd(1000), [0, 0, 0])).toThrow('ratios must not all be zero');
  });

  it('returns the full amount for a single ratio', () => {
    expect(allocateMoney(usd(1000), [1])).toEqual([usd(1000)]);
    expect(allocateMoney(usd(1000), [42])).toEqual([usd(1000)]);
  });

  it('splits equally and pieces sum exactly to the original', () => {
    // 1000 / 3 = 333.33... → [334, 333, 333]
    const result = allocateMoney(usd(1000), [1, 1, 1]);
    expect(result).toHaveLength(3);
    expect(result.reduce((s, m) => s + m.amount, 0)).toBe(1000);
    // The largest-remainder share gets the extra cent
    expect(result[0]).toEqual(usd(334));
    expect(result[1]).toEqual(usd(333));
    expect(result[2]).toEqual(usd(333));
  });

  it('matches the docstring example: $10.00 split three ways', () => {
    const result = allocateMoney(usd(1000), [1, 1, 1]);
    expect(result.map((m) => m.amount)).toEqual([334, 333, 333]);
  });

  it('matches the docstring example: prorate $50 across $200 and $300', () => {
    // 5000 * 200/500 = 2000, 5000 * 300/500 = 3000
    const result = allocateMoney(usd(5000), [200, 300]);
    expect(result).toEqual([usd(2000), usd(3000)]);
  });

  it('handles unequal ratios and guarantees the sum is exact', () => {
    // $1.00 across [1, 2, 3]: total = 6
    // shares: floor(100/6)=16, floor(200/6)=33, floor(300/6)=50 → sum=99, leftover=1
    // remainders: 100/6-16=0.667, 200/6-33=0.333, 300/6-50=0 → extra cent to index 0
    const result = allocateMoney(usd(100), [1, 2, 3]);
    expect(result.reduce((s, m) => s + m.amount, 0)).toBe(100);
    expect(result[0].amount + result[1].amount + result[2].amount).toBe(100);
  });

  it('distributes a single cent across many shares without losing or gaining', () => {
    const result = allocateMoney(usd(1), [1, 1, 1, 1, 1]);
    const total = result.reduce((s, m) => s + m.amount, 0);
    expect(total).toBe(1);
    expect(result.every((m) => m.amount === 0 || m.amount === 1)).toBe(true);
  });

  it('allocates zero and every share is zero', () => {
    const result = allocateMoney(usd(0), [1, 2, 3]);
    expect(result).toEqual([usd(0), usd(0), usd(0)]);
  });

  it('always produces results in the correct currency', () => {
    const result = allocateMoney(cad(600), [1, 2]);
    expect(result.every((m) => m.currency === 'CAD')).toBe(true);
  });

  it('guarantees exact sum for a range of awkward amounts', () => {
    // Stress: split amounts that do not divide evenly
    const cases: [number, number[]][] = [
      [7, [1, 1, 1]],
      [10, [3, 3, 3, 1]],
      [1000, [7, 11, 13]],
      [99, [1, 1]],
    ];
    for (const [amount, ratios] of cases) {
      const result = allocateMoney(usd(amount), ratios);
      const total = result.reduce((s, m) => s + m.amount, 0);
      expect(total).toBe(amount);
    }
  });

  it('prorates freight of $750.00 across three units by value', () => {
    // Units worth $200, $300, $500 → total $1000
    // Freight $75000 cents split [200, 300, 500]
    // $15000, $22500, $37500 → sum = 75000 ✓
    const result = allocateMoney(usd(75000), [200, 300, 500]);
    expect(result).toEqual([usd(15000), usd(22500), usd(37500)]);
    expect(result.reduce((s, m) => s + m.amount, 0)).toBe(75000);
  });
});

// ── formatMoney ───────────────────────────────────────────────────────────────

describe('formatMoney', () => {
  it('formats USD cents as a dollar amount', () => {
    expect(formatMoney(usd(1299))).toContain('12.99');
  });

  it('formats zero correctly', () => {
    expect(formatMoney(usd(0))).toContain('0.00');
  });

  it('includes the currency symbol', () => {
    const formatted = formatMoney(usd(1000), 'en-US');
    expect(formatted).toContain('$');
  });
});

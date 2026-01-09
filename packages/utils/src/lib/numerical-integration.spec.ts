import type {
  Point} from './numerical-integration.js';
import {
  integrate,
  trapezoidalIntegral,
  simpsonsIntegral,
  cumulativeIntegral
} from './numerical-integration.js';

describe('numerical-integration', () => {
  describe('trapezoidalIntegral', () => {
    it('should compute integral of constant function', () => {
      // Integral of y = 2 from x = 0 to x = 4 should be 8
      const result = trapezoidalIntegral([2, 2, 2, 2, 2]);
      expect(result.value).toBeCloseTo(8, 10);
      expect(result.method).toBe('trapezoidal');
      expect(result.pointCount).toBe(5);
      expect(result.bounds).toEqual([0, 4]);
    });

    it('should compute integral of linear function', () => {
      // Integral of y = x from x = 0 to x = 4 should be 8 (area of triangle = 0.5 * 4 * 4)
      const result = trapezoidalIntegral([0, 1, 2, 3, 4]);
      expect(result.value).toBeCloseTo(8, 10);
    });

    it('should handle custom dx spacing', () => {
      // y = [0, 2, 4, 6, 8] with dx = 0.5
      // Integral from 0 to 2 should be 4 (area of triangle = 0.5 * 2 * 4)
      const result = trapezoidalIntegral([0, 1, 2, 3, 4], { dx: 0.5 });
      expect(result.value).toBeCloseTo(4, 10);
      expect(result.bounds).toEqual([0, 2]);
    });

    it('should handle custom x0 starting point', () => {
      // y = 2 from x = 10 to x = 14
      const result = trapezoidalIntegral([2, 2, 2, 2, 2], { x0: 10 });
      expect(result.bounds).toEqual([10, 14]);
      expect(result.value).toBeCloseTo(8, 10);
    });

    it('should handle Point array input', () => {
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        { x: 2, y: 2 },
        { x: 3, y: 3 },
        { x: 4, y: 4 },
      ];
      const result = trapezoidalIntegral(points);
      expect(result.value).toBeCloseTo(8, 10);
    });

    it('should sort Point array by x-value', () => {
      // Points out of order
      const points: Point[] = [
        { x: 2, y: 2 },
        { x: 0, y: 0 },
        { x: 4, y: 4 },
        { x: 1, y: 1 },
        { x: 3, y: 3 },
      ];
      const result = trapezoidalIntegral(points);
      expect(result.value).toBeCloseTo(8, 10);
      expect(result.bounds).toEqual([0, 4]);
    });

    it('should handle non-uniform spacing in Point array', () => {
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        { x: 3, y: 3 }, // skip x = 2
        { x: 4, y: 4 },
      ];
      const result = trapezoidalIntegral(points);
      // Area: (0+1)/2 * 1 + (1+3)/2 * 2 + (3+4)/2 * 1 = 0.5 + 4 + 3.5 = 8
      expect(result.value).toBeCloseTo(8, 10);
    });

    it('should work with only 2 points', () => {
      const result = trapezoidalIntegral([1, 3]);
      // Area = (1 + 3) / 2 * 1 = 2
      expect(result.value).toBeCloseTo(2, 10);
      expect(result.pointCount).toBe(2);
    });

    it('should throw error for empty array', () => {
      expect(() => trapezoidalIntegral([])).toThrow('Integration requires at least 2 data points');
    });

    it('should throw error for single point', () => {
      expect(() => trapezoidalIntegral([1])).toThrow('Integration requires at least 2 data points');
    });

    it('should compute quadratic function integral', () => {
      // y = x² from 0 to 4: [0, 1, 4, 9, 16]
      // Exact integral = 4³/3 = 64/3 ≈ 21.333
      // Trapezoidal will have some error
      const result = trapezoidalIntegral([0, 1, 4, 9, 16]);
      expect(result.value).toBeCloseTo(22, 0); // Allow larger error for trapezoidal
    });
  });

  describe('simpsonsIntegral', () => {
    it('should compute integral of constant function', () => {
      const result = simpsonsIntegral([2, 2, 2, 2, 2]);
      expect(result.value).toBeCloseTo(8, 10);
      expect(result.method).toBe('simpsons');
    });

    it('should compute integral of linear function', () => {
      const result = simpsonsIntegral([0, 1, 2, 3, 4]);
      expect(result.value).toBeCloseTo(8, 10);
    });

    it('should be more accurate for quadratic function', () => {
      // y = x² from 0 to 4: [0, 1, 4, 9, 16]
      // Exact integral = 64/3 ≈ 21.333
      // Simpson's rule is exact for quadratics
      const result = simpsonsIntegral([0, 1, 4, 9, 16]);
      expect(result.value).toBeCloseTo(64 / 3, 5);
    });

    it('should handle custom dx spacing', () => {
      const result = simpsonsIntegral([0, 1, 2, 3, 4], { dx: 0.5 });
      expect(result.value).toBeCloseTo(4, 10);
    });

    it('should handle Point array input', () => {
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        { x: 2, y: 4 },
        { x: 3, y: 9 },
        { x: 4, y: 16 },
      ];
      const result = simpsonsIntegral(points);
      expect(result.value).toBeCloseTo(64 / 3, 5);
    });

    it('should fall back to trapezoidal for 2 points', () => {
      const result = simpsonsIntegral([1, 3]);
      expect(result.value).toBeCloseTo(2, 10);
      expect(result.method).toBe('simpsons'); // Still reports simpsons
    });

    it('should handle even number of points (odd number of intervals)', () => {
      // 4 points = 3 intervals, so one will use trapezoidal
      const result = simpsonsIntegral([0, 1, 4, 9]);
      expect(result.value).toBeGreaterThan(0);
      expect(result.pointCount).toBe(4);
    });

    it('should throw error for insufficient data', () => {
      expect(() => simpsonsIntegral([])).toThrow();
      expect(() => simpsonsIntegral([1])).toThrow();
    });
  });

  describe('integrate', () => {
    it('should automatically select simpsons for uniform data with 3+ points', () => {
      const result = integrate([0, 1, 4, 9, 16]);
      expect(result.method).toBe('simpsons');
    });

    it('should use trapezoidal for 2 points', () => {
      const result = integrate([1, 3]);
      expect(result.method).toBe('trapezoidal');
    });

    it('should use trapezoidal for highly non-uniform data', () => {
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        { x: 10, y: 10 }, // Large gap
        { x: 11, y: 11 },
      ];
      const result = integrate(points);
      expect(result.method).toBe('trapezoidal');
    });

    it('should compute reasonable integral values', () => {
      // Simple case: constant function
      const result = integrate([5, 5, 5, 5]);
      expect(result.value).toBeCloseTo(15, 10);
    });

    it('should throw error for invalid input', () => {
      expect(() => integrate([])).toThrow();
      expect(() => integrate([1])).toThrow();
    });
  });

  describe('cumulativeIntegral', () => {
    it('should return array of cumulative values', () => {
      const result = cumulativeIntegral([0, 2, 4, 6]);
      expect(result).toHaveLength(4);
      expect(result[0]).toBe(0); // Starting value
      expect(result[1]).toBeCloseTo(1, 10); // (0+2)/2 * 1 = 1
      expect(result[2]).toBeCloseTo(4, 10); // 1 + (2+4)/2 * 1 = 4
      expect(result[3]).toBeCloseTo(9, 10); // 4 + (4+6)/2 * 1 = 9
    });

    it('should handle custom dx spacing', () => {
      const result = cumulativeIntegral([0, 2, 4], { dx: 0.5 });
      expect(result).toHaveLength(3);
      expect(result[0]).toBe(0);
      expect(result[1]).toBeCloseTo(0.5, 10); // (0+2)/2 * 0.5 = 0.5
      expect(result[2]).toBeCloseTo(2, 10); // 0.5 + (2+4)/2 * 0.5 = 2
    });

    it('should handle Point array input', () => {
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 1, y: 2 },
        { x: 2, y: 4 },
      ];
      const result = cumulativeIntegral(points);
      expect(result).toHaveLength(3);
      expect(result[0]).toBe(0);
      expect(result[1]).toBeCloseTo(1, 10);
      expect(result[2]).toBeCloseTo(4, 10);
    });

    it('should return [0] for single point', () => {
      const result = cumulativeIntegral([5]);
      expect(result).toEqual([0]);
    });

    it('should throw error for empty array', () => {
      expect(() => cumulativeIntegral([])).toThrow();
    });

    it('should match final integral value', () => {
      const data = [0, 1, 4, 9, 16];
      const cumulative = cumulativeIntegral(data);
      const total = trapezoidalIntegral(data);
      expect(cumulative[cumulative.length - 1]).toBeCloseTo(total.value, 10);
    });
  });

  describe('edge cases', () => {
    it('should handle negative values', () => {
      const result = trapezoidalIntegral([-2, -1, 0, 1, 2]);
      expect(result.value).toBeCloseTo(0, 10);
    });

    it('should handle very small values', () => {
      const result = trapezoidalIntegral([1e-10, 2e-10, 3e-10]);
      expect(result.value).toBeGreaterThan(0);
      expect(result.value).toBeLessThan(1e-8);
    });

    it('should handle very large values', () => {
      const result = trapezoidalIntegral([1e10, 2e10, 3e10]);
      expect(result.value).toBeGreaterThan(0);
      expect(result.value).toBeGreaterThan(1e10);
    });

    it('should handle mixed positive and negative values', () => {
      // sin-like curve: integral should be near zero
      const result = trapezoidalIntegral([0, 1, 0, -1, 0]);
      expect(result.value).toBeCloseTo(0, 10);
    });
  });
});

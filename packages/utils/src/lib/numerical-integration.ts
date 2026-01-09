/**
 * Numerical Integration Utilities
 *
 * This module provides functions for computing definite integrals of numerical data
 * using various numerical integration methods (quadrature).
 */

/**
 * A point in 2D space representing a data point for integration.
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Options for numerical integration functions.
 */
export interface IntegrationOptions {
  /**
   * The spacing between x-values when only y-values are provided.
   * Defaults to 1 if not specified.
   */
  dx?: number;

  /**
   * The starting x-value when only y-values are provided.
   * Defaults to 0 if not specified.
   */
  x0?: number;
}

/**
 * Result of a numerical integration computation.
 */
export interface IntegrationResult {
  /**
   * The computed integral value.
   */
  value: number;

  /**
   * The integration method used.
   */
  method: 'trapezoidal' | 'simpsons';

  /**
   * The number of data points used in the computation.
   */
  pointCount: number;

  /**
   * The integration bounds [lower, upper].
   */
  bounds: [number, number];
}

/**
 * Computes the definite integral of numerical data using the trapezoidal rule.
 *
 * The trapezoidal rule approximates the integral by summing the areas of trapezoids
 * formed between consecutive data points. It's a first-order accurate method that
 * works well for general numerical data.
 *
 * @param data - Either an array of y-values (with uniform spacing) or an array of (x, y) points
 * @param options - Optional configuration for uniform y-value arrays
 * @returns The computed integral result
 *
 * @example
 * // With uniform y-values (default dx = 1)
 * trapezoidalIntegral([0, 1, 4, 9, 16]); // Integral of y = x² from 0 to 4
 *
 * @example
 * // With uniform y-values and custom spacing
 * trapezoidalIntegral([0, 1, 4, 9, 16], { dx: 0.5 });
 *
 * @example
 * // With explicit (x, y) points
 * trapezoidalIntegral([
 *   { x: 0, y: 0 },
 *   { x: 1, y: 1 },
 *   { x: 2, y: 4 },
 *   { x: 3, y: 9 }
 * ]);
 */
export function trapezoidalIntegral(
  data: number[] | Point[],
  options: IntegrationOptions = {}
): IntegrationResult {
  if (!Array.isArray(data) || data.length < 2) {
    throw new Error('Integration requires at least 2 data points as an array');
  }

  const points = normalizeToPoints(data, options);
  let sum = 0;

  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const avgY = (points[i].y + points[i - 1].y) / 2;
    sum += dx * avgY;
  }

  return {
    value: sum,
    method: 'trapezoidal',
    pointCount: points.length,
    bounds: [points[0].x, points[points.length - 1].x],
  };
}

/**
 * Computes the definite integral of numerical data using Simpson's rule.
 *
 * Simpson's rule uses parabolic interpolation between points for higher accuracy
 * than the trapezoidal rule. It requires an odd number of points (even number of
 * intervals) for pure Simpson's rule, but this implementation handles any number
 * of points by using the composite Simpson's rule with trapezoidal fallback.
 *
 * For uniformly spaced data, Simpson's rule achieves fourth-order accuracy,
 * making it particularly effective for smooth functions.
 *
 * @param data - Either an array of y-values (with uniform spacing) or an array of (x, y) points
 * @param options - Optional configuration for uniform y-value arrays
 * @returns The computed integral result
 *
 * @example
 * // With uniform y-values
 * simpsonsIntegral([0, 1, 4, 9, 16, 25]); // More accurate than trapezoidal for smooth data
 *
 * @example
 * // With explicit (x, y) points
 * simpsonsIntegral([
 *   { x: 0, y: 0 },
 *   { x: 0.5, y: 0.25 },
 *   { x: 1, y: 1 }
 * ]);
 */
export function simpsonsIntegral(
  data: number[] | Point[],
  options: IntegrationOptions = {}
): IntegrationResult {
  if (!Array.isArray(data) || data.length < 2) {
    throw new Error('Integration requires at least 2 data points as an array');
  }

  const points = normalizeToPoints(data, options);

  // For 2 points, fall back to trapezoidal
  if (points.length === 2) {
    const result = trapezoidalIntegral(points);
    return { ...result, method: 'simpsons' };
  }

  let sum = 0;
  let i = 0;

  // Apply Simpson's rule in pairs of intervals (3 points at a time)
  while (i + 2 < points.length) {
    // Simpson's rule for non-uniform spacing:
    // h1 = x[i+1] - x[i], h2 = x[i+2] - x[i+1]
    // For uniform spacing (h1 = h2 = h): integral = (h/3) * (y0 + 4*y1 + y2)
    // For non-uniform: use weighted formula
    const h1 = points[i + 1].x - points[i].x;
    const h2 = points[i + 2].x - points[i + 1].x;
    const y0 = points[i].y;
    const y1 = points[i + 1].y;
    const y2 = points[i + 2].y;

    if (Math.abs(h1 - h2) < 1e-10) {
      // Uniform spacing - use standard Simpson's rule
      sum += ((h1 + h2) / 6) * (y0 + 4 * y1 + y2);
    } else {
      // Non-uniform spacing - use generalized Simpson's rule
      const h = h1 + h2;
      const alpha = (2 * h2 - h1) / (6 * h2);
      const beta = (h * h * h) / (6 * h1 * h2);
      const gamma = (2 * h1 - h2) / (6 * h1);
      sum += h * (alpha * y0 + beta * y1 + gamma * y2);
    }

    i += 2;
  }

  // If there's one remaining interval, use trapezoidal rule for it
  if (i < points.length - 1) {
    const dx = points[i + 1].x - points[i].x;
    const avgY = (points[i + 1].y + points[i].y) / 2;
    sum += dx * avgY;
  }

  return {
    value: sum,
    method: 'simpsons',
    pointCount: points.length,
    bounds: [points[0].x, points[points.length - 1].x],
  };
}

/**
 * Computes the definite integral using the most appropriate method based on the data.
 *
 * This is a convenience function that automatically selects between trapezoidal
 * and Simpson's rule based on the number of data points and their distribution.
 *
 * @param data - Either an array of y-values (with uniform spacing) or an array of (x, y) points
 * @param options - Optional configuration for uniform y-value arrays
 * @returns The computed integral result
 *
 * @example
 * // Automatically selects the best method
 * integrate([0, 1, 4, 9, 16]);
 */
export function integrate(
  data: number[] | Point[],
  options: IntegrationOptions = {}
): IntegrationResult {
  if (!Array.isArray(data) || data.length < 2) {
    throw new Error('Integration requires at least 2 data points as an array');
  }

  const points = normalizeToPoints(data, options);

  // Use Simpson's rule for 3+ points with reasonably uniform spacing
  // Fall back to trapezoidal for 2 points or highly non-uniform data
  if (points.length >= 3 && isReasonablyUniform(points)) {
    return simpsonsIntegral(points);
  }

  return trapezoidalIntegral(points);
}

/**
 * Computes the cumulative integral (antiderivative values) at each point.
 *
 * Returns an array of the same length as the input, where each element
 * represents the integral from the first point to that point.
 *
 * @param data - Either an array of y-values (with uniform spacing) or an array of (x, y) points
 * @param options - Optional configuration for uniform y-value arrays
 * @returns Array of cumulative integral values
 *
 * @example
 * // Get cumulative integral at each point
 * cumulativeIntegral([0, 1, 4, 9]); // Returns [0, 0.5, 3, 9.5] for trapezoidal
 */
export function cumulativeIntegral(
  data: number[] | Point[],
  options: IntegrationOptions = {}
): number[] {
  if (!Array.isArray(data) || data.length < 1) {
    throw new Error('Cumulative integration requires at least 1 data point');
  }

  if (data.length === 1) {
    return [0];
  }

  const points = normalizeToPoints(data, options);
  const cumulative: number[] = [0];
  let sum = 0;

  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const avgY = (points[i].y + points[i - 1].y) / 2;
    sum += dx * avgY;
    cumulative.push(sum);
  }

  return cumulative;
}

/**
 * Normalizes input data to an array of Point objects.
 * @internal
 */
function normalizeToPoints(data: number[] | Point[], options: IntegrationOptions): Point[] {
  const { dx = 1, x0 = 0 } = options;

  if (isPointArray(data)) {
    // Sort by x-value to ensure proper integration order
    return [...data].sort((a, b) => a.x - b.x);
  }

  // Convert y-values to points with uniform spacing
  return data.map((y, i) => ({ x: x0 + i * dx, y }));
}

/**
 * Type guard to check if data is an array of Points.
 * @internal
 */
function isPointArray(data: number[] | Point[]): data is Point[] {
  return (
    data.length > 0 &&
    typeof data[0] === 'object' &&
    data[0] !== null &&
    'x' in data[0] &&
    'y' in data[0]
  );
}

/**
 * Checks if points are reasonably uniformly spaced (within 10% variation).
 * @internal
 */
function isReasonablyUniform(points: Point[]): boolean {
  if (points.length < 3) return true;

  const spacings: number[] = [];
  for (let i = 1; i < points.length; i++) {
    spacings.push(points[i].x - points[i - 1].x);
  }

  const avgSpacing = spacings.reduce((a, b) => a + b, 0) / spacings.length;
  const maxDeviation = Math.max(...spacings.map((s) => Math.abs(s - avgSpacing)));

  return maxDeviation / avgSpacing < 0.1;
}

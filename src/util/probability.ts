/**
 * Calculates the normal probability density function
 * @param {number} x - Input value
 * @param {number} mu - Mean
 * @param {number} sigma - Standard deviation
 * @returns {number} - PDF value at x
 */
function normPdf(x: number, mu: number, sigma: number) {
  return (1 / (sigma * Math.sqrt(2 * Math.PI))) *
    Math.exp(-0.5 * Math.pow((x - mu) / sigma, 2));
}

type RandomSampleProps = {
  dist: (x: number) => number;
  maxTries?: number;
  positive?: boolean;
};


/**
 * Returns a function that calculates the mixture distribution value
 * f1(x) = (1-a)*0.1 + a*normPdf(x,0,1/(2^(2*a)))
 * 
 * @param {number} a - Mixture parameter between 0 and 1
 * @returns {function} - Function that takes x and returns the value of the mixture distribution at x
 */
export function createDistribution(a: number) {
  if (a < 0 || a > 1) {
    throw new Error("Parameter 'a' must be between 0 and 1");
  }

  const sigma = 1 / Math.pow(2, 5 * a);
  const uniformComponent = (1 - a) * 0.1;

  return function (x: number) {
    const normalComponent = a * normPdf(x, 0, sigma);
    return uniformComponent + normalComponent;
  };
}

// source: Monte Carlo Statistical Methods by Christian P. Robert and George Casella
export const takeRandomSample = ({ dist, maxTries = 1000, positive = false }: RandomSampleProps) => {
  const maxValue = dist(0); // Approximate upper bound

  for (let i = 0; i < maxTries; i++) {
    const x = Math.random() * 2 - 1; // Sample from a uniform proposal distribution in range [-1,1]
    const u = Math.random(); // Uniform random number in [0,1]

    if (u < dist(x) / maxValue) {
      if (Math.abs(x) > 1)
        console.warn("Sampled value is outside the range [-1, 1].");
      return positive ? Math.abs(x) : x; // ||x|| if positive is true
    }
  }

  // This happens when we exhausted all attempts
  throw new Error("Sampling failed after maximum attempts.");
};
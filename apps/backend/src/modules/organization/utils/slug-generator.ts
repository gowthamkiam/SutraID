const ADJECTIVES = [
  'cosmic', 'bright', 'swift', 'bold', 'keen', 'nonstop', 'silent',
  'rapid', 'vivid', 'noble', 'lucid', 'agile', 'astral', 'blazing',
  'calm', 'crisp', 'daring', 'eager', 'fierce', 'gentle', 'humble',
  'jolly', 'kinetic', 'lively', 'mighty', 'nimble', 'optimal', 'polar',
  'quantum', 'radiant', 'serene', 'tidal', 'unified', 'vast', 'wired',
  'zealous', 'amber', 'brisk', 'clever', 'deep', 'epic', 'fluid',
  'grand', 'hyper', 'ionic', 'jovial', 'keen', 'lunar', 'macro',
];

const NOUNS = [
  'cerulean', 'mango', 'coral', 'jade', 'azure', 'indigo', 'scarlet',
  'amber', 'cobalt', 'crimson', 'emerald', 'ivory', 'magenta', 'onyx',
  'pearl', 'quartz', 'ruby', 'sapphire', 'topaz', 'violet', 'bronze',
  'cypress', 'delta', 'falcon', 'granite', 'helix', 'iron', 'jasper',
  'krypton', 'lattice', 'matrix', 'nebula', 'orbit', 'prism', 'ridge',
  'sigma', 'tundra', 'umbra', 'vertex', 'wave', 'xenon', 'zenith',
  'aurora', 'beacon', 'cipher', 'dusk', 'echo', 'flux', 'glyph',
];

const SCIENTISTS = [
  'hawking', 'curie', 'tesla', 'turing', 'lovelace', 'dirac', 'planck',
  'bohr', 'faraday', 'galileo', 'kepler', 'newton', 'darwin', 'euler',
  'fermi', 'gauss', 'heisenberg', 'hopper', 'pascal', 'ramanujan',
  'rosalind', 'sagan', 'volta', 'watt', 'yang', 'feynman', 'noether',
  'babbage', 'bernoulli', 'copernicus', 'dalton', 'einstein', 'fourier',
  'hubble', 'joule', 'kelvin', 'laplace', 'maxwell', 'ohm', 'riemann',
  'schrodinger', 'shannon', 'thompson', 'turing', 'wigner', 'yukawa',
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Generate a random kebab-case organization slug.
 * Format: adjective-noun-scientist
 * Example: cosmic-mango-hawking, silent-quantum-otter
 */
export function generateRandomOrgSlug(): string {
  return `${pick(ADJECTIVES)}-${pick(NOUNS)}-${pick(SCIENTISTS)}`;
}

const ADJECTIVES = [
  'nonstop', 'cosmic', 'silent', 'brisk', 'lucid', 'steady', 'electric', 'solar', 'candid', 'fierce',
];

const COLORS_AND_OBJECTS = [
  'cerulean', 'mango', 'quantum', 'amber', 'onyx', 'jade', 'atlas', 'cobalt', 'ivory', 'ember',
];

const SCIENCE = [
  'dirac', 'hawking', 'otter', 'turing', 'curie', 'gauss', 'noether', 'kepler', 'feynman', 'tesla',
];

function pick(values: string[]): string {
  return values[Math.floor(Math.random() * values.length)];
}

export function generateRandomKebabOrgName(): string {
  return `${pick(ADJECTIVES)}-${pick(COLORS_AND_OBJECTS)}-${pick(SCIENCE)}`;
}

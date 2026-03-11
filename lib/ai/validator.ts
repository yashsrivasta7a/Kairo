import * as Babel from '@babel/standalone';

const FORBIDDEN_IMPORTS = [
  'expo-constants',
  'expo-image-picker',
  'expo-linear-gradient',
  'react-native-gesture-handler',
  'react-native-reanimated',
  'react-native-svg',
  '@react-navigation',
  'lodash',
  'moment',
  'axios',
  'uuid',
];

const FORBIDDEN_SCHEMA_TYPES = ['i.any(', 'i.json(', 'i.object(', 'i.array('];
const FORBIDDEN_DB_CALLS = ['db.reset(', 'db.queryOnce(', 'db.pause(', 'db.resume('];

export function validateCode(code: string): { valid: boolean; error?: string } {
  // 0. Detect sentinel — screen generator signalled a self-check failure
  if (code.trim() === '// INVALID_SCREEN' || code.includes('// INVALID_SCREEN')) {
    return { valid: false, error: 'Screen generator self-check failed (// INVALID_SCREEN sentinel detected).' };
  }

  // 1. Must have an export default
  if (!code.includes('export default')) {
    return { valid: false, error: 'Missing export default — app has no entry point.' };
  }

  // 2. Hardcoded runtime identifier check
  if (/(appId|buildId)\s*:\s*["']/.test(code)) {
    return { valid: false, error: 'Hardcoded runtime identifier detected — generated apps must use the provided buildDataId value.' };
  }

  // 3. Forbidden schema types
  for (const token of FORBIDDEN_SCHEMA_TYPES) {
    if (code.includes(token)) {
      return { valid: false, error: `Forbidden schema type "${token.replace('(', '')}" — only i.string(), i.number(), i.boolean() are allowed.` };
    }
  }

  // 4. Forbidden DB method calls
  for (const token of FORBIDDEN_DB_CALLS) {
    if (code.includes(token)) {
      return { valid: false, error: `Forbidden DB call "${token}" is not available in this environment.` };
    }
  }

  // 5. Check for forbidden package imports
  for (const pkg of FORBIDDEN_IMPORTS) {
    if (code.includes(`from '${pkg}'`) || code.includes(`from "${pkg}"`)) {
      return { valid: false, error: `Forbidden import: "${pkg}" is not available in preview.` };
    }
  }

  // 6. Try to Babel-parse it — catches syntax errors, unclosed JSX, etc.
  try {
    Babel.transform(code.trim(), {
      presets: [['env', { targets: { esmodules: true } }], 'react', 'typescript'],
      filename: 'component.tsx',
      plugins: [['transform-modules-commonjs', { strict: false }]],
    });
  } catch (err: any) {
    return { valid: false, error: `Syntax error: ${err.message}` };
  }

  return { valid: true };
}

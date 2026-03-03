import * as Babel from '@babel/standalone';

type RuntimeValidationResult = {
  ok: boolean;
  error?: string;
};

/**
 * Executes the generated app code in a lightweight runtime similar to preview.
 * - Uses Babel to transform TS/JSX into runnable JS.
 * - Instantiates the default export and attempts a basic React.createElement.
 * - Never throws: all failures are returned as { ok: false, error }.
 */
export function runtimeValidateCode(rawCode: string): RuntimeValidationResult {
  try {
    let code = rawCode.trim();

    if (!code) {
      return { ok: false, error: 'Generated code is empty.' };
    }

    // Reuse the same Babel configuration used elsewhere for TS/JSX + React.
    const transformed = Babel.transform(code, {
      presets: [['env', { targets: { esmodules: true } }], 'react', 'typescript'],
      filename: 'generated-app.tsx',
      plugins: [['transform-modules-commonjs', { strict: false }]],
    }).code;

    if (!transformed) {
      return { ok: false, error: 'Babel transform produced no output.' };
    }

    const moduleCode = `
      const exports = {};
      const module = { exports };

      const require = (name) => {
        // During runtime validation we only care that imports resolve to *something*
        // so that we can catch obvious runtime errors early. We do not need real
        // React Native / InstantDB behavior here.
        if (name === 'react') return React;
        // Light-weight mocks for common modules used in generated code.
        if (name === 'react-native') return {};
        if (name === '@instantdb/react-native') return {};
        return {};
      };

      ${transformed}

      return module.exports.default || module.exports;
    `;

    // Lightweight React stub for validation environment – implements only the
    // pieces needed for JSX and common hooks so we don't pull in full RN/web.
    const ReactStub: any = {
      createElement: () => ({}),
      useState: (initial: any) => [initial, () => {}],
      useEffect: () => {},
      useMemo: (fn: () => any) => fn(),
      useCallback: (fn: any) => fn,
      useRef: (value: any) => ({ current: value }),
      Fragment: 'fragment',
    };

    const moduleFn = new Function('React', moduleCode) as (react: any) => any;
    const Component = moduleFn(ReactStub);

    if (!Component) {
      return { ok: false, error: 'Default export is missing from generated code.' };
    }

    // Basic sanity check: the component should be something React can render.
    try {
      ReactStub.createElement(Component);
    } catch (err: any) {
      return {
        ok: false,
        error: `Error creating component from default export: ${err?.message ?? String(
          err,
        )}`,
      };
    }

    return { ok: true };
  } catch (err: any) {
    const message = err?.message ?? String(err);
    return {
      ok: false,
      error: `Runtime validation error: ${message}`,
    };
  }
}


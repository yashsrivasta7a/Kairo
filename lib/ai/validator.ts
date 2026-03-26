import * as Babel from "@babel/standalone";

const FORBIDDEN_IMPORTS = [
  "expo-constants",
  "expo-image-picker",
  "expo-linear-gradient",
  "react-native-gesture-handler",
  "react-native-reanimated",
  "react-native-svg",
  "@react-navigation",
  "lodash",
  "moment",
  "axios",
  "uuid",
];

const FORBIDDEN_SCHEMA_TYPES = ["i.any(", "i.json(", "i.object(", "i.array("];
const FORBIDDEN_DB_CALLS = ["db.reset(", "db.queryOnce(", "db.pause(", "db.resume("];
const FORBIDDEN_NAVIGATION_TOKENS = ["useRouter(", "useNavigation(", "navigation.", "router.", "history."];

export type ValidationMode = "final" | "screen" | "fragment";

export type ValidateCodeOptions = {
  mode?: ValidationMode;
  expectedName?: string;
  dataModelNames?: string[];
};

function babelParse(code: string) {
  Babel.transform(code.trim(), {
    presets: [["env", { targets: { esmodules: true } }], "react", "typescript"],
    filename: "component.tsx",
    plugins: [["transform-modules-commonjs", { strict: false }]],
  });
}

function validateCommonRules(code: string) {
  if (code.trim() === "// INVALID_SCREEN" || code.includes("// INVALID_SCREEN")) {
    return { valid: false, error: "Screen generator self-check failed (// INVALID_SCREEN sentinel detected)." };
  }

  if (/(appId|buildId)\s*:\s*["']/.test(code)) {
    return {
      valid: false,
      error: "Hardcoded runtime identifier detected — generated apps must use the provided buildDataId value.",
    };
  }

  for (const token of FORBIDDEN_SCHEMA_TYPES) {
    if (code.includes(token)) {
      return {
        valid: false,
        error: `Forbidden schema type "${token.replace("(", "")}" — only i.string(), i.number(), i.boolean() are allowed.`,
      };
    }
  }

  for (const token of FORBIDDEN_DB_CALLS) {
    if (code.includes(token)) {
      return { valid: false, error: `Forbidden DB call "${token}" is not available in this environment.` };
    }
  }

  for (const token of FORBIDDEN_NAVIGATION_TOKENS) {
    if (code.includes(token)) {
      return { valid: false, error: `Unsupported navigation token "${token}" detected in generated code.` };
    }
  }

  for (const pkg of FORBIDDEN_IMPORTS) {
    if (code.includes(`from '${pkg}'`) || code.includes(`from "${pkg}"`)) {
      return { valid: false, error: `Forbidden import: "${pkg}" is not available in preview.` };
    }
  }

  if (/TODO|FIXME|lorem ipsum/i.test(code)) {
    return { valid: false, error: "Generated code still contains placeholder text or unfinished markers." };
  }

  return { valid: true };
}

function validateKairoDataRules(code: string, dataModelNames: string[]) {
  if (dataModelNames.length === 0) {
    return { valid: true };
  }

  if (/Array\.isArray\(\s*data\s*\)/.test(code)) {
    return {
      valid: false,
      error: "Kairo query data is an object keyed by model names, not a bare array. Read rows with data?.ModelName ?? [].",
    };
  }

  if (/\._id\b/.test(code)) {
    return {
      valid: false,
      error: "Generated Kairo records expose id, not _id. Use item.id for updates and rendering keys.",
    };
  }

  if (/table\s*:\s*["']|fields\s*:|type\s*:\s*["'](?:insert|update|delete)["']/.test(code)) {
    return {
      valid: false,
      error: "Object-style db.transact operations are unsupported. Use db.tx.Model[id()].create/update/delete inside db.transact.",
    };
  }

  return { valid: true };
}

function validateScreenCode(code: string, expectedName?: string, dataModelNames: string[] = []) {
  if (!/^function\s+[A-Za-z0-9_]+\s*\(\{\s*db,\s*id,\s*data,\s*isLoading\s*\}\)\s*\{/m.test(code)) {
    return {
      valid: false,
      error: "Screen output must be a single function with signature function ScreenName({ db, id, data, isLoading }) { ... }.",
    };
  }

  if (expectedName) {
    const escaped = expectedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`function\\s+${escaped}\\s*\\(\\{\\s*db,\\s*id,\\s*data,\\s*isLoading\\s*\\}\\)\\s*\\{`);
    if (!pattern.test(code)) {
      return { valid: false, error: `Screen function name must be exactly "${expectedName}".` };
    }
  }

  if (!code.includes("StyleSheet.create")) {
    return { valid: false, error: "Screen code must define a StyleSheet.create(...) block." };
  }

  if (!code.includes("ActivityIndicator")) {
    return { valid: false, error: "Screen code must include an ActivityIndicator-based loading state." };
  }

  if (code.includes("export default") || code.includes("import ")) {
    return { valid: false, error: "Screen code must not include imports or exports." };
  }

  if (code.includes("require(")) {
    return { valid: false, error: "Screen code must not use require(...). Rely on the shared app imports instead." };
  }

  const kairoValidation = validateKairoDataRules(code, dataModelNames);
  if (!kairoValidation.valid) {
    return kairoValidation;
  }

  return { valid: true };
}

function validateFinalCode(code: string, dataModelNames: string[] = []) {
  if (!code.includes("export default")) {
    return { valid: false, error: "Missing export default — app has no entry point." };
  }

  if (!code.includes("@kairo/runtime")) {
    return { valid: false, error: "Final app must import and use the Kairo runtime." };
  }

  if (!code.includes("SafeAreaView")) {
    return { valid: false, error: "Final app must use SafeAreaView for the app shell." };
  }

  if (!code.includes("StyleSheet.create")) {
    return { valid: false, error: "Final app must define styles with StyleSheet.create(...)." };
  }

  if (!code.includes("buildDataId") && !code.includes("const db = null")) {
    return { valid: false, error: "Final app must use buildDataId for runtime wiring or explicitly set db to null." };
  }

  const entityNames = Array.from(code.matchAll(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*:\s*i\.entity\(/gm)).map((match) => match[1]);
  const lowered = new Set<string>();
  for (const name of entityNames) {
    const normalized = name.toLowerCase();
    if (lowered.has(normalized)) {
      return {
        valid: false,
        error: `Schema contains duplicate entity names that differ only by case ("${name}").`,
      };
    }
    lowered.add(normalized);
  }

  const kairoValidation = validateKairoDataRules(code, dataModelNames);
  if (!kairoValidation.valid) {
    return kairoValidation;
  }

  return { valid: true };
}

export function validateCode(code: string, options: ValidateCodeOptions = {}): { valid: boolean; error?: string } {
  const mode = options.mode ?? "final";
  const common = validateCommonRules(code);
  if (!common.valid) {
    return common;
  }

  if (mode === "screen") {
    const screenValidation = validateScreenCode(code, options.expectedName, options.dataModelNames ?? []);
    if (!screenValidation.valid) {
      return screenValidation;
    }
  }

  if (mode === "final") {
    const finalValidation = validateFinalCode(code, options.dataModelNames ?? []);
    if (!finalValidation.valid) {
      return finalValidation;
    }
  }

  try {
    babelParse(code);
  } catch (err: any) {
    return { valid: false, error: `Syntax error: ${err.message}` };
  }

  return { valid: true };
}

import { stepCountIs, streamText, type LanguageModelUsage } from "ai";
import { compactUserPrompt } from "./contextManager";
import { resolveProvider, type ModelProvider, type ProviderOverrides } from "./provider";
import { buildStageSystemPrompt } from "./systemPrompts";
import { generationTools } from "./tools";
import { validateCode } from "./validator";

const MAX_JSON_REPAIR_ATTEMPTS = 2;
const MAX_SCREEN_FIX_ATTEMPTS = 2;
const MAX_FINAL_FIX_ATTEMPTS = 3;
export type BuildMode = "fast" | "balanced";

type BuildStage =
  | "idle"
  | "planning"
  | "design"
  | "logic"
  | "screens"
  | "assembly"
  | "validation"
  | "completed"
  | "failed"
  | "specs"
  | "gluing";
type DebugStage = BuildStage | "repair" | `screen:${string}`;

type PipelineStatus = "generating" | "completed" | "failed";

type DataField = {
  name: string;
  type: "string" | "number" | "boolean";
  indexed: boolean;
};

type DataModel = {
  name: string;
  fields: DataField[];
};

type ScreenPlan = {
  name: string;
  purpose: string;
  uiHint: string;
  actions: string[];
};

type PlanningArtifact = {
  appName: string;
  initialScreen: string;
  productSummary: string;
  targetUser: string;
  uxNorthStar: string;
  logicNorthStar: string;
  accessibilityGoals: string[];
  loadingStateStrategy: string;
  emptyStateStrategy: string;
  errorRecoveryStrategy: string;
  screens: ScreenPlan[];
  dataModels: DataModel[];
};

type DesignScreenNote = {
  name: string;
  hierarchy: string;
  visualFocus: string;
  loadingState: string;
  emptyState: string;
  errorState: string;
  motion: string;
  accessibility: string;
  responsiveNotes: string;
  microcopyTone: string;
};

type DesignBrief = {
  visualDirection: string;
  interactionTone: string;
  layoutRules: string[];
  sharedComponents: string[];
  motionLanguage: string[];
  screenNotes: DesignScreenNote[];
};

type LogicScreenNote = {
  name: string;
  localState: string[];
  derivedState: string[];
  readData: string[];
  writeActions: string[];
  edgeCases: string[];
  retryStrategy: string[];
};

type LogicBrief = {
  stateArchitecture: string;
  dataArchitecture: string;
  validationStrategy: string;
  errorRecoveryStrategy: string;
  persistenceStrategy: string;
  screenNotes: LogicScreenNote[];
};

type PipelineHandlers = {
  onProgress?: (update: { status?: PipelineStatus; stage: BuildStage; updatedAt: number }) => Promise<void>;
  onStageChunk?: (update: { stage: DebugStage; output: string; updatedAt: number }) => Promise<void>;
  onUsage?: (update: {
    provider: string;
    model: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    updatedAt: number;
  }) => Promise<void>;
  onDebug?: (update: {
    stage: DebugStage;
    provider: string;
    model: string;
    promptPreview: string;
    responsePreview: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    updatedAt: number;
  }) => Promise<void>;
  onComplete?: (update: { code: string; status: "completed"; stage: "completed"; updatedAt: number }) => Promise<void>;
  onFailure?: (update: { error: string; status: "failed"; stage: "failed"; updatedAt: number }) => Promise<void>;
};

function emptyUsage(): LanguageModelUsage {
  return {
    inputTokens: 0,
    inputTokenDetails: {
      noCacheTokens: 0,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
    },
    outputTokens: 0,
    outputTokenDetails: {
      textTokens: 0,
      reasoningTokens: 0,
    },
    totalTokens: 0,
  };
}

function toSafeUsage(usage: LanguageModelUsage) {
  return {
    promptTokens: usage.inputTokens ?? 0,
    completionTokens: usage.outputTokens ?? 0,
    totalTokens: usage.totalTokens ?? (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0),
  };
}

function stripMarkdownFences(text: string) {
  return text
    .replace(/^```(?:json|js|jsx|ts|tsx|javascript)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

function extractJsonCandidate(text: string) {
  const cleaned = stripMarkdownFences(text);
  const objectStart = cleaned.indexOf("{");
  const objectEnd = cleaned.lastIndexOf("}");
  if (objectStart >= 0 && objectEnd > objectStart) {
    return cleaned.slice(objectStart, objectEnd + 1);
  }

  const arrayStart = cleaned.indexOf("[");
  const arrayEnd = cleaned.lastIndexOf("]");
  if (arrayStart >= 0 && arrayEnd > arrayStart) {
    return cleaned.slice(arrayStart, arrayEnd + 1);
  }

  return cleaned;
}

function safeJsonParse<T>(text: string, label: string): T {
  const candidate = extractJsonCandidate(text);
  try {
    return JSON.parse(candidate) as T;
  } catch (error: any) {
    throw new Error(`${label} stage returned invalid JSON: ${error?.message ?? String(error)}\nRaw output: ${text.slice(0, 400)}`);
  }
}

function toText(value: unknown, fallback: string) {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  return fallback;
}

function normalizeWord(value: string, fallback: string) {
  const raw = toText(value, fallback);
  const cleaned = raw.replace(/[^a-zA-Z0-9]+/g, " ").trim();
  if (!cleaned) {
    return fallback;
  }

  return cleaned
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

function normalizeAppName(value: string, fallback: string) {
  const words = toText(value, fallback)
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3);

  if (words.length === 0) {
    return "New App";
  }

  return words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function uniqueStrings(values: unknown[], fallback: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];

  for (const value of values) {
    if (typeof value !== "string") {
      continue;
    }

    const normalized = value.trim();
    if (!normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    out.push(normalized);
  }

  return out.length ? out : fallback;
}

function normalizeActions(value: unknown, fallbackSeed: string) {
  const raw = Array.isArray(value) ? value : [];
  const actions = uniqueStrings(raw, []);
  if (actions.length > 0) {
    return actions.slice(0, 3);
  }

  const seed = fallbackSeed.trim();
  if (!seed) {
    return ["Continue"];
  }

  if (/settings|profile|preferences/i.test(seed)) {
    return ["Open Settings"];
  }

  if (/search|discover|explore/i.test(seed)) {
    return ["Search"];
  }

  if (/add|create|new/i.test(seed)) {
    return ["Create"];
  }

  return ["Continue"];
}

function ensureScreenName(rawName: unknown, index: number) {
  const normalized = normalizeWord(typeof rawName === "string" ? rawName : `Screen ${index + 1}`, `Screen${index + 1}`);
  if (normalized.endsWith("Screen")) {
    return normalized;
  }

  return `${normalized || `Screen${index + 1}`}Screen`;
}

function normalizeFieldName(rawName: unknown, fallback: string) {
  const raw = toText(typeof rawName === "string" ? rawName : "", fallback);
  const cleaned = raw.replace(/[^a-zA-Z0-9]+/g, " ").trim();
  if (!cleaned) {
    return fallback;
  }

  const compact = cleaned.replace(/\s+/g, "");
  if (/^createdat$/i.test(compact)) {
    return "createdAt";
  }

  if (/^key$/i.test(compact)) {
    return "key";
  }

  const parts = cleaned.split(/\s+/).filter(Boolean);
  const [first = fallback, ...rest] = parts;
  const camel = [
    first.charAt(0).toLowerCase() + first.slice(1),
    ...rest.map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()),
  ].join("");

  return camel || fallback;
}

function normalizeModelName(rawName: unknown, index: number) {
  const raw = toText(typeof rawName === "string" ? rawName : "", `Model${index + 1}`);
  const compact = raw.replace(/[^a-zA-Z0-9]+/g, "");
  if (/^meta$/i.test(compact)) {
    return "meta";
  }

  return normalizeWord(raw, `Model${index + 1}`);
}

function normalizeScreens(rawScreens: unknown): ScreenPlan[] {
  const screens = Array.isArray(rawScreens) ? rawScreens : [];
  const used = new Set<string>();
  const normalized = screens
    .map((screen: any, index: number) => {
      const name = ensureScreenName(screen?.name, index);
      const uniqueName = used.has(name) ? `${name}${index + 1}` : name;
      used.add(uniqueName);

      return {
        name: uniqueName,
        purpose: toText(screen?.purpose, `Handle the main experience for ${uniqueName}.`),
        uiHint: toText(
          screen?.uiHint,
          "Focused mobile layout with a clear primary action, strong hierarchy, and obvious empty/loading states."
        ),
        actions: normalizeActions(screen?.actions, String(screen?.purpose ?? uniqueName)),
      };
    })
    .slice(0, 3);

  if (normalized.length > 0) {
    return normalized;
  }

  return [
    {
      name: "HomeScreen",
      purpose: "Main entry point for the app.",
      uiHint: "Hero header, concise summary, one primary action, and supportive secondary content.",
      actions: ["Continue"],
    },
  ];
}

function normalizeDataFields(rawFields: unknown) {
  const fields = Array.isArray(rawFields) ? rawFields : [];
  const used = new Set<string>();
  const normalized = fields
    .map((field: any) => {
      const name = normalizeFieldName(field?.name, "value");
      if (!name || used.has(name)) {
        return null;
      }

      used.add(name);
      const type: DataField["type"] =
        field?.type === "number" || field?.type === "boolean" || field?.type === "string" ? field.type : "string";

      return {
        name,
        type,
        indexed: Boolean(field?.indexed),
      } satisfies DataField;
    })
    .filter(Boolean) as DataField[];

  return normalized;
}

function normalizeDataModels(rawModels: unknown): DataModel[] {
  const models = Array.isArray(rawModels) ? rawModels : [];
  const usableModels = models
    .map((model: any, index: number) => {
      const name = normalizeModelName(model?.name, index);
      if (!name) {
        return null;
      }

      const fields = normalizeDataFields(model?.fields);
      if (name !== "meta" && !fields.some((field) => field.name === "createdAt")) {
        fields.push({ name: "createdAt", type: "number", indexed: true });
      }

      return { name, fields } satisfies DataModel;
    })
    .filter(Boolean) as DataModel[];

  const nonMeta = usableModels.filter((model) => model.name !== "meta").slice(0, 2);
  if (nonMeta.length === 0) {
    return [];
  }

  const metaModel: DataModel = {
    name: "meta",
    fields: [{ name: "key", type: "string", indexed: true }],
  };

  return [metaModel, ...nonMeta].slice(0, 3);
}

function normalizePlanningArtifact(raw: any, prompt: string): PlanningArtifact {
  const screens = normalizeScreens(raw?.screens);
  const dataModels = normalizeDataModels(raw?.dataModels);
  const requestedInitial = ensureScreenName(raw?.initialScreen ?? screens[0]?.name ?? "HomeScreen", 0);
  const initialScreen = screens.some((screen) => screen.name === requestedInitial) ? requestedInitial : screens[0].name;

  return {
    appName: normalizeAppName(raw?.appName, prompt),
    initialScreen,
    productSummary: toText(raw?.productSummary, `A focused app generated from: ${prompt.slice(0, 120)}`),
    targetUser: toText(raw?.targetUser, "People who want a simple, polished mobile experience."),
    uxNorthStar: toText(
      raw?.uxNorthStar,
      "Make the app clear in under a few seconds, keep the primary action obvious, and reduce friction on every screen."
    ),
    logicNorthStar: toText(
      raw?.logicNorthStar,
      "Keep state minimal, preserve user input, separate reads from writes, and make recovery from errors straightforward."
    ),
    accessibilityGoals: uniqueStrings(raw?.accessibilityGoals ?? [], [
      "Large touch targets",
      "Clear contrast",
      "Helpful labels and feedback",
    ]),
    loadingStateStrategy: toText(
      raw?.loadingStateStrategy,
      "Show a centered loading state with a short status message and avoid layout jumps."
    ),
    emptyStateStrategy: toText(
      raw?.emptyStateStrategy,
      "Explain why the screen is empty and point the user to the next useful action."
    ),
    errorRecoveryStrategy: toText(
      raw?.errorRecoveryStrategy,
      "Keep the user's progress intact, explain the problem plainly, and offer a clear retry path."
    ),
    screens,
    dataModels,
  };
}

function findNote<T extends { name: string }>(items: T[], name: string) {
  return items.find((item) => item.name === name) ?? items[0];
}

async function runStreamingStage({
  prompt,
  stagePrompt,
  onChunk,
  modelProvider,
  modelChoice,
  providerOverrides,
}: {
  prompt: string;
  stagePrompt: string;
  onChunk?: (text: string) => Promise<void>;
  modelProvider?: ModelProvider;
  modelChoice?: string;
  providerOverrides?: ProviderOverrides;
}) {
  const provider = resolveProvider(modelProvider, modelChoice, providerOverrides);
  let finalUsage = emptyUsage();

  const result = streamText({
    model: provider.model,
    maxOutputTokens: provider.maxOutputTokens,
    messages: [
      { role: "system", content: buildStageSystemPrompt(stagePrompt) },
      { role: "user", content: prompt },
    ],
    tools: generationTools(),
    toolChoice: "auto",
    stopWhen: stepCountIs(8),
    onFinish: ({ usage }) => {
      finalUsage = usage;
    },
  });

  let text = "";
  for await (const chunk of result.textStream) {
    text += chunk;
    if (onChunk) {
      await onChunk(text);
    }
  }

  return {
    text,
    usage: finalUsage,
    provider: provider.provider,
    model: provider.modelId,
  };
}

async function collectUsage({
  handlers,
  stage,
  usage,
  stagePrompt,
  responseText,
  provider,
  model,
  totals,
}: {
  handlers?: PipelineHandlers;
  stage: DebugStage;
  usage: LanguageModelUsage;
  stagePrompt: string;
  responseText: string;
  provider: string;
  model: string;
  totals: { promptTokens: number; completionTokens: number; totalTokens: number };
}) {
  const safe = toSafeUsage(usage);
  totals.promptTokens += safe.promptTokens;
  totals.completionTokens += safe.completionTokens;
  totals.totalTokens += safe.totalTokens;

  await handlers?.onUsage?.({
    provider,
    model,
    ...totals,
    updatedAt: Date.now(),
  });

  await handlers?.onDebug?.({
    stage,
    provider,
    model,
    promptPreview: stagePrompt.slice(0, 2000),
    responsePreview: responseText.slice(0, 5000),
    ...safe,
    updatedAt: Date.now(),
  });
}

async function runJsonAgent<T>({
  label,
  stage,
  prompt,
  stagePrompt,
  modelProvider,
  modelChoice,
  providerOverrides,
  handlers,
  totals,
}: {
  label: string;
  stage: DebugStage;
  prompt: string;
  stagePrompt: string;
  modelProvider?: ModelProvider;
  modelChoice?: string;
  providerOverrides?: ProviderOverrides;
  handlers?: PipelineHandlers;
  totals: { promptTokens: number; completionTokens: number; totalTokens: number };
}) {
  let lastRaw = "";
  let lastError: string | undefined;
  let currentPrompt = prompt;

  for (let attempt = 1; attempt <= MAX_JSON_REPAIR_ATTEMPTS; attempt++) {
    const result = await runStreamingStage({
      prompt: currentPrompt,
      stagePrompt,
      modelProvider,
      modelChoice,
      providerOverrides,
      onChunk: async (output) => {
        await handlers?.onStageChunk?.({
          stage,
          output,
          updatedAt: Date.now(),
        });
      },
    });

    lastRaw = result.text;
    await collectUsage({
      handlers,
      stage,
      usage: result.usage,
      stagePrompt,
      responseText: result.text,
      provider: result.provider,
      model: result.model,
      totals,
    });

    try {
      return {
        ...result,
        artifact: safeJsonParse<T>(result.text, label),
      };
    } catch (error: any) {
      lastError = error?.message ?? String(error);
      if (attempt === MAX_JSON_REPAIR_ATTEMPTS) {
        throw error;
      }

      currentPrompt = [
        prompt,
        "",
        "The previous response did not match the JSON contract.",
        `Validation error: ${lastError}`,
        "Return valid JSON only. No markdown. No prose.",
        `Previous output:\n${lastRaw.slice(0, 4000)}`,
      ].join("\n");
    }
  }

  throw new Error(`${label} stage failed unexpectedly.`);
}

function buildPlanningPrompt(userPrompt: string) {
  return `You are the planning agent for a mobile app generator.
Output ONLY valid JSON. No markdown. No prose.

Your job is to convert the user's request into the smallest polished mobile app that solves the problem well.
Optimize for strong UX, low cognitive load, and clear handoffs to later design and logic agents.

USER REQUEST:
${userPrompt}

OUTPUT SCHEMA:
{
  "appName": string,
  "initialScreen": string,
  "productSummary": string,
  "targetUser": string,
  "uxNorthStar": string,
  "logicNorthStar": string,
  "accessibilityGoals": string[],
  "loadingStateStrategy": string,
  "emptyStateStrategy": string,
  "errorRecoveryStrategy": string,
  "screens": [
    {
      "name": string,
      "purpose": string,
      "uiHint": string,
      "actions": string[]
    }
  ],
  "dataModels": [
    {
      "name": string,
      "fields": [
        {
          "name": string,
          "type": "string" | "number" | "boolean",
          "indexed": boolean
        }
      ]
    }
  ]
}

RULES:
- Use the minimum number of screens necessary.
- Never exceed 3 screens.
- If the app needs persistence, use at most 3 data models total.
- Screen names must be PascalCase and end with Screen.
- initialScreen must match one of the screen names.
- Each screen must have 1 to 3 user-facing actions.
- Keep appName short and brandable.
- Use mobile-first UI hints that describe the actual layout.
- If dataModels is non-empty, include a meta model with a key field and add createdAt to every non-meta model.
- Prefer direct, clear microcopy and a single primary path through the app.
- If the idea is simple, keep it simple. If the idea is complex, split it into the fewest useful screens.`;
}

function buildDesignPrompt(plan: PlanningArtifact) {
  return `You are the UX and visual design agent.
Output ONLY valid JSON. No markdown. No prose.

You are turning the planning artifact into a polished mobile UX system.
Focus on hierarchy, spacing, readability, state design, and microcopy. Do not solve business logic here except where it affects user experience.

PLANNING ARTIFACT:
${JSON.stringify(plan, null, 2)}

OUTPUT SCHEMA:
{
  "visualDirection": string,
  "interactionTone": string,
  "layoutRules": string[],
  "sharedComponents": string[],
  "motionLanguage": string[],
  "screenNotes": [
    {
      "name": string,
      "hierarchy": string,
      "visualFocus": string,
      "loadingState": string,
      "emptyState": string,
      "errorState": string,
      "motion": string,
      "accessibility": string,
      "responsiveNotes": string,
      "microcopyTone": string
    }
  ]
}

RULES:
- Keep the design calm, intentional, and easy to scan.
- Make the primary action obvious on each screen.
- Define clear loading, empty, and error states for each screen.
- Prefer cards, lists, forms, tabs, and bottom sheets over cluttered UI.
- Use accessible touch targets and stable visual hierarchy.
- Avoid over-decorating; the screen should feel polished, not busy.`;
}

function buildLogicPrompt(plan: PlanningArtifact, designBrief: DesignBrief) {
  return `You are the application logic architect.
Output ONLY valid JSON. No markdown. No prose.

You are turning the planning artifact and UX brief into reliable state and data flow guidance.
Focus on what should be queried, what should be local state, how writes happen, and how errors are recovered.
Do not talk about colors or visuals except when they affect usability.

PLANNING ARTIFACT:
${JSON.stringify(plan, null, 2)}

UX BRIEF:
${JSON.stringify(designBrief, null, 2)}

OUTPUT SCHEMA:
{
  "stateArchitecture": string,
  "dataArchitecture": string,
  "validationStrategy": string,
  "errorRecoveryStrategy": string,
  "persistenceStrategy": string,
  "screenNotes": [
    {
      "name": string,
      "localState": string[],
      "derivedState": string[],
      "readData": string[],
      "writeActions": string[],
      "edgeCases": string[],
      "retryStrategy": string[]
    }
  ]
}

RULES:
- Keep local state minimal and purposeful.
- Separate derived state from source of truth.
- Preserve user input when something fails.
- Make retries explicit and understandable.
- If dataModels are present, describe how reads and writes should map to them.
- If the app is purely computational, keep the logic local and simple.
- Screen functions receive data and isLoading from the app shell, so do not invent extra data loading layers here.`;
}

function buildScreenPrompt({
  plan,
  designBrief,
  logicBrief,
  screen,
}: {
  plan: PlanningArtifact;
  designBrief: DesignBrief;
  logicBrief: LogicBrief;
  screen: ScreenPlan;
}) {
  const designNote = findNote(designBrief.screenNotes, screen.name);
  const logicNote = findNote(logicBrief.screenNotes, screen.name);
  const dataModels = plan.dataModels.length ? JSON.stringify(plan.dataModels, null, 2) : "[]";
  const primaryModel = plan.dataModels.find((model) => model.name !== "meta")?.name ?? plan.dataModels[0]?.name ?? "Item";
  const modelShapeExample = plan.dataModels.length
    ? `{ ${plan.dataModels.map((model) => `${model.name}: ${model.name === "meta" ? "[{ key: 'app', id: 'meta_1' }]" : `[{ id: 'row_1', ...${model.name}Fields }]`}`).join(", ")} }`
    : "null";

  return `You are the screen implementation agent for a mobile app generator.
Output ONLY a single JavaScript function declaration. No imports. No exports. No markdown. No explanation.

You are writing exactly one screen for this app:
App: ${plan.appName}
Screen: ${screen.name}
Purpose: ${screen.purpose}
UI Layout: ${screen.uiHint}
Actions the user can do: ${screen.actions.join(", ")}

UX HANDOFF:
${JSON.stringify(designNote, null, 2)}

LOGIC HANDOFF:
${JSON.stringify(logicNote, null, 2)}

DATA MODELS:
${dataModels}

OUTPUT RULES:
- Output exactly: function ${screen.name}({ db, id, data, isLoading }) { ... }
- No imports. No exports. No navigation/history/router assumptions.
- All visible text must be rendered inside <Text>.
- Use React.useState for local state when needed.
- If data exists, do not call db.useQuery; the app shell already passes data and isLoading.
- Use db.transact only if the app has data models and the screen performs writes.
- When data models exist, data is an object keyed by model name, for example: ${modelShapeExample}
- Never treat data as a bare array. Read rows with data?.ModelName ?? []
- Kairo records use id, never _id
- For writes, use ONLY this syntax:
  db.transact([db.tx.${primaryModel}[id()].create({ createdAt: Date.now() })])
  db.transact([db.tx.${primaryModel}[item.id].update({ fieldName: nextValue })])
  db.transact([db.tx.${primaryModel}[item.id].delete()])
- Never use object-style operations like { table, type, fields }
- Show a centered loading state when isLoading is true.
- Show a useful empty state with one clear next action when there is no content yet.
- Keep the primary action obvious and the layout easy to scan.
- Use StyleSheet.create inside the component before return().
- Favor accessible touch targets, clear feedback, and concise microcopy.
- Keep the implementation compatible with Expo React Native and the generated app runtime.
- If something is uncertain, simplify the UI instead of inventing new capabilities.`;
}

function buildScreenRepairPrompt({
  screenName,
  errorMessage,
  previousOutput,
}: {
  screenName: string;
  errorMessage: string;
  previousOutput: string;
}) {
  return `The previous implementation for ${screenName} failed validation.
Fix ONLY the problem described below and output the full corrected JavaScript function.
No markdown. No explanation.

VALIDATION ERROR:
${errorMessage}

PREVIOUS OUTPUT:
${previousOutput.slice(0, 5000)}

Keep the function signature and UX intent intact.`;
}

function buildAssemblyPrompt({
  plan,
  designBrief,
  logicBrief,
  screenCodes,
}: {
  plan: PlanningArtifact;
  designBrief: DesignBrief;
  logicBrief: LogicBrief;
  screenCodes: string[];
}) {
  const screenNames = plan.screens.map((screen) => screen.name);
  const hasData = plan.dataModels.length > 0;
  const queryEntities = plan.dataModels.map((model) => `${model.name}: {}`).join(",\n    ");
  const schemaEntities = plan.dataModels
    .map((model) => {
      const fields = model.fields
        .map((field) => {
          let type = `i.${field.type}()`;
          if (field.indexed) {
            type += ".indexed()";
          }
          return `      ${field.name}: ${type},`;
        })
        .join("\n");

      return `    ${model.name}: i.entity({\n${fields}\n    }),`;
    })
    .join("\n");

  return `You are the final integration agent.
Output ONLY valid JavaScript. No markdown. No explanation.

Screen functions are authoritative and must be copied EXACTLY as provided.
Do not modify the screen function bodies unless absolutely necessary to fix a compile error in the final assembly.

APP PLAN:
${JSON.stringify(plan, null, 2)}

UX BRIEF:
${JSON.stringify(designBrief, null, 2)}

LOGIC BRIEF:
${JSON.stringify(logicBrief, null, 2)}

PRE-BUILT SCREEN FUNCTIONS:
${screenCodes.map((code, index) => `// === ${screenNames[index]} ===\n${code}`).join("\n\n")}

YOUR JOB: assemble the final app in this exact order

STEP 1 - IMPORTS:
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, ActivityIndicator, FlatList, TextInput, ScrollView, Modal, Alert, Animated, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import { init, id, i } from '@kairo/runtime';

${
  hasData
    ? `STEP 2 - SCHEMA:
const schema = i.schema({
  entities: {
${schemaEntities}
  },
});

STEP 3 - DB INIT:
const db = init({ buildId: buildDataId, schema });`
    : `STEP 2 - NO SCHEMA NEEDED:
const db = null; // no data needed`
}

STEP 4 - SCREEN FUNCTIONS:
Paste all screen functions exactly as provided. Do not modify them.

STEP 5 - MAIN APP FUNCTION:
export default function App() {
  const [activeTab, setActiveTab] = useState('${plan.initialScreen}');
${
  hasData
    ? `
  // Single useQuery at the app shell; data is passed into each screen.
  const { data, isLoading } = db.useQuery({
    ${queryEntities}
  });`
    : `
  const data = null;
  const isLoading = false;`
}
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0A0F' }}>
      <StatusBar barStyle="light-content" />
      <View style={{ flex: 1 }}>
        ${screenNames
          .map((name) => `{activeTab === '${name}' && <${name} db={db} id={id} data={data} isLoading={isLoading} />}`)
          .join("\n        ")}
      </View>
${
  screenNames.length > 1
    ? `      <View style={tabStyles.tabBar}>
        {${JSON.stringify(screenNames)}.map(tab => (
          <TouchableOpacity key={tab} style={tabStyles.tabItem} onPress={() => setActiveTab(tab)}>
            <Text style={[tabStyles.tabLabel, activeTab === tab && tabStyles.tabActive]}>
              {tab.replace('Screen', '')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>`
    : ""
}
    </SafeAreaView>
  );
}

STEP 6 - TAB BAR STYLES:
const tabStyles = StyleSheet.create({
  tabBar: { flexDirection: 'row', backgroundColor: '#111118', borderTopWidth: 1, borderTopColor: '#2A2A3A', paddingBottom: Platform.OS === 'ios' ? 20 : 8, paddingTop: 10 },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 6 },
  tabLabel: { fontSize: 12, color: '#71717A', fontWeight: '500' },
  tabActive: { color: '#8B5CF6', fontWeight: '700' },
});

FINAL RULES:
- Output only code.
- Start with: import React
- End with the closing brace of export default function App()
- Never hardcode buildDataId.
- Never use unsupported DB helpers or forbidden imports.
- Prefer a clear, polished UX with strong empty/loading states and simple navigation.`;
}

async function runScreenAgent({
  plan,
  designBrief,
  logicBrief,
  screen,
  modelProvider,
  modelChoice,
  providerOverrides,
  handlers,
  totals,
}: {
  plan: PlanningArtifact;
  designBrief: DesignBrief;
  logicBrief: LogicBrief;
  screen: ScreenPlan;
  modelProvider?: ModelProvider;
  modelChoice?: string;
  providerOverrides?: ProviderOverrides;
  handlers?: PipelineHandlers;
  totals: { promptTokens: number; completionTokens: number; totalTokens: number };
}) {
  let previousOutput = "";
  let lastError = "";

  for (let attempt = 1; attempt <= MAX_SCREEN_FIX_ATTEMPTS; attempt++) {
    const prompt =
      attempt === 1
        ? buildScreenPrompt({ plan, designBrief, logicBrief, screen })
        : buildScreenRepairPrompt({
            screenName: screen.name,
            errorMessage: lastError,
            previousOutput,
          });

    const result = await runStreamingStage({
      prompt,
      stagePrompt: `You are an expert React Native implementation agent. Follow the screen prompt exactly and produce production-quality screen code.`,
      modelProvider,
      modelChoice,
      providerOverrides,
      onChunk: async (output) => {
        await handlers?.onStageChunk?.({
          stage: `screen:${screen.name}`,
          output,
          updatedAt: Date.now(),
        });
      },
    });

    previousOutput = stripMarkdownFences(result.text);

    await collectUsage({
      handlers,
      stage: `screen:${screen.name}`,
      usage: result.usage,
      stagePrompt: prompt,
      responseText: result.text,
      provider: result.provider,
      model: result.model,
      totals,
    });

    const validation = validateCode(previousOutput, {
      mode: "screen",
      expectedName: screen.name,
      dataModelNames: plan.dataModels.map((model) => model.name),
    });
    if (validation.valid) {
      return {
        text: previousOutput,
        usage: result.usage,
        provider: result.provider,
        model: result.model,
      };
    }

    lastError = validation.error ?? `Screen ${screen.name} failed validation.`;
  }

  throw new Error(`Failed to generate a valid implementation for ${screen.name}: ${lastError}`);
}

async function validateFinalCode({
  code,
  plan,
  designBrief,
  logicBrief,
  modelProvider,
  modelChoice,
  providerOverrides,
  handlers,
  totals,
}: {
  code: string;
  plan: PlanningArtifact;
  designBrief: DesignBrief;
  logicBrief: LogicBrief;
  modelProvider?: ModelProvider;
  modelChoice?: string;
  providerOverrides?: ProviderOverrides;
  handlers?: PipelineHandlers;
  totals: { promptTokens: number; completionTokens: number; totalTokens: number };
}) {
  let codeToFix = stripMarkdownFences(code);
  const collectedErrors: string[] = [];

  for (let attempt = 1; attempt <= MAX_FINAL_FIX_ATTEMPTS; attempt++) {
    const validation = validateCode(codeToFix, {
      mode: "final",
      dataModelNames: plan.dataModels.map((model) => model.name),
    });

    if (validation.valid) {
      await handlers?.onComplete?.({
        code: codeToFix,
        status: "completed",
        stage: "completed",
        updatedAt: Date.now(),
      });

      return codeToFix;
    }

    const errorMessage = validation.error ?? "Final code validation failed.";
    collectedErrors.push(`Attempt ${attempt}/${MAX_FINAL_FIX_ATTEMPTS}: ${errorMessage}`);
    if (attempt === MAX_FINAL_FIX_ATTEMPTS) {
      break;
    }

    const repairPrompt = `You are a surgical code fixer.
Output ONLY the corrected JavaScript file. No markdown. No explanation.

FINAL ASSEMBLY ERROR:
${errorMessage}

CURRENT CODE:
${codeToFix.slice(0, 12000)}

APP PLAN:
${JSON.stringify(plan, null, 2)}

UX BRIEF:
${JSON.stringify(designBrief, null, 2)}

LOGIC BRIEF:
${JSON.stringify(logicBrief, null, 2)}

Keep the screen functions and UX structure intact unless the error forces a minimal correction.`;

    const result = await runStreamingStage({
      prompt: repairPrompt,
      stagePrompt:
        "You are a code fixer. Return only corrected React Native JavaScript. Preserve the existing app structure and focus on the exact validation failure.",
      modelProvider,
      modelChoice,
      providerOverrides,
      onChunk: async (output) => {
        await handlers?.onStageChunk?.({
          stage: "validation",
          output,
          updatedAt: Date.now(),
        });
      },
    });

    await collectUsage({
      handlers,
      stage: "validation",
      usage: result.usage,
      stagePrompt: repairPrompt,
      responseText: result.text,
      provider: result.provider,
      model: result.model,
      totals,
    });

    codeToFix = stripMarkdownFences(result.text);
  }

  throw new Error(`All ${MAX_FINAL_FIX_ATTEMPTS} final validation attempts failed:\n${collectedErrors.join("\n")}`);
}

export async function runPipeline({
  prompt,
  buildMode = "balanced",
  modelProvider,
  modelChoice,
  providerOverrides,
  handlers,
}: {
  prompt: string;
  buildMode?: BuildMode;
  modelProvider?: ModelProvider;
  modelChoice?: string;
  providerOverrides?: ProviderOverrides;
  handlers?: PipelineHandlers;
}) {
  const totals = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
  const compacted = compactUserPrompt(prompt);
  let currentStage: BuildStage = "idle";
  let currentDebugStage: DebugStage = "planning";
  let activeProvider = "";
  let activeModel = "";
  let lastCode: string | undefined;
  const isFastMode = buildMode === "fast";

  try {
    currentStage = "planning";
    await handlers?.onProgress?.({
      status: "generating",
      stage: "planning",
      updatedAt: Date.now(),
    });

    const planningStagePrompt = buildPlanningPrompt(compacted.prompt);
    currentDebugStage = "planning";
    const planningResult = await runJsonAgent<PlanningArtifact>({
      label: "planning",
      stage: currentDebugStage,
      prompt: compacted.prompt,
      stagePrompt: planningStagePrompt,
      modelProvider,
      modelChoice,
      providerOverrides,
      handlers,
      totals,
    });
    const planning = normalizePlanningArtifact(planningResult.artifact, compacted.prompt);
    activeProvider = planningResult.provider;
    activeModel = planningResult.model;
    let resolvedDesignBrief: DesignBrief;
    if (isFastMode) {
      resolvedDesignBrief = {
        visualDirection: "Fast mode: keep the interface clean, readable, and simple.",
        interactionTone: "direct and lightweight",
        layoutRules: [
          "Keep one clear primary action per screen",
          "Use simple card sections and stable spacing",
          "Include intentional loading and empty states",
        ],
        sharedComponents: ["Header", "Primary button", "Simple card", "List rows"],
        motionLanguage: ["Prefer no extra motion unless feedback is needed"],
        screenNotes: planning.screens.map((screen) => ({
          name: screen.name,
          hierarchy: screen.uiHint,
          visualFocus: "Prioritize readability and fast comprehension.",
          loadingState: planning.loadingStateStrategy,
          emptyState: planning.emptyStateStrategy,
          errorState: planning.errorRecoveryStrategy,
          motion: "Minimal motion; prefer instant feedback.",
          accessibility: planning.accessibilityGoals.join(", "),
          responsiveNotes: "Keep layout simple and comfortable on mobile widths.",
          microcopyTone: "Clear and concise",
        })),
      };
    } else {
      currentStage = "design";
      await handlers?.onProgress?.({
        status: "generating",
        stage: "design",
        updatedAt: Date.now(),
      });
    }

    if (!isFastMode) {
      currentDebugStage = "design";
      const designStagePrompt = buildDesignPrompt(planning);
      const designResult = await runJsonAgent<DesignBrief>({
        label: "design",
        stage: currentDebugStage,
        prompt: JSON.stringify(planning, null, 2),
        stagePrompt: designStagePrompt,
        modelProvider,
        modelChoice,
        providerOverrides,
        handlers,
        totals,
      });
      resolvedDesignBrief = designResult.artifact;
      activeProvider = designResult.provider;
      activeModel = designResult.model;
    }

    let resolvedLogicBrief: LogicBrief;
    if (isFastMode) {
      resolvedLogicBrief = {
        stateArchitecture: "Fast mode: keep local state minimal and obvious.",
        dataArchitecture: planning.dataModels.length
          ? "Read at the app shell and perform writes with explicit db.transact calls."
          : "Use local screen state only.",
        validationStrategy: "Validate user input inline and keep actions deterministic.",
        errorRecoveryStrategy: planning.errorRecoveryStrategy,
        persistenceStrategy: planning.dataModels.length ? "Persist only the core loop entities." : "No persistence required.",
        screenNotes: planning.screens.map((screen) => ({
          name: screen.name,
          localState: ["Minimal local form and UI state only"],
          derivedState: ["Compute filtered and summary values from existing state"],
          readData: planning.dataModels.length ? ["Use shell-provided data"] : ["No remote data"],
          writeActions: screen.actions,
          edgeCases: ["Empty state", "Invalid input", "Duplicate actions"],
          retryStrategy: ["Keep user input intact and show a clear retry path"],
        })),
      };
    } else {
      currentStage = "logic";
      await handlers?.onProgress?.({
        status: "generating",
        stage: "logic",
        updatedAt: Date.now(),
      });
    }

    if (!isFastMode) {
      currentDebugStage = "logic";
      const logicStagePrompt = buildLogicPrompt(planning, resolvedDesignBrief);
      const logicResult = await runJsonAgent<LogicBrief>({
        label: "logic",
        stage: currentDebugStage,
        prompt: JSON.stringify({ planning, designBrief: resolvedDesignBrief }, null, 2),
        stagePrompt: logicStagePrompt,
        modelProvider,
        modelChoice,
        providerOverrides,
        handlers,
        totals,
      });
      resolvedLogicBrief = logicResult.artifact;
      activeProvider = logicResult.provider;
      activeModel = logicResult.model;
    }

    currentStage = "screens";
    await handlers?.onProgress?.({
      status: "generating",
      stage: "screens",
      updatedAt: Date.now(),
    });

    const screenCodes: string[] = [];
    for (const screen of planning.screens) {
      currentDebugStage = `screen:${screen.name}`;
      const result = await runScreenAgent({
        plan: planning,
        designBrief: resolvedDesignBrief,
        logicBrief: resolvedLogicBrief,
        screen,
        modelProvider,
        modelChoice,
        providerOverrides,
        handlers,
        totals,
      });
      screenCodes.push(result.text);
      activeProvider = result.provider;
      activeModel = result.model;
      lastCode = result.text;
    }

    currentStage = "assembly";
    await handlers?.onProgress?.({
      status: "generating",
      stage: "assembly",
      updatedAt: Date.now(),
    });

    currentDebugStage = "assembly";
    const assemblyPrompt = buildAssemblyPrompt({
      plan: planning,
      designBrief: resolvedDesignBrief,
      logicBrief: resolvedLogicBrief,
      screenCodes,
    });

    const assemblyResult = await runStreamingStage({
      prompt: assemblyPrompt,
      stagePrompt:
        "You are the final assembly agent. Preserve the screen implementations exactly and emit only valid JavaScript for the complete app.",
      modelProvider,
      modelChoice,
      providerOverrides,
      onChunk: async (output) => {
        await handlers?.onStageChunk?.({
          stage: "assembly",
          output,
          updatedAt: Date.now(),
        });
      },
    });

    await collectUsage({
      handlers,
      stage: "assembly",
      usage: assemblyResult.usage,
      stagePrompt: assemblyPrompt,
      responseText: assemblyResult.text,
      provider: assemblyResult.provider,
      model: assemblyResult.model,
      totals,
    });

    activeProvider = assemblyResult.provider;
    activeModel = assemblyResult.model;
    lastCode = stripMarkdownFences(assemblyResult.text);

    currentStage = "validation";
    await handlers?.onProgress?.({
      status: "generating",
      stage: "validation",
      updatedAt: Date.now(),
    });

    const validatedCode = await validateFinalCode({
      code: lastCode,
      plan: planning,
      designBrief: resolvedDesignBrief,
      logicBrief: resolvedLogicBrief,
      modelProvider,
      modelChoice,
      providerOverrides,
      handlers,
      totals,
    });

    await handlers?.onProgress?.({
      status: "completed",
      stage: "completed",
      updatedAt: Date.now(),
    });

    return {
      code: validatedCode,
      usage: totals,
      provider: activeProvider,
      model: activeModel,
    };
  } catch (error: any) {
    console.error("Pipeline failed:", error);
    const serializedError = JSON.stringify({
      stage: currentStage,
      debugStage: currentDebugStage,
      message: error?.message ?? String(error),
      hint: lastCode?.slice(0, 300),
      provider: activeProvider || undefined,
      model: activeModel || undefined,
      usage: totals,
    });

    await handlers?.onFailure?.({
      error: serializedError,
      status: "failed",
      stage: "failed",
      updatedAt: Date.now(),
    });

    throw error;
  }
}

import { tool } from "ai";
import { z } from "zod";
import { validateCode } from "./validator";

const docsByTopic: Record<string, string> = {
  "react-native-list":
    "Use FlatList for dynamic lists. Keep keyExtractor stable. Avoid nested ScrollView + FlatList unless necessary. Prefer empty and loading states that do not shift layout.",
  "react-native-state":
    "Prefer local React.useState for screen-local interactions. Keep state shape minimal and serializable. Preserve user input when a request fails.",
  convex:
    "Use init({ buildId: buildDataId, schema }) once. Query at App root and pass data to screens. Query results are objects keyed by model names, and rows use id (not _id). For writes use db.transact([db.tx.ModelName[id()].create(...)]) or db.tx.ModelName[item.id].update/delete().",
  styling:
    "Define StyleSheet.create before return. Reuse tokenized colors and spacing. Keep contrast and touch targets accessible. Use visual hierarchy to make the primary action obvious.",
  "ux-loading":
    "Loading states should explain what is happening, stay centered or near the affected region, and avoid layout jumps. Prefer a short status line plus an ActivityIndicator.",
  "ux-empty":
    "Empty states should explain why the screen is empty, reduce uncertainty, and offer the next useful action. Avoid dead ends and generic copy.",
  "ux-accessibility":
    "Use readable text sizes, large touch targets, useful labels, and high contrast. Do not rely on color alone to communicate status.",
  "ux-navigation":
    "Keep navigation shallow. Use one clear primary path, preserve back behavior, and only add tabs or secondary destinations when the app truly needs them.",
  "logic-state":
    "Separate source of truth from derived state. Keep local state minimal, derive computed values in render, and preserve user edits across retries.",
  "logic-data-flow":
    "Route reads through the app shell, keep write paths explicit, and map each screen to the smallest data shape it needs. Do not invent extra network layers.",
  "logic-error-recovery":
    "Keep the user's progress intact, surface the failure plainly, and make retry paths obvious. Prefer recoverable errors over hard stops.",
  "mobile-layout":
    "Prefer card sections, compact headers, and clear CTA ordering. Avoid clutter, long unbroken text, and unnecessary nesting.",
};

export function generationTools() {
  return {
    lookupDocs: tool({
      description: "Lookup implementation guidance for React Native, Convex runtime usage, UX patterns, and logic handoffs.",
      inputSchema: z.object({
        topic: z
          .enum([
            "react-native-list",
            "react-native-state",
            "convex",
            "styling",
            "ux-loading",
            "ux-empty",
            "ux-accessibility",
            "ux-navigation",
            "logic-state",
            "logic-data-flow",
            "logic-error-recovery",
            "mobile-layout",
          ])
          .describe("Guidance topic"),
      }),
      execute: async ({ topic }) => {
        return { topic, guidance: docsByTopic[topic] };
      },
    }),
    validateGeneratedCode: tool({
      description: "Validate generated React Native code against runtime, syntax, and screen-funcion constraints.",
      inputSchema: z.object({
        code: z.string(),
        mode: z.enum(["final", "screen", "fragment"]).optional(),
        expectedName: z.string().optional(),
        dataModelNames: z.array(z.string()).optional(),
      }),
      execute: async ({ code, mode, expectedName, dataModelNames }) => {
        return validateCode(code, { mode, expectedName, dataModelNames });
      },
    }),
  };
}

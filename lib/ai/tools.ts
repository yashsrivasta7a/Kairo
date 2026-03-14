import { tool } from "ai";
import { z } from "zod";
import { validateCode } from "./validator";

const docsByTopic: Record<string, string> = {
  "react-native-list":
    "Use FlatList for dynamic lists. Keep keyExtractor stable. Avoid nested ScrollView + FlatList unless necessary.",
  "react-native-state":
    "Prefer local React.useState for screen-local interactions. Keep state shape minimal and serializable.",
  convex:
    "Use init({ buildId: buildDataId, schema }) once. Query at App root and pass data to screens. Use db.transact for writes.",
  styling:
    "Define StyleSheet.create before return. Reuse tokenized colors and spacing. Keep contrast and touch targets accessible.",
};

export function generationTools() {
  return {
    lookupDocs: tool({
      description: "Lookup implementation guidance for React Native, Convex runtime usage, and styling.",
      inputSchema: z.object({
        topic: z
          .enum(["react-native-list", "react-native-state", "convex", "styling"])
          .describe("Guidance topic"),
      }),
      execute: async ({ topic }) => {
        return { topic, guidance: docsByTopic[topic] };
      },
    }),
    validateGeneratedCode: tool({
      description: "Validate generated React Native code against runtime and syntax constraints.",
      inputSchema: z.object({ code: z.string() }),
      execute: async ({ code }) => {
        return validateCode(code);
      },
    }),
  };
}

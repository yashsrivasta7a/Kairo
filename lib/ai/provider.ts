import { createAzure } from "@ai-sdk/azure";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { LanguageModel } from "ai";

export type ModelProvider = "Azure" | "OpenAI" | "Anthropic" | "Google";

export type ProviderOverrides = {
  azureEndpoint?: string;
  azureApiKey?: string;
  azureDeploymentName?: string;
  openAiApiKey?: string;
  anthropicApiKey?: string;
  googleApiKey?: string;
};

export type ResolvedProvider = {
  provider: ModelProvider;
  modelId: string;
  model: LanguageModel;
  maxOutputTokens: number;
};

function has(value: string | undefined) {
  return Boolean(value && value.trim().length > 0);
}

export function resolveProvider(preferred?: ModelProvider, modelChoice?: string, overrides?: ProviderOverrides): ResolvedProvider {
  const azureEndpoint = overrides?.azureEndpoint || process.env.AZURE_OPENAI_ENDPOINT;
  const azureApiKey = overrides?.azureApiKey || process.env.AZURE_OPENAI_API_KEY;
  const azureDeployment = overrides?.azureDeploymentName || process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
  const openAiApiKey = overrides?.openAiApiKey || process.env.OPENAI_API_KEY;
  const anthropicApiKey = overrides?.anthropicApiKey || process.env.ANTHROPIC_API_KEY;
  const googleApiKey = overrides?.googleApiKey || process.env.GOOGLE_API_KEY;

  const azureEnabled = has(azureEndpoint) && has(azureApiKey) && has(azureDeployment);
  const openAiEnabled = has(openAiApiKey);
  const anthropicEnabled = has(anthropicApiKey);
  const googleEnabled = has(googleApiKey);

  const requested = preferred ?? (process.env.AI_MODEL_PROVIDER as ModelProvider | undefined) ?? "Azure";

  if (requested === "Azure" && azureEnabled) {
    const azure = createAzure({
      resourceName: azureEndpoint!.replace("https://", "").split(".")[0],
      apiKey: azureApiKey!,
    });
    const modelId = modelChoice || azureDeployment!;
    return {
      provider: "Azure",
      modelId,
      model: azure(modelId),
      maxOutputTokens: 24576,
    };
  }

  if (requested === "OpenAI" && openAiEnabled) {
    const openai = createOpenAI({ apiKey: openAiApiKey! });
    const modelId = modelChoice || process.env.OPENAI_MODEL || "gpt-4.1";
    return {
      provider: "OpenAI",
      modelId,
      model: openai(modelId),
      maxOutputTokens: 24576,
    };
  }

  if (requested === "Anthropic" && anthropicEnabled) {
    const anthropic = createAnthropic({ apiKey: anthropicApiKey! });
    const modelId = modelChoice || process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
    return {
      provider: "Anthropic",
      modelId,
      model: anthropic(modelId),
      maxOutputTokens: 24576,
    };
  }

  if (requested === "Google" && googleEnabled) {
    const google = createGoogleGenerativeAI({ apiKey: googleApiKey! });
    const modelId = modelChoice || process.env.GOOGLE_MODEL || "gemini-2.5-pro";
    return {
      provider: "Google",
      modelId,
      model: google(modelId),
      maxOutputTokens: 24576,
    };
  }

  if (azureEnabled) {
    return resolveProvider("Azure", modelChoice);
  }
  if (openAiEnabled) {
    return resolveProvider("OpenAI", modelChoice);
  }
  if (anthropicEnabled) {
    return resolveProvider("Anthropic", modelChoice);
  }
  if (googleEnabled) {
    return resolveProvider("Google", modelChoice);
  }

  throw new Error(
    "No model provider configured. Set Azure/OpenAI/Anthropic/Google API environment variables before generation."
  );
}

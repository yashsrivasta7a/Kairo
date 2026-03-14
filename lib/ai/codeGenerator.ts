import { stepCountIs, streamText, type LanguageModelUsage } from "ai";
import { getGluePrompt, getScreenPrompt, getSpecPrompt } from "../../utils/systemPromptV2";
import { compactUserPrompt } from "./contextManager";
import { resolveProvider, type ModelProvider, type ProviderOverrides } from "./provider";
import { buildStageSystemPrompt } from "./systemPrompts";
import { generationTools } from "./tools";
import { validateCode } from "./validator";

const MAX_FIX_ATTEMPTS = 3;

async function runStageGeneration({
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
  let finalUsage: LanguageModelUsage = {
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

type PipelineStatus = "generating" | "completed" | "failed";
type PipelineStage = "specs" | "screens" | "gluing" | "validation" | "completed" | "failed";

type PipelineHandlers = {
  onProgress?: (update: { status?: PipelineStatus; stage: PipelineStage; updatedAt: number }) => Promise<void>;
  onStageChunk?: (update: { stage: PipelineStage; output: string; updatedAt: number }) => Promise<void>;
  onUsage?: (update: {
    provider: string;
    model: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    updatedAt: number;
  }) => Promise<void>;
  onDebug?: (update: {
    stage: PipelineStage;
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

function toSafeUsage(usage: LanguageModelUsage) {
  return {
    promptTokens: usage.inputTokens ?? 0,
    completionTokens: usage.outputTokens ?? 0,
    totalTokens: usage.totalTokens ?? (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0),
  };
}

export async function runPipeline({
  prompt,
  modelProvider,
  modelChoice,
  providerOverrides,
  handlers,
}: {
  prompt: string;
  modelProvider?: ModelProvider;
  modelChoice?: string;
  providerOverrides?: ProviderOverrides;
  handlers?: PipelineHandlers;
}) {
  let currentStage = "init";
  let lastCode: string | undefined;
  let lastAttempt = 0;
  let activeProvider = "";
  let activeModel = "";
  const totalUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
  const compacted = compactUserPrompt(prompt);

  const collectUsage = async (
    stage: PipelineStage,
    usage: LanguageModelUsage,
    stagePrompt: string,
    responseText: string,
    provider: string,
    model: string
  ) => {
    const safe = toSafeUsage(usage);
    totalUsage.promptTokens += safe.promptTokens;
    totalUsage.completionTokens += safe.completionTokens;
    totalUsage.totalTokens += safe.totalTokens;
    activeProvider = provider;
    activeModel = model;

    await handlers?.onUsage?.({
      provider,
      model,
      ...totalUsage,
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
  };

  try {
    currentStage = "specs";
    await handlers?.onProgress?.({
      status: "generating",
      stage: "specs",
      updatedAt: Date.now(),
    });

    const specStagePrompt = getSpecPrompt();
    const { text: specText, usage: specUsage, provider: specProvider, model: specModel } = await runStageGeneration({
      stagePrompt: specStagePrompt,
      prompt: compacted.prompt,
      modelProvider,
      modelChoice,
      providerOverrides,
      onChunk: async (output) => {
        await handlers?.onStageChunk?.({ stage: "specs", output, updatedAt: Date.now() });
      },
    });
    await collectUsage("specs", specUsage, specStagePrompt, specText, specProvider, specModel);

    let spec;
    try {
      const cleaned = specText.replace(/```json|```/g, "").trim();
      spec = JSON.parse(cleaned);
    } catch {
      throw new Error(`Stage 1 failed: AI returned invalid JSON.\nRaw output: ${specText.slice(0, 200)}`);
    }

    if (!spec.screens || !spec.dataModels || !spec.initialScreen) {
      throw new Error(`Stage 1 failed: Spec is missing required fields. Got: ${JSON.stringify(spec)}`);
    }

    spec.screens = spec.screens.map((s: any) => ({
      ...s,
      name: s.name.replace(/\s+/g, "").replace(/[^a-zA-Z0-9]/g, ""),
    }));
    spec.initialScreen = spec.initialScreen.replace(/\s+/g, "").replace(/[^a-zA-Z0-9]/g, "");
    console.log("SPEC:", JSON.stringify(spec, null, 2));

    currentStage = "screens";
    await handlers?.onProgress?.({
      status: "generating",
      stage: "screens",
      updatedAt: Date.now(),
    });

    const screenCodes: string[] = [];
    for (const screen of spec.screens) {
      const stagePrompt = getScreenPrompt(spec, screen);
      const { text: screenCode, usage, provider, model } = await runStageGeneration({
        stagePrompt,
        prompt: `Write the ${screen.name} screen.`,
        modelProvider,
        modelChoice,
        providerOverrides,
        onChunk: async (output) => {
          await handlers?.onStageChunk?.({
            stage: "screens",
            output: `${screen.name}\n${output}`,
            updatedAt: Date.now(),
          });
        },
      });
      await collectUsage("screens", usage, stagePrompt, screenCode, provider, model);
      screenCodes.push(screenCode);
    }

    currentStage = "gluing";
    await handlers?.onProgress?.({
      status: "generating",
      stage: "gluing",
      updatedAt: Date.now(),
    });

    const gluePrompt = getGluePrompt(spec, screenCodes);
    const { text: rawFinalCode, usage: glueUsage, provider: glueProvider, model: glueModel } = await runStageGeneration({
      stagePrompt: gluePrompt,
      prompt: "Assemble the final app.",
      modelProvider,
      modelChoice,
      providerOverrides,
      onChunk: async (output) => {
        await handlers?.onStageChunk?.({ stage: "gluing", output, updatedAt: Date.now() });
      },
    });
    await collectUsage("gluing", glueUsage, gluePrompt, rawFinalCode, glueProvider, glueModel);

    currentStage = "validation";
    await handlers?.onProgress?.({
      status: "generating",
      stage: "validation",
      updatedAt: Date.now(),
    });

    const stripFences = (s: string) =>
      s
        .replace(/^```[\w]*\n?/m, "")
        .replace(/```\s*$/m, "")
        .trim();

    let codeToFix = stripFences(rawFinalCode);
    lastCode = codeToFix;
    const collectedErrors: string[] = [];

    for (let attempt = 1; attempt <= MAX_FIX_ATTEMPTS; attempt++) {
      lastAttempt = attempt;
      const validation = validateCode(codeToFix);

      if (validation.valid) {
        await handlers?.onComplete?.({
          code: codeToFix,
          status: "completed",
          stage: "completed",
          updatedAt: Date.now(),
        });
        return {
          code: codeToFix,
          usage: totalUsage,
          provider: activeProvider,
          model: activeModel,
        };
      }

      const errorMsg = validation.error!;
      collectedErrors.push(`Attempt ${attempt}/${MAX_FIX_ATTEMPTS}: ${errorMsg}`);

      if (attempt === MAX_FIX_ATTEMPTS) break;

      const isLastFixCall = attempt === MAX_FIX_ATTEMPTS - 1;
      const finalAttemptInstruction = isLastFixCall
        ? "\n\nThis is your final attempt.\nYou must simplify the code.\nRemove optional features.\nFavor correctness over completeness."
        : "";

      const fixStagePrompt =
        "You are a code fixer. Output ONLY the corrected JavaScript code. No markdown fences. No explanation.";
      const { text: fixedRaw, usage: fixUsage, provider: fixProvider, model: fixModel } = await runStageGeneration({
        stagePrompt: fixStagePrompt,
        prompt: `This React Native code has an error (attempt ${attempt}/${MAX_FIX_ATTEMPTS}):\n\nERROR: ${errorMsg}\n\nFix ONLY that error. Output the entire corrected file with NO markdown.${finalAttemptInstruction}\n\nCODE:\n${codeToFix}`,
        modelProvider,
        modelChoice,
        providerOverrides,
        onChunk: async (output) => {
          await handlers?.onStageChunk?.({ stage: "validation", output, updatedAt: Date.now() });
        },
      });
      await collectUsage("validation", fixUsage, fixStagePrompt, fixedRaw, fixProvider, fixModel);

      const fixedCode = stripFences(fixedRaw);
      codeToFix = fixedCode;
      lastCode = fixedCode;
    }

    throw new Error(`All ${MAX_FIX_ATTEMPTS} fix attempts failed:\n${collectedErrors.join("\n")}`);
  } catch (error: any) {
    console.error("Pipeline failed:", error);
    const serializedError = JSON.stringify({
      stage: currentStage,
      attempt: lastAttempt,
      message: error?.message ?? String(error),
      hint: lastCode?.slice(0, 300),
      provider: activeProvider || undefined,
      model: activeModel || undefined,
      usage: totalUsage,
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

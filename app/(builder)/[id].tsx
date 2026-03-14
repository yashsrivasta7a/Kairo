import { Ionicons } from "@expo/vector-icons";
import { useAction, useMutation, useQuery } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../convex/_generated/api";

import DropDown from "components/DropDown";
import UserProfile from "components/userProfile";

import BuildUi from "lib/buildUi";
import { useBuilds } from "lib/useBuilds";

export default function BuildScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const routeBuildId = Array.isArray(id) ? id[0] : id;
  const { builds, options } = useBuilds();
  const generateBuild = useAction(api.generation.generate);
  const loadBuildCode = useAction(api.buildFiles.getCodeForCurrentUser);
  const aiSettings = useQuery(api.aiSettings.getForCurrentUser);
  const saveAiSettings = useMutation(api.aiSettings.saveForCurrentUser);
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [modelProvider, setModelProvider] = useState<"Azure" | "OpenAI" | "Anthropic" | "Google">("Azure");
  const [modelChoice, setModelChoice] = useState("");
  const [lastPrompt, setLastPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showDebugTrace, setShowDebugTrace] = useState(false);
  const [showAiSettings, setShowAiSettings] = useState(false);
  const [codeCache, setCodeCache] = useState<Record<string, { code: string; revision: string }>>({});
  const [isCodeLoading, setIsCodeLoading] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [limitInput, setLimitInput] = useState("500000");
  const [azureEndpoint, setAzureEndpoint] = useState("");
  const [azureApiKey, setAzureApiKey] = useState("");
  const [azureDeploymentName, setAzureDeploymentName] = useState("");
  const [openAiApiKey, setOpenAiApiKey] = useState("");
  const [anthropicApiKey, setAnthropicApiKey] = useState("");
  const [googleApiKey, setGoogleApiKey] = useState("");
  const { colorScheme } = useColorScheme();
  const dk = colorScheme === "dark";

  const stageLabel: Record<string, string> = {
    specs: "🧠 Planning your app...",
    screens: "✏️ Writing screens...",
    gluing: "🔧 Putting it together...",
    validation: "🧪 Validating and fixing...",
    completed: "✅ Ready",
    failed: "❌ Failed",
  };

  useEffect(() => {
    if (!routeBuildId && options.length) {
      router.replace(`/(builder)/${options[0].value}`);
    }
  }, [routeBuildId, options, router]);

  useEffect(() => {
    if (!aiSettings) return;
    setModelProvider((aiSettings.preferredProvider as any) || "Azure");
    setLimitInput(String(aiSettings.monthlyTokenLimit ?? 500000));
  }, [aiSettings]);

  const currentBuild = builds.find((b: any) => b.id === routeBuildId);
  const currentCodeRevision = currentBuild?.storageId ?? (currentBuild?.hasCode ? "legacy" : null);
  const cachedCode = currentBuild ? codeCache[currentBuild.id] : undefined;
  const currentCode =
    cachedCode && currentCodeRevision && cachedCode.revision === currentCodeRevision ? cachedCode.code : "";

  useEffect(() => {
    let isCancelled = false;

    async function hydrateBuildCode() {
      if (!currentBuild?.id || !currentCodeRevision) {
        setIsCodeLoading(false);
        setCodeError(null);
        return;
      }

      if (cachedCode?.revision === currentCodeRevision) {
        setIsCodeLoading(false);
        setCodeError(null);
        return;
      }

      setIsCodeLoading(true);
      setCodeError(null);

      try {
        const result = await loadBuildCode({ buildId: currentBuild.id as never });
        if (isCancelled) {
          return;
        }

        setCodeCache((prev) => ({
          ...prev,
          [currentBuild.id]: {
            code: result?.code ?? "",
            revision: currentCodeRevision,
          },
        }));
      } catch (err) {
        if (isCancelled) {
          return;
        }

        console.error("Failed to load build code", err);
        setCodeError("Failed to load generated code.");
      } finally {
        if (!isCancelled) {
          setIsCodeLoading(false);
        }
      }
    }

    void hydrateBuildCode();

    return () => {
      isCancelled = true;
    };
  }, [cachedCode?.revision, currentBuild?.id, currentCodeRevision, loadBuildCode]);

  const handleGenerate = async () => {
    if (!prompt || !routeBuildId) return;
    setIsGenerating(true);
    setLastPrompt(prompt); // save before clearing so retry can reuse it

    try {
      await generateBuild({
        prompt,
        buildId: routeBuildId as never,
        modelProvider,
        modelChoice: modelChoice.trim() ? modelChoice.trim() : undefined,
      });
      setPrompt("");
    } catch (err) {
      console.error("Generation failed", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRetry = async () => {
    if (!lastPrompt || !routeBuildId) return;
    setIsGenerating(true);

    try {
      await generateBuild({
        prompt: lastPrompt,
        buildId: routeBuildId as never,
        modelProvider,
        modelChoice: modelChoice.trim() ? modelChoice.trim() : undefined,
      });
    } catch (err) {
      console.error("Retry failed", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveAiSettings = async () => {
    await saveAiSettings({
      preferredProvider: modelProvider,
      monthlyTokenLimit: Number.isFinite(Number(limitInput)) ? Math.max(0, Number(limitInput)) : 500000,
      apiKeys: {
        azureEndpoint: azureEndpoint.trim() || undefined,
        azureApiKey: azureApiKey.trim() || undefined,
        azureDeploymentName: azureDeploymentName.trim() || undefined,
        openAiApiKey: openAiApiKey.trim() || undefined,
        anthropicApiKey: anthropicApiKey.trim() || undefined,
        googleApiKey: googleApiKey.trim() || undefined,
      },
    } as any);
    setShowAiSettings(false);
  };

  return (
    <LinearGradient
      colors={dk ? ["#0d031f", "#000000", "#2b1157"] : ["#f5f3ff", "#ffffff", "#ede9fe"]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView className="flex-1 px-4">
        <View className="flex-row items-center justify-between">
          <View className="mr-3 flex-1">
            <Text
              style={{ color: dk ? "rgba(255,255,255,0.7)" : "#7c3aed" }}
              className="text-xs font-medium uppercase tracking-wider"
            >
              Builds
            </Text>
            <DropDown
              items={options}
              value={routeBuildId || options[0]?.value || ""}
              onValueChange={(val) => router.replace(`/(builder)/${val}`)}
            />
          </View>
          <View className="flex-row items-center gap-2">
            <TouchableOpacity onPress={() => setShowAiSettings(true)} className="rounded-md bg-indigo-600/70 px-2 py-1">
              <Text className="text-xs text-white">AI Settings</Text>
            </TouchableOpacity>
            <UserProfile />
          </View>
        </View>
        {!!aiSettings && (
          <View className="mt-2 rounded-md bg-slate-500/15 px-3 py-2">
            <Text style={{ color: dk ? "#cbd5e1" : "#334155" }} className="text-xs">
              Quota: {aiSettings.monthlyTokenUsed}/{aiSettings.monthlyTokenLimit} used, {aiSettings.remainingTokens} remaining
            </Text>
          </View>
        )}
        <KeyboardAvoidingView behavior="padding" className="flex-1 ">
          <View className="flex-1 gap-0">
            {currentBuild && (
              <View
                style={{
                  flex: 1,
                  marginTop: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: dk ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
                  backgroundColor: dk ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderBottomWidth: 1,
                    borderBottomColor: dk ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.07)",
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                  }}
                >
                  <Text
                    style={{ color: dk ? "rgba(255,255,255,0.6)" : "#7c3aed" }}
                    className="text-xs font-semibold uppercase tracking-wider"
                  >
                    Generated Code
                  </Text>
                  <View className="flex-row items-center gap-2">
                    {currentBuild.provider && (
                      <View className="rounded-full bg-slate-500/20 px-2 py-0.5">
                        <Text className="text-xs text-slate-300">{currentBuild.provider}</Text>
                      </View>
                    )}
                    {currentBuild.model && (
                      <View className="rounded-full bg-indigo-500/20 px-2 py-0.5">
                        <Text className="text-xs text-indigo-300">{currentBuild.model}</Text>
                      </View>
                    )}
                    {currentBuild.status === "failed" && (
                      <TouchableOpacity onPress={handleRetry} className="rounded-lg bg-red-900/50 px-2 py-1">
                        <Text className="text-xs text-red-400">↺ Retry</Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      onPress={() => setShowPreview(true)}
                      className="rounded-lg bg-[#fb9262ff] px-2 py-1"
                      activeOpacity={0.8}
                    >
                      <Text style={{ color: dk ? "white" : "#3b0764" }} className="text-xs">
                        Preview
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setShowDebugTrace(true)}
                      className="rounded-lg bg-cyan-700/70 px-2 py-1"
                      activeOpacity={0.8}
                    >
                      <Text style={{ color: "white" }} className="text-xs">
                        Debug Trace
                      </Text>
                    </TouchableOpacity>
                    <View
                      className={`rounded-full px-2 py-0.5 ${
                        currentBuild.status === "completed"
                          ? "bg-green-900/50"
                          : currentBuild.status === "failed"
                            ? "bg-red-900/50"
                            : currentBuild.status === "generating"
                              ? "bg-purple-900/50"
                              : "bg-gray-800"
                      }`}
                    >
                      <Text
                        className={`text-xs ${
                          currentBuild.status === "completed"
                            ? "text-green-400"
                            : currentBuild.status === "failed"
                              ? "text-red-400"
                              : currentBuild.status === "generating"
                                ? "text-purple-400"
                                : "text-gray-400"
                        }`}
                      >
                        {currentBuild.status || "idle"}
                      </Text>
                    </View>
                  </View>
                </View>
                <ScrollView className="flex-1 p-4">
                  {currentBuild.status === "generating" && Boolean(currentBuild.stageOutput) && (
                    <View className="mb-3 rounded-lg border border-purple-400/20 bg-purple-950/20 p-3">
                      <Text className="mb-1 text-xs font-semibold uppercase tracking-wide text-purple-300">
                        Live Stage Output
                      </Text>
                      <Text className="font-mono text-xs leading-5 text-purple-200">{currentBuild.stageOutput}</Text>
                    </View>
                  )}

                  {typeof currentBuild.usageTotalTokens === "number" && currentBuild.usageTotalTokens > 0 && (
                    <View className="mb-3 rounded-lg border border-slate-400/20 bg-slate-950/20 p-3">
                      <Text className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-300">
                        Token Usage
                      </Text>
                      <Text className="text-xs text-slate-200">
                        prompt {currentBuild.usagePromptTokens ?? 0} • completion {currentBuild.usageCompletionTokens ?? 0}
                        {" "}• total {currentBuild.usageTotalTokens}
                      </Text>
                    </View>
                  )}

                  {currentCode ? (
                    <Text style={{ color: dk ? "#86efac" : "#15803d" }} className="font-mono text-xs leading-5">
                      {currentCode}
                    </Text>
                  ) : isCodeLoading ? (
                    <View className="flex-row items-center gap-1">
                      <ActivityIndicator size="small" color="#8B5CF6" />
                      <Text className="text-xs text-purple-400">Loading generated code...</Text>
                    </View>
                  ) : currentBuild.status === "generating" ? (
                    <View className="flex-row items-center gap-1">
                      <ActivityIndicator size="small" color="#8B5CF6" />
                      <Text className="text-xs text-purple-400">
                        {stageLabel[currentBuild.stage ?? ""] || "Generating..."}
                      </Text>
                    </View>
                  ) : codeError ? (
                    <Text style={{ color: dk ? "#fca5a5" : "#b91c1c" }} className="text-sm">
                      {codeError}
                    </Text>
                  ) : (
                    <Text style={{ color: dk ? "#6b7280" : "#9ca3af" }} className="text-sm">
                      No code generated yet. Enter a prompt and hit generate.
                    </Text>
                  )}
                </ScrollView>
              </View>
            )}
            <View className="relative mt-2">
              <View className="mb-2 flex-row gap-2">
                <View className="flex-1">
                  <Text style={{ color: dk ? "#9ca3af" : "#6b7280" }} className="mb-1 text-xs">
                    Provider
                  </Text>
                  <DropDown
                    items={[
                      { label: "Azure", value: "Azure" },
                      { label: "OpenAI", value: "OpenAI" },
                      { label: "Anthropic", value: "Anthropic" },
                      { label: "Google", value: "Google" },
                    ]}
                    value={modelProvider}
                    onValueChange={(value) => setModelProvider(value as "Azure" | "OpenAI" | "Anthropic" | "Google")}
                  />
                </View>
                <View className="flex-1">
                  <Text style={{ color: dk ? "#9ca3af" : "#6b7280" }} className="mb-1 text-xs">
                    Model (optional)
                  </Text>
                  <TextInput
                    style={{
                      borderColor: dk ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                      backgroundColor: dk ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.03)",
                      color: dk ? "white" : "#1a1a2e",
                    }}
                    className="h-10 rounded-xl border px-3 text-xs"
                    placeholder="e.g. gpt-4.1"
                    placeholderTextColor={dk ? "#9ca3af" : "#9ca3af"}
                    value={modelChoice}
                    onChangeText={setModelChoice}
                  />
                </View>
              </View>

              <TextInput
                style={{
                  borderColor: dk ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                  backgroundColor: dk ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.04)",
                  color: dk ? "white" : "#1a1a2e",
                }}
                className="min-h-[80px] w-full rounded-xl border px-4 py-4 pr-16"
                placeholder="Describe your app..."
                placeholderTextColor={dk ? "#9ca3af" : "#9ca3af"}
                value={prompt}
                multiline
                onChangeText={setPrompt}
                textAlignVertical="top"
              />

              <TouchableOpacity
                className={`absolute bottom-4 right-4 rounded-full p-4 ${
                  isGenerating ? "bg-[#6D28D9]/60" : "bg-[#6D28D9]"
                }`}
                onPress={handleGenerate}
                disabled={isGenerating}
                activeOpacity={0.8}
              >
                <Ionicons name={isGenerating ? "hourglass-outline" : "rocket-outline"} size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <Modal
              key={showPreview ? "preview-open" : "preview-closed"}
              visible={showPreview}
              animationType="slide"
              onRequestClose={() => setShowPreview(false)}
            >
              <SafeAreaView style={{ flex: 1, backgroundColor: dk ? "#09090f" : "#f5f3ff" }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: dk ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)",
                  }}
                >
                  <Text style={{ color: dk ? "white" : "#1a1a2e" }} className="text-sm font-semibold">
                    Preview
                  </Text>
                  <Pressable onPress={() => setShowPreview(false)}>
                    <Text style={{ color: dk ? "#a78bfa" : "#7c3aed" }} className="text-sm">
                      Close
                    </Text>
                  </Pressable>
                </View>
                <View style={{ flex: 1 }}>
                  {currentBuild?.status === "completed" && currentCode ? (
                    <BuildUi code={currentCode} buildId={currentBuild.id} />
                  ) : currentBuild?.status === "completed" && isCodeLoading ? (
                    <View className="flex-1 items-center justify-center gap-3 px-4">
                      <ActivityIndicator size="large" color="#8B5CF6" />
                      <Text style={{ color: dk ? "#9ca3af" : "#6b7280" }} className="text-center text-sm">
                        Loading generated code...
                      </Text>
                    </View>
                  ) : currentBuild?.status === "completed" && codeError ? (
                    <View className="flex-1 items-center justify-center px-4">
                      <Ionicons name="alert-circle-outline" size={48} color={dk ? "#fca5a5" : "#dc2626"} />
                      <Text style={{ color: dk ? "#fca5a5" : "#b91c1c" }} className="mt-4 text-center text-base">
                        {codeError}
                      </Text>
                    </View>
                  ) : (
                    <View className="flex-1 items-center justify-center px-4">
                      <Ionicons name="code-slash-outline" size={48} color={dk ? "#9ca3af" : "#6b7280"} />
                      <Text style={{ color: dk ? "#6b7280" : "#4b5563" }} className="mt-4 text-center text-base">
                        {"Code isn't generated yet"}
                      </Text>
                      <Text style={{ color: dk ? "#9ca3af" : "#6b7280" }} className="mt-2 text-center text-sm">
                        Please wait for the generation to complete
                      </Text>
                    </View>
                  )}
                </View>
              </SafeAreaView>
            </Modal>

            <Modal visible={showDebugTrace} animationType="slide" onRequestClose={() => setShowDebugTrace(false)}>
              <SafeAreaView style={{ flex: 1, backgroundColor: dk ? "#09090f" : "#f5f3ff" }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: dk ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)",
                  }}
                >
                  <Text style={{ color: dk ? "white" : "#1a1a2e" }} className="text-sm font-semibold">
                    Debug Trace
                  </Text>
                  <Pressable onPress={() => setShowDebugTrace(false)}>
                    <Text style={{ color: dk ? "#a78bfa" : "#7c3aed" }} className="text-sm">
                      Close
                    </Text>
                  </Pressable>
                </View>
                <ScrollView className="flex-1 p-4">
                  {(currentBuild?.debugTrace || []).length === 0 ? (
                    <Text style={{ color: dk ? "#9ca3af" : "#6b7280" }} className="text-sm">
                      No debug trace yet.
                    </Text>
                  ) : (
                    (currentBuild?.debugTrace || []).map((entry: any, index: number) => (
                      <View key={`${entry.updatedAt}-${index}`} className="mb-3 rounded-lg border border-cyan-400/20 bg-cyan-950/15 p-3">
                        <Text className="text-xs font-semibold text-cyan-300">
                          {entry.stage} • {entry.provider} • {entry.model}
                        </Text>
                        <Text className="mt-1 text-xs text-slate-200">
                          prompt {entry.promptTokens} • completion {entry.completionTokens} • total {entry.totalTokens}
                        </Text>
                        <Text className="mt-2 text-[11px] text-slate-300">Prompt Preview</Text>
                        <Text className="font-mono text-[11px] leading-5 text-slate-200">{entry.promptPreview}</Text>
                        <Text className="mt-2 text-[11px] text-slate-300">Response Preview</Text>
                        <Text className="font-mono text-[11px] leading-5 text-slate-200">{entry.responsePreview}</Text>
                      </View>
                    ))
                  )}
                </ScrollView>
              </SafeAreaView>
            </Modal>

            <Modal visible={showAiSettings} animationType="slide" onRequestClose={() => setShowAiSettings(false)}>
              <SafeAreaView style={{ flex: 1, backgroundColor: dk ? "#09090f" : "#f5f3ff" }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: dk ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)",
                  }}
                >
                  <Text style={{ color: dk ? "white" : "#1a1a2e" }} className="text-sm font-semibold">
                    AI Settings
                  </Text>
                  <Pressable onPress={() => setShowAiSettings(false)}>
                    <Text style={{ color: dk ? "#a78bfa" : "#7c3aed" }} className="text-sm">
                      Close
                    </Text>
                  </Pressable>
                </View>
                <ScrollView className="flex-1 p-4">
                  <Text style={{ color: dk ? "#cbd5e1" : "#334155" }} className="mb-1 text-xs">
                    Monthly token limit
                  </Text>
                  <TextInput
                    value={limitInput}
                    onChangeText={setLimitInput}
                    keyboardType="numeric"
                    className="mb-3 rounded-md border border-slate-400/20 px-3 py-2 text-sm"
                    style={{ color: dk ? "white" : "#111827" }}
                  />

                  {[
                    ["Azure Endpoint", azureEndpoint, setAzureEndpoint, false],
                    ["Azure API Key", azureApiKey, setAzureApiKey, true],
                    ["Azure Deployment", azureDeploymentName, setAzureDeploymentName, false],
                    ["OpenAI API Key", openAiApiKey, setOpenAiApiKey, true],
                    ["Anthropic API Key", anthropicApiKey, setAnthropicApiKey, true],
                    ["Google API Key", googleApiKey, setGoogleApiKey, true],
                  ].map(([label, value, setter, secure]) => (
                    <View key={String(label)} className="mb-3">
                      <Text style={{ color: dk ? "#cbd5e1" : "#334155" }} className="mb-1 text-xs">
                        {label}
                      </Text>
                      <TextInput
                        value={String(value)}
                        onChangeText={setter as any}
                        secureTextEntry={Boolean(secure)}
                        className="rounded-md border border-slate-400/20 px-3 py-2 text-sm"
                        style={{ color: dk ? "white" : "#111827" }}
                      />
                    </View>
                  ))}

                  <TouchableOpacity onPress={handleSaveAiSettings} className="rounded-lg bg-indigo-600 px-4 py-3">
                    <Text className="text-center text-sm font-semibold text-white">Save AI Settings</Text>
                  </TouchableOpacity>
                </ScrollView>
              </SafeAreaView>
            </Modal>
          </View>
          <Text
            numberOfLines={3}
            style={{ color: dk ? "#9ca3af" : "#9ca3af" }}
            className="align-center text- mt-2 text-center text-xs"
          >
            Kairo works best with short, focused prompts.{" "}
          </Text>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

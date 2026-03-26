import { Ionicons } from "@expo/vector-icons";
import { useAction, useMutation } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  Switch,
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

const IDEAS = [
  {
    title: "Habit Tracker",
    subtitle: "Daily routines with streaks and reminders",
    prompt: "Build a habit tracker app that helps users create habits, mark them complete, and stay motivated with progress feedback.",
    appType: "Tracker",
    primaryGoal: "Track progress",
  },
  {
    title: "Food Ordering",
    subtitle: "Browse menus and place orders quickly",
    prompt: "Build a food ordering app where users can browse dishes, add items to cart, and place an order with a clean mobile flow.",
    appType: "Marketplace",
    primaryGoal: "Sell or book",
  },
  {
    title: "Study Planner",
    subtitle: "Plan sessions and manage tasks",
    prompt: "Build a study planner app that helps students organize sessions, tasks, and upcoming deadlines in a calm, motivating interface.",
    appType: "Productivity",
    primaryGoal: "Organize work",
  },
  {
    title: "Salon Booking",
    subtitle: "Services, slots, and appointments",
    prompt: "Build a salon booking app that lets users browse services, choose a time slot, and confirm an appointment with a smooth booking flow.",
    appType: "Booking",
    primaryGoal: "Sell or book",
  },
];

const APP_TYPES = ["Utility", "Dashboard", "Tracker", "Marketplace", "Booking", "Productivity"];
const USERS = ["Personal users", "Customers", "Small teams", "Students", "Business owners"];
const GOALS = ["Organize work", "Track progress", "Sell or book", "Learn faster", "Manage records"];
const STYLES = ["Clean", "Playful", "Premium", "Bold", "Minimal"];
const BUILD_MODES = [
  {
    id: "fast",
    label: "Fast",
    description: "Skip extra planning passes and build much quicker.",
  },
  {
    id: "balanced",
    label: "Balanced",
    description: "Use the full quality pipeline for stronger UX and logic.",
  },
] as const;

export default function BuildScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const routeBuildId = Array.isArray(id) ? id[0] : id;
  const { builds, options } = useBuilds();
  const generateBuild = useMutation(api.generation.generate);
  const loadBuildCode = useAction(api.buildFiles.getCodeForCurrentUser);
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [lastPrompt, setLastPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showStreamingOutput, setShowStreamingOutput] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<string>("");
  const [appType, setAppType] = useState<string>("");
  const [targetUser, setTargetUser] = useState<string>("");
  const [primaryGoal, setPrimaryGoal] = useState<string>("");
  const [visualStyle, setVisualStyle] = useState<string>("");
  const [buildMode, setBuildMode] = useState<"fast" | "balanced">("fast");
  const [codeCache, setCodeCache] = useState<Record<string, { code: string; revision: string }>>({});
  const [isCodeLoading, setIsCodeLoading] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const { colorScheme } = useColorScheme();
  const dk = colorScheme === "dark";

  const stageLabel: Record<string, string> = {
    planning: "Briefing your app...",
    design: "Designing UX and flows...",
    logic: "Planning state and behaviors...",
    specs: "Planning your app...",
    screens: "Writing screens...",
    gluing: "Putting it together...",
    assembly: "Merging design and logic...",
    validation: "Validating and fixing...",
    completed: "Ready",
    failed: "Failed",
  };

  const stageSummary: Record<string, string> = {
    planning: "Understanding your idea and shaping it into a focused app concept.",
    design: "Refining the screen structure, UX flow, and overall feel of the product.",
    logic: "Planning state, interactions, and the behavior that makes the app feel reliable.",
    specs: "Defining the core build requirements for the generated app.",
    screens: "Generating the React Native screens and interactions for your app.",
    gluing: "Connecting the generated pieces into one complete experience.",
    assembly: "Bringing design and logic together into a polished app shell.",
    validation: "Checking the generated app and repairing issues before preview.",
    completed: "Your app is ready to preview and inspect.",
    failed: "The app builder hit an issue and needs another attempt.",
  };

  useEffect(() => {
    if (!routeBuildId && options.length) {
      router.replace(`/(builder)/${options[0].value}`);
    }
  }, [routeBuildId, options, router]);

  const currentBuild = builds.find((b: any) => b.id === routeBuildId);
  const currentCodeRevision = currentBuild?.storageId ?? (currentBuild?.hasCode ? "legacy" : null);
  const cachedCode = currentBuild ? codeCache[currentBuild.id] : undefined;
  const currentCode =
    cachedCode && currentCodeRevision && cachedCode.revision === currentCodeRevision ? cachedCode.code : "";
  const hasStartedGeneration = Boolean(
    currentBuild &&
      (currentBuild.status === "generating" ||
        currentBuild.status === "completed" ||
        currentBuild.status === "failed" ||
        currentBuild.storageId ||
        (typeof currentBuild.usageTotalTokens === "number" && currentBuild.usageTotalTokens > 0))
  );

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

  const handleIdeaPick = (title: string) => {
    const idea = IDEAS.find((item) => item.title === title);
    setSelectedIdea(title);
    if (!idea) {
      return;
    }

    setPrompt((current) => (current.trim() ? current : idea.prompt));
    setAppType((current) => current || idea.appType);
    setPrimaryGoal((current) => current || idea.primaryGoal);
  };

  const buildPromptFromPlanner = () => {
    const parts: string[] = [];
    const basePrompt = prompt.trim();
    const idea = IDEAS.find((item) => item.title === selectedIdea);

    if (basePrompt) {
      parts.push(basePrompt);
    } else if (idea) {
      parts.push(idea.prompt);
    }

    const plannerLines = [
      appType ? `App type: ${appType}` : "",
      targetUser ? `Target users: ${targetUser}` : "",
      primaryGoal ? `Primary goal: ${primaryGoal}` : "",
      visualStyle ? `Visual style: ${visualStyle}` : "",
    ].filter(Boolean);

    if (plannerLines.length > 0) {
      parts.push("Planning preferences:");
      parts.push(...plannerLines);
    }

    return parts.join("\n");
  };

  const handleGenerate = async () => {
    if (!routeBuildId) return;

    const promptToSend = buildPromptFromPlanner().trim();
    if (!promptToSend) return;

    setIsGenerating(true);
    setLastPrompt(promptToSend);
    setPrompt("");

    try {
      await generateBuild({
        prompt: promptToSend,
        buildId: routeBuildId as never,
        buildMode,
      });
    } catch (err) {
      console.error("Generation failed", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRetry = async () => {
    if (!routeBuildId) return;
    const retryPrompt = currentBuild?.sourcePrompt || lastPrompt;
    const retryMode = currentBuild?.buildMode || buildMode;
    if (!retryPrompt) return;

    setIsGenerating(true);

    try {
      await generateBuild({
        prompt: retryPrompt,
        buildId: routeBuildId as never,
        buildMode: retryMode,
      });
    } catch (err) {
      console.error("Retry failed", err);
    } finally {
      setIsGenerating(false);
    }
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
          <UserProfile />
        </View>

        <KeyboardAvoidingView behavior="padding" className="flex-1">
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
                    {currentBuild.status === "failed" && (
                      <TouchableOpacity onPress={handleRetry} className="rounded-lg bg-red-900/50 px-2 py-1">
                        <Text className="text-xs text-red-400">Retry</Text>
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
                  {currentBuild.status === "generating" && (
                    <View className="mb-3 rounded-2xl border border-purple-400/20 bg-purple-950/20 p-4">
                      <View className="flex-row items-start justify-between gap-3">
                        <View className="flex-1">
                          <Text className="text-sm font-semibold text-purple-200">
                            {stageLabel[currentBuild.stage ?? ""] || "Generating your app..."}
                          </Text>
                          <Text className="mt-1 text-xs leading-5 text-purple-100/80">
                            {stageSummary[currentBuild.stage ?? ""] ||
                              "The app builder is working through your request."}
                          </Text>
                        </View>
                        <ActivityIndicator size="small" color="#A78BFA" />
                      </View>

                      <View className="mt-4 flex-row items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                        <View className="flex-1 pr-3">
                          <Text className="text-xs font-semibold uppercase tracking-wide text-slate-200">
                            Show Live Stream
                          </Text>
                          <Text className="mt-1 text-[11px] leading-4 text-slate-300">
                            Turn this on only if you want to inspect the raw generation output.
                          </Text>
                        </View>
                        <Switch
                          value={showStreamingOutput}
                          onValueChange={setShowStreamingOutput}
                          trackColor={{ false: "rgba(148,163,184,0.35)", true: "rgba(124,58,237,0.7)" }}
                          thumbColor={showStreamingOutput ? "#ffffff" : "#e2e8f0"}
                        />
                      </View>

                      {showStreamingOutput && Boolean(currentBuild.stageOutput) && (
                        <View className="mt-3 rounded-xl border border-purple-400/20 bg-[#12061f] p-3">
                          <Text className="mb-1 text-xs font-semibold uppercase tracking-wide text-purple-300">
                            Live Stage Output
                          </Text>
                          <Text className="font-mono text-xs leading-5 text-purple-200">{currentBuild.stageOutput}</Text>
                        </View>
                      )}
                    </View>
                  )}

                  {typeof currentBuild.usageTotalTokens === "number" && currentBuild.usageTotalTokens > 0 && (
                    <View className="mb-3 rounded-lg border border-slate-400/20 bg-slate-950/20 p-3">
                      <Text className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-300">
                        Token Usage
                      </Text>
                      <Text className="text-xs text-slate-200">
                        prompt {currentBuild.usagePromptTokens ?? 0} • completion{" "}
                        {currentBuild.usageCompletionTokens ?? 0} • total {currentBuild.usageTotalTokens}
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
                    <View className="rounded-xl border border-slate-400/15 bg-slate-950/20 p-4">
                      <Text style={{ color: dk ? "#e9d5ff" : "#6b21a8" }} className="text-sm font-semibold">
                        Building your app
                      </Text>
                      <Text style={{ color: dk ? "#cbd5e1" : "#475569" }} className="mt-2 text-xs leading-5">
                        {stageSummary[currentBuild.stage ?? ""] ||
                          "The builder is generating screens, structure, and interactions for your app."}
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
              {!hasStartedGeneration && (
                <>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="mb-3"
                    contentContainerStyle={{ gap: 10, paddingRight: 4 }}
                  >
                    {IDEAS.map((idea) => {
                      const isSelected = selectedIdea === idea.title;
                      return (
                        <TouchableOpacity
                          key={idea.title}
                          onPress={() => handleIdeaPick(idea.title)}
                          activeOpacity={0.85}
                          style={{
                            width: 180,
                            borderRadius: 18,
                            padding: 14,
                            borderWidth: 1,
                            borderColor: isSelected
                              ? dk
                                ? "rgba(167,139,250,0.7)"
                                : "rgba(124,58,237,0.5)"
                              : dk
                                ? "rgba(255,255,255,0.08)"
                                : "rgba(0,0,0,0.08)",
                            backgroundColor: isSelected
                              ? dk
                                ? "rgba(124,58,237,0.16)"
                                : "rgba(124,58,237,0.08)"
                              : dk
                                ? "rgba(255,255,255,0.04)"
                                : "rgba(255,255,255,0.75)",
                          }}
                        >
                          <Text style={{ color: dk ? "#f5e9ff" : "#3b0764" }} className="text-sm font-semibold">
                            {idea.title}
                          </Text>
                          <Text
                            style={{ color: dk ? "#cbd5e1" : "#64748b" }}
                            className="mt-1 text-xs leading-5"
                            numberOfLines={2}
                          >
                            {idea.subtitle}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  <View
                    style={{
                      marginBottom: 12,
                      borderRadius: 18,
                      borderWidth: 1,
                      borderColor: dk ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
                      backgroundColor: dk ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.72)",
                      padding: 14,
                    }}
                  >
                    <Text style={{ color: dk ? "#f5e9ff" : "#3b0764" }} className="text-sm font-semibold">
                      Guided planner
                    </Text>
                    <Text style={{ color: dk ? "#cbd5e1" : "#64748b" }} className="mt-1 text-xs leading-5">
                      Pick a few options if you want the app builder to shape the idea with you before generating.
                    </Text>

                    <View style={{ marginTop: 12 }}>
                      <Text style={{ color: dk ? "#e2e8f0" : "#475569" }} className="mb-2 text-xs font-semibold">
                        Build speed
                      </Text>
                      <View style={{ gap: 8 }}>
                        {BUILD_MODES.map((mode) => {
                          const selected = buildMode === mode.id;
                          return (
                            <TouchableOpacity
                              key={mode.id}
                              onPress={() => setBuildMode(mode.id)}
                              style={{
                                borderRadius: 14,
                                borderWidth: 1,
                                borderColor: selected
                                  ? dk
                                    ? "rgba(167,139,250,0.7)"
                                    : "rgba(124,58,237,0.45)"
                                  : dk
                                    ? "rgba(255,255,255,0.1)"
                                    : "rgba(0,0,0,0.08)",
                                backgroundColor: selected
                                  ? dk
                                    ? "rgba(124,58,237,0.18)"
                                    : "rgba(124,58,237,0.1)"
                                  : dk
                                    ? "rgba(255,255,255,0.03)"
                                    : "rgba(255,255,255,0.8)",
                                paddingHorizontal: 12,
                                paddingVertical: 10,
                              }}
                            >
                              <Text
                                style={{ color: selected ? (dk ? "#e9d5ff" : "#6d28d9") : dk ? "#e2e8f0" : "#334155" }}
                                className="text-sm font-semibold"
                              >
                                {mode.label}
                              </Text>
                              <Text
                                style={{ color: dk ? "#cbd5e1" : "#64748b" }}
                                className="mt-1 text-xs leading-5"
                              >
                                {mode.description}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>

                    {[
                      { label: "App type", value: appType, setValue: setAppType, options: APP_TYPES },
                      { label: "For who", value: targetUser, setValue: setTargetUser, options: USERS },
                      { label: "Main goal", value: primaryGoal, setValue: setPrimaryGoal, options: GOALS },
                      { label: "Visual style", value: visualStyle, setValue: setVisualStyle, options: STYLES },
                    ].map((group) => (
                      <View key={group.label} style={{ marginTop: 12 }}>
                        <Text style={{ color: dk ? "#e2e8f0" : "#475569" }} className="mb-2 text-xs font-semibold">
                          {group.label}
                        </Text>
                        <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                          {group.options.map((option) => {
                            const selected = group.value === option;
                            return (
                              <TouchableOpacity
                                key={option}
                                onPress={() => group.setValue(selected ? "" : option)}
                                style={{
                                  borderRadius: 999,
                                  borderWidth: 1,
                                  borderColor: selected
                                    ? dk
                                      ? "rgba(167,139,250,0.7)"
                                      : "rgba(124,58,237,0.45)"
                                    : dk
                                      ? "rgba(255,255,255,0.1)"
                                      : "rgba(0,0,0,0.08)",
                                  backgroundColor: selected
                                    ? dk
                                      ? "rgba(124,58,237,0.18)"
                                      : "rgba(124,58,237,0.1)"
                                    : dk
                                      ? "rgba(255,255,255,0.03)"
                                      : "rgba(255,255,255,0.8)",
                                  paddingHorizontal: 10,
                                  paddingVertical: 7,
                                }}
                              >
                                <Text
                                  style={{ color: selected ? (dk ? "#e9d5ff" : "#6d28d9") : dk ? "#cbd5e1" : "#475569" }}
                                  className="text-xs"
                                >
                                  {option}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>
                    ))}
                  </View>
                </>
              )}

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
                editable={!isGenerating}
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
          </View>

          <Text
            numberOfLines={3}
            style={{ color: dk ? "#9ca3af" : "#9ca3af" }}
            className="align-center text- mt-2 text-center text-xs"
          >
            Start with a rough idea, or use the guided planner above if you want help shaping the app.
          </Text>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

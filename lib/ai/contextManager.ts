export type CompactPromptResult = {
  prompt: string;
  originalChars: number;
  compactedChars: number;
  wasCompacted: boolean;
};

const MAX_PROMPT_CHARS = 6000;

function dedupeConsecutiveLines(text: string) {
  const lines = text.split(/\r?\n/);
  const out: string[] = [];
  let prev = "";
  let run = 0;

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (line === prev) {
      run += 1;
      if (run > 2) {
        continue;
      }
    } else {
      prev = line;
      run = 1;
    }
    out.push(line);
  }

  return out.join("\n");
}

function hardCap(text: string, maxChars: number) {
  if (text.length <= maxChars) {
    return text;
  }

  const head = text.slice(0, Math.floor(maxChars * 0.75));
  const tail = text.slice(-Math.floor(maxChars * 0.2));
  return `${head}\n\n[...context compacted...]\n\n${tail}`;
}

export function compactUserPrompt(prompt: string): CompactPromptResult {
  const original = prompt || "";
  const normalized = original
    .replace(/\t/g, "  ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  const deduped = dedupeConsecutiveLines(normalized);
  const capped = hardCap(deduped, MAX_PROMPT_CHARS);

  return {
    prompt: capped,
    originalChars: original.length,
    compactedChars: capped.length,
    wasCompacted: original.length !== capped.length || original !== normalized,
  };
}

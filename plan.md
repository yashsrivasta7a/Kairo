# Kairo AI Pipeline

## Overview

The generation flow is now fully coordinated through Convex. A build record is created in Convex, a Convex action runs the AI pipeline, and status updates are written back to Convex so the UI can react in real time.

## Pipeline Stages

1. Spec generation
   The prompt is converted into a strict JSON app spec.
2. Screen generation
   Each screen is generated individually from the spec.
3. Glue generation
   The final app file is assembled from the spec and generated screens.
4. Validation
   The generated code is parsed and checked before being saved.

## Runtime Contract

Generated apps target the Kairo runtime contract rather than talking directly to backend services. The generated code imports `@kairo/runtime` and uses `buildDataId` for its data scope.

The runtime adapter is implemented in `lib/generatedAppAdapter.ts` and maps that contract onto Convex-backed reads and writes.

## Status Flow

Build state is persisted on the Convex `builds` table. The UI reads those records through Convex queries and renders generation progress from the persisted `status`, `stage`, and `error` fields.

Expected stage values:

- `specs`
- `screens`
- `gluing`
- `completed`
- `failed`

## Main Files

- `convex/generation.ts`: entry point for generation.
- `convex/generationState.ts`: internal build state updates.
- `convex/builds.ts`: build creation and retrieval.
- `convex/generatedApps.ts`: generated-app data persistence.
- `lib/ai/codeGenerator.ts`: orchestrates the generation pipeline.
- `lib/ai/validator.ts`: validates generated output.
- `utils/systemPromptV2.ts`: defines the generation prompts.
- `app/(builder)/[id].tsx`: triggers generation and renders progress.

## Guardrails

The validator and prompts still enforce a restricted runtime surface for generated apps. Generated output must remain compatible with the preview sandbox and the Kairo runtime adapter.

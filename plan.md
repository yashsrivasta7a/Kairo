# Kairo AI Pipeline — How It Works

## The Core Problem (Why Not One AI Call?)

LLMs are bad at generating large, structured outputs in one shot. When you ask an AI to "generate a full app," it:

- Hallucinates structure (invents APIs that don't exist)
- Produces inconsistent output (sometimes good, sometimes broken)
- Has no way to self-correct

**The fix:** Break the task into 3 small, focused AI calls — each with a strict output contract. Smaller scope = much higher quality.

---

## The Pipeline (3 Stages)

```
User Prompt
    │
    ▼
┌─────────────────────────────────────────────┐
│ STAGE 1 — Spec Generator                   │
│ File: utils/systemPromptV2.ts → getSpecPrompt() │
│                                             │
│ Input:  user's raw text prompt              │
│ Output: strict JSON (AppSpec)               │
│ Model:  Azure GPT                           │
│                                             │
│ The AI acts as a "JSON-only API."           │
│ It produces a plan — no code yet.           │
└─────────────────────────────────────────────┘
    │
    ▼  (spec saved in memory, never stored)
┌─────────────────────────────────────────────┐
│ STAGE 2 — Screen Code Generator             │
│ File: utils/systemPromptV2.ts → getScreenPrompt() │
│                                             │
│ Input:  spec + one screen definition        │
│ Output: ONE JavaScript function for that screen │
│ Runs:   once per screen (sequential loop)   │
│                                             │
│ Each screen function receives:              │
│   { db, id, data, isLoading } as props      │
│ No imports. No schema. No db.useQuery().    │
└─────────────────────────────────────────────┘
    │
    ▼  (all screen code collected in screenCodes[])
┌─────────────────────────────────────────────┐
│ STAGE 3 — Glue Generator                   │
│ File: utils/systemPromptV2.ts → getGluePrompt() │
│                                             │
│ Input:  spec + all screenCodes[]            │
│ Output: final complete app (single JS file) │
│                                             │
│ Assembles in order:                         │
│   1. imports                                │
│   2. InstantDB schema (from spec.dataModels)│
│   3. db = init({ appId: instantAppId, schema }) │
│   4. all screen functions (copy-pasted in)  │
│   5. App() with useQuery + tab navigation   │
│   6. export default App                     │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│ VALIDATOR (non-AI)                          │
│ File: lib/ai/validator.ts                   │
│                                             │
│ Checks BEFORE saving:                       │
│   ✓ Has export default                      │
│   ✓ No forbidden imports (expo-*, etc.)     │
│   ✓ Babel parse succeeds (no syntax errors) │
│                                             │
│ If invalid → throws → status = 'failed'     │
└─────────────────────────────────────────────┘
    │
    ▼
  Saved to InstantDB → UI updates live
```

---

## The AppSpec (Stage 1 Output)

This is the JSON structure that Stage 1 produces. It is the "blueprint" for the entire app:

```json
{
  "appName": "Todo App",
  "initialScreen": "HomeScreen",
  "screens": [
    {
      "name": "HomeScreen",
      "purpose": "Show and manage all todos",
      "actions": ["create", "delete", "toggle complete"]
    }
  ],
  "dataModels": [
    {
      "name": "meta",
      "fields": [
        { "name": "key", "type": "string", "indexed": true }
      ]
    },
    {
      "name": "todos",
      "fields": [
        { "name": "text", "type": "string", "indexed": false },
        { "name": "done", "type": "boolean", "indexed": false },
        { "name": "createdAt", "type": "number", "indexed": true }
      ]
    }
  ]
}
```

**Key rules enforced by the spec prompt:**
- Max 3 screens, max 3 data models (keeps generation scope small)
- `meta` entity always included (for seeding data exactly once)
- Every model always has `createdAt: number, indexed: true`
- `initialScreen` must exactly match a screen name

---

## Why Screens Receive Props (Not Own Queries)

The naive approach: each screen calls `db.useQuery()` itself. Problem: multiple components calling `useQuery` → messy, duplicated queries, hook ordering issues.

**Our approach:** Stage 3 does ONE `db.useQuery` in the root `App()` component querying all entities at once, then passes `{ db, id, data, isLoading }` down to whichever screen is active.

```js
// App() in the final assembled code — Stage 3 generates this
const { data, isLoading } = db.useQuery({
  todos: {},
  meta: {},
});

// Passes everything to the active screen
{activeTab === 'HomeScreen' && (
  <HomeScreen db={db} id={id} data={data} isLoading={isLoading} />
)}
```

This means screens are pure functions — they just read from `data` and call `db.transact()` to write.

---

## Error Handling & Retry

Every stage is wrapped in a single try/catch:

```
Stage 1 fails (bad JSON) → throw → status: 'failed'
Stage 2 fails (AI error) → throw → status: 'failed'
Stage 3 fails (bad code) → throw → status: 'failed'
Validator fails          → throw → status: 'failed'
```

The UI shows a **↺ Retry** button when `status === 'failed'`. It reuses `lastPrompt` (saved before the original prompt was cleared from the input field).

---

## Live Status Updates (Stage Field)

InstantDB is used as a real-time message bus between the server and the UI. As each stage starts, the server writes the current `stage` to the build record. The UI subscribes via `useBuilds()` (a `db.useQuery` hook) and instantly reflects the change:

| `stage` value | UI label |
|---|---|
| `specs` | 🧠 Planning your app... |
| `screens` | ✏️ Writing screens... |
| `gluing` | 🔧 Putting it together... |
| `completed` | ✅ Ready |
| `failed` | ❌ Failed (+ Retry button) |

---

## File Map

| File | Role |
|---|---|
| `app/api/generate+api.ts` | HTTP entry point — receives prompt, fires `runPipeline()` in background |
| `lib/ai/codeGenerator.ts` | Orchestrates all 3 stages + error handling |
| `utils/systemPromptV2.ts` | Contains `getSpecPrompt`, `getScreenPrompt`, `getGluePrompt` |
| `lib/ai/validator.ts` | Non-AI check: syntax, forbidden imports, export default |
| `lib/instant/schema.ts` | Defines the `builds` entity (incl. `stage` field) |
| `app/(builder)/[id].tsx` | Builder UI — shows live stage, code output, preview, retry button |
| `lib/buildUi.tsx` | Renders generated code using Babel transpilation in-preview |
| `lib/codeToEl.tsx` | Babel transform + module resolver for the preview sandbox |

---

## What the AI Is NOT Allowed to Do

Enforced by `validator.ts` and the prompts:

- ❌ Import `expo-*` packages
- ❌ Import `react-navigation`
- ❌ Import `lodash`, `moment`, `axios`, `uuid`
- ❌ Use `db.useQuery()` inside screen functions
- ❌ Use `i.array()`, `i.json()`, `i.object()` (don't exist in InstantDB)
- ❌ Use `$: { order: {} }` in queries (crashes InstantDB)
- ❌ Hardcode the InstantDB `appId` (must use `instantAppId` variable)
- ❌ Output markdown or explanation — code only

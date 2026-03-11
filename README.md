# Kairo

Build and preview small apps inside the app itself.

Kairo is an Expo Router app that uses Convex for backend state, function execution, and generated-app persistence, and Better Auth for authentication. Users can sign in, create builds, run the AI generation pipeline, and preview generated apps backed by Convex data.

## Stack

| Layer      | Technology                 |
| ---------- | -------------------------- |
| App        | Expo SDK 54 + React Native |
| Routing    | Expo Router                |
| Backend    | Convex                     |
| Auth       | Better Auth                |
| Styling    | NativeWind                 |
| Animations | Reanimated                 |
| Language   | TypeScript                 |

## Current Architecture

- Auth is handled through Better Auth, with the Convex integration providing session-aware server access.
- Application data, build records, generation orchestration, and generated-app persistence all live in Convex.
- Generated previews run against the local Kairo runtime adapter, which maps the generated app contract onto Convex queries and mutations.

## Important Paths

- `app/`: Expo Router screens and layouts.
- `convex/`: Convex schema, queries, mutations, and actions.
- `lib/auth.ts`: Better Auth client helpers used by the app.
- `lib/useBuilds.ts`: Client hook for the current user's builds.
- `lib/generatedAppAdapter.ts`: Convex-backed runtime for generated apps.
- `lib/ai/codeGenerator.ts`: AI generation pipeline.
- `utils/systemPromptV2.ts`: Prompt contracts used for generation.

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- A Convex deployment
- Better Auth provider credentials for any enabled social providers

### Install

```bash
npm install
```

### Environment

Set the environment variables required by Convex, Better Auth, and the AI pipeline before starting the app. The exact values depend on your deployment and provider setup.

### Run

```bash
npx convex dev
```

In a second terminal:

```bash
npx expo start
```

## Backend Notes

- Convex schema lives in `convex/schema.ts`.
- Build CRUD is implemented in `convex/builds.ts`.
- AI generation is triggered through `convex/generation.ts`.
- Generated-app persistence is implemented in `convex/generatedApps.ts`.

## Auth Notes

- Client auth utilities live in `lib/auth-client.ts` and `lib/auth.ts`.
- The app shell in `app/_layout.tsx` uses Better Auth session state for route gating.
- Sign-in and sign-up flows currently support Google and GitHub.

## Validation

Useful local checks:

```bash
npx convex dev --once
npx tsc --noEmit
```

---

## 🙏 Acknowledgements

- [Expo](https://expo.dev/)
- [Convex](https://www.convex.dev/)
- [Better Auth](https://www.better-auth.com/)
- [NativeWind](https://www.nativewind.dev/)
- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)

---

<p align="center">
  Built with ❤️ by the Kairo team
</p>

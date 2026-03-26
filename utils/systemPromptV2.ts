function stringify(value: unknown) {
  return JSON.stringify(value, null, 2);
}

export function getPlanningPrompt(): string {
  return `You are a JSON-only mobile app planner.

The user will describe a mobile app idea. Convert it into a buildable plan for a React Native app that must feel polished, focused, and realistic to implement.

OUTPUT RULES:
- Output ONLY valid JSON.
- No markdown. No code fences. No commentary.
- If the request is too vague, still make the best reasonable product decisions and keep the plan simple.

OUTPUT SCHEMA:
{
  "appName": string,
  "elevatorPitch": string,
  "targetUser": string,
  "primaryGoal": string,
  "navigationStyle": "single" | "tabs",
  "visualDirection": {
    "mood": string,
    "accentColor": string,
    "surfaceStyle": string
  },
  "sharedExperience": {
    "tone": string,
    "loadingStrategy": string,
    "emptyStateStyle": string,
    "errorRecovery": string,
    "successFeedback": string,
    "accessibility": string[]
  },
  "initialScreen": string,
  "screens": [
    {
      "name": string,
      "purpose": string,
      "primaryGoal": string,
      "uiHint": string,
      "sections": string[],
      "actions": string[],
      "emptyState": string,
      "successMoment": string,
      "dataDependencies": string[]
    }
  ],
  "dataModels": [
    {
      "name": string,
      "fields": [
        {
          "name": string,
          "type": "string" | "number" | "boolean",
          "indexed": boolean
        }
      ]
    }
  ]
}

PLANNING RULES:
- Keep the app intentionally small and buildable.
- Prefer 1 screen when possible, 2 screens when it clearly improves usability, and never exceed 3 screens.
- Use navigationStyle "tabs" only when the user genuinely needs multiple top-level destinations.
- Each screen must have a clear job, a clear primary action, and a concrete empty state.
- Favor flows that work well without external APIs.
- If persistence is needed, include data models. If not, return an empty array.
- If dataModels is not empty, include a "meta" model with field { "name": "key", "type": "string", "indexed": true }.
- Every non-meta model must include a "createdAt" field of type "number" with indexed true.
- Screen names must be PascalCase and contain no spaces.
- initialScreen must match one of the screen names exactly.
- accentColor must be a valid hex color like "#F97316".

QUALITY BAR:
- The UX should feel guided, not raw.
- Include useful microcopy, visible feedback, and practical defaults.
- Avoid bloated feature sets and vague sections like "misc" or "extras".`;
}

export function getDesignPrompt(appPlan: any, screen: any): string {
  return `You are a senior mobile product designer working as the dedicated UX specialist.

Design a single screen experience for a React Native app. Your job is to make the screen feel clear, attractive, and easy to use while staying realistic for a code generator.

OUTPUT RULES:
- Output ONLY valid JSON.
- No markdown. No commentary.

APP PLAN:
${stringify(appPlan)}

SCREEN:
${stringify(screen)}

OUTPUT SCHEMA:
{
  "screenName": string,
  "experienceGoal": string,
  "layoutSummary": string,
  "visualTone": string,
  "hierarchy": [
    {
      "zone": string,
      "content": string,
      "reason": string
    }
  ],
  "components": [
    {
      "name": string,
      "kind": string,
      "purpose": string,
      "notes": string
    }
  ],
  "interactions": [
    {
      "name": string,
      "trigger": string,
      "feedback": string
    }
  ],
  "states": {
    "loading": string,
    "empty": string,
    "error": string,
    "success": string
  },
  "microcopy": {
    "headline": string,
    "supportingText": string,
    "primaryActionLabel": string
  },
  "accessibility": string[],
  "delight": string[]
}

DESIGN RULES:
- Create a strong information hierarchy with a visible hero/header, focused main content, and a clear primary action.
- Prefer cards, segmented sections, chips, progress cues, and inline helper text over cluttered layouts.
- The screen must feel polished even with simple components.
- Every interaction should give visible feedback.
- Loading, empty, error, and success states must feel intentional.
- Accessibility guidance should mention contrast, readable touch targets, and plain-language copy.
- Keep the design consistent with the app's visualDirection.`;
}

export function getLogicPrompt(appPlan: any, screen: any, designPlan: any): string {
  return `You are the dedicated application logic specialist for a React Native build pipeline.

Plan the state, behaviors, and edge-case handling for one screen. Focus on clean local logic that pairs well with the UX plan.

OUTPUT RULES:
- Output ONLY valid JSON.
- No markdown. No commentary.

APP PLAN:
${stringify(appPlan)}

SCREEN:
${stringify(screen)}

UX PLAN:
${stringify(designPlan)}

OUTPUT SCHEMA:
{
  "screenName": string,
  "localState": [
    {
      "name": string,
      "type": string,
      "defaultValue": string
    }
  ],
  "derivedState": string[],
  "handlers": [
    {
      "name": string,
      "trigger": string,
      "steps": string[]
    }
  ],
  "mutations": string[],
  "validations": string[],
  "edgeCases": string[],
  "dataBindings": string[],
  "implementationNotes": string[]
}

LOGIC RULES:
- Prefer local React state for local interactions.
- Only use db.transact when the app plan includes data models.
- Do not rely on navigation, router, or hidden framework behavior.
- Call out empty inputs, invalid edits, duplicate data, destructive actions, and recovery paths.
- Keep logic deterministic and simple enough for a single generated screen function.`;
}

export function getScreenPrompt(appPlan: any, screen: any, designPlan: any, logicPlan: any): string {
  const stylesVar = `${screen.name.charAt(0).toLowerCase() + screen.name.slice(1)}Styles`;
  const hasData = Array.isArray(appPlan?.dataModels) && appPlan.dataModels.length > 0;

  return `You are the implementation specialist in a multi-agent handoff pipeline.

Your job is to turn the provided planning, UX, and logic artifacts into ONE high-quality React Native screen function.

OUTPUT RULES:
- Output ONLY the JavaScript function.
- No markdown. No explanation.
- No imports. No exports.

APP PLAN:
${stringify(appPlan)}

SCREEN PLAN:
${stringify(screen)}

UX HANDOFF:
${stringify(designPlan)}

LOGIC HANDOFF:
${stringify(logicPlan)}

IMPLEMENTATION CONTRACT:
- Output exactly: function ${screen.name}({ db, id, data, isLoading }) { ... }
- Function name must be exactly "${screen.name}"
- Define all helpers inside the component
- Define const ${stylesVar} = StyleSheet.create({...}) inside the component and before return
- Render all visible text inside <Text>
- Use React.useState for local state
- Handle loading, empty, error/help, and success feedback in the UI
- Every declared action must have an obvious visible control
- Use only React state, props, and db.transact when data exists
- Never use navigation, history, router, useRouter, or useNavigation
- Never call db.useQuery inside the screen
- Prefer FlatList for data collections
- Keep touch targets comfortable and spacing generous
- Include helpful labels, short guidance copy, and action feedback

VISUAL TOKENS:
- Background: #0B1020
- Surface: #121A2B
- Surface alt: #1B2540
- Primary: ${appPlan?.visualDirection?.accentColor || "#7C3AED"}
- Secondary accent: #F97316
- Text: #F8FAFC
- Muted text: #94A3B8
- Success: #22C55E
- Danger: #EF4444
- Border: #24324D
- Radius: 14 to 20

SCREEN SHAPE:
<View style={${stylesVar}.container}>
  <View style={${stylesVar}.header}>{/* title, context, compact summary */}</View>
  <View style={${stylesVar}.content}>{/* main interaction area */}</View>
  <View style={${stylesVar}.footer}>{/* primary action / supporting actions */}</View>
</View>

DATA RULES:
${
  hasData
    ? `The app has persistent data.
- data already contains queried records from the root app
- Use db.transact for writes
- Use only this mutation syntax:
  db.transact([db.tx.ModelName[id()].create({ field: value, createdAt: Date.now() })])
  db.transact([db.tx.ModelName[item.id].update({ field: newValue })])
  db.transact([db.tx.ModelName[item.id].delete()])`
    : `The app has no persistent data.
- Do not use db.transact
- Keep everything purely local and deterministic`
}

FAIL-SAFE:
- If you cannot satisfy the contract, output exactly:
// INVALID_SCREEN`;
}

export function getAssemblyPrompt(appPlan: any, screenCodes: string[]): string {
  const screenNames = appPlan.screens.map((screen: any) => screen.name);
  const hasData = appPlan.dataModels.length > 0;
  const queryEntities = appPlan.dataModels.map((model: any) => `${model.name}: {}`).join(",\n    ");
  const schemaEntities = appPlan.dataModels
    .map((model: any) => {
      const fields = model.fields
        .map((field: any) => {
          let type = `i.${field.type}()`;
          if (field.indexed) {
            type += ".indexed()";
          }
          return `      ${field.name}: ${type},`;
        })
        .join("\n");

      return `    ${model.name}: i.entity({\n${fields}\n    }),`;
    })
    .join("\n");

  return `You are the final assembly specialist.

Assemble a complete React Native app from authoritative screen functions. The goal is a working preview with strong UX defaults.

OUTPUT RULES:
- Output ONLY valid JavaScript.
- No markdown. No explanation.
- Start with import React

APP PLAN:
${stringify(appPlan)}

SCREEN FUNCTIONS (copy exactly, do not modify their internal logic):
${screenCodes.map((code, index) => `// === ${appPlan.screens[index].name} ===\n${code}`).join("\n\n")}

ABSOLUTE RULES:
- Screen functions are authoritative and must be pasted exactly
- Never hardcode build IDs
- Always use the global buildDataId value when initializing runtime data
- Use a single top-level app component
- Keep the shell polished with SafeAreaView, StatusBar, and a coherent bottom tab bar when there is more than one screen
- Shared loading/data wiring belongs in App, not inside generated screen functions

STEP 1: imports
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, ActivityIndicator, Platform } from 'react-native';
import { init, id, i } from '@kairo/runtime';

STEP 2: data runtime
${
  hasData
    ? `const schema = i.schema({
  entities: {
${schemaEntities}
  },
});

const db = init({ buildId: buildDataId, schema });`
    : `const db = null;`
}

STEP 3: paste screen functions exactly as provided

STEP 4: create the main app
export default function App() {
  const [activeTab, setActiveTab] = useState('${appPlan.initialScreen}');
${
  hasData
    ? `
  const { data, isLoading } = db.useQuery({
    ${queryEntities}
  });
`
    : `
  const data = null;
  const isLoading = false;
`
}

  return (
    <SafeAreaView style={shellStyles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={shellStyles.shell}>
        <View style={shellStyles.body}>
          ${screenNames.map((name: string) => `{activeTab === '${name}' && <${name} db={db} id={id} data={data} isLoading={isLoading} />}`).join("\n          ")}
        </View>
        ${
          screenNames.length > 1
            ? `<View style={shellStyles.tabBar}>
          {${JSON.stringify(screenNames)}.map((tab) => (
            <TouchableOpacity key={tab} style={shellStyles.tabItem} onPress={() => setActiveTab(tab)}>
              <Text style={[shellStyles.tabLabel, activeTab === tab && shellStyles.tabLabelActive]}>
                {tab.replace('Screen', '')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>`
            : ""
        }
      </View>
    </SafeAreaView>
  );
}

STEP 5: shell styles
const shellStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#081120' },
  shell: { flex: 1, backgroundColor: '#081120' },
  body: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tabLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '${appPlan?.visualDirection?.accentColor || "#7C3AED"}',
  },
});`;
}

export const getSpecPrompt = getPlanningPrompt;
export const getUxPrompt = getDesignPrompt;
export const getGluePrompt = getAssemblyPrompt;

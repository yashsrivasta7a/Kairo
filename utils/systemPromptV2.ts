export function getSpecPrompt(): string {
  return `You are a JSON-only API. You never write prose.

The user will describe a mobile app idea. Your job is to analyze it and output a specification as JSON.

OUTPUT RULES — THESE ARE ABSOLUTE:
- Output ONLY valid JSON. Nothing else.
- No markdown. No backticks. No explanation.
- If you cannot follow the schema, output {"error": "reason"}

OUTPUT SCHEMA:
{
  "appName": string,
  "initialScreen": string,
  "screens": [
    {
      "name": string,
      "purpose": string,
      "uiHint": string,
      "actions": string[]
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

RULES FOR THE SPEC:
- Use the MINIMUM number of screens necessary. More screens = more complexity = more bugs.
- 1 screen is correct for: calculators, timers, converters, tip splitters, unit converters, simple games, flashcards, password generators, countdowns
- 2 screens is correct for: list + detail (e.g. note list → note editor), home + settings
- 3 screens is only correct when the app genuinely has 3 distinct navigation destinations (e.g. a full social app with feed, explore, profile)
- NEVER add a screen just to reach a higher number. If you are unsure, use fewer screens.
- Hard limit: never exceed 3 screens
- Max 3 data models (can be 0 if the app has no persistent data)
- appName must be short (2-3 words)
- Screen names must be PascalCase, ONE word, no spaces (e.g. "HomeScreen" not "Home Screen")
- initialScreen must match one of the screen names exactly
- Each screen must have at least 1 action

THE uiHint FIELD — THIS IS THE MOST IMPORTANT FIELD:
Think carefully about what the screen actually looks like to a user. Describe the UI layout in detail.
Be specific — mention button grids, sliders, cards, lists, tabs, forms, charts etc.

EXAMPLES:
- Calculator → uiHint: "Grid of number buttons (0-9), operator buttons (+,-,*,/), a large display at the top showing the current expression and result, equals button"
- Todo list → uiHint: "Scrollable list of todo items with checkbox and delete button, text input with add button at the bottom"
- Recipe app → uiHint: "Cards grid showing recipe name and emoji, tap to open detail with ingredient list and steps"
- Timer → uiHint: "Large circular countdown display in the center, start/pause/reset buttons below, preset time buttons (5, 10, 15, 30 min)"
- Expense tracker → uiHint: "Summary card at top showing total, scrollable list of transactions grouped by day, floating add button"

DATA MODELS — WHEN TO USE:
- App needs to SAVE data between sessions → include data models
- App is purely computational (calculator, converter, timer) → dataModels: [] (empty array)
- Always include a "meta" model if dataModels is non-empty, with field: { name: "key", type: "string", indexed: true }
- Every non-meta data model must have a "createdAt" field with type "number" and indexed: true`;
}

export function getScreenPrompt(spec: any, screen: any): string {
  const stylesVar =
    `${screen.name.charAt(0).toLowerCase() + screen.name.slice(1)}Styles`;
  const needsData = spec.dataModels.length > 0;

  return `You are a React Native developer. Output ONLY a single JavaScript function.
No imports. No exports. No schema. No db initialization.

You are writing ONE screen for this app:
App: ${spec.appName}
Screen: ${screen.name}
Purpose: ${screen.purpose}
UI Layout: ${screen.uiHint}
Actions the user can do: ${screen.actions.join(', ')}

${needsData
      ? `Data models (already queried — DO NOT call db.useQuery):
${JSON.stringify(spec.dataModels, null, 2)}`
      : `This app has no persistent data — it is a pure UI/computation app.
Do NOT use db.transact or db.useQuery.`}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RULES — ABSOLUTE (NO EXCEPTIONS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Output ONLY the function:
  function ${screen.name}({ db, id, data, isLoading }) { ... }
- The function name must be exactly "${screen.name}"
- No imports. No exports.
- For EACH action listed, there MUST be a visible UI control that performs that action.
- Do NOT add UI for actions not listed.
- All text must be rendered inside <Text>
- Use React.useState for local state
- Use dark theme:
  bg #0A0A0F, surface #1A1A24, primary #8B5CF6, text #FAFAFA, muted #71717A
- Cards:
  backgroundColor #1A1A24, borderRadius 16, borderWidth 1, borderColor #2A2A3A

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 STYLE RULES (CRITICAL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Name your StyleSheet EXACTLY: "${stylesVar}"
- You MUST define:
  const ${stylesVar} = StyleSheet.create({...})
- It MUST be defined INSIDE the component
- It MUST be defined BEFORE the return() statement
- JSX may ONLY reference styles defined above it
- NEVER define styles after return()
- NEVER render <StyleSheet> as JSX
- StyleSheet.create(...) is NOT a component

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 HELPER + API RULES (CRITICAL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- ALL helper functions MUST be defined INSIDE the component
- NEVER assume navigation exists
- NEVER use: navigation, history, router, or fake db methods
- Screen logic may ONLY use:
  - React state
  - props (db, id, data, isLoading)
  - db.transact (only if data exists)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TRANSACTION SYNTAX (ONLY if data exists)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE:
db.transact([db.tx.ModelName[id()].create({ field: value, createdAt: Date.now() })])

UPDATE:
db.transact([db.tx.ModelName[item.id].update({ field: newValue })])

DELETE:
db.transact([db.tx.ModelName[item.id].delete()])


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎨 DESIGN TOKENS — MUST FOLLOW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Spacing:
- Screen padding: 16
- Card padding: 16
- Section gap: 16
- Element gap: 12
- Small gap: 8

Typography:
- Screen title: fontSize 24–28, fontWeight '700'
- Section title: fontSize 18, fontWeight '600'
- Body text: fontSize 14–16
- Muted text: color '#71717A'

Borders:
- Card borderRadius: 16
- Input borderRadius: 12
- Button borderRadius: 12

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧱 SCREEN STRUCTURE — REQUIRED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Every screen MUST follow this layout:

<View style={${stylesVar}.container}>
  <View style={${stylesVar}.header}>   {/* optional: titles, filters, context */}
  <View style={${stylesVar}.content}>  {/* main UI: lists, forms, main logic */}
  <View style={${stylesVar}.footer}>   {/* optional: primary actions only */}
</View>

- Header: titles, filters, context
- Content: lists, forms, main logic
- Footer: primary actions only

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚫 UI SIMPLICITY RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Max 1 primary button per screen
- Max 2 accent colors (primary #8B5CF6 + muted #71717A)
- Do NOT nest more than 2 card layers
- Avoid more than 1 scroll container per screen
- Prefer FlatList over ScrollView for lists of items

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧩 STANDARD COMPONENT RECIPES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Primary Button:
  backgroundColor: '#8B5CF6', height: 48, borderRadius: 12
  text: fontWeight '600', color '#FAFAFA'

Secondary Button:
  backgroundColor: 'transparent', borderWidth: 1, borderColor: '#2A2A3A'

Card:
  backgroundColor: '#1A1A24', borderRadius: 16
  borderWidth: 1, borderColor: '#2A2A3A', padding: 16

Input:
  backgroundColor: '#0A0A0F', borderWidth: 1
  borderColor: '#2A2A3A', padding: 12, borderRadius: 12

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🫙 UX COMPLETENESS — REQUIRED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Every screen MUST handle:
- loading state: show <ActivityIndicator size="large" color="#8B5CF6" /> centered
- empty state: a short explanation sentence + a suggested next action (button or hint text)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SELF-CHECK — MUST PASS BEFORE OUTPUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Before outputting, verify ALL of the following:

□ Function name is exactly "${screen.name}"
□ Function signature is exactly:
  function ${screen.name}({ db, id, data, isLoading }) { ... }
□ ALL helpers are inside the component
□ ${stylesVar} is defined using StyleSheet.create()
□ ${stylesVar} is defined BEFORE return()
□ NO <StyleSheet> JSX exists
□ ZERO imports and ZERO exports
□ No navigation / history / routing assumptions
□ Loading state is handled
□ Empty state is handled

IF ANY CHECK FAILS:
Output EXACTLY this line and nothing else:

// INVALID_SCREEN`;
}


export function getGluePrompt(spec: any, screenCodes: string[]): string {
  const screenNames = spec.screens.map((s: any) => s.name);
  const hasData = spec.dataModels.length > 0;
  const queryEntities = spec.dataModels.map((m: any) => `${m.name}: {}`).join(',\n    ');

  // Pre-build the schema string so the model doesn't have to guess
  const schemaEntities = spec.dataModels.map((m: any) => {
    const fields = m.fields.map((f: any) => {
      let type = `i.${f.type}()`;
      if (f.indexed) type += '.indexed()';
      return `      ${f.name}: ${type},`;
    }).join('\n');
    return `    ${m.name}: i.entity({\n${fields}\n    }),`;
  }).join('\n');

  return `You are assembling a complete React Native app from pre-built parts. Output ONLY valid JavaScript. No markdown. No explanation.

⚠️ ABSOLUTE RULE — SCREEN FUNCTIONS ARE AUTHORITATIVE
- Screen functions MUST be copied EXACTLY as provided
- If even ONE character inside a screen function is changed, this is a FAILURE
- Glue code must ONLY assemble, never modify logic

⚠️ APP ID RULE:
- The variable instantAppId is provided globally
- NEVER hardcode appId strings
- ALWAYS use: init({ appId: instantAppId, schema })

APP SPEC:
${JSON.stringify(spec, null, 2)}

PRE-BUILT SCREEN FUNCTIONS (copy these in exactly — do NOT modify them):
${screenCodes.map((code, idx) => `// === ${spec.screens[idx].name} ===\n${code}`).join('\n\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUR JOB: assemble the final app in this EXACT order
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 1 — IMPORTS (copy exactly):
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, ActivityIndicator, FlatList, TextInput, ScrollView, Modal, Alert, Animated, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import { init, id, i } from '@instantdb/react-native';

${hasData ? `STEP 2 — SCHEMA (copy exactly — already built from spec):
const schema = i.schema({
  entities: {
${schemaEntities}
  },
});

⚠️ INSTANTDB SCHEMA RULES:
✅ Valid types ONLY: i.string(), i.number(), i.boolean()
✅ Add .indexed() on any field that needs filtering/sorting
❌ NEVER use: i.any(), i.json(), i.object(), i.array()
❌ NEVER add links — use foreign key string fields instead

STEP 3 — DB INIT:
const db = init({ appId: instantAppId, schema });
⚠️ ALWAYS use the global variable instantAppId — NEVER hardcode an app ID.` :
      `STEP 2 — NO SCHEMA NEEDED:
This app has no persistent data. Just add:
const db = null; // no data needed`}

STEP 4 — SCREEN FUNCTIONS:
Paste ALL the pre-built screen functions exactly as given. Do NOT modify them.

STEP 5 — MAIN APP FUNCTION:
export default function App() {
  const [activeTab, setActiveTab] = useState('${spec.initialScreen}');
${hasData ? `
  // Single useQuery at top level — passes data down to all screens
  const { data, isLoading } = db.useQuery({
    ${queryEntities}
  });
` : `
  const data = null;
  const isLoading = false;
`}
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0A0F' }}>
      <StatusBar barStyle="light-content" />
      <View style={{ flex: 1 }}>
        ${screenNames.map(name => `{activeTab === '${name}' && <${name} db={db} id={id} data={data} isLoading={isLoading} />}`).join('\n        ')}
      </View>
      ${screenNames.length > 1 ? `<View style={tabStyles.tabBar}>
        {${JSON.stringify(screenNames)}.map(tab => (
          <TouchableOpacity key={tab} style={tabStyles.tabItem} onPress={() => setActiveTab(tab)}>
            <Text style={[tabStyles.tabLabel, activeTab === tab && tabStyles.tabActive]}>
              {tab.replace('Screen', '')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>` : ''}
    </SafeAreaView>
  );
}

STEP 6 — TAB BAR STYLES:
const tabStyles = StyleSheet.create({
  tabBar: { flexDirection: 'row', backgroundColor: '#111118', borderTopWidth: 1, borderTopColor: '#2A2A3A', paddingBottom: Platform.OS === 'ios' ? 20 : 8, paddingTop: 10 },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 6 },
  tabLabel: { fontSize: 12, color: '#71717A', fontWeight: '500' },
  tabActive: { color: '#8B5CF6', fontWeight: '700' },
});

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FINAL OUTPUT RULES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Output ONLY code. No markdown. No explanations.
- Start with: import React
- End with closing brace of export default function App()
- NEVER use db.reset(), db.queryOnce(), db.pause()
- NEVER import TypeScript types from InstantDB
- NEVER sort inside useQuery — sort in JS
- NEVER hardcode instantAppId`;
}

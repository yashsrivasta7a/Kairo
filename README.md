# 🚀 Kairo

**Build apps and widgets — right inside the app.**

Kairo is a React Native application built with [Expo](https://expo.dev/) and [InstantDB](https://www.instantdb.com/) that lets users create, customize, and manage mini-apps and widgets directly within the app itself. Think of it as a personal workspace where you can spin up tools, dashboards, and micro-experiences on the fly.

---

## 📸 Screenshots

> _Coming soon_

---

## ✨ Features

- **In-App Builder** — Create and edit apps & widgets using a visual builder interface.
- **Widget Library** — Browse, search, and install pre-built widgets.
- **Real-Time Sync** — All data is synced in real-time via InstantDB.
- **Theming** — Dark mode first, with customizable accent colors.
- **Authentication** — Secure login/signup powered by InstantDB Auth.
- **Offline Support** — Works offline with local-first data via InstantDB.

---

## 🛠️ Tech Stack

| Layer          | Technology                          |
| -------------- | ----------------------------------- |
| Framework      | React Native (Expo SDK 54)          |
| Navigation     | Expo Router (file-based routing)    |
| Database       | InstantDB (real-time, local-first)  |
| Styling        | NativeWind (Tailwind CSS for RN)    |
| Animations     | React Native Reanimated             |
| Gestures       | React Native Gesture Handler        |
| State          | React Context + InstantDB hooks     |
| Language       | TypeScript                          |

---

## 📂 Project Structure

```
kairo/
├── app/                          # Expo Router — file-based routing
│   ├── _layout.tsx               # Root layout (providers, fonts, etc.)
│   ├── index.tsx                 # Entry / splash / onboarding screen
│   ├── global.css                # Global Tailwind styles
│   │
│   ├── (auth)/                   # Authentication flow
│   │   ├── _layout.tsx           # Auth layout
│   │   ├── login.tsx             # Login screen
│   │   └── signup.tsx            # Sign-up screen
│   │
│   ├── (tabs)/                   # Main tab navigator
│   │   ├── _layout.tsx           # Tab bar layout
│   │   ├── index.tsx             # Home / Dashboard tab
│   │   ├── explore.tsx           # Explore / Widget Store tab
│   │   ├── builder.tsx           # App & Widget Builder tab
│   │   └── profile.tsx           # Profile & Settings tab
│   │
│   ├── (builder)/                # Builder sub-routes
│   │   ├── _layout.tsx           # Builder layout
│   │   ├── [id].tsx              # Edit existing app/widget
│   │   └── new.tsx               # Create new app/widget
│   │
│   └── (widget)/                 # Widget detail & runtime
│       ├── _layout.tsx           # Widget layout
│       └── [id].tsx              # Widget renderer / detail view
│
├── components/                   # Reusable UI components
│   ├── ui/                       # Primitives (Button, Input, Card, etc.)
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   └── index.ts              # Barrel export
│   │
│   ├── layout/                   # Layout components
│   │   ├── Header.tsx
│   │   ├── TabBar.tsx
│   │   ├── SafeArea.tsx
│   │   └── index.ts
│   │
│   ├── builder/                  # Builder-specific components
│   │   ├── Canvas.tsx            # Drag-and-drop canvas
│   │   ├── ComponentPalette.tsx  # Available components sidebar
│   │   ├── PropertyPanel.tsx     # Component property editor
│   │   ├── WidgetPreview.tsx     # Live preview of widget
│   │   └── index.ts
│   │
│   ├── widgets/                  # Widget rendering components
│   │   ├── WidgetCard.tsx        # Widget card for lists/grids
│   │   ├── WidgetRenderer.tsx    # Runtime renderer for widgets
│   │   ├── WidgetGrid.tsx        # Grid layout for dashboard
│   │   └── index.ts
│   │
│   └── common/                   # Shared/misc components
│       ├── EmptyState.tsx
│       ├── ErrorBoundary.tsx
│       ├── LoadingSpinner.tsx
│       ├── Avatar.tsx
│       └── index.ts
│
├── hooks/                        # Custom React hooks
│   ├── useAuth.ts                # Authentication hook (InstantDB)
│   ├── useWidgets.ts             # Widget CRUD operations
│   ├── useBuilder.ts             # Builder state management
│   ├── useDashboard.ts           # Dashboard layout management
│   └── useTheme.ts               # Theme/dark mode hook
│
├── lib/                          # Core library / utilities
│   ├── instant.ts                # InstantDB client initialization
│   ├── types.ts                  # Global TypeScript types & interfaces
│   ├── constants.ts              # App-wide constants (colors, sizes, etc.)
│   ├── utils.ts                  # General utility functions
│   └── widgets/                  # Widget engine
│       ├── registry.ts           # Widget type registry
│       ├── renderer.ts           # Widget render logic
│       └── templates.ts          # Pre-built widget templates
│
├── providers/                    # React Context providers
│   ├── AuthProvider.tsx          # Auth context
│   ├── ThemeProvider.tsx         # Theme context
│   └── BuilderProvider.tsx       # Builder state context
│
├── constants/                    # Static constants
│   └── icons.ts                  # Icon mappings
│
├── assets/                       # Static assets
│   ├── fonts/                    # Custom fonts
│   ├── images/                   # Images & illustrations
│   └── icons/                    # Custom icon SVGs
│
├── instant.schema.ts             # InstantDB schema definition
├── instant.perms.ts              # InstantDB permissions
├── app.json                      # Expo config
├── babel.config.js               # Babel config
├── metro.config.js               # Metro bundler config
├── tailwind.config.js            # Tailwind / NativeWind config
├── tsconfig.json                 # TypeScript config
├── .env                          # Environment variables
├── .gitignore                    # Git ignore rules
└── package.json                  # Dependencies & scripts
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (`npm install -g expo-cli`)
- [InstantDB Account](https://www.instantdb.com/) (for your App ID)

### Installation

```bash
# Clone the repo
git clone https://github.com/your-username/kairo.git
cd kairo

# Install dependencies
npm install

# Set up environment variables
# Make sure .env has your EXPO_PUBLIC_INSTANT_APP_ID and INSTANT_APP_ADMIN_TOKEN

# Start the dev server
npx expo start
```

### Running on Device

```bash
# Android
npm run android

# iOS
npm run ios

# Web (experimental)
npm run web
```

---

## 🗄️ InstantDB

Kairo uses **InstantDB** as its backend — a real-time, local-first database.

- **Schema**: Defined in `instant.schema.ts`
- **Permissions**: Defined in `instant.perms.ts`
- **Client**: Initialized in `lib/instant.ts`

### Key Commands

```bash
# Login to InstantDB CLI
npx instant-cli login

# Push schema changes
npx instant-cli push-schema

# Push permission changes
npx instant-cli push-perms

# Pull latest schema from cloud
npx instant-cli pull --schema

# Pull latest permissions from cloud
npx instant-cli pull --perms
```

---

## 🎨 Styling

Kairo uses **NativeWind** (Tailwind CSS for React Native). All utility classes work just like Tailwind on the web.

- Global styles: `app/global.css`
- Tailwind config: `tailwind.config.js`
- Custom theme tokens live in `lib/constants.ts`

---

## 📱 Navigation

File-based routing via **Expo Router**:

| Route               | Screen                    |
| -------------------- | ------------------------ |
| `/`                  | Entry / Onboarding       |
| `/(auth)/login`      | Login                    |
| `/(auth)/signup`     | Sign Up                  |
| `/(tabs)/`           | Home Dashboard           |
| `/(tabs)/explore`    | Widget Store / Explore   |
| `/(tabs)/builder`    | Builder                  |
| `/(tabs)/profile`    | Profile & Settings       |
| `/(builder)/new`     | New Widget/App           |
| `/(builder)/[id]`    | Edit Widget/App          |
| `/(widget)/[id]`     | Widget Detail / Runtime  |

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feat/awesome-feature`)
3. Commit your changes (`git commit -m 'feat: add awesome feature'`)
4. Push to the branch (`git push origin feat/awesome-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgements

- [Expo](https://expo.dev/)
- [InstantDB](https://www.instantdb.com/)
- [NativeWind](https://www.nativewind.dev/)
- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)

---

<p align="center">
  Built with ❤️ by the Kairo team
</p>

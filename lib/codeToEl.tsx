import * as Babel from "@babel/standalone";
import React from "react";
import ReactNative from "react-native";
import { createGeneratedAppRuntime } from "./generatedAppAdapter";

// ============================================================================
// POLYFILLS & MOCKS - For modules not available in execution environment
// ============================================================================

// Mock AsyncStorage - stores data in memory during session
const AsyncStorageMock = {
  _data: {} as Record<string, string>,
  getItem: async (key: string) => {
    return AsyncStorageMock._data[key] || null;
  },
  setItem: async (key: string, value: string) => {
    AsyncStorageMock._data[key] = value;
    return null;
  },
  removeItem: async (key: string) => {
    delete AsyncStorageMock._data[key];
    return null;
  },
  clear: async () => {
    AsyncStorageMock._data = {};
    return null;
  },
  getAllKeys: async () => {
    return Object.keys(AsyncStorageMock._data);
  },
  multiGet: async (keys: string[]) => {
    return keys.map((key) => [key, AsyncStorageMock._data[key] || null]);
  },
  multiSet: async (keyValuePairs: [string, string][]) => {
    keyValuePairs.forEach(([key, value]) => {
      AsyncStorageMock._data[key] = value;
    });
    return null;
  },
};

// Mock Vibration - no-op for preview
const VibrationMock = {
  vibrate: (duration: number | number[]) => {},
  cancel: () => {},
};

// Mock Clipboard
const ClipboardMock = {
  setString: async (text: string) => {
    ClipboardMock._text = text;
  },
  getString: async () => {
    return ClipboardMock._text || "";
  },
  _text: "",
};

// Mock Linking
const LinkingMock = {
  openURL: async (url: string) => {
    console.log("Would open URL:", url);
  },
  canOpenURL: async (url: string) => true,
  addEventListener: () => ({ remove: () => {} }),
};

// Mock Share
const ShareMock = {
  share: async (options: any) => {
    console.log("Would share:", options);
  },
};

// Mock Alert
const AlertMock = {
  alert: (title: string, message?: string, buttons?: any[] | null) => {
    console.log("Alert:", title, message);
  },
};

// Mock BackHandler
const BackHandlerMock = {
  addEventListener: () => ({ remove: () => {} }),
  exitApp: () => {},
};

const codeToEl = (buildId: string, inputCode: string) => {
  let code = inputCode;
  code = code.replaceAll(/buildDataId/g, `'${buildId}'`);
  //Triming code before the first import
  const importIndex = code.indexOf("import");
  if (importIndex > 0) {
    code = code.substring(importIndex);
  }

  //Triming code after the export
  const exportText = "export default App();";
  const exportIndex = code.indexOf(exportText);
  if (exportIndex > -1) {
    code = code.substring(0, exportIndex + exportText.length);
  }

  // Transform the javascript: this transpiles away JSX,
  // changes `import` to `require`, etc
  const transformed = Babel.transform(code.trim(), {
    presets: [["env", { targets: { esmodules: true } }], "react", "typescript"],
    filename: "component.tsx",
    plugins: [["transform-modules-commonjs", { strict: false }]],
  }).code;

  // This creates a little `module` function.
  // Once this code is instantiated, we can run it,
  // and *the default export* will return!
  const moduleCode = `
    const exports = {};
    const module = { exports };

    const require = (name) => {
      if (name === 'react') return React;
      if (name === 'react-native') return ReactNative;
      if (name === '@kairo/runtime') return GeneratedRuntime;
      if (name === '@react-native-async-storage/async-storage') return AsyncStorage;
      if (name === 'async-storage') return AsyncStorage;
      if (name === 'react-native-vibration') return Vibration;
      if (name === '@react-native-clipboard/clipboard') return Clipboard;
      if (name === 'react-native-linking') return Linking;
      if (name === 'react-native-share') return Share;
      if (name === 'react-native-alert') return Alert;
      if (name === 'react-native-back-handler') return BackHandler;
      throw new Error('Module not found: ' + name + '. Only React, React Native, and the Kairo runtime are available in preview.');
    };

    ${transformed}

    return module.exports.default || module.exports;
  `;

  const moduleFn = new Function(
    "React",
    "ReactNative",
    "GeneratedRuntime",
    "AsyncStorage",
    "Vibration",
    "Clipboard",
    "Linking",
    "Share",
    "Alert",
    "BackHandler",
    moduleCode
  );

  const generatedRuntime = createGeneratedAppRuntime(buildId);
  const Component = moduleFn(
    React,
    ReactNative,
    generatedRuntime,
    AsyncStorageMock,
    VibrationMock,
    ClipboardMock,
    LinkingMock,
    ShareMock,
    AlertMock,
    BackHandlerMock
  );

  return React.createElement(Component);
};

export default codeToEl;

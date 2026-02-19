import { Platform } from 'react-native';
import structuredClone from '@ungap/structured-clone';
import { polyfillGlobal } from 'react-native/Libraries/Utilities/PolyfillFunctions';
import {TextDecoderStream,TextEncoderStream} from '@stardazed/streams-text-encoding';


if (Platform.OS !== 'web') {
  const setupPolyfills = async () => {

    if (!('structuredClone' in global)) {
      polyfillGlobal('structuredClone', () => structuredClone);
    }

    polyfillGlobal('TextEncoderStream', () => TextEncoderStream);
    polyfillGlobal('TextDecoderStream', () => TextDecoderStream);
  };

  setupPolyfills();
}

export {};
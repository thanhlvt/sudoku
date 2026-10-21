import { setLanguage } from '../i18n';

// The suite's expectations are written in Vietnamese, so the "device" is a Vietnamese one. Tests of other
// languages pick them explicitly (`setLanguage('en')`, `translator('en')`) and restore this afterwards.
if (typeof navigator !== 'undefined') {
  Object.defineProperty(navigator, 'languages', { value: ['vi-VN', 'vi'], configurable: true });
  Object.defineProperty(navigator, 'language', { value: 'vi-VN', configurable: true });
}
setLanguage('auto');

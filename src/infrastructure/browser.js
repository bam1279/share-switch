// Chrome Extension APIs are accessed using the `chrome` namespace
const browser = Object.hasOwn(globalThis, 'browser')
  ? globalThis.browser
  : globalThis.chrome;

export const { i18n } = browser;
export const { runtime } = browser;
export const { scripting } = browser;
export const syncStorage = browser.storage.sync;
export const { tabs } = browser;
export const { webNavigation } = browser;

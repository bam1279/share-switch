import {
  i18n,
  runtime,
  handleExtensionApiError,
} from '../infrastructure/browser.js';

document.querySelector('button').innerHTML =
  `<img src="../images/settings.svg" alt="Gear icon">${i18n.getMessage('settings')}...`;
document
  .querySelector('.settings-btn')
  .addEventListener('click', () =>
    runtime.openOptionsPage().catch((err) => handleExtensionApiError(err)),
  );

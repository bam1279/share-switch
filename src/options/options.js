import DEFAULT_SETTINGS from './default-settings.js';
import Store from './store.js';
import {
  i18n,
  syncStorage,
  handleExtensionApiError,
} from '../infrastructure/browser.js';

const store = await Store.buildFromStorage(
  syncStorage,
  DEFAULT_SETTINGS,
  handleExtensionApiError,
);

const setLocalization = () => {
  document.querySelector('h1').innerText =
    `ShareSwitch ${i18n.getMessage('settings')}`;
  const keys = [
    'origin',
    '',
    'destination',
    'showConfirmationDialog',
    'openBothPages',
  ];
  const element = document.querySelectorAll('thead > tr > th');
  keys.forEach((key, i) => {
    element[i].innerText = i18n.getMessage(key);
  });
};

const setDestPlatformImage = (select) => {
  const option = select.options[select.selectedIndex];
  const newSelect = select; // avoid ESlint no-param-reassign
  newSelect.style.backgroundImage = `url("../images/${option.value}.png")`;
};

const renderRedirectSettings = () => {
  const redirectSettings = store.getAllRedirects();
  const platforms = store.getAllPlatforms();
  const htmlStrings = redirectSettings.ids.map((id) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="align-left"><img class="original-icon" src="../images/${id}.png" alt="${id} icon">${redirectSettings[id].name}</td>
      <td class="align-center"><img src="../images/right-arrow.svg" alt="Right arrow icon"></td>
      <td class="align-left">
        <select class="dest">
          ${platforms.ids.reduce((acc, key) => `${acc}<option value="${key}"${key === redirectSettings[id].dest ? ' selected' : ''}>${platforms[key].name}</option>`, '<option value="none">(None)</option>')}
        </select>
      </td>
      <td class="align-center">
        <label class="switch">
          <input class="confirm" type="checkbox"${redirectSettings[id].confirm ? ' checked' : ''}>
          <span class="slider round"></span>
        </label>
      </td>
      <td class="align-center">
        <label class="switch">
          <input class="open-both" type="checkbox"${redirectSettings[id].openBoth ? ' checked' : ''}>
          <span class="slider round"></span>
        </label>
      </td>
      `;

    const destSelect = tr.querySelector('.dest');
    setDestPlatformImage(destSelect);
    destSelect.addEventListener('change', (event) => {
      const select = event.currentTarget;
      setDestPlatformImage(select);

      store.updateRedirectSetting(id, { dest: select.value });
    });

    tr.querySelector('.confirm').addEventListener('change', (event) => {
      store.updateRedirectSetting(id, { confirm: event.currentTarget.checked });
    });

    tr.querySelector('.open-both').addEventListener('change', (event) => {
      store.updateRedirectSetting(id, {
        openBoth: event.currentTarget.checked,
      });
    });
    return tr;
  });

  const tbody = document.querySelector('tbody');
  tbody.innerHTML = '';
  htmlStrings.forEach((tr) => {
    tbody.appendChild(tr);
  });
};

const init = () => {
  setLocalization();
  renderRedirectSettings();
};

init();

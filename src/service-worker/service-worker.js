import {
  i18n,
  runtime,
  scripting,
  syncStorage,
  tabs,
  webNavigation,
  handleExtensionApiError,
} from '../infrastructure/browser.js';

runtime.onInstalled.addListener(() =>
  runtime.openOptionsPage().catch((err) => handleExtensionApiError(err)),
);

const extractParams = (searchParams) => {
  const DECODED_HASH_SYMBOLL = '#';
  const DECODED_SPACE_CHAR = ' ';

  // Join multiple 'text' and 'url' parameters with commas (same behavior as X)
  const text = searchParams.getAll('text').join(',');
  const url = searchParams.getAll('url').join(',');
  const hashtag = searchParams
    .getAll('hashtags')
    .flatMap((item) => item.split(','))
    .map((item) => DECODED_HASH_SYMBOLL + item)
    .join(' ');

  // Insert a space after the last text (same behavior as X)
  return [text, url, hashtag]
    .map((value) =>
      value ? encodeURIComponent(value + DECODED_SPACE_CHAR) : '',
    )
    .join('');
};

const executeRedirect = (tabId, searchParams, destOptions, openBoth) => {
  const text = extractParams(searchParams);
  const url = `${destOptions.url}?${destOptions.query}=${text}`;
  if (openBoth) {
    tabs.create({ url });
  } else {
    tabs.update(tabId, { url });
  }
};

const showConfirmBeforeRedirect = async (
  tabId,
  searchParams,
  destOptions,
  openBoth,
) => {
  const text = i18n.getMessage('confirmationDialogText', destOptions.name);
  const [onExecuted] = await scripting
    .executeScript({
      target: { tabId },
      func: (message) => window.confirm(message), // eslint-disable-line no-alert
      args: [text],
    })
    .catch((err) => handleExtensionApiError(err));

  if (onExecuted.result) {
    executeRedirect(tabId, searchParams, destOptions, openBoth);
  }
};

const handleClick = async (details, redirect, validConfirm) => {
  const settings = await syncStorage
    .get()
    .catch((err) => handleExtensionApiError(err));
  const currentUrl = new URL(details.url);
  const id = 'x';
  const redirectOptions = settings.redirects?.[id];

  if (!redirectOptions) return;

  if (!validConfirm(redirectOptions.confirm)) return;

  const destOptions = settings.platforms?.[redirectOptions.dest];
  if (!destOptions) return;

  redirect(
    details.tabId,
    currentUrl.searchParams,
    destOptions,
    redirectOptions.openBoth,
  );
};

const validConfirm = (is) => (confirm) => confirm === is;

const urlFilter = [
  {
    originAndPathMatches:
      '^https?://(x|twitter).com/(intent/(tweet|post)|share)/?$',
  },
];

// If confirmation option is disabled
webNavigation.onBeforeNavigate.addListener(
  (details) => {
    handleClick(details, executeRedirect, validConfirm(false));
  },
  { url: urlFilter },
);

// If confirmation option is enabled
// Use onCommitted to execute window.confirm after navigation
webNavigation.onCommitted.addListener(
  (details) => {
    handleClick(details, showConfirmBeforeRedirect, validConfirm(true));
  },
  { url: urlFilter },
);

import {
  i18n,
  runtime,
  scripting,
  syncStorage,
  tabs,
  webNavigation,
} from '../infrastructure/browser.js';

runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    runtime
      .openOptionsPage()
      .catch((err) => console.error('Extension API error: ', err));
  }
});

const extractParams = (searchParams) => {
  // Join multiple 'text' and 'url' parameters with commas (same behavior as X)
  const text = searchParams.getAll('text').join(',');
  const url = searchParams.getAll('url').join(',');
  const hashtag = searchParams
    .getAll('hashtags')
    .flatMap((item) => item.split(','))
    .map((item) => (item ? `#${item}` : ''))
    .join(' ');

  // Insert a space after the last text (same behavior as X)
  return [text, url, hashtag]
    .map((value) => (value ? encodeURIComponent(`${value} `) : ''))
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
  const injectionResults = await scripting
    .executeScript({
      target: { tabId },
      func: (message) => window.confirm(message), // eslint-disable-line no-alert
      args: [text],
    })
    .catch((err) => {
      console.error('Extension API error: ', err);
    });

  if (
    Array.isArray(injectionResults) &&
    injectionResults.length &&
    injectionResults[0].result
  ) {
    executeRedirect(tabId, searchParams, destOptions, openBoth);
  }
};

const handleClick = async (details, redirect, validConfirm) => {
  const settings = await syncStorage
    .get()
    .catch((err) => console.error('Extension API error: ', err));
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

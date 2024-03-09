const DEFAULT_SETTINGS = {
  redirects: {
    x: {
      id: 'x',
      name: 'X (Twitter)',
      dest: 'bsky',
      confirm: true,
      openBoth: false,
    },
    ids: ['x'],
  },
  platforms: {
    bsky: {
      id: 'bsky',
      name: 'Bluesky',
      url: 'https://bsky.app/intent/compose',
      query: 'text',
    },
    mastosoc: {
      id: 'mastosoc',
      name: 'mastodon.social',
      url: 'https://mastodon.social/share',
      query: 'text',
    },
    misskeyio: {
      id: 'misskeyio',
      name: 'Misskey.io',
      url: 'https://misskey.io/share',
      query: 'text',
    },
    ids: ['bsky', 'mastosoc', 'misskeyio'],
    showBtn: ['bsky'],
  },
};

Object.freeze(DEFAULT_SETTINGS);

export default DEFAULT_SETTINGS;

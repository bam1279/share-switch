class Store extends EventTarget {
  #storage;

  #settings;

  constructor(storage, settings) {
    super();
    this.#storage = storage;
    this.#settings = settings;

    // getters
    this.getAllRedirects = () => this.#settings.redirects;
    this.getAllPlatforms = () => this.#settings.platforms;
  }

  // Asynchronous processes cannot be called directly within the constructor
  static buildFromStorage = async (storage, defaultSettings) => {
    const settings = await storage
      .get()
      .catch((err) => console.error('Extension API error: ', err));
    const hasRequiredKeys = settings.redirects && settings.platforms;
    if (hasRequiredKeys) return new Store(storage, settings);

    await storage
      .clear()
      .catch((err) => console.error('Extension API error: ', err));
    await storage
      .set(defaultSettings)
      .catch((err) => console.error('Extension API error: ', err));
    return new Store(storage, defaultSettings);
  };

  static #isObject(item) {
    // The typeof operator determines that null and arrays are also 'object'
    return typeof item === 'object' && item !== null && !Array.isArray(item);
  }

  #mergeDeepObj(target, source) {
    if (!Store.#isObject(target) || !Store.#isObject(source)) {
      return target;
    }

    const output = { ...target };
    Object.entries(source).forEach(([key, sourceValue]) => {
      if (Store.#isObject(sourceValue) && Store.#isObject(target[key])) {
        output[key] = this.#mergeDeepObj(target[key], sourceValue);
      } else {
        output[key] = sourceValue;
      }
    });

    return output;
  }

  async #save(settings) {
    await this.#storage
      .set(settings)
      .catch((err) => console.error('Extension API error: ', err));
    this.#settings = settings;
    this.dispatchEvent(new CustomEvent('save'));
  }

  updateRedirectSetting(id, newOptions) {
    const newConfig = {
      redirects: {
        [id]: newOptions,
      },
    };
    const updatedSettings = this.#mergeDeepObj(this.#settings, newConfig);
    this.#save(updatedSettings);
  }
}

export default Store;

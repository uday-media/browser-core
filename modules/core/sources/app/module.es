import { Window } from 'platform/browser';
import System from 'system';
import console from 'core/console';

function prepareBackgroundReadyPromise() {
  this.backgroundReadyPromise = new Promise((resolve, reject) => {
    this.backgroundReadyPromiseResolver = resolve;
    this.backgroundReadyPromiseRejecter = reject;
  });
}

export default class Module {
  constructor(name, settings) {
    this.name = name;
    this.isEnabled = false;
    this.isLoading = true;
    this.loadingTime = null;
    this.settings = settings;
    this.windows = Object.create(null);
    prepareBackgroundReadyPromise.call(this);
  }

  isReady() {
    return this.backgroundReadyPromise;
  }

  enable() {
    console.log('Module', this.name, 'start loading');
    const loadingStartedAt = Date.now();
    if (this.isEnabled) {
      throw new Error('Module already enabled');
    }
    return System.import(`${this.name}/background`)
      .then(({ default: background }) => {
        this.background = background;
        return background.init(this.settings);
      })
      .then(() => {
        this.isEnabled = true;
        this.isLoading = false;
        this.loadingTime = Date.now() - loadingStartedAt;
        console.log('Module: ', this.name, ' -- Background loaded');
        this.backgroundReadyPromiseResolver();
      });
  }

  disable({ quick } = { quick: false }) {
    console.log('Module', this.name, 'start unloading');
    const background = System.get(`${this.name}/background`).default;

    if (quick) {
      // background does not need to have beforeBrowserShutdown defined
      const quickShutdown = background.beforeBrowserShutdown ||
        function beforeBrowserShutdown() {};
      quickShutdown.call(background);
    } else {
      background.unload();
      this.isEnabled = false;
      this.loadingTime = null;
      prepareBackgroundReadyPromise.call(this);
    }
    console.log('Module', this.name, 'unloading finished');
  }

  /**
   * return window module
   */
  loadWindow(window) {
    if (!this.isEnabled) {
      return Promise.reject('cannot load window of disabled module');
    }
    let resolver;
    let rejecter;
    const loadingPromise = new Promise((resolve, reject) => {
      resolver = resolve;
      rejecter = reject;
    });
    const win = new Window(window);

    if (this.windows[win.id]) {
      console.log('Module window:', `"${this.name}"`, 'already loaded');
      return Promise.resolve();
    }
    window.CLIQZ.Core.windowModules[this.name] = true;

    this.windows[win.id] = {
      loadingPromise,
    };
    console.log('Module window:', `"${this.name}"`, 'loading started');

    const loadingStartedAt = Date.now();
    const settings = this.settings;
    return System.import(`${this.name}/window`)
      .then(({ default: WindowModule }) => new WindowModule({ settings, window }))
      .then(module => Promise.resolve(module.init()).then(() => module))
      .then((windowModule) => {
        this.windows[win.id] = {
          loadingTime: Date.now() - loadingStartedAt,
        };
        console.log('Module window:', `"${this.name}"`, 'loading finished');
        win.window.CLIQZ.Core.windowModules[this.name] = windowModule;
        resolver();
      })
      .catch((e) => {
        rejecter(e);
        throw e;
      });
  }

  unloadWindow(window, { disable } = {}) {
    const win = new Window(window);
    const windowModule = window.CLIQZ.Core.windowModules[this.name];
    if (!windowModule) {
      return;
    }

    if (disable && windowModule.disable) {
      console.log('Module window', `"${this.name}"`, 'disabling');
      window.CLIQZ.Core.windowModules[this.name].disable();
    }
    console.log('Module window', `"${this.name}"`, 'unloading');
    window.CLIQZ.Core.windowModules[this.name].unload();
    delete win.window.CLIQZ.Core.windowModules[this.name];
    delete this.windows[win.id];
    console.log('Module window', `"${this.name}"`, 'unloading finished');
  }

  status() {
    return {
      isEnabled: this.isEnabled,
    };
  }
}
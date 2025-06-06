/* istanbul ignore file */
import keychainify from './keychainify';

type Props = { process: Process; init: () => void };

type Process = {
  init: () => void;
  initialized: boolean;
  observer: MutationObserver | null;
  observerConfig: {
    attributes: boolean;
    childList: boolean;
    subtree: boolean;
    characterData: boolean;
  };
  observerTimer?: number;
  initObserver: () => void;
  checkAnchors: () => void;
};

let contentScript: Props = {
  init: function () {
    contentScript.process.init();
  },

  /**
   * This contains the logic for actually processing the content on the page
   */
  process: {
    initialized: false,
    observer: null,
    observerConfig: {
      attributes: false,
      childList: true,
      subtree: true,
      characterData: false,
    },
    observerTimer: undefined,

    /**
     * Initializing the MutationObserver to support pages with lazy-loading.
     * Dynamically reacts to page change instead of regular polling.
     */
    initObserver: function () {
      let body = document.body;

      keychainify.isKeychainifyEnabled().then((enabled) => {
        if (!enabled) {
          return;
        }
        // Using a MutationObserver to wait for a DOM change
        // This is to scan dynamically loaded content (lazyload of comments for example)
        contentScript.process.observer = new MutationObserver(
          (function (process) {
            return function (mutations: MutationRecord[]) {
              mutations.forEach(function () {
                // Preventing multiple calls to checkAnchors()
                if (process.observerTimer) {
                  window.clearTimeout(process.observerTimer);
                }

                // Lets wait for a DOM change
                process.observerTimer = window.setTimeout(function () {
                  process.checkAnchors();
                }, 500);
              });
            };
          })(contentScript.process),
        );

        // Waiting for the DOM to be modified (lazy loading)
        contentScript.process.observer.observe(
          body,
          contentScript.process.observerConfig,
        );
      });
    },

    /**
     * Verify all anchors to find Keychain links
     */
    checkAnchors: function () {
      let anchors: NodeListOf<HTMLAnchorElement> = document.querySelectorAll(
        'a[href]:not(.keychainify-checked)',
      );

      for (let i = 0; i < anchors.length; i++) {
        let anchor = anchors[i];

        if (
          anchor.href &&
          !anchor.classList.contains('keychainify-checked') && // That was not checked before
          keychainify.isUrlSupported(anchor.href)
        ) {
          anchor.addEventListener('click', async function (e) {
            e.preventDefault();
            e.stopPropagation();

            keychainify.keychainifyUrl(this.href);

            return false;
          });
        }

        anchor.classList.add('keychainify-checked');
      }
    },

    /**
     * Initialize the scanning process
     */
    init: function () {
      contentScript.process.initObserver();
      contentScript.process.checkAnchors();
    },
  },
};

contentScript.init();

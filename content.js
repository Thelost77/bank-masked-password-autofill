/**
 * Bank Masked Password Autofill for Firefox
 * Seamless hidden input integration for Bitwarden (zero redundant UI)
 */

(function () {
  'use strict';

  if (window.__BMPF_INJECTED__) return;
  window.__BMPF_INJECTED__ = true;

  // --- Deep DOM Helpers ---
  function findInShadow(root, predicate) {
    if (!root) return null;
    if (predicate(root)) return root;

    const children = root.children || [];
    for (let i = 0; i < children.length; i++) {
      const found = findInShadow(children[i], predicate);
      if (found) return found;
    }

    if (root.shadowRoot) {
      const shadowChildren = root.shadowRoot.children || [];
      for (let i = 0; i < shadowChildren.length; i++) {
        const found = findInShadow(shadowChildren[i], predicate);
        if (found) return found;
      }
    }
    return null;
  }

  function findAllInShadow(root, predicate, acc = []) {
    if (!root) return acc;
    if (predicate(root)) acc.push(root);

    const children = root.children || [];
    for (let i = 0; i < children.length; i++) {
      findAllInShadow(children[i], predicate, acc);
    }

    if (root.shadowRoot) {
      const shadowChildren = root.shadowRoot.children || [];
      for (let i = 0; i < shadowChildren.length; i++) {
        findAllInShadow(shadowChildren[i], predicate, acc);
      }
    }
    return acc;
  }

  function setNativeValue(element, value) {
    const proto = Object.getPrototypeOf(element);
    const descriptor = Object.getOwnPropertyDescriptor(proto, 'value') ||
                       Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
    if (descriptor && descriptor.set) {
      descriptor.set.call(element, value);
    } else {
      element.value = value;
    }
  }

  function fillInputWithEvents(input, value) {
    input.focus();
    setNativeValue(input, value);

    // Support ING Lion Web Components (@lion/ui / ing-input)
    if (input.parentElement && 'modelValue' in input.parentElement) {
      try {
        input.parentElement.modelValue = value;
      } catch (_) {}
    }

    // Dispatch standard framework events
    input.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    input.dispatchEvent(new Event('keyup', { bubbles: true, cancelable: true }));
    input.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
    input.dispatchEvent(new CustomEvent('model-value-changed', { bubbles: true, cancelable: true, detail: { value } }));
  }

  // --- Bank Adapters ---
  const INGAdapter = {
    name: 'ING Bank Śląski',

    isApplicable() {
      return window.location.hostname.includes('ingbank.pl');
    },

    getMaskedInputs() {
      const inputs = findAllInShadow(document.body, el => {
        if (el.tagName !== 'INPUT') return false;
        if (el.id === 'bmpf-hidden-password') return false;
        const name = el.getAttribute('name') || '';
        return /^pin-\d+$/.test(name);
      });

      return inputs.map(el => {
        const match = el.getAttribute('name').match(/^pin-(\d+)$/);
        return {
          index: parseInt(match[1], 10), // 1-based index (pin-1 -> 1)
          input: el,
          active: !el.disabled
        };
      }).sort((a, b) => a.index - b.index);
    },

    getMaxRequiredLength() {
      const active = this.getMaskedInputs().filter(i => i.active);
      if (active.length === 0) return 0;
      return Math.max(...active.map(i => i.index)); // 1-based index equals required string length
    },

    fill(password) {
      const items = this.getMaskedInputs();
      if (items.length === 0) return { success: false, count: 0, reason: 'No masked inputs found' };

      const activeItems = items.filter(i => i.active);
      if (activeItems.length === 0) return { success: false, count: 0, reason: 'No active inputs' };

      const maxRequired = Math.max(...activeItems.map(i => i.index));
      if (password.length < maxRequired) {
        return {
          success: false,
          count: 0,
          pending: true,
          reason: `Password length (${password.length}) is less than highest required index (${maxRequired})`
        };
      }

      const chars = password.split('');
      let count = 0;
      for (const item of activeItems) {
        const charIdx = item.index - 1; // 0-based
        if (charIdx < chars.length) {
          fillInputWithEvents(item.input, chars[charIdx]);
          count++;
        }
      }

      return { success: true, count, totalActive: activeItems.length };
    }
  };

  const PekaoAdapter = {
    name: 'Bank Pekao SA',

    isApplicable() {
      return window.location.hostname.includes('pekao24.pl');
    },

    getMaskedInputs() {
      const inputs = findAllInShadow(document.body, el => {
        if (el.tagName !== 'INPUT') return false;
        if (el.type !== 'password') return false;
        if (el.id === 'bmpf-hidden-password') return false;
        return true;
      });

      return inputs.map((el, domOrderIndex) => {
        let index = null;
        const idMatch = (el.id || '').match(/-(\d+)$/);
        if (idMatch) {
          index = parseInt(idMatch[1], 10);
        } else {
          const ariaMatch = (el.getAttribute('aria-label') || '').match(/(\d+)/);
          if (ariaMatch) {
            index = parseInt(ariaMatch[1], 10) - 1;
          } else {
            index = domOrderIndex;
          }
        }
        return {
          index, // 0-based index
          input: el,
          active: !el.disabled && !el.readOnly
        };
      }).sort((a, b) => a.index - b.index);
    },

    getMaxRequiredLength() {
      const active = this.getMaskedInputs().filter(i => i.active);
      if (active.length === 0) return 0;
      return Math.max(...active.map(i => i.index)) + 1; // 0-based index + 1
    },

    fill(password) {
      const items = this.getMaskedInputs();
      if (items.length === 0) return { success: false, count: 0, reason: 'No masked inputs found' };

      const activeItems = items.filter(i => i.active);
      if (activeItems.length === 0) return { success: false, count: 0, reason: 'No active inputs' };

      const maxRequired = Math.max(...activeItems.map(i => i.index)) + 1;
      if (password.length < maxRequired) {
        return {
          success: false,
          count: 0,
          pending: true,
          reason: `Password length (${password.length}) is less than highest required index (${maxRequired})`
        };
      }

      const chars = password.split('');
      let count = 0;
      for (const item of activeItems) {
        if (item.index < chars.length) {
          fillInputWithEvents(item.input, chars[item.index]);
          count++;
        }
      }

      return { success: true, count, totalActive: activeItems.length };
    }
  };

  const adapter = [INGAdapter, PekaoAdapter].find(a => a.isApplicable());
  if (!adapter) return;

  // --- Hidden Input Manager ---
  let hiddenForm = null;
  let hiddenInput = null;
  let debounceTimer = null;
  let isProcessing = false;

  function processPassword() {
    if (!hiddenInput || isProcessing) return;

    const val = hiddenInput.value;
    if (!val) return;

    const maxRequired = adapter.getMaxRequiredLength();
    if (val.length < maxRequired) {
      console.log(`[BMPF] Waiting for full password (have ${val.length} chars, need at least ${maxRequired})...`);
      return;
    }

    isProcessing = true;
    console.log(`[BMPF] Processing password of length ${val.length} for ${adapter.name}...`);

    const result = adapter.fill(val);
    if (result.success) {
      console.log(`[BMPF] ✓ Successfully filled ${result.count}/${result.totalActive} masked password slots!`);
      // Wipe after brief settle period so autofill extensions don't see an abrupt mid-stream wipe
      setTimeout(() => {
        if (hiddenInput) hiddenInput.value = '';
        isProcessing = false;
      }, 700);
    } else {
      console.warn(`[BMPF] Fill pending or failed:`, result.reason);
      isProcessing = false;
    }
  }

  function scheduleProcessPassword(delayMs = 400) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      processPassword();
    }, delayMs);
  }

  function ensureHiddenInput() {
    const masked = adapter.getMaskedInputs();
    const hasActiveMask = masked.length > 0 && masked.some(m => m.active);

    if (!hasActiveMask) {
      if (hiddenForm && hiddenForm.parentNode) {
        hiddenForm.remove();
        hiddenForm = null;
        hiddenInput = null;
      }
      return;
    }

    if (!hiddenInput || !hiddenInput.isConnected) {
      hiddenForm = document.createElement('form');
      hiddenForm.id = 'bmpf-hidden-form';
      hiddenForm.autocomplete = 'on';
      hiddenForm.style.cssText = [
        'position: fixed',
        'top: 60px',
        'right: 20px',
        'width: 60px',
        'height: 35px',
        'margin: 0',
        'padding: 0',
        'border: none',
        'background: transparent',
        'z-index: 2147483647',
        'pointer-events: auto'
      ].join(';');

      // Optional hidden username field to help Bitwarden pair username + password correctly
      const hiddenUser = document.createElement('input');
      hiddenUser.type = 'text';
      hiddenUser.name = 'username';
      hiddenUser.autocomplete = 'username';
      hiddenUser.tabIndex = -1;
      hiddenUser.setAttribute('aria-hidden', 'true');
      hiddenUser.style.cssText = 'position: absolute; opacity: 0; width: 0; height: 0; pointer-events: none; border: none;';
      hiddenForm.appendChild(hiddenUser);

      hiddenInput = document.createElement('input');
      hiddenInput.type = 'password';
      hiddenInput.id = 'bmpf-hidden-password';
      hiddenInput.name = 'password';
      hiddenInput.autocomplete = 'current-password';
      hiddenInput.placeholder = 'Bitwarden autofill';

      // Bitwarden checks: width>=10, height>=10, opacity>=0.1, display!=none, visibility!=hidden.
      // Transparent styling: completely invisible to user, 100% visible & fillable to Bitwarden.
      hiddenInput.style.cssText = [
        'width: 100%',
        'height: 100%',
        'opacity: 1',
        'background: transparent !important',
        'color: transparent !important',
        'border: none !important',
        'outline: none !important',
        'caret-color: transparent !important',
        'box-shadow: none !important',
        'cursor: default'
      ].join(';');

      hiddenForm.appendChild(hiddenInput);

      // On input: debounce to let Bitwarden finish streaming/typing full string
      hiddenInput.addEventListener('input', () => scheduleProcessPassword(400));
      // On change/blur: user or extension finished, flush immediately
      hiddenInput.addEventListener('change', () => processPassword());
      hiddenInput.addEventListener('blur', () => processPassword());
      hiddenInput.addEventListener('paste', () => scheduleProcessPassword(50));

      hiddenForm.addEventListener('submit', (e) => {
        e.preventDefault();
        processPassword();
      });

      // Periodic check in case extension updates .value directly without standard DOM events
      let lastVal = '';
      const checkInterval = setInterval(() => {
        if (!hiddenInput || !hiddenInput.isConnected) {
          clearInterval(checkInterval);
          return;
        }
        if (hiddenInput.value && hiddenInput.value !== lastVal) {
          lastVal = hiddenInput.value;
          scheduleProcessPassword(350);
        }
      }, 200);

      document.body.appendChild(hiddenForm);

      // Place over the active masked input container for natural click targeting
      const firstActive = masked.find(m => m.active);
      if (firstActive && firstActive.input) {
        try {
          const rect = firstActive.input.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            hiddenForm.style.top = `${Math.max(10, rect.top)}px`;
            hiddenForm.style.left = `${Math.max(10, rect.left)}px`;
            hiddenForm.style.width = `${Math.max(40, rect.width)}px`;
            hiddenForm.style.height = `${Math.max(30, rect.height)}px`;
          }
        } catch (_) {}
      }

      // Automatically focus hidden input so Ctrl+Shift+L immediately targets it
      hiddenInput.focus();
      console.log(`[BMPF] Active masked inputs detected on ${adapter.name}. Ready for Bitwarden autofill.`);
    }
  }

  // Continuously monitor DOM for step transitions
  setInterval(ensureHiddenInput, 400);

})();

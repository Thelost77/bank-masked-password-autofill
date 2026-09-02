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
    // Frameworks (Lit, Angular) listen primarily to 'input', 'keyup', and 'change'
    input.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    input.dispatchEvent(new Event('keyup', { bubbles: true, cancelable: true }));
    input.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
  }

  // --- Bank Adapters ---
  const INGAdapter = {
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

    fill(password) {
      const items = this.getMaskedInputs();
      if (items.length === 0) return 0;

      const chars = password.split('');
      let count = 0;
      for (const item of items) {
        if (!item.active) continue;
        const charIdx = item.index - 1; // 0-based
        if (charIdx < chars.length) {
          fillInputWithEvents(item.input, chars[charIdx]);
          count++;
        }
      }
      return count;
    }
  };

  const PekaoAdapter = {
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

    fill(password) {
      const items = this.getMaskedInputs();
      if (items.length === 0) return 0;

      const chars = password.split('');
      let count = 0;
      for (const item of items) {
        if (!item.active) continue;
        if (item.index < chars.length) {
          fillInputWithEvents(item.input, chars[item.index]);
          count++;
        }
      }
      return count;
    }
  };

  const adapter = [INGAdapter, PekaoAdapter].find(a => a.isApplicable());
  if (!adapter) return;

  // --- Hidden Input Manager ---
  let hiddenInput = null;
  let isFilling = false;

  function ensureHiddenInput() {
    const masked = adapter.getMaskedInputs();
    const hasActiveMask = masked.length > 0 && masked.some(m => m.active);

    if (!hasActiveMask) {
      if (hiddenInput && hiddenInput.parentNode) {
        hiddenInput.remove();
        hiddenInput = null;
      }
      return;
    }

    if (!hiddenInput || !hiddenInput.isConnected) {
      hiddenInput = document.createElement('input');
      hiddenInput.type = 'password';
      hiddenInput.id = 'bmpf-hidden-password';
      hiddenInput.name = 'password';
      hiddenInput.autocomplete = 'current-password';

      // Bitwarden checks: width>=10, height>=10, opacity>=0.1, display!=none, visibility!=hidden.
      // Transparent styling: completely invisible to the user, but 100% visible & fillable to Bitwarden.
      hiddenInput.style.cssText = [
        'position: fixed',
        'top: 60px',
        'right: 20px',
        'width: 60px',
        'height: 35px',
        'opacity: 1',
        'background: transparent !important',
        'color: transparent !important',
        'border: none !important',
        'outline: none !important',
        'caret-color: transparent !important',
        'box-shadow: none !important',
        'z-index: 2147483647',
        'cursor: default'
      ].join(';');

      const onPasswordInput = () => {
        if (isFilling) return;
        const val = hiddenInput.value;
        if (!val) return;

        isFilling = true;
        console.log('[BMPF] Intercepted password autofill, updating masked fields...');

        const filledCount = adapter.fill(val);
        console.log(`[BMPF] Successfully filled ${filledCount} characters.`);

        // Wipe proxy password immediately
        hiddenInput.value = '';

        setTimeout(() => {
          isFilling = false;
        }, 400);
      };

      hiddenInput.addEventListener('input', onPasswordInput);
      hiddenInput.addEventListener('change', onPasswordInput);
      hiddenInput.addEventListener('paste', () => setTimeout(onPasswordInput, 10));

      // Periodic check to capture extensions that update .value without DOM events
      let lastVal = '';
      const checkInterval = setInterval(() => {
        if (!hiddenInput || !hiddenInput.isConnected) {
          clearInterval(checkInterval);
          return;
        }
        if (hiddenInput.value && hiddenInput.value !== lastVal) {
          lastVal = hiddenInput.value;
          onPasswordInput();
        }
      }, 250);

      document.body.appendChild(hiddenInput);

      // Place over the masked input area if possible
      const firstActive = masked.find(m => m.active);
      if (firstActive && firstActive.input) {
        try {
          const rect = firstActive.input.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            hiddenInput.style.top = `${Math.max(10, rect.top)}px`;
            hiddenInput.style.left = `${Math.max(10, rect.left)}px`;
            hiddenInput.style.width = `${Math.max(40, rect.width)}px`;
            hiddenInput.style.height = `${Math.max(30, rect.height)}px`;
          }
        } catch (_) {}
      }

      // Automatically focus the hidden input so pressing Ctrl+Shift+L immediately targets it
      hiddenInput.focus();
    }
  }

  // Continuously monitor DOM for step transitions
  setInterval(ensureHiddenInput, 400);

})();

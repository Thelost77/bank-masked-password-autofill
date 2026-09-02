/**
 * Bank Masked Password Autofill for Firefox
 * Supports ING Bank Śląski & Bank Pekao SA
 */

(function () {
  'use strict';

  // Prevent multiple injections
  if (window.__BMPF_INJECTED__) return;
  window.__BMPF_INJECTED__ = true;

  // --- Utility Functions ---

  /**
   * Deep recursive search piercing open shadow roots.
   */
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

  /**
   * Deep recursive collection piercing open shadow roots.
   */
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

  /**
   * Sets value on input using native HTMLInputElement descriptor
   * so Lit, Angular, and React internal trackers register the change.
   */
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

  /**
   * Dispatches input/keyboard/change events on an input to satisfy framework listeners.
   */
  function fillInputWithEvents(input, value) {
    input.focus();
    setNativeValue(input, value);
    const eventTypes = ['input', 'keydown', 'keypress', 'keyup', 'change', 'blur'];
    for (const type of eventTypes) {
      input.dispatchEvent(new Event(type, { bubbles: true, cancelable: true }));
    }
  }

  // --- Bank Adapters ---

  const INGAdapter = {
    name: 'ING Bank Śląski',
    id: 'ing',
    accentColor: '#ff6200',

    isApplicable() {
      return window.location.hostname.includes('ingbank.pl');
    },

    getLoginInput() {
      return findInShadow(document.body, el => {
        return el.tagName === 'INPUT' && (
          el.name === 'login' ||
          el.getAttribute('slot') === 'input' && el.id && el.id.includes('input')
        );
      });
    },

    getLoginSubmitButton() {
      return findInShadow(document.body, el => {
        const tag = el.tagName.toLowerCase();
        const role = el.getAttribute('role');
        const text = (el.textContent || '').trim();
        return (tag === 'ing-button' || tag === 'button') &&
               (role === 'button' || tag === 'button') &&
               (text === 'Dalej' || text.includes('Dalej'));
      });
    },

    getMaskedPasswordInputs() {
      const inputs = findAllInShadow(document.body, el => {
        if (el.tagName !== 'INPUT') return false;
        if (el.closest && el.closest('#bmpf-widget')) return false;
        const name = el.getAttribute('name') || '';
        return /^pin-\d+$/.test(name);
      });

      return inputs.map(el => {
        const match = el.getAttribute('name').match(/^pin-(\d+)$/);
        const index = parseInt(match[1], 10); // 1-based index
        return {
          index, // 1-based: pin-1 corresponds to password[0]
          input: el,
          active: !el.disabled
        };
      }).sort((a, b) => a.index - b.index);
    },

    fillMaskedPassword(password) {
      const items = this.getMaskedPasswordInputs();
      if (items.length === 0) return { success: false, filledCount: 0, reason: 'Brak pól hasła na stronie' };

      const passwordChars = password.split('');
      let filledCount = 0;

      for (const item of items) {
        if (!item.active) continue;
        const charIdx = item.index - 1; // 0-based
        if (charIdx < passwordChars.length) {
          fillInputWithEvents(item.input, passwordChars[charIdx]);
          filledCount++;
        }
      }

      return {
        success: filledCount > 0,
        filledCount,
        totalActive: items.filter(i => i.active).length
      };
    },

    getPasswordSubmitButton() {
      return findInShadow(document.body, el => {
        const tag = el.tagName.toLowerCase();
        const role = el.getAttribute('role');
        const text = (el.textContent || '').trim();
        return (tag === 'ing-button' || tag === 'button') &&
               (role === 'button' || tag === 'button') &&
               (text === 'Zaloguj' || text.includes('Zaloguj') || text.includes('Dalej'));
      });
    }
  };

  const PekaoAdapter = {
    name: 'Bank Pekao SA',
    id: 'pekao',
    accentColor: '#c6161d',

    isApplicable() {
      return window.location.hostname.includes('pekao24.pl');
    },

    getLoginInput() {
      return findInShadow(document.body, el => {
        if (el.tagName !== 'INPUT') return false;
        return el.id === 'customer' ||
               el.getAttribute('formcontrolname') === 'customer' ||
               (el.className && typeof el.className === 'string' && el.className.includes('input-user'));
      });
    },

    getLoginSubmitButton() {
      return findInShadow(document.body, el => {
        if (el.tagName !== 'BUTTON') return false;
        const classes = [...el.classList];
        const text = (el.textContent || '').trim();
        return classes.includes('button-primary') || text === 'Dalej' || text.includes('Dalej');
      });
    },

    getMaskedPasswordInputs() {
      const inputs = findAllInShadow(document.body, el => {
        if (el.tagName !== 'INPUT') return false;
        if (el.type !== 'password') return false;
        if (el.closest && el.closest('#bmpf-widget')) return false;
        return true;
      });

      return inputs.map((el, domOrderIndex) => {
        let index = null;
        // 1. Check ID for trailing numeric index: id ends with -<number>
        const idMatch = (el.id || '').match(/-(\d+)$/);
        if (idMatch) {
          index = parseInt(idMatch[1], 10);
        } else {
          // 2. Check aria-label for digit: e.g. "Znak 3"
          const ariaMatch = (el.getAttribute('aria-label') || '').match(/(\d+)/);
          if (ariaMatch) {
            index = parseInt(ariaMatch[1], 10) - 1; // 1-based to 0-based
          } else {
            // 3. Fallback to DOM order
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

    fillMaskedPassword(password) {
      const items = this.getMaskedPasswordInputs();
      if (items.length === 0) return { success: false, filledCount: 0, reason: 'Brak pól hasła na stronie' };

      const passwordChars = password.split('');
      let filledCount = 0;

      for (const item of items) {
        if (!item.active) continue;
        if (item.index < passwordChars.length) {
          fillInputWithEvents(item.input, passwordChars[item.index]);
          filledCount++;
        }
      }

      return {
        success: filledCount > 0,
        filledCount,
        totalActive: items.filter(i => i.active).length
      };
    },

    getPasswordSubmitButton() {
      return findInShadow(document.body, el => {
        if (el.tagName !== 'BUTTON') return false;
        const classes = [...el.classList];
        const text = (el.textContent || '').trim();
        return classes.includes('button-primary') ||
               text === 'Zaloguj' || text.includes('Zaloguj') || text.includes('Dalej');
      });
    }
  };

  // Determine current adapter
  const adapters = [INGAdapter, PekaoAdapter];
  const currentAdapter = adapters.find(a => a.isApplicable());

  if (!currentAdapter) {
    console.log('[BMPF] No supported bank detected on this host.');
    return;
  }

  // --- Settings Management ---
  const settings = {
    autoFill: true,
    autoSubmit: false,
    isCollapsed: false
  };

  const storageApi = (typeof browser !== 'undefined' && browser.storage) ? browser.storage.local :
                     (typeof chrome !== 'undefined' && chrome.storage) ? chrome.storage.local : null;

  function loadSettings(callback) {
    if (storageApi && storageApi.get) {
      storageApi.get(['bmpf_autoFill', 'bmpf_autoSubmit', 'bmpf_isCollapsed'], (res) => {
        if (res) {
          if (res.bmpf_autoFill !== undefined) settings.autoFill = res.bmpf_autoFill;
          if (res.bmpf_autoSubmit !== undefined) settings.autoSubmit = res.bmpf_autoSubmit;
          if (res.bmpf_isCollapsed !== undefined) settings.isCollapsed = res.bmpf_isCollapsed;
        }
        callback();
      });
    } else {
      callback();
    }
  }

  function saveSettings() {
    if (storageApi && storageApi.set) {
      storageApi.set({
        bmpf_autoFill: settings.autoFill,
        bmpf_autoSubmit: settings.autoSubmit,
        bmpf_isCollapsed: settings.isCollapsed
      });
    }
  }

  // --- UI Widget Construction ---

  function createWidget() {
    if (document.getElementById('bmpf-widget')) return;

    const widget = document.createElement('aside');
    widget.id = 'bmpf-widget';
    widget.setAttribute('aria-label', 'Pomocnik logowania maskowanego');
    widget.style.setProperty('--bmpf-accent-color', currentAdapter.accentColor);

    widget.innerHTML = `
      <div id="bmpf-handle" title="Rozwiń / zwiń panel Bitwarden">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
        </svg>
        <span id="bmpf-handle-title">Bitwarden</span>
      </div>
      <div id="bmpf-panel">
        <header id="bmpf-header">
          <div class="bmpf-bank-badge">
            <span class="bmpf-bank-dot"></span>
            <strong>${currentAdapter.name}</strong>
          </div>
          <button type="button" id="bmpf-btn-close" aria-label="Zwiń" title="Zwiń">✕</button>
        </header>

        <form id="bmpf-form" autocomplete="on">
          <div class="bmpf-field">
            <div class="bmpf-label-row">
              <label for="bmpf-input-username">Login / Identyfikator</label>
              <span class="bmpf-hint">dla Bitwardena</span>
            </div>
            <div class="bmpf-input-wrapper">
              <input
                id="bmpf-input-username"
                name="username"
                type="text"
                autocomplete="username"
                placeholder="Wpisz lub wypełnij z Bitwardena"
              />
              <button type="button" id="bmpf-btn-fill-login" class="bmpf-btn-inline" title="Wstaw do formularza banku">Wstaw</button>
            </div>
          </div>

          <div class="bmpf-field">
            <div class="bmpf-label-row">
              <label for="bmpf-input-password">Pełne hasło</label>
              <span class="bmpf-hint">wkleja Bitwarden</span>
            </div>
            <div class="bmpf-input-wrapper">
              <input
                id="bmpf-input-password"
                name="password"
                type="password"
                autocomplete="current-password"
                placeholder="Wklej pełne hasło (Ctrl+Shift+L)"
              />
              <button type="button" id="bmpf-btn-eye" class="bmpf-btn-icon" title="Pokaż / Ukryj hasło">👁</button>
              <button type="button" id="bmpf-btn-fill-password" class="bmpf-btn-inline" title="Rozbij i uzupełnij pola maskowane">Wypełnij</button>
            </div>
          </div>

          <div class="bmpf-options">
            <label class="bmpf-checkbox-label">
              <input type="checkbox" id="bmpf-chk-autofill" ${settings.autoFill ? 'checked' : ''} />
              <span>Automatycznie rozbijaj hasło po uzupełnieniu</span>
            </label>
            <label class="bmpf-checkbox-label">
              <input type="checkbox" id="bmpf-chk-autosubmit" ${settings.autoSubmit ? 'checked' : ''} />
              <span>Automatycznie klikaj Dalej / Zaloguj</span>
            </label>
          </div>

          <div id="bmpf-status" class="bmpf-status">
            <span id="bmpf-status-icon">●</span>
            <span id="bmpf-status-text">Gotowy</span>
          </div>

          <div class="bmpf-actions">
            <button type="button" id="bmpf-btn-clear" class="bmpf-btn-secondary">Wyczyść pola pomocnika</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(widget);

    // Bind DOM events
    setupWidgetEvents(widget);
  }

  function setStatus(text, type = 'normal') {
    const statusEl = document.getElementById('bmpf-status');
    const textEl = document.getElementById('bmpf-status-text');
    const iconEl = document.getElementById('bmpf-status-icon');
    if (!statusEl || !textEl || !iconEl) return;

    statusEl.className = 'bmpf-status bmpf-status-' + type;
    textEl.textContent = text;
    if (type === 'success') iconEl.textContent = '✓';
    else if (type === 'error') iconEl.textContent = '⚠';
    else iconEl.textContent = '●';
  }

  function setupWidgetEvents(widget) {
    const handle = document.getElementById('bmpf-handle');
    const btnClose = document.getElementById('bmpf-btn-close');
    const inputUsername = document.getElementById('bmpf-input-username');
    const inputPassword = document.getElementById('bmpf-input-password');
    const btnFillLogin = document.getElementById('bmpf-btn-fill-login');
    const btnFillPassword = document.getElementById('bmpf-btn-fill-password');
    const btnEye = document.getElementById('bmpf-btn-eye');
    const btnClear = document.getElementById('bmpf-btn-clear');
    const chkAutoFill = document.getElementById('bmpf-chk-autofill');
    const chkAutoSubmit = document.getElementById('bmpf-chk-autosubmit');

    // Initial collapse state
    if (settings.isCollapsed) {
      widget.classList.add('bmpf-collapsed');
    }

    const toggleCollapse = () => {
      widget.classList.toggle('bmpf-collapsed');
      settings.isCollapsed = widget.classList.contains('bmpf-collapsed');
      saveSettings();
    };

    handle.addEventListener('click', toggleCollapse);
    btnClose.addEventListener('click', toggleCollapse);

    chkAutoFill.addEventListener('change', () => {
      settings.autoFill = chkAutoFill.checked;
      saveSettings();
    });

    chkAutoSubmit.addEventListener('change', () => {
      settings.autoSubmit = chkAutoSubmit.checked;
      saveSettings();
    });

    btnEye.addEventListener('click', () => {
      if (inputPassword.type === 'password') {
        inputPassword.type = 'text';
        btnEye.textContent = '🔒';
      } else {
        inputPassword.type = 'password';
        btnEye.textContent = '👁';
      }
    });

    btnClear.addEventListener('click', () => {
      inputUsername.value = '';
      inputPassword.value = '';
      setStatus('Pola pomocnika wyczyszczone.', 'normal');
    });

    // Fill login action
    const handleLoginFill = () => {
      const val = inputUsername.value.trim();
      if (!val) {
        setStatus('Wpisz login w polu pomocnika.', 'error');
        return;
      }
      const bankLoginInput = currentAdapter.getLoginInput();
      if (bankLoginInput) {
        fillInputWithEvents(bankLoginInput, val);
        setStatus('Wstawiono login do banku!', 'success');

        if (settings.autoSubmit) {
          setTimeout(() => {
            const nextBtn = currentAdapter.getLoginSubmitButton();
            if (nextBtn) nextBtn.click();
          }, 250);
        }
      } else {
        setStatus('Nie znaleziono pola loginu na stronie.', 'error');
      }
    };

    btnFillLogin.addEventListener('click', handleLoginFill);

    // Fill password action
    const handlePasswordFill = () => {
      const fullPassword = inputPassword.value;
      if (!fullPassword) {
        setStatus('Wpisz lub wklej hasło z Bitwardena.', 'error');
        return;
      }

      const res = currentAdapter.fillMaskedPassword(fullPassword);
      if (res.success) {
        setStatus(`Uzupełniono ${res.filledCount} wymaganych znaków!`, 'success');

        if (settings.autoSubmit) {
          setTimeout(() => {
            const submitBtn = currentAdapter.getPasswordSubmitButton();
            if (submitBtn) submitBtn.click();
          }, 300);
        }

        // Secure wipe of proxy password input after brief visual confirmation
        setTimeout(() => {
          inputPassword.value = '';
          if (widget.classList.contains('bmpf-collapsed') === false) {
            // keep subtle indicator
            setStatus('Hasło wstawione (pole wyczyszczone dla bezpieczeństwa)', 'success');
          }
        }, 1200);
      } else {
        setStatus(res.reason || 'Nie udało się dopasować pól hasła.', 'error');
      }
    };

    btnFillPassword.addEventListener('click', handlePasswordFill);

    // Intercept Bitwarden autofill & typing on password input
    let lastPasswordVal = '';
    const onPasswordChanged = () => {
      const currentVal = inputPassword.value;
      if (currentVal && currentVal !== lastPasswordVal) {
        lastPasswordVal = currentVal;
        if (settings.autoFill) {
          // Check if masked password inputs are currently present on the page
          const maskedInputs = currentAdapter.getMaskedPasswordInputs();
          if (maskedInputs.length > 0 && maskedInputs.some(i => i.active)) {
            handlePasswordFill();
          } else {
            setStatus('Hasło wprowadzone. Oczekiwanie na krok hasła w banku.', 'normal');
          }
        }
      }
    };

    inputPassword.addEventListener('input', onPasswordChanged);
    inputPassword.addEventListener('change', onPasswordChanged);
    inputPassword.addEventListener('paste', () => setTimeout(onPasswordChanged, 50));

    // Also detect username autofill
    let lastUsernameVal = '';
    const onUsernameChanged = () => {
      const currentVal = inputUsername.value;
      if (currentVal && currentVal !== lastUsernameVal) {
        lastUsernameVal = currentVal;
        if (settings.autoFill) {
          const bankLoginInput = currentAdapter.getLoginInput();
          if (bankLoginInput && (!bankLoginInput.value || bankLoginInput.value.length === 0)) {
            handleLoginFill();
          }
        }
      }
    };

    inputUsername.addEventListener('input', onUsernameChanged);
    inputUsername.addEventListener('change', onUsernameChanged);

    // Periodic check to capture extensions like Bitwarden that update .value without firing DOM events
    setInterval(() => {
      if (inputPassword.value && inputPassword.value !== lastPasswordVal) {
        onPasswordChanged();
      }
      if (inputUsername.value && inputUsername.value !== lastUsernameVal) {
        onUsernameChanged();
      }
    }, 400);

    // Intercept form submit to prevent browser reload if user presses Enter
    document.getElementById('bmpf-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const maskedInputs = currentAdapter.getMaskedPasswordInputs();
      if (maskedInputs.length > 0 && maskedInputs.some(i => i.active)) {
        handlePasswordFill();
      } else {
        handleLoginFill();
      }
    });
  }

  // Periodic DOM inspection to update status indicator
  function startPageMonitor() {
    setInterval(() => {
      const statusText = document.getElementById('bmpf-status-text');
      if (!statusText) return;

      const masked = currentAdapter.getMaskedPasswordInputs();
      const activeCount = masked.filter(m => m.active).length;

      if (activeCount > 0) {
        const currentText = statusText.textContent;
        if (!currentText.includes('Uzupełniono') && !currentText.includes('wyczyszczone')) {
          setStatus(`Krok 2: Hasło maskowane (${activeCount} znaków)`, 'normal');
        }
      } else {
        const loginInput = currentAdapter.getLoginInput();
        if (loginInput) {
          const currentText = statusText.textContent;
          if (!currentText.includes('Wstawiono') && !currentText.includes('wyczyszczone')) {
            setStatus('Krok 1: Wpisz login', 'normal');
          }
        }
      }
    }, 1000);
  }

  // Initialize
  loadSettings(() => {
    // Wait for body to be available
    if (document.body) {
      createWidget();
      startPageMonitor();
    } else {
      window.addEventListener('DOMContentLoaded', () => {
        createWidget();
        startPageMonitor();
      });
    }
  });

})();

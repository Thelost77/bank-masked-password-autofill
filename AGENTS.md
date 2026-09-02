# AGENTS.md — Developer & AI Agent Guide

This document defines architecture, conventions, and contracts for maintaining and extending **Bank Masked Password Autofill**.

---

## 1. Core Architecture & Philosophy

* **Zero UI Policy:** The extension must never inject visible HTML buttons, popups, sidebars, or toolbars.
* **Invisible Helper Form:** In Step 2 (masked password), a transparent `<form>` containing `<input type="password" autocomplete="current-password">` is inserted over the first active slot.
* **Bitwarden Visibility Contract:** To be detected and autofilled by Bitwarden:
  * Dimensions must be $\ge 10\text{px} \times 10\text{px}$.
  * `opacity` must be $\ge 0.1$ (we use `opacity: 1` with transparent background, color, border, and caret).
  * `display` must not be `none` and `visibility` must not be `hidden`.
  * Must reside in a valid `<form>` container with an optional hidden username field for credential pairing.

---

## 2. Bank Implementations

### ING Bank Śląski (`login.ingbank.pl`)
* **Framework:** Lit Web Components & ING Lion UI (`@lion/ui`).
* **Input Elements:** Tag `<input slot="input" class="form-control">` enclosed in `<ing-input-masked-password-field>`.
* **Names & Indexing:** `password-0` through `password-31` (0-based indexing: `password-0` corresponds to `password[0]`).
* **Active Status:** Inactive slots have HTML attribute `disabled`. Active slots have `disabled: false`.
* **Value Propagation:**
  1. Use `HTMLInputElement.prototype` property descriptor setter.
  2. If `input.parentElement` has `modelValue`, assign `parentElement.modelValue = char`.
  3. Dispatch standard events: `input`, `keyup`, `change`.
  4. Dispatch custom event: `new CustomEvent('model-value-changed', { bubbles: true, cancelable: true, detail: { value: char } })`.

### Bank Pekao SA (`*.pekao24.pl`)
* **Framework:** Angular Reactive Forms (`@angular/forms`).
* **Input Elements:** 16 password inputs with dynamic IDs: `<uuid>-0` through `<uuid>-15` (0-based indexing).
* **Active Status:** Inactive slots have HTML attribute `disabled`. Active slots have `disabled: false` and class `field-active`.
* **Value Propagation:**
  1. Use native property descriptor setter.
  2. Dispatch standard events: `input`, `keyup`, `change`.

---

## 3. Autofill Timing & Debounce Contracts

* **Streamed Typing / Bitwarden Auto-Type:** Bitwarden and keystroke simulators dispatch sequential `input` events per character.
* **Never Wipe Prematurely:** Do NOT wipe `hiddenInput.value` on the first `input` event.
* **Debounce Accumulator:**
  * Reset a 400ms debounce timer on every `input` event.
  * Flush immediately on `change`, `blur`, or form `submit`.
* **Length Guard:**
  * Calculate highest required index among active slots.
  * If `value.length < highestRequiredIndex + 1`, do NOT execute or clear; wait for subsequent characters.
* **Security Wipe:**
  * Only clear `hiddenInput.value` 700ms *after* all active bank slots have received their characters.

---

## 4. Mozilla AMO & Store Compliance

* `manifest.json` uses **Manifest V3**.
* `data_collection_permissions`: Mandatory for AMO submissions under `browser_specific_settings.gecko`. Must contain `"required": ["none"]`.
* **Permissions:** Keep `"permissions": []`. Do not add permissions unless strictly required.
* **Privacy:** Extension must never make background network calls or analytics requests.

---

## 5. Release & Packaging Workflow

1. Bump `"version"` in [`manifest.json`](manifest.json).
2. Package release:
   ```bash
   zip -r dist/bank-masked-password-autofill.zip manifest.json content.js styles.css icons/ LICENSE README.md PRIVACY.md
   ```
3. Commit and tag:
   ```bash
   git add manifest.json content.js
   git commit -m "chore: release vX.Y.Z"
   git tag vX.Y.Z
   git push origin main --tags
   gh release create vX.Y.Z dist/bank-masked-password-autofill.zip -t "vX.Y.Z" -n "Release notes"
   ```
4. Upload `dist/bank-masked-password-autofill.zip` to [AMO Developer Hub](https://addons.mozilla.org/developers/).

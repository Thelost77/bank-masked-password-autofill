# Bank Masked Password Autofill

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-success.svg)](manifest.json)
[![Browsers](https://img.shields.io/badge/Browsers-Firefox%20%7C%20Chrome%20%7C%20Brave%20%7C%20Edge-orange.svg)](#installation)

A lightweight, **zero-UI browser extension** (Manifest V3) that enables seamless password autofill for banks using masked password inputs (**ING Bank Śląski** and **Bank Pekao SA**) with **Bitwarden**, 1Password, KeePass, or browser password managers.

---

## The Problem

Banks like **ING Bank Śląski** and **Bank Pekao SA** ask for masked passwords during login (e.g. entering only the 2nd, 5th, 8th, 12th characters into individual boxes). Password managers (Bitwarden, 1Password, etc.) cannot natively fill individual fragmented input boxes, forcing users to manually uncover, count characters, or copy-paste into temporary text editors.

## The Solution: Zero-UI Autofill

Instead of adding floating toolbars, intrusive sidebars, or manual copy-paste popups:

1. **Invisible Helper Input:** When you reach the bank's masked password step, the extension inserts a completely transparent `<form>` with `<input type="password" autocomplete="current-password">`.
2. **Native Extension Recognition:** Password managers like Bitwarden recognize standard credentials and offer autofill (e.g., via <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>L</kbd> or autofill menu).
3. **Automated Position Slicing:** When the password manager fills the hidden input, the extension:
   * Inspects the bank's active input slots.
   * Extracts the exact characters corresponding to the required indices.
   * Dispatches framework-specific events (`input`, `change`, `model-value-changed` for Lit/Lion and Angular).
   * Automatically clears the raw password buffer after filling.

---

## Supported Banks

| Bank | Framework | Mechanism |
| :--- | :--- | :--- |
| **ING Bank Śląski** | Lit & Lion Web Components (`@lion/ui`) | Matches `password-0` ... `password-31` in shadow DOM, handles `modelValue` updates. |
| **Bank Pekao SA** | Angular (`@angular/forms`) | Matches `<uuid>-<index>` password inputs, handles Angular reactive form controls. |

---

## Security & Privacy

* **Zero External Communication:** The extension does not make any network requests. No telemetry, no analytics, no external servers.
* **No Elevated Permissions:** Requires zero special browser permissions (`"permissions": []`).
* **Immediate Cleanup:** The raw password entered into the transparent field is wiped from memory as soon as the characters are distributed to the bank's fields.
* **Open Source:** Licensed under the permissive [MIT License](LICENSE).

---

## Installation

### Google Chrome / Brave / Chromium / Microsoft Edge

1. Clone or download this repository:
   ```bash
   git clone https://github.com/Thelost77/bank-masked-password-autofill.git
   ```
2. In your browser, open `chrome://extensions` (or `brave://extensions`, `edge://extensions`).
3. Enable **"Developer mode"** (top-right toggle).
4. Click **"Load unpacked"** (top-left button).
5. Select the cloned repository folder.

### Mozilla Firefox

1. Open Firefox and navigate to:
   ```text
   about:debugging#/runtime/this-firefox
   ```
2. Click **"Load Temporary Add-on..."**.
3. Select the [`manifest.json`](manifest.json) file in this repository.

---

## Usage

1. Open the login page for **ING** (`https://login.ingbank.pl/mojeing/app/#login`) or **Pekao** (`https://www.pekao24.pl/logowanie`).
2. **Step 1:** Enter your username/login as usual and advance to the password screen.
3. **Step 2:** When the masked password boxes appear, press <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>L</kbd> (or click Bitwarden autofill).
4. The requested boxes will populate with password dots immediately. Click **"Zaloguj"** / Log in.

---

## License

This project is licensed under the [MIT License](LICENSE).

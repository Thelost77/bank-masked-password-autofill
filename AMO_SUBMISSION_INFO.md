# Mozilla Add-ons (AMO) Submission Guide & Metadata

Use these exact values when submitting to the **[Firefox Add-ons Developer Hub](https://addons.mozilla.org/developers/)**.

---

### Step 1: Distribution
* **Distribution Option:** Select **"On this site"** (publicly listed in the Firefox Add-ons store).

---

### Step 2: Upload Add-on
* **File to upload:**
  ```text
  /home/thelost/Projekty/bank-masked-password-extension/dist/bank-masked-password-autofill.zip
  ```

---

### Step 3: Source Code
* **Question:** *"Does your add-on have source code that requires compilation or minification?"*
* **Select:** **"No"**
  *(The extension uses pure, unminified vanilla JavaScript and CSS with no build step.)*

---

### Step 4: Listing Information

#### Name
```text
Bank Masked Password Autofill
```

#### Summary (max 250 characters)
```text
Zero-UI Bitwarden autofill for ING Bank Śląski and Bank Pekao SA. Automatically maps and distributes your master password into masked login inputs.
```

#### Description (Markdown supported)
```markdown
A lightweight, zero-UI browser extension that solves the masked password problem for Polish online banking (**ING Bank Śląski** and **Bank Pekao SA**) when using **Bitwarden**, 1Password, or other password managers.

### Features
* **Zero UI:** No redundant toolbars, sidebars, floating popups, or manual copy-pasting.
* **Seamless Bitwarden Integration:** Standard autofill (Ctrl+Shift+L or browser autofill) works directly on the masked password step.
* **Automated Character Slicing:** Dynamically identifies active input slots and fills the required characters from your full password.
* **Lit & Angular Support:** Native event dispatching for ING's Lit/Lion web components and Pekao's Angular reactive forms.

### Security & Privacy
* **100% Local Execution:** No background servers, analytics, telemetry, or external network requests.
* **Zero Permissions:** Requires no elevated browser permissions (`"permissions": []`).
* **Immediate Cleanup:** The temporary input buffer is automatically cleared from memory immediately after the fields are populated.
* **Open Source:** Fully open source under the MIT License: https://github.com/Thelost77/bank-masked-password-autofill
```

#### Categories
* **Primary Category:** `Privacy & Security`
* **Secondary Category:** `Productivity`

#### Tags
```text
bitwarden, ing, pekao, banking, autofill, password
```

#### Support URL
```text
https://github.com/Thelost77/bank-masked-password-autofill/issues
```

#### Homepage URL
```text
https://github.com/Thelost77/bank-masked-password-autofill
```

#### Privacy Policy
```text
Bank Masked Password Autofill does not collect, store, transmit, or share any personal data, credentials, or browsing activity. All character mapping occurs 100% locally in browser memory and is immediately wiped after filling. Full privacy policy: https://github.com/Thelost77/bank-masked-password-autofill/blob/main/PRIVACY.md
```

#### License
* Select **"MIT License"** (or custom license pointing to the MIT License in repo).

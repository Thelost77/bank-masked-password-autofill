# Privacy Policy

**Bank Masked Password Autofill** is committed to protecting your privacy and security.

### 1. Data Collection and Transmission
* **Zero Data Collection:** The extension does **not** collect, store, track, transmit, or share any personal information, usernames, passwords, cookies, IP addresses, or browsing history.
* **No Network Requests:** The extension contains no background network connections, API endpoints, tracking pixels, or external dependencies. All processing is executed 100% locally in the user's browser.

### 2. Password Handling
* When a password manager autofills the helper field, the characters are mapped directly to the bank's active input fields in memory.
* The helper input value is cleared immediately after the characters are distributed.
* Passwords are never saved to disk, local storage, or transmitted anywhere.

### 3. Permissions
* The extension requires **no special permissions** (`"permissions": []`).
* Content scripts only run on the official login domains of the supported banks:
  - `https://login.ingbank.pl/*`
  - `https://*.pekao24.pl/*`

### 4. Contact & Source Code
The source code is open source and licensed under the MIT License:
https://github.com/Thelost77/bank-masked-password-autofill

# Bank Masked Password Autofill (Firefox & Chrome Extension)

Lekkie, uniwersalne rozszerzenie (Manifest V3) do przeglądarek **Firefox**, **Google Chrome**, **Chromium**, **Brave** oraz **Microsoft Edge**, umożliwiające bezproblemowe logowanie do **ING Bank Śląski** oraz **Bank Pekao SA** przy użyciu **Bitwardena** (oraz innych menedżerów haseł).

---

## Jak to działa (Zero UI)

* **Brak zbędnych paneli:** Rozszerzenie nie dodaje żadnych pasków, szuflad ani przycisków.
* **Niewidoczny input dla Bitwardena:** Gdy bank wyświetla formularz hasła maskowanego (krok 2), rozszerzenie dodaje w tle transparentne pole hasła `<input type="password" autocomplete="current-password">`, idealnie widoczne dla silnika autouzupełniania Bitwardena.
* **Automatyczne rozbicie:** W momencie gdy Bitwarden uzupełnia to pole (np. po wciśnięciu <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>L</kbd>), zdarzenie przechwytuje pełne hasło, wylicza aktywne kratki banku, wpisuje w nie odpowiednie znaki, a transparentne pole pomocnika czyści.

---

## Instalacja

### W Google Chrome / Chromium / Brave / Edge:
1. Otwórz stronę zarządzania rozszerzeniami: `chrome://extensions` (w Brave: `brave://extensions`, w Edge: `edge://extensions`).
2. Włącz przełącznik **Tryb dewelopera** (Developer mode) w prawym górnym rogu.
3. Kliknij przycisk **Załaduj rozpakowane** (Load unpacked) w lewym górnym rogu.
4. Wybierz katalog:
   ```text
   /home/thelost/Projekty/bank-masked-password-extension
   ```
5. Rozszerzenie zostanie załadowane i jest od razu aktywne.

### W Firefox:
1. Otwórz stronę: `about:debugging#/runtime/this-firefox`
2. Kliknij **Załaduj dodatek tymczasowy...** (Load Temporary Add-on...).
3. Wybierz plik `manifest.json` z katalogu:
   ```text
   /home/thelost/Projekty/bank-masked-password-extension/manifest.json
   ```

---

## Jak używać

1. Wejdź na stronę logowania:
   - **ING:** `https://login.ingbank.pl/mojeing/app/#login`
   - **Pekao:** `https://www.pekao24.pl/logowanie`
2. **Krok 1 (Login):**
   - Wpisz swój login lub uzupełnij Bitwardenem standardowo i przejdź do kroku hasła ("Dalej").
3. **Krok 2 (Hasło maskowane):**
   - Gdy pojawią się kratki hasła maskowanego, naciśnij skrót Bitwardena: <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>L</kbd> (lub kliknij ikonę Bitwardena na pasku).
   - Aktywne kratki banku natychmiast uzupełnią się odpowiednimi znakami (kropkami).
   - Kliknij "Zaloguj" lub naciśnij Enter.

---

## Pliki rozszerzenia

* [manifest.json](file:///home/thelost/Projekty/bank-masked-password-extension/manifest.json): Uniwersalny manifest Manifest V3 (kompatybilny z Chrome i Firefox).
* [content.js](file:///home/thelost/Projekty/bank-masked-password-extension/content.js): Logika adapterów dla ING oraz Pekao, dynamiczne mapowanie pól i obsługa zdarzeń.
* [styles.css](file:///home/thelost/Projekty/bank-masked-password-extension/styles.css): Minimalne style transparentności.

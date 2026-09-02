# Bank Masked Password Autofill (Firefox Extension)

Lekkie rozszerzenie do przeglądarki Firefox (Manifest V3) umożliwiające natywne logowanie do **ING Bank Śląski** oraz **Bank Pekao SA** przy użyciu **Bitwardena** (zero zbędnego interfejsu).

---

## Jak to działa (Zero UI)

* **Brak zbędnych paneli:** Rozszerzenie nie dodaje żadnych pasków, szuflad ani przycisków.
* **Niewidoczny input dla Bitwardena:** Gdy bank wyświetla formularz hasła maskowanego (krok 2), rozszerzenie dodaje w tle transparentne, standardowe pole `<input type="password" autocomplete="current-password">`, idealnie widoczne dla silnika autouzupełniania Bitwardena.
* **Automatyczne rozbicie:** W momencie gdy Bitwarden uzupełnia to pole (np. po wciśnięciu <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>L</kbd>), zdarzenie `oninput` natychmiast przechwytuje pełne hasło, wylicza aktywne kratki banku, wpisuje w nie odpowiednie znaki, a transparentne pole pomocnika natychmiast czyści.

---

## Jak używać

1. **Instalacja:**
   - Wpisz w Firefox: `about:debugging#/runtime/this-firefox`
   - Kliknij **"Załaduj dodatek tymczasowy..."**
   - Wybierz plik: `/home/thelost/Projekty/bank-masked-password-extension/manifest.json`
2. **Krok 1 (Login):**
   - Wpisz swój login lub wypełnij Bitwardenem standardowo i przejdź do kroku hasła ("Dalej").
3. **Krok 2 (Hasło maskowane):**
   - Gdy pojawią się kratki hasła maskowanego, naciśnij <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>L</kbd> (skrót Bitwardena).
   - Bitwarden wypełni niewidoczne pole, a aktywne kratki banku natychmiast uzupełnią się odpowiednimi znakami.
   - Kliknij "Zaloguj" lub naciśnij Enter.

---

## Pliki rozszerzenia

* [manifest.json](file:///home/thelost/Projekty/bank-masked-password-extension/manifest.json): Konfiguracja rozszerzenia Manifest V3 dla Firefox.
* [content.js](file:///home/thelost/Projekty/bank-masked-password-extension/content.js): Logika adapterów dla ING oraz Pekao, tworzenie niewidocznego pola i obsługa zdarzeń.
* [styles.css](file:///home/thelost/Projekty/bank-masked-password-extension/styles.css): Style transparentności pola hasła.

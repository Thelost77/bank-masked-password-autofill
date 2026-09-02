# Bank Masked Password Autofill (Firefox Extension)

Lekkie rozszerzenie do przeglądarki Firefox (Manifest V3) umożliwiające bezproblemowe logowanie do **ING Bank Śląski** oraz **Bank Pekao SA** przy użyciu menedżerów haseł (np. **Bitwarden**, 1Password, KeePassXC).

---

## Problem i Rozwiązanie

* **Problem:** Banki ING i Pekao wymagają podania hasła maskowanego (np. tylko 2., 5. i 8. znaku). Rozszerzenia menedżerów haseł (jak Bitwarden) nie potrafią obsłużyć rozbitych, zmieniających się dynamicznie kratek.
* **Rozwiązanie:** Rozszerzenie wstrzykuje na stronę banku dyskretny, boczny panel z formularzem logowania zgodnym ze standardami HTML. Bitwarden rozpoznaje go i uzupełnia pełne dane (np. przez skrót `Ctrl+Shift+L`). Rozszerzenie natychmiast przechwytuje hasło, odczytuje które pozycje są wymagane przez bank, rozbija hasło na znaki, wstawia je w aktywne kratki banku i bezzwłocznie czyści pole pomocnika dla bezpieczeństwa.

---

## Obsługiwane banki

1. **Moje ING** (`https://login.ingbank.pl/*`):
   - Obsługa komponentów Web Components i Shadow DOM (`ming-layout`, `ing-input`, `ing-button`).
   - Mapowanie kratek `pin-1`, `pin-2`, ... na znaki hasła.
2. **Pekao24** (`https://*.pekao24.pl/*`):
   - Obsługa pól Angular (`#customer` oraz kratki hasła maskowanego).
   - Dynamiczne wykrywanie aktywnych i zablokowanych pozycji.

---

## Instalacja w Firefox

1. Otwórz przeglądarkę Firefox.
2. W pasku adresu wpisz: `about:debugging#/runtime/this-firefox` i naciśnij Enter.
3. W sekcji **Tymczasowe dodatki** (Temporary Extensions) kliknij przycisk **Załaduj dodatek tymczasowy...** (Load Temporary Add-on...).
4. W oknie wyboru pliku wskaż plik `manifest.json` z tego katalogu:
   `/home/thelost/Projekty/bank-masked-password-extension/manifest.json`
5. Dodatek zostanie natychmiast załadowany i aktywny na stronach ING oraz Pekao.

---

## Jak korzystać z Bitwardenem

1. Wejdź na stronę logowania banku:
   - **ING:** `https://login.ingbank.pl/mojeing/app/#login`
   - **Pekao:** `https://www.pekao24.pl/logowanie`
2. Na prawej krawędzi ekranu zobaczysz pasek pomocnika z logo kłódki i nazwą banku.
3. Użyj Bitwardena w standardowy sposób:
   - Naciśnij skrót **`Ctrl + Shift + L`** (domyślny skrót autouzupełniania w Bitwarden) lub kliknij ikonę Bitwardena na pasku i wybierz swój wpis.
4. **Krok 1 (Login):**
   - Bitwarden uzupełni login w pomocniku, a ten wstawi go do pola logowania banku.
5. **Krok 2 (Hasło maskowane):**
   - Gdy bank wyświetli kratki hasła maskowanego, naciśnij ponownie `Ctrl + Shift + L` (lub wklej hasło w pole pomocnika).
   - Rozszerzenie automatycznie odczyta aktywne pola maskowane banku i wstawi w nie odpowiednie znaki.
   - Po 1 sekundzie pole hasła w pomocniku zostaje automatycznie wyczyszczone.

---

## Opcje konfiguracyjne w panelu

* **Automatycznie rozbijaj hasło po uzupełnieniu:** włączone domyślnie – natychmiast po uzupełnieniu przez Bitwarden przepisuje znaki do banku.
* **Automatycznie klikaj Dalej / Zaloguj:** opcjonalne – automatycznie zatwierdza formularz po wstawieniu danych.
* **Pokaż / Ukryj (ikona oka):** pozwala podejrzeć wpisane hasło przed wysłaniem.
* **Wyczyść pola pomocnika:** ręczne wyczyszczenie danych z pól pomocnika.

---

## Bezpieczeństwo

* **Brak połączeń sieciowych:** Rozszerzenie nie wysyła żadnych danych do sieci i nie zawiera zewnętrznych bibliotek (czysty JavaScript/CSS).
* **Czyszczenie pamięci DOM:** Hasło wprowadzone do pola pomocnika jest usuwane natychmiast po rozbiciu na pozycje maskowane.
* **Przejrzystość kodu:** Całość kodu znajduje się w pliku [content.js](file:///home/thelost/Projekty/bank-masked-password-extension/content.js) i [styles.css](file:///home/thelost/Projekty/bank-masked-password-extension/styles.css).

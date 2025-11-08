# Tasklister

System zarządzania zadaniami zespołowymi z możliwością przypisywania, realizacji i śledzenia postępów.

## Opis projektu

Tasklister to aplikacja webowa umożliwiająca zarządzanie zadaniami w zespole. Użytkownicy mogą dodawać zadania, przypisywać je do siebie, oznaczać jako ukończone oraz przeglądać historię wykonanych prac.

## Główne funkcje

- Dodawanie nowych zadań
- Przypisywanie zadań do użytkowników
- Oznaczanie zadań jako ukończone
- Oddawanie zadań z powrotem do puli
- Edycja zadań (twórca lub admin)
- Usuwanie zadań (tylko admin)
- Filtrowanie widoków: wszystkie zadania, moje zadania, historia
- Wyszukiwanie zadań
- Statystyki zadań
- System ról: użytkownik i administrator

## Wymagania

- Node.js w wersji 14 lub nowszej
- npm w wersji 6 lub nowszej
- PostgreSQL w wersji 12 lub nowszej

## Instalacja

### 1. Sklonuj repozytorium:
```bash
git clone https://github.com/cezbon/tasklister.git
cd tasklister
```

### 2. Backend - Konfiguracja bazy danych

1. Przejdź do katalogu backend:
```bash
cd backend
```

2. Zainstaluj zależności:
```bash
npm install
```

3. Utwórz bazę danych PostgreSQL:
```bash
createdb tasklister
```

4. Uruchom schema SQL:
```bash
psql -U postgres -d tasklister -f schema.sql
```

5. Utwórz plik `.env` w katalogu `backend/`:
```env
PORT=5000
JWT_SECRET=twoj-sekretny-klucz-zmien-w-produkcji
DB_USER=postgres
DB_HOST=localhost
DB_NAME=tasklister
DB_PASSWORD=twoje_haslo_postgres
DB_PORT=5432
```

6. Uruchom serwer backend:
```bash
npm start
```

Serwer będzie dostępny pod adresem: `http://localhost:5000`

### 3. Frontend

1. Wróć do głównego katalogu projektu:
```bash
cd ..
```

2. Zainstaluj zależności:
```bash
npm install
```

3. (Opcjonalnie) Utwórz plik `.env` w głównym katalogu, jeśli chcesz zmienić URL API:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

4. Uruchom aplikację w trybie deweloperskim:
```bash
npm start
```

5. Aplikacja zostanie uruchomiona pod adresem:
```
http://localhost:3000
```

## Rozwiązywanie problemów

### Błąd połączenia z bazą danych

Jeśli widzisz błąd `autoryzacja hasłem nie powiodła się`:

1. Sprawdź hasło w pliku `backend/.env` - musi być zgodne z hasłem użytkownika PostgreSQL
2. Sprawdź czy użytkownik `postgres` istnieje:
   ```bash
   psql -U postgres -c "\du"
   ```
3. Zmień hasło użytkownika postgres (jeśli potrzeba):
   ```sql
   ALTER USER postgres WITH PASSWORD 'nowe_haslo';
   ```

Więcej informacji w pliku `backend/README.md`.

## Użytkowanie

### Logowanie

Po uruchomieniu aplikacji zobaczysz ekran logowania. Wpisz dowolną nazwę użytkownika:
- Zwykły użytkownik: wpisz dowolną nazwę (np. "Jan")
- Administrator: wpisz "admin"

### Dodawanie zadań

1. W głównym widoku wpisz treść zadania w polu tekstowym
2. Kliknij przycisk "Dodaj" lub naciśnij Enter

### Przypisywanie zadań

1. W widoku "Wszystkie zadania" znajdź dostępne zadanie
2. Kliknij przycisk "Weź" aby przypisać zadanie do siebie
3. Zadanie pojawi się w zakładce "Moje zadania"

### Zarządzanie własnymi zadaniami

W zakładce "Moje zadania" możesz:
- Kliknąć "Ukończ" aby oznaczyć zadanie jako wykonane
- Kliknąć "Oddaj" aby zwrócić zadanie do puli dostępnych

### Edycja zadań

Zadania mogą edytować:
- Twórca zadania
- Administrator

Kliknij ikonę długopisu obok zadania, wprowadź zmiany i zatwierdź.

### Historia

Zakładka "Historia" pokazuje:
- Zadania aktualnie przypisane do użytkowników
- Zadania ukończone
- Informacje o tym kto i kiedy przypisał zadanie

### Uprawnienia administratora

Użytkownik zalogowany jako "admin" może:
- Edytować wszystkie zadania
- Usuwać zadania (ikona kosza)

## Budowanie wersji produkcyjnej

Aby zbudować aplikację do wdrożenia:

```bash
  npm run build
```

Zbudowana aplikacja znajdzie się w katalogu `build/`.

## Technologie

- React 19.2.0
- Lucide React (ikony)
- Tailwind CSS (stylowanie)

## Struktura projektu

```
tasklister/
├── public/           # Pliki publiczne
├── src/
│   ├── App.js       # Główny komponent aplikacji
│   ├── App.css      # Style aplikacji
│   ├── index.js     # Punkt wejścia
│   └── index.css    # Style globalne
└── package.json     # Zależności projektu
```

## Licencja

Projekt prywatny.
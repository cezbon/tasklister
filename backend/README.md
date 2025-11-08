# Tasklister Backend - Instrukcja konfiguracji

## Wymagania

- Node.js (v14 lub nowszy)
- PostgreSQL (v12 lub nowszy)
- npm lub yarn

## Instalacja

1. Zainstaluj zależności:
```bash
npm install
```

2. Skonfiguruj bazę danych PostgreSQL:
   - Upewnij się, że PostgreSQL jest uruchomiony
   - Utwórz bazę danych:
   ```bash
   createdb tasklister
   ```
   - Uruchom schema SQL:
   ```bash
   psql -U postgres -d tasklister -f schema.sql
   ```

3. Utwórz plik `.env` w katalogu `backend/`:
```env
PORT=5000
JWT_SECRET=twoj-sekretny-klucz-zmien-w-produkcji
DB_USER=postgres
DB_HOST=localhost
DB_NAME=tasklister
DB_PASSWORD=twoje_haslo_postgres
DB_PORT=5432
```

4. Uruchom serwer:
```bash
npm start
```

lub w trybie deweloperskim (z auto-reload):
```bash
npm run dev
```

## Rozwiązywanie problemów

### Błąd autoryzacji PostgreSQL

Jeśli widzisz błąd `autoryzacja hasłem nie powiodła się`:

1. Sprawdź hasło w pliku `.env` - musi być zgodne z hasłem użytkownika PostgreSQL
2. Sprawdź czy użytkownik `postgres` istnieje:
   ```bash
   psql -U postgres -c "\du"
   ```
3. Zmień hasło użytkownika postgres (jeśli potrzeba):
   ```sql
   ALTER USER postgres WITH PASSWORD 'nowe_haslo';
   ```

### Baza danych nie istnieje

Utwórz bazę danych:
```bash
createdb -U postgres tasklister
```

### Tabele nie istnieją

Uruchom schema SQL:
```bash
psql -U postgres -d tasklister -f schema.sql
```

## Endpointy API

- `POST /api/register-instance` - Rejestracja nowej instancji
- `POST /api/login/admin` - Logowanie administratora
- `POST /api/login/user` - Logowanie użytkownika
- `GET /api/check-instance/:slug` - Sprawdzenie istnienia instancji
- `GET /api/:slug/tasks` - Pobranie zadań (wymaga autoryzacji)
- `POST /api/:slug/tasks` - Dodanie zadania (wymaga autoryzacji)
- `PATCH /api/:slug/tasks/:taskId/take` - Wzięcie zadania (wymaga autoryzacji)
- `PATCH /api/:slug/tasks/:taskId/complete` - Ukończenie zadania (wymaga autoryzacji)
- `PATCH /api/:slug/tasks/:taskId/return` - Oddanie zadania (wymaga autoryzacji)
- `PATCH /api/:slug/tasks/:taskId` - Edycja zadania (wymaga autoryzacji)
- `DELETE /api/:slug/tasks/:taskId` - Usunięcie zadania (tylko admin, wymaga autoryzacji)

## Bezpieczeństwo

⚠️ **WAŻNE**: W produkcji:
- Zmień `JWT_SECRET` na silny, losowy ciąg znaków
- Użyj silnego hasła do bazy danych
- Nie commituj pliku `.env` do repozytorium
- Użyj HTTPS
- Skonfiguruj firewall dla PostgreSQL


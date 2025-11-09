cd /home/ubuntu/tasklister-main








docker stop tasklister_frontend tasklister_backend tasklister_db
docker rm tasklister_frontend tasklister_backend tasklister_db
docker network rm tasklister-main_tasklister_net
docker volume rm tasklister-main_postgres_data



docker-compose up --build -d











(Pamiętaj, **bez `sudo`**!)

### Krok 7: Weryfikacja

Sprawdź logi backendu (też **bez `sudo`**):
```bash
docker logs -f tasklister_backend

Powinieneś zobaczyć:
`✅ Połączono z bazą danych PostgreSQL`
`   Host: db`

Teraz, **po tym jak Cloudflare się zaktualizuje**, Twoja strona będzie działać pod `https://www.tasklister.pl`.
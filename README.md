cd /home/ubuntu/tasklister-main




docker stop tasklister_frontend tasklister_backend tasklister_db
docker rm tasklister_frontend tasklister_backend tasklister_db
docker network rm tasklister-main_tasklister_net
docker volume rm tasklister-main_postgres_data



docker-compose up --build -d



docker exec -it tasklister_db psql -U postgres -d tasklister


docker pull postgres:latest
docker run -d -e POSTGRES_USER=admin -e POSTGRES_PASSWORD=admin --name postgres_local -p 5432:5432  --restart=always postgres
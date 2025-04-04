Старый способ (не использовать):

docker run -d -p 8080:8088 --name superset_local apache/superset
docker exec -it superset superset fab create-admin ^
    --username admin ^
    --firstname Superset ^
    --lastname Admin ^
    --email admin@superset.com ^
    --password admin
docker exec -it superset superset db upgrade
docker exec -it superset superset load_examples
docker exec -it superset superset init

Новый способ:

git clone https://github.com/apache/superset.git
cd superset
Добавить в файл ./docker/.env-on-dev строчку:

MAPBOX_API_KEY=pk.eyJ1Ijoic3RyaWsiLCJhIjoiY2wyOHIwcGtoMDg1ODNibHRvc2s3dzdpciJ9.ZZJ8s4E_e0y15o4nYdnong

docker-compose -f docker-compose-non-dev.yml pull
docker-compose -f docker-compose-non-dev.yml up -d

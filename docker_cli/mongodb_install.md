docker run -d -p 27017:27017 --name mongodb_local ^
    -e MONGO_INITDB_ROOT_USERNAME=admin ^
    -e MONGO_INITDB_ROOT_PASSWORD=admin ^
    mongo
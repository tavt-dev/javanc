# Quarkus Image Service

Quarkus replacement for `microservice/image-service`.

## Runtime Contract

- Port: `8083`
- Base path: `/image`
- Database: MySQL `image`
- Table: `image`
- Multipart upload field: `image`
- Health: `/q/health`
- OpenAPI: `/q/openapi`

## Local Run

```powershell
$env:JAVA_HOME='C:\Program Files\Java\jdk-21'
$env:Path='C:\Program Files\Java\jdk-21\bin;' + $env:Path

$env:IMAGE_SERVICE_PORT='8083'
$env:MYSQL_USERNAME='root'
$env:MYSQL_PASSWORD='<local-mysql-password>'
$env:IMAGE_MYSQL_JDBC_URL='jdbc:mysql://localhost:3306/image?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true'
$env:CLOUDINARY_CLOUD_NAME='<local-cloudinary-cloud-name>'
$env:CLOUDINARY_API_KEY='<local-cloudinary-api-key>'
$env:CLOUDINARY_API_SECRET='<local-cloudinary-api-secret>'

.\mvnw.cmd quarkus:dev
```

Run from the `quarkus/image-service/` directory with:

```powershell
.\mvnw.cmd quarkus:dev
```

From the parent `quarkus/` directory, you can also run:

```powershell
mvn -pl image-service quarkus:dev
```

## Smoke Test

- `GET http://localhost:8083/q/health`
- `GET http://localhost:8083/image/getAll`
- `POST http://localhost:8083/image/save` as `multipart/form-data` with file field `image`

The `POST /image/save` response preserves the Spring wrapper:

```json
{
  "success": true,
  "message": "Get all is successfully",
  "data": {
    "id": 123,
    "url": "http://res.cloudinary.com/..."
  }
}
```

Do not commit `.env`, real Cloudinary credentials, or generated `target/` output.

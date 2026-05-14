# JAVANC Quarkus Backend

## 1. Giới thiệu dự án

JAVANC là hệ thống backend dạng microservices được xây dựng bằng Quarkus. Source code hiện tại tập trung vào các nghiệp vụ chính: xác thực người dùng, quản lý hồ sơ cá nhân/chuyên môn, quản lý dự án cá nhân, quản lý công ty và tuyển dụng, lưu trữ ảnh, gửi thông báo và gửi email.

Dựa trên các module và API hiện có, hệ thống thuộc nhóm nền tảng hồ sơ nghề nghiệp/tuyển dụng/danh mục dự án. Backend cung cấp API cho frontend hoặc các service nội bộ thông qua một gateway HTTP trung tâm.

Phần frontend có thư mục `client-react/`, tuy nhiên tài liệu này chỉ tổng hợp từ source code Quarkus trong thư mục `quarkus/`.

## 2. Mục đích của chương trình

Hệ thống được xây dựng để quản lý một nền tảng nơi người dùng có thể:

- Đăng ký tài khoản, xác thực email bằng OTP và đăng nhập bằng JWT.
- Quản lý thông tin hồ sơ cá nhân/chuyên môn.
- Quản lý danh sách dự án của hồ sơ.
- Tương tác với công ty, công việc và quy trình ứng tuyển.
- Nhận thông báo từ các nghiệp vụ trong hệ thống.
- Upload và sử dụng ảnh thông qua image-service.
- Gửi email nghiệp vụ, ví dụ email OTP xác thực tài khoản hoặc email liên quan đến công việc.

Đối tượng sử dụng được thể hiện trong source code gồm:

- `user`: người dùng thông thường, có thể tạo profile, project và ứng tuyển job.
- `hr`: người dùng có vai trò nhân sự, liên quan đến quản lý job và xử lý ứng tuyển.
- `manager`: người quản lý công ty, có thể quản lý công ty và đề xuất/promote HR.
- `admin`: người quản trị, có quyền quản lý tài khoản và các yêu cầu nâng quyền.

Giá trị chính của hệ thống là tách các nghiệp vụ lớn thành nhiều service độc lập, mỗi service có database/cấu hình riêng và được truy cập thông qua gateway. Cách tổ chức này giúp hệ thống dễ mở rộng theo từng miền nghiệp vụ như user, profile, project, manager, notification, image và email.

## 3. Tổng quan chức năng

### 3.1. Gateway API

Module: `quarkus/gateway-service`

Gateway là điểm vào HTTP chính cho các service phía sau. Gateway dùng static route thay cho service discovery.

Các route chính:

| Path | Service đích | Trạng thái xác thực |
|---|---|---|
| `/auth/**` | user-service | Public |
| `/users/**` | user-service | Cần Bearer token |
| `/profiles/**` | profile-service | Cần Bearer token |
| `/project/**` | project-service | Cần Bearer token |
| `/manager/**` | manager-service | Cần Bearer token |
| `/notification/**` | notification-service | Public ở gateway |
| `/image/**` | image-service | Public |

Gateway không expose `/email/**`. Email-service được dùng như service nội bộ.

Gateway xử lý:

- Forward request tới service tương ứng.
- Kiểm tra Bearer token cho các protected prefix.
- Gọi `user-service` qua `POST /auth/introspect` để validate token.
- Forward method, path, query, body và các header hợp lệ.
- Cấu hình CORS cho frontend local.

### 3.2. Xác thực và quản lý người dùng

Module: `quarkus/user-service`

Chức năng chính:

- Đăng ký tài khoản qua `POST /auth/register`.
- Xác thực email bằng OTP qua `POST /auth/verify-email`.
- Gửi lại OTP qua `POST /auth/resend-verification-otp`.
- Đăng nhập qua `POST /auth/login`.
- Refresh token qua `POST /auth/refresh`.
- Introspect token qua `POST /auth/introspect`.
- Logout qua `POST /auth/logout`.
- Lấy thông tin user hiện tại qua `GET /users/me`.
- Lấy user theo id, danh sách id hoặc tìm kiếm user.
- Admin tạo tài khoản nội bộ qua `POST /users/admin/accounts`.
- Admin cập nhật trạng thái tài khoản.
- Soft-delete user.
- Quản lý quy trình yêu cầu nâng quyền:
  - user yêu cầu lên manager.
  - manager đề xuất user lên HR.
  - admin duyệt/từ chối manager request.
  - user chấp nhận/từ chối HR promotion request.
  - HR có thể rời vai trò HR.

Các legacy endpoint kiểu Spring như `/auth/signup`, `/auth/signin`, `/auth/isValid`, `/auth/findbyid`, `/auth/checkId` và token qua query param đã bị loại bỏ có chủ đích theo README/test hiện tại của `user-service`.

### 3.3. Quản lý profile

Module: `quarkus/profile-service`

Chức năng chính:

- Lấy profile của user hiện tại: `GET /profiles/me`.
- Tạo profile cho user hiện tại: `POST /profiles/me`.
- Cập nhật profile hiện tại: `PATCH /profiles/me`.
- Upload avatar: `POST /profiles/me/avatar`.
- Xóa mềm profile hiện tại: `DELETE /profiles/me`.
- Tìm kiếm profile theo type/title với phân trang: `GET /profiles`.
- Lấy profile theo user id: `GET /profiles/by-user/{userId}`.
- Lấy nhiều profile theo ids: `GET /profiles/batch?ids=...`.
- Lấy profile theo id: `GET /profiles/{id}`.

Profile-service tự kiểm tra Bearer token bằng cách gọi `user-service` để introspect token. Service này dùng MongoDB và lưu collection `profile`.

### 3.4. Quản lý project

Module: `quarkus/project-service`

Chức năng chính:

- Tạo project kiểu legacy: `POST /project/user/save`.
- Cập nhật project kiểu legacy: `POST /project/user/update`.
- Lấy project theo profile id: `GET /project/user/getProject?id=...`.
- Lấy profile qua project-service: `GET /project/user/getProfile`.
- Lấy danh sách project hiện tại: `GET /project/user/projects`.
- Lấy một project của user hiện tại: `GET /project/user/projects/{id}`.
- Tạo project theo current profile: `POST /project/user/projects`.
- Cập nhật project của current profile: `PATCH /project/user/projects/{id}`.
- Xóa project của current profile: `DELETE /project/user/projects/{id}`.

Project-service sử dụng MySQL database `project1`. Một số endpoint legacy vẫn được giữ để tương thích.

### 3.5. Quản lý công ty, HR và tuyển dụng

Module: `quarkus/manager-service`

Chức năng nhóm company:

- Admin tạo công ty kèm ảnh: `POST /manager/admin/company/create`.
- Manager cập nhật công ty: `POST /manager/manager/company/update`.
- Gán HR vào công ty: `PUT /manager/manager/sethrtocompany`.
- Đề xuất/promote user thành HR: `PUT /manager/manager/promotehrtocompany`.
- Lấy công ty đang quản lý: `GET /manager/manager/company/me`.
- Lấy HR candidates: `GET /manager/manager/hr-candidates`.
- Tạo HR promotion request: `POST /manager/manager/hr-promotions`.
- User chấp nhận HR promotion: `PATCH /manager/user/hr-promotions/{requestId}/accept`.
- HR rời công ty/vai trò HR: `PATCH /manager/hr/leave`.
- Admin xóa công ty: `POST /manager/admin/company/delete`.
- Gán manager vào công ty qua endpoint tương thích tên cũ: `PUT /manager/manager/setmaanagertocompany`.
- Lấy công ty theo id, theo type, theo manager, theo HR.

Chức năng nhóm job:

- HR tạo job: `POST /manager/hr/job/create`.
- HR cập nhật job: `POST /manager/hr/job/update`.
- HR xóa job: `POST /manager/hr/job/delete`.
- User ứng tuyển theo profile id: `PUT /manager/user/job/apply?jobDTO=&idProfile=`.
- User hiện tại ứng tuyển: `POST /manager/user/jobs/{id}/applications`.
- User rời job: `POST /manager/user/jobs/{id}/leave`.
- Kiểm tra trạng thái ứng tuyển: `GET /manager/user/jobs/{id}/application-status`.
- HR accept/reject profile cho job.
- Lấy job theo id, toàn bộ job, job theo company, job pending, job accepted và job mới.

Manager-service sử dụng MongoDB collection `company` và `job`. Source code giữ lại một số tên tương thích như `idHR`, `idProfiePending` và `/setmaanagertocompany`.

### 3.6. Upload và xử lý ảnh

Module: `quarkus/image-service`

Chức năng chính:

- Upload ảnh qua multipart field `image`: `POST /image/save`.
- Lấy toàn bộ metadata ảnh: `GET /image/getAll`.
- Preview ảnh: `GET /image/preview?url=&width=`.
- Serve file local: `GET /image/files/{filename}`.

Image-service hỗ trợ các định dạng được kiểm tra bằng magic bytes: JPEG, PNG và WEBP. Service lưu metadata ảnh trong MySQL database `image`, có adapter Cloudinary và cấu hình local storage.

### 3.7. Notification

Module: `quarkus/notification-service`

Chức năng chính:

- Tạo notification: `POST /notification/create`.
- Cập nhật notification: `POST /notification/update`.
- Lấy notification theo user: `GET /notification/user/findByUser?userId=...`.
- Lấy tất cả notification: `GET /notification/getAll`.

Notification-service sử dụng MySQL database `notification1`, table `notifications`. Khi tìm notification theo user, service gọi user-service để kiểm tra user id.

### 3.8. Email

Module: `quarkus/email-service`

Chức năng chính:

- Gửi email nghiệp vụ qua `POST /email/create`.
- Gửi email OTP nội bộ qua `POST /internal/emails/verification-otp`.

Email-service dùng Quarkus Mailer. Endpoint OTP nội bộ được `user-service` gọi trực tiếp và không được gateway expose.

Kafka configuration có trong properties, nhưng README/source hiện tại của notification/email cho thấy Kafka không phải baseline runtime đang dùng.

## 4. Kết quả tổng quát của project

Sau khi chạy đầy đủ các service, hệ thống có thể hoạt động như một backend microservices cho nền tảng quản lý hồ sơ nghề nghiệp và tuyển dụng:

1. Người dùng đăng ký tài khoản.
2. Hệ thống gửi OTP qua email.
3. Người dùng xác thực email để kích hoạt tài khoản.
4. Người dùng đăng nhập và nhận access token/refresh token.
5. Frontend gọi gateway kèm Bearer token.
6. Gateway kiểm tra token bằng user-service rồi forward request tới service phù hợp.
7. Người dùng tạo và cập nhật profile.
8. Người dùng upload avatar hoặc ảnh liên quan qua image-service.
9. Người dùng tạo project cho profile.
10. Admin/manager/HR quản lý công ty, vai trò HR và job.
11. Người dùng ứng tuyển job.
12. HR xử lý accept/reject ứng tuyển.
13. Hệ thống tạo notification và có thể gửi email theo các nghiệp vụ tương ứng.

Các response chính dùng wrapper thống nhất dạng:

```json
{
  "success": true,
  "message": "string",
  "data": {}
}
```

Error response cũng giữ cùng cấu trúc với `success: false`.

## 5. Công nghệ sử dụng

### Ngôn ngữ và nền tảng

- Java 21.
- Quarkus `3.33.1`.
- Maven multi-module.

### Web/API

- Jakarta REST/JAX-RS qua Quarkus REST.
- Quarkus REST Jackson.
- MicroProfile REST Client Jackson.
- Vert.x Web Client trong gateway-service.
- Jakarta Validation / Hibernate Validator.
- SmallRye Health.
- SmallRye OpenAPI.

### Persistence

- Hibernate ORM with Panache.
- MySQL JDBC.
- MongoDB Panache.
- H2 cho test ở các service dùng MySQL.
- Flyway trong user-service.

Database theo source hiện tại:

| Service | Database |
|---|---|
| user-service | MySQL `portfolio` |
| image-service | MySQL `image` |
| notification-service | MySQL `notification1` |
| project-service | MySQL `project1` |
| profile-service | MongoDB `microservice-portfolio` |
| manager-service | MongoDB `microservice-portfolio` |
| gateway-service | Không có database |
| email-service | Không có database trong source hiện tại |

### Bảo mật và xác thực

- JWT access token và refresh token.
- Token introspection qua user-service.
- BCrypt password hashing.
- OTP email verification.
- HMAC OTP hashing.
- Role-based authorization trong application/domain logic.

Không thấy Keycloak trong source code hiện tại.

### File/Image/Email

- Multipart upload.
- Cloudinary Java SDK (`cloudinary-http44`).
- Local file serving cho ảnh.
- Quarkus Mailer.

### Testing

- Quarkus JUnit.
- Rest Assured.
- Quarkus JUnit Mockito ở một số module.
- H2 in-memory database cho test các service MySQL.

### Container

- Dockerfile chỉ thấy trong `quarkus/user-service/src/main/docker`.
- Có Dockerfile cho JVM, legacy-jar, native và native-micro mode.

## 6. Kiến trúc tổng quan

### 6.1. Kiến trúc ở mức hệ thống

Project `quarkus/` là Maven reactor gồm 8 service:

```text
gateway-service
user-service
profile-service
project-service
manager-service
notification-service
image-service
email-service
```

Luồng tổng quát:

```text
Frontend / Client
        |
        v
gateway-service
        |
        |-- /auth, /users -------> user-service --------> MySQL portfolio
        |-- /profiles -----------> profile-service -----> MongoDB microservice-portfolio
        |-- /project ------------> project-service -----> MySQL project1
        |-- /manager ------------> manager-service -----> MongoDB microservice-portfolio
        |-- /notification -------> notification-service -> MySQL notification1
        |-- /image --------------> image-service -------> MySQL image / Cloudinary / local file

user-service -----> email-service ---------------> SMTP / mock mailer
manager-service --> notification-service/email-service/profile-service/user-service/image-service
project-service --> profile-service/user-service/image-service/notification-service
profile-service --> user-service/image-service
notification-service/email-service --> user-service
```

### 6.2. Vai trò của từng tầng trong service

Các service được tổ chức theo hướng tách tầng rõ ràng. Tên package có khác nhau giữa `user-service` và các service còn lại, nhưng vai trò nhìn chung giống nhau.

#### Resource / Controller layer

Vị trí thường gặp:

- `interfaces/rest/resource`
- `adapter/in/rest` trong user-service

Vai trò:

- Khai báo REST endpoint bằng `@Path`, `@GET`, `@POST`, `@PATCH`, `@PUT`, `@DELETE`.
- Nhận request DTO, path param, query param, multipart form.
- Gọi application service/use case.
- Trả response bằng `ApiResponse`.

#### DTO layer

Vị trí thường gặp:

- `application/dto`
- `interfaces/rest/dto`
- `adapter/in/rest/dto`

Vai trò:

- Định nghĩa dữ liệu request/response.
- Giữ compatibility với một số tên field cũ như `idHR`, `idProfiePending`, `isDisplay`, `read/isRead`.
- Tránh expose trực tiếp entity/domain model.

#### Application service / Use case layer

Vị trí thường gặp:

- `application/service`
- `application/usecase` trong user-service

Vai trò:

- Chứa nghiệp vụ chính.
- Kiểm tra quyền, trạng thái, dữ liệu hợp lệ.
- Điều phối repository và outbound port.
- Quản lý transaction ở các nghiệp vụ cần persistence.

Ví dụ:

- `AuthUseCase` xử lý register, verify OTP, login, refresh, introspect.
- `UserUseCase` xử lý quản lý user và role request.
- `ProfileApplicationService` xử lý profile CRUD và upload avatar.
- `ProjectApplicationService` xử lý project và ownership theo current profile.
- `CompanyApplicationService` xử lý company, HR promotion và manager assignment.
- `JobApplicationService` xử lý job, apply, accept/reject.

#### Domain layer

Vị trí thường gặp:

- `domain/model`
- `domain/repository`
- `domain/service`
- `domain/port`

Vai trò:

- Chứa model nghiệp vụ, enum, value object.
- Định nghĩa repository contract hoặc port.
- Giữ logic nghiệp vụ không phụ thuộc trực tiếp vào HTTP/database khi có thể.

Ví dụ:

- `User`, `Role`, `AccountStatus`, `EmailAddress`, `PasswordHash`.
- `Profile`, `Contact`, `TypeProfile`, `ProfileStatus`.
- `Company`, `Job`, `TypeJob`.
- `Project`, `Notification`, `Image`.

#### Infrastructure layer

Vị trí thường gặp:

- `infrastructure/client`
- `infrastructure/persistence`
- `infrastructure/storage`
- `infrastructure/mail`
- `adapter/out/*` trong user-service

Vai trò:

- Kết nối database qua Panache/JPA/MongoDB.
- Gọi service khác qua MicroProfile REST Client.
- Gửi mail qua Quarkus Mailer.
- Upload ảnh qua Cloudinary/local storage.
- Sinh JWT, hash password, hash OTP.

#### Mapper layer

Vị trí thường gặp:

- `application/mapper`
- mapper riêng trong adapter như `UserPersistenceMapper`, `RestAuthMapper`.

Vai trò:

- Chuyển đổi giữa DTO, domain model và persistence entity.
- Giữ resource/service không bị trộn lẫn logic mapping.

#### Exception mapper

Vị trí thường gặp:

- `interfaces/rest/exception`
- `shared/exception` trong user-service

Vai trò:

- Chuyển exception nghiệp vụ thành HTTP response.
- Giữ response error theo format thống nhất.

### 6.3. Luồng xử lý request tổng quát

Ví dụ với protected API:

```text
Client gửi request kèm Authorization: Bearer <token>
        |
        v
gateway-service kiểm tra path có cần auth không
        |
        v
gateway-service gọi user-service /auth/introspect
        |
        v
Nếu token active: gateway forward request tới service đích
        |
        v
Resource của service nhận request
        |
        v
Application service/use case xử lý nghiệp vụ
        |
        v
Repository/client adapter truy cập database hoặc service khác
        |
        v
Mapper chuyển domain/entity thành DTO
        |
        v
Resource trả ApiResponse cho client
```

Một số service như profile-service vẫn tự introspect token ở service layer, ngay cả khi request đi qua gateway.

## 7. Cấu trúc thư mục

### 7.1. Cấu trúc tổng quan repository

```bash
.
├── README.md
├── client-react/
│   └── Chưa xác định từ source code hiện tại trong phạm vi README này
├── docs/
│   └── Tài liệu kế hoạch/migration đã có trong repository
└── quarkus/
    ├── pom.xml
    ├── email-service/
    ├── gateway-service/
    ├── image-service/
    ├── manager-service/
    ├── notification-service/
    ├── profile-service/
    ├── project-service/
    └── user-service/
```

### 7.2. Maven reactor Quarkus

```bash
quarkus/
├── pom.xml
├── email-service/
│   ├── pom.xml
│   ├── README.md
│   └── src/
├── gateway-service/
│   ├── pom.xml
│   ├── README.md
│   └── src/
├── image-service/
│   ├── pom.xml
│   ├── README.md
│   ├── postman/
│   └── src/
├── manager-service/
│   ├── pom.xml
│   ├── README.md
│   └── src/
├── notification-service/
│   ├── pom.xml
│   ├── README.md
│   ├── postman/
│   └── src/
├── profile-service/
│   ├── pom.xml
│   ├── README.md
│   ├── postman/
│   └── src/
├── project-service/
│   ├── pom.xml
│   ├── README.md
│   └── src/
└── user-service/
    ├── pom.xml
    ├── README.md
    ├── postman/
    └── src/
```

### 7.3. Cấu trúc service Quarkus phổ biến

Phần lớn service có cấu trúc tương tự:

```bash
src/
├── main/
│   ├── java/
│   │   └── com/
│   │       └── javanc/
│   │           └── <service>/
│   │               ├── application/
│   │               │   ├── dto/
│   │               │   ├── exception/
│   │               │   ├── mapper/
│   │               │   ├── port/
│   │               │   └── service/
│   │               ├── domain/
│   │               │   ├── model/
│   │               │   ├── repository/
│   │               │   └── service/
│   │               ├── infrastructure/
│   │               │   ├── client/
│   │               │   ├── persistence/
│   │               │   ├── storage/
│   │               │   └── mail/
│   │               └── interfaces/
│   │                   └── rest/
│   │                       ├── dto/
│   │                       ├── exception/
│   │                       ├── form/
│   │                       └── resource/
│   └── resources/
│       └── application.properties
└── test/
    └── java/
        └── com/
            └── javanc/
                └── <service>/
```

Không phải service nào cũng có đủ tất cả các package ở trên. Ví dụ:

- `gateway-service` không có database repository.
- `email-service` có `infrastructure/mail`.
- `image-service` có `infrastructure/storage`.
- `user-service` dùng cấu trúc `adapter/in`, `adapter/out`, `application/usecase`, `domain/port`, `shared/exception`.

### 7.4. Cấu trúc user-service

```bash
user-service/
├── pom.xml
├── README.md
├── postman/
│   ├── user-service.postman_collection.json
│   └── user-service.postman_environment.json
├── src/
│   ├── main/
│   │   ├── docker/
│   │   │   ├── Dockerfile.jvm
│   │   │   ├── Dockerfile.legacy-jar
│   │   │   ├── Dockerfile.native
│   │   │   └── Dockerfile.native-micro
│   │   ├── java/
│   │   │   └── com/javanc/user/
│   │   │       ├── adapter/
│   │   │       │   ├── in/rest/
│   │   │       │   └── out/
│   │   │       │       ├── email/
│   │   │       │       ├── notification/
│   │   │       │       ├── persistence/
│   │   │       │       └── security/
│   │   │       ├── application/
│   │   │       │   ├── command/
│   │   │       │   ├── result/
│   │   │       │   └── usecase/
│   │   │       ├── config/
│   │   │       ├── domain/
│   │   │       │   ├── model/
│   │   │       │   └── port/
│   │   │       └── shared/
│   │   │           └── exception/
│   │   └── resources/
│   │       ├── application.properties
│   │       └── db/
│   │           └── migration/
│   │               ├── V1__create_user_table.sql
│   │               ├── V2__add_user_account_status.sql
│   │               ├── V3__add_email_verification_otp.sql
│   │               └── V4__add_role_upgrade_request.sql
│   └── test/
│       └── java/com/javanc/user/
```

### 7.5. Cấu trúc gateway-service

```bash
gateway-service/
├── pom.xml
├── README.md
└── src/
    ├── main/
    │   ├── java/com/javanc/gateway/
    │   │   ├── application/
    │   │   │   ├── model/
    │   │   │   ├── port/
    │   │   │   └── service/
    │   │   ├── domain/
    │   │   │   └── model/
    │   │   ├── infrastructure/
    │   │   │   ├── client/
    │   │   │   └── config/
    │   │   └── interfaces/
    │   │       └── http/
    │   └── resources/
    │       └── application.properties
    └── test/
        └── java/com/javanc/gateway/
```

### 7.6. Cấu trúc profile-service

```bash
profile-service/
├── pom.xml
├── README.md
├── postman/
│   ├── profile-service.postman_collection.json
│   └── profile-service.postman_environment.json
└── src/
    ├── main/
    │   ├── java/com/javanc/profile/
    │   │   ├── application/
    │   │   │   ├── exception/
    │   │   │   ├── mapper/
    │   │   │   ├── port/
    │   │   │   ├── security/
    │   │   │   └── service/
    │   │   ├── domain/
    │   │   │   ├── model/
    │   │   │   └── repository/
    │   │   ├── infrastructure/
    │   │   │   ├── client/
    │   │   │   └── persistence/
    │   │   └── interfaces/
    │   │       └── rest/
    │   │           ├── dto/
    │   │           ├── exception/
    │   │           ├── form/
    │   │           └── resource/
    │   └── resources/
    │       └── application.properties
    └── test/
        └── java/com/javanc/profile/
```

### 7.7. Cấu trúc manager-service

```bash
manager-service/
├── pom.xml
├── README.md
└── src/
    ├── main/
    │   ├── java/com/javanc/manager/
    │   │   ├── application/
    │   │   │   ├── dto/
    │   │   │   ├── exception/
    │   │   │   ├── mapper/
    │   │   │   ├── port/
    │   │   │   └── service/
    │   │   ├── domain/
    │   │   │   ├── model/
    │   │   │   ├── repository/
    │   │   │   └── service/
    │   │   ├── infrastructure/
    │   │   │   ├── client/
    │   │   │   └── persistence/
    │   │   └── interfaces/
    │   │       └── rest/
    │   │           ├── exception/
    │   │           ├── form/
    │   │           └── resource/
    │   └── resources/
    │       └── application.properties
    └── test/
        └── java/com/javanc/manager/
```

### 7.8. Cấu trúc các service MySQL còn lại

`image-service`, `notification-service` và `project-service` đều có cấu trúc tương tự theo các tầng application/domain/infrastructure/interfaces.

```bash
<service>/
├── pom.xml
├── README.md
├── postman/
│   └── Có ở image-service và notification-service
└── src/
    ├── main/
    │   ├── java/com/javanc/<service>/
    │   │   ├── application/
    │   │   ├── domain/
    │   │   ├── infrastructure/
    │   │   └── interfaces/
    │   └── resources/
    │       └── application.properties
    └── test/
        └── java/com/javanc/<service>/
```

Riêng `email-service` không có database trong source hiện tại, nhưng vẫn dùng cùng kiểu phân tầng:

```bash
email-service/
├── pom.xml
├── README.md
└── src/
    ├── main/
    │   ├── java/com/javanc/email/
    │   │   ├── application/
    │   │   ├── domain/
    │   │   ├── infrastructure/
    │   │   │   ├── client/
    │   │   │   └── mail/
    │   │   └── interfaces/
    │   │       └── rest/
    │   └── resources/
    │       └── application.properties
    └── test/
        └── java/com/javanc/email/
```

## 8. Cấu hình môi trường

Mỗi service có file `.env.example` riêng. Source hiện tại cũng có các file `.env` local trên máy, nhưng các file `.env` không được Git track theo kết quả kiểm tra hiện tại.

Các nhóm biến môi trường chính:

- Port service: `USER_SERVICE_PORT`, `GATEWAY_SERVICE_PORT`, `PROFILE_SERVICE_PORT`, ...
- Database MySQL: `MYSQL_USERNAME`, `MYSQL_PASSWORD`, `*_MYSQL_JDBC_URL`.
- MongoDB: `MONGODB_CONNECTION_STRING`, `MONGODB_DATABASE`.
- JWT/OTP: `JWT_SECRET`, `JWT_ISSUER`, `OTP_*`, `OTP_HASH_SECRET`.
- Service URL nội bộ: `USER_SERVICE_URL`, `PROFILE_SERVICE_URL`, `PROJECT_SERVICE_URL`, ...
- Mail: `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM`, `MAIL_MOCK`.
- Cloudinary: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_FOLDER`.

Không commit `.env`, credential thật, file `target/` hoặc IDE metadata.

## 9. Chạy local

Yêu cầu chung:

- JDK 21.
- Maven hoặc Maven Wrapper trong từng module.
- MySQL cho các service dùng MySQL.
- MongoDB cho `profile-service` và `manager-service`.
- SMTP hoặc `MAIL_MOCK=true` cho email-service.
- Cloudinary credential nếu dùng upload Cloudinary thật.

Chạy toàn bộ test từ thư mục `quarkus/`:

```bash
mvn test
```

Chạy một service ở dev mode từ thư mục service:

```bash
./mvnw quarkus:dev
```

Trên Windows có thể dùng:

```powershell
.\mvnw.cmd quarkus:dev
```

Ví dụ chạy từ Maven reactor:

```bash
mvn -pl user-service quarkus:dev
mvn -pl gateway-service quarkus:dev
```

Port mặc định theo source:

| Service | Port |
|---|---:|
| gateway-service | 8080 |
| image-service | 8083 |
| notification-service | 8084 |
| profile-service | 8085 |
| project-service | 8086 |
| email-service | 8087 |
| user-service | 8088 |
| manager-service | 8091 |

## 10. Ghi chú về trạng thái source code

- Code hiện tại đã chuyển nhiều endpoint sang contract mới, đặc biệt ở `user-service` và `profile-service`.
- Một số endpoint legacy vẫn được giữ ở `project-service` và `manager-service` để tương thích tên API/field cũ.
- `email-service` có cấu hình Kafka trong properties, nhưng chưa thấy luồng Kafka active từ source code hiện tại.
- `notification-service` được gateway để public, nhưng một số nghiệp vụ bên trong vẫn gọi user-service để validate user.
- Direct role change endpoint `/users/{id}/role` tồn tại ở resource, nhưng logic hiện tại vô hiệu hóa thay đổi role trực tiếp và yêu cầu dùng role request flow.
- Chưa xác định từ source code hiện tại: quy trình deploy production đầy đủ, hạ tầng CI/CD, observability ngoài health/openapi, và đặc tả nghiệp vụ cấp sản phẩm ngoài các API đã có.

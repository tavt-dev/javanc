# Phân Tích Backend Quarkus Và Roadmap Cải Tiến

## 1. Executive Summary

Tài liệu này tổng hợp hiện trạng backend Quarkus của dự án JAVANC và đề xuất roadmap cải tiến theo nhiều phase. Nội dung được viết dựa trên source code hiện tại trong thư mục `quarkus/` và các tài liệu migration có sẵn trong `docs/`.

Backend hiện tại là hệ thống microservices gồm 8 service:

| Service | Vai trò chính | Port mặc định | Database |
|---|---|---:|---|
| `gateway-service` | API gateway, static routing, auth guard | 8080 | Không có |
| `user-service` | Auth, user management, JWT, OTP, role request | 8088 | MySQL `portfolio` |
| `profile-service` | Quản lý profile người dùng | 8085 | MongoDB `microservice-portfolio` |
| `project-service` | Quản lý project của profile | 8086 | MySQL `project1` |
| `manager-service` | Công ty, HR, job, ứng tuyển | 8091 | MongoDB `microservice-portfolio` |
| `notification-service` | Notification CRUD/read | 8084 | MySQL `notification1` |
| `image-service` | Upload ảnh, preview, metadata ảnh | 8083 | MySQL `image` |
| `email-service` | Gửi email nghiệp vụ và OTP nội bộ | 8087 | MySQL `email` cho `processed_message` idempotency |

Đã xác nhận từ source code hiện tại:

- Gateway dùng static route, không dùng Eureka/service discovery.
- Protected API được gateway kiểm tra bằng Bearer token và gọi `user-service` qua `POST /auth/introspect`.
- JWT, OTP email verification, admin bootstrap, role request flow đã có trong `user-service`.
- Kafka foundation đã được thêm ở Phase 4 nhưng vẫn là internal interface: HTTP business flow hiện tại chưa phụ thuộc Kafka.
- `quarkus-messaging-kafka` chỉ có trong `user-service`, `manager-service`, `project-service`, `email-service`, `notification-service`; gateway/profile/image không có Kafka dependency.
- Kafka mặc định disabled bằng `MESSAGING_ENABLED=false`; Phase 6 đã wire async side effects thật sau feature flags, nhưng HTTP vẫn là baseline khi flags mặc định tắt.

Định hướng cải tiến:

- Phase 1-3 tập trung chuẩn hóa tài liệu, contract, config, resilience, logging, monitoring.
- Phase 4-7 triển khai Kafka incremental, giữ HTTP API hiện tại, thêm event-driven cho email, notification và domain events.
- Kafka phải đi kèm outbox pattern, retry, dead-letter queue và idempotency để tránh mất hoặc xử lý trùng message.

## 2. Hiện Trạng Kiến Trúc

### 2.1. Kiến trúc hệ thống

Đã xác nhận từ source code:

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

user-service -----> email-service
user-service -----> notification-service
profile-service --> user-service / image-service
project-service --> profile-service / user-service / image-service / notification-service
manager-service --> user-service / profile-service / image-service / notification-service / email-service
notification-service --> user-service
email-service -------> user-service
```

Gateway hiện expose:

| Path | Target service | Auth ở gateway |
|---|---|---|
| `/auth/**` | `user-service` | Public |
| `/users/**` | `user-service` | Cần Bearer token |
| `/profiles/**` | `profile-service` | Cần Bearer token |
| `/project/**` | `project-service` | Cần Bearer token |
| `/manager/**` | `manager-service` | Cần Bearer token |
| `/notification/**` | `notification-service` | Public |
| `/image/**` | `image-service` | Public |

Gateway không expose `/email/**`. Endpoint email OTP nội bộ được `user-service` gọi trực tiếp tới `email-service`.

### 2.2. Stack kỹ thuật

Đã xác nhận từ source code:

- Java 21.
- Quarkus `3.33.1`.
- Maven multi-module.
- Quarkus REST Jackson.
- MicroProfile REST Client Jackson.
- Hibernate ORM with Panache.
- MongoDB Panache.
- MySQL JDBC.
- H2 cho test ở các service dùng MySQL.
- Flyway trong `user-service`.
- Quarkus Mailer trong `email-service`.
- Cloudinary SDK trong `image-service`.
- SmallRye Health và SmallRye OpenAPI.
- REST Assured và Quarkus JUnit cho test.

Chưa xác định từ source code hiện tại:

- Hạ tầng production thực tế.
- CI/CD pipeline.
- Monitoring stack cụ thể như Prometheus, Grafana, Loki, ELK hoặc OpenTelemetry collector.
- Secret manager production.
- Cloud provider hoặc deployment target.

### 2.3. Mô hình phân tầng

Đã xác nhận từ source code:

- Các service phần lớn dùng cấu trúc `application`, `domain`, `infrastructure`, `interfaces`.
- `user-service` dùng cấu trúc rõ hơn theo hướng ports/adapters: `adapter/in`, `adapter/out`, `application/usecase`, `domain/port`, `shared/exception`.
- Resource layer nhận HTTP request và trả `ApiResponse`.
- Application service/use case chứa nghiệp vụ.
- Infrastructure layer chứa REST client, persistence adapter, mail adapter, image storage adapter.
- Mapper chuyển đổi DTO/domain/entity.
- Exception mapper chuyển exception thành response.

Luồng xử lý điển hình:

```text
HTTP Request
  -> Resource / Gateway Resource
  -> Auth / Token introspection nếu endpoint protected
  -> Application Service / Use Case
  -> Repository hoặc Outbound Client
  -> Mapper
  -> ApiResponse
```

## 3. Phân Tích Theo Service

### 3.1. gateway-service

Đã xác nhận từ source code:

- Port mặc định: `8080`.
- Không có database.
- Định nghĩa route trong `GatewayRouteConfig`.
- Forward request bằng `VertxProxyClient`.
- Auth guard nằm ở gateway cho các protected prefix.
- Token validation gọi `user-service` qua `POST /auth/introspect`.
- Có custom CORS filter.
- `/email/**` không được expose qua gateway.

Điểm mạnh:

- Gateway đơn giản, rõ vai trò.
- Static route dễ cấu hình cho môi trường local.
- Giữ được public/protected boundary ở một nơi.

Rủi ro và technical debt:

- Token introspection client đang build JSON body thủ công bằng nối chuỗi; JWT thường an toàn nhưng cách này giòn nếu payload thay đổi.
- Chưa thấy request id/correlation id thống nhất.
- Chưa thấy timeout/retry policy được chuẩn hóa ở mức kiến trúc cho mọi downstream call.
- `/notification/**` public ở gateway, nhưng notification-service có flow validate user bên trong. Đây là điểm cần document rõ để frontend không hiểu sai về security boundary.

Đề xuất cải tiến:

- Dùng DTO/ObjectMapper cho introspection request thay vì string concatenation.
- Gateway tạo hoặc forward `X-Request-Id`.
- Forward `X-Request-Id` sang downstream service.
- Chuẩn hóa response khi downstream service unavailable.
- Viết bảng route contract chính thức.

### 3.2. user-service

Đã xác nhận từ source code:

- Port mặc định: `8088`.
- Database: MySQL `portfolio`.
- Có Flyway migrations:
  - `V1__create_user_table.sql`.
  - `V2__add_user_account_status.sql`.
  - `V3__add_email_verification_otp.sql`.
  - `V4__add_role_upgrade_request.sql`.
- Auth API hiện tại:
  - `POST /auth/register`.
  - `POST /auth/verify-email`.
  - `POST /auth/resend-verification-otp`.
  - `POST /auth/login`.
  - `POST /auth/refresh`.
  - `POST /auth/introspect`.
  - `POST /auth/logout`.
- User API hiện tại:
  - `GET /users/me`.
  - `GET /users/{id}`.
  - `GET /users?ids=...`.
  - `GET /users/search`.
  - `PATCH /users/{id}`.
  - `PATCH /users/{id}/status`.
  - `PATCH /users/{id}/role`.
  - `POST /users/admin/accounts`.
  - `DELETE /users/{id}`.
  - Các endpoint role request và HR promotion.
- Legacy auth endpoints như `/auth/signup`, `/auth/signin`, `/auth/isValid`, `/auth/findbyid`, `/auth/checkId` đã bị remove có chủ đích.
- Direct role change endpoint tồn tại ở resource nhưng application logic hiện tại vô hiệu hóa direct role change và yêu cầu role request flow.

Điểm mạnh:

- Auth flow rõ ràng, có email verification trước khi active account.
- JWT access/refresh token có phân biệt token type.
- Có role request flow thay cho sửa role trực tiếp.
- Có Flyway cho schema quan trọng nhất.
- Test cover contract mới và legacy endpoint removal.

Rủi ro và technical debt:

- User-service đang gọi trực tiếp email-service và notification-service bằng HTTP cho side effects. Nếu downstream fail, nghiệp vụ chính có thể bị ảnh hưởng tùy flow.
- Role notification là side effect phù hợp để chuyển sang async event.
- Cần rà kỹ behavior của `/users/{id}/role`: endpoint public contract nói update role, nhưng implementation thực tế disabled.

Đề xuất cải tiến:

- Giữ endpoint role direct hoặc chuyển thành deprecated documented endpoint. Không đổi ngay nếu frontend còn phụ thuộc.
- Dùng outbox cho các sự kiện:
  - `EmailVerificationOtpRequested`.
  - `RoleRequestCreated`.
  - `RoleRequestApproved`.
  - `HrPromotionRequested`.
  - `HrPromotionAccepted`.
- Sau khi Kafka ổn định, giảm dần HTTP side effect sang async consumer.

### 3.3. profile-service

Đã xác nhận từ source code:

- Port mặc định: `8085`.
- Database: MongoDB `microservice-portfolio`.
- Collection: `profile`.
- Base path: `/profiles`.
- Tự introspect Bearer token bằng user-service.
- Endpoint chính:
  - `GET /profiles/me`.
  - `POST /profiles/me`.
  - `PATCH /profiles/me`.
  - `POST /profiles/me/avatar`.
  - `DELETE /profiles/me`.
  - `GET /profiles`.
  - `GET /profiles/by-user/{userId}`.
  - `GET /profiles/batch`.
  - `GET /profiles/{id}`.
- Legacy `/profile/**` route đã bị remove theo test.

Điểm mạnh:

- Có quyền đọc rõ giữa self/admin/batch.
- Có validation profile/contact.
- Có soft delete/reuse logic.
- Có tích hợp image-service cho avatar.

Rủi ro và technical debt:

- Profile-service vừa được gateway bảo vệ, vừa tự introspect token. Đây là defense-in-depth tốt, nhưng cần document để tránh hiểu nhầm double validation.
- Mongo unique index trên `idUser` có thể gặp vấn đề nếu dữ liệu cũ duplicate.
- Chưa thấy readiness check downstream user/image rõ ràng ngoài health chung.

Đề xuất cải tiến:

- Document auth boundary của profile-service.
- Thêm request id propagation sang user/image client.
- Rà dữ liệu duplicate trước khi enforce unique index trong production.

### 3.4. project-service

Đã xác nhận từ source code:

- Port mặc định: `8086`.
- Database: MySQL `project1`.
- Base path: `/project`.
- Có endpoint legacy và endpoint current-profile mới.
- Endpoint legacy:
  - `POST /project/user/save`.
  - `POST /project/user/update`.
  - `GET /project/user/getProfile`.
  - `GET /project/user/getProject?id=...`.
  - `GET /project/user/get`.
  - `GET /project/user/get1`.
- Endpoint mới:
  - `GET /project/user/projects`.
  - `GET /project/user/projects/{id}`.
  - `POST /project/user/projects`.
  - `PATCH /project/user/projects/{id}`.
  - `DELETE /project/user/projects/{id}`.

Điểm mạnh:

- Đã có ownership check theo current profile ở flow mới.
- Giữ một số endpoint legacy để tương thích.
- Có test cho mapper, repository, resource và application service.

Rủi ro và technical debt:

- Tồn tại song song legacy và current-profile API dễ gây nhầm lẫn.
- Một số endpoint legacy như `GET /project/user/get` dùng multipart trên GET là contract bất thường, nên cần document là compatibility endpoint.
- Dùng HTTP call tới notification/profile/image/user cho side effects/dependency.

Đề xuất cải tiến:

- Tạo bảng contract phân biệt "current API" và "legacy compatibility API".
- Không remove legacy endpoint nếu chưa có frontend migration.
- Domain event đề xuất:
  - `ProjectCreated`.
  - `ProjectUpdated`.
  - `ProjectDeleted`.

### 3.5. manager-service

Đã xác nhận từ source code:

- Port mặc định: `8091`.
- Database: MongoDB `microservice-portfolio`.
- Collections: `company`, `job`.
- Base path: `/manager`.
- Giữ compatibility names như `idHR`, `idProfiePending`, `/setmaanagertocompany`.
- Company endpoints xử lý tạo/cập nhật/xóa công ty, gán manager, gán/promote HR, HR leave.
- Job endpoints xử lý tạo/cập nhật/xóa job, apply, leave, application status, accept/reject, query job.
- Tích hợp user-service, profile-service, image-service, notification-service, email-service.

Điểm mạnh:

- Nghiệp vụ company/job được gom trong một service rõ miền.
- Có flow mới cho HR promotion thông qua user-service role request thay vì direct role change.
- Có current-user apply endpoint giúp giảm phụ thuộc client truyền profile id.

Rủi ro và technical debt:

- Manager-service có nhiều downstream side effects nhất, nên dễ gặp lỗi partial failure.
- Một số tên field/endpoint sai chính tả được giữ để compatibility, cần document rõ.
- Flow accept job hiện vừa notification vừa email, phù hợp chuyển sang async.
- Cần rà null-safety cho account request hoặc source DTO ở một số flow.

Đề xuất cải tiến:

- Áp dụng outbox cho job/company domain events.
- Chuyển email/notification side effects sang Kafka command.
- Giữ HTTP fallback trong giai đoạn rollout.
- Domain events ưu tiên:
  - `JobApplicationSubmitted`.
  - `JobApplicationAccepted`.
  - `JobApplicationRejected`.
  - `HrPromotionRequested`.
  - `HrLeftCompany`.

### 3.6. notification-service

Đã xác nhận từ source code:

- Port mặc định: `8084`.
- Database: MySQL `notification1`.
- Table: `notifications`.
- Base path: `/notification`.
- Endpoint:
  - `POST /notification/create`.
  - `POST /notification/update`.
  - `GET /notification/user/findByUser?userId=...`.
  - `GET /notification/getAll`.
- Khi find notification theo user, service gọi user-service để validate user.
- README ghi Kafka không thuộc baseline runtime vì Spring service không có active listener/producer flow.

Điểm mạnh:

- Service nhỏ, dễ chuyển thành consumer đầu tiên.
- Có tests cho resource, mapper, repository và error mapping.

Rủi ro và technical debt:

- Gateway để `/notification/**` public nhưng service có một số validation nội bộ.
- Hiện notification chủ yếu được tạo qua HTTP call từ service khác.
- Không có Kafka implementation dù tên miền này rất phù hợp với async messaging.

Đề xuất cải tiến:

- Thêm consumer Kafka cho `javanc.notification.commands`.
- Giữ REST endpoint hiện tại để backward compatibility.
- Thêm idempotency storage cho command/event id đã xử lý.
- Thêm DLQ cho command lỗi.

### 3.7. image-service

Đã xác nhận từ source code:

- Port mặc định: `8083`.
- Database: MySQL `image`.
- Base path: `/image`.
- Endpoint:
  - `POST /image/save`.
  - `GET /image/getAll`.
  - `GET /image/preview`.
  - `GET /image/files/{filename}`.
- Hỗ trợ upload JPEG, PNG, WEBP bằng kiểm tra magic bytes.
- Có Cloudinary adapter và local file serving.

Điểm mạnh:

- Kiểm tra file type dựa trên nội dung, không chỉ content type.
- Metadata ảnh đầy đủ hơn contract cũ.
- Có test cho upload, preview, mapper, id generator.

Rủi ro và technical debt:

- Schema dùng `hibernate-orm.schema-management.strategy=update`, cần cân nhắc migration rõ khi production.
- Khi DB fail sau Cloudinary upload, cleanup chỉ được log cảnh báo. Cần cơ chế cleanup/retry tốt hơn nếu production yêu cầu.

Đề xuất cải tiến:

- Dùng migration schema rõ thay vì phụ thuộc `update` trong production.
- Thêm job cleanup orphan image nếu upload external thành công nhưng persist metadata fail.
- Không cần Kafka ở phase đầu trừ khi có nhu cầu xử lý ảnh async.

### 3.8. email-service

Đã xác nhận từ source code:

- Port mặc định: `8087`.
- Không có database trong source hiện tại.
- Base path public nội bộ:
  - `POST /email/create`.
  - `POST /internal/emails/verification-otp`.
- Dùng Quarkus Mailer.
- Có `MAIL_MOCK`.
- Có config Kafka nhưng chưa có code producer/consumer.

Điểm mạnh:

- Tách mail sending khỏi user/manager service.
- Có endpoint OTP nội bộ.
- Có mock mailer cho test/local.

Rủi ro và technical debt:

- Không có persistence/idempotency nên nếu chuyển sang Kafka consumer phải bổ sung storage hoặc một cơ chế idempotency.
- Chưa có retry/DLQ cho mail fail.
- Kafka config tồn tại nhưng chưa dùng, dễ gây hiểu nhầm.

Đề xuất cải tiến:

- Thêm Kafka consumer cho `javanc.email.commands`.
- Thêm idempotency store cho `commandId` hoặc `idempotencyKey`.
- Giữ REST endpoint hiện tại trong giai đoạn rollout.
- Với email OTP, chuyển dần từ HTTP direct call sang async command.

## 4. Điểm Mạnh Hiện Tại

Đã xác nhận từ source code:

- Backend đã được tách theo microservices tương đối rõ miền nghiệp vụ.
- Quarkus service đã có package/tầng rõ: resource, application service, domain, infrastructure, mapper, exception mapper.
- User-service có kiến trúc ports/adapters rõ nhất.
- JWT/OTP/role request là nền tảng authentication/authorization tốt hơn legacy direct role update.
- Gateway route đơn giản và dễ hiểu.
- Các service đã có health/openapi extension.
- Test coverage đã có ở từng module, gồm resource, mapper, service và một số repository.
- `user-service` đã dùng Flyway cho schema quan trọng.
- Các `.env.example` tồn tại cho từng service.
- Email nội bộ không expose qua gateway, phù hợp nguyên tắc giảm public surface.

## 5. Rủi Ro Và Technical Debt

### 5.1. Contract và compatibility

Đã xác nhận từ source code:

- Một số endpoint legacy đã bị remove có chủ đích ở `user-service` và `profile-service`.
- Một số endpoint legacy vẫn được giữ ở `project-service` và `manager-service`.
- `manager-service` giữ các tên cũ/sai chính tả như `idProfiePending`, `setmaanagertocompany`.
- Direct role change endpoint tồn tại nhưng logic hiện tại disabled.

Rủi ro:

- Frontend hoặc service consumer có thể dùng nhầm endpoint legacy/current.
- README/API docs nếu không tách rõ sẽ gây hiểu nhầm.

Đề xuất:

- Tạo API contract table theo service.
- Gắn nhãn `current`, `legacy compatibility`, `internal`.
- Không remove legacy API nếu chưa có migration plan cho frontend.

### 5.2. Downstream side effects qua HTTP

Đã xác nhận từ source code:

- `user-service` gọi email/notification.
- `manager-service` gọi user/profile/image/notification/email.
- `project-service` gọi user/profile/image/notification.
- `profile-service` gọi user/image.

Rủi ro:

- Partial failure khi business data đã lưu nhưng email/notification fail.
- Latency tăng do chained HTTP calls.
- Retry thủ công dễ tạo duplicate side effects.

Đề xuất:

- Chuyển email/notification side effects sang Kafka command.
- Dùng outbox để publish event sau DB commit.
- Consumer phải idempotent.

### 5.3. Kafka foundation mới ở mức nội bộ

Baseline Phase 1 đã xác nhận:

- Không có `quarkus-messaging-kafka` trong `pom.xml`.
- Không có annotation `@Incoming`, `@Outgoing`.
- Không có `Emitter` hoặc `MutinyEmitter`.
- Chỉ có Kafka properties còn sót trong `email-service`.

Trạng thái sau Phase 4:

- Đã có `quarkus-messaging-kafka` ở 5 service tham gia Kafka foundation.
- Đã có producer skeleton ở `user-service`, `manager-service`, `project-service`.
- Đã có consumer skeleton ở `email-service`, `notification-service`.
- Kafka vẫn disabled mặc định và chưa là đường business runtime bắt buộc.
- Chưa có outbox/idempotency/retry/DLQ runtime.

Rủi ro:

- Người đọc tưởng Kafka đã thay HTTP side effect trong khi Phase 4 chỉ là foundation.
- Nếu bật Kafka cho business flow trực tiếp mà không có outbox/idempotency, hệ thống dễ mất event hoặc xử lý trùng.

Đề xuất:

- Document rõ `MESSAGING_ENABLED=false` là default.
- Chỉ bật Kafka cho business flow sau khi có outbox, retry/DLQ và idempotency.

### 5.4. Database migration chưa đồng đều

Đã xác nhận từ source code:

- `user-service` dùng Flyway.
- Các service MySQL khác dùng Hibernate schema update/drop-and-create theo profile.
- MongoDB service chưa có migration framework rõ trong source hiện tại.

Rủi ro:

- Production schema drift.
- Khó rollback.
- Khó kiểm soát breaking schema changes.

Đề xuất:

- MySQL service nên dùng Flyway hoặc migration tool tương đương.
- MongoDB cần có migration policy/document rõ.
- Không dùng schema update trong production nếu cần kiểm soát chặt.

### 5.5. Observability chưa đầy đủ

Đã xác nhận từ source code:

- Có SmallRye Health/OpenAPI.
- Chưa thấy request id/correlation id thống nhất.
- Chưa thấy metrics nghiệp vụ hoặc distributed tracing rõ ràng.

Rủi ro:

- Khó debug request đi qua nhiều service.
- Khó đo lỗi downstream/Kafka/mail.

Đề xuất:

- Chuẩn hóa `X-Request-Id`.
- Structured logging.
- Metrics request/downstream/Kafka.
- Tracing ở phase production hardening nếu chọn stack phù hợp.

## 6. Roadmap Cải Tiến Theo Phase

### Phase 1: Chuẩn hóa nền tảng hiện tại

Mục tiêu: làm backend hiện tại rõ ràng, ổn định, dễ vận hành trước khi thêm Kafka.

Phạm vi:

- Không đổi HTTP endpoint public.
- Không đổi business behavior.
- Không thêm Kafka runtime.
- Tập trung tài liệu, baseline, config, contract.

Việc cần làm:

1. Chuẩn hóa tài liệu:
   - Tạo tài liệu phân tích backend chuyên sâu.
   - Ghi rõ module, port, database, route, service dependency.
   - Ghi rõ Kafka hiện chưa dùng thật.
   - Ghi rõ legacy endpoint nào bị remove và endpoint nào còn giữ.
2. Chuẩn hóa config:
   - So sánh `.env.example` với `application.properties`.
   - Nhóm biến theo database, JWT/OTP, service URL, mail, Cloudinary, gateway, Kafka future.
   - Đảm bảo `.env`, credential, `target/`, IDE local không được commit.
3. Chuẩn hóa API contract:
   - Giữ wrapper `ApiResponse { success, message, data }`.
   - Ghi rõ error response hiện chưa đồng nhất giữa `null` và empty string.
   - Không đổi endpoint trong Phase 1.
4. Chuẩn hóa health/readiness:
   - Dùng `/q/health` làm baseline.
   - Ghi backlog thêm readiness check DB/downstream ở Phase 3.
5. Chuẩn hóa test baseline:
   - Chạy `mvn test` từ `quarkus/`.
   - Ghi lại module pass/fail.
   - Không sửa behavior khi chưa có test chứng minh.

Kết quả kỳ vọng:

- Người mới vào project hiểu kiến trúc backend trong 30-60 phút.
- Biết chính xác service nào gọi service nào.
- Biết Kafka chưa hoạt động thật.
- Có roadmap rõ cho các phase tiếp theo.

#### Phase 1 implementation verification - 2026-05-14

Phạm vi đã thực hiện:

- `docs/backend-analysis-roadmap.md` là artifact chính của Phase 1.
- Không chỉnh root `README.md`.
- Không chỉnh Java code, `application.properties`, Maven dependency, schema, endpoint hoặc frontend.
- Health baseline vẫn là `/q/health`; readiness DB/downstream chi tiết giữ ở backlog Phase 3.

Documentation/source validation:

| Hạng mục | Kết quả |
|---|---|
| 8 service, port, database, route, dependency | Đã document trong các section hiện trạng và phân tích theo service |
| Gateway public/protected route và `/email/**` | Đã document: gateway không expose `/email/**` |
| Current/legacy/internal endpoint | Đã document ở từng service; Phase 2 sẽ tách bảng contract chi tiết hơn |
| `.env.example` theo service | Đã xác nhận cả 8 service có `.env.example` |
| `.gitignore` | Đã xác nhận ignore `.env`, `**/.env`, `target/`, `.idea/`, `.vscode/` |
| Kafka dependency/code | Đã xác nhận không có `quarkus-messaging-kafka`, `smallrye-kafka`, `@Incoming`, `@Outgoing`, `Emitter`, producer hoặc consumer |
| Kafka config còn tồn tại | Chỉ thấy `kafka.bootstrap.servers` và `email.kafka.group-id` trong `email-service`, chưa có code dùng Kafka |

Baseline test notes:

- Lệnh `mvn test` từ `quarkus/` fail nếu dùng Maven mặc định vì `JAVA_HOME` đang trỏ JDK 17, trong khi project yêu cầu Java 21.
- Khi override `JAVA_HOME=C:\Program Files\Java\jdk-21`, full reactor vẫn fail tại `user-service`, nên các module còn lại được chạy riêng theo plan.
- Không sửa behavior trong Phase 1; các lỗi dưới đây chỉ được ghi nhận làm baseline.

| Module | Command | Kết quả |
|---|---|---|
| `user-service` | `mvn -pl user-service test` với JDK 21 | Fail: 20 tests run, 5 failures. Các failure nằm trong `UserServiceContractTest`, cùng nguyên nhân login `test.admin@example.com` trả `401` thay vì `200` |
| `gateway-service` | `mvn -pl gateway-service test` với JDK 21 | Pass: 16 tests |
| `profile-service` | `mvn -pl profile-service test` với JDK 21 | Pass: 22 tests |
| `project-service` | `mvn -pl project-service test` với JDK 21 | Pass: 26 tests |
| `manager-service` | `mvn -pl manager-service test` với JDK 21 | Pass: 15 tests |
| `notification-service` | `mvn -pl notification-service test` với JDK 21 | Pass: 17 tests |
| `image-service` | `mvn -pl image-service test` với JDK 21 | Pass: 18 tests |
| `email-service` | `mvn -pl email-service test` với JDK 21 | Pass: 15 tests |

User-service failing tests recorded:

- `UserServiceContractTest.usersEndpointsEnforceBearerTokenAndAdminAuthorization`
- `UserServiceContractTest.adminAccountsCannotBeDisabledOrDeleted`
- `UserServiceContractTest.roleRequestsControlManagerAndHrPromotionWorkflows`
- `UserServiceContractTest.managerUpgradeRequiresAdminApproval`
- `UserServiceContractTest.profileUpdatesRejectDuplicateEmailAndEmployeeId`

### Phase 2: Làm sạch contract và consistency

Mục tiêu: giảm rủi ro khi frontend/service khác gọi API.

Phạm vi:

- Không xóa endpoint legacy.
- Không đổi response shape chính.
- Có thể thêm tài liệu deprecation/compatibility.

Việc cần làm:

1. Tạo API contract table theo service:
   - Endpoint.
   - Method.
   - Auth requirement.
   - Current/legacy/internal.
   - Notes.
2. Làm rõ gateway boundary:
   - `/notification/**` public ở gateway nhưng một số flow validate user nội bộ.
   - `/email/**` không expose.
3. Chuẩn hóa error response:
   - Chọn một policy cho `data` khi lỗi: ưu tiên `null`.
   - Giữ backward compatibility nếu frontend đang phụ thuộc empty string.
   - Có test trước khi đổi behavior.
4. Gắn nhãn legacy:
   - `project-service`: `/project/user/save`, `/project/user/update`, `/project/user/getProject`, `/project/user/get`, `/project/user/get1`.
   - `manager-service`: `idHR`, `idProfiePending`, `/setmaanagertocompany`.
5. Đề xuất API versioning:
   - Không bắt buộc ngay.
   - Nếu cần, thêm `/v1` cho API mới trong future phase, giữ old path.

Kết quả kỳ vọng:

- Frontend biết nên dùng endpoint nào.
- Backend team biết endpoint nào là compatibility debt.
- Error contract dễ test và dễ document hơn.

#### Phase 2 implementation target

- Artifact chính: `docs/backend-api-contract.md`.
- Phạm vi đã chọn: documentation hardening và characterization tests, không normalize runtime error response trong Phase 2.
- Root `README.md` giữ nguyên.
- Không xóa, đổi tên, version hóa, hoặc di chuyển endpoint.
- Error policy mong muốn cho lỗi mới là `success=false`, `message=string`, `data=null`, nhưng behavior hiện tại như `data=""` được giữ và document là compatibility behavior.

#### Phase 2 implementation verification - 2026-05-14

Đã thực hiện:

- Tạo `docs/backend-api-contract.md` từ source Quarkus hiện tại.
- Ghi rõ gateway boundary, current/legacy/internal endpoint, compatibility behavior và error policy mong muốn.
- Thêm characterization test cho `/notification/**` public ở gateway.
- Thêm characterization test cho compatibility endpoint `/manager/manager/setmaanagertocompany`.
- Xác nhận test hiện có đã cover legacy `/profile/**` removed, project current/legacy endpoints, user legacy auth endpoints removed, `/email/**` và `/internal/emails/**` không expose qua gateway.

Kết quả test với JDK 21:

| Module | Kết quả |
|---|---|
| `gateway-service` | Pass: 17 tests |
| `manager-service` | Pass: 16 tests |
| `user-service` | Fail known baseline: 20 tests run, 5 failures trong `UserServiceContractTest`, login `test.admin@example.com` trả `401` thay vì `200` |

### Phase 3: Resilience, observability và vận hành

Mục tiêu: backend có nền tảng production tốt hơn trước khi async hóa.

Việc cần làm:

1. Request/correlation id:
   - Gateway nhận hoặc tạo `X-Request-Id`.
   - Các service log `X-Request-Id`.
   - REST clients forward `Authorization` và `X-Request-Id`.
2. Structured logging:
   - Log service name, request id, method, path, status, latency.
   - Không log token/password/OTP/secret.
3. Downstream resilience:
   - Đặt timeout rõ cho REST clients.
   - Quy định lỗi downstream:
     - Auth validation fail: 401/403 theo contract hiện tại.
     - Downstream unavailable: 503.
     - Business validation fail: mapped domain error.
   - Retry chỉ áp dụng cho idempotent hoặc async side effect, không retry mù mọi POST.
4. Metrics:
   - HTTP request count/error/latency.
   - Downstream call count/error/latency.
   - Mail send success/fail.
   - Notification create/update.
   - Kafka publish/consume/retry/DLQ từ Phase 4 trở đi.
5. Readiness:
   - DB readiness cho service có DB.
   - Downstream readiness nên tách khỏi liveness để tránh restart dây chuyền.

Kết quả kỳ vọng:

- Debug lỗi liên-service dễ hơn.
- Có cơ sở đo trước/sau khi thêm Kafka.
- Runtime behavior rõ khi dependency fail.

#### Phase 3 implementation verification - 2026-05-14

Da thuc hien:

- Them `quarkus-micrometer-registry-prometheus` va `quarkus-logging-json` cho 8 Quarkus service.
- Them request correlation filter cho moi service:
  - Nhan hoac tao `X-Request-Id`.
  - Validate request id bang allow-list ky tu va gioi han 128 ky tu.
  - Tra `X-Request-Id` tren response.
  - Dua request id vao MDC va log access theo `service`, `requestId`, `method`, `path`, `status`, `latencyMs`.
- Gateway va REST client header factories propagate `X-Request-Id`; propagation `Authorization` hien co duoc giu.
- Them Prometheus metrics endpoint `/q/metrics`.
- Them custom metrics `javanc_http_server_requests`, `javanc_downstream_http_client_requests`, `javanc_email_send_total`, `javanc_notification_operations_total`.
- Them liveness/readiness check co ban cho 8 service: `/q/health`, `/q/health/live`, `/q/health/ready`.
- Them REST client timeout config. Quarkus REST client hien tai yeu cau gia tri millisecond dang `long`, nen default duoc cau hinh la `DOWNSTREAM_CONNECT_TIMEOUT=1000` va `DOWNSTREAM_READ_TIMEOUT=3000`.
- Them mapper `ProcessingException -> 503 Service Unavailable` cho cac service co outbound REST clients.
- Khong them Kafka dependency/config runtime moi.
- Khong doi HTTP business endpoint, request body, success response shape, schema, role rule hoac frontend.
- Root `README.md` khong bi chinh trong Phase 3.

Ghi chu test fixture:

- `user-service` contract tests truoc do bi anh huong boi local `.env` (`USER_ADMIN_EMAIL`) nen login admin test co the fail.
- Phase 3 them `QuarkusTestProfile` rieng cho `UserServiceContractTest` de khoa fixture test ve `test.admin@example.com`; day la thay doi test-only, khong doi runtime bootstrap behavior.

Ket qua test voi JDK 21:

| Module | Ket qua |
|---|---|
| `user-service` | Pass: 21 tests |
| `gateway-service` | Pass: 20 tests |
| `profile-service` | Pass: 23 tests |
| `image-service` | Pass: 19 tests |
| `manager-service` | Pass: 17 tests |
| `notification-service` | Pass: 18 tests |
| `project-service` | Pass: 27 tests |
| `email-service` | Pass: 16 tests |

Lenh baseline da chay:

```powershell
$env:JAVA_HOME='C:\Program Files\Java\jdk-21'
$env:Path='C:\Program Files\Java\jdk-21\bin;' + $env:Path
cd quarkus
mvn test
```

Tong ket: full reactor pass, 161 tests, 0 failures, 0 errors, 0 skipped.

### Phase 4: Kafka foundation

Mục tiêu: thêm Kafka nhưng không phá HTTP flow hiện tại.

Phạm vi:

- Không thay đổi HTTP API public.
- Kafka là internal interface.
- Chỉ thêm dependency vào service có producer/consumer thật.

Service tham gia:

- Producer trước:
  - `user-service`.
  - `manager-service`.
  - `project-service` nếu có notification/email side effect cần async hóa.
- Consumer trước:
  - `email-service`.
  - `notification-service`.

Dependency đề xuất:

- Thêm `quarkus-messaging-kafka` vào:
  - `email-service`.
  - `notification-service`.
  - `user-service`.
  - `manager-service`.
  - `project-service` nếu triển khai project events.

Topic đề xuất:

| Topic | Mục đích |
|---|---|
| `javanc.user.events` | Domain events từ user-service |
| `javanc.manager.events` | Domain events từ manager-service |
| `javanc.project.events` | Domain events từ project-service |
| `javanc.email.commands` | Command yêu cầu gửi email |
| `javanc.notification.commands` | Command yêu cầu tạo notification |
| `javanc.email.commands.dlq` | DLQ cho email command |
| `javanc.notification.commands.dlq` | DLQ cho notification command |
| `javanc.domain-events.dlq` | DLQ chung cho domain event lỗi |

Feature flag:

- `MESSAGING_ENABLED=false` mặc định ở rollout đầu.
- Khi `false`, giữ HTTP side effect hiện tại.
- Phase 4 hiện tại không wire Kafka publisher vào business transaction chính.
- Khi `MESSAGING_ENABLED=true`, Kafka chỉ nên dùng cho component/integration verification hoặc staging experiment có kiểm soát.
- Production async flow chỉ bật sau Phase 5 khi đã có outbox/idempotency và retry/DLQ.
- Có thể bật theo service/topic nếu cần rollout nhỏ hơn.

Kết quả kỳ vọng:

- Kafka có contract rõ.
- Không có "Kafka config nhưng không dùng".
- Có đường rollback bằng feature flag.

#### Phase 4 implementation verification - 2026-05-14

Trang thai da implement:

- Them `quarkus-messaging-kafka` chi vao 5 service co producer/consumer skeleton:
  - Producer skeleton: `user-service`, `manager-service`, `project-service`.
  - Consumer skeleton: `email-service`, `notification-service`.
  - Khong them Kafka dependency vao `gateway-service`, `profile-service`, `image-service`.
- Them Kafka config disabled mac dinh:
  - `MESSAGING_ENABLED=false`.
  - `KAFKA_BOOTSTRAP_SERVERS=localhost:9092`.
  - `KAFKA_DEV_SERVICES_ENABLED=false` mac dinh de baseline test khong can broker/Docker.
  - Channel topic names dung contract `javanc.user.events`, `javanc.manager.events`, `javanc.project.events`, `javanc.email.commands`, `javanc.notification.commands`.
- Them envelope code rieng theo service, khong tao shared module moi:
  - `EventEnvelope` cho producer domain events.
  - `CommandEnvelope` cho email/notification commands.
  - Validate metadata bat buoc va `payloadVersion >= 1`.
- Producer skeleton chi publish khi `messaging.enabled=true`; khi disabled thi no-op va record metric `javanc_kafka_publish_total{outcome=disabled}`.
- Consumer skeleton o `email-service` va `notification-service` chi parse/validate envelope, log metadata va record metric `javanc_kafka_consume_total`; khong gui mail hoac tao notification that trong Phase 4.
- Them Kafka Companion/Testcontainers test trong `user-service` de bat `email-commands-out` va xac nhan publish duoc 1 message vao topic `javanc.email.commands`.
- Khong them outbox schema, idempotency store, retry/DLQ runtime hoac async business flow; cac noi dung do giu cho Phase 5/6.
- Khong doi HTTP endpoint path, request body, response success shape, auth rule, schema hoac frontend.
- Root `README.md` khong bi chinh trong Phase 4.

Notes/gaps con lai sau Phase 4:

- Kafka broker-backed integration test hien moi cover 1 representative producer path o `user-service` -> `javanc.email.commands`.
- `manager-service` va `project-service` co producer skeleton/component tests, nhung chua co broker-backed publish test rieng.
- `email-service` va `notification-service` co consumer validation/component tests, nhung chua co broker-backed incoming channel test qua Kafka Companion.
- Chua co DLQ topic creation, retry policy, consumer lag dashboard, broker health/readiness check, schema registry, hoac contract test cross-service cho payload domain that.
- Chua co outbox/idempotency store nen consumer handler khong duoc gui mail/tao notification that trong Phase 4.
- Neu bat `MESSAGING_ENABLED=true` ngoai test/staging, phai coi day la experimental foundation, khong phai production async delivery path.

Test da chay:

```powershell
$env:JAVA_HOME='C:\Program Files\Java\jdk-21'
$env:Path='C:\Program Files\Java\jdk-21\bin;' + $env:Path
cd quarkus
mvn -pl user-service,manager-service,project-service,email-service,notification-service test
```

Ket qua touched-module baseline: pass, 109 tests, 0 failures, 0 errors, 0 skipped.

```powershell
$env:JAVA_HOME='C:\Program Files\Java\jdk-21'
$env:Path='C:\Program Files\Java\jdk-21\bin;' + $env:Path
cd quarkus
mvn test
```

Ket qua full reactor: pass, 171 tests, 0 failures, 0 errors, 0 skipped.

Module summary:

| Module | Tests | Result |
|---|---:|---|
| `user-service` | 25 | Pass |
| `gateway-service` | 20 | Pass |
| `profile-service` | 23 | Pass |
| `image-service` | 19 | Pass |
| `manager-service` | 18 | Pass |
| `notification-service` | 20 | Pass |
| `project-service` | 28 | Pass |
| `email-service` | 18 | Pass |

### Phase 5: Outbox pattern và idempotency

Mục tiêu: tránh mất event khi DB commit thành công nhưng Kafka publish fail.

MySQL outbox đề xuất:

```sql
CREATE TABLE outbox_event (
    id VARCHAR(36) NOT NULL,
    aggregate_type VARCHAR(100) NOT NULL,
    aggregate_id VARCHAR(100) NOT NULL,
    event_type VARCHAR(150) NOT NULL,
    payload JSON NOT NULL,
    status VARCHAR(32) NOT NULL,
    attempt_count INT NOT NULL DEFAULT 0,
    next_attempt_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL,
    published_at TIMESTAMP NULL,
    PRIMARY KEY (id)
);
```

MongoDB outbox document đề xuất:

```json
{
  "_id": "uuid",
  "aggregateType": "Job",
  "aggregateId": "123",
  "eventType": "JobApplicationAccepted",
  "payload": {},
  "status": "PENDING",
  "attemptCount": 0,
  "nextAttemptAt": "ISO-8601",
  "createdAt": "ISO-8601",
  "publishedAt": null
}
```

Consumer idempotency store đề xuất:

```text
processed_message
- id
- idempotency_key
- message_type
- processed_at
- status
```

Rules:

- Business transaction và outbox record phải commit cùng nhau nếu service có database transaction.
- Publisher chỉ publish record `PENDING` hoặc retry-due.
- Publish thành công thì mark `PUBLISHED`.
- Publish fail thì tăng `attempt_count`, set `next_attempt_at`.
- Quá retry thì mark `FAILED` và gửi DLQ nếu publisher còn khả năng gửi.
- Consumer phải check `idempotencyKey` trước khi gửi email/tạo notification.

Kết quả kỳ vọng:

- Không mất event khi Kafka tạm thời lỗi.
- Không gửi email/notification trùng khi consumer retry.
- Có dữ liệu vận hành để điều tra message fail.

#### Phase 5 implementation verification - 2026-05-14

Trang thai da implement:

- Them outbox foundation cho producer services:
  - `user-service`: MySQL `outbox_event` bang Flyway migration `V5__add_outbox_event.sql`.
  - `project-service`: JPA `outbox_event` dung schema-management hien co.
  - `manager-service`: Mongo `outbox_event` document/repository; index creation co flag `OUTBOX_MONGO_ENSURE_INDEXES=false` mac dinh de local/test khong bi ep ket noi Mongo.
- Them outbox publisher worker cho `user-service`, `project-service`, `manager-service`:
  - Worker chi poll khi `OUTBOX_PUBLISHER_ENABLED=true` va `MESSAGING_ENABLED=true`.
  - Default van tat: `OUTBOX_PUBLISHER_ENABLED=false`, `MESSAGING_ENABLED=false`.
  - Success mark `PUBLISHED`; failure tang `attemptCount`, set `nextAttemptAt`; qua `OUTBOX_MAX_ATTEMPTS=5` mark `FAILED`.
- Them consumer idempotency foundation:
  - `email-service`: them MySQL/H2/Flyway va table `processed_message`.
  - `notification-service`: them JPA `processed_message` theo datasource/schema strategy hien co.
  - Duplicate `idempotencyKey` da `PROCESSED` duoc ack va khong xu ly lai.
  - Handler Kafka van la safe stub; chua gui mail that hoac tao notification that trong Phase 5.
- Them metrics:
  - `javanc_outbox_records_total{service,status,messageType}`.
  - `javanc_outbox_publish_attempt_total{service,topic,outcome}`.
  - `javanc_consumer_idempotency_total{service,messageType,outcome}`.
- Cap nhat `.env.example` cho config moi cua outbox, Kafka topic va email DB.
- Khong doi HTTP endpoint path, request body, response success shape, auth rule, frontend hoac root `README.md`.

Notes/gaps con lai sau Phase 5:

- Outbox code chua duoc wire vao business transaction hien tai; Phase 6 moi dual-write/rollout tung use case.
- DLQ topic routing, schema registry, consumer lag dashboard va real retry/DLQ policy van la Phase 6+.
- Email/notification Kafka consumer chua thuc hien side effect that; chi validate envelope, idempotency guard va metrics.
- `project-service` va `notification-service` chua chuyen sang Flyway de tranh migration blast radius.

Test da chay:

```powershell
$env:JAVA_HOME='C:\Program Files\Java\jdk-21'
$env:Path='C:\Program Files\Java\jdk-21\bin;' + $env:Path
cd quarkus
mvn test
```

Ket qua full reactor: pass, 185 tests, 0 failures, 0 errors, 0 skipped.

Module summary:

| Module | Tests | Result |
|---|---:|---|
| `user-service` | 29 | Pass |
| `gateway-service` | 20 | Pass |
| `profile-service` | 23 | Pass |
| `image-service` | 19 | Pass |
| `manager-service` | 21 | Pass |
| `notification-service` | 22 | Pass |
| `project-service` | 31 | Pass |
| `email-service` | 20 | Pass |

### Phase 6: Kafka use cases triển khai trước

Mục tiêu: dùng Kafka ở nơi có giá trị rõ nhất, không chuyển toàn hệ thống vội.

Use case 1: Email OTP

- Producer: `user-service`.
- Consumer: `email-service`.
- Command: `SendVerificationOtpEmail`.
- Topic: `javanc.email.commands`.
- Rollout:
  - Bước 1: user-service vẫn gọi HTTP, đồng thời ghi outbox ở test/staging.
  - Bước 2: bật Kafka cho OTP trong staging.
  - Bước 3: production bật `MESSAGING_ENABLED=true`.
  - Bước 4: giữ HTTP fallback đến khi metrics ổn định.

Use case 2: Role/HR notification

- Producer: `user-service` hoặc `manager-service`.
- Consumer: `notification-service`.
- Commands/events:
  - `RoleRequestCreated`.
  - `HrPromotionRequested`.
  - `HrPromotionAccepted`.
- Topic:
  - Event topic theo source service.
  - Hoặc command topic `javanc.notification.commands` nếu producer quyết định message cần notification cụ thể.

Use case 3: Job application

- Producer: `manager-service`.
- Consumer:
  - `notification-service`.
  - `email-service`.
- Events:
  - `JobApplicationSubmitted`.
  - `JobApplicationAccepted`.
  - `JobApplicationRejected`.

Quy tắc chọn event vs command:

- Domain event mô tả chuyện đã xảy ra: `JobApplicationAccepted`.
- Command yêu cầu side effect cụ thể: `SendJobAcceptedEmail`, `CreateNotification`.
- Với phase đầu, có thể cho application service phát command trực tiếp để ít thay đổi hơn.
- Với phase trưởng thành hơn, phát domain event và để consumer/policy service quyết định side effect.

Kết quả kỳ vọng:

- Email và notification không còn chặn transaction chính.
- Có retry/DLQ.
- HTTP fallback vẫn tồn tại trong giai đoạn chuyển đổi.

#### Phase 6 implementation verification - 2026-05-14

Trang thai da implement:

- Them rollout flags, mac dinh an toan:
  - `ASYNC_OTP_EMAIL_ENABLED=false`.
  - `ASYNC_ROLE_NOTIFICATION_ENABLED=false`.
  - `ASYNC_JOB_SIDE_EFFECTS_ENABLED=false`.
  - `ASYNC_HTTP_FALLBACK_ENABLED=true`.
  - `KAFKA_CONSUMER_SIDE_EFFECTS_ENABLED=false`.
  - `KAFKA_DLQ_ENABLED=false`.
- Wire producer business use cases vao outbox:
  - `user-service`: OTP email tao command `SendVerificationOtpEmail` khi async flag bat.
  - `user-service`: role/HR notification tao command `CreateNotification` khi async flag bat va `role.notifications.enabled=true`.
  - `manager-service`: job accept email/notification adapter tao command `SendUserMessageEmail` va `CreateNotification` khi async job flag bat.
- Wire consumer side effects that, nhung van bi khoa bang `KAFKA_CONSUMER_SIDE_EFFECTS_ENABLED`:
  - `email-service`: `SendVerificationOtpEmail` goi mail OTP; `SendUserMessageEmail` gui mail theo user id.
  - `notification-service`: `CreateNotification` persist notification.
  - Duplicate `idempotencyKey` van khong xu ly side effect lan hai.
- Them DLQ metadata publisher toi `javanc.email.commands.dlq` va `javanc.notification.commands.dlq` khi `KAFKA_DLQ_ENABLED=true`.
  - DLQ chi ghi metadata da sanitize, khong copy raw payload co OTP.
- Them metric:
  - `javanc_async_side_effect_total{service,useCase,path,outcome}`.
  - `javanc_kafka_dlq_total{service,topic,commandType,outcome}`.
- Cap nhat `.env.example` cho rollout flags va DLQ topic.
- Khong doi HTTP endpoint path, request body, response success shape, auth rule, frontend hoac root `README.md`.

Notes/gaps con lai sau Phase 6:

- Kafka async business flow van phai bat theo tung flag; local/baseline mac dinh chay HTTP nhu cu.
- Mongo outbox cua `manager-service` la best-effort theo kien truc hien tai; transaction-grade Mongo outbox co the dua sang phase sau.
- Broker-backed Kafka tests can Docker/Testcontainers; moi truong hien tai khong co Docker nen full reactor bi chan o Kafka Companion tests neu chay tat ca.
- Schema registry, consumer lag dashboard va production topic retention policy van la follow-up; Docker Compose local runtime duoc xu ly o Phase 7 ben duoi.

Test da chay:

```powershell
$env:JAVA_HOME='C:\Program Files\Java\jdk-21'
$env:Path='C:\Program Files\Java\jdk-21\bin;' + $env:Path
cd quarkus
mvn -pl user-service,manager-service,email-service,notification-service -DskipTests compile
mvn -pl user-service -Dtest='!*KafkaDevServicesPublisherTest' test
mvn -pl manager-service -Dtest='!*KafkaDevServicesOutboxTest' test
mvn -pl notification-service,email-service test
```

Ket qua:

| Module | Tests | Result |
|---|---:|---|
| `user-service` | 29 | Pass, excluded Docker-backed Kafka Companion test |
| `manager-service` | 22 | Pass, excluded Docker-backed Kafka Companion test |
| `notification-service` | 23 | Pass |
| `email-service` | 22 | Pass |

Full touched-module command `mvn -pl user-service,manager-service,email-service,notification-service test` da bi fail tai `KafkaDevServicesPublisherTest` vi Docker/Testcontainers khong tim thay Docker runtime tren may hien tai. Day la environment blocker, khong phai compile/runtime regression cua Phase 6.

### Phase 7: Docker Compose và local runtime

Mục tiêu: có môi trường local chạy đủ backend infrastructure.

Thành phần đề xuất:

- MySQL.
- MongoDB.
- Kafka broker.
- Kafka UI tùy chọn.
- Mail mock tùy chọn.
- Service Quarkus chạy bằng Maven local hoặc container.

Biến môi trường Kafka mới:

```properties
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
MESSAGING_ENABLED=false
mp.messaging.outgoing.user-events.connector=smallrye-kafka
mp.messaging.outgoing.user-events.topic=javanc.user.events
mp.messaging.incoming.email-commands.connector=smallrye-kafka
mp.messaging.incoming.email-commands.topic=javanc.email.commands
mp.messaging.incoming.email-commands.group.id=email-service-group
mp.messaging.incoming.notification-commands.connector=smallrye-kafka
mp.messaging.incoming.notification-commands.topic=javanc.notification.commands
mp.messaging.incoming.notification-commands.group.id=notification-service-group
```

Kết quả kỳ vọng:

- Developer mới chạy được infra local nhất quán.
- Kafka flow có thể test end-to-end.
- Không cần phụ thuộc Kafka nếu chỉ chạy baseline HTTP với `MESSAGING_ENABLED=false`.

#### Phase 7 implementation verification - 2026-05-14

Implemented:

- Added infra-only local runtime in `quarkus/docker-compose.yml`.
- Added MySQL 8.0 local database bootstrap for `portfolio`, `project1`, `notification1`, `image`, and `email`.
- Added MongoDB 7.0 local runtime with no auth to match current service connection strings.
- Added single-node Kafka KRaft runtime exposed on `localhost:9092`.
- Added Kafka UI on `http://localhost:9080`.
- Added Mailpit SMTP on `localhost:1025` and UI on `http://localhost:8025`.
- Added Kafka topic init script for:
  - `javanc.user.events`
  - `javanc.manager.events`
  - `javanc.project.events`
  - `javanc.email.commands`
  - `javanc.notification.commands`
  - `javanc.email.commands.dlq`
  - `javanc.notification.commands.dlq`
  - `javanc.domain-events.dlq`
- Local topic retention defaults:
  - events/commands: 7 days.
  - DLQ topics: 14 days.
- Added local env examples:
  - `quarkus/local/infra.env.example`
  - `quarkus/local/services-local.env.example`
  - `quarkus/local/kafka-e2e.env.example`
- Added Windows helper scripts:
  - `quarkus/scripts/local-infra-up.ps1`
  - `quarkus/scripts/local-infra-down.ps1`
  - `quarkus/scripts/local-infra-status.ps1`
- Added local runbook in `quarkus/local/README.md`.

Runtime boundary:

- Quarkus services still run by Maven local in Phase 7.
- No Quarkus app Dockerfile or service container was added.
- HTTP public contract, gateway routes, Kafka envelopes, endpoint paths, frontend, and root `README.md` were not changed.
- Kafka remains optional. Baseline local runtime keeps `MESSAGING_ENABLED=false`, `OUTBOX_PUBLISHER_ENABLED=false`, and async use-case flags disabled.

Validation result:

```powershell
docker compose -f quarkus/docker-compose.yml --env-file quarkus/local/infra.env.example config
```

Result: pass.

```powershell
docker compose -f quarkus/docker-compose.yml --env-file quarkus/local/infra.env.example up -d
```

Result: blocked in current environment because Docker Desktop daemon is not running or not installed. Error: `open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified`.

Additional checks:

- PowerShell helper scripts parse successfully.
- Full Maven reactor with Docker-backed Kafka tests excluded passed:
  - Command: `mvn -Dtest='!*KafkaDevServicesPublisherTest,!*KafkaDevServicesOutboxTest' test`
  - Result: build success across all 8 Quarkus services.
- Full Maven reactor without exclusions still fails in `user-service` at `KafkaDevServicesPublisherTest` because Testcontainers cannot find a Docker runtime.
- `README.md` and `client-react/src/index.css` have no Phase 7 diff.

Notes/gaps con lai sau Phase 7:

- Infra smoke with real containers must be rerun on a machine with Docker Desktop running.
- Kafka local E2E with Mailpit must be rerun after Docker starts.
- Production topic retention, schema registry, consumer lag dashboard, and app containerization remain future operational work.

## 7. Kafka Implementation Plan

### 7.1. Nguyên tắc thiết kế

Đề xuất cải tiến:

- Kafka là internal integration layer, không thay thế HTTP public API ngay.
- Producer không publish trực tiếp trong business transaction nếu service có DB; dùng outbox.
- Consumer phải idempotent.
- Mọi message phải có correlation id.
- Mọi message lỗi phải có retry/DLQ.
- Payload phải versioned.
- Không log payload chứa secret, token, OTP raw nếu không cần thiết.

### 7.2. Event envelope chuẩn

```json
{
  "eventId": "uuid",
  "eventType": "string",
  "occurredAt": "ISO-8601",
  "sourceService": "string",
  "aggregateType": "string",
  "aggregateId": "string",
  "correlationId": "string",
  "payloadVersion": 1,
  "payload": {}
}
```

Field rules:

| Field | Bắt buộc | Ý nghĩa |
|---|---|---|
| `eventId` | Có | UUID duy nhất cho event |
| `eventType` | Có | Tên event, ví dụ `JobApplicationAccepted` |
| `occurredAt` | Có | Thời điểm nghiệp vụ xảy ra |
| `sourceService` | Có | Service phát event |
| `aggregateType` | Có | Loại aggregate, ví dụ `User`, `Job`, `Project` |
| `aggregateId` | Có | ID aggregate |
| `correlationId` | Có | Theo request hoặc generated |
| `payloadVersion` | Có | Version schema payload |
| `payload` | Có | Dữ liệu event |

### 7.3. Command envelope chuẩn

```json
{
  "commandId": "uuid",
  "commandType": "string",
  "requestedAt": "ISO-8601",
  "sourceService": "string",
  "correlationId": "string",
  "idempotencyKey": "string",
  "payloadVersion": 1,
  "payload": {}
}
```

Field rules:

| Field | Bắt buộc | Ý nghĩa |
|---|---|---|
| `commandId` | Có | UUID duy nhất cho command |
| `commandType` | Có | Ví dụ `SendVerificationOtpEmail` |
| `requestedAt` | Có | Thời điểm yêu cầu side effect |
| `sourceService` | Có | Service phát command |
| `correlationId` | Có | Theo request hoặc generated |
| `idempotencyKey` | Có | Khóa chống xử lý trùng |
| `payloadVersion` | Có | Version schema payload |
| `payload` | Có | Dữ liệu command |

### 7.4. Email command payload đề xuất

OTP email:

```json
{
  "to": "user@example.com",
  "name": "User",
  "otp": "123456",
  "expiresInMinutes": 10
}
```

Job email:

```json
{
  "userId": 1,
  "email": "user@example.com",
  "subject": "Job application update",
  "message": "string"
}
```

Lưu ý:

- OTP raw đang cần để gửi email, nhưng không nên log payload này.
- Nếu lưu outbox payload chứa OTP raw, cần cân nhắc mã hóa hoặc TTL cleanup ngắn. Đây là đề xuất bảo mật cần quyết định khi triển khai code thật.

### 7.5. Notification command payload đề xuất

```json
{
  "userId": 1,
  "message": "string",
  "type": "JOB_APPLICATION",
  "metadata": {
    "jobId": 123,
    "companyId": 456
  }
}
```

Chưa xác định từ source code hiện tại:

- Notification type enum chính thức.
- Metadata schema chính thức.
- Frontend có cần grouping/read receipt nâng cao hay không.

### 7.6. Retry và DLQ

Đề xuất policy:

- Retry tối đa 5 lần.
- Backoff: 30 giây, 2 phút, 10 phút, 30 phút, 2 giờ.
- Consumer lỗi validation không retry nhiều lần; chuyển DLQ sớm.
- Consumer lỗi transient như SMTP timeout hoặc DB timeout thì retry.
- DLQ message phải giữ original message, error reason, failedAt, serviceName.

### 7.7. Ordering và partition key

Đề xuất:

- Partition key cho user events: `userId`.
- Partition key cho job events: `jobId`.
- Partition key cho notification command: `userId`.
- Partition key cho email command: `idempotencyKey` hoặc recipient email.

Mục tiêu:

- Giữ ordering theo aggregate quan trọng.
- Tránh một partition duy nhất bị hot nếu dùng constant key.

### 7.8. Rollout

Đề xuất rollout:

1. Thêm dependency/config Kafka nhưng `MESSAGING_ENABLED=false`.
2. Thêm outbox schema/collection.
3. Viết publisher nhưng chỉ bật ở test/staging.
4. Thêm consumer email/notification với idempotency.
5. Chạy dual path ở staging:
   - HTTP hiện tại vẫn hoạt động.
   - Kafka path được quan sát qua metrics/logs.
6. Bật từng topic ở production.
7. Khi Kafka ổn định, giảm dần HTTP side effect hoặc giữ fallback controlled.

### 7.9. Public interfaces

Đề xuất nguyên tắc public/internal interface:

- HTTP API hiện tại là public/service-facing contract chính trong Phase 1-3.
- Không đổi URL, method, response wrapper hoặc auth requirement của HTTP API khi chưa có migration riêng.
- Kafka topics là internal interface mới từ Phase 4 trở đi.
- Event envelope và command envelope là contract bắt buộc cho mọi message Kafka.
- `email-service` và `notification-service` vẫn giữ REST endpoint hiện tại để backward compatibility.
- Gateway không expose Kafka và tiếp tục không expose `/email/**`.
- Các endpoint legacy được giữ nhưng phải được document là compatibility API, không quảng bá như API mới.

## 8. Test Strategy

### 8.1. Documentation validation

Kiểm tra:

- Tài liệu không mô tả Kafka như đã được implement.
- Các phần chưa rõ ghi “Chưa xác định từ source code hiện tại”.
- API route, port, database khớp source.
- Legacy/current endpoint được gắn nhãn rõ.

### 8.2. Baseline backend tests

Chạy:

```bash
cd quarkus
mvn test
```

Nếu full reactor fail:

```bash
mvn -pl user-service test
mvn -pl gateway-service test
mvn -pl profile-service test
mvn -pl project-service test
mvn -pl manager-service test
mvn -pl notification-service test
mvn -pl image-service test
mvn -pl email-service test
```

Kỳ vọng:

- Ghi lại module pass/fail.
- Không sửa behavior nếu chưa hiểu nguyên nhân fail.

### 8.3. Kafka unit tests

Khi triển khai Kafka thật, cần test:

- Serialize/deserialize event envelope.
- Serialize/deserialize command envelope.
- Validate missing required fields.
- Duplicate `eventId`/`commandId` không tạo side effect trùng.
- Invalid payload vào mapped failure hoặc DLQ.
- Retry policy tính đúng `nextAttemptAt`.

### 8.4. Kafka integration tests

Đề xuất dùng:

- SmallRye in-memory connector cho unit/integration nhẹ.
- Testcontainers Kafka nếu muốn gần production hơn. Chưa xác định từ source code hiện tại có dùng Testcontainers hay không.

Scenarios:

- User registration tạo OTP email command.
- Email-service consume command và gọi mail sender mock.
- Manager accept job tạo notification command.
- Notification-service consume command và persist notification.
- Consumer nhận duplicate command không tạo notification/email trùng.
- Consumer fail transient thì retry.
- Consumer fail permanent thì DLQ.

### 8.5. Outbox tests

Scenarios:

- Business transaction tạo data và outbox record cùng lúc.
- Nếu transaction rollback thì không có outbox record.
- Publisher publish thành công thì mark `PUBLISHED`.
- Publisher fail thì tăng `attempt_count` và set `next_attempt_at`.
- Quá retry thì mark `FAILED` hoặc gửi DLQ.

### 8.6. Regression tests

Scenarios:

- `POST /auth/register`, `/auth/verify-email`, `/auth/login`, `/auth/introspect` vẫn hoạt động.
- Gateway protected route vẫn reject request thiếu token.
- Profile/project/manager endpoint không đổi response shape.
- Email-service REST endpoint vẫn hoạt động khi Kafka disabled.
- Notification-service REST endpoint vẫn hoạt động khi Kafka disabled.

## 9. Acceptance Criteria

### Phase 1

- Có file `docs/backend-analysis-roadmap.md`.
- Tài liệu có đủ 10 section đã yêu cầu.
- Tài liệu Phase 1 ghi rõ baseline lúc đó chưa có Kafka implementation thật; Phase 4 cập nhật trạng thái thành Kafka foundation nội bộ, disabled mặc định.
- Tài liệu không thay đổi README root.
- Không có thay đổi code runtime.

### Phase 2

- Có bảng API contract theo service.
- Current/legacy/internal endpoint được phân biệt rõ.
- Error response policy được document.
- Không break HTTP contract hiện tại.

### Phase 3

- Request id được tạo/forward/log.
- Downstream timeout và error policy được document và test.
- Metrics cơ bản có cho HTTP/downstream/mail/notification.
- Không log secret/token/password/OTP.

### Phase 4

- Chỉ service có producer/consumer thật mới thêm `quarkus-messaging-kafka`.
- Topic names và envelope schema được document.
- Kafka disabled mặc định bằng feature flag trong rollout đầu.
- HTTP API public không đổi.

### Phase 5

- Outbox schema/collection tồn tại ở producer service.
- Publisher có retry và status tracking.
- Consumer có idempotency store.
- Duplicate message không tạo side effect trùng.

### Phase 6

- OTP email flow có thể chạy qua Kafka trong staging.
- Notification flow cho role/job có thể chạy qua Kafka.
- HTTP fallback còn tồn tại hoặc có rollback path rõ.
- DLQ có message khi consumer gặp lỗi không recover được.

### Phase 7

- Local runtime có Kafka broker.
- Developer có hướng dẫn chạy baseline HTTP không cần Kafka.
- Developer có hướng dẫn bật Kafka flow bằng config.

## 10. Phần Chưa Xác Định Từ Source Code Hiện Tại

Các nội dung sau chưa xác định từ source code hiện tại:

- Hạ tầng deploy production.
- CI/CD pipeline.
- Secret manager production.
- Monitoring/logging/tracing stack cụ thể.
- Cloud provider.
- Chính sách retention Kafka topic.
- Chính sách retention outbox/idempotency table.
- Notification type enum và metadata schema chính thức.
- Email template system dài hạn.
- API versioning policy chính thức.
- Quyết định có mã hóa outbox payload chứa OTP hay không.
- Frontend hiện đang phụ thuộc endpoint legacy nào.
- SLO/SLA của từng service.
- Chính sách backup/restore database.
- Chiến lược migration MongoDB.
- Có dùng Testcontainers cho integration test hay không.

Giả định khi lập roadmap này:

- Artifact chính là tài liệu riêng `docs/backend-analysis-roadmap.md`.
- README root giữ vai trò giới thiệu tổng quan, không mở rộng thành roadmap dài trong tài liệu này.
- Kafka triển khai incremental, không rewrite toàn bộ backend sang event-driven ngay.
- HTTP API hiện tại phải được giữ tương thích trong các phase đầu.
- Kafka topic/schema foundation đã có trong source từ Phase 4, nhưng vẫn là internal contract và chưa thay thế HTTP business flow.
- Khi cần production deployment thật, các phần CI/CD, secrets management, monitoring stack và cloud target phải được quyết định riêng.

## Kết luận

Backend Quarkus hiện tại đã có nền tảng microservices rõ, auth/user flow tương đối tốt và các service nghiệp vụ chính đã được tách riêng. Rủi ro lớn nhất không nằm ở thiếu service, mà ở consistency contract, side effect qua HTTP, observability và việc Kafka mới chỉ tồn tại ở cấu hình/tài liệu cũ chứ chưa có implementation thật.

Roadmap phù hợp nhất là đi theo hướng incremental:

1. Chuẩn hóa tài liệu, contract, config và baseline test.
2. Tăng resilience/observability.
3. Thêm Kafka có kiểm soát cho email/notification trước.
4. Bổ sung outbox, idempotency, retry, DLQ.
5. Mở rộng domain events sau khi production behavior đủ ổn định.

Không nên rewrite toàn bộ backend sang event-driven ngay. Cách tiếp cận an toàn hơn là giữ HTTP contract hiện tại, thêm messaging như một integration layer nội bộ, rollout từng flow và đo bằng metrics/logs trước khi loại bỏ fallback.

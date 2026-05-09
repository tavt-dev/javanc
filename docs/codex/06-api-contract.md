# API Contract

## Goal

Preserve current API behavior during migration. Do not rename endpoints, methods, query parameters, request fields, response fields, or wrapper shape unless a separate contract change is approved.

## Common Response Wrapper

Most services use an `ApiResponse<T>` wrapper:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

Preserve field names exactly. Inspect each service because generic type and messages differ.

## Endpoint Families

Preserve these route families:

- `/auth/**`
- `/image/**`
- `/profile/**`
- `/project/**`
- `/notification/**`
- `/email/**`
- `/manager/**`

## User Service Endpoints

Base path: `/auth`

| Method | Path | Inputs | Response data |
|---|---|---|---|
| `POST` | `/isValid` | raw token string body | `AuthenticationResponse` |
| `GET` | `/ourUserDetailsService` | intended `username`, current mapping missing path variable | `UserDetails` |
| `POST` | `/signup` | `AuthenticationRequest` body | `AuthenticationResponse` |
| `POST` | `/signin` | `AuthenticationRequest` body | `AuthenticationResponse` |
| `POST` | `/update` | query `token`, `UserDTO` body | `UserDTO` |
| `GET` | `/findbyid` | query `id` | `UserDTO` |
| `POST` | `/refresh` | `AuthenticationRequest` body | `AuthenticationResponse` |
| `GET` | `/checkId` | query `id` | `Boolean` |
| `GET` | `/getCurrentUser` | current security context | `UserDTO` |
| `GET` | `/getAll` | query `token` | `List<UserDTO>` |
| `GET` | `/getlistuserbyid` | query `token`, `ids` | `List<UserDTO>` |
| `POST` | `/updateactive` | query `token`, `UserDTO` body | `UserDTO` |
| `DELETE` | `/delete` | query `token`, `id` | `UserDTO` |

Important auth response fields: `statusCode`, `error`, `message`, `token`, `refreshToken`, `expirationTime`, `user`, `isVaild`, `role`.

## Image Service Endpoints

Base path: `/image`

| Method | Path | Inputs | Response data |
|---|---|---|---|
| `POST` | `/save` | multipart part `image`, optional=false in code but null returns 400 | `ImageDTO` |
| `GET` | `/getAll` | none | string `"ok"` |

## Profile Service Endpoints

Base path: `/profile`

| Method | Path | Inputs | Response data |
|---|---|---|---|
| `POST` | `/user/save` | `ProfileDTO` model attributes, optional multipart part `image` | `ProfileDTO` |
| `POST` | `/user/update` | multipart form `ProfileDTO`, optional multipart part `image` | `ProfileDTO` |
| `GET` | `/user/findProfileByType` | query `typeProfile` | `List<ProfileDTO>` |
| `GET` | `/user/getAll` | none | `List<ProfileDTO>` |
| `GET` | `/user/findById` | query `id` | `ProfileDTO` |
| `GET` | `/user/findByUserId` | query `userId` | `ProfileDTO` or `null` with `success=false` |
| `GET` | `/user/findByTitle` | query `title` | `List<ProfileDTO>` |
| `GET` | `/user/checkIdProfile` | query `id` | string `"true"` currently |
| `GET` | `/manager/getProfileByIdPendingJob` | query list `ids` | `List<ProfileDTO>` |

## Project Service Endpoints

Base path: `/project`

| Method | Path | Inputs | Response data |
|---|---|---|---|
| `POST` | `/user/save` | `ProjectDTO` JSON body | `ProjectDTO` |
| `POST` | `/user/update` | `ProjectDTO` JSON body | `ProjectDTO` |
| `GET` | `/user/getProfile` | none | `List<ProfileDTO>` |
| `GET` | `/user/getProject` | query `id` | `List<ProjectDTO>` |
| `GET` | `/user/get` | multipart part `image` on GET, current odd behavior | `ImageDTO` |
| `GET` | `/user/get1` | none | string from image client |

## Notification And Email Endpoints

Notification base path: `/notification`

Notification read-state compatibility:

- Spring/Lombok `NotificationDTO.isRead` is serialized and consumed by the Angular client as JSON field `read`.
- Preserve `read` in Quarkus responses. Accepting `isRead` as an input alias is allowed for backward compatibility.

| Method | Path | Inputs | Response data |
|---|---|---|---|
| `POST` | `/create` | `MessageDTO` body | string `"true"` |
| `POST` | `/update` | `NotificationDTO` body | `NotificationDTO` |
| `GET` | `/user/findByUser` | query `userId` | `List<NotificationDTO>` |
| `GET` | `/getAll` | none | string `"ok"` |

Email base path: `/email`

| Method | Path | Inputs | Response data |
|---|---|---|---|
| `POST` | `/create` | `MessageDTO` body | string `"true"` |

## Manager Company Endpoints

Base path: `/manager`

| Method | Path | Inputs | Response data |
|---|---|---|---|
| `POST` | `/admin/company/create` | `CompanyDTO` model attributes, optional multipart part `image` | `CompanyDTO` |
| `POST` | `/manager/company/update` | `CompanyDTO` JSON body | `CompanyDTO` |
| `PUT` | `/manager/sethrtocompany` | `AuthenticationRequest` body, query `idCompany` | `CompanyDTO` |
| `POST` | `/admin/company/delete` | query `id` | string `"ok"` |
| `PUT` | `/manager/setmaanagertocompany` | `AuthenticationRequest` body, query `idCompany` | `CompanyDTO` |
| `GET` | `/user/company/getbyid` | query `id` | `CompanyDTO` |
| `GET` | `/user/company/getcompany` | none | `List<CompanyDTO>` |
| `GET` | `/user/company/getcompanybytype` | query `type` | `List<CompanyDTO>` |
| `GET` | `/company/getcompanybyidmanager` | query `managerId` | `CompanyDTO` |
| `GET` | `/hr/findByIdHr` | query `id` | `CompanyDTO` |

## Manager Job Endpoints

Base path: `/manager`

| Method | Path | Inputs | Response data |
|---|---|---|---|
| `POST` | `/hr/job/create` | `JobDTO` JSON body | `JobDTO` |
| `POST` | `/hr/job/update` | `JobDTO` JSON body | `JobDTO` |
| `POST` | `/hr/job/delete` | query `id` | string `"Ok"` |
| `PUT` | `/user/job/apply` | query `jobDTO`, query `idProfile` | `JobDTO` |
| `PUT` | `/hr/job/accept` | query `jobDTO`, query `idProfile` | `JobDTO` |
| `PUT` | `/hr/job/reject` | query `jobDTO`, query `idProfile` | `JobDTO` |
| `GET` | `/user/job/findbyid` | unannotated `id`; verify actual binding | `JobDTO` |
| `GET` | `/user/job/getall` | none | `List<JobDTO>` |
| `GET` | `/user/job/getjobbycompany` | query `id` | `List<JobDTO>` |
| `GET` | `/user/job/getjobpending` | query `id` | `List<JobDTO>` |
| `GET` | `/user/job/getjobaccepted` | query `id` | `List<JobDTO>` |
| `GET` | `/user/job/getnewjob` | query `id` | `List<JobDTO>` |

# Pageable API Contract

## Response Shape

All browse/search list endpoints return `ApiResponse<PageResponse<T>>`:

```json
{
  "success": true,
  "message": "string",
  "data": {
    "items": [],
    "page": 0,
    "size": 20,
    "totalElements": 125,
    "totalPages": 7,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

Rules:

- `page` is zero-based.
- `size` defaults to `20`.
- `size` must be between `1` and `100`.
- `sort` format is `field,dir`, for example `createdAt,desc`.
- `dir` must be `asc` or `desc`.
- Sort fields are allowlisted per resource. Invalid page, size, sort format, direction, or field returns `400`.
- Filters are applied before `totalElements` is counted.
- Batch lookup endpoints remain `ApiResponse<List<T>>`.

## Pageable Endpoints

| Resource | Endpoint | Default sort | Sort allowlist |
|---|---|---|---|
| User | `GET /users` | `createdAt,desc` | `id,name,email,role,status,createdAt,updatedAt` |
| User search | `GET /users/search` | `createdAt,desc` | `id,name,email,role,status,createdAt,updatedAt` |
| Role request | `GET /users/admin/role-requests` | `createdAt,desc` | `id,type,status,createdAt,updatedAt` |
| Role request | `GET /users/me/role-requests` | `createdAt,desc` | `id,type,status,createdAt,updatedAt` |
| HR promotion | `GET /users/me/hr-promotion-requests` | `createdAt,desc` | `id,type,status,createdAt,updatedAt` |
| Profile | `GET /profiles` | `createdAt,desc` | `id,title,typeProfile,createdAt,updatedAt` |
| Project | `GET /project/user/projects` | `createAt,desc` | `id,title,createAt` |
| Project legacy | `GET /project/user/getProject` | `createAt,desc` | `id,title,createAt` |
| Profile aggregation | `GET /project/user/getProfile` | `createdAt,desc` | `id,title,typeProfile,createdAt,updatedAt` |
| HR candidate | `GET /manager/manager/hr-candidates` | `id,desc` | user-service allowlist |
| Company | `GET /manager/user/company/getcompany` | `id,desc` | `id,name,type,city,country` |
| Company by type | `GET /manager/user/company/getcompanybytype` | `id,desc` | `id,name,type,city,country` |
| Job | `GET /manager/user/job/getall` | `id,desc` | `id,title,typeJob,size,idCompany` |
| Job by company | `GET /manager/user/job/getjobbycompany` | `id,desc` | `id,title,typeJob,size,idCompany` |
| Pending job | `GET /manager/user/job/getjobpending` | `id,desc` | `id,title,typeJob,size,idCompany` |
| Accepted job | `GET /manager/user/job/getjobaccepted` | `id,desc` | `id,title,typeJob,size,idCompany` |
| New job | `GET /manager/user/job/getnewjob` | `id,desc` | `id,title,typeJob,size,idCompany` |
| Notification | `GET /notification/user/findByUser` | `createAt,desc` | `id,createAt,read` |

## Batch Endpoints

These endpoints intentionally return plain lists because they are technical lookup operations:

- `GET /users/batch?ids=1&ids=2`
- `GET /profiles/batch?ids=1&ids=2`

## Frontend Convention

Frontend list screens keep `page`, `size`, `sort`, and filters in the URL query string. Query keys include the same values, and mutations invalidate the resource namespace rather than a single stale page.

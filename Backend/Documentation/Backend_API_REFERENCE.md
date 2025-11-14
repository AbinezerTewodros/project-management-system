## CBE Project Management System — Backend API Reference

This document provides a high-level and practical overview of all backend HTTP APIs: routes, authorization, common request/response shapes, and how to test. Use it to understand coverage, spot gaps, and guide further integration.

### Base URL and Auth

- Base path: `/api`
- Authentication: JWT in `Authorization: Bearer <token>` header unless endpoint is explicitly public.
- Common response envelope (most controllers):
  - `{ success: boolean, message: string, data?: any, ... }`

### Conventions

- Controllers typically use `[Route("api/[controller]")]` or custom base (e.g. `api/message`).
- `200 OK` on success; `4xx/5xx` with message on errors.
- Pagination when present uses query params: `?pageNumber=1&pageSize=20`.

---

## Authentication & Users

### AuthController — `api/auth`

- POST `register` [Policy: AdminOnly]
- POST `login` (public) — returns JWT
- POST `refresh-token` [Auth]
- POST `logout` [Auth]
- POST `cookie-login` [Auth]
- POST `cookie-logout` [Auth]
- GET `session-demo` [Auth]

Test:

```bash
curl -X POST "$BASE/api/auth/login" -H "Content-Type: application/json" \
  -d '{"username":"user","password":"pass"}'
```

### UserController — `api/user`

- GET `` — list users
- GET `users-by-department/{departmentName}`
- GET `users-by-manager/{manager}`
- POST `change-password` [Auth]
- GET `me` [Auth]

### AdminController — `api/admin` [Roles: Admin]

- GET `all-users`
- GET `roles`
- GET `users`
- POST `create-user`
- GET `ad/users/{empId}`
- POST `ad/import/{empId}`
- POST `ad/import-batch`
- POST `ad/import-by-ou`
- PUT `edit-user` [Policy: AdminOnly]
- PUT `update-role` [Policy: AdminOnly]
- DELETE `delete-user/{identifier}` [Policy: AdminOnly]
- POST `activate-user/{identifier}` [Policy: AdminOnly]
- POST `reset-password/{identifier}` [Policy: AdminOnly]
- POST `register` [Policy: AdminOnly]

Test (reset password):

```bash
curl -X POST "$BASE/api/admin/reset-password/{identifier}" -H "Authorization: Bearer $TOKEN"
```

### ADAuthController — `api/adauth`

- POST `login`
- GET `employee/{empId}`

### UserProfileController — `api/userprofile` [Auth]

- User profile endpoints (edit, get) — see controller for exact shapes.

---

## Notifications

### NotificationController — `api/notification` [Auth]

- GET ``— list notifications (supports`pageNumber`, `pageSize`)
- GET `unread-count` — returns `{ unreadCount }`
- PUT `{notificationId}/read` — mark as read
- PUT `mark-all-read` — mark all as read
- DELETE `{notificationId}` — delete
- POST `test` [Policy: AdminOnly] — send test notification

Test:

```bash
curl -H "Authorization: Bearer $TOKEN" "$BASE/api/notification?pageNumber=1&pageSize=20"
curl -H "Authorization: Bearer $TOKEN" "$BASE/api/notification/unread-count"
curl -X PUT -H "Authorization: Bearer $TOKEN" "$BASE/api/notification/123/read"
```

Flow:

- Backend services create `Notification` rows on project/task/todo events.
- Frontend polls/draws count and list; marking read updates status.

---

## Projects & Assignments

### ProjectController — `api/project` [Auth]

- GET `All-projects` [Roles: Admin,President,Vice-President,Director,Manager,Supervisor,Member]
- GET `{id}` — get by id
- GET `by-priority/{priority}`
- POST `` [Roles: Manager] — create project
- PUT `{id}` [Roles: Manager] — update project
- DELETE `{id}` [Roles: Manager]
- POST `{id}/archive` [Roles: Manager]
- POST `{id}/restore` [Roles: Manager]

Test:

```bash
curl -H "Authorization: Bearer $TOKEN" "$BASE/api/project/All-projects"
```

### ProjectAssignmentController — `api/projectassignment` [Auth]

- GET `All-members`
- GET `User-projects`
- POST `Add-members`
- PUT `edit-role`
- PUT `{id}/approve` [Policy: ManagerOnly]
- PUT `{id}/reject` [Policy: ManagerOnly]
- GET `pending/{userId}`
- GET `team-members-in-charge/{employeeId}`
- DELETE `delete-member`

### EnhancedAssignmentController — `api/enhancedassignment` [Auth]

- POST `` [Policy: AdminOrManager]
- PUT `{assignmentId}` [Policy: AdminOrManager]
- DELETE `{assignmentId}` [Policy: AdminOrManager]
- GET `{assignmentId}`
- GET `project/{projectId}`
- GET `project/{projectId}/scrum-masters`
- GET `project/{projectId}/multiple-scrum-masters`
- POST `project/{projectId}/set-primary-scrum-master` [Policy: AdminOrManager]
- POST `project/{projectId}/add-scrum-master` [Policy: AdminOrManager]
- DELETE `project/{projectId}/remove-scrum-master/{memberId}` [Policy: AdminOrManager]
- GET `availability/{memberId}`
- GET `availability`
- GET `project/{projectId}/available-members`
- GET `availability/check/{memberId}`
- POST `reassign` [Policy: AdminOrManager]
- GET `reassignment-history/{memberId}`
- GET `workload/{memberId}`
- GET `workload/{memberId}/projects`

---

## Tasks, Milestones, Dependencies, Todos

### ProjectTaskController — `api/projecttask` [Auth]

- POST `create-task`
- POST `{parentTaskId}/add-subtask`
- GET `filter`
- GET `by-assignment/{assignmentId}`
- GET `by-member/{memberId}`
- GET `by-status/{status}`
- POST `validate-milestone-dates`
- PUT `{taskId}/assign/{memberId}`
- GET `Get-task-by-id/{id}`
- GET `Get-all-tasks`
- PUT `update-task/{id}`
- POST `{taskId}/comments`
- GET `{id}/progress`
- PUT `{taskId}/progress`
- GET `{taskId}/comments`
- PUT `{taskId}/actual-hours`
- PUT `{id}/accept`
- PUT `{id}/reject`
- PUT `{id}/acceptcompletion`
- PUT `{id}/rejectcompletion`
- DELETE `Delete-task` [Policy: SupervisorOnly]

### MilestoneController — `api/milestone`

- GET `{id}`
- GET `` — all
- GET `{milestoneId}/progress`
- GET `project/{projectId}`
- POST `create-milestone`
- PUT `{id}`
- DELETE `{id}`
- PUT `{id}/accept-assignment`
- PUT `{id}/reject-assignment`
- GET `pending/{userId}`
- GET `assigned-to/{userId}`

### TaskDependencyController — `api/taskdependency` [Auth]

- POST ``
- GET ``
- GET `{id}`
- GET `task/{taskId}`
- PUT `{id}`
- DELETE `{id}`
- GET `validate/{predecessorTaskId}/{successorTaskId}`

### TodoItemController — `api/todoitems` [Auth]

- GET `{id}`
- GET `projecttask/{projectTaskId}`
- POST ``
- PUT `{id}/accept`
- PUT `{id}/acceptassignment`
- PUT `{id}/acceptapproval`
- PUT `{id}/rejectassignment`
- PUT `{id}/rejectcompletion`
- PUT `{id}/reopen`
- PUT `{id}` — update
- PUT `{id}/start`
- PUT `{id}/complete`
- PUT `{id}/progress`
- GET `{id}/progress`
- DELETE `{id}`

### PersonalTodoController — `api/personaltodo` [Auth]

- GET `{id}`
- GET ``
- GET `filter`
- GET `overdue`
- GET `reminders`
- POST ``
- PUT `{id}`
- DELETE `{id}`
- PUT `{id}/start`
- PUT `{id}/complete`
- PUT `{id}/progress`

Test:

```bash
curl -H "Authorization: Bearer $TOKEN" "$BASE/api/personaltodo?pageNumber=1&pageSize=20"
```

### IndependentTaskController — `api/independent-tasks` [Auth]

- GET `{id}`
- GET ``
- GET `user`
- GET `created`
- POST ``
- PUT `{id}`
- DELETE `{id}`
- POST `{taskId}/accept`
- POST `{taskId}/reject`
- PUT `{taskId}/progress`
- POST `{taskId}/complete`
- POST `{taskId}/approve` [Roles: Manager,TeamLead]
- POST `{taskId}/reject-completion` [Roles: Manager,TeamLead]

---

## Messaging & Chat

### MessageController — `api/message` [Auth]

- POST `Send-Message`
- GET `department`
- GET `project`
- GET `project/{projectId}`
- GET `personal`
- GET `personal/{employeeId}`
- PUT `edit`
- DELETE `delete/{messageId}`
- GET `unread-count`
- POST `mark-read/{messageId}` [Auth]
- POST `mark-group-message-read/{messageId}` [Auth]
- GET `project/{projectId}/members`

Test:

```bash
curl -H "Authorization: Bearer $TOKEN" "$BASE/api/message/unread-count"
```

---

## Files & Attachments

### AttachmentsController — `api/attachments` [Auth]

- POST `upload`
- POST `upload/multiple`
- POST `process`
- POST `preview`
- POST `thumbnail`
- POST `convert`
- POST `compress`
- POST `analyze`
- POST `extract-text`
- POST `bulk/process`
- GET `jobs/{jobId}/status`
- GET `jobs/{jobId}/result`
- DELETE `jobs/{jobId}`
- GET `jobs/user`

### FileOperationsController — `api/fileoperations` [Auth]

- Uploads, conversion, analysis, etc. (see method list above).

---

## Reporting, Data, Background Jobs, Cache

### ReportController — `api/report` [Auth]

- POST `project-summary`
- POST `task-progress`
- POST `team-performance`
- POST `issue-summary`
- POST `generate`
- POST `export`
- GET `templates`
- GET `metadata/{reportType}`
- POST `schedule`
- GET `scheduled` [Roles: Manager,Admin]
- GET `dashboard` [Roles: Manager,Admin]

### DataProcessingController — `api/dataprocessing` [Auth]

- POST `reports/generate`, `reports/schedule`, `export`, `import`, etc.

### BackgroundJobController — `api/backgroundjob` [Policy: AdminOnly]

- Background job triggers (e.g., cleanup, scheduled tasks).

### CacheController — `api/cache` [Policy: AdminOnly]

- Admin cache operations.

---

## Activity & Access Logs

### ActivityLogController — `api/activitylog` [Auth]

- GET `` [Policy: AdminOnly]
- GET `{id}` [Policy: AdminOnly]
- GET `user/{userId}` [Policy: AdminOrManager]
- GET `entity/{entityType}/{entityId}` [Policy: AdminOrManager]

### AccessLogController — `api/accesslog`

- GET ``
- GET `failed-logins`
- GET `suspicious-activity`
- GET `{id}`
- GET `user/{userId}`

---

## Skills, Issues, Cascaded Filters, Archive, Bulk Ops

### SkillsController — `api/skills`

- Endpoints include admin-only create/update; general fetch [Auth where specified].

### IssueController — `api/issue`

- Issue CRUD and tracking (see controller for detailed actions).

### CascadedFilterController — `api/cascadedfilter` [Auth]

- Dynamic filters for UI forms.

### ArchiveController — `api/archive` [Auth]

- Archival operations (see controller methods).

### BulkOperationsController — `api/bulkoperations` [Auth]

- Bulk imports/exports and operations [Admin/Manager for some actions].

---

## Progress & Approvals

### ProgressRecalculationController — `api/progressrecalculation` [Auth]

- POST `recalculate-all`
- POST `recalculate-project/{projectId}`
- POST `recalculate-milestone/{milestoneId}`

### DebugProgressController — `api/debugprogress` [Auth]

- GET `check-data`

### ProjectApprovalController — `api/projectapproval` [Auth]

- POST `approve` [Policy: AdminOrManager]
- POST `reject` [Policy: AdminOrManager]
- GET `pending` [Policy: AdminOrManager]
- GET `status/{projectId}` [Policy: AdminOrManager]
- GET `history` [Policy: AdminOrManager]
- GET `can-create` [Policy: AdminOrManager]

---

## ERP & Users

### ErpUserController — `api/erpuser`

- POST `sync-single`
- POST `sync-multiple`
- POST `sync-all`

---

## How to Test (General)

1. Obtain JWT:

```bash
TOKEN=$(curl -s -X POST "$BASE/api/auth/login" -H 'Content-Type: application/json' \
  -d '{"username":"user","password":"pass"}' | jq -r .data.token)
```

2. Call any protected endpoint:

```bash
curl -H "Authorization: Bearer $TOKEN" "$BASE/api/project/All-projects"
```

3. Postman: set Base URL to your backend, add `Authorization: Bearer <token>`, send requests using routes above.

---

## Known Gaps / Next Steps

- Some controllers lack explicit response DTO documentation; consider adding `[ProducesResponseType]` annotations consistently.
- Standardize pagination and envelopes across all list endpoints.
- Verify that all domain events create notifications where appropriate (Comments, Issues, Attachments, Messages, Admin actions).
- Consider adding OpenAPI/Swagger generation for current code to export machine-readable docs.


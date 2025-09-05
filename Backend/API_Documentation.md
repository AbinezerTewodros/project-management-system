# Project Management System - API Documentation

## Overview

This document provides comprehensive API documentation for the Project Management System backend. All endpoints require authentication unless specified as `[AllowAnonymous]`.

## Base URL

```
https://localhost:7048/api
```

## Authentication

The API uses JWT (JSON Web Token) authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Common Response Format

All API responses follow this structure:

```json
{
  "success": true/false,
  "data": {...},
  "message": "Success/Error message",
  "errors": [...]
}
```

## Error Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## 1. Authentication Endpoints

### 1.1 Login

**POST** `/api/Auth/login`

- **Description**: Authenticate user and get JWT token
- **Auth Required**: No
- **Request Body**:

```json
{
  "username": "string",
  "password": "string"
}
```

- **Response**:

```json
{
  "accessToken": "string",
  "refreshToken": "string",
  "expiresIn": "number",
  "isFirstLogin": "boolean"
}
```

### 1.2 Refresh Token

**POST** `/api/Auth/refresh-token`

- **Description**: Get new access token using refresh token
- **Auth Required**: No
- **Request Body**:

```json
{
  "token": "string"
}
```

### 1.3 Logout

**POST** `/api/Auth/logout`

- **Description**: Logout user and invalidate tokens
- **Auth Required**: Yes

### 1.4 Cookie Login

**POST** `/api/Auth/cookie-login`

- **Description**: Cookie-based authentication for web clients
- **Auth Required**: No

---

## 2. Project Management Endpoints

### 2.1 Get All Projects

**GET** `/api/Project/All-projects`

- **Description**: Get all visible projects for the authenticated user
- **Auth Required**: Yes (Admin, President, Vice-President, Director, Manager, Supervisor)
- **Response**: Array of projects

### 2.2 Get Project by ID

**GET** `/api/Project/project-byId?id={id}`

- **Description**: Get specific project by ID
- **Auth Required**: Yes
- **Parameters**: `id` (int)

### 2.3 Get Projects by Priority

**GET** `/api/Project/project-by-priority/{priority}`

- **Description**: Get projects filtered by priority
- **Auth Required**: Yes
- **Parameters**: `priority` (string)

### 2.4 Create Project

**POST** `/api/Project/create-project`

- **Description**: Create a new project
- **Auth Required**: Yes
- **Request Body**: `CreateProjectDto`

### 2.5 Update Project

**PUT** `/api/Project/edit-project?id={id}`

- **Description**: Update existing project
- **Auth Required**: Yes
- **Parameters**: `id` (int)
- **Request Body**: `UpdateProjectDto`

### 2.6 Delete Project

**DELETE** `/api/Project/delete-project?id={id}`

- **Description**: Delete project
- **Auth Required**: Yes
- **Parameters**: `id` (int)

### 2.7 Archive Project

**POST** `/api/Project/archive/{id}`

- **Description**: Archive a project
- **Auth Required**: Yes
- **Parameters**: `id` (int)

---

## 3. Project Task Endpoints

### 3.1 Create Task

**POST** `/api/ProjectTask/create-task`

- **Description**: Create a new project task
- **Auth Required**: Yes
- **Request Body**: `ProjectTaskCreateDto`

### 3.2 Add Subtask

**POST** `/api/ProjectTask/{parentTaskId}/add-subtask`

- **Description**: Add subtask to existing task
- **Auth Required**: Yes
- **Parameters**: `parentTaskId` (int)
- **Request Body**: `ProjectTaskCreateDto`

### 3.3 Get Task by ID

**GET** `/api/ProjectTask/{id}`

- **Description**: Get specific task details
- **Auth Required**: Yes
- **Parameters**: `id` (int)

### 3.4 Update Task

**PUT** `/api/ProjectTask/{id}`

- **Description**: Update existing task
- **Auth Required**: Yes
- **Parameters**: `id` (int)
- **Request Body**: `ProjectTaskUpdateDto`

### 3.5 Delete Task

**DELETE** `/api/ProjectTask/{id}`

- **Description**: Delete task
- **Auth Required**: Yes
- **Parameters**: `id` (int)

### 3.6 Get Tasks by Project

**GET** `/api/ProjectTask/project/{projectId}`

- **Description**: Get all tasks for a specific project
- **Auth Required**: Yes
- **Parameters**: `projectId` (int)

### 3.7 Update Task Progress

**PUT** `/api/ProjectTask/{id}/progress`

- **Description**: Update task progress percentage
- **Auth Required**: Yes
- **Parameters**: `id` (int)
- **Request Body**: `UpdateTaskProgressDto`

### 3.8 Update Task Hours

**PUT** `/api/ProjectTask/{id}/hours`

- **Description**: Update actual hours spent on task
- **Auth Required**: Yes
- **Parameters**: `id` (int)
- **Request Body**: `UpdateTaskActualHoursDto`

### 3.9 Reject Task

**POST** `/api/ProjectTask/{id}/reject`

- **Description**: Reject a task with reason
- **Auth Required**: Yes
- **Parameters**: `id` (int)
- **Request Body**: `RejectTaskDto`

---

## 4. Project Assignment Endpoints

### 4.1 Get Enhanced Assignments

**GET** `/api/EnhancedAssignment/assignments`

- **Description**: Get all project assignments with enhanced details
- **Auth Required**: Yes
- **Query Parameters**:
  - `page` (int)
  - `pageSize` (int)
  - `searchTerm` (string)
  - `status` (string)
  - `priority` (string)

### 4.2 Create Assignment

**POST** `/api/EnhancedAssignment/create`

- **Description**: Create new project assignment
- **Auth Required**: Yes
- **Request Body**: `CreateAssignmentDto`

### 4.3 Update Assignment

**PUT** `/api/EnhancedAssignment/{id}`

- **Description**: Update existing assignment
- **Auth Required**: Yes
- **Parameters**: `id` (int)
- **Request Body**: `UpdateAssignmentDto`

### 4.4 Delete Assignment

**DELETE** `/api/EnhancedAssignment/{id}`

- **Description**: Delete assignment
- **Auth Required**: Yes
- **Parameters**: `id` (int)

---

## 5. User Management Endpoints

### 5.1 Get All Users

**GET** `/api/User/All-users`

- **Description**: Get all users (Admin only)
- **Auth Required**: Yes (Admin role)

### 5.2 Get User by ID

**GET** `/api/User/{id}`

- **Description**: Get specific user details
- **Auth Required**: Yes
- **Parameters**: `id` (int)

### 5.3 Create User

**POST** `/api/User/create-user`

- **Description**: Create new user (Admin only)
- **Auth Required**: Yes (Admin role)
- **Request Body**: `CreateUserRequestDto`

### 5.4 Update User

**PUT** `/api/User/{id}`

- **Description**: Update user information
- **Auth Required**: Yes
- **Parameters**: `id` (int)
- **Request Body**: `EditUserDto`

### 5.5 Delete User

**DELETE** `/api/User/{id}`

- **Description**: Delete user (Admin only)
- **Auth Required**: Yes (Admin role)
- **Parameters**: `id` (int)

### 5.6 Change Password

**POST** `/api/User/change-password`

- **Description**: Change user password
- **Auth Required**: Yes
- **Request Body**: `ChangePasswordDto`

---

## 6. User Profile Endpoints

### 6.1 Get User Profile

**GET** `/api/UserProfile/profile`

- **Description**: Get current user's profile
- **Auth Required**: Yes

### 6.2 Update User Profile

**PUT** `/api/UserProfile/update`

- **Description**: Update user profile information
- **Auth Required**: Yes
- **Request Body**: `UpdateProfileDto`

---

## 7. Todo Items Endpoints

### 7.1 Create Todo Item

**POST** `/api/TodoItem/create`

- **Description**: Create new todo item
- **Auth Required**: Yes
- **Request Body**: `TodoItemCreateDto`

### 7.2 Get Todo Items

**GET** `/api/TodoItem/items`

- **Description**: Get all todo items for current user
- **Auth Required**: Yes
- **Query Parameters**:
  - `page` (int)
  - `pageSize` (int)
  - `status` (string)
  - `priority` (string)

### 7.3 Update Todo Item

**PUT** `/api/TodoItem/{id}`

- **Description**: Update existing todo item
- **Auth Required**: Yes
- **Parameters**: `id` (int)
- **Request Body**: `TodoItemUpdateDto`

### 7.4 Delete Todo Item

**DELETE** `/api/TodoItem/{id}`

- **Description**: Delete todo item
- **Auth Required**: Yes
- **Parameters**: `id` (int)

### 7.5 Reject Todo Item

**POST** `/api/TodoItem/{id}/reject`

- **Description**: Reject todo item with reason
- **Auth Required**: Yes
- **Parameters**: `id` (int)
- **Request Body**: `RejectTodoItemDto`

---

## 8. Personal Todo Endpoints

### 8.1 Create Personal Todo

**POST** `/api/PersonalTodo/create`

- **Description**: Create personal todo item
- **Auth Required**: Yes
- **Request Body**: Personal todo creation data

### 8.2 Get Personal Todos

**GET** `/api/PersonalTodo/todos`

- **Description**: Get all personal todos for current user
- **Auth Required**: Yes

### 8.3 Update Personal Todo

**PUT** `/api/PersonalTodo/{id}`

- **Description**: Update personal todo
- **Auth Required**: Yes
- **Parameters**: `id` (int)

### 8.4 Delete Personal Todo

**DELETE** `/api/PersonalTodo/{id}`

- **Description**: Delete personal todo
- **Auth Required**: Yes
- **Parameters**: `id` (int)

---

## 9. Milestone Endpoints

### 9.1 Create Milestone

**POST** `/api/Milestone/create`

- **Description**: Create new milestone
- **Auth Required**: Yes
- **Request Body**: `CreateMilestoneDto`

### 9.2 Get Milestones

**GET** `/api/Milestone/milestones`

- **Description**: Get all milestones
- **Auth Required**: Yes
- **Query Parameters**:
  - `projectId` (int)
  - `status` (string)

### 9.3 Update Milestone

**PUT** `/api/Milestone/{id}`

- **Description**: Update milestone
- **Auth Required**: Yes
- **Parameters**: `id` (int)
- **Request Body**: `UpdateMilestoneDto`

### 9.4 Delete Milestone

**DELETE** `/api/Milestone/{id}`

- **Description**: Delete milestone
- **Auth Required**: Yes
- **Parameters**: `id` (int)

### 9.5 Get Milestone Progress

**GET** `/api/Milestone/{id}/progress`

- **Description**: Get milestone progress details
- **Auth Required**: Yes
- **Parameters**: `id` (int)

---

## 10. Issue Management Endpoints

### 10.1 Create Issue

**POST** `/api/Issue/create`

- **Description**: Create new issue
- **Auth Required**: Yes
- **Request Body**: `IssueCreateDto`

### 10.2 Get Issues

**GET** `/api/Issue/issues`

- **Description**: Get all issues
- **Auth Required**: Yes
- **Query Parameters**:
  - `page` (int)
  - `pageSize` (int)
  - `status` (string)
  - `priority` (string)
  - `projectId` (int)

### 10.3 Update Issue

**PUT** `/api/Issue/{id}`

- **Description**: Update issue
- **Auth Required**: Yes
- **Parameters**: `id` (int)
- **Request Body**: `IssueUpdateDto`

### 10.4 Delete Issue

**DELETE** `/api/Issue/{id}`

- **Description**: Delete issue
- **Auth Required**: Yes
- **Parameters**: `id` (int)

### 10.5 Search Issues

**POST** `/api/Issue/search`

- **Description**: Search issues with advanced filters
- **Auth Required**: Yes
- **Request Body**: `IssueSearchDto`

---

## 11. Message Endpoints

### 11.1 Send Message

**POST** `/api/Message/send`

- **Description**: Send message to user(s)
- **Auth Required**: Yes
- **Request Body**: `CreateMessageDto`

### 11.2 Get Messages

**GET** `/api/Message/messages`

- **Description**: Get user's messages
- **Auth Required**: Yes
- **Query Parameters**:
  - `page` (int)
  - `pageSize` (int)
  - `conversationId` (int)

### 11.3 Edit Message

**PUT** `/api/Message/{id}`

- **Description**: Edit sent message
- **Auth Required**: Yes
- **Parameters**: `id` (int)
- **Request Body**: `EditMessageDto`

### 11.4 Delete Message

**DELETE** `/api/Message/{id}`

- **Description**: Delete message
- **Auth Required**: Yes
- **Parameters**: `id` (int)

---

## 12. Notification Endpoints

### 12.1 Get Notifications

**GET** `/api/Notification/notifications`

- **Description**: Get user's notifications
- **Auth Required**: Yes
- **Query Parameters**:
  - `page` (int)
  - `pageSize` (int)
  - `unreadOnly` (boolean)

### 12.2 Mark as Read

**PUT** `/api/Notification/{id}/read`

- **Description**: Mark notification as read
- **Auth Required**: Yes
- **Parameters**: `id` (int)

### 12.3 Mark All as Read

**PUT** `/api/Notification/mark-all-read`

- **Description**: Mark all notifications as read
- **Auth Required**: Yes

---

## 13. Attachment Endpoints

### 13.1 Upload Attachment

**POST** `/api/Attachments/upload`

- **Description**: Upload file attachment
- **Auth Required**: Yes
- **Request**: Multipart form data with file

### 13.2 Get Attachments

**GET** `/api/Attachments/attachments`

- **Description**: Get attachments for entity
- **Auth Required**: Yes
- **Query Parameters**:
  - `entityType` (string)
  - `entityId` (int)

### 13.3 Download Attachment

**GET** `/api/Attachments/download/{id}`

- **Description**: Download attachment file
- **Auth Required**: Yes
- **Parameters**: `id` (int)

### 13.4 Delete Attachment

**DELETE** `/api/Attachments/{id}`

- **Description**: Delete attachment
- **Auth Required**: Yes
- **Parameters**: `id` (int)

### 13.5 Grant Permission

**POST** `/api/Attachments/grant-permission`

- **Description**: Grant attachment access to user
- **Auth Required**: Yes
- **Request Body**: `GrantAttachmentPermissionDto`

---

## 14. Skills Management Endpoints

### 14.1 Add Skill

**POST** `/api/Skills/add-skill`

- **Description**: Add skill to user
- **Auth Required**: Yes
- **Request Body**: `AddSkillRequestDto`

### 14.2 Get User Skills

**GET** `/api/Skills/user-skills/{userId}`

- **Description**: Get skills for specific user
- **Auth Required**: Yes
- **Parameters**: `userId` (int)

### 14.3 Update Skill

**PUT** `/api/Skills/{id}`

- **Description**: Update skill information
- **Auth Required**: Yes
- **Parameters**: `id` (int)

### 14.4 Delete Skill

**DELETE** `/api/Skills/{id}`

- **Description**: Remove skill from user
- **Auth Required**: Yes
- **Parameters**: `id` (int)

---

## 15. Report Endpoints

### 15.1 Generate Report

**POST** `/api/Report/generate`

- **Description**: Generate various types of reports
- **Auth Required**: Yes
- **Request Body**: `ReportDto`

### 15.2 Get Report Types

**GET** `/api/Report/types`

- **Description**: Get available report types
- **Auth Required**: Yes

### 15.3 Download Report

**GET** `/api/Report/download/{reportId}`

- **Description**: Download generated report
- **Auth Required**: Yes
- **Parameters**: `reportId` (int)

---

## 16. Advanced Filter Endpoints

### 16.1 Apply Advanced Filter

**POST** `/api/AdvancedFilter/apply`

- **Description**: Apply advanced filtering to entities
- **Auth Required**: Yes
- **Request Body**: `AdvancedFilterDto`

### 16.2 Get Filter Options

**GET** `/api/AdvancedFilter/options`

- **Description**: Get available filter options
- **Auth Required**: Yes

---

## 17. Archive Endpoints

### 17.1 Get Archived Items

**GET** `/api/Archive/items`

- **Description**: Get archived items
- **Auth Required**: Yes
- **Query Parameters**:
  - `entityType` (string)
  - `page` (int)
  - `pageSize` (int)

### 17.2 Restore Item

**POST** `/api/Archive/restore/{id}`

- **Description**: Restore archived item
- **Auth Required**: Yes
- **Parameters**: `id` (int)

---

## 18. Activity Log Endpoints

### 18.1 Get Activity Logs

**GET** `/api/ActivityLog/logs`

- **Description**: Get activity logs
- **Auth Required**: Yes
- **Query Parameters**:
  - `page` (int)
  - `pageSize` (int)
  - `entityType` (string)
  - `entityId` (int)
  - `userId` (int)

---

## 19. Admin Endpoints

### 19.1 Get System Statistics

**GET** `/api/Admin/statistics`

- **Description**: Get system statistics (Admin only)
- **Auth Required**: Yes (Admin role)

### 19.2 Manage Users

**GET** `/api/Admin/users`
**POST** `/api/Admin/users`
**PUT** `/api/Admin/users/{id}`
**DELETE** `/api/Admin/users/{id}`

- **Description**: CRUD operations for user management (Admin only)
- **Auth Required**: Yes (Admin role)

### 19.3 System Settings

**GET** `/api/Admin/settings`
**PUT** `/api/Admin/settings`

- **Description**: Get/Update system settings (Admin only)
- **Auth Required**: Yes (Admin role)

---

## 20. ERP User Endpoints

### 20.1 Get ERP Users

**GET** `/api/ErpUser/users`

- **Description**: Get ERP system users
- **Auth Required**: Yes

### 20.2 Sync ERP Users

**POST** `/api/ErpUser/sync`

- **Description**: Synchronize with ERP system
- **Auth Required**: Yes (Admin role)

---

## 21. Independent Task Endpoints

### 21.1 Create Independent Task

**POST** `/api/IndependentTask/create`

- **Description**: Create task not tied to project
- **Auth Required**: Yes
- **Request Body**: `IndependentTaskCreateDto`

### 21.2 Get Independent Tasks

**GET** `/api/IndependentTask/tasks`

- **Description**: Get all independent tasks
- **Auth Required**: Yes

### 21.3 Update Independent Task

**PUT** `/api/IndependentTask/{id}`

- **Description**: Update independent task
- **Auth Required**: Yes
- **Parameters**: `id` (int)

---

## 22. Project Approval Endpoints

### 22.1 Submit for Approval

**POST** `/api/ProjectApproval/submit`

- **Description**: Submit project for approval
- **Auth Required**: Yes
- **Request Body**: `ProjectApprovalDto`

### 22.2 Get Approval Requests

**GET** `/api/ProjectApproval/requests`

- **Description**: Get approval requests
- **Auth Required**: Yes

### 22.3 Approve/Reject Project

**POST** `/api/ProjectApproval/{id}/decision`

- **Description**: Approve or reject project
- **Auth Required**: Yes
- **Parameters**: `id` (int)

---

## 23. Comment Endpoints

### 23.1 Add Comment

**POST** `/api/Comment/add`

- **Description**: Add comment to entity
- **Auth Required**: Yes
- **Request Body**: Comment data

### 23.2 Get Comments

**GET** `/api/Comment/comments`

- **Description**: Get comments for entity
- **Auth Required**: Yes
- **Query Parameters**:
  - `entityType` (string)
  - `entityId` (int)

### 23.3 Update Comment

**PUT** `/api/Comment/{id}`

- **Description**: Update comment
- **Auth Required**: Yes
- **Parameters**: `id` (int)

### 23.4 Delete Comment

**DELETE** `/api/Comment/{id}`

- **Description**: Delete comment
- **Auth Required**: Yes
- **Parameters**: `id` (int)

---

## Data Transfer Objects (DTOs)

### Common DTOs

- **PaginationDto**: Standard pagination parameters
- **AdvancedFilterDto**: Advanced filtering options
- **ResponseDto**: Standard API response format

### User Management DTOs

- **LoginRequestDto**: Username and password
- **RegisterUserDto**: User registration data
- **EditUserDto**: User update data
- **ChangePasswordDto**: Password change data

### Project DTOs

- **CreateProjectDto**: Project creation data
- **UpdateProjectDto**: Project update data
- **ProjectDto**: Project response data

### Task DTOs

- **ProjectTaskCreateDto**: Task creation data
- **ProjectTaskUpdateDto**: Task update data
- **ProjectTaskReadDto**: Task response data

---

## Authentication Flow

1. **Login**: Send credentials to `/api/Auth/login`
2. **Store Tokens**: Save `accessToken` and `refreshToken`
3. **Include Token**: Add `Authorization: Bearer <token>` to all requests
4. **Refresh**: When token expires, use refresh token to get new access token
5. **Logout**: Call logout endpoint to invalidate tokens

## Error Handling

### Standard Error Response

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "fieldName",
      "message": "Field-specific error message"
    }
  ]
}
```

### Common Error Scenarios

- **401 Unauthorized**: Invalid or expired token
- **403 Forbidden**: Insufficient permissions
- **400 Bad Request**: Invalid request data
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server-side error

## Rate Limiting

The API implements rate limiting to prevent abuse. Respect the rate limits and implement exponential backoff for retries.

## File Upload Guidelines

- **Max File Size**: Check with backend team
- **Supported Formats**: Images, PDFs, Office documents
- **Upload Method**: Multipart form data
- **Progress Tracking**: Implement upload progress indicators

## Best Practices

1. **Always handle errors gracefully**
2. **Implement proper loading states**
3. **Cache responses when appropriate**
4. **Use pagination for large datasets**
5. **Implement offline support where possible**
6. **Validate data before sending**
7. **Handle token expiration automatically**

## Support

For API-related questions or issues, contact the backend development team.

---

_Last Updated: [Current Date]_
_Version: 1.0_

# Data Transfer Objects (DTOs) Documentation

This document provides detailed information about the request and response DTOs used in the Project Management System API.

## Authentication DTOs

### LoginRequestDto

```json
{
  "username": "string",
  "password": "string"
}
```

### LoginResponseDto

```json
{
  "accessToken": "string",
  "refreshToken": "string",
  "expiresIn": "number",
  "isFirstLogin": "boolean",
  "user": {
    "id": "string",
    "username": "string",
    "email": "string",
    "roles": ["string"]
  }
}
```

### RefreshTokenRequestDto

```json
{
  "token": "string"
}
```

### ChangePasswordDto

```json
{
  "currentPassword": "string",
  "newPassword": "string",
  "confirmPassword": "string"
}
```

## Project DTOs

### CreateProjectDto

```json
{
  "title": "string",
  "description": "string",
  "startDate": "date",
  "endDate": "date",
  "priority": "string",
  "status": "string",
  "budget": "decimal",
  "managerId": "string",
  "department": "string",
  "tags": ["string"]
}
```

### UpdateProjectDto

```json
{
  "title": "string",
  "description": "string",
  "startDate": "date",
  "endDate": "date",
  "priority": "string",
  "status": "string",
  "budget": "decimal",
  "managerId": "string",
  "department": "string",
  "tags": ["string"]
}
```

### ProjectDto

```json
{
  "id": "int",
  "title": "string",
  "description": "string",
  "startDate": "date",
  "endDate": "date",
  "priority": "string",
  "status": "string",
  "budget": "decimal",
  "managerId": "string",
  "managerName": "string",
  "department": "string",
  "tags": ["string"],
  "createdAt": "datetime",
  "updatedAt": "datetime",
  "progress": "decimal",
  "taskCount": "int",
  "completedTaskCount": "int"
}
```

## Project Task DTOs

### ProjectTaskCreateDto

```json
{
  "title": "string",
  "description": "string",
  "projectId": "int",
  "assignedMemberId": "string",
  "dueDate": "date",
  "priority": "string",
  "estimatedHours": "decimal",
  "milestoneId": "int?",
  "parentTaskId": "int?",
  "tags": ["string"]
}
```

### ProjectTaskUpdateDto

```json
{
  "title": "string",
  "description": "string",
  "assignedMemberId": "string",
  "dueDate": "date",
  "priority": "string",
  "estimatedHours": "decimal",
  "status": "string",
  "tags": ["string"]
}
```

### ProjectTaskReadDto

```json
{
  "id": "int",
  "title": "string",
  "description": "string",
  "projectId": "int",
  "projectTitle": "string",
  "assignedMemberId": "string",
  "assignedMemberName": "string",
  "dueDate": "date",
  "priority": "string",
  "status": "string",
  "estimatedHours": "decimal",
  "actualHours": "decimal",
  "progress": "decimal",
  "milestoneId": "int?",
  "milestoneTitle": "string",
  "parentTaskId": "int?",
  "tags": ["string"],
  "createdAt": "datetime",
  "updatedAt": "datetime",
  "subtasks": ["ProjectTaskReadDto"]
}
```

### UpdateTaskProgressDto

```json
{
  "progress": "decimal"
}
```

### UpdateTaskActualHoursDto

```json
{
  "actualHours": "decimal"
}
```

### RejectTaskDto

```json
{
  "reason": "string"
}
```

## User Management DTOs

### CreateUserRequestDto

```json
{
  "username": "string",
  "email": "string",
  "firstName": "string",
  "lastName": "string",
  "password": "string",
  "confirmPassword": "string",
  "department": "string",
  "role": "string",
  "phoneNumber": "string"
}
```

### EditUserDto

```json
{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "department": "string",
  "role": "string",
  "phoneNumber": "string",
  "isActive": "boolean"
}
```

### UserDto

```json
{
  "id": "string",
  "username": "string",
  "email": "string",
  "firstName": "string",
  "lastName": "string",
  "department": "string",
  "role": "string",
  "phoneNumber": "string",
  "isActive": "boolean",
  "createdAt": "datetime",
  "lastLoginAt": "datetime"
}
```

## User Profile DTOs

### UpdateProfileDto

```json
{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "phoneNumber": "string",
  "department": "string",
  "bio": "string",
  "profilePicture": "string"
}
```

### UserProfileDto

```json
{
  "id": "string",
  "username": "string",
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "phoneNumber": "string",
  "department": "string",
  "role": "string",
  "bio": "string",
  "profilePicture": "string",
  "createdAt": "datetime",
  "lastLoginAt": "datetime"
}
```

## Todo Item DTOs

### TodoItemCreateDto

```json
{
  "title": "string",
  "description": "string",
  "dueDate": "date",
  "priority": "string",
  "projectId": "int?",
  "assignedToId": "string?",
  "tags": ["string"]
}
```

### TodoItemUpdateDto

```json
{
  "title": "string",
  "description": "string",
  "dueDate": "date",
  "priority": "string",
  "status": "string",
  "assignedToId": "string?",
  "tags": ["string"]
}
```

### TodoItemReadDto

```json
{
  "id": "int",
  "title": "string",
  "description": "string",
  "dueDate": "date",
  "priority": "string",
  "status": "string",
  "projectId": "int?",
  "projectTitle": "string",
  "assignedToId": "string?",
  "assignedToName": "string",
  "createdById": "string",
  "createdByName": "string",
  "tags": ["string"],
  "createdAt": "datetime",
  "updatedAt": "datetime",
  "completedAt": "datetime?"
}
```

### RejectTodoItemDto

```json
{
  "reason": "string"
}
```

## Milestone DTOs

### CreateMilestoneDto

```json
{
  "title": "string",
  "description": "string",
  "projectId": "int",
  "dueDate": "date",
  "priority": "string"
}
```

### UpdateMilestoneDto

```json
{
  "title": "string",
  "description": "string",
  "dueDate": "date",
  "priority": "string",
  "status": "string"
}
```

### MilestoneReadDto

```json
{
  "id": "int",
  "title": "string",
  "description": "string",
  "projectId": "int",
  "projectTitle": "string",
  "dueDate": "date",
  "priority": "string",
  "status": "string",
  "progress": "decimal",
  "taskCount": "int",
  "completedTaskCount": "int",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

### MilestoneProgressDto

```json
{
  "id": "int",
  "title": "string",
  "progress": "decimal",
  "taskCount": "int",
  "completedTaskCount": "int",
  "tasks": ["ProjectTaskReadDto"]
}
```

## Issue DTOs

### IssueCreateDto

```json
{
  "title": "string",
  "description": "string",
  "projectId": "int",
  "assignedToId": "string?",
  "priority": "string",
  "severity": "string",
  "category": "string",
  "tags": ["string"]
}
```

### IssueUpdateDto

```json
{
  "title": "string",
  "description": "string",
  "assignedToId": "string?",
  "priority": "string",
  "severity": "string",
  "status": "string",
  "category": "string",
  "tags": ["string"]
}
```

### IssueDto

```json
{
  "id": "int",
  "title": "string",
  "description": "string",
  "projectId": "int",
  "projectTitle": "string",
  "assignedToId": "string?",
  "assignedToName": "string",
  "reportedById": "string",
  "reportedByName": "string",
  "priority": "string",
  "severity": "string",
  "status": "string",
  "category": "string",
  "tags": ["string"],
  "createdAt": "datetime",
  "updatedAt": "datetime",
  "resolvedAt": "datetime?"
}
```

### IssueSearchDto

```json
{
  "searchTerm": "string?",
  "projectId": "int?",
  "assignedToId": "string?",
  "priority": "string?",
  "severity": "string?",
  "status": "string?",
  "category": "string?",
  "dateFrom": "date?",
  "dateTo": "date?",
  "tags": ["string"]
}
```

## Message DTOs

### CreateMessageDto

```json
{
  "recipientIds": ["string"],
  "subject": "string",
  "content": "string",
  "conversationId": "int?",
  "attachments": ["string"]
}
```

### EditMessageDto

```json
{
  "subject": "string",
  "content": "string"
}
```

### MessageDto

```json
{
  "id": "int",
  "senderId": "string",
  "senderName": "string",
  "recipients": [
    {
      "id": "string",
      "name": "string",
      "isRead": "boolean"
    }
  ],
  "subject": "string",
  "content": "string",
  "conversationId": "int?",
  "attachments": ["string"],
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

## Attachment DTOs

### AttachmentUploadDto

```json
{
  "entityType": "string",
  "entityId": "int",
  "description": "string?",
  "tags": ["string"]
}
```

### AttachmentDto

```json
{
  "id": "int",
  "fileName": "string",
  "originalFileName": "string",
  "fileSize": "long",
  "contentType": "string",
  "entityType": "string",
  "entityId": "int",
  "description": "string",
  "tags": ["string"],
  "uploadedById": "string",
  "uploadedByName": "string",
  "uploadedAt": "datetime",
  "downloadUrl": "string"
}
```

### GrantAttachmentPermissionDto

```json
{
  "attachmentId": "int",
  "userId": "string",
  "permissionType": "string"
}
```

## Skills DTOs

### AddSkillRequestDto

```json
{
  "userId": "string",
  "skillName": "string",
  "proficiencyLevel": "string",
  "yearsOfExperience": "int",
  "certifications": ["string"]
}
```

### SkillDto

```json
{
  "id": "int",
  "name": "string",
  "proficiencyLevel": "string",
  "yearsOfExperience": "int",
  "certifications": ["string"],
  "addedAt": "datetime"
}
```

### UserSkillDto

```json
{
  "userId": "string",
  "userName": "string",
  "skills": ["SkillDto"]
}
```

## Assignment DTOs

### CreateAssignmentDto

```json
{
  "projectId": "int",
  "userId": "string",
  "role": "string",
  "startDate": "date",
  "endDate": "date",
  "responsibilities": "string"
}
```

### UpdateAssignmentDto

```json
{
  "role": "string",
  "startDate": "date",
  "endDate": "date",
  "responsibilities": "string",
  "isActive": "boolean"
}
```

### AssignmentDto

```json
{
  "id": "int",
  "projectId": "int",
  "projectTitle": "string",
  "userId": "string",
  "userName": "string",
  "role": "string",
  "startDate": "date",
  "endDate": "date",
  "responsibilities": "string",
  "isActive": "boolean",
  "assignedAt": "datetime",
  "updatedAt": "datetime"
}
```

## Report DTOs

### ReportDto

```json
{
  "reportType": "string",
  "parameters": {
    "dateFrom": "date?",
    "dateTo": "date?",
    "projectId": "int?",
    "userId": "string?",
    "department": "string?",
    "status": "string?",
    "format": "string"
  }
}
```

## Advanced Filter DTOs

### AdvancedFilterDto

```json
{
  "entityType": "string",
  "filters": [
    {
      "field": "string",
      "operator": "string",
      "value": "any",
      "valueType": "string"
    }
  ],
  "sortBy": "string",
  "sortOrder": "string",
  "pagination": {
    "page": "int",
    "pageSize": "int"
  }
}
```

## Pagination DTOs

### PaginationDto

```json
{
  "page": "int",
  "pageSize": "int",
  "totalCount": "int",
  "totalPages": "int",
  "hasNextPage": "boolean",
  "hasPreviousPage": "boolean"
}
```

### PaginatedResult<T>

```json
{
  "data": ["T"],
  "pagination": "PaginationDto"
}
```

## Common Response DTOs

### Standard Response

```json
{
  "success": "boolean",
  "data": "any",
  "message": "string",
  "errors": [
    {
      "field": "string",
      "message": "string"
    }
  ]
}
```

### Error Response

```json
{
  "success": "false",
  "message": "string",
  "errors": [
    {
      "field": "string",
      "message": "string"
    }
  ]
}
```

## Enums and Constants

### Priority Levels

- `"Low"`
- `"Medium"`
- `"High"`
- `"Critical"`

### Status Values

- `"Pending"`
- `"InProgress"`
- `"Completed"`
- `"Rejected"`
- `"Cancelled"`
- `"OnHold"`

### User Roles

- `"Admin"`
- `"President"`
- `"Vice-President"`
- `"Director"`
- `"Manager"`
- `"Supervisor"`
- `"Employee"`

### Entity Types

- `"Project"`
- `"ProjectTask"`
- `"TodoItem"`
- `"Issue"`
- `"Milestone"`
- `"Message"`

### Notification Delivery Methods

- `"InApp"`
- `"Email"`
- `"SMS"`

## File Upload Specifications

### Supported File Types

- **Images**: JPG, JPEG, PNG, GIF, BMP
- **Documents**: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX
- **Text**: TXT, RTF
- **Archives**: ZIP, RAR, 7Z

### File Size Limits

- **Images**: 10MB max
- **Documents**: 25MB max
- **Other files**: 50MB max

### Upload Headers

```
Content-Type: multipart/form-data
Authorization: Bearer <token>
```

## Date and Time Formats

All dates in the API use ISO 8601 format:

- **Date**: `YYYY-MM-DD`
- **DateTime**: `YYYY-MM-DDTHH:mm:ssZ`
- **Time**: `HH:mm:ss`

## Currency Format

All monetary values are in decimal format with 2 decimal places:

- **Example**: `1234.56`

## Notes for Frontend Implementation

1. **Always validate required fields** before sending requests
2. **Handle file uploads** with progress indicators
3. **Implement proper error handling** for all API calls
4. **Use appropriate HTTP methods** (GET, POST, PUT, DELETE)
5. **Include authentication headers** for all protected endpoints
6. **Handle pagination** for large datasets
7. **Implement search and filtering** using the provided DTOs
8. **Cache responses** when appropriate to improve performance
9. **Handle token expiration** gracefully with automatic refresh
10. **Validate response data** before using it in the UI

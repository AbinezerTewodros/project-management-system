0# Detailed API Endpoints Guide

This document provides comprehensive details for the specified API endpoints, including their purpose, usage, testing instructions, and mock inputs/outputs.

---

## 1. AdvancedFilter API Endpoints

### Purpose

Advanced filtering system for projects, tasks, assignments, and issues with dynamic filter options and cascaded filtering capabilities.

### Endpoints

#### 1.1 Filter Projects

**POST** `/api/advancedfilter/projects`

**Purpose**: Apply advanced filters to project data with complex criteria.

**Request Body**:

```json
{
  "filters": [
    {
      "field": "status",
      "operator": "equals",
      "value": "Active"
    },
    {
      "field": "priority",
      "operator": "in",
      "value": ["High", "Medium"]
    },
    {
      "field": "createdDate",
      "operator": "between",
      "value": ["2024-01-01", "2024-12-31"]
    }
  ],
  "sortBy": "createdDate",
  "sortDirection": "desc",
  "pageNumber": 1,
  "pageSize": 20
}
```

**Expected Output**:

```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "id": 1,
        "name": "Project Alpha",
        "status": "Active",
        "priority": "High",
        "createdDate": "2024-06-15T10:30:00Z"
      }
    ],
    "totalCount": 1,
    "pageNumber": 1,
    "pageSize": 20
  }
}
```

**Test Command**:

```bash
curl -X POST "$BASE/api/advancedfilter/projects" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"filters":[{"field":"status","operator":"equals","value":"Active"}],"pageNumber":1,"pageSize":20}'
```

#### 1.2 Get Project Filter Options

**GET** `/api/advancedfilter/projects/options`

**Purpose**: Retrieve available filter options for projects.

**Expected Output**:

```json
{
  "success": true,
  "data": {
    "statusOptions": ["Active", "Inactive", "Completed", "Cancelled"],
    "priorityOptions": ["Low", "Medium", "High", "Critical"],
    "departmentOptions": ["IT", "HR", "Finance", "Operations"],
    "dateRanges": {
      "createdDate": {
        "min": "2023-01-01",
        "max": "2024-12-31"
      }
    }
  }
}
```

#### 1.3 Filter Tasks

**POST** `/api/advancedfilter/tasks`

**Purpose**: Apply advanced filters to task data.

**Request Body**:

```json
{
  "filters": [
    {
      "field": "status",
      "operator": "equals",
      "value": "InProgress"
    },
    {
      "field": "assigneeId",
      "operator": "equals",
      "value": "user123"
    }
  ],
  "sortBy": "dueDate",
  "sortDirection": "asc"
}
```

#### 1.4 Search

**GET** `/api/advancedfilter/search?searchTerm=project&searchFields=name,description`

**Purpose**: Perform full-text search across multiple fields.

**Expected Output**:

```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": 1,
        "name": "Project Management System",
        "description": "A comprehensive project management solution",
        "type": "project",
        "relevanceScore": 0.95
      }
    ],
    "totalCount": 1
  }
}
```

---

## 2. Attachments API Endpoints

### Purpose

Comprehensive file attachment management with permissions, previews, thumbnails, and secure downloads.

### Endpoints

#### 2.1 Upload Attachment

**POST** `/api/attachments/upload`

**Purpose**: Upload a file attachment with metadata.

**Request Body** (multipart/form-data):

```
File: [binary file data]
EntityType: "Project"
EntityId: "123"
Description: "Project documentation"
Tags: "documentation,important"
```

**Expected Output**:

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "fileName": "project-doc.pdf",
    "fileSize": 1024000,
    "contentType": "application/pdf",
    "uploadedAt": "2024-01-15T10:30:00Z",
    "uploadedBy": "user123"
  }
}
```

**Test Command**:

```bash
curl -X POST "$BASE/api/attachments/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@document.pdf" \
  -F "EntityType=Project" \
  -F "EntityId=123" \
  -F "Description=Project documentation"
```

#### 2.2 Get Attachment

**GET** `/api/attachments/Get-By-Id/{id}`

**Purpose**: Retrieve attachment details by ID.

**Expected Output**:

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "fileName": "project-doc.pdf",
    "fileSize": 1024000,
    "contentType": "application/pdf",
    "uploadedAt": "2024-01-15T10:30:00Z",
    "uploadedBy": "user123",
    "permissions": {
      "canView": true,
      "canDownload": true,
      "canDelete": false
    }
  }
}
```

#### 2.3 Generate Preview

**GET** `/api/attachments/preview/{fileName}`

**Purpose**: Generate a preview of the attachment.

**Expected Output**:

```json
{
  "success": true,
  "data": {
    "previewUrl": "/api/attachments/preview/project-doc.pdf",
    "previewType": "pdf",
    "pageCount": 5,
    "thumbnailUrl": "/api/attachments/thumbnail/project-doc.pdf"
  }
}
```

#### 2.4 Get Thumbnail

**GET** `/api/attachments/thumbnail/{fileName}?width=200&height=200`

**Purpose**: Generate a thumbnail image of the attachment.

**Expected Output**: Binary image data (JPEG)

#### 2.5 Grant Permission

**POST** `/api/attachments/permissions/grant`

**Purpose**: Grant access permissions for an attachment.

**Request Body**:

```json
{
  "attachmentId": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "user456",
  "permissionType": "View"
}
```

**Expected Output**:

```json
{
  "success": true,
  "data": {
    "id": "perm123",
    "attachmentId": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "user456",
    "permissionType": "View",
    "grantedAt": "2024-01-15T10:30:00Z"
  }
}
```

#### 2.6 Secure Download

**GET** `/api/attachments/secured-download/{id}?token=abc123`

**Purpose**: Download attachment using a secure token.

**Expected Output**: Binary file data

---

## 3. Auth API Endpoints (Specific)

### Purpose

Authentication endpoints for cookie-based sessions and session management.

### Endpoints

#### 3.1 Cookie Login

**POST** `/api/auth/cookie-login`

**Purpose**: Authenticate user and create a persistent cookie session.

**Request Body**:

```json
{
  "username": "john.doe",
  "password": "SecurePassword123"
}
```

**Expected Output**:

```json
{
  "success": true,
  "message": "Signed in with cookie.",
  "data": {
    "user": {
      "userName": "john.doe",
      "email": "john.doe@company.com"
    }
  }
}
```

**Test Command**:

```bash
curl -X POST "$BASE/api/auth/cookie-login" \
  -H "Content-Type: application/json" \
  -d '{"username":"john.doe","password":"SecurePassword123"}'
```

#### 3.2 Cookie Logout

**POST** `/api/auth/cookie-logout`

**Purpose**: Sign out user and clear session cookies.

**Expected Output**:

```json
{
  "success": true,
  "message": "Signed out and session cleared."
}
```

#### 3.3 Session Demo

**GET** `/api/auth/session-demo`

**Purpose**: Demonstrate session functionality and retrieve session data.

**Expected Output**:

```json
{
  "success": true,
  "data": {
    "visits": 5,
    "lastUser": "john.doe"
  }
}
```

---

## 4. BackgroundJob API Endpoints

### Purpose

Background job management for email notifications, reminders, reports, and data cleanup.

### Endpoints

#### 4.1 Get Job Statistics

**GET** `/api/backgroundjob/statistics`

**Purpose**: Retrieve background job system statistics.

**Expected Output**:

```json
{
  "success": true,
  "data": {
    "totalJobs": 150,
    "completedJobs": 120,
    "failedJobs": 5,
    "runningJobs": 10,
    "pendingJobs": 15,
    "averageProcessingTime": "00:02:30"
  }
}
```

#### 4.2 Get Jobs

**GET** `/api/backgroundjob/jobs?status=Completed&page=1&pageSize=20`

**Purpose**: Retrieve list of background jobs with filtering.

**Expected Output**:

```json
{
  "success": true,
  "data": [
    {
      "jobId": "job123",
      "jobType": "EmailJob",
      "status": "Completed",
      "createdAt": "2024-01-15T10:30:00Z",
      "completedAt": "2024-01-15T10:32:00Z",
      "duration": "00:02:00"
    }
  ],
  "page": 1,
  "pageSize": 20
}
```

#### 4.3 Enqueue Email Job

**POST** `/api/backgroundjob/enqueue-email`

**Purpose**: Queue an email job for background processing.

**Request Body**:

```json
{
  "email": "user@example.com",
  "subject": "Project Update",
  "body": "Your project has been updated with new information."
}
```

**Expected Output**:

```json
{
  "success": true,
  "data": {
    "jobId": "email-job-456",
    "message": "Email job enqueued successfully"
  }
}
```

#### 4.4 Schedule Reminder

**POST** `/api/backgroundjob/schedule-reminder`

**Purpose**: Schedule a reminder job for a specific time.

**Request Body**:

```json
{
  "userId": "user123",
  "message": "Don't forget to submit your report",
  "reminderTime": "2024-01-16T09:00:00Z"
}
```

**Expected Output**:

```json
{
  "success": true,
  "data": {
    "jobId": "reminder-job-789",
    "message": "Reminder job scheduled successfully"
  }
}
```

---

## 5. BulkOperations API Endpoints

### Purpose

Perform bulk operations on multiple entities (projects, tasks, users) with background job processing.

### Endpoints

#### 5.1 Bulk Update Project Tasks

**POST** `/api/bulkoperations/project-tasks/update`

**Purpose**: Update multiple project tasks in a single operation.

**Request Body**:

```json
[
  {
    "taskId": 1,
    "status": "Completed",
    "progress": 100,
    "notes": "Task completed successfully"
  },
  {
    "taskId": 2,
    "status": "InProgress",
    "progress": 75,
    "notes": "Task in progress"
  }
]
```

**Expected Output**:

```json
{
  "success": true,
  "data": "bulk-update-job-123",
  "message": "Bulk update job queued successfully. Job ID: bulk-update-job-123. Processing 2 tasks."
}
```

#### 5.2 Bulk Delete Project Tasks

**POST** `/api/bulkoperations/project-tasks/delete`

**Purpose**: Delete multiple project tasks.

**Request Body**:

```json
[1, 2, 3, 4, 5]
```

**Expected Output**:

```json
{
  "success": true,
  "data": "bulk-delete-job-456",
  "message": "Bulk deletion job queued successfully. Job ID: bulk-delete-job-456. Processing 5 tasks."
}
```

#### 5.3 Bulk Assign Project Tasks

**POST** `/api/bulkoperations/project-tasks/assign`

**Purpose**: Assign multiple tasks to users.

**Request Body**:

```json
[
  {
    "taskId": 1,
    "assigneeId": "user123",
    "dueDate": "2024-01-20T17:00:00Z"
  },
  {
    "taskId": 2,
    "assigneeId": "user456",
    "dueDate": "2024-01-25T17:00:00Z"
  }
]
```

#### 5.4 Get Job Status

**GET** `/api/bulkoperations/jobs/{jobId}/status`

**Purpose**: Check the status of a bulk operation job.

**Expected Output**:

```json
{
  "success": true,
  "data": {
    "jobId": "bulk-update-job-123",
    "status": "Completed",
    "progress": 100,
    "processedItems": 2,
    "successfulItems": 2,
    "failedItems": 0,
    "startedAt": "2024-01-15T10:30:00Z",
    "completedAt": "2024-01-15T10:32:00Z"
  }
}
```

---

## 6. Cache API Endpoints

### Purpose

Cache management operations for performance optimization and data caching.

### Endpoints

#### 6.1 Get Cache Statistics

**GET** `/api/cache/statistics`

**Purpose**: Retrieve cache system statistics.

**Expected Output**:

```json
{
  "success": true,
  "data": {
    "totalKeys": 1500,
    "memoryUsage": "256MB",
    "hitRate": 0.85,
    "missRate": 0.15,
    "evictionCount": 25
  }
}
```

#### 6.2 Set Cache Value

**POST** `/api/cache/set`

**Purpose**: Set a cache value with optional expiration.

**Request Body**:

```json
{
  "key": "user:123:profile",
  "value": {
    "name": "John Doe",
    "email": "john@example.com",
    "role": "Manager"
  },
  "expiry": "00:30:00"
}
```

**Expected Output**:

```json
{
  "success": true,
  "message": "Cache value set successfully"
}
```

#### 6.3 Get Cache Value

**GET** `/api/cache/get/{key}`

**Purpose**: Retrieve a cached value.

**Expected Output**:

```json
{
  "success": true,
  "data": {
    "name": "John Doe",
    "email": "john@example.com",
    "role": "Manager"
  }
}
```

#### 6.4 Clear Cache

**POST** `/api/cache/clear`

**Purpose**: Clear specific cache entries or all cache.

**Request Body**:

```json
{
  "cacheType": "UserCache",
  "key": "user:123"
}
```

**Expected Output**:

```json
{
  "success": true,
  "message": "Cache cleared successfully"
}
```

---

## 7. CascadedFilter API Endpoints

### Purpose

Provide cascaded filtering options for UI forms with hierarchical data relationships.

### Endpoints

#### 7.1 Get Departments

**GET** `/api/cascadedfilter/departments`

**Purpose**: Retrieve list of departments for filtering.

**Expected Output**:

```json
{
  "success": true,
  "data": [
    {
      "id": "IT",
      "name": "Information Technology",
      "count": 25
    },
    {
      "id": "HR",
      "name": "Human Resources",
      "count": 15
    }
  ]
}
```

#### 7.2 Get Projects by Department

**GET** `/api/cascadedfilter/projects?department=IT`

**Purpose**: Get projects filtered by department.

**Expected Output**:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "IT Infrastructure Upgrade",
      "department": "IT",
      "status": "Active"
    },
    {
      "id": 2,
      "name": "Database Migration",
      "department": "IT",
      "status": "Planning"
    }
  ]
}
```

#### 7.3 Get Users by Department

**GET** `/api/cascadedfilter/users?department=IT`

**Purpose**: Get users filtered by department.

**Expected Output**:

```json
{
  "success": true,
  "data": [
    {
      "id": "user123",
      "name": "John Smith",
      "email": "john.smith@company.com",
      "department": "IT",
      "role": "Developer"
    }
  ]
}
```

#### 7.4 Get Cascaded Filter Data

**POST** `/api/cascadedfilter/filter-data`

**Purpose**: Get comprehensive filter data for complex forms.

**Request Body**:

```json
{
  "entityType": "Project",
  "filters": {
    "department": "IT",
    "status": "Active"
  }
}
```

**Expected Output**:

```json
{
  "success": true,
  "data": {
    "departments": [...],
    "projects": [...],
    "users": [...],
    "statuses": [...]
  }
}
```

---

## 8. DataProcessing API Endpoints

### Purpose

Comprehensive data processing operations including reports, exports, imports, analytics, and data management.

### Endpoints

#### 8.1 Generate Report

**POST** `/api/dataprocessing/reports/generate`

**Purpose**: Generate various types of reports.

**Request Body**:

```json
{
  "reportType": "ProjectSummary",
  "parameters": {
    "startDate": "2024-01-01",
    "endDate": "2024-12-31",
    "department": "IT"
  },
  "format": "PDF"
}
```

**Expected Output**:

```json
{
  "success": true,
  "data": "report-job-789",
  "message": "Report generation job queued successfully. Job ID: report-job-789. Type: ProjectSummary"
}
```

#### 8.2 Export Data

**POST** `/api/dataprocessing/export`

**Purpose**: Export data in various formats.

**Request Body**:

```json
{
  "entityType": "Project",
  "filters": {
    "status": "Active",
    "department": "IT"
  },
  "format": "Excel",
  "includeAttachments": false
}
```

**Expected Output**:

```json
{
  "success": true,
  "data": "export-job-456",
  "message": "Data export job queued successfully. Job ID: export-job-456. Entity: Project"
}
```

#### 8.3 Import Data

**POST** `/api/dataprocessing/import`

**Purpose**: Import data from external sources.

**Request Body**:

```json
{
  "entityType": "User",
  "sourceType": "CSV",
  "data": "base64-encoded-csv-data",
  "mapping": {
    "name": "FullName",
    "email": "EmailAddress",
    "department": "Department"
  }
}
```

**Expected Output**:

```json
{
  "success": true,
  "data": "import-job-123",
  "message": "Data import job queued successfully. Job ID: import-job-123. Entity: User"
}
```

#### 8.4 Aggregate Data

**POST** `/api/dataprocessing/aggregate`

**Purpose**: Perform data aggregation and analysis.

**Request Body**:

```json
{
  "entityType": "Project",
  "aggregationType": "PerformanceMetrics",
  "groupBy": ["department", "status"],
  "metrics": ["completionRate", "averageDuration"]
}
```

**Expected Output**:

```json
{
  "success": true,
  "data": "aggregation-job-321",
  "message": "Data aggregation job queued successfully. Job ID: aggregation-job-321. Entity: Project"
}
```

#### 8.5 Get Job Status

**GET** `/api/dataprocessing/jobs/{jobId}/status`

**Purpose**: Check the status of a data processing job.

**Expected Output**:

```json
{
  "success": true,
  "data": {
    "jobId": "report-job-789",
    "status": "Completed",
    "progress": 100,
    "resultUrl": "/api/dataprocessing/jobs/report-job-789/result",
    "createdAt": "2024-01-15T10:30:00Z",
    "completedAt": "2024-01-15T10:35:00Z"
  }
}
```

---

## 9. FileOperations API Endpoints

### Purpose

Advanced file operations including processing, conversion, analysis, and bulk operations.

### Endpoints

#### 9.1 Upload File

**POST** `/api/fileoperations/upload`

**Purpose**: Upload files with processing options.

**Request Body**:

```json
{
  "file": "base64-encoded-file-data",
  "fileName": "document.pdf",
  "contentType": "application/pdf",
  "entityType": "Project",
  "entityId": "123"
}
```

**Expected Output**:

```json
{
  "success": true,
  "data": "upload-job-456",
  "message": "File upload job queued successfully. Job ID: upload-job-456. File: document.pdf"
}
```

#### 9.2 Process File

**POST** `/api/fileoperations/process`

**Purpose**: Process uploaded files (OCR, analysis, etc.).

**Request Body**:

```json
{
  "attachmentId": "550e8400-e29b-41d4-a716-446655440000",
  "processingType": "OCR"
}
```

**Expected Output**:

```json
{
  "success": true,
  "data": "process-job-789",
  "message": "File processing job queued successfully. Job ID: process-job-789. Type: OCR"
}
```

#### 9.3 Convert File Format

**POST** `/api/fileoperations/convert`

**Purpose**: Convert files between different formats.

**Request Body**:

```json
{
  "attachmentId": "550e8400-e29b-41d4-a716-446655440000",
  "targetFormat": "PDF"
}
```

**Expected Output**:

```json
{
  "success": true,
  "data": "convert-job-123",
  "message": "File format conversion job queued successfully. Job ID: convert-job-123. Target: PDF"
}
```

#### 9.4 Analyze File Content

**POST** `/api/fileoperations/analyze`

**Purpose**: Analyze file content for metadata and insights.

**Request Body**:

```json
{
  "attachmentId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Expected Output**:

```json
{
  "success": true,
  "data": "analyze-job-456",
  "message": "File content analysis job queued successfully. Job ID: analyze-job-456"
}
```

#### 9.5 Get Job Status

**GET** `/api/fileoperations/jobs/{jobId}/status`

**Purpose**: Check the status of a file operation job.

**Expected Output**:

```json
{
  "success": true,
  "data": {
    "jobId": "process-job-789",
    "status": "Completed",
    "progress": 100,
    "result": {
      "processedFileUrl": "/api/files/processed/result.pdf",
      "metadata": {
        "pageCount": 5,
        "wordCount": 1250,
        "language": "en"
      }
    }
  }
}
```

---

## Testing Guidelines

### General Testing Approach

1. **Authentication**: All endpoints require JWT token in Authorization header
2. **Base URL**: Use your backend base URL (e.g., `http://localhost:8080`)
3. **Content-Type**: Use `application/json` for JSON requests, `multipart/form-data` for file uploads
4. **Error Handling**: Check for appropriate HTTP status codes and error messages

### Common Test Scenarios

1. **Valid Requests**: Test with proper authentication and valid data
2. **Invalid Authentication**: Test without token or with invalid token
3. **Invalid Data**: Test with malformed or missing required fields
4. **Permission Tests**: Test with different user roles and permissions
5. **Edge Cases**: Test with empty data, large files, special characters

### Performance Testing

1. **Load Testing**: Test with multiple concurrent requests
2. **File Size Limits**: Test with various file sizes
3. **Bulk Operations**: Test with large datasets
4. **Timeout Handling**: Test long-running operations

### Security Testing

1. **File Upload Security**: Test with malicious files
2. **Permission Bypass**: Test unauthorized access attempts
3. **Data Validation**: Test with SQL injection attempts
4. **Rate Limiting**: Test for rate limiting on sensitive endpoints

---

## Integration Notes

### Frontend Integration

1. **State Management**: Use appropriate state management for job status tracking
2. **Progress Indicators**: Implement progress bars for long-running operations
3. **Error Handling**: Implement comprehensive error handling and user feedback
4. **File Upload**: Use proper file upload components with progress tracking

### Backend Integration

1. **Background Jobs**: Ensure proper job queue configuration
2. **File Storage**: Configure appropriate file storage solutions
3. **Caching**: Implement proper caching strategies
4. **Monitoring**: Set up monitoring for job processing and system health

### Database Considerations

1. **Indexing**: Ensure proper database indexing for filter operations
2. **Cleanup**: Implement data cleanup strategies for temporary files
3. **Backup**: Regular backup of processed data and configurations
4. **Performance**: Monitor database performance for bulk operations

This comprehensive guide provides detailed information for implementing and testing all the specified API endpoints. Each endpoint includes purpose, request/response examples, and testing instructions to ensure proper integration and functionality.


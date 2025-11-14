OKay look through this
📎 Adding file to project: DNN_Assignment_2.pdf
CreateProject.tsx:487 📎 Files in project now: 1
CreateProject.tsx:1444 🔍 Form validation check:
CreateProject.tsx:1445 - Title: Sample 9
CreateProject.tsx:1446 - Due Date: 2025-12-18
CreateProject.tsx:1447 - Manager ID: 91506b85-3009-4cd1-9189-d51ac31421b3
CreateProject.tsx:1448 - Button disabled: false
CreateProject.tsx:564 🔍 Project data being sent: {
  "title": "Sample 9",
  "description": "sample 9",
  "projectOwner": "Abiy",
  "projectOwnerEmail": "abiy@gmail.com",
  "projectOwnerPhone": "0900000000",
  "department": "SDC",
  "priority": "Medium",
  "dueDate": "2025-12-18",
  "status": "Active"
}
CreateProject.tsx:565 🔍 NewProject object: {title: 'Sample 9', description: 'sample 9', dueDate: '2025-12-18', priority: 'Medium', department: 'SDC', …}
CreateProject.tsx:566 🔍 Form field values:
CreateProject.tsx:567 - Title: Sample 9
CreateProject.tsx:568 - Description: sample 9
CreateProject.tsx:569 - Project Owner: Abiy
CreateProject.tsx:570 - Project Owner Email: abiy@gmail.com
CreateProject.tsx:571 - Project Owner Phone: 0900000000
CreateProject.tsx:572 - Department: SDC
CreateProject.tsx:573 - Priority: Medium
CreateProject.tsx:574 - Due Date: 2025-12-18
projectService.ts:157 🔍 ProjectService - Input received: {
  "title": "Sample 9",
  "description": "sample 9",
  "projectOwner": "Abiy",
  "projectOwnerEmail": "abiy@gmail.com",
  "projectOwnerPhone": "0900000000",
  "department": "SDC",
  "priority": "Medium",
  "dueDate": "2025-12-18",
  "status": "Active"
}
projectService.ts:158 🔍 ProjectService - Payload being sent: {
  "projectName": "Sample 9",
  "description": "sample 9",
  "projectOwner": "Abiy",
  "projectOwnerEmail": "abiy@gmail.com",
  "projectOwnerPhone": "0900000000",
  "department": "SDC",
  "priority": "Medium",
  "dueDate": "2025-12-18",
  "status": "Active"
}
api.ts:145 🌐 POST API Call: http://localhost:8080/api/Project
api.ts:146 📦 POST Data: {
  "projectName": "Sample 9",
  "description": "sample 9",
  "projectOwner": "Abiy",
  "projectOwnerEmail": "abiy@gmail.com",
  "projectOwnerPhone": "0900000000",
  "department": "SDC",
  "priority": "Medium",
  "dueDate": "2025-12-18",
  "status": "Active"
}
api.ts:147 🔑 Auth Header: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IjkxNTA2Yjg1LTMwMDktNGNkMS05MTg5LWQ1MWFjMzE0MjFiMyIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL25hbWUiOiJBYml5IiwiaHR0cDovL3NjaGVtYXMueG1sc29hcC5vcmcvd3MvMjAwNS8wNS9pZGVudGl0eS9jbGFpbXMvZW1haWxhZGRyZXNzIjoiYWJpeUBnbWFpbC5jb20iLCJEZXBhcnRtZW50IjoiU0RDIiwiaHR0cDovL3NjaGVtYXMubWljcm9zb2Z0LmNvbS93cy8yMDA4LzA2L2lkZW50aXR5L2NsYWltcy9yb2xlIjoiTWFuYWdlciIsImV4cCI6MTc1OTMwNzc3OCwiaXNzIjoiaHR0cHM6Ly9sb2NhbGhvc3Q6NzA0OCIsImF1ZCI6Imh0dHBzOi8vbG9jYWxob3N0OjcwNDgifQ._9E4Rxz-6viSm81LbmubeKWvBjINCSAruoCHkeIPqNI
api.ts:149 ✅ POST Success: {success: true, message: 'Project created successfully', data: {…}, errors: Array(0), timestamp: '2025-10-01T07:37:29.2027294Z', …}
CreateProject.tsx:578 📊 Project creation response: {data: {…}, success: true}
CreateProject.tsx:582 🔍 ===== FULL RESPONSE DEBUGGING =====
CreateProject.tsx:583 🔍 Response type: object
CreateProject.tsx:584 🔍 Response keys: (2) ['data', 'success']
CreateProject.tsx:585 🔍 Full response structure: {
  "data": {
    "success": true,
    "message": "Project created successfully",
    "data": {
      "id": 22,
      "description": "sample 9",
      "projectName": "Sample 9",
      "department": "SDC",
      "projectOwner": "Abiy",
      "projectOwnerPhone": "0900000000",
      "projectOwnerEmail": "abiy@gmail.com",
      "priority": "Medium",
      "dueDate": "2025-12-18T00:00:00",
      "status": "Active",
      "createdDate": "2025-10-01T07:37:29.098581Z",
      "updatedDate": "2025-10-01T07:37:29.098581Z",
      "createUser": "91506b85-3009-4cd1-9189-d51ac31421b3",
      "updateUser": "91506b85-3009-4cd1-9189-d51ac31421b3",
      "version": "AAAAAAABAi0=",
      "approvalStatus": "AutoApproved",
      "createdByUserId": "91506b85-3009-4cd1-9189-d51ac31421b3",
      "approvedByUserId": null,
      "approvalDate": null,
      "approvalNotes": null,
      "rejectionReason": null
    },
    "errors": [],
    "timestamp": "2025-10-01T07:37:29.2027294Z",
    "correlationId": null
  },
  "success": true
}
CreateProject.tsx:588 🔍 data exists: true
CreateProject.tsx:589 🔍 data type: object
CreateProject.tsx:590 🔍 data keys: (6) ['success', 'message', 'data', 'errors', 'timestamp', 'correlationId']
CreateProject.tsx:591 🔍 data structure: {
  "success": true,
  "message": "Project created successfully",
  "data": {
    "id": 22,
    "description": "sample 9",
    "projectName": "Sample 9",
    "department": "SDC",
    "projectOwner": "Abiy",
    "projectOwnerPhone": "0900000000",
    "projectOwnerEmail": "abiy@gmail.com",
    "priority": "Medium",
    "dueDate": "2025-12-18T00:00:00",
    "status": "Active",
    "createdDate": "2025-10-01T07:37:29.098581Z",
    "updatedDate": "2025-10-01T07:37:29.098581Z",
    "createUser": "91506b85-3009-4cd1-9189-d51ac31421b3",
    "updateUser": "91506b85-3009-4cd1-9189-d51ac31421b3",
    "version": "AAAAAAABAi0=",
    "approvalStatus": "AutoApproved",
    "createdByUserId": "91506b85-3009-4cd1-9189-d51ac31421b3",
    "approvedByUserId": null,
    "approvalDate": null,
    "approvalNotes": null,
    "rejectionReason": null
  },
  "errors": [],
  "timestamp": "2025-10-01T07:37:29.2027294Z",
  "correlationId": null
}
CreateProject.tsx:596 🔍 ===== END DEBUGGING =====
CreateProject.tsx:599 🔍 Full response structure: {
  "data": {
    "success": true,
    "message": "Project created successfully",
    "data": {
      "id": 22,
      "description": "sample 9",
      "projectName": "Sample 9",
      "department": "SDC",
      "projectOwner": "Abiy",
      "projectOwnerPhone": "0900000000",
      "projectOwnerEmail": "abiy@gmail.com",
      "priority": "Medium",
      "dueDate": "2025-12-18T00:00:00",
      "status": "Active",
      "createdDate": "2025-10-01T07:37:29.098581Z",
      "updatedDate": "2025-10-01T07:37:29.098581Z",
      "createUser": "91506b85-3009-4cd1-9189-d51ac31421b3",
      "updateUser": "91506b85-3009-4cd1-9189-d51ac31421b3",
      "version": "AAAAAAABAi0=",
      "approvalStatus": "AutoApproved",
      "createdByUserId": "91506b85-3009-4cd1-9189-d51ac31421b3",
      "approvedByUserId": null,
      "approvalDate": null,
      "approvalNotes": null,
      "rejectionReason": null
    },
    "errors": [],
    "timestamp": "2025-10-01T07:37:29.2027294Z",
    "correlationId": null
  },
  "success": true
}
CreateProject.tsx:600 🔍 Response data: {success: true, message: 'Project created successfully', data: {…}, errors: Array(0), timestamp: '2025-10-01T07:37:29.2027294Z', …}
CreateProject.tsx:601 🔍 Response data type: object
CreateProject.tsx:602 🔍 Response data keys: (6) ['success', 'message', 'data', 'errors', 'timestamp', 'correlationId']
CreateProject.tsx:613 🔍 ===== RESPONSE STRUCTURE DEBUGGING =====
CreateProject.tsx:614 🔍 Full response: {
  "data": {
    "success": true,
    "message": "Project created successfully",
    "data": {
      "id": 22,
      "description": "sample 9",
      "projectName": "Sample 9",
      "department": "SDC",
      "projectOwner": "Abiy",
      "projectOwnerPhone": "0900000000",
      "projectOwnerEmail": "abiy@gmail.com",
      "priority": "Medium",
      "dueDate": "2025-12-18T00:00:00",
      "status": "Active",
      "createdDate": "2025-10-01T07:37:29.098581Z",
      "updatedDate": "2025-10-01T07:37:29.098581Z",
      "createUser": "91506b85-3009-4cd1-9189-d51ac31421b3",
      "updateUser": "91506b85-3009-4cd1-9189-d51ac31421b3",
      "version": "AAAAAAABAi0=",
      "approvalStatus": "AutoApproved",
      "createdByUserId": "91506b85-3009-4cd1-9189-d51ac31421b3",
      "approvedByUserId": null,
      "approvalDate": null,
      "approvalNotes": null,
      "rejectionReason": null
    },
    "errors": [],
    "timestamp": "2025-10-01T07:37:29.2027294Z",
    "correlationId": null
  },
  "success": true
}
CreateProject.tsx:615 🔍 data.success: true
CreateProject.tsx:616 🔍 data.data exists: true
CreateProject.tsx:617 🔍 data.data type: object
CreateProject.tsx:618 🔍 data.data structure: {success: true, message: 'Project created successfully', data: {…}, errors: Array(0), timestamp: '2025-10-01T07:37:29.2027294Z', …}
CreateProject.tsx:619 🔍 ===== END RESPONSE STRUCTURE DEBUGGING =====
CreateProject.tsx:623 🔍 ===== PROJECT ID EXTRACTION DEBUGGING =====
CreateProject.tsx:624 🔍 data.success: true
CreateProject.tsx:625 🔍 data.data exists: true
CreateProject.tsx:626 🔍 data.data type: object
CreateProject.tsx:627 🔍 data.data keys: (6) ['success', 'message', 'data', 'errors', 'timestamp', 'correlationId']
CreateProject.tsx:628 🔍 data.data structure: {
  "success": true,
  "message": "Project created successfully",
  "data": {
    "id": 22,
    "description": "sample 9",
    "projectName": "Sample 9",
    "department": "SDC",
    "projectOwner": "Abiy",
    "projectOwnerPhone": "0900000000",
    "projectOwnerEmail": "abiy@gmail.com",
    "priority": "Medium",
    "dueDate": "2025-12-18T00:00:00",
    "status": "Active",
    "createdDate": "2025-10-01T07:37:29.098581Z",
    "updatedDate": "2025-10-01T07:37:29.098581Z",
    "createUser": "91506b85-3009-4cd1-9189-d51ac31421b3",
    "updateUser": "91506b85-3009-4cd1-9189-d51ac31421b3",
    "version": "AAAAAAABAi0=",
    "approvalStatus": "AutoApproved",
    "createdByUserId": "91506b85-3009-4cd1-9189-d51ac31421b3",
    "approvedByUserId": null,
    "approvalDate": null,
    "approvalNotes": null,
    "rejectionReason": null
  },
  "errors": [],
  "timestamp": "2025-10-01T07:37:29.2027294Z",
  "correlationId": null
}
CreateProject.tsx:633 🔍 Trying to extract project ID:
CreateProject.tsx:634 🔍 projectData.id: undefined
CreateProject.tsx:635 🔍 projectData.projectId: undefined
CreateProject.tsx:636 🔍 projectData.Id: undefined
CreateProject.tsx:637 🔍 (data as any).id: undefined
CreateProject.tsx:641 🔍 actualProjectData: {id: 22, description: 'sample 9', projectName: 'Sample 9', department: 'SDC', projectOwner: 'Abiy', …}
CreateProject.tsx:642 🔍 actualProjectData.id: 22
CreateProject.tsx:647 🔍 Final extracted projectId: 22
CreateProject.tsx:648 🔍 Project ID is undefined? false
CreateProject.tsx:649 🔍 ===== END PROJECT ID DEBUGGING =====
CreateProject.tsx:651 ✅ Project created successfully with ID: 22
CreateProject.tsx:654 📎 Files to upload: 1
CreateProject.tsx:656 📎 File details: [{…}]
CreateProject.tsx:668 📎 Uploading 1 files for project: 22
CreateProject.tsx:669 📎 Upload endpoint: http://localhost:8080/api/Attachments/upload
CreateProject.tsx:672 📎 Uploading file: DNN_Assignment_2.pdf Size: 1606799 Type: application/pdf
CreateProject.tsx:687 📎 FormData contents:
CreateProject.tsx:689 📎 file: File {name: 'DNN_Assignment_2.pdf', lastModified: 1758833807769, lastModifiedDate: Thu Sep 25 2025 13:56:47 GMT-0700 (Pacific Daylight Time), webkitRelativePath: '', size: 1606799, …}
CreateProject.tsx:689 📎 entityType: Project
CreateProject.tsx:689 📎 entityId: 22
CreateProject.tsx:689 📎 description: Attachment for project: Sample 9
CreateProject.tsx:689 📎 tags: []
CreateProject.tsx:689 📎 EntityType: Project
CreateProject.tsx:689 📎 EntityId: 22
CreateProject.tsx:689 📎 Description: Attachment for project: Sample 9
CreateProject.tsx:689 📎 Tags: []
api.ts:224  POST http://localhost:8080/api/api/Attachments/upload 404 (Not Found)
dispatchXhrRequest @ axios.js?v=c9267ec3:1683
xhr @ axios.js?v=c9267ec3:1560
dispatchRequest @ axios.js?v=c9267ec3:2085
_request @ axios.js?v=c9267ec3:2305
request @ axios.js?v=c9267ec3:2197
httpMethod @ axios.js?v=c9267ec3:2334
wrap @ axios.js?v=c9267ec3:8
uploadFile @ api.ts:224
upload @ attachmentsService.ts:41
handleNewProjectSubmit @ CreateProject.tsx:695
await in handleNewProjectSubmit
callCallback2 @ chunk-WRD5HZVH.js?v=c9267ec3:3674
invokeGuardedCallbackDev @ chunk-WRD5HZVH.js?v=c9267ec3:3699
invokeGuardedCallback @ chunk-WRD5HZVH.js?v=c9267ec3:3733
invokeGuardedCallbackAndCatchFirstError @ chunk-WRD5HZVH.js?v=c9267ec3:3736
executeDispatch @ chunk-WRD5HZVH.js?v=c9267ec3:7014
processDispatchQueueItemsInOrder @ chunk-WRD5HZVH.js?v=c9267ec3:7034
processDispatchQueue @ chunk-WRD5HZVH.js?v=c9267ec3:7043
dispatchEventsForPlugins @ chunk-WRD5HZVH.js?v=c9267ec3:7051
(anonymous) @ chunk-WRD5HZVH.js?v=c9267ec3:7174
batchedUpdates$1 @ chunk-WRD5HZVH.js?v=c9267ec3:18913
batchedUpdates @ chunk-WRD5HZVH.js?v=c9267ec3:3579
dispatchEventForPluginEventSystem @ chunk-WRD5HZVH.js?v=c9267ec3:7173
dispatchEventWithEnableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay @ chunk-WRD5HZVH.js?v=c9267ec3:5478
dispatchEvent @ chunk-WRD5HZVH.js?v=c9267ec3:5472
dispatchDiscreteEvent @ chunk-WRD5HZVH.js?v=c9267ec3:5449Understand this error
CreateProject.tsx:709 ❌ File upload error: DNN_Assignment_2.pdf Error: Request failed
    at handleResponse (attachmentsService.ts:19:11)
    at async handleNewProjectSubmit (CreateProject.tsx:695:36)
handleNewProjectSubmit @ CreateProject.tsx:709
await in handleNewProjectSubmit
callCallback2 @ chunk-WRD5HZVH.js?v=c9267ec3:3674
invokeGuardedCallbackDev @ chunk-WRD5HZVH.js?v=c9267ec3:3699
invokeGuardedCallback @ chunk-WRD5HZVH.js?v=c9267ec3:3733
invokeGuardedCallbackAndCatchFirstError @ chunk-WRD5HZVH.js?v=c9267ec3:3736
executeDispatch @ chunk-WRD5HZVH.js?v=c9267ec3:7014
processDispatchQueueItemsInOrder @ chunk-WRD5HZVH.js?v=c9267ec3:7034
processDispatchQueue @ chunk-WRD5HZVH.js?v=c9267ec3:7043
dispatchEventsForPlugins @ chunk-WRD5HZVH.js?v=c9267ec3:7051
(anonymous) @ chunk-WRD5HZVH.js?v=c9267ec3:7174
batchedUpdates$1 @ chunk-WRD5HZVH.js?v=c9267ec3:18913
batchedUpdates @ chunk-WRD5HZVH.js?v=c9267ec3:3579
dispatchEventForPluginEventSystem @ chunk-WRD5HZVH.js?v=c9267ec3:7173
dispatchEventWithEnableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay @ chunk-WRD5HZVH.js?v=c9267ec3:5478
dispatchEvent @ chunk-WRD5HZVH.js?v=c9267ec3:5472
dispatchDiscreteEvent @ chunk-WRD5HZVH.js?v=c9267ec3:5449Understand this error
CreateProject.tsx:712 🔄 Trying direct fetch as fallback...
CreateProject.tsx:714  POST http://localhost:8080/api/Attachments/upload 404 (Not Found)
handleNewProjectSubmit @ CreateProject.tsx:714
await in handleNewProjectSubmit
callCallback2 @ chunk-WRD5HZVH.js?v=c9267ec3:3674
invokeGuardedCallbackDev @ chunk-WRD5HZVH.js?v=c9267ec3:3699
invokeGuardedCallback @ chunk-WRD5HZVH.js?v=c9267ec3:3733
invokeGuardedCallbackAndCatchFirstError @ chunk-WRD5HZVH.js?v=c9267ec3:3736
executeDispatch @ chunk-WRD5HZVH.js?v=c9267ec3:7014
processDispatchQueueItemsInOrder @ chunk-WRD5HZVH.js?v=c9267ec3:7034
processDispatchQueue @ chunk-WRD5HZVH.js?v=c9267ec3:7043
dispatchEventsForPlugins @ chunk-WRD5HZVH.js?v=c9267ec3:7051
(anonymous) @ chunk-WRD5HZVH.js?v=c9267ec3:7174
batchedUpdates$1 @ chunk-WRD5HZVH.js?v=c9267ec3:18913
batchedUpdates @ chunk-WRD5HZVH.js?v=c9267ec3:3579
dispatchEventForPluginEventSystem @ chunk-WRD5HZVH.js?v=c9267ec3:7173
dispatchEventWithEnableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay @ chunk-WRD5HZVH.js?v=c9267ec3:5478
dispatchEvent @ chunk-WRD5HZVH.js?v=c9267ec3:5472
dispatchDiscreteEvent @ chunk-WRD5HZVH.js?v=c9267ec3:5449Understand this error
CreateProject.tsx:722 📎 Fallback upload response status: 404
CreateProject.tsx:730 ❌ Fallback upload failed: DNN_Assignment_2.pdf Status: 404
handleNewProjectSubmit @ CreateProject.tsx:730
await in handleNewProjectSubmit
callCallback2 @ chunk-WRD5HZVH.js?v=c9267ec3:3674
invokeGuardedCallbackDev @ chunk-WRD5HZVH.js?v=c9267ec3:3699
invokeGuardedCallback @ chunk-WRD5HZVH.js?v=c9267ec3:3733
invokeGuardedCallbackAndCatchFirstError @ chunk-WRD5HZVH.js?v=c9267ec3:3736
executeDispatch @ chunk-WRD5HZVH.js?v=c9267ec3:7014
processDispatchQueueItemsInOrder @ chunk-WRD5HZVH.js?v=c9267ec3:7034
processDispatchQueue @ chunk-WRD5HZVH.js?v=c9267ec3:7043
dispatchEventsForPlugins @ chunk-WRD5HZVH.js?v=c9267ec3:7051
(anonymous) @ chunk-WRD5HZVH.js?v=c9267ec3:7174
batchedUpdates$1 @ chunk-WRD5HZVH.js?v=c9267ec3:18913
batchedUpdates @ chunk-WRD5HZVH.js?v=c9267ec3:3579
dispatchEventForPluginEventSystem @ chunk-WRD5HZVH.js?v=c9267ec3:7173
dispatchEventWithEnableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay @ chunk-WRD5HZVH.js?v=c9267ec3:5478
dispatchEvent @ chunk-WRD5HZVH.js?v=c9267ec3:5472
dispatchDiscreteEvent @ chunk-WRD5HZVH.js?v=c9267ec3:5449Understand this error
CreateProject.tsx:731 ❌ Fallback error response: 
handleNewProjectSubmit @ CreateProject.tsx:731
await in handleNewProjectSubmit
callCallback2 @ chunk-WRD5HZVH.js?v=c9267ec3:3674
invokeGuardedCallbackDev @ chunk-WRD5HZVH.js?v=c9267ec3:3699
invokeGuardedCallback @ chunk-WRD5HZVH.js?v=c9267ec3:3733
invokeGuardedCallbackAndCatchFirstError @ chunk-WRD5HZVH.js?v=c9267ec3:3736
executeDispatch @ chunk-WRD5HZVH.js?v=c9267ec3:7014
processDispatchQueueItemsInOrder @ chunk-WRD5HZVH.js?v=c9267ec3:7034
processDispatchQueue @ chunk-WRD5HZVH.js?v=c9267ec3:7043
dispatchEventsForPlugins @ chunk-WRD5HZVH.js?v=c9267ec3:7051
(anonymous) @ chunk-WRD5HZVH.js?v=c9267ec3:7174
batchedUpdates$1 @ chunk-WRD5HZVH.js?v=c9267ec3:18913
batchedUpdates @ chunk-WRD5HZVH.js?v=c9267ec3:3579
dispatchEventForPluginEventSystem @ chunk-WRD5HZVH.js?v=c9267ec3:7173
dispatchEventWithEnableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay @ chunk-WRD5HZVH.js?v=c9267ec3:5478
dispatchEvent @ chunk-WRD5HZVH.js?v=c9267ec3:5472
dispatchDiscreteEvent @ chunk-WRD5HZVH.js?v=c9267ec3:5449Understand this error
CreateProject.tsx:744 🔍 Verifying attachments are linked to project: 22
api.ts:124 🌐 API Call: http://localhost:8080/api/api/Attachments/list/Project/22
api.ts:125  GET http://localhost:8080/api/api/Attachments/list/Project/22 404 (Not Found)
dispatchXhrRequest @ axios.js?v=c9267ec3:1683
xhr @ axios.js?v=c9267ec3:1560
dispatchRequest @ axios.js?v=c9267ec3:2085
_request @ axios.js?v=c9267ec3:2305
request @ axios.js?v=c9267ec3:2197
Axios.<computed> @ axios.js?v=c9267ec3:2324
wrap @ axios.js?v=c9267ec3:8
get @ api.ts:125
list @ attachmentsService.ts:51
handleNewProjectSubmit @ CreateProject.tsx:747
await in handleNewProjectSubmit
callCallback2 @ chunk-WRD5HZVH.js?v=c9267ec3:3674
invokeGuardedCallbackDev @ chunk-WRD5HZVH.js?v=c9267ec3:3699
invokeGuardedCallback @ chunk-WRD5HZVH.js?v=c9267ec3:3733
invokeGuardedCallbackAndCatchFirstError @ chunk-WRD5HZVH.js?v=c9267ec3:3736
executeDispatch @ chunk-WRD5HZVH.js?v=c9267ec3:7014
processDispatchQueueItemsInOrder @ chunk-WRD5HZVH.js?v=c9267ec3:7034
processDispatchQueue @ chunk-WRD5HZVH.js?v=c9267ec3:7043
dispatchEventsForPlugins @ chunk-WRD5HZVH.js?v=c9267ec3:7051
(anonymous) @ chunk-WRD5HZVH.js?v=c9267ec3:7174
batchedUpdates$1 @ chunk-WRD5HZVH.js?v=c9267ec3:18913
batchedUpdates @ chunk-WRD5HZVH.js?v=c9267ec3:3579
dispatchEventForPluginEventSystem @ chunk-WRD5HZVH.js?v=c9267ec3:7173
dispatchEventWithEnableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay @ chunk-WRD5HZVH.js?v=c9267ec3:5478
dispatchEvent @ chunk-WRD5HZVH.js?v=c9267ec3:5472
dispatchDiscreteEvent @ chunk-WRD5HZVH.js?v=c9267ec3:5449Understand this error
api.ts:129 ❌ API Error: {data: null, success: false, message: 'Request failed', errors: Array(0), status: 404, …}
get @ api.ts:129
await in get
list @ attachmentsService.ts:51
handleNewProjectSubmit @ CreateProject.tsx:747
await in handleNewProjectSubmit
callCallback2 @ chunk-WRD5HZVH.js?v=c9267ec3:3674
invokeGuardedCallbackDev @ chunk-WRD5HZVH.js?v=c9267ec3:3699
invokeGuardedCallback @ chunk-WRD5HZVH.js?v=c9267ec3:3733
invokeGuardedCallbackAndCatchFirstError @ chunk-WRD5HZVH.js?v=c9267ec3:3736
executeDispatch @ chunk-WRD5HZVH.js?v=c9267ec3:7014
processDispatchQueueItemsInOrder @ chunk-WRD5HZVH.js?v=c9267ec3:7034
processDispatchQueue @ chunk-WRD5HZVH.js?v=c9267ec3:7043
dispatchEventsForPlugins @ chunk-WRD5HZVH.js?v=c9267ec3:7051
(anonymous) @ chunk-WRD5HZVH.js?v=c9267ec3:7174
batchedUpdates$1 @ chunk-WRD5HZVH.js?v=c9267ec3:18913
batchedUpdates @ chunk-WRD5HZVH.js?v=c9267ec3:3579
dispatchEventForPluginEventSystem @ chunk-WRD5HZVH.js?v=c9267ec3:7173
dispatchEventWithEnableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay @ chunk-WRD5HZVH.js?v=c9267ec3:5478
dispatchEvent @ chunk-WRD5HZVH.js?v=c9267ec3:5472
dispatchDiscreteEvent @ chunk-WRD5HZVH.js?v=c9267ec3:5449Understand this error
api.ts:130 🔍 Error URL: http://localhost:8080/api/api/Attachments/list/Project/22
get @ api.ts:130
await in get
list @ attachmentsService.ts:51
handleNewProjectSubmit @ CreateProject.tsx:747
await in handleNewProjectSubmit
callCallback2 @ chunk-WRD5HZVH.js?v=c9267ec3:3674
invokeGuardedCallbackDev @ chunk-WRD5HZVH.js?v=c9267ec3:3699
invokeGuardedCallback @ chunk-WRD5HZVH.js?v=c9267ec3:3733
invokeGuardedCallbackAndCatchFirstError @ chunk-WRD5HZVH.js?v=c9267ec3:3736
executeDispatch @ chunk-WRD5HZVH.js?v=c9267ec3:7014
processDispatchQueueItemsInOrder @ chunk-WRD5HZVH.js?v=c9267ec3:7034
processDispatchQueue @ chunk-WRD5HZVH.js?v=c9267ec3:7043
dispatchEventsForPlugins @ chunk-WRD5HZVH.js?v=c9267ec3:7051
(anonymous) @ chunk-WRD5HZVH.js?v=c9267ec3:7174
batchedUpdates$1 @ chunk-WRD5HZVH.js?v=c9267ec3:18913
batchedUpdates @ chunk-WRD5HZVH.js?v=c9267ec3:3579
dispatchEventForPluginEventSystem @ chunk-WRD5HZVH.js?v=c9267ec3:7173
dispatchEventWithEnableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay @ chunk-WRD5HZVH.js?v=c9267ec3:5478
dispatchEvent @ chunk-WRD5HZVH.js?v=c9267ec3:5472
dispatchDiscreteEvent @ chunk-WRD5HZVH.js?v=c9267ec3:5449Understand this error
CreateProject.tsx:751 ❌ Failed to verify project attachments: Error: Request failed
    at handleResponse (attachmentsService.ts:19:11)
    at async handleNewProjectSubmit (CreateProject.tsx:747:40)
handleNewProjectSubmit @ CreateProject.tsx:751
await in handleNewProjectSubmit
callCallback2 @ chunk-WRD5HZVH.js?v=c9267ec3:3674
invokeGuardedCallbackDev @ chunk-WRD5HZVH.js?v=c9267ec3:3699
invokeGuardedCallback @ chunk-WRD5HZVH.js?v=c9267ec3:3733
invokeGuardedCallbackAndCatchFirstError @ chunk-WRD5HZVH.js?v=c9267ec3:3736
executeDispatch @ chunk-WRD5HZVH.js?v=c9267ec3:7014
processDispatchQueueItemsInOrder @ chunk-WRD5HZVH.js?v=c9267ec3:7034
processDispatchQueue @ chunk-WRD5HZVH.js?v=c9267ec3:7043
dispatchEventsForPlugins @ chunk-WRD5HZVH.js?v=c9267ec3:7051
(anonymous) @ chunk-WRD5HZVH.js?v=c9267ec3:7174
batchedUpdates$1 @ chunk-WRD5HZVH.js?v=c9267ec3:18913
batchedUpdates @ chunk-WRD5HZVH.js?v=c9267ec3:3579
dispatchEventForPluginEventSystem @ chunk-WRD5HZVH.js?v=c9267ec3:7173
dispatchEventWithEnableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay @ chunk-WRD5HZVH.js?v=c9267ec3:5478
dispatchEvent @ chunk-WRD5HZVH.js?v=c9267ec3:5472
dispatchDiscreteEvent @ chunk-WRD5HZVH.js?v=c9267ec3:5449Understand this error
CreateProject.tsx:757 👥 Creating assignments for 1 team members
CreateProject.tsx:759 👥 Creating assignment for member: Ruth Williams to project: 22
CreateProject.tsx:760  POST http://localhost:8080/api/EnhancedAssignment/create net::ERR_ABORTED 404 (Not Found)
handleNewProjectSubmit @ CreateProject.tsx:760
await in handleNewProjectSubmit
callCallback2 @ chunk-WRD5HZVH.js?v=c9267ec3:3674
invokeGuardedCallbackDev @ chunk-WRD5HZVH.js?v=c9267ec3:3699
invokeGuardedCallback @ chunk-WRD5HZVH.js?v=c9267ec3:3733
invokeGuardedCallbackAndCatchFirstError @ chunk-WRD5HZVH.js?v=c9267ec3:3736
executeDispatch @ chunk-WRD5HZVH.js?v=c9267ec3:7014
processDispatchQueueItemsInOrder @ chunk-WRD5HZVH.js?v=c9267ec3:7034
processDispatchQueue @ chunk-WRD5HZVH.js?v=c9267ec3:7043
dispatchEventsForPlugins @ chunk-WRD5HZVH.js?v=c9267ec3:7051
(anonymous) @ chunk-WRD5HZVH.js?v=c9267ec3:7174
batchedUpdates$1 @ chunk-WRD5HZVH.js?v=c9267ec3:18913
batchedUpdates @ chunk-WRD5HZVH.js?v=c9267ec3:3579
dispatchEventForPluginEventSystem @ chunk-WRD5HZVH.js?v=c9267ec3:7173
dispatchEventWithEnableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay @ chunk-WRD5HZVH.js?v=c9267ec3:5478
dispatchEvent @ chunk-WRD5HZVH.js?v=c9267ec3:5472
dispatchDiscreteEvent @ chunk-WRD5HZVH.js?v=c9267ec3:5449Understand this error
CreateProject.tsx:780  POST http://localhost:8080/api/EnhancedAssignment/create net::ERR_ABORTED 404 (Not Found)
handleNewProjectSubmit @ CreateProject.tsx:780
await in handleNewProjectSubmit
callCallback2 @ chunk-WRD5HZVH.js?v=c9267ec3:3674
invokeGuardedCallbackDev @ chunk-WRD5HZVH.js?v=c9267ec3:3699
invokeGuardedCallback @ chunk-WRD5HZVH.js?v=c9267ec3:3733
invokeGuardedCallbackAndCatchFirstError @ chunk-WRD5HZVH.js?v=c9267ec3:3736
executeDispatch @ chunk-WRD5HZVH.js?v=c9267ec3:7014
processDispatchQueueItemsInOrder @ chunk-WRD5HZVH.js?v=c9267ec3:7034
processDispatchQueue @ chunk-WRD5HZVH.js?v=c9267ec3:7043
dispatchEventsForPlugins @ chunk-WRD5HZVH.js?v=c9267ec3:7051
(anonymous) @ chunk-WRD5HZVH.js?v=c9267ec3:7174
batchedUpdates$1 @ chunk-WRD5HZVH.js?v=c9267ec3:18913
batchedUpdates @ chunk-WRD5HZVH.js?v=c9267ec3:3579
dispatchEventForPluginEventSystem @ chunk-WRD5HZVH.js?v=c9267ec3:7173
dispatchEventWithEnableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay @ chunk-WRD5HZVH.js?v=c9267ec3:5478
dispatchEvent @ chunk-WRD5HZVH.js?v=c9267ec3:5472
dispatchDiscreteEvent @ chunk-WRD5HZVH.js?v=c9267ec3:5449Understand this error
CreateProject.tsx:800  POST http://localhost:8080/api/EnhancedAssignment/create net::ERR_ABORTED 404 (Not Found)
handleNewProjectSubmit @ CreateProject.tsx:800
await in handleNewProjectSubmit
callCallback2 @ chunk-WRD5HZVH.js?v=c9267ec3:3674
invokeGuardedCallbackDev @ chunk-WRD5HZVH.js?v=c9267ec3:3699
invokeGuardedCallback @ chunk-WRD5HZVH.js?v=c9267ec3:3733
invokeGuardedCallbackAndCatchFirstError @ chunk-WRD5HZVH.js?v=c9267ec3:3736
executeDispatch @ chunk-WRD5HZVH.js?v=c9267ec3:7014
processDispatchQueueItemsInOrder @ chunk-WRD5HZVH.js?v=c9267ec3:7034
processDispatchQueue @ chunk-WRD5HZVH.js?v=c9267ec3:7043
dispatchEventsForPlugins @ chunk-WRD5HZVH.js?v=c9267ec3:7051
(anonymous) @ chunk-WRD5HZVH.js?v=c9267ec3:7174
batchedUpdates$1 @ chunk-WRD5HZVH.js?v=c9267ec3:18913
batchedUpdates @ chunk-WRD5HZVH.js?v=c9267ec3:3579
dispatchEventForPluginEventSystem @ chunk-WRD5HZVH.js?v=c9267ec3:7173
dispatchEventWithEnableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay @ chunk-WRD5HZVH.js?v=c9267ec3:5478
dispatchEvent @ chunk-WRD5HZVH.js?v=c9267ec3:5472
dispatchDiscreteEvent @ chunk-WRD5HZVH.js?v=c9267ec3:5449Understand this error
CreateProject.tsx:164 🔍 Loading ALL users for manager selection...
CreateProject.tsx:165 🔍 Loading managers for department: 
CreateProject.tsx:166 📡 API Call: GET /User (using userService)
CreateProject.tsx:167 🌐 Current API Base URL: http://localhost:8080/api
CreateProject.tsx:171 🔄 Trying to get ALL users from all departments...
api.ts:124 🌐 API Call: http://localhost:8080/api/User
MultistepProjectCreation.tsx:319 🔍 Navigating to step: 2
MultistepProjectCreation.tsx:320 🔍 Current user role: undefined
MultistepProjectCreation.tsx:321 🔍 Current user ID: user1
MultistepProjectCreation.tsx:322 🔍 Selected scrum master: undefined
MultistepProjectCreation.tsx:323 🔍 Selected team leader: undefined
ProtectedRoute.tsx:20 🔍 ProtectedRoute Debug:
ProtectedRoute.tsx:21 🔍 User role: manager
ProtectedRoute.tsx:22 🔍 Allowed roles: ['member']
ProtectedRoute.tsx:23 🔍 User object: {id: '91506b85-3009-4cd1-9189-d51ac31421b3', username: 'Abiy', email: 'abiy@gmail.com', role: 'manager', employeeId: '', …}
ProtectedRoute.tsx:31 🔍 Role matching: "member" vs "manager"
ProtectedRoute.tsx:32 🔍 Exact match: false
ProtectedRoute.tsx:33 🔍 User includes role: false
ProtectedRoute.tsx:34 🔍 Role includes user: false
ProtectedRoute.tsx:35 🔍 Final match: false
ProtectedRoute.tsx:39 🔍 Is allowed: false
ProtectedRoute.tsx:42 ❌ Access denied - redirecting to unauthorized
ProtectedRoute.tsx:20 🔍 ProtectedRoute Debug:
ProtectedRoute.tsx:21 🔍 User role: manager
ProtectedRoute.tsx:22 🔍 Allowed roles: ['member']
ProtectedRoute.tsx:23 🔍 User object: {id: '91506b85-3009-4cd1-9189-d51ac31421b3', username: 'Abiy', email: 'abiy@gmail.com', role: 'manager', employeeId: '', …}
ProtectedRoute.tsx:31 🔍 Role matching: "member" vs "manager"
ProtectedRoute.tsx:32 🔍 Exact match: false
ProtectedRoute.tsx:33 🔍 User includes role: false
ProtectedRoute.tsx:34 🔍 Role includes user: false
ProtectedRoute.tsx:35 🔍 Final match: false
ProtectedRoute.tsx:39 🔍 Is allowed: false
ProtectedRoute.tsx:42 ❌ Access denied - redirecting to unauthorized
api.ts:126 ✅ API Success: (31) [{…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}]
CreateProject.tsx:176 📊 userService.getAllUsers response: {data: Array(31), success: true}
CreateProject.tsx:183 🔍 Response analysis:
CreateProject.tsx:184 - resp.success: true
CreateProject.tsx:185 - resp.data type: object
CreateProject.tsx:186 - resp.data is array: true
CreateProject.tsx:187 - resp.data length: 31
CreateProject.tsx:196 📊 API Response: {data: Array(31), success: true}
CreateProject.tsx:197 ✅ Success: true
CreateProject.tsx:198 📦 Data: (31) [{…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}]
CreateProject.tsx:199 📝 Message: undefined
CreateProject.tsx:200 ❌ Errors: undefined
CreateProject.tsx:201 🔢 Status: undefined
CreateProject.tsx:206 📋 Raw data array length: 31
CreateProject.tsx:207 👥 All users: (31) [{…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}]
CreateProject.tsx:211 🌍 Showing ALL users from ALL departments for manager selection
CreateProject.tsx:212 👥 Total users available: 31
CreateProject.tsx:215 🔍 User roles found: (31) [{…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}]
CreateProject.tsx:230 🔍 User object structure: {id: '0708ba9a-00a8-4535-95c9-af026887a3fd', fullName: 'Pommu', employeeId: '123445', email: 'pommu@gmail.com', department: 'IIB', …}
CreateProject.tsx:230 🔍 User object structure: {id: '072f8342-b34b-446a-8cd5-6ddf3c50e1ec', fullName: 'Hilina ', employeeId: 'EMP098765', email: 'hilina@gmail.com', department: 'Manager', …}
CreateProject.tsx:230 🔍 User object structure: {id: '1538b0d4-f498-4943-9ad0-aaaeec068185', fullName: 'Nahom Beyene', employeeId: 'EMP124589', email: 'nahom@outlook.com', department: 'IT', …}
CreateProject.tsx:230 🔍 User object structure: {id: '15ba9107-57a1-4afc-bf5e-db598bcb9987', fullName: 'Alelgn Eshete', employeeId: 'emp32232', email: 'alelgn@gmail.com', department: 'SDC', …}
CreateProject.tsx:230 🔍 User object structure: {id: '308527a8-9d38-4c2e-b3b3-02395f4d9e54', fullName: 'Samuel Nigatu', employeeId: 'EMP098765', email: 'sami@outlook.com', department: 'SDC', …}
CreateProject.tsx:230 🔍 User object structure: {id: '461c25b5-01e4-4b4d-b676-1ba458a39465', fullName: 'Hilina ', employeeId: 'EMP098765', email: 'hulina@gmail.com', department: 'Manager', …}
CreateProject.tsx:230 🔍 User object structure: {id: '4ace2468-084d-4f6e-8452-f21bbf584c9a', fullName: 'Ale', employeeId: 'emp00000', email: 'alazar@gmail.com', department: 'GGG', …}
CreateProject.tsx:230 🔍 User object structure: {id: '4c6b04ea-65d2-425f-969d-fdc018556035', fullName: 'Ruth Williams', employeeId: 'emp99999', email: 'ruth@gmail.com', department: 'SDC', …}
CreateProject.tsx:230 🔍 User object structure: {id: '4d7064ef-c02f-4491-b4e0-3eb564481d84', fullName: 'testuser10', employeeId: '101020', email: 'testuser10@gmail.com', department: 'AMC', …}
CreateProject.tsx:230 🔍 User object structure: {id: '54556409-8a32-47c7-a215-6adda0a332da', fullName: 'Netsanet Ale', employeeId: 'emp45673', email: 'netsi@gmail.com', department: 'IT', …}
CreateProject.tsx:230 🔍 User object structure: {id: '6a121145-d766-4d39-8683-2552b4737dd5', fullName: 'Test User 2', employeeId: '101002', email: 'testuser2@gmail.com', department: 'IIB', …}
CreateProject.tsx:230 🔍 User object structure: {id: '6c6c2439-c3c7-41ee-937d-0c3216cd5fda', fullName: 'Julien Williams', employeeId: 'EMP123454', email: 'julien@gmail.com', department: 'IIB', …}
CreateProject.tsx:230 🔍 User object structure: {id: '908dfc29-1d7a-4cb1-8fec-d4ea4feb7f82', fullName: 'Abel Gashaw', employeeId: 'EMP34567', email: 'Abel@outlook.com', department: 'SDC', …}
CreateProject.tsx:230 🔍 User object structure: {id: '91506b85-3009-4cd1-9189-d51ac31421b3', fullName: 'Abiy', employeeId: 'emp74747', email: 'abiy@gmail.com', department: 'SDC', …}
CreateProject.tsx:230 🔍 User object structure: {id: '943ba537-5768-4429-b3aa-a153bd509ece', fullName: 'Abigia Elias', employeeId: 'emp55555', email: 'abigia@gmail.com', department: 'BRD', …}
CreateProject.tsx:230 🔍 User object structure: {id: '9e219648-6060-4427-aa91-229934a8ad70', fullName: 'Test User 3', employeeId: '101003', email: 'testuser3@gmail.com', department: 'SSD', …}
CreateProject.tsx:230 🔍 User object structure: {id: 'aefc0ffe-c29b-4ca5-be62-d02d56081dae', fullName: 'Eden Hailu', employeeId: 'emp876543', email: 'eden@gmail.com', department: 'BRD', …}
CreateProject.tsx:230 🔍 User object structure: {id: 'af6941c2-234e-45c9-936c-a850c8ff2cd1', fullName: 'Salem Worku', employeeId: 'EMP546738', email: 'salem@gmail.com', department: 'AMC', …}
CreateProject.tsx:230 🔍 User object structure: {id: 'b0bb6fd0-171f-4c93-95f3-5eeacb68f2b1', fullName: 'Abner Aman', employeeId: 'emp33333', email: 'abner@gmail.com', department: 'SDC', …}
CreateProject.tsx:230 🔍 User object structure: {id: 'b3046090-1ea0-4508-8f82-c3a5b3dd7892', fullName: 'Amanuel Semalgn', employeeId: 'EMP456378', email: 'aman@gmail.com', department: 'SDC', …}
CreateProject.tsx:230 🔍 User object structure: {id: 'bd5ed892-53bd-4dce-bf41-3de62b84e7c9', fullName: 'Test User 4', employeeId: '101004', email: 'testuser4@gmail.com', department: 'SSD', …}
CreateProject.tsx:230 🔍 User object structure: {id: 'c24c6ee6-e7a5-4600-af77-ee812136da39', fullName: 'Hewan Awel', employeeId: 'emp347269', email: 'hewan@gmail.com', department: 'SDC', …}
CreateProject.tsx:230 🔍 User object structure: {id: 'cc0a1d8f-f28a-4f6c-8578-779524254b9b', fullName: 'Dehi', employeeId: 'emp11111', email: 'dehine@gmail.com', department: 'GGG', …}
CreateProject.tsx:230 🔍 User object structure: {id: 'cec2ffaf-cd55-4f0d-b024-42f7aa54bd42', fullName: 'Helen ', employeeId: '2948376543', email: 'helen@gmail.com', department: 'SDC', …}
CreateProject.tsx:230 🔍 User object structure: {id: 'ddf97e1e-d8df-4f36-83a0-4f076773cc41', fullName: 'Solomon', employeeId: 'EMP764290', email: 'solomon@gmail.com', department: 'Support', …}
CreateProject.tsx:230 🔍 User object structure: {id: 'e4d4f102-d447-49a8-8a34-aaaba99dfd36', fullName: 'admin', employeeId: '123456', email: 'mahi@gmail.com', department: 'IT', …}
CreateProject.tsx:230 🔍 User object structure: {id: 'e5eb763e-5b92-4008-95e4-0cf667090193', fullName: 'Abenezer Tewodros', employeeId: 'EMP347865', email: 'abeni@gmail.com', department: 'System Development & Customization (SDC)', …}
CreateProject.tsx:230 🔍 User object structure: {id: 'e9c64f89-5a28-4276-b951-12014bce3e31', fullName: 'Tinsu', employeeId: 'EMP125698', email: 'tinsu@gmail.com', department: 'Security', …}
CreateProject.tsx:230 🔍 User object structure: {id: 'f0366e11-d7ff-4e66-a867-a0aaec4ab7d5', fullName: 'Test User 1', employeeId: '101001', email: 'testuser1@gmail.com', department: 'SDC', …}
CreateProject.tsx:230 🔍 User object structure: {id: 'f51308c5-963d-46ac-b8de-d29e9446aef0', fullName: 'Mena Assefa', employeeId: 'EMP123456', email: 'mena@outlook.com', department: 'SDC', …}
CreateProject.tsx:230 🔍 User object structure: {id: 'f97ff36e-5cb0-448d-815c-c852de8a7d71', fullName: 'Medi', employeeId: '12345', email: 'medi@gmail.com', department: 'SDC', …}
CreateProject.tsx:258 👥 ALL users as potential managers/scrum masters: (31) [{…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}]
CreateProject.tsx:282 👨‍💼 Filtered managers/scrum masters: []
CreateProject.tsx:283 📊 Total managers found: 0
CreateProject.tsx:284 👥 All users available: 31
CreateProject.tsx:290 ⚠️ No managers found by role, using all users
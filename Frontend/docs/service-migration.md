# Service Layer Migration Guide

Date: 2025-09-19
Branch: `alelgn`

## Overview

The frontend service layer has been refactored to align with the backend OpenAPI specification and to separate concerns across Project, Assignment, Enhanced Assignment, Milestone, and Report domains. This document maps deprecated usages to their new equivalents and provides a validation & testing checklist.

## Goals

- Normalize endpoint paths & casing to match backend.
- Remove mixed domain responsibilities from `projectService`.
- Introduce explicit DTO mapping (UI -> backend DTO) to minimize surface changes in components.
- Centralize assignment-related DTO definitions.
- Provide typed contracts for report generation/export.

---

## Migration Summary

| Legacy Location / Call                                  | New Service & Method                                                   | Endpoint (relative to /api)                                        | Notes                          |
| ------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------ |
| `projectService.getAllProjects()` (unchanged signature) | `projectService.getAllProjects()`                                      | `/Project/All-projects`                                            | Added filter serialization.    |
| `projectService.getProjectById(id)`                     | same                                                                   | `/Project/project-byId?id={id}`                                    | —                              |
| `projectService.createProject({...})` (UI shape)        | same (transforms internally)                                           | `/Project/create-project`                                          | Maps `title -> projectName`.   |
| `projectService.updateProject(id, {...})`               | same                                                                   | `/Project/edit-project?id={id}`                                    | Maps `title -> projectName`.   |
| (Old) embedded assignment: get project members          | `projectAssignmentService.getProjectMembers(projectId)`                | `/ProjectAssignment/All-members?projectId=`                        | Extracted.                     |
| (Old) add members                                       | `projectAssignmentService.addMembers(dto)`                             | `/ProjectAssignment/Add-members`                                   | DTO: `CreateAssignmentDto`.    |
| (Old) edit role                                         | `projectAssignmentService.editRole(dto)`                               | `/ProjectAssignment/edit-role`                                     | DTO: `UpdateAssignmentDto`.    |
| (Old) approve assignment                                | `projectAssignmentService.approve(id)`                                 | `/ProjectAssignment/{id}/approve`                                  | —                              |
| (Old) reject assignment                                 | `projectAssignmentService.reject(id, reason)`                          | `/ProjectAssignment/{id}/reject`                                   | Body: string reason.           |
| (Old) delete member                                     | `projectAssignmentService.deleteMember(dto)`                           | `/ProjectAssignment/delete-member`                                 | Using query params workaround. |
| (Old) enhanced assign create                            | `enhancedAssignmentService.create(dto)`                                | `/EnhancedAssignment`                                              | Rich workforce features.       |
| (Old) enhanced assign update                            | `enhancedAssignmentService.update(id, dto)`                            | `/EnhancedAssignment/{id}`                                         | —                              |
| (Old) set primary scrum master                          | `enhancedAssignmentService.setPrimaryScrumMaster(projectId, memberId)` | `/EnhancedAssignment/project/{projectId}/set-primary-scrum-master` | Body raw string.               |
| (Old) reassignment                                      | `enhancedAssignmentService.reassign(dto)`                              | `/EnhancedAssignment/reassign`                                     | Uses `ReassignmentRequestDto`. |
| Milestone validate (legacy lowercase)                   | `milestoneService.validateMilestoneDates(data)`                        | `/ProjectTask/validate-milestone-dates`                            | Corrected casing.              |
| Report generation untyped                               | `reportService.generate(payload)`                                      | `/Report/generate`                                                 | Strongly typed DTOs added.     |
| Report export untyped                                   | `reportService.export(payload)`                                        | `/Report/export`                                                   | Strongly typed DTOs added.     |

---

## DTO Centralization

File: `src/types/assignment.ts`

- `CreateAssignmentDto`, `UpdateAssignmentDto` (ProjectAssignment)
- `CreateEnhancedAssignmentDto`, `UpdateEnhancedAssignmentDto`, `ReassignmentRequestDto`
- Shared workload / summary types scaffolded.

Report related types live inside `reportService.ts` (scoped locally since only used there for now).

---

## Deprecations

- Any prior imports of assignment-related methods from `projectService` must now import from either `projectAssignmentService` or `enhancedAssignmentService`.
- The comment block in `projectService` remains as a transitional notice (remove after all consumers are migrated & verified).

---

## Validation Checklist

### Build & Types

- [ ] `npm run build` succeeds without TypeScript errors.
- [ ] No references to removed projectService assignment methods (`grep -R "projectService.*Assignment"`).

### Functional Smoke

- [ ] Fetch projects list (dashboard / listing page) renders without runtime errors.
- [ ] Create project flow persists and newly created project appears in list.
- [ ] Approval actions (approve/reject) succeed and UI reflects status change.
- [ ] Milestone date validation request reaches corrected endpoint.
- [ ] Report generation form (if present) submits and returns expected shape.

### Assignment Domain (when UI wired)

- [ ] Project members list populates via `projectAssignmentService.getProjectMembers`.
- [ ] Adding a member updates UI and persists on refresh.
- [ ] Editing role reflects new member role.
- [ ] Rejecting assignment logs/display reason.
- [ ] Scrum master operations reflect primary vs secondary state.

### Enhanced Assignment

- [ ] Availability endpoints return structured data (no 404 due to path changes).
- [ ] Reassignment history loads for a member.
- [ ] Workload endpoints return expected aggregates.

### Error Handling & Edge Cases

- [ ] 401 triggers token refresh seamlessly for at least one protected endpoint.
- [ ] Network failure surfaces user-friendly message (verify one forced failure scenario).
- [ ] Invalid project ID returns handled error (no unhandled promise rejection).

---

## Future Enhancements

- Extend `apiClient.delete` to support request bodies (remove query workaround for delete-member).
- Extract report DTOs to `types/report.ts` if reused across components.
- Add Zod or similar runtime validation for critical DTO boundaries.
- Implement tests (e.g., using MSW) to simulate API responses and guard mappings.

---

## Quick Reference Imports

```ts
import { projectService } from "@/services/projectService";
import { projectAssignmentService } from "@/services/projectAssignmentService";
import { enhancedAssignmentService } from "@/services/enhancedAssignmentService";
import { milestoneService } from "@/services/milestoneService";
import { reportService } from "@/services/reportService";
```

## Contact / Ownership

Refactor Owner: (update with maintainer name)
Accountable for follow-up cleanup: (assign)

---

End of Migration Guide.

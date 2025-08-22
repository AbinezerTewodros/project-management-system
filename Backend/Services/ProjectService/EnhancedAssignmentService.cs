using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Dto.ProjectDto;
using ProjectManagementSystem1.Model.Entities;

namespace ProjectManagementSystem1.Services.ProjectService
{
    public class EnhancedAssignmentService : IEnhancedAssignmentService
    {
        private readonly AppDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ILogger<EnhancedAssignmentService> _logger;

        public EnhancedAssignmentService(
            AppDbContext context,
            UserManager<ApplicationUser> userManager,
            ILogger<EnhancedAssignmentService> logger)
        {
            _context = context;
            _userManager = userManager;
            _logger = logger;
        }

        public async Task<EnhancedAssignmentDto> CreateAssignmentAsync(CreateEnhancedAssignmentDto dto, string currentUser)
        {
            // Validate project exists
            var project = await _context.Projects.FindAsync(dto.ProjectId);
            if (project == null)
                throw new ArgumentException("Project not found");

            // Validate member exists
            var member = await _userManager.FindByIdAsync(dto.MemberId);
            if (member == null)
                throw new ArgumentException("Member not found");

            // Check if assignment already exists
            var existingAssignment = await _context.ProjectAssignments
                .FirstOrDefaultAsync(a => a.ProjectId == dto.ProjectId && a.MemberId == dto.MemberId && a.IsActive);
            
            if (existingAssignment != null)
                throw new InvalidOperationException("Member is already assigned to this project");

            // Validate workload
            if (!await ValidateWorkloadAssignmentAsync(dto.MemberId, dto.WorkloadPercentage))
                throw new InvalidOperationException("Member workload would exceed 100%");

            // Handle multiple scrum masters
            if (dto.MemberRole.Equals("ScrumMaster", StringComparison.OrdinalIgnoreCase))
            {
                if (dto.IsPrimaryScrumMaster)
                {
                    // Set all other scrum masters as non-primary
                    var existingScrumMasters = await _context.ProjectAssignments
                        .Where(a => a.ProjectId == dto.ProjectId && 
                                  a.MemberRole.Equals("ScrumMaster", StringComparison.OrdinalIgnoreCase) &&
                                  a.IsActive)
                        .ToListAsync();
                    
                    foreach (var sm in existingScrumMasters)
                    {
                        sm.IsPrimaryScrumMaster = false;
                    }
                }
            }

            var assignment = new ProjectAssignment
            {
                ProjectId = dto.ProjectId,
                MemberId = dto.MemberId,
                MemberRole = dto.MemberRole,
                Role = dto.Role,
                IsPrimaryScrumMaster = dto.IsPrimaryScrumMaster,
                WorkloadPercentage = dto.WorkloadPercentage,
                AssignmentStartDate = dto.AssignmentStartDate ?? DateTime.UtcNow,
                AssignmentEndDate = dto.AssignmentEndDate,
                AssignmentNotes = dto.AssignmentNotes,
                Status = ProjectAssignment.AssignmentStatus.Pending,
                CreateUser = currentUser,
                CreatedDate = DateTime.UtcNow,
                IsActive = true
            };

            _context.ProjectAssignments.Add(assignment);
            await _context.SaveChangesAsync();

            return await GetAssignmentAsync(assignment.Id);
        }

        public async Task<EnhancedAssignmentDto> UpdateAssignmentAsync(int assignmentId, UpdateAssignmentDto dto, string currentUser)
        {
            var assignment = await _context.ProjectAssignments
                .FirstOrDefaultAsync(a => a.Id == assignmentId && a.IsActive);

            if (assignment == null)
                throw new ArgumentException("Assignment not found");

            // Update fields if provided
            if (!string.IsNullOrEmpty(dto.MemberRole))
                assignment.MemberRole = dto.MemberRole;
            
            if (!string.IsNullOrEmpty(dto.Role))
                assignment.Role = dto.Role;
            
            if (dto.WorkloadPercentage.HasValue)
            {
                if (!await ValidateWorkloadAssignmentAsync(assignment.MemberId, dto.WorkloadPercentage.Value))
                    throw new InvalidOperationException("Member workload would exceed 100%");
                assignment.WorkloadPercentage = dto.WorkloadPercentage.Value;
            }
            
            if (dto.AssignmentStartDate.HasValue)
                assignment.AssignmentStartDate = dto.AssignmentStartDate;
            
            if (dto.AssignmentEndDate.HasValue)
                assignment.AssignmentEndDate = dto.AssignmentEndDate;
            
            if (!string.IsNullOrEmpty(dto.AssignmentNotes))
                assignment.AssignmentNotes = dto.AssignmentNotes;
            
            if (dto.IsActive.HasValue)
                assignment.IsActive = dto.IsActive.Value;
            
            if (dto.IsPrimaryScrumMaster.HasValue && dto.IsPrimaryScrumMaster.Value)
            {
                // Set all other scrum masters as non-primary
                var existingScrumMasters = await _context.ProjectAssignments
                    .Where(a => a.ProjectId == assignment.ProjectId && 
                              a.MemberRole.Equals("ScrumMaster", StringComparison.OrdinalIgnoreCase) &&
                              a.IsActive && a.Id != assignmentId)
                    .ToListAsync();
                
                foreach (var sm in existingScrumMasters)
                {
                    sm.IsPrimaryScrumMaster = false;
                }
                assignment.IsPrimaryScrumMaster = true;
            }

            assignment.UpdateUser = currentUser;
            assignment.UpdatedDate = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return await GetAssignmentAsync(assignmentId);
        }

        public async Task<bool> DeleteAssignmentAsync(int assignmentId, string currentUser)
        {
            var assignment = await _context.ProjectAssignments
                .FirstOrDefaultAsync(a => a.Id == assignmentId && a.IsActive);

            if (assignment == null)
                return false;

            // Soft delete
            assignment.IsActive = false;
            assignment.UpdateUser = currentUser;
            assignment.UpdatedDate = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<EnhancedAssignmentDto> GetAssignmentAsync(int assignmentId)
        {
            var assignment = await _context.ProjectAssignments
                .Include(a => a.Project)
                .Include(a => a.Member)
                .FirstOrDefaultAsync(a => a.Id == assignmentId);

            if (assignment == null)
                throw new ArgumentException("Assignment not found");

            return new EnhancedAssignmentDto
            {
                Id = assignment.Id,
                ProjectId = assignment.ProjectId,
                ProjectName = assignment.Project?.ProjectName ?? string.Empty,
                MemberId = assignment.MemberId,
                MemberName = assignment.Member?.UserName ?? string.Empty,
                MemberEmail = assignment.Member?.Email ?? string.Empty,
                MemberRole = assignment.MemberRole,
                Role = assignment.Role,
                Status = assignment.Status,
                IsPrimaryScrumMaster = assignment.IsPrimaryScrumMaster,
                WorkloadPercentage = assignment.WorkloadPercentage,
                AssignmentStartDate = assignment.AssignmentStartDate,
                AssignmentEndDate = assignment.AssignmentEndDate,
                AssignmentNotes = assignment.AssignmentNotes,
                IsActive = assignment.IsActive,
                CreatedDate = assignment.CreatedDate,
                ApprovedBy = assignment.ApprovedById,
                ApprovedDate = assignment.ApprovedDate
            };
        }

        public async Task<List<EnhancedAssignmentDto>> GetProjectAssignmentsAsync(int projectId)
        {
            var assignments = await _context.ProjectAssignments
                .Include(a => a.Project)
                .Include(a => a.Member)
                .Where(a => a.ProjectId == projectId && a.IsActive)
                .ToListAsync();

            return assignments.Select(a => new EnhancedAssignmentDto
            {
                Id = a.Id,
                ProjectId = a.ProjectId,
                ProjectName = a.Project?.ProjectName ?? string.Empty,
                MemberId = a.MemberId,
                MemberName = a.Member?.UserName ?? string.Empty,
                MemberEmail = a.Member?.Email ?? string.Empty,
                MemberRole = a.MemberRole,
                Role = a.Role,
                Status = a.Status,
                IsPrimaryScrumMaster = a.IsPrimaryScrumMaster,
                WorkloadPercentage = a.WorkloadPercentage,
                AssignmentStartDate = a.AssignmentStartDate,
                AssignmentEndDate = a.AssignmentEndDate,
                AssignmentNotes = a.AssignmentNotes,
                IsActive = a.IsActive,
                CreatedDate = a.CreatedDate,
                ApprovedBy = a.ApprovedById,
                ApprovedDate = a.ApprovedDate
            }).ToList();
        }

        public async Task<List<ScrumMasterDto>> GetProjectScrumMastersAsync(int projectId)
        {
            var scrumMasters = await _context.ProjectAssignments
                .Include(a => a.Member)
                .Where(a => a.ProjectId == projectId && 
                           a.MemberRole.Equals("ScrumMaster", StringComparison.OrdinalIgnoreCase) &&
                           a.IsActive)
                .ToListAsync();

            return scrumMasters.Select(sm => new ScrumMasterDto
            {
                MemberId = sm.MemberId,
                MemberName = sm.Member?.UserName ?? string.Empty,
                IsPrimary = sm.IsPrimaryScrumMaster,
                WorkloadPercentage = sm.WorkloadPercentage,
                AssignmentStartDate = sm.AssignmentStartDate,
                AssignmentEndDate = sm.AssignmentEndDate
            }).ToList();
        }

        public async Task<MultipleScrumMasterDto> GetMultipleScrumMastersAsync(int projectId)
        {
            var project = await _context.Projects.FindAsync(projectId);
            if (project == null)
                throw new ArgumentException("Project not found");

            var scrumMasters = await GetProjectScrumMastersAsync(projectId);

            return new MultipleScrumMasterDto
            {
                ProjectId = projectId,
                ProjectName = project.ProjectName,
                ScrumMasters = scrumMasters
            };
        }

        public async Task<bool> SetPrimaryScrumMasterAsync(int projectId, string memberId, string currentUser)
        {
            var assignment = await _context.ProjectAssignments
                .FirstOrDefaultAsync(a => a.ProjectId == projectId && 
                                        a.MemberId == memberId &&
                                        a.MemberRole.Equals("ScrumMaster", StringComparison.OrdinalIgnoreCase) &&
                                        a.IsActive);

            if (assignment == null)
                return false;

            // Set all other scrum masters as non-primary
            var existingScrumMasters = await _context.ProjectAssignments
                .Where(a => a.ProjectId == projectId && 
                          a.MemberRole.Equals("ScrumMaster", StringComparison.OrdinalIgnoreCase) &&
                          a.IsActive)
                .ToListAsync();
            
            foreach (var sm in existingScrumMasters)
            {
                sm.IsPrimaryScrumMaster = false;
            }

            assignment.IsPrimaryScrumMaster = true;
            assignment.UpdateUser = currentUser;
            assignment.UpdatedDate = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> AddScrumMasterAsync(int projectId, string memberId, bool isPrimary, string currentUser)
        {
            var dto = new CreateEnhancedAssignmentDto
            {
                ProjectId = projectId,
                MemberId = memberId,
                MemberRole = "ScrumMaster",
                IsPrimaryScrumMaster = isPrimary,
                WorkloadPercentage = 50.0 // Default workload for scrum master
            };

            try
            {
                await CreateAssignmentAsync(dto, currentUser);
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> RemoveScrumMasterAsync(int projectId, string memberId, string currentUser)
        {
            var assignment = await _context.ProjectAssignments
                .FirstOrDefaultAsync(a => a.ProjectId == projectId && 
                                        a.MemberId == memberId &&
                                        a.MemberRole.Equals("ScrumMaster", StringComparison.OrdinalIgnoreCase) &&
                                        a.IsActive);

            if (assignment == null)
                return false;

            return await DeleteAssignmentAsync(assignment.Id, currentUser);
        }

        public async Task<MemberAvailabilityDto> GetMemberAvailabilityAsync(string memberId)
        {
            var member = await _userManager.FindByIdAsync(memberId);
            if (member == null)
                throw new ArgumentException("Member not found");

            var assignments = await _context.ProjectAssignments
                .Include(a => a.Project)
                .Where(a => a.MemberId == memberId && a.IsActive)
                .ToListAsync();

            var totalWorkload = assignments.Sum(a => a.WorkloadPercentage);
            var availableWorkload = Math.Max(0, 100 - totalWorkload);
            var isOverloaded = totalWorkload > 100;

            var projectWorkloads = assignments.Select(a => new ProjectWorkloadDto
            {
                ProjectId = a.ProjectId,
                ProjectName = a.Project?.ProjectName ?? string.Empty,
                MemberRole = a.MemberRole,
                WorkloadPercentage = a.WorkloadPercentage,
                AssignmentStartDate = a.AssignmentStartDate,
                AssignmentEndDate = a.AssignmentEndDate,
                IsActive = a.IsActive
            }).ToList();

            return new MemberAvailabilityDto
            {
                MemberId = memberId,
                MemberName = member.UserName ?? string.Empty,
                MemberEmail = member.Email ?? string.Empty,
                TotalWorkloadPercentage = totalWorkload,
                ActiveProjectCount = assignments.Count,
                ProjectWorkloads = projectWorkloads,
                AvailableWorkloadPercentage = availableWorkload,
                IsOverloaded = isOverloaded
            };
        }

        public async Task<List<MemberAvailabilityDto>> GetAllMembersAvailabilityAsync()
        {
            var members = await _userManager.Users.ToListAsync();
            var result = new List<MemberAvailabilityDto>();

            foreach (var member in members)
            {
                try
                {
                    var availability = await GetMemberAvailabilityAsync(member.Id);
                    result.Add(availability);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error getting availability for member {MemberId}", member.Id);
                }
            }

            return result;
        }

        public async Task<List<MemberAvailabilityDto>> GetAvailableMembersForProjectAsync(int projectId, double requiredWorkload = 100.0)
        {
            var allMembers = await GetAllMembersAvailabilityAsync();
            return allMembers.Where(m => m.AvailableWorkloadPercentage >= requiredWorkload).ToList();
        }

        public async Task<bool> CheckMemberAvailabilityAsync(string memberId, double requiredWorkload)
        {
            var availability = await GetMemberAvailabilityAsync(memberId);
            return availability.AvailableWorkloadPercentage >= requiredWorkload;
        }

        public async Task<EnhancedAssignmentDto> ReassignMemberAsync(ReassignmentRequestDto request, string currentUser)
        {
            var oldAssignment = await _context.ProjectAssignments
                .FirstOrDefaultAsync(a => a.Id == request.AssignmentId && a.IsActive);

            if (oldAssignment == null)
                throw new ArgumentException("Assignment not found");

            // Check if new member is available
            if (!await CheckMemberAvailabilityAsync(request.NewMemberId, oldAssignment.WorkloadPercentage))
                throw new InvalidOperationException("New member does not have sufficient availability");

            // Create new assignment
            var newAssignment = new ProjectAssignment
            {
                ProjectId = oldAssignment.ProjectId,
                MemberId = request.NewMemberId,
                MemberRole = oldAssignment.MemberRole,
                Role = oldAssignment.Role,
                IsPrimaryScrumMaster = oldAssignment.IsPrimaryScrumMaster,
                WorkloadPercentage = oldAssignment.WorkloadPercentage,
                AssignmentStartDate = request.EffectiveDate ?? DateTime.UtcNow,
                AssignmentEndDate = oldAssignment.AssignmentEndDate,
                AssignmentNotes = request.Notes,
                Status = ProjectAssignment.AssignmentStatus.Pending,
                CreateUser = currentUser,
                CreatedDate = DateTime.UtcNow,
                IsActive = true
            };

            // Deactivate old assignment
            oldAssignment.IsActive = false;
            oldAssignment.UpdateUser = currentUser;
            oldAssignment.UpdatedDate = DateTime.UtcNow;

            _context.ProjectAssignments.Add(newAssignment);
            await _context.SaveChangesAsync();

            return await GetAssignmentAsync(newAssignment.Id);
        }

        public async Task<List<EnhancedAssignmentDto>> GetReassignmentHistoryAsync(string memberId)
        {
            var assignments = await _context.ProjectAssignments
                .Include(a => a.Project)
                .Include(a => a.Member)
                .Where(a => a.MemberId == memberId)
                .OrderByDescending(a => a.CreatedDate)
                .ToListAsync();

            return assignments.Select(a => new EnhancedAssignmentDto
            {
                Id = a.Id,
                ProjectId = a.ProjectId,
                ProjectName = a.Project?.ProjectName ?? string.Empty,
                MemberId = a.MemberId,
                MemberName = a.Member?.UserName ?? string.Empty,
                MemberEmail = a.Member?.Email ?? string.Empty,
                MemberRole = a.MemberRole,
                Role = a.Role,
                Status = a.Status,
                IsPrimaryScrumMaster = a.IsPrimaryScrumMaster,
                WorkloadPercentage = a.WorkloadPercentage,
                AssignmentStartDate = a.AssignmentStartDate,
                AssignmentEndDate = a.AssignmentEndDate,
                AssignmentNotes = a.AssignmentNotes,
                IsActive = a.IsActive,
                CreatedDate = a.CreatedDate,
                ApprovedBy = a.ApprovedById,
                ApprovedDate = a.ApprovedDate
            }).ToList();
        }

        public async Task<double> GetMemberTotalWorkloadAsync(string memberId)
        {
            var assignments = await _context.ProjectAssignments
                .Where(a => a.MemberId == memberId && a.IsActive)
                .ToListAsync();

            return assignments.Sum(a => a.WorkloadPercentage);
        }

        public async Task<bool> ValidateWorkloadAssignmentAsync(string memberId, double newWorkload)
        {
            var currentWorkload = await GetMemberTotalWorkloadAsync(memberId);
            return (currentWorkload + newWorkload) <= 100.0;
        }

        public async Task<List<ProjectWorkloadDto>> GetMemberProjectWorkloadsAsync(string memberId)
        {
            var assignments = await _context.ProjectAssignments
                .Include(a => a.Project)
                .Where(a => a.MemberId == memberId && a.IsActive)
                .ToListAsync();

            return assignments.Select(a => new ProjectWorkloadDto
            {
                ProjectId = a.ProjectId,
                ProjectName = a.Project?.ProjectName ?? string.Empty,
                MemberRole = a.MemberRole,
                WorkloadPercentage = a.WorkloadPercentage,
                AssignmentStartDate = a.AssignmentStartDate,
                AssignmentEndDate = a.AssignmentEndDate,
                IsActive = a.IsActive
            }).ToList();
        }
    }
}

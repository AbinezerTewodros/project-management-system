using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Dto.MilestoneDto;
using ProjectManagementSystem1.Model.Dto.ProjectManagementDto;
using ProjectManagementSystem1.Model.Entities;
using ProjectManagementSystem1.Services.ProjectService; // ✅ Added

namespace ProjectManagementSystem1.Services.MilestoneService
{
    public class MilestoneService : IMilestoneService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;
        private readonly IProjectService _projectService; // ✅ Added

        public MilestoneService(AppDbContext context, IMapper mapper, IProjectService projectService) // ✅ Added parameter
        {
            _context = context;
            _mapper = mapper;
            _projectService = projectService; // ✅ Added
        }

        public async Task<MilestoneReadDto> GetMilestoneByIdAsync(int id)
        {
            return await _context.Milestones
                .Where(m => m.MilestoneId == id)
                .ProjectTo<MilestoneReadDto>(_mapper.ConfigurationProvider)
                .FirstOrDefaultAsync();
        }

        public async Task<MilestoneReadDto> CreateAsync(CreateMilestoneDto dto)
        {
            var milestone = _mapper.Map<Milestone>(dto);

            // Use the status from DTO instead of overriding it
            milestone.Status = dto.Status;
            milestone.AssignedMemberId = dto.AssignedMemberId;
            milestone.StartDate = dto.StartDate;
            milestone.DueDate = dto.DueDate;
            milestone.Weight = dto.Weight;
            milestone.Description = dto.Description;
            milestone.MilestoneName = dto.MilestoneName;
            milestone.Progress = 0; // Initialize progress to 0

            _context.Milestones.Add(milestone);
            await _context.SaveChangesAsync();

            return _mapper.Map<MilestoneReadDto>(milestone);
        }

        public async Task<bool> DeleteMilestoneAsync(int id)
        {
            var milestoneToDelete = await _context.Milestones.FindAsync(id);
            if (milestoneToDelete == null)
            {
                return false;
            }

            _context.Milestones.Remove(milestoneToDelete);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<MilestoneReadDto>> GetAllMilestoneAsync()
        {
            return await _context.Milestones
         .AsNoTracking() // Disable change tracking
         .Select(m => new MilestoneReadDto // Manual projection avoids navigation issues
         {
             MilestoneId = m.MilestoneId,
             MilestoneName = m.MilestoneName,
             Description = m.Description,
             AssignedMemberId = m.AssignedMemberId,
             ProjectId = m.ProjectId,
             DueDate = m.DueDate,
             Weight = m.Weight,
             Status = m.Status, // Handle enum conversion
             AssignmentStatus = m.AssignmentStatus, // ✅ CRITICAL FIX: Include assignment status!
             AssignmentAcceptedDate = m.AssignmentAcceptedDate, // ✅ Include acceptance date
             AssignmentRejectionReason = m.AssignmentRejectionReason, // ✅ Include rejection reason
             CreatedAt = m.CreatedAt,
             UpdatedAt = m.UpdatedAt,
             Progress = m.Progress
         })
         .ToListAsync();
        }

        public async Task AddTeamMemberAsync(int milestoneId, string memberId, bool setAsPrimary = false)
        {
            var milestone = await _context.Milestones.FindAsync(milestoneId);
            if (milestone == null)
                throw new ArgumentException("Milestone not found");

            await ValidateMemberIsInProjectAsync(milestoneId, memberId);


            // ✅ Check if member exists in junction table instead of TeamMemberIds
            var existingMember = await _context.MilestoneMembers
                .FirstOrDefaultAsync(mm => mm.MilestoneId == milestoneId && mm.MemberId == memberId);

            if (existingMember == null)
            {
                // ✅ Add to junction table instead of TeamMemberIds
                var milestoneMember = new MilestoneMember
                {
                    MilestoneId = milestoneId,
                    MemberId = memberId,
                    Role = "Contributor", // Default role
                    IsLead = false,
                    AssignedDate = DateTime.UtcNow
                };

                _context.MilestoneMembers.Add(milestoneMember);

                if (setAsPrimary || string.IsNullOrEmpty(milestone.AssignedMemberId))
                {
                    milestone.AssignedMemberId = memberId;
                }

                milestone.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }

        public async Task AddTeamMemberWithRoleAsync(int milestoneId, string memberId, string role = "Contributor", bool isLead = false)
        {
            var milestone = await _context.Milestones.FindAsync(milestoneId);
            if (milestone == null)
                throw new ArgumentException("Milestone not found");

            var existingMember = await _context.MilestoneMembers
                        .FirstOrDefaultAsync(mm => mm.MilestoneId == milestoneId && mm.MemberId == memberId);

            if (existingMember == null)
            {
                var milestoneMember = new MilestoneMember
                {
                    MilestoneId = milestoneId,
                    MemberId = memberId,
                    Role = role,
                    IsLead = isLead,
                    AssignedDate = DateTime.UtcNow
                };

                _context.MilestoneMembers.Add(milestoneMember);

                // Also add to legacy TeamMemberIds for backward compatibility
                //await AddToLegacyTeamMembers(milestone, memberId);

                // Set as primary if this is the lead
                if (isLead)
                {
                    milestone.AssignedMemberId = memberId;
                }
                // Note: Role and IsLead are not stored in current Milestone model
                // This is a placeholder for future implementation
                milestone.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }

        public async Task UpdateMemberRoleAsync(int milestoneId, string memberId, string newRole, bool isLead)
        {
            var milestoneMember = await _context.MilestoneMembers
                .FirstOrDefaultAsync(mm => mm.MilestoneId == milestoneId && mm.MemberId == memberId);

            if (milestoneMember != null)
            {
                // Prevent multiple leads
                if (isLead)
                {
                    var existingLeads = await _context.MilestoneMembers
                        .Where(mm => mm.MilestoneId == milestoneId && mm.IsLead && mm.MemberId != memberId)
                        .ToListAsync();

                    foreach (var lead in existingLeads)
                    {
                        lead.IsLead = false;
                    }
                }

                milestoneMember.Role = newRole;
                milestoneMember.IsLead = isLead;
                milestoneMember.AssignedDate = DateTime.UtcNow;

                // ✅ If setting as lead, update primary assignee AND sync status
                if (isLead)
                {
                    var milestone = await _context.Milestones.FindAsync(milestoneId);
                    milestone.AssignedMemberId = memberId;
                    milestone.AssignmentStatus = milestoneMember.AssignmentStatus; // Sync status
                    milestone.AssignmentAcceptedDate = milestoneMember.AssignmentAcceptedDate;
                    milestone.AssignmentRejectionReason = milestoneMember.AssignmentRejectionReason;
                    milestone.UpdatedAt = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();
            }
        }

        public async Task<List<MilestoneMember>> GetMilestoneMembersWithRolesAsync(int milestoneId)
        {
            return await _context.MilestoneMembers
                .Include(mm => mm.Member)
                .Where(mm => mm.MilestoneId == milestoneId)
                .ToListAsync();
        }

        public async Task SetPrimaryAssigneeAsync(int milestoneId, string memberId)
        {
            var milestone = await _context.Milestones.FindAsync(milestoneId);
            if (milestone == null)
                throw new ArgumentException("Milestone not found");

            var teamMembers = await GetTeamMembersAsync(milestoneId);
            if (!teamMembers.Contains(memberId))
            {
                throw new InvalidOperationException("Member must be part of the team before being set as primary");
            }

            // ✅ COPY assignment status from MilestoneMembers to Milestone table
            var newPrimaryMember = await _context.MilestoneMembers
                .FirstOrDefaultAsync(mm => mm.MilestoneId == milestoneId && mm.MemberId == memberId);

            milestone.AssignedMemberId = memberId;

            if (newPrimaryMember != null)
            {
                milestone.AssignmentStatus = newPrimaryMember.AssignmentStatus;
                milestone.AssignmentAcceptedDate = newPrimaryMember.AssignmentAcceptedDate;
                milestone.AssignmentRejectionReason = newPrimaryMember.AssignmentRejectionReason;
            }
            else
            {
                // If member exists in team but not in MilestoneMembers (shouldn't happen)
                milestone.AssignmentStatus = MilestoneAssignmentStatus.Pending;
                milestone.AssignmentAcceptedDate = null;
                milestone.AssignmentRejectionReason = null;
            }

            milestone.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        public async Task RemoveTeamMemberAsync(int milestoneId, string memberId)
        {
            var milestone = await _context.Milestones.FindAsync(milestoneId);
            if (milestone == null) return;

            // ✅ Remove from junction table instead of TeamMemberIds
            var milestoneMember = await _context.MilestoneMembers
                .FirstOrDefaultAsync(mm => mm.MilestoneId == milestoneId && mm.MemberId == memberId);

            if (milestoneMember != null)
            {
                _context.MilestoneMembers.Remove(milestoneMember);

                if (milestone.AssignedMemberId == memberId)
                {
                    milestone.AssignedMemberId = null;
                }

                milestone.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }

        public async Task<List<string>> GetTeamMembersAsync(int milestoneId)
        {
            return await _context.MilestoneMembers
                .Where(mm => mm.MilestoneId == milestoneId)
                .Select(mm => mm.MemberId)
                .ToListAsync();
        }



        // ✅ PRIVATE helper method (not in interface)
        private List<string> GetTeamMembersFromMilestone(Milestone milestone)
        {
            var members = new List<string>();

            // Include primary assigned member
            if (!string.IsNullOrEmpty(milestone.AssignedMemberId))
                members.Add(milestone.AssignedMemberId);

            // ✅ Include team members from junction table instead of TeamMemberIds
            if (milestone.MilestoneMembers != null && milestone.MilestoneMembers.Any())
            {
                members.AddRange(milestone.MilestoneMembers.Select(mm => mm.MemberId));
            }

            return members.Distinct().ToList();
        }
        public async Task<IEnumerable<MilestoneReadDto>> GetMilestonesByProjectIdAsync(int projectId)
        {
            return await _context.Milestones
              .Where(m => m.ProjectId == projectId)
              .ProjectTo<MilestoneReadDto>(_mapper.ConfigurationProvider)
              .ToListAsync();
        }

        
        public async Task<MilestoneReadDto> UpdateMilestoneAsync(int id, UpdateMilestoneDto dto)
        {
            var existingMilestone = await _context.Milestones.FindAsync(id);
            if (existingMilestone == null)
            {
                return null;
            }

            //var milestoneName = existingMilestone.MilestoneName;
            //var description = existingMilestone.Description;
            //var assignedMemberId = existingMilestone.AssignedMemberId;
            //var dueDate = existingMilestone.DueDate;
            //var weight = existingMilestone.Weight;
            //var updatedAt = existingMilestone.UpdatedAt;
            //var progress = existingMilestone.Progress;
            var createdAt = existingMilestone.CreatedAt;
             
          
            _mapper.Map(dto, existingMilestone);

            existingMilestone.MilestoneName = dto.MilestoneName;
            existingMilestone.Description = dto.Description;
            existingMilestone.AssignedMemberId = dto.AssignedMemberId;
            existingMilestone.DueDate = (DateTime)dto.DueDate;
            existingMilestone.Weight = dto.Weight;
            existingMilestone.UpdatedAt = System.DateTime.UtcNow;
            existingMilestone.CreatedAt = createdAt;
            existingMilestone.Progress = dto.Progress;


            await _context.SaveChangesAsync();
            return _mapper.Map<MilestoneReadDto>(existingMilestone);
        }

        public async Task<double> CalculateMilestoneProgress(int milestoneId)
        {
            var tasks = await _context.ProjectTasks
                .Where(t => t.MilestoneId == milestoneId)
                .ToListAsync();

            if (!tasks.Any()) return 0;

            return tasks.Average(t => t.Progress);
        }

        public async Task UpdateMilestoneProgress(int milestoneId)
        {
            var milestone = await _context.Milestones.FindAsync(milestoneId);
            if (milestone == null) return;

            var oldProgress = milestone.Progress;
            milestone.Progress = await CalculateMilestoneProgress(milestoneId);
            milestone.UpdatedAt = DateTime.UtcNow;

            // ✅ Auto-update milestone status based on progress
            var oldStatus = milestone.Status;
            
            if (milestone.Progress >= 100 && milestone.Status != MilestoneStatus.Completed)
            {
                milestone.Status = MilestoneStatus.Completed;
                Console.WriteLine($"✅ Milestone {milestoneId} status: {oldStatus} → Completed (100% progress)");
            }
            else if (milestone.Progress > 0 && milestone.Progress < 100 && 
                     (milestone.Status == MilestoneStatus.Pending || milestone.Status == MilestoneStatus.Planning))
            {
                milestone.Status = MilestoneStatus.InProgress;
                Console.WriteLine($"🔄 Milestone {milestoneId} status: {oldStatus} → InProgress ({milestone.Progress:F1}%)");
            }
            
            // ✅ Keep status if already InProgress and progress is between 0-100
            if (milestone.Status != oldStatus)
            {
                Console.WriteLine($"📝 Milestone {milestoneId} status changed: {oldStatus} → {milestone.Status}");
            }
            else
            {
                Console.WriteLine($"📝 Milestone {milestoneId} status unchanged: {milestone.Status} (Progress: {milestone.Progress:F1}%)");
            }

            await _context.SaveChangesAsync();

            Console.WriteLine($"✅ Milestone {milestoneId} progress updated: {oldProgress:F1}% → {milestone.Progress:F1}%");

            // ✅ FIX: Update project progress after milestone progress changes
            if (milestone.ProjectId > 0) // ✅ Fixed: ProjectId is int, not int?
            {
                await _projectService.UpdateProjectProgress(milestone.ProjectId);
                Console.WriteLine($"✅ Updated project {milestone.ProjectId} progress after milestone {milestoneId} progress changed");
            }
        }

        // Assignment Approval Methods
        public async Task AcceptMilestoneAssignmentAsync(int milestoneId, string userId)
        {
            var milestone = await _context.Milestones.FindAsync(milestoneId);
            if (milestone == null)
                throw new ArgumentException("Milestone not found");

            var milestoneMember = await _context.MilestoneMembers
                .FirstOrDefaultAsync(mm => mm.MilestoneId == milestoneId && mm.MemberId == userId);

            if (milestoneMember == null)
                throw new UnauthorizedAccessException("You are not assigned to this milestone");

            if (milestone.AssignedMemberId != userId)
            {
                var leadMember = await _context.MilestoneMembers
                    .FirstOrDefaultAsync(mm => mm.MilestoneId == milestoneId &&
                                             mm.MemberId == milestone.AssignedMemberId);

                if (leadMember?.AssignmentStatus != MilestoneAssignmentStatus.Accepted)
                {
                    throw new InvalidOperationException(
                        "Team lead must accept the milestone assignment before team members can accept");
                }
            }

            if (milestoneMember.AssignmentStatus != MilestoneAssignmentStatus.Pending)
                throw new InvalidOperationException("Only pending milestone assignments can be accepted");

            // ✅ ONLY update MilestoneMembers table - single source of truth
            milestoneMember.AssignmentStatus = MilestoneAssignmentStatus.Accepted;
            milestoneMember.AssignmentAcceptedDate = DateTime.UtcNow;

            if (milestone.AssignedMemberId == userId)
            {
                milestone.AssignmentStatus = MilestoneAssignmentStatus.Accepted;
                milestone.AssignmentAcceptedDate = DateTime.UtcNow;
            }

            milestone.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        public async Task RejectMilestoneAssignmentAsync(int milestoneId, string userId, string reason)
        {
            var milestone = await _context.Milestones.FindAsync(milestoneId);
            if (milestone == null)
                throw new ArgumentException("Milestone not found");

            var milestoneMember = await _context.MilestoneMembers
                .FirstOrDefaultAsync(mm => mm.MilestoneId == milestoneId && mm.MemberId == userId);

            if (milestoneMember == null)
                throw new UnauthorizedAccessException("You are not assigned to this milestone");

            if (milestoneMember.AssignmentStatus != MilestoneAssignmentStatus.Pending)
                throw new InvalidOperationException("Only pending milestone assignments can be rejected");

            // ✅ ONLY update MilestoneMembers table
            milestoneMember.AssignmentStatus = MilestoneAssignmentStatus.Rejected;
            milestoneMember.AssignmentRejectionReason = reason;

            if (milestone.AssignedMemberId == userId)
            {
                milestone.AssignmentStatus = MilestoneAssignmentStatus.Rejected;
                milestone.AssignmentRejectionReason = reason;
            }

            milestone.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        public async Task<List<MilestoneReadDto>> GetPendingMilestonesForUserAsync(string userId)
        {
            var pendingMilestoneIds = await _context.MilestoneMembers
                .Where(mm => mm.MemberId == userId &&
                            mm.AssignmentStatus == MilestoneAssignmentStatus.Pending)
                .Select(mm => mm.MilestoneId)
                .ToListAsync();

            return await _context.Milestones
                .Where(m => pendingMilestoneIds.Contains(m.MilestoneId))
                .Select(m => new MilestoneReadDto
                {
                    // ... your existing properties
                })
                .ToListAsync();
        }

        public async Task<List<MilestoneReadDto>> GetMilestonesAssignedToUserAsync(string userId)
        {
            return await _context.Milestones
                .Where(m => (m.AssignedMemberId == userId ||
                    m.MilestoneMembers.Any(mm => mm.MemberId == userId)))
                .Select(m => new MilestoneReadDto
                {
                    MilestoneId = m.MilestoneId,
                    MilestoneName = m.MilestoneName,
                    Description = m.Description,
                    AssignedMemberId = m.AssignedMemberId,
                    ProjectId = m.ProjectId,
                    DueDate = m.DueDate,
                    Weight = m.Weight,
                    Status = m.Status,
                    AssignmentStatus = m.AssignmentStatus,
                    AssignmentAcceptedDate = m.AssignmentAcceptedDate,
                    AssignmentRejectionReason = m.AssignmentRejectionReason,
                    CreatedAt = m.CreatedAt,
                    UpdatedAt = m.UpdatedAt,
                    Progress = m.Progress
                })
                .ToListAsync();
        }

        public async Task ValidateMemberIsInProjectAsync(int milestoneId, string memberId)
        {
            var milestone = await _context.Milestones
                .Include(m => m.Project)
                .ThenInclude(p => p.ProjectAssignments)
                .FirstOrDefaultAsync(m => m.MilestoneId == milestoneId);

            if (milestone == null)
                throw new ArgumentException("Milestone not found");

            // Check if member is assigned to the project
            var isMemberInProject = milestone.Project.ProjectAssignments
                .Any(pa => pa.MemberId == memberId && pa.IsActive);

            if (!isMemberInProject)
                throw new InvalidOperationException($"Member {memberId} is not assigned to project {milestone.ProjectId}");
        }

    }
}

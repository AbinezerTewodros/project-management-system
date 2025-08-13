using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Dto.MilestoneDto;
using ProjectManagementSystem1.Model.Dto.ProjectManagementDto;
using ProjectManagementSystem1.Model.Entities;

namespace ProjectManagementSystem1.Services.MilestoneService
{
    public class MilestoneService : IMilestoneService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;

        public MilestoneService(AppDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
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

            milestone.Status = Milestone.MilestoneStatus.Pending; // Set a default status
            milestone.AssignedMemberId = dto.AssignedMemberId;
            milestone.StartDate = DateTime.UtcNow;
            milestone.DueDate = (DateTime)dto.DueDate;
            milestone.Weight = dto.Weight;
            milestone.Description = dto.Description;
            milestone.MilestoneName = dto.MilestoneName;


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
             CreatedAt = m.CreatedAt,
             UpdatedAt = m.UpdatedAt,
             Progress = m.Progress
         })
         .ToListAsync();
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

            milestone.Progress = await CalculateMilestoneProgress(milestoneId);
            milestone.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }

    }
}

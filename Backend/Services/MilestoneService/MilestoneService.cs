using AutoMapper;
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

         public async Task<Milestone> GetMilestoneByIdAsync(int id)
        {
            return await _context.Milestones.FindAsync(id);
        }
        public async Task<MilestoneReadDto> CreateAsync(CreateMilestoneDto dto)
        {
            var milestone = _mapper.Map<Milestone>(dto);

            milestone.Status = "Pending"; // Set a default status
            milestone.CreatedAt = DateTime.UtcNow;
            milestone.UpdatedAt = DateTime.UtcNow;

            _context.Milestones.Add(milestone);
            await _context.SaveChangesAsync();

            return _mapper.Map<MilestoneReadDto>(milestone);
        }

        public async Task<bool> DeleteMilestoneAsync(int id)
        {
            var milestoneToDelete = await _context.Milestones.FindAsync(id);
            if (milestoneToDelete != null)
            {
                return false;
            }

            _context.Milestones.Remove(milestoneToDelete);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<Milestone>> GetAllMilestoneAsync()
        {
            return await _context.Milestones.ToListAsync();
        }

       

        public async Task<IEnumerable<Milestone>> GetMilestonesByProjectIdAsync(int projectId)
        {
            return await _context.Milestones.Where(m => m.ProjectId == projectId).ToListAsync();
        }

        public async Task<MilestoneReadDto> UpdateMilestoneAsync(int id, UpdateMilestoneDto dto)
        {
            var existingMilestone = await _context.Milestones.FindAsync(id);
            if (existingMilestone == null)
            {
                return null;
            }

            _mapper.Map(dto, existingMilestone);

            existingMilestone.MilestoneName = dto.MilestoneName;
            existingMilestone.Description = dto.Description;
            existingMilestone.AssignedMemberId = dto.AssignedMemberId;
            existingMilestone.DueDate = System.DateTime.UtcNow;
            existingMilestone.Weight = dto.Weight;
            existingMilestone.UpdatedAt = System.DateTime.UtcNow;
            existingMilestone.Progress = dto.Progress;

            await _context.SaveChangesAsync();
            return _mapper.Map<MilestoneReadDto>(existingMilestone);
        }

    }
}

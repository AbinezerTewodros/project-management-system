namespace ProjectManagementSystem1.Services
{
    public class UserSkillService : IUserSkillService
    {
        private readonly AppDbContext _context;

        public UserSkillService(AppDbContext context)
        {
            _context = context;
        }

        public async Task AddSkillToUserAsync(string userId, int skillId)
        {
            // Check if skill exists
            var skill = await _context.Skills.FindAsync(skillId);
            if (skill == null)
                throw new ArgumentException("Skill not found");

            // Prevent duplicate assignment
            bool alreadyExists = await _context.UserSkills
                .AnyAsync(us => us.UserId == userId && us.SkillId == skillId);

            if (alreadyExists)
                return; // or throw new InvalidOperationException("Skill already assigned");

            var userSkill = new UserSkill
            {
                UserId = userId,
                SkillId = skillId,
                AssignedAt = DateTime.UtcNow
            };

            _context.UserSkills.Add(userSkill);
            await _context.SaveChangesAsync();
        }
    }
}
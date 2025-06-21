namespace ProjectManagementSystem1.Model.Entities;

public class Skill
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public bool IsApproved { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<UserSkill> UserSkills { get; set; } = new List<UserSkill>();
}

public class UserSkill
{
    public int UserId { get; set; }
    public AppUser User { get; set; } = null!;
    public int SkillId { get; set; }
    public Skill Skill { get; set; } = null!;

    public DateTime AddedAt { get; set; } = DateTime.UtcNow;
}

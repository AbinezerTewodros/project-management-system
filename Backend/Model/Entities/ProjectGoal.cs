//using System.ComponentModel.DataAnnotations;
//using System.ComponentModel.DataAnnotations.Schema;

//namespace ProjectManagementSystem1.Model.Entities
//{
//    public class ProjectGoal
//    {
//        [Key]
//        public int Id { get; set; }

//        [Required]
//        public int ProjectId { get; set; } // Foreign key to the Project entity (you might already have one)

//        [Required, MaxLength(250)]
//        public string Name { get; set; }

//        public string? Description { get; set; }

//        // You might also want to add a property to indicate the importance or priority of the goal itself
//        public GoalPriority Priority { get; set; } = GoalPriority.Normal;

//        // Navigation property to the Project
//        [ForeignKey("ProjectId")]
//        public Project? Project { get; set; }

//        // You might also want a collection of tasks associated with this goal
//        // public ICollection<ProjectTask> Tasks { get; set; }
//    }

//    public enum GoalPriority
//    {
//        Low,
//        Normal,
//        High,
//        Critical
//    }
//}
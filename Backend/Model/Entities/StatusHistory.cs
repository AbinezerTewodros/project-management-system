namespace ProjectManagementSystem1.Model.Entities
{
    public class StatusHistory
    {
        public int Id { get; set; }
        public int EntityId { get; set; }
        public string EntityType { get; set; } // "ProjectTask" or "TodoItem"
        public TaskStatus FromStatus { get; set; }
        public TaskStatus ToStatus { get; set; }
        public DateTime ChangedAt { get; set; }
        public string ChangedById { get; set; }
    }
}

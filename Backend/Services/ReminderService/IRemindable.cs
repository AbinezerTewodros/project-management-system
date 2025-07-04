using System;

namespace ProjectManagementSystem1.Model.Interfaces
{
    public interface IRemindable
    {
        public int Id { get; }
        public DateTime? DueDate { get; set; }
        public string RecipientUserId { get; }
        public string Title { get; }
        public string ReminderSubjectTemplate { get; }
        public string ReminderMessageTemplate { get; }
        public string EntityType { get; }
    }
}
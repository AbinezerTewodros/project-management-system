using System;
using System.Collections.Generic;

namespace ProjectManagementSystem1.Configuration
{
    public class ReminderEntityConfiguration
    {
        public string EntityType { get; set; }
        public List<int> ReminderTimesInDaysBefore { get; set; }
        public string DueDatePropertyName { get; set; }
        public string RecipientPropertyName { get; set; }
        public string SubjectTemplate { get; set; }
        public string MessageTemplate { get; set; }
        public string StatusPropertyName { get; set; } // Add this
        public List<string> ExcludedStatuses { get; set; } // Add this
    }
}

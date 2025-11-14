using System.ComponentModel.DataAnnotations;

namespace ProjectManagementSystem1.Model.Exceptions
{
    public class ValidationException : Exception
    {
        public List<ValidationResult> ValidationErrors { get; }

        public ValidationException(string message) : base(message)
        {
            ValidationErrors = new List<ValidationResult>();
        }

        public ValidationException(string message, List<ValidationResult> validationErrors) : base(message)
        {
            ValidationErrors = validationErrors ?? new List<ValidationResult>();
        }
    }

    public class NotFoundException : Exception
    {
        public string EntityName { get; }
        public object EntityId { get; }

        public NotFoundException(string entityName, object entityId) 
            : base($"{entityName} with ID {entityId} was not found.")
        {
            EntityName = entityName;
            EntityId = entityId;
        }

        public NotFoundException(string message) : base(message)
        {
        }
    }

    public class UnauthorizedAccessException : Exception
    {
        public UnauthorizedAccessException(string message) : base(message)
        {
        }

        public UnauthorizedAccessException() : base("Access denied. You don't have permission to perform this action.")
        {
        }
    }

    public class BusinessRuleException : Exception
    {
        public string RuleName { get; }

        public BusinessRuleException(string ruleName, string message) : base(message)
        {
            RuleName = ruleName;
        }
    }

    public class ConcurrencyException : Exception
    {
        public ConcurrencyException(string message) : base(message)
        {
        }

        public ConcurrencyException() : base("The data has been modified by another user. Please refresh and try again.")
        {
        }
    }
}


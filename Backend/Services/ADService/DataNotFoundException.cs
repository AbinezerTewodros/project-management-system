
namespace ProjectManagementSystem1.Services.ADService
{
    [Serializable]
    internal class DataNotFoundException : Exception
    {
        public DataNotFoundException()
        {
        }

        public DataNotFoundException(string? message) : base(message)
        {
        }

        public DataNotFoundException(string? message, Exception? innerException) : base(message, innerException)
        {
        }
    }
}
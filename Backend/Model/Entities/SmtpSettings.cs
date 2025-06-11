namespace ProjectManagementSystem1.Model.Entities
{
    public class SmtpSettings
    {
        public string Host { get; set; }
        public string Port { get; set; }
        public string Username { get; set; }
        public string Password { get; set; }
        public string SenderEmail { get; set; }
        public bool UseSsl { get; set; }
    }
}

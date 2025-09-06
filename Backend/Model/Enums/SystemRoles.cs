namespace ProjectManagementSystem1.Model.Enums
{
    public static class SystemRoles
    {
        public const string Admin = "Admin";
        public const string President = "President";
        public const string VicePresident = "Vice-President"; // keep seeded naming
        public const string Director = "Director";
        public const string Manager = "Manager";
        public const string Supervisor = "Supervisor";
        public const string Member = "Member";

        public static readonly IReadOnlyDictionary<string, int> RoleRank = new Dictionary<string, int>
        {
            { Admin, 99 },
            { President, 6 },
            { VicePresident, 5 },
            { Director, 4 },
            { Manager, 3 },
            { Supervisor, 2 },
            { Member, 1 }
        };
    }
} 
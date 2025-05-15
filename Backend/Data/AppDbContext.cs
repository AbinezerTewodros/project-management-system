using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using ProjectManagementSystem1.Model.Entities;

namespace ProjectManagementSystem1.Data
{
    public class AppDbContext : IdentityDbContext<ApplicationUser>
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
        public DbSet<UserAccessToken> UserAccessTokens { get; set; }
        public DbSet<RefreshToken> RefreshTokens { get; set; }
        public DbSet<Project> Projects { get; set; }

        modelBuilder.Entity<ProjectTask>()
        .Property(p => p.Version)
        .IsRowVersion();


        // If you have other tables like RefreshTokens:
        //public DbSet<RefreshToken> RefreshTokens { get; set; }
    }
}

// old code

//using Microsoft.EntityFrameworkCore;
//using ProjectManagementSystem1.Model.Entities;

//namespace ProjectManagementSystem1.Data
//{
//    public class AppDbContext : IdentityDbContext<ApplicationUser>
//    {
//        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

//        public DbSet<User> Users { get; set; }
//        public DbSet<RefreshToken> RefreshTokens { get; set; }

//    }
//}

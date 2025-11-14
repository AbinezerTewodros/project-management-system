using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using ProjectManagementSystem1.Model.Entities;

namespace ProjectManagementSystem1.Data.Seeders
{
    public static class RoleSeeder
    {
        private static readonly string[] Roles = new[] { "Admin", "Manager", "Supervisor", "Member", "Director", "President", "Vice-President" };

        public static async Task SeedRolesAsync(IServiceProvider serviceProvider)
        {
            var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();

            foreach (var role in Roles)
            {
                if (!await roleManager.RoleExistsAsync(role))
                {
                    await roleManager.CreateAsync(new IdentityRole(role));
                }
            }
        }
    }
}

using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using ProjectManagementSystem1.Model.Entities;

namespace ProjectManagementSystem1.Data.Seeders
{
    public static class AdminSeeder
    {
        public static async Task SeedAdminAsync(IServiceProvider serviceProvider)
        {
            var userManager = serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();

            // First Admin User Details
            string adminEmail = "admin@cbe.com";
            string adminUsername = "admin";
            string adminPassword = "Admin@1234";

            // Check if admin exists
            if (await userManager.FindByEmailAsync(adminEmail) == null)
            {
                var admin = new ApplicationUser
                {
                    FullName = "System Administrator",
                    UserName = adminUsername,
                    Email = adminEmail,
                    PhoneNumber = "0912345678",
                    Department = "IT",
                    Title = "Administrator",
                    Company = "CBE",
                    EmployeeId = "123456",
                    Status = "Active",
                    IsFirstLogin = false
                };

                var createAdmin = await userManager.CreateAsync(admin, adminPassword);

                if (createAdmin.Succeeded)
                {
                    await userManager.AddToRoleAsync(admin, "Admin");
                }
            }
        }
    }
}

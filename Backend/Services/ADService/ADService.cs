using ProjectManagementSystem1.Model;
using ProjectManagementSystem1.Model.Dto.ADDto;
using ProjectManagementSystem1.Model.Dto.UserManagementDto;
using ProjectManagementSystem1.Model.Entities;
using System.DirectoryServices;
using System.Reflection.PortableExecutable;
using System.Text.Json;

namespace ProjectManagementSystem1.Services.ADService
{
    public class ADService : IADService
    {
        private readonly string _ldapPath;
        private readonly string _ldapUser;
        private readonly string _ldapPassword;
        private readonly IADAuthService _adAuthService;

        public ADService(IConfiguration configuration, IADAuthService adAuthService)
        {
            _ldapPath = configuration["AD:LdapPath"]!;
            _ldapUser = configuration["AD:Username"]!;
            _ldapPassword = configuration["AD:Password"]!;
            _adAuthService = adAuthService;
        }

        public async Task<List<string>> GetAllUsersAsync()
        {
            var users = new List<string>();

            return await Task.Run(() =>
            {
                using (var entry = new System.DirectoryServices.DirectoryEntry(_ldapPath, _ldapUser, _ldapPassword))
                {
                    using (var searcher = new DirectorySearcher(entry))
                    {
                        searcher.Filter = "(objectClass=user)";
                        searcher.PropertiesToLoad.Add("sAMAccountName");

                        foreach (SearchResult result in searcher.FindAll())
                        {
                            if (result.Properties["sAMAccountName"].Count > 0)
                                users.Add(result.Properties["sAMAccountName"][0].ToString()!);
                        }
                    }
                }

                return users;
            });
        }

        public async Task<ADUser?> GetUserAsync(string input)
        {
            return await Task.Run(() =>
            {
                try
                {
                    using (var entry = new System.DirectoryServices.DirectoryEntry(_ldapPath, _ldapUser, _ldapPassword))
                    {
                        using (var searcher = new DirectorySearcher(entry))
                        {
                            searcher.Filter = $"(|(sAMAccountName={input})(mail={input}))";
                            searcher.PropertiesToLoad.Add("displayName");
                            searcher.PropertiesToLoad.Add("mail");
                            searcher.PropertiesToLoad.Add("sAMAccountName");
                            searcher.PropertiesToLoad.Add("department");
                            searcher.PropertiesToLoad.Add("description");
                            searcher.PropertiesToLoad.Add("telephoneNumber");
                            var result = searcher.FindOne();
                            if (result == null) return null;

                            return new ADUser
                            {
                                FullName = result.Properties["displayName"]?.Count > 0 ? result.Properties["displayName"][0].ToString() : "",
                                Email = result.Properties["mail"]?.Count > 0 ? result.Properties["mail"][0].ToString() : "",
                                Username = result.Properties["sAMAccountName"]?.Count > 0 ? result.Properties["sAMAccountName"][0].ToString() : "",
                                Department = result.Properties["department"]?.Count > 0 ? result.Properties["department"][0].ToString() : "",
                                Role = result.Properties["description"]?.Count > 0 ? result.Properties["description"][0].ToString() : ""
                            };
                        }
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine("AD lookup failed: " + ex.Message);
                    return null;
                }
            });
        }


        public async Task<ADUserDto?> GetUserByEmployeeIdAsync(string employeeId)
        {
            return await Task.Run(() =>
            {
                try
                {
                    using (var entry = new System.DirectoryServices.DirectoryEntry("LDAP://cbetest.local", "cbetest\\Administrator", "Admin1234"))
                    {
                        using (var searcher = new DirectorySearcher(entry))
                        {
                            searcher.Filter = $"(&(objectClass=user)(description=*{employeeId}*))"; // Search inside description
                            searcher.PropertiesToLoad.Add("displayName");
                            searcher.PropertiesToLoad.Add("telephoneNumber");
                            searcher.PropertiesToLoad.Add("mail");
                            searcher.PropertiesToLoad.Add("department");
                            searcher.PropertiesToLoad.Add("title");
                            searcher.PropertiesToLoad.Add("company");
                            searcher.PropertiesToLoad.Add("description");

                            var result = searcher.FindOne();
                            if (result == null) return null;

                            var props = result.Properties;

                            // Description contains: { "EmployeeId": "EMP001", "Username": "jdoe" }
                            var descriptionJson = props["description"]?[0]?.ToString();
                            var extraData = !string.IsNullOrEmpty(descriptionJson)
                                ? JsonSerializer.Deserialize<Dictionary<string, string>>(descriptionJson)
                                : new Dictionary<string, string>();

                            return new ADUserDto
                            {
                                FullName = props["displayName"]?[0]?.ToString() ?? "",
                                PhoneNumber = props["telephoneNumber"]?[0]?.ToString() ?? "",
                                Email = props["mail"]?[0]?.ToString() ?? "",
                                Department = props["department"]?[0]?.ToString() ?? "",
                                Title = props["title"]?[0]?.ToString() ?? "",
                                Company = props["company"]?[0]?.ToString() ?? "",
                                Username = extraData.TryGetValue("Username", out var uname) ? uname : "",
                                EmployeeId = extraData.TryGetValue("EmployeeId", out var eid) ? eid : employeeId
                            };
                        }
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine("AD lookup by employee ID failed: " + ex.Message);
                    return null;
                }
            });
        }

        public async Task<EmployeeADDto> GetEmployeeByDn(string dn)
        {
            return await Task.Run(() =>
            {
                try
                {
                    using (var entry = new System.DirectoryServices.DirectoryEntry(_ldapPath, _ldapUser, _ldapPassword))
                    {
                        using (var searcher = new DirectorySearcher(entry))
                        {
                            searcher.Filter = $"(distinguishedName={dn})";
                            searcher.PropertiesToLoad.AddRange(new[] { "employeeID", "mail", "displayName", "department", "title", "company", "manager" });
                            var result = searcher.FindOne();
                            if (result == null) return null;

                            return new EmployeeADDto
                            {
                                EmpId = result.Properties["employeeID"]?.Count > 0 ? result.Properties["employeeID"][0]?.ToString() : null,
                                Email = result.Properties["mail"]?.Count > 0 ? result.Properties["mail"][0]?.ToString() : null,
                                Name = result.Properties["displayName"]?.Count > 0 ? result.Properties["displayName"][0]?.ToString() : null,
                                Department = result.Properties["department"]?.Count > 0 ? result.Properties["department"][0]?.ToString() : null,
                                Title = result.Properties["title"]?.Count > 0 ? result.Properties["title"][0]?.ToString() : null,
                                Company = result.Properties["company"]?.Count > 0 ? result.Properties["company"][0]?.ToString() : null,
                                Manager = result.Properties["manager"]?.Count > 0 ? result.Properties["manager"][0]?.ToString() : null
                            };
                        }
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine("AD lookup by DN failed: " + ex.Message);
                    return null;
                }
            });
        }

        public async Task<List<EmployeeADDto>> GetUsersByOrganizationalUnitsAsync(List<string> organizationalUnits)
        {
            return await _adAuthService.GetUsersByOrganizationalUnitsAsync(organizationalUnits);
        }
    }
}
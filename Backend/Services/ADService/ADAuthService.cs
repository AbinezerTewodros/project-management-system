using ProjectManagementSystem1.Model.Dto.ADDto;
using System.DirectoryServices;
using System.DirectoryServices.AccountManagement;
using System.Text.RegularExpressions;

namespace ProjectManagementSystem1.Services.ADService
{
    public class ADAuthService : IADAuthService
    {
        private readonly string? _domainPath;
        private readonly string? _serviceAccount;
        private readonly string? _servicePassword;

        public ADAuthService(IConfiguration configuration)
        {
            _domainPath = configuration["Ldap:Path"];
            _serviceAccount = configuration["Ldap:ServiceAccount"];
            _servicePassword = configuration["Ldap:ServicePassword"];
        }
#pragma warning disable CA1416
        public bool Authenticate(string username, string password)
        {
            string SAMAccountName = GetSamAccountName(username);
            using var context = CreatePrincipalContext();
            return context.ValidateCredentials(SAMAccountName, password);
        }

        // public EmployeeADDto GetEmployee(string EmpId)
        // {
        //     var samAccountName = GetSamAccountName(EmpId);
        //     try
        //     {
        //         using var directoryEntry = CreateDirectoryEntry();
        //         using var searcher = new DirectorySearcher(directoryEntry)
        //         {
        //             SearchScope = SearchScope.Subtree,
        //             Filter = $"(&(objectClass=user)(sAMAccountName={samAccountName}))",
        //             PageSize = 1000
        //         };

        //         AddPropertiesToLoad(searcher);

        //         var result = searcher.FindOne();
        //         return result != null ? CreateEmployeeADDto(result) :throw new DataNotFoundException("Employee with id is not found");
        //     }
        //     catch (DirectoryServicesCOMException ex)
        //     {
        //         throw new Exception("LDAP communication error", ex);
        //     }
        // }
        public EmployeeADDto GetEmployee(string EmpId)
        {
            // Validate the EmpId
            if (!IsValidEmpId(EmpId))
            {
                throw new ArgumentException("Invalid employee ID format.");
            }

            var samAccountName = GetSamAccountName(EmpId);
            var encodedSamAccountName = LdapFilterEncode(samAccountName);

            try
            {
                using var directoryEntry = CreateDirectoryEntry();
                using var searcher = new DirectorySearcher(directoryEntry)
                {
                    SearchScope = SearchScope.Subtree,
                    Filter = $"(&(objectClass=user)(sAMAccountName={encodedSamAccountName}))",
                    PageSize = 1000
                };

                AddPropertiesToLoad(searcher);

                var result = searcher.FindOne();
                return result != null ? CreateEmployeeADDto(result) : throw new DataNotFoundException("Employee with id is not found");
            }
            catch (DirectoryServicesCOMException ex)
            {
                throw new Exception("LDAP communication error", ex);
            }
        }

        public EmployeeADDto GetEmployeeByDn(string dn)
        {
            if (string.IsNullOrWhiteSpace(dn))
            {
                throw new ArgumentException("Distinguished name cannot be null or empty.");
            }

            var encodedDn = LdapFilterEncode(dn);

            try
            {
                using var directoryEntry = CreateDirectoryEntry();
                using var searcher = new DirectorySearcher(directoryEntry)
                {
                    SearchScope = SearchScope.Subtree,
                    Filter = $"(distinguishedName={encodedDn})",
                    PageSize = 1000
                };

                AddPropertiesToLoad(searcher);

                var result = searcher.FindOne();
                return result != null ? CreateEmployeeADDto(result) : throw new DataNotFoundException("Employee with distinguished name is not found");
            }
            catch (DirectoryServicesCOMException ex)
            {
                throw new Exception("LDAP communication error", ex);
            }
        }

        public async Task<List<EmployeeADDto>> GetUsersByOrganizationalUnitsAsync(List<string> organizationalUnits)
        {
            var list = new List<EmployeeADDto>();
            if (organizationalUnits == null || organizationalUnits.Count == 0) return list;

            try
            {
                using var directoryEntry = CreateDirectoryEntry();
                using var searcher = new DirectorySearcher(directoryEntry)
                {
                    SearchScope = SearchScope.Subtree,
                    PageSize = 1000
                };

                AddPropertiesToLoad(searcher);

                // Build filter: user objects whose distinguishedName contains any OU segment provided
                // Example OU parts: "Application Management", "Information System"
                var ouFilters = organizationalUnits
                    .Where(s => !string.IsNullOrWhiteSpace(s))
                    .Select(s => s.Trim())
                    .Select(s => $"(distinguishedName=*OU={LdapFilterEncode(s)}*)");

                var filter = $"(&(objectClass=user)(|{string.Join(string.Empty, ouFilters)}))";
                searcher.Filter = filter;

                foreach (SearchResult result in searcher.FindAll())
                {
                    list.Add(CreateEmployeeADDto(result));
                }
            }
            catch (DirectoryServicesCOMException ex)
            {
                throw new Exception("LDAP communication error", ex);
            }

            return await Task.FromResult(list);
        }
        private bool IsValidEmpId(string empId)
        {
            var regex = new Regex("^[a-zA-Z0-9]+$");
            return regex.IsMatch(empId);
        }

        private string LdapFilterEncode(string input)
        {
            if (string.IsNullOrEmpty(input)) return input;

            return input.Replace("(", "\\28") // Escape '('
                        .Replace(")", "\\29") // Escape ')'
                        .Replace("*", "\\2a") // Escape '*'
                        .Replace("\\", "\\5c"); // Escape '\'
        }
        private string GetSamAccountName(string username)
        {
            using var directoryEntry = CreateDirectoryEntry();
            using var searcher = new DirectorySearcher(directoryEntry)
            {
                Filter = $"(&(|(sAMAccountName={username})(mail={username})(employeeID={username})))"
            };

            var searchResult = searcher.FindOne();
            return searchResult?.GetDirectoryEntry()
                .Properties["sAMAccountName"]?.Value?.ToString() ?? username;
        }
        private PrincipalContext CreatePrincipalContext()
        {
            return new PrincipalContext(
                ContextType.Domain,
                "10.1.11.13");
        }
        private DirectoryEntry CreateDirectoryEntry()
        {
            return new DirectoryEntry(
                  _domainPath,
                _serviceAccount,
                _servicePassword);
        }
        private void AddPropertiesToLoad(DirectorySearcher searcher)
        {
            string[] properties =
            {
                "sAMAccountName", "mail", "employeeID", "displayname",
                "company", "department", "title", "manager"
            };

            foreach (var prop in properties)
            {
                searcher.PropertiesToLoad.Add(prop);
            }
        }
        private string GetPropertyValue(SearchResult result, string propertyName)
        {
            return result?.Properties[propertyName]?.Count > 0 ? result.Properties[propertyName][0]?.ToString() ?? string.Empty : string.Empty;
        }
//#pragma warning restore CA1416
        private EmployeeADDto CreateEmployeeADDto(SearchResult result)
        {
            return new EmployeeADDto
            {
                Email = GetPropertyValue(result, "mail"),
                EmpId = GetPropertyValue(result, "employeeID"),
                Name = GetPropertyValue(result, "displayname"),
                Company = GetPropertyValue(result, "company"),
                Title = GetPropertyValue(result, "title"),
                Department = GetPropertyValue(result, "department"),
                Manager = GetPropertyValue(result, "manager")
            };
        }


    }
}
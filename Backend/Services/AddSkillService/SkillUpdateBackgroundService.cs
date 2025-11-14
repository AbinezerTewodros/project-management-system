using ProjectManagementSystem1.Data.Seeders;

namespace ProjectManagementSystem1.Services.AddSkillService
{
    public class SkillUpdateBackgroundService : BackgroundService
    {
        private readonly IServiceProvider _services;
        private readonly ILogger<SkillUpdateBackgroundService> _logger;
        private readonly TimeSpan _updateInterval = TimeSpan.FromDays(7);

        public SkillUpdateBackgroundService(
            IServiceProvider services,
            ILogger<SkillUpdateBackgroundService> logger)
        {
            _services = services;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _services.CreateScope();
                    var seeder = scope.ServiceProvider.GetRequiredService<SkillDataSeeder>();
                    await seeder.SeedAsync();

                    _logger.LogInformation("Skill database updated at {time}", DateTime.UtcNow);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error updating skill database");
                }

                await Task.Delay(_updateInterval, stoppingToken);
            }
        }
    }
}

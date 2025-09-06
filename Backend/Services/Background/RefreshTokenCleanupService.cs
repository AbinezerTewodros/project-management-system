namespace ProjectManagementSystem1.Services.Background
{
    using Microsoft.Extensions.DependencyInjection;
    using Microsoft.Extensions.Hosting;
    using Microsoft.Extensions.Logging;
    using ProjectManagementSystem1.Data;
    using System;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    public class RefreshTokenCleanupService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<RefreshTokenCleanupService> _logger;

        public RefreshTokenCleanupService(IServiceProvider serviceProvider, ILogger<RefreshTokenCleanupService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                using (var scope = _serviceProvider.CreateScope())
                {
                    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                    var cutoff = DateTime.UtcNow.AddDays(-7);

                    var oldTokens = context.RefreshTokens
                        .Where(t => t.Expires < cutoff || (t.IsUsed && t.IsRevoked))
                        .ToList();

                    if (oldTokens.Any())
                    {
                        context.RefreshTokens.RemoveRange(oldTokens);
                        await context.SaveChangesAsync();
                        _logger.LogInformation($"[Token Cleanup] Deleted {oldTokens.Count} old refresh tokens.");
                    }
                }

                await Task.Delay(TimeSpan.FromMinutes(15), stoppingToken);
            }
        }

    }
}

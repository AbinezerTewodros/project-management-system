using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Entities;
using ProjectManagementSystem1.Services.EscalationService;
using Microsoft.EntityFrameworkCore;

namespace ProjectManagementSystem1.Services.Background
{
    public class EscalationBackgroundService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<EscalationBackgroundService> _logger;

        public EscalationBackgroundService(IServiceProvider serviceProvider, ILogger<EscalationBackgroundService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Escalation Background Service started.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using (var scope = _serviceProvider.CreateScope())
                    {
                        var escalationService = scope.ServiceProvider.GetRequiredService<IEscalationService>();
                        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                        // Find escalations that are past their response time limit 
                        var dueEscalations = await context.Escalations
                            .Where(e => e.ResponseTimeLimit <= DateTime.UtcNow &&
                                        e.Status == EscalationStatus.Active) // Only process Active escalations
                            .Select(e => e.Id)
                            .ToListAsync(stoppingToken);

                        _logger.LogInformation("Found {Count} escalations due for escalation check", dueEscalations.Count);

                        foreach (var escalationId in dueEscalations)
                        {
                            try
                            {
                                await escalationService.EscalateToManagerAsync(escalationId);
                            }
                            catch (Exception ex)
                            {
                                _logger.LogError(ex, "Error processing escalation {EscalationId} in background service", escalationId);
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error in escalation background service execution cycle");
                }

                // Wait for 1 hour before next check
                await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
            }

            _logger.LogInformation("Escalation Background Service stopped.");
        }
    }
}
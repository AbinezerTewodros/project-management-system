using Hangfire;

namespace ProjectManagementSystem1.Services
{
    public class HangfireActivator : JobActivator
    {
        private readonly IServiceProvider _serviceProvider;
        public HangfireActivator(IServiceProvider serviceProvider) => _serviceProvider = serviceProvider;
        public override object ActivateJob(Type jobType) => _serviceProvider.GetService(jobType);
    }
}

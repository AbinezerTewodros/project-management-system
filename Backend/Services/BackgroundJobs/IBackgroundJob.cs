namespace ProjectManagementSystem1.Services.BackgroundJobs
{
    /// <summary>
    /// Interface for background job implementations.
    /// </summary>
    public interface IBackgroundJob
    {
        /// <summary>
        /// 
        /// 
        /// 
        /// Executes the background job.
        /// </summary>
        /// <param name="jobData">Data passed to the job</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Task representing the job execution</returns>
        Task ExecuteAsync(object jobData, CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets the job name for logging and monitoring.
        /// </summary>
        /// <returns>Job name</returns>
        string GetJobName();

        /// <summary>
        /// Gets the job description for logging and monitoring.
        /// </summary>
        /// <param name="jobData">Data passed to the job</param>
        /// <returns>Job description</returns>
        string GetJobDescription(object jobData);

        /// <summary>
        /// Validates the job data before execution.
        /// </summary>
        /// <param name="jobData">Data to validate</param>
        /// <returns>True if data is valid, false otherwise</returns>
        bool ValidateJobData(object jobData);

        /// <summary>
        /// Gets the maximum retry attempts for this job type.
        /// </summary>
        /// <returns>Maximum retry attempts</returns>
        int GetMaxRetryAttempts();

        /// <summary>
        /// Gets the retry delay for this job type.
        /// </summary>
        /// <returns>Retry delay</returns>
        TimeSpan GetRetryDelay();

        /// <summary>
        /// Gets the job timeout for this job type.
        /// </summary>
        /// <returns>Job timeout</returns>
        TimeSpan GetJobTimeout();
    }
}


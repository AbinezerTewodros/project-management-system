using Microsoft.EntityFrameworkCore;
using ProjectManagementSystem1.Model.Dto.Common;
using System.Linq.Dynamic.Core;

namespace ProjectManagementSystem1.Services.Common
{
    public interface IPaginationService
    {
        Task<PaginatedResponseDto<T>> GetPaginatedResultAsync<T>(
            IQueryable<T> query,
            PaginationDto paginationDto) where T : class;
    }

    public class PaginationService : IPaginationService
    {
        public async Task<PaginatedResponseDto<T>> GetPaginatedResultAsync<T>(
            IQueryable<T> query,
            PaginationDto paginationDto) where T : class
        {
            // Validate and set defaults
            paginationDto.ValidateAndSetDefaults();

            // Apply search if provided
            if (!string.IsNullOrWhiteSpace(paginationDto.SearchTerm))
            {
                query = ApplySearch(query, paginationDto.SearchTerm);
            }

            // Get total count before pagination
            var totalCount = await query.CountAsync();

            // Apply sorting if provided
            if (!string.IsNullOrWhiteSpace(paginationDto.SortBy))
            {
                query = ApplySorting(query, paginationDto.SortBy, paginationDto.SortDescending);
            }

            // Apply pagination
            var items = await query
                .Skip((paginationDto.PageNumber - 1) * paginationDto.PageSize)
                .Take(paginationDto.PageSize)
                .ToListAsync();

            return new PaginatedResponseDto<T>(items, totalCount, paginationDto.PageNumber, paginationDto.PageSize);
        }

        private IQueryable<T> ApplySearch<T>(IQueryable<T> query, string searchTerm) where T : class
        {
            // Get all string properties of the entity
            var stringProperties = typeof(T).GetProperties()
                .Where(p => p.PropertyType == typeof(string) && p.CanRead)
                .Select(p => p.Name)
                .ToList();

            if (!stringProperties.Any())
                return query;

            // Build dynamic search expression
            var searchExpressions = stringProperties
                .Select(prop => $"{prop}.Contains(\"{searchTerm}\")")
                .ToList();

            var combinedExpression = string.Join(" || ", searchExpressions);
            
            try
            {
                return query.Where(combinedExpression);
            }
            catch
            {
                // If dynamic expression fails, return original query
                return query;
            }
        }

        private IQueryable<T> ApplySorting<T>(IQueryable<T> query, string sortBy, bool sortDescending) where T : class
        {
            // Check if the property exists
            var property = typeof(T).GetProperty(sortBy);
            if (property == null)
                return query;

            var sortExpression = sortDescending ? $"{sortBy} DESC" : sortBy;
            
            try
            {
                return query.OrderBy(sortExpression);
            }
            catch
            {
                // If sorting fails, return original query
                return query;
            }
        }
    }
}
